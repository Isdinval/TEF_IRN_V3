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
2. Identifie les erreurs selon ces catégories précises :
   - "conjugaison" : erreurs de temps, de mode (impératif, subjonctif, etc.) ou de terminaisons verbales.
   - "grammaire" : erreurs d'accords (nom/adjectif), de pronoms, d'articles, de prépositions.
   - "syntaxe" : erreurs d'ordre des mots, de connecteurs logiques, de structure de phrase.
   - "orthographe" : fautes d'orthographe pure, accents, ponctuation.
   - "vocabulaire" : mauvais choix de mot, anglicismes, registre inadapté.
3. Pour chaque erreur, fournis l'extrait EXACT du texte original. Cet extrait doit être présent mot pour mot dans le texte du candidat.
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
      "texte_original": "extrait exact trouvé dans le texte du candidat",
      "texte_corrige": "version corrigée",
      "explication": "explication courte",
      "type_erreur": "conjugaison" | "grammaire" | "vocabulaire" | "orthographe" | "syntaxe"
    }
  ],
  "conseil_general": "string",
  "texte_corrige_complet": "string"
}

IMPORTANT : Ne fournis PAS d'index de position. Concentre-toi sur le fait que "texte_original" soit une chaîne de caractères EXACTEMENT présente dans le texte fourni.
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
