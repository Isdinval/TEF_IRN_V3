import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { text, subject, targetLevel } = await req.json();
    const openai = getOpenAIClient();

    if (!openai) {
      return NextResponse.json({ error: "OpenAI API Key non configurée" }, { status: 500 });
    }

    if (!text || !subject) {
      return NextResponse.json({ error: "Texte ou sujet manquant" }, { status: 400 });
    }

    const prompt = `
      Tu es un examinateur expert du TEF IRN (format 2025). Analyse la production écrite suivante.
      Sujet : ${subject}
      Niveau visé : ${targetLevel}
      Texte de l'élève : "${text}"

      Consignes strictes :
      1. Sois encourageant mais rigoureux sur les critères du TEF IRN (pertinence, cohérence, lexique, syntaxe).
      2. Pour chaque erreur, donne une explication pédagogique claire (la règle de grammaire ou de syntaxe).
      3. Propose une version améliorée qui respecte les codes du niveau B2.

      Réponds uniquement en JSON avec la structure suivante :
      {
        "score": number (0-100),
        "level": "A1" | "A2" | "B1" | "B2",
        "comment": "commentaire global pédagogique",
        "annotations": [
          { "text": "partie erronée", "correction": "correction", "explanation": "pourquoi", "type": "error" | "improvement" }
        ],
        "improved": "version corrigée et optimisée pour le niveau B2"
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Tu es un coach IA expert en préparation au TEF IRN." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const data = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json({ error: "Erreur lors de l'analyse IA" }, { status: 500 });
  }
}
