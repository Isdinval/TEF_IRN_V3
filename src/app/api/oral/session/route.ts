import { NextResponse } from "next/server";

export async function GET() {
  const url = "https://api.openai.com/v1/realtime/sessions";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-2024-10-01",
      voice: "alloy",
      instructions: "Tu es un examinateur du TEF IRN. Tu dois simuler une conversation de la Section A ou B. Sois naturel, pose des questions, et relance l'utilisateur.",
    }),
  });

  const data = await response.json();
  return NextResponse.json(data);
}
