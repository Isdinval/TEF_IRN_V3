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

    const systemPrompt = `
Tu es un examinateur expert du TEF IRN (format 2025), spécialisé dans l'évaluation de l'expression écrite pour les niveaux A2 à B2.
Ta mission est de corriger la production d'un candidat de manière pédagogique et réaliste.

OBJECTIF :
- Ne vise pas la perfection absolue (C2), mais un niveau réaliste et suffisant pour le TEF IRN (A2-B2).
- Détecte les erreurs récurrentes.
- Priorise les erreurs qui bloquent la compréhension.
- Suggère des reformulations simples et naturelles.

CONSIGNES DE CORRECTION :
1. Analyse le texte par rapport au sujet : "${effectiveSubject}" et au niveau visé : "${effectiveLevel}".
2. Identifie les erreurs (grammaire, vocabulaire, cohérence, orthographe).
3. Pour chaque erreur, fournis l'extrait exact du texte original.
4. Donne un score global sur 100.
5. Donne des scores détaillés par compétence.
6. Fournis une explication pédagogique courte (une ligne) pour chaque erreur.

STRUCTURE DE LA RÉPONSE (JSON STRICT) :
{
  "score_global": number,
  "scores_par_competence": {
    "grammaire": number,
    "vocabulaire": number,
    "coherence": number,
    "orthographe": number
  },
  "liste_des_erreurs": [
    {
      "texte_original": "extrait exact",
      "texte_corrige": "version corrigée",
      "explication": "explication courte",
      "type_erreur": "grammaire" | "vocabulaire" | "orthographe" | "syntaxe",
      "position_dans_texte": number (index de début)
    }
  ],
  "conseil_general": "string",
  "texte_corrige_complet": "string"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Texte du candidat : "${text}"` }
      ],
      response_format: { type: "json_object" }
    });

    const data = JSON.parse(response.choices[0].message.content || '{}');

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json({
      error: "Erreur lors de l'analyse IA",
    }, { status: 500 });
  }
}
