import { NextResponse } from "next/server";

export async function GET() {
  const url = "https://api.openai.com/v1/realtime/client_secrets";

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Clé API OpenAI manquante." }, { status: 500 });
  }

  const systemInstructions = `Tu es un examinateur officiel du TEF IRN (France).
Ton rôle est de simuler une conversation orale naturelle avec un candidat.

🎯 Objectif :
Faire parler le candidat de manière fluide et naturelle sur un sujet donné.

📌 Sujet de la conversation :
Simulation Section A : téléphonez pour poser des questions sur un service, comme le jour du TEF IRN.

📌 Niveau du candidat :
A2 à B1

📌 Règles de conversation :
- Tu parles uniquement en français.
- Tu adoptes un ton humain, naturel et oral (comme un examinateur réel).
- Tu poses des questions courtes et progressives.
- Tu relances souvent : “Pouvez-vous expliquer davantage ?”, “Pourquoi pensez-vous cela ?”, “Avez-vous un exemple ?”
- Tu ne fais PAS de correction grammaticale explicite.
- Tu ne donnes PAS de feedback pédagogique.
- Tu ne résumes pas les réponses du candidat.

📌 Dynamique :
- Si le candidat parle peu → pose une question simple.
- Si le candidat parle beaucoup → recentre sur le sujet.
- Si silence → relance naturelle.

📌 Style :
- Naturel, professionnel, examen oral réel.
- Pas de listes.
- Pas d'explications longues.

Commence la conversation immédiatement avec une question liée au sujet.`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-realtime",
          instructions: systemInstructions,
          audio: {
            output: {
              voice: "alloy"
            }
          }
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI Realtime client_secrets Error:", data);
      return NextResponse.json({
        error: data.error?.message || "Erreur lors de la création du client_secret OpenAI",
        details: data.error
      }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Internal Server Error in /api/oral/session:", error);
    return NextResponse.json({ error: "Erreur interne du serveur", details: error.message }, { status: 500 });
  }
}
