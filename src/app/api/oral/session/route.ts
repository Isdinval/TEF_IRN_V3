import { NextResponse } from "next/server";

export async function GET() {
  const url = "https://api.openai.com/v1/realtime/sessions";

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Clé API OpenAI manquante dans les variables d'environnement." }, { status: 500 });
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-realtime",
        voice: "alloy",
        instructions: "Tu es un examinateur du TEF IRN. Tu dois simuler une conversation de la Section A ou B. Sois naturel, pose des questions, et relance l'utilisateur.",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI Realtime Session Error:", data);
      return NextResponse.json({
        error: data.error?.message || "Erreur lors de la création de la session OpenAI",
        details: data.error
      }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Internal Server Error in /api/oral/session:", error);
    return NextResponse.json({ error: "Erreur interne du serveur", details: error.message }, { status: 500 });
  }
}
