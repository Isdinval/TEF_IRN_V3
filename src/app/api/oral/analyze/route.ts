import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { createClient } from "@/lib/supabase-server";

type Turn = { role: "candidat" | "coach"; text: string };

// Grille inspirée du référentiel officiel TEF IRN (Compétence 4, Production orale) :
// 5 critères répartis en capacités communicatives et linguistiques, notés <A1 à B2.
// Labels d'affichage : voir src/lib/oral-criteria.ts (utilisé côté front).

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

Note chaque critère de la grille officielle sur 100, en te basant sur les descripteurs CECRL A2/B1/B2 :
1. "pertinence_et_adequation_au_sujet" : le candidat répond-il réellement à la tâche et aux questions posées ?
2. "coherence_et_interaction" : enchaînement des idées, réactivité, capacité à prendre part à l'échange.
3. "etendue_et_precision_du_vocabulaire" : richesse et justesse du vocabulaire utilisé.
4. "correction_grammaticale" : maîtrise des temps, modes, structures.
5. "aisance_et_fluidite" : fluidité du discours perceptible dans la transcription (hésitations, reformulations, longueur des tours de parole).

Donne aussi un score global (0-100), un niveau CECRL estimé ("<A1", "A1", "A2", "B1" ou "B2"), 2-4 points forts, 2-4 points à améliorer, et un commentaire général bref, bienveillant et actionnable.

STRUCTURE DE LA RÉPONSE (JSON STRICT) :
{
  "overall_score": number,
  "estimated_level": "<A1" | "A1" | "A2" | "B1" | "B2",
  "scores": {
    "pertinence_et_adequation_au_sujet": number,
    "coherence_et_interaction": number,
    "etendue_et_precision_du_vocabulaire": number,
    "correction_grammaticale": number,
    "aisance_et_fluidite": number
  },
  "strengths": ["string"],
  "improvements": ["string"],
  "general_comment": "string"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Transcription :\n${transcriptText}` },
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");

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

