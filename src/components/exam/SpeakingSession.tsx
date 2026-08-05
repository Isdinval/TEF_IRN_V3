'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, PhoneCall } from 'lucide-react';
import { OralAnalysis, OralTurn } from '@/lib/oral-criteria';

type Status = 'idle' | 'connecting' | 'active' | 'analyzing';

interface SpeakingSessionProps {
  scenarioId: string;
  prepTime: number; // minutes
  speakTime: number; // minutes
  onComplete: (analysis: OralAnalysis) => void;
}

type ScenarioInfo = {
  id: string;
  section: 'A' | 'B';
  level: 'A2' | 'B1' | 'B2';
  title: string;
  role_interlocuteur: string;
  sujet: string;
  objectifs: string[];
};

export function SpeakingSession({ scenarioId, speakTime, onComplete }: SpeakingSessionProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [isListening, setIsListening] = useState(false);
  const [scenario, setScenario] = useState<ScenarioInfo | null>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const turnsRef = useRef<OralTurn[]>([]);
  const currentCoachTurn = useRef<string>('');
  const scenarioRef = useRef<ScenarioInfo | null>(null);
  const sessionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, forceTick] = useState(0);

  const startSession = async () => {
    try {
      setStatus('connecting');
      turnsRef.current = [];
      currentCoachTurn.current = '';

      const tokenResponse = await fetch(`/api/oral/session?scenarioId=${scenarioId}`);
      const data = await tokenResponse.json();
      if (data.error) throw new Error(data.error);

      const EPHEMERAL_KEY = data.value;
      if (!EPHEMERAL_KEY) throw new Error('Clé éphémère manquante dans la réponse OpenAI.');

      if (data.scenario) {
        setScenario(data.scenario as ScenarioInfo);
        scenarioRef.current = data.scenario as ScenarioInfo;
      }

      const pc = new RTCPeerConnection();
      peerConnection.current = pc;

      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioRef.current = audioEl;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(ms.getTracks()[0]);

      const dc = pc.createDataChannel('oai-events');

      dc.onopen = () => {
        dc.send(JSON.stringify({ type: 'response.create' }));
      };

      dc.onmessage = (e) => {
        const event = JSON.parse(e.data);

        if (event.type === 'conversation.item.input_audio_transcription.completed') {
          turnsRef.current = [...turnsRef.current, { role: 'candidat', text: event.transcript }];
          forceTick((t) => t + 1);
        }

        if (event.type === 'response.output_audio_transcript.delta') {
          currentCoachTurn.current += event.delta;
          forceTick((t) => t + 1);
        }
        if (event.type === 'response.output_audio_transcript.done') {
          if (currentCoachTurn.current.trim()) {
            turnsRef.current = [...turnsRef.current, { role: 'coach', text: currentCoachTurn.current.trim() }];
          }
          currentCoachTurn.current = '';
          forceTick((t) => t + 1);
        }

        if (
          event.type === 'response.output_item.done' &&
          event.item?.type === 'function_call' &&
          event.item?.name === 'terminer_exercice'
        ) {
          finishSession();
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp',
        },
      });

      const answer: RTCSessionDescriptionInit = {
        type: 'answer',
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      setStatus('active');
      setIsListening(true);

      // Filet de sécurité si le coach n'appelle jamais l'outil de fin d'exercice :
      // temps de parole officiel + marge.
      sessionTimeout.current = setTimeout(() => finishSession(), (speakTime + 2) * 60 * 1000);
    } catch (err) {
      console.error('Speaking session start error:', err);
      setStatus('idle');
      alert("Erreur lors de la connexion au micro. Vérifiez les autorisations.");
    }
  };

  const finishSession = async () => {
    if (sessionTimeout.current) clearTimeout(sessionTimeout.current);
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setIsListening(false);

    const transcript = turnsRef.current;
    const currentScenario = scenarioRef.current;

    if (!currentScenario || transcript.length === 0) {
      setStatus('idle');
      return;
    }

    setStatus('analyzing');

    try {
      const res = await fetch('/api/oral/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, scenario: currentScenario, endedBy: 'user', context: 'exam' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onComplete(data as OralAnalysis);
    } catch (err) {
      console.error('Speaking analyze error:', err);
      alert("Erreur lors de l'analyse de la session.");
      setStatus('idle');
    }
  };

  const toggleMic = () => {
    if (peerConnection.current) {
      const senders = peerConnection.current.getSenders();
      const audioTrack = senders.find((s) => s.track?.kind === 'audio')?.track;
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsListening(audioTrack.enabled);
      }
    }
  };

  const liveTranscript: OralTurn[] = [
    ...turnsRef.current,
    ...(currentCoachTurn.current ? [{ role: 'coach' as const, text: currentCoachTurn.current }] : []),
  ];

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4 py-3 text-center">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
          <PhoneCall size={26} />
        </div>
        <p className="max-w-md text-zinc-500 text-sm font-medium">
          Vous allez échanger en direct, à l'oral, avec le coach IA — exactement comme le jour de l'examen.
          Vérifiez que votre micro est autorisé, puis démarrez.
        </p>
        <Button
          onClick={startSession}
          className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-2xl text-sm font-bold"
        >
          <Mic className="mr-2" size={18} /> Démarrer l'échange
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex flex-col items-center justify-center gap-4 py-5 rounded-2xl bg-zinc-900 overflow-hidden">
        {status === 'active' && isListening && (
          <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-15">
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

        <div className="z-10 flex flex-col items-center gap-3">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full transition-all duration-500 ${
              status === 'active'
                ? isListening
                  ? 'bg-indigo-600 shadow-[0_0_30px_rgba(79,70,229,0.5)]'
                  : 'bg-white/10'
                : 'bg-white/10'
            }`}
          >
            {status === 'connecting' || status === 'analyzing' ? (
              <Loader2 className="animate-spin text-white" size={26} />
            ) : (
              <Mic className="text-white" size={26} />
            )}
          </div>
          <div className="text-center text-white/90 text-xs font-black uppercase tracking-widest">
            {status === 'connecting' && 'Connexion au coach...'}
            {status === 'active' && (isListening ? 'Le coach vous écoute' : 'Micro coupé')}
            {status === 'analyzing' && 'Analyse de votre passage...'}
          </div>
          {scenario && status === 'active' && (
            <p className="text-white/50 text-xs text-center max-w-sm">Vous parlez avec : {scenario.role_interlocuteur}</p>
          )}
        </div>

        {status === 'active' && (
          <div className="z-10 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
              onClick={() => finishSession()}
            >
              Terminer
            </Button>
            <Button
              size="sm"
              className={`h-9 rounded-xl ${isListening ? 'bg-rose-500 hover:bg-rose-600' : 'bg-white/20 hover:bg-white/30'}`}
              onClick={toggleMic}
            >
              {isListening ? <><MicOff className="mr-1.5" size={14} /> Couper</> : <><Mic className="mr-1.5" size={14} /> Réactiver</>}
            </Button>
          </div>
        )}
      </div>

      {status === 'active' && liveTranscript.length > 0 && (
        <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-3 max-h-[110px] overflow-y-auto space-y-1.5">
          {liveTranscript.map((t, i) => (
            <p key={i} className="text-xs leading-relaxed">
              <span className={`font-bold ${t.role === 'candidat' ? 'text-indigo-600' : 'text-zinc-400'}`}>
                {t.role === 'candidat' ? 'Vous : ' : 'Coach : '}
              </span>
              <span className="text-zinc-600">{t.text}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
