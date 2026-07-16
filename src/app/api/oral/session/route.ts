import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const url = "https://api.openai.com/v1/realtime/client_secrets";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      // Lie le jeton éphémère à cet utilisateur pour le monitoring anti-abus côté OpenAI
      "OpenAI-Safety-Identifier": user.id,
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model: "gpt-realtime",
        instructions:
          "Tu es un examinateur officiel de l'épreuve d'expression orale du TEF IRN (France). Tu simules une interaction orale réaliste avec un candidat, dans le cadre d'une Section A (appel téléphonique pour un service) ou B (échange courant). Ton objectif est de faire parler le candidat de manière fluide et naturelle : il doit parler environ 80% du temps. Pose une seule question ou idée à la fois, en 1 à 2 phrases maximum, sans liste ni explication pédagogique ni correction grammaticale. Privilégie les questions ouvertes et les relances naturelles (\"Pourquoi ?\", \"Pouvez-vous préciser ?\", \"Et vous, qu'en pensez-vous ?\"). Si le candidat est bloqué, reformule ou simplifie la question sans jamais donner le contenu à dire. La conversation doit durer environ 2 à 3 minutes, puis se conclure naturellement par un court remerciement.",
        audio: {
          input: {
            transcription: {
              model: "gpt-realtime-whisper",
            },
          },
          output: {
            voice: "marin",
          },
        },
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("OpenAI Realtime Session Error:", data);
    return NextResponse.json({ error: data.error?.message || "Erreur OpenAI" }, { status: response.status });
  }

  return NextResponse.json(data);
}
