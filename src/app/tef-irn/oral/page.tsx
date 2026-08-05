"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Loader2, Sparkles, ListChecks } from "lucide-react";
import { ScenarioCatalogue, ScenarioListItem, Section, Level } from "./components/ScenarioCatalogue";
import { OralAnalysisView } from "./components/OralAnalysisView";
import { OralAnalysis, OralTurn } from "@/lib/oral-criteria";
import { useCoachContext } from "@/contexts/CoachContext";

type Status = "catalogue" | "connecting" | "active" | "analyzing" | "done";

type ScenarioInfo = {
  id: string;
  section: Section;
  level: Level;
  title: string;
  role_interlocuteur: string;
  sujet: string;
  objectifs: string[];
};

// Filet de sécurité si le coach n'appelle jamais l'outil de fin d'exercice.
const MAX_SESSION_MS = 4 * 60 * 1000;

export default function OralCoach() {
  const [status, setStatus] = useState<Status>("catalogue");
  const [isListening, setIsListening] = useState(false);
  const [scenario, setScenario] = useState<ScenarioInfo | null>(null);
  const { setPageContext } = useCoachContext();
  const scenarioRef = useRef<ScenarioInfo | null>(null);
  const [analysis, setAnalysis] = useState<OralAnalysis | null>(null);

  const [allScenarios, setAllScenarios] = useState<ScenarioListItem[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [filterSection, setFilterSection] = useState<Section | "all">("all");
  const [filterLevel, setFilterLevel] = useState<Level | "all">("all");

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const turnsRef = useRef<OralTurn[]>([]);
  const currentCoachTurn = useRef<string>("");
  const sessionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Force re-render pour afficher la transcription en cours (turnsRef n'est pas réactif seul)
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!scenario) {
      setPageContext(null);
      return;
    }
    setPageContext({
      type: "oral",
      title: scenario.title,
      sujet: scenario.sujet,
      objectifs: scenario.objectifs,
      level: scenario.level,
    });
    return () => setPageContext(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  useEffect(() => {
    fetch("/api/oral/scenarios")
      .then((r) => r.json())
      .then((data) => {
        if (data.scenarios) setAllScenarios(data.scenarios);
      })
      .catch((err) => console.error("Erreur chargement scénarios:", err))
      .finally(() => setLoadingScenarios(false));
  }, []);

  const startSession = async (scenarioId?: string) => {
    try {
      setStatus("connecting");
      turnsRef.current = [];
      currentCoachTurn.current = "";

      const params = new URLSearchParams();
      if (scenarioId) {
        params.set("scenarioId", scenarioId);
      } else {
        if (filterSection !== "all") params.set("section", filterSection);
        if (filterLevel !== "all") params.set("level", filterLevel);
      }

      const tokenResponse = await fetch(`/api/oral/session?${params.toString()}`);
      const data = await tokenResponse.json();

      if (data.error) throw new Error(data.error);

      const EPHEMERAL_KEY = data.value;
      if (!EPHEMERAL_KEY) throw new Error("Clé éphémère manquante dans la réponse OpenAI.");

      if (data.scenario) {
        setScenario(data.scenario as ScenarioInfo);
        scenarioRef.current = data.scenario as ScenarioInfo;
      }

      const pc = new RTCPeerConnection();
      peerConnection.current = pc;

      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioRef.current = audioEl;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(ms.getTracks()[0]);

      const dc = pc.createDataChannel("oai-events");
      dataChannel.current = dc;

      // TASK 2 : le coach parle en premier dès l'ouverture du canal.
      dc.onopen = () => {
        dc.send(JSON.stringify({ type: "response.create" }));
      };

      dc.onmessage = (e) => {
        const event = JSON.parse(e.data);

        if (event.type === "conversation.item.input_audio_transcription.completed") {
          turnsRef.current = [...turnsRef.current, { role: "candidat", text: event.transcript }];
          forceTick((t) => t + 1);
        }

        if (event.type === "response.output_audio_transcript.delta") {
          currentCoachTurn.current += event.delta;
          forceTick((t) => t + 1);
        }
        if (event.type === "response.output_audio_transcript.done") {
          if (currentCoachTurn.current.trim()) {
            turnsRef.current = [...turnsRef.current, { role: "coach", text: currentCoachTurn.current.trim() }];
          }
          currentCoachTurn.current = "";
          forceTick((t) => t + 1);
        }

        // TASK 3 : le coach décide que l'exercice est terminé.
        // Note : event.name n'est pas fiable sur "response.function_call_arguments.done"
        // (absent/undefined selon les runs, non documenté par OpenAI). L'event
        // "response.output_item.done" avec item.type === "function_call" contient
        // toujours item.name de façon fiable.
        if (
          event.type === "response.output_item.done" &&
          event.item?.type === "function_call" &&
          event.item?.name === "terminer_exercice"
        ) {
          finishSession("ai");
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      setStatus("active");
      setIsListening(true);

      sessionTimeout.current = setTimeout(() => finishSession("timeout"), MAX_SESSION_MS);
    } catch (err) {
      console.error("Session start error:", err);
      setStatus("catalogue");
      alert("Erreur lors de la connexion au micro. Vérifiez les autorisations.");
    }
  };

  // TASK 3 (fermeture) + TASK 4 (déclenchement de l'analyse)
  const finishSession = async (endedBy: "user" | "ai" | "timeout") => {
    if (sessionTimeout.current) clearTimeout(sessionTimeout.current);

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setIsListening(false);

    const transcript = turnsRef.current;
    const currentScenario = scenarioRef.current;

    if (!currentScenario || transcript.length === 0) {
      resetToCatalogue();
      return;
    }

    setStatus("analyzing");

    try {
      const res = await fetch("/api/oral/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, scenario: currentScenario, endedBy }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data as OralAnalysis);
      setStatus("done");
    } catch (err) {
      console.error("Analyze error:", err);
      alert("Erreur lors de l'analyse de la session.");
      resetToCatalogue();
    }
  };

  const resetToCatalogue = () => {
    setStatus("catalogue");
    setScenario(null);
    scenarioRef.current = null;
    setAnalysis(null);
    turnsRef.current = [];
    currentCoachTurn.current = "";
  };

  const toggleMic = () => {
    if (peerConnection.current) {
      const senders = peerConnection.current.getSenders();
      const audioTrack = senders.find((s) => s.track?.kind === "audio")?.track;
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsListening(audioTrack.enabled);
      }
    }
  };

  const liveTranscript: OralTurn[] = [
    ...turnsRef.current,
    ...(currentCoachTurn.current ? [{ role: "coach" as const, text: currentCoachTurn.current }] : []),
  ];

  return (
    <div className="min-h-screen bg-zinc-50/50 selection:bg-indigo-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 p-6 pt-10 lg:p-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-4 rounded-full border-none bg-indigo-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
              {scenario ? `Section ${scenario.section} · ${scenario.level}` : "IA Realtime"}
            </Badge>
            <h1 className="mb-4 text-5xl font-black tracking-tighter text-zinc-900">
              {scenario ? (
                scenario.title
              ) : (
                <>COACH D'EXPRESSION <span className="text-indigo-600">ORALE</span></>
              )}
            </h1>
            {scenario && (
              <p className="mb-4 text-sm font-bold uppercase tracking-wide text-zinc-400">
                Vous parlez avec : <span className="text-zinc-600">{scenario.role_interlocuteur}</span>
              </p>
            )}
            {scenario && (
              <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                Mise en situation
              </div>
            )}
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-zinc-500">
              {scenario
                ? scenario.sujet
                : status === "catalogue"
                ? "Choisissez un exercice dans le catalogue, ou laissez-vous surprendre."
                : "Session en cours."}
            </p>
          </div>
          <Badge variant="outline" className="w-fit rounded-full border-indigo-200 bg-indigo-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600">
            <Sparkles size={14} className="mr-1" /> Session vocale
          </Badge>
        </header>

        {status === "catalogue" && (
          <ScenarioCatalogue
            scenarios={allScenarios}
            loading={loadingScenarios}
            section={filterSection}
            level={filterLevel}
            onSectionChange={setFilterSection}
            onLevelChange={setFilterLevel}
            onSelectScenario={(id) => startSession(id)}
            onSurpriseMe={() => startSession()}
          />
        )}

        {(status === "connecting" || status === "active" || status === "analyzing") && (
          <div className="flex min-h-0 flex-1 flex-col gap-6">
            {scenario && scenario.objectifs?.length > 0 && (
              <Card className="rounded-[2rem] border-none bg-white p-6 shadow-lg shadow-zinc-200/50">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                  <ListChecks size={14} /> Votre mission
                </div>
                <ul className="space-y-2">
                  {scenario.objectifs.map((objectif, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-medium text-zinc-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600" />
                      {objectif}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-[3rem] border-none bg-slate-950 shadow-2xl shadow-indigo-100">
              {status === "active" && isListening && (
                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20">
                  {[...Array(12)].map((_, index) => (
                    <div
                      key={index}
                      className="w-2 animate-bounce rounded-full bg-indigo-500"
                      style={{
                        height: `${Math.random() * 60 + 20}%`,
                        animationDelay: `${index * 0.1}s`,
                        animationDuration: `${0.5 + Math.random()}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="z-10 flex flex-col items-center gap-6 p-10">
                <div
                  className={`flex h-36 w-36 items-center justify-center rounded-full transition-all duration-500 ${
                    status === "active"
                      ? isListening
                        ? "bg-indigo-600 shadow-[0_0_60px_rgba(79,70,229,0.6)]"
                        : "bg-indigo-900"
                      : "bg-slate-800"
                  }`}
                >
                  {status === "connecting" || status === "analyzing" ? (
                    <Loader2 className="animate-spin text-white" size={54} />
                  ) : (
                    <Mic className="text-white" size={54} />
                  )}
                </div>

                <div className="text-center">
                  <h3 className="text-2xl font-black tracking-tight text-white">
                    {status === "connecting" && "Connexion au Coach..."}
                    {status === "active" && (isListening ? "Le Coach vous écoute..." : "Micro coupé")}
                    {status === "analyzing" && "Analyse de votre passage..."}
                  </h3>
                  <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-slate-400">
                    {status === "active"
                      ? "Parlez naturellement, comme lors de l'examen."
                      : status === "analyzing"
                      ? "Le coach évalue votre prestation selon la grille officielle TEF IRN."
                      : "Préparez-vous, le coach va démarrer l'échange."}
                  </p>
                </div>

                {status === "active" && (
                  <div className="flex flex-wrap justify-center gap-4 pt-2">
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-14 rounded-2xl border-white/20 bg-white/10 px-8 font-black text-white hover:bg-white/20"
                      onClick={() => finishSession("user")}
                    >
                      Quitter
                    </Button>
                    <Button
                      size="lg"
                      className={`${isListening ? "bg-rose-500 hover:bg-rose-600" : "bg-indigo-600 hover:bg-indigo-700"} h-14 rounded-2xl px-8 font-black transition-colors`}
                      onClick={toggleMic}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="mr-2" /> Couper le micro
                        </>
                      ) : (
                        <>
                          <Mic className="mr-2" /> Activer le micro
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {status === "active" && liveTranscript.length > 0 && (
              <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-xl shadow-zinc-200/50">
                <div className="flex max-h-[220px] flex-col gap-3 overflow-auto p-6">
                  {liveTranscript.map((t, i) => (
                    <p key={i} className="text-sm leading-relaxed">
                      <span className={`font-black ${t.role === "candidat" ? "text-indigo-600" : "text-zinc-500"}`}>
                        {t.role === "candidat" ? "Vous : " : "Coach : "}
                      </span>
                      <span className="text-zinc-600">{t.text}</span>
                    </p>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {status === "done" && analysis && (
          <OralAnalysisView analysis={analysis} transcript={turnsRef.current} onRestart={resetToCatalogue} />
        )}
      </div>
    </div>
  );
}
