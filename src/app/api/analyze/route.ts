import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, subject, targetLevel } = body;
    const openai = getOpenAIClient();

    if (!openai) {
      return NextResponse.json({ error: "OpenAI API Key non configurée" }, { status: 500 });
    }

    if (!text) {
      return NextResponse.json({ error: "Texte manquant" }, { status: 400 });
    }

    const effectiveSubject = subject || "Sujet libre";
    const effectiveLevel = targetLevel || "B1";

    const prompt = `
      Tu es un examinateur expert du TEF IRN (format 2025). Analyse la production écrite suivante.
      Sujet : ${effectiveSubject}
      Niveau visé : ${effectiveLevel}
      Texte de l'élève : "${text}"

      Consignes strictes :
      1. Sois encourageant mais rigoureux sur les critères du TEF IRN (pertinence, cohérence, lexique, syntaxe).
      2. Identifie les erreurs spécifiques. Pour chaque erreur, extrais EXACTEMENT le fragment de texte original fautif.
      3. Propose une version améliorée qui respecte les codes du niveau B2.

      Réponds uniquement en JSON avec la structure suivante :
      {
        "score": number (0-100),
        "level": "A1" | "A2" | "B1" | "B2",
        "comment": "commentaire global pédagogique",
        "annotations": [
          {
            "original_fragment": "le fragment exact tel qu'il apparaît dans le texte",
            "correction": "la version corrigée",
            "explanation": "explication pédagogique",
            "type": "error" | "improvement"
          }
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

    // Ensure data has expected fields to prevent frontend crash
    if (!data.score) data.score = 0;
    if (!data.level) data.level = effectiveLevel;
    if (!data.annotations) data.annotations = [];

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json({
      error: "Erreur lors de l'analyse IA",
      score: 0,
      level: "A1",
      comment: "L'analyse a échoué temporairement. Réessayez plus tard.",
      annotations: []
    }, { status: 500 });
  }
}
