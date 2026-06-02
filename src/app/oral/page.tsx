"use client";

import { useState, useEffect, useRef } from "react";
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
    <div className="flex flex-col gap-8 p-8 max-w-4xl mx-auto h-[calc(100vh-2rem)]">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coach d'Expression Orale</h1>
          <p className="text-muted-foreground italic">Simulation Section A : Téléphoner pour poser des questions sur un service.</p>
        </div>
        <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">
          <Sparkles size={14} className="mr-1" /> IA Realtime
        </Badge>
      </header>

      <div className="flex-1 flex flex-col gap-6 min-h-0">
        <Card className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-slate-950 border-slate-800">
          {status === "active" && isListening && (
            <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-indigo-500 rounded-full animate-bounce"
                  style={{
                    height: `${Math.random() * 60 + 20}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.5 + Math.random()}s`
                  }}
                />
              ))}
            </div>
          )}

          <div className="z-10 flex flex-col items-center gap-6">
            <div className={`
              w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500
              ${status === "active" ? (isListening ? 'bg-indigo-600 shadow-[0_0_40px_rgba(79,70,229,0.5)]' : 'bg-indigo-900') : 'bg-slate-800'}
            `}>
              {status === "connecting" ? (
                <Loader2 className="text-white animate-spin" size={48} />
              ) : (
                <Mic className="text-white" size={48} />
              )}
            </div>

            <div className="text-center">
              <h3 className="text-xl font-semibold text-white">
                {status === "idle" && "Prêt à parler ?"}
                {status === "connecting" && "Connexion au Coach..."}
                {status === "active" && (isListening ? "Le Coach vous écoute..." : "Micro coupé")}
              </h3>
              <p className="text-slate-400 text-sm mt-2">
                {status === "active" ? "Parlez naturellement, comme lors de l'examen." : "Cliquez sur le bouton ci-dessous pour démarrer la session."}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white/50">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={14} className="text-indigo-500" /> Transcription
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm text-muted-foreground min-h-[100px] max-h-[150px] overflow-auto">
              {transcription || "Votre voix apparaîtra ici après chaque phrase..."}
            </CardContent>
          </Card>

          <Card className="bg-white/50">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Volume2 size={14} className="text-green-500" /> Réponse du Coach
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm font-medium min-h-[100px] max-h-[150px] overflow-auto text-indigo-900">
              {aiResponse || "Le coach répondra vocalement."}
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="flex justify-center gap-4">
        {status === "idle" ? (
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 px-8 py-6 rounded-full text-lg font-bold" onClick={startSession}>
            Démarrer la session
          </Button>
        ) : (
          <>
            <Button size="lg" variant="outline" className="rounded-full px-8" onClick={stopSession}>
              Quitter
            </Button>
            <Button
              size="lg"
              className={`${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'} rounded-full px-8 transition-colors`}
              onClick={toggleMic}
            >
              {isListening ? <><MicOff className="mr-2" /> Couper le micro</> : <><Mic className="mr-2" /> Activer le micro</>}
            </Button>
          </>
        )}
      </footer>
    </div>
  );
}
