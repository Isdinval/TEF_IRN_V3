"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Loader2, Volume2, MessageSquare, Sparkles } from "lucide-react";

export default function OralCoach() {
  const [status, setStatus] = useState<"idle" | "connecting" | "active">("idle");
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startSession = async () => {
    try {
      setStatus("connecting");

      // 1. Get ephemeral token from our API
      const tokenResponse = await fetch("/api/oral/session");
      const data = await tokenResponse.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const EPHEMERAL_KEY = data.client_secret?.value;
      if (!EPHEMERAL_KEY) {
        throw new Error("Clé éphémère manquante dans la réponse OpenAI.");
      }

      // 2. Create Peer Connection
      const pc = new RTCPeerConnection();
      peerConnection.current = pc;

      // 3. Set up audio playback
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioRef.current = audioEl;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      // 4. Add local microphone track
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(ms.getTracks()[0]);

      // 5. Set up data channel for events (transcription, etc)
      const dc = pc.createDataChannel("oai-events");
      dataChannel.current = dc;
      dc.onmessage = (e) => {
        const event = JSON.parse(e.data);
        // Handle transcription events
        if (event.type === "conversation.item.input_audio_transcription.completed") {
          setTranscription(prev => prev + " " + event.transcript);
        }
        if (event.type === "response.audio_transcript.delta") {
          setAiResponse(prev => prev + event.delta);
        }
        if (event.type === "response.audio_transcript.done") {
           // Response finished
        }
      };

      // 6. Create and set local description (offer)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 7. Connect to OpenAI Realtime WebRTC
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-10-01";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
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
    } catch (err) {
      console.error("Session start error:", err);
      setStatus("idle");
      alert("Erreur lors de la connexion au micro. Vérifiez les autorisations.");
    }
  };

  const stopSession = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setStatus("idle");
    setIsListening(false);
    setTranscription("");
    setAiResponse("");
  };

  const toggleMic = () => {
    if (peerConnection.current) {
      const senders = peerConnection.current.getSenders();
      const audioTrack = senders.find(s => s.track?.kind === 'audio')?.track;
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsListening(audioTrack.enabled);
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 selection:bg-indigo-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 p-6 pt-10 lg:p-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-4 rounded-full border-none bg-indigo-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
              IA Realtime
            </Badge>
            <h1 className="mb-4 text-5xl font-black tracking-tighter text-zinc-900">
              COACH D'EXPRESSION <span className="text-indigo-600">ORALE</span>
            </h1>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-zinc-500">
              Simulation Section A : téléphonez pour poser des questions sur un service, comme le jour du TEF IRN.
            </p>
          </div>
          <Badge variant="outline" className="w-fit rounded-full border-indigo-200 bg-indigo-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600">
            <Sparkles size={14} className="mr-1" /> Session vocale
          </Badge>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-6">
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
                {status === "connecting" ? (
                  <Loader2 className="animate-spin text-white" size={54} />
                ) : (
                  <Mic className="text-white" size={54} />
                )}
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-black tracking-tight text-white">
                  {status === "idle" && "Prêt à parler ?"}
                  {status === "connecting" && "Connexion au Coach..."}
                  {status === "active" && (isListening ? "Le Coach vous écoute..." : "Micro coupé")}
                </h3>
                <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-slate-400">
                  {status === "active"
                    ? "Parlez naturellement, comme lors de l'examen."
                    : "Cliquez sur le bouton ci-dessous pour démarrer la session."}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-4 pt-2">
                {status === "idle" ? (
                  <Button size="lg" className="h-14 rounded-2xl bg-indigo-600 px-8 text-base font-black shadow-xl shadow-indigo-900/30 hover:bg-indigo-700" onClick={startSession}>
                    Démarrer la session
                  </Button>
                ) : (
                  <>
                    <Button size="lg" variant="outline" className="h-14 rounded-2xl border-white/20 bg-white/10 px-8 font-black text-white hover:bg-white/20" onClick={stopSession}>
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
                  </>
                )}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-xl shadow-zinc-200/50">
              <CardHeader className="border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <MessageSquare size={14} className="text-indigo-500" /> Transcription
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[160px] min-h-[120px] overflow-auto p-6 text-sm font-medium leading-relaxed text-zinc-500">
                {transcription || "Votre voix apparaîtra ici après chaque phrase..."}
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-xl shadow-zinc-200/50">
              <CardHeader className="border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <Volume2 size={14} className="text-emerald-500" /> Réponse du Coach
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[160px] min-h-[120px] overflow-auto p-6 text-sm font-bold leading-relaxed text-indigo-900">
                {aiResponse || "Le coach répondra vocalement."}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
