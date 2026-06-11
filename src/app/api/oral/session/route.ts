import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Clé API OpenAI manquante." }, { status: 500 });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // On tente d'abord avec gpt-realtime (vu dans le dashboard de l'utilisateur)
    // On utilise 'as any' pour éviter les erreurs de type sur les nouveaux modèles
    const session = await openai.beta.realtime.sessions.create({
      model: "gpt-realtime" as any,
      voice: "alloy",
      instructions: "Tu es un examinateur du TEF IRN. Tu dois simuler une conversation de la Section A ou B. Sois naturel, pose des questions, et relance l'utilisateur.",
    });

    return NextResponse.json(session);
  } catch (error: any) {
    console.error("OpenAI Realtime Session Error (gpt-realtime):", error);

    // Fallback sur le modèle standard si gpt-realtime n'est pas reconnu par cet endpoint
    try {
      const sessionFallback = await openai.beta.realtime.sessions.create({
        model: "gpt-4o-realtime-preview" as any,
        voice: "alloy",
        instructions: "Tu es un examinateur du TEF IRN. Tu dois simuler une conversation de la Section A ou B. Sois naturel, pose des questions, et relance l'utilisateur.",
      });
      return NextResponse.json(sessionFallback);
    } catch (fallbackError: any) {
      console.error("OpenAI Realtime Session Fallback Error:", fallbackError);
      return NextResponse.json({
        error: fallbackError.message || "Erreur lors de la création de la session OpenAI",
        details: fallbackError.error || fallbackError
      }, { status: fallbackError.status || 500 });
    }
  }
}
