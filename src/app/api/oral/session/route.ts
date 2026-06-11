import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Clé API OpenAI manquante." }, { status: 500 });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Liste des modèles à essayer par ordre de probabilité de succès
  const modelsToTry = [
    "gpt-4o-realtime-preview",
    "gpt-realtime",
    "gpt-4o-realtime-preview-2024-12-17",
    "gpt-4o-realtime-preview-2024-10-01",
    "gpt-4o-mini-realtime-preview"
  ];

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      console.log(`Tentative de création de session avec le modèle : ${model}`);
      // @ts-ignore
      const session = await openai.beta.realtime.sessions.create({
        model: model as any,
        voice: "alloy",
        instructions: "Tu es un examinateur du TEF IRN. Tu dois simuler une conversation de la Section A ou B. Sois naturel, pose des questions, et relance l'utilisateur.",
      }, {
        headers: {
          "OpenAI-Beta": "realtime=v1" // Forçage du header beta spécifique au Realtime
        }
      });

      console.log(`Session créée avec succès avec le modèle : ${model}`);
      return NextResponse.json(session);
    } catch (error: any) {
      console.error(`Échec avec le modèle ${model} : `, error.message);
      lastError = error;

      // Si l'erreur n'est pas un 404 (ex: clé invalide, quota dépassé), on s'arrête tout de suite
      if (error.status !== 404 && !error.message?.includes("not found")) {
        break;
      }
    }
  }

  // Si on arrive ici, tous les essais ont échoué
  return NextResponse.json({
    error: lastError?.message || "Impossible de créer une session OpenAI avec les modèles disponibles.",
    details: lastError?.error || lastError,
    hint: "Assurez-vous que votre compte OpenAI est au moins Tier 1 et que vous avez accès à l'API Realtime."
  }, { status: lastError?.status || 500 });
}
