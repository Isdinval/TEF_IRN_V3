import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { createClient } from "@/lib/supabase-server";

type Turn = { role: "candidat" | "coach"; text: string };

// Grille inspirée du référentiel officiel TEF IRN (Compétence 4, Production orale) :
// 5 critères répartis en capacités communicatives et linguistiques, notés <A1 à B2.
// Labels d'affichage : voir src/lib/oral-criteria.ts (utilisé côté front).

// Seuils internes (convention de cette application, PAS une calibration psychométrique
// officielle comme le vrai TEF IRN) pour dériver le niveau CECRL à partir de la moyenne
// des 5 critères. Documentés ici pour rester ajustables facilement.
const LEVEL_THRESHOLDS: { min: number; level: "<A1" | "A1" | "A2" | "B1" | "B2" }[] = [
  { min: 85, level: "B2" },
  { min: 70, level: "B1" },
  { min: 55, level: "A2" },
  { min: 40, level: "A1" },
  { min: 0, level: "<A1" },
];

function levelFromScore(score: number): "<A1" | "A1" | "A2" | "B1" | "B2" {
  return LEVEL_THRESHOLDS.find((t) => score >= t.min)!.level;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { transcript, scenario, endedBy } = body as {
      transcript: Turn[];
      scenario: { id: string; section: "A" | "B"; level: "A2" | "B1" | "B2"; sujet: string; objectifs: string[] };
      endedBy: "user" | "ai" | "timeout";
    };

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: "Transcription vide" }, { status: 400 });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({ error: "OpenAI API Key non configurée" }, { status: 500 });
    }

    const transcriptText = transcript
      .map((t) => `${t.role === "candidat" ? "CANDIDAT" : "EXAMINATEUR"} : ${t.text}`)
      .join("\n");

    const systemPrompt = `
Tu es un examinateur expert du TEF IRN, spécialisé dans l'évaluation de l'expression orale (Compétence 4) selon le référentiel officiel France Compétences, pour les niveaux A2 à B2 du CECRL.

Tu reçois la transcription complète d'un entretien dirigé entre un candidat et un examinateur (IA), sur le sujet : "${scenario.sujet}", niveau visé "${scenario.level}", objectifs : ${scenario.objectifs.join(", ")}.

Évalue UNIQUEMENT la performance du CANDIDAT (ignore les tours de l'examinateur, sauf pour comprendre le contexte des réponses).

RÈGLE ANTI-BIAIS IMPORTANTE : ne te laisse pas influencer par le niveau visé "${scenario.level}" affiché ci-dessus. Note ce que tu observes réellement dans la transcription, même si cela diffère du niveau visé.

Pour CHAQUE critère ci-dessous, procède en 2 temps, dans cet ordre :
1. "evidence" : cite ou paraphrase brièvement 1 à 2 passages précis de la transcription qui justifient ta note (pas de note sans preuve textuelle).
2. "score" : une note de 0 à 100, choisie UNIQUEMENT parmi les bandes suivantes (n'attribue jamais une valeur hors de la bande qui correspond à ton constat) :
   - 0-39 : <A1 — production très limitée, mots isolés, incompréhension fréquente du sujet.
   - 40-54 : A1 — phrases mémorisées très simples, vocabulaire minimal, réponses courtes.
   - 55-69 : A2 — decrit des faits/expériences simples, phrases courtes correctes, vocabulaire courant limité.
   - 70-84 : B1 — raconte, justifie brièvement, prend part à l'échange, quelques erreurs mais compréhensible sans effort.
   - 85-100 : B2 — développe un point de vue, nuance, argumente avec des exemples, langue globalement précise et fluide.

Les 5 critères à noter (avec leur focus précis) :
1. "pertinence_et_adequation_au_sujet" : le candidat répond-il réellement à la tâche et aux questions posées, sans hors-sujet ?
2. "coherence_et_interaction" : enchaînement logique des idées, réactivité aux relances, capacité à faire progresser l'échange (pas juste répondre par oui/non).
3. "etendue_et_precision_du_vocabulaire" : diversité lexicale réelle observée (pas de supposition), justesse des mots choisis pour le contexte.
4. "correction_grammaticale" : temps/modes verbaux corrects, accords, structures — compte les erreurs réellement visibles dans le texte, ne pas en inventer.
5. "aisance_et_fluidite" : longueur et fluidité des tours de parole du candidat telles que visibles dans le texte (hésitations transcrites, reformulations, réponses monosyllabiques vs développées).

Ne calcule PAS toi-même de score global ni de niveau CECRL global : ils seront calculés automatiquement à partir de tes 5 notes. Concentre-toi uniquement sur des notes par critère justes et indépendantes les unes des autres.

Donne aussi 2-4 points forts, 2-4 points à améliorer (basés sur des faits observés, pas génériques), et un commentaire général bref, bienveillant et actionnable.

STRUCTURE DE LA RÉPONSE (JSON STRICT) :
{
  "scores": {
    "pertinence_et_adequation_au_sujet": { "evidence": "string", "score": number },
    "coherence_et_interaction": { "evidence": "string", "score": number },
    "etendue_et_precision_du_vocabulaire": { "evidence": "string", "score": number },
    "correction_grammaticale": { "evidence": "string", "score": number },
    "aisance_et_fluidite": { "evidence": "string", "score": number }
  },
  "strengths": ["string"],
  "improvements": ["string"],
  "general_comment": "string"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Transcription :\n${transcriptText}` },
      ],
      response_format: { type: "json_object" },
    });

    const raw = JSON.parse(response.choices[0].message.content || "{}");

    // On extrait uniquement les notes numériques (l'"evidence" sert à ancrer le
    // raisonnement du modèle mais n'est pas persistée pour l'instant).
    const scoreKeys = [
      "pertinence_et_adequation_au_sujet",
      "coherence_et_interaction",
      "etendue_et_precision_du_vocabulaire",
      "correction_grammaticale",
      "aisance_et_fluidite",
    ] as const;

    const scores: Record<(typeof scoreKeys)[number], number> = {} as any;
    for (const key of scoreKeys) {
      scores[key] = Number(raw.scores?.[key]?.score) || 0;
    }

    // Calcul déterministe côté serveur : garantit que overall_score et estimated_level
    // sont toujours cohérents avec les 5 notes par critère (le LLM ne les invente plus).
    const overall_score = Math.round(
      scoreKeys.reduce((sum, key) => sum + scores[key], 0) / scoreKeys.length
    );
    const estimated_level = levelFromScore(overall_score);

    const analysis = {
      overall_score,
      estimated_level,
      scores,
      strengths: raw.strengths || [],
      improvements: raw.improvements || [],
      general_comment: raw.general_comment || "",
    };

    const { data: saved, error: insertError } = await supabase
      .from("oral_session_results")
      .insert({
        user_id: user.id,
        scenario_id: scenario.id,
        section: scenario.section,
        level: scenario.level,
        ended_by: endedBy,
        transcript,
        overall_score: analysis.overall_score,
        estimated_level: analysis.estimated_level,
        scores: analysis.scores,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        general_comment: analysis.general_comment,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert oral_session_results error:", insertError);
      // On renvoie quand même l'analyse même si la sauvegarde échoue (dégradation gracieuse).
      return NextResponse.json({ ...analysis, saved: false });
    }

    return NextResponse.json({ ...analysis, saved: true, id: saved.id });
  } catch (error: any) {
    console.error("Oral analyze error:", error);
    return NextResponse.json({ error: "Erreur lors de l'analyse IA" }, { status: 500 });
  }
}
