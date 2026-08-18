import { NextResponse } from "next/server";
import { z } from "zod";
import { getOpenAIClient } from "@/lib/openai";
import { createClient } from "@/lib/supabase-server";
import { trackUserError, analyzeUserErrorsAndRecommend } from "@/lib/recommendation-engine";

type Turn = { role: "candidat" | "coach"; text: string };

// Seuil "candidat trop peu loquace" : compte les mots du CANDIDAT uniquement (les tours
// de l'examinateur ne comptent pas). Contrairement à l'EE, il n'y a pas de minimum de mots
// par sujet ici -- 20 mots est un seuil bas volontaire (quelques mots isolés sur toute la
// session), pas un seuil de qualité : en dessous, il n'y a simplement pas assez de matière
// pour évaluer les 5 critères de façon fiable, quel que soit leur contenu.
const MIN_CANDIDATE_WORDS = 20;

function countCandidateWords(transcript: Turn[]): number {
  return transcript
    .filter((t) => t.role === "candidat")
    .reduce((sum, t) => sum + t.text.trim().split(/\s+/).filter(Boolean).length, 0);
}

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

// Sous-catégories valides pour Grammaire/Vocabulaire, alignées sur la taxonomie
// officielle des étiquettes de leçons (docs/lessons-tags-taxonomy.md). Sous-ensemble
// dupliqué depuis SOUS_CATEGORIES_BY_TYPE (src/app/api/writing/correct/route.ts) --
// les routes API ne s'importent pas entre elles dans ce projet, même précédent que
// CATEGORY_LABELS dans writing/scenario-complete/route.ts. Seuls Grammaire et
// Vocabulaire ont un équivalent utile ici (item 14 du plan dashboard) : les 3 autres
// critères oraux (pertinence, cohérence, aisance) ne correspondent à aucune notion
// isolable de la taxonomie, les y rattacher n'aurait pas de sens pédagogique.
const SOUS_CATEGORIES_BY_TYPE: Record<"grammaire" | "vocabulaire", string[]> = {
  grammaire: ['accord des adjectifs', 'accord du participe passé', 'adverbes', 'articles', 'comparatifs', 'connecteurs cause/conséquence', 'constructions participiales', 'démonstratifs', 'formation -ment', 'genre et nombre', 'infinitif', 'interrogation', 'mise en relief', 'négation', 'nominalisation', 'pluriel', 'possessifs', 'préférences', 'prépositions de lieu', 'prépositions de temps', 'pronoms COD/COI', 'pronoms indéfinis', 'pronoms relatifs', 'pronoms relatifs composés', 'pronoms Y/EN', 'quantités', 'registre soutenu', 'subjonctif vs indicatif', 'superlatif', 'aller', 'avoir', 'concordance des temps', 'conditionnel passé', 'conditionnel présent', 'discours rapporté', 'être', 'faire', 'futur antérieur', 'futur proche', 'futur simple', 'gérondif', 'imparfait', 'impératif', 'participe présent', 'passé composé', 'plus-que-parfait', 'politesse', 'pouvoir', 'présent', 'quotidien', 'regret', 'subjonctif passé', 'subjonctif présent', 'tournures impersonnelles', 'venir', 'verbes en -er', 'verbes en -ir', 'verbes en -re', 'verbes irréguliers', 'verbes pronominaux', 'voix passive', 'vouloir'],
  vocabulaire: ['collocations', 'faux-amis', 'registre de langue', 'registre soutenu', 'vocabulaire administratif', 'vocabulaire arts', 'vocabulaire civique', 'vocabulaire culture', 'vocabulaire économie', 'vocabulaire emploi', 'vocabulaire environnement', 'vocabulaire famille', 'vocabulaire famille/logement', 'vocabulaire horaires', 'vocabulaire logement', 'vocabulaire loisirs', 'vocabulaire médias', 'vocabulaire nombres', 'vocabulaire prix', 'vocabulaire quotidien', 'vocabulaire salutations', 'vocabulaire santé', 'vocabulaire sciences', 'vocabulaire société', 'vocabulaire transports', 'vocabulaire travail', 'vocabulaire ville'],
};

// Référentiel condensé par niveau CECRL — source détaillée : docs/oral-analysis-levels.md
// (miroir de LEVEL_GUIDELINES dans src/app/api/writing/correct/route.ts). Sans ça, le prompt
// n'avait que les bandes de score génériques (0-39/40-54/...), sans consigne sur ce qu'il faut
// attendre/tolérer/s'interdire à CE niveau précis -- risque de juger un A2 avec des attentes B2.
const LEVEL_GUIDELINES: Record<"A2" | "B1" | "B2", string> = {
  A2: `Niveau A2 : attends des réponses courtes mais complètes à chaque question, pas de phrases développées. Tolère les hésitations, les réponses très courtes (si elles répondent à la question), le vocabulaire limité. Signale en priorité une absence de réponse à une question directe ou une incapacité à formuler une phrase complète. N'exige JAMAIS de nuance, de justification développée ou de connecteurs élaborés -- ce n'est pas attendu à ce niveau.`,
  B1: `Niveau B1 : attends une justification simple (parce que, car) et une réaction visible aux relances/objections de l'interlocuteur (pas juste "oui, oui"). Tolère des connecteurs encore simples (mais, donc) et de petites hésitations. Signale en priorité une objection ignorée ou une opinion sans aucune justification. N'exige JAMAIS une argumentation nuancée en plusieurs étapes (c'est l'attendu B2), et ne pénalise PAS un registre informel en Section B (tutoiement) : c'est le registre attendu, pas une faute.`,
  B2: `Niveau B2 : attends une argumentation nuancée (distinguer plusieurs causes/options, concéder un point puis contre-argumenter) et une vraie capacité à faire évoluer la position de l'interlocuteur. Signale en priorité une argumentation qui reste générale/évasive malgré une relance explicite. N'exige JAMAIS de vocabulaire soutenu ou livresque hors de l'usage courant, et ne pénalise PAS une argumentation efficace formulée simplement -- B2 évalue la nuance et l'interaction réelle, pas la sophistication du vocabulaire.`,
};

// Validation minimale de la réponse IA : response_format:"json_object" garantit un JSON
// valide, mais pas la présence/le type des champs attendus (OralAnalysisView lit
// scores.*, strengths, improvements sans garde-fou et plante si absents/mal typés).
const OralFeedbackSchema = z.object({
  scores: z.object({
    pertinence_et_adequation_au_sujet: z.object({ evidence: z.string(), score: z.number() }),
    coherence_et_interaction: z.object({ evidence: z.string(), score: z.number() }),
    etendue_et_precision_du_vocabulaire: z.object({ evidence: z.string(), score: z.number() }),
    correction_grammaticale: z.object({ evidence: z.string(), score: z.number() }),
    aisance_et_fluidite: z.object({ evidence: z.string(), score: z.number() }),
  }),
  // Notion précise en cause si le score correspondant est faible (item 14 du plan
  // dashboard) -- optionnel, demandé au modèle uniquement dans ces cas dans le prompt,
  // validé contre la taxonomie officielle après coup (voir garde-fou plus bas).
  grammaire_sous_categorie: z.string().nullable().optional(),
  vocabulaire_sous_categorie: z.string().nullable().optional(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  general_comment: z.string(),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { transcript, scenario, endedBy, context } = body as {
      transcript: Turn[];
      scenario: { id: string; section: "A" | "B"; level: "A2" | "B1" | "B2"; sujet: string; objectifs: string[] };
      endedBy: "user" | "ai" | "timeout";
      context?: string;
    };

    // 'standalone' par défaut : couvre la page Expression Orale (pratique libre) et tout
    // appelant qui ne précise pas encore ce champ. 'exam' est réservé aux sessions EO passées
    // dans le cadre d'un examen blanc complet (/tef-irn/exam), voir item 6 du plan dashboard.
    const sessionContext = context === 'exam' ? 'exam' : 'standalone';

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

    const candidateWordCount = countCandidateWords(transcript);
    const isInsufficientSpeech = candidateWordCount < MIN_CANDIDATE_WORDS;

    // Exemplaires de calibration (tef_knowledge) : ancrage concret sur tout le spectre de
    // score (excellent/moyen/faible) pour le niveau visé, même principe que la calibration
    // EE (voir src/app/api/writing/correct/route.ts). Lookup déterministe par niveau (pas
    // de recherche vectorielle : le niveau est toujours connu à l'avance). Best-effort : la
    // table peut être vide ou la requête échouer sans jamais bloquer l'analyse.
    let calibrationExemplar = "";
    try {
      const { data: exemplarRows } = await supabase
        .from("tef_knowledge")
        .select("content, metadata")
        .eq("metadata->>category", "eo_calibration_exemplar")
        .eq("metadata->>level", scenario.level)
        .limit(3);

      if (exemplarRows && exemplarRows.length > 0) {
        const TIER_ORDER: Record<string, number> = { excellent: 0, moyen: 1, faible: 2 };
        const sorted = [...exemplarRows].sort(
          (a, b) => (TIER_ORDER[a.metadata?.tier] ?? 99) - (TIER_ORDER[b.metadata?.tier] ?? 99)
        );
        calibrationExemplar = `\nREPÈRES DE SÉVÉRITÉ (ne pas recopier, servent uniquement à calibrer ta notation sur tout le barème -- positionne le candidat par interpolation entre ces 3 repères, ne converge PAS systématiquement vers le repère "moyen" par prudence) :\n${sorted.map((r) => r.content).join("\n\n")}`;
      }
    } catch (ragError) {
      console.error("Lecture tef_knowledge échouée (non bloquant):", ragError);
    }

    const systemPrompt = `
Tu es un examinateur expert du TEF IRN, spécialisé dans l'évaluation de l'expression orale (Compétence 4) selon le référentiel officiel France Compétences, pour les niveaux A2 à B2 du CECRL.

Tu reçois la transcription complète d'un entretien dirigé entre un candidat et un examinateur (IA), sur le sujet : "${scenario.sujet}", niveau visé "${scenario.level}", objectifs : ${scenario.objectifs.join(", ")}.

Évalue UNIQUEMENT la performance du CANDIDAT (ignore les tours de l'examinateur, sauf pour comprendre le contexte des réponses).

RÈGLE ANTI-BIAIS IMPORTANTE : ne te laisse pas influencer par le niveau visé "${scenario.level}" affiché ci-dessus. Note ce que tu observes réellement dans la transcription, même si cela diffère du niveau visé.

RÈGLE ANTI-BRUIT DE TRANSCRIPTION : la transcription vient d'un modèle de reconnaissance vocale, pas d'un texte écrit par le candidat -- elle peut donc contenir des mots déformés ou incohérents qui sont des erreurs de transcription, pas des erreurs de langue du candidat (ex. une date ou un nom mal reconnu et transformé en mot sans rapport avec le contexte). Si un passage te semble être ce type d'artefact (mot isolé incohérent, sans lien logique avec ce qui précède/suit, alors que le reste de la phrase est clair), NE le signale PAS comme une faiblesse de vocabulaire, de clarté ou de grammaire, et ne l'utilise pas comme "evidence" pour baisser un score.

CONSIGNE SPÉCIFIQUE AU NIVEAU VISÉ (ce que tu dois attendre/tolérer/t'interdire pour CE scénario précis, indépendamment de la règle anti-biais ci-dessus qui porte sur le résultat, pas sur la grille d'attentes) :
${LEVEL_GUIDELINES[scenario.level]}

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

Si ta note pour "correction_grammaticale" est inférieure à 55, identifie EN PLUS la notion grammaticale précise la plus responsable de ce score faible, en choisissant EXACTEMENT un mot dans cette liste -- jamais un mot en dehors de cette liste, jamais une formulation inventée : ${SOUS_CATEGORIES_BY_TYPE.grammaire.join(", ")}. Si vraiment aucun mot de la liste ne correspond, ou si le score est ≥ 55, mets "grammaire_sous_categorie" à null.

Si ta note pour "etendue_et_precision_du_vocabulaire" est inférieure à 55, identifie EN PLUS le domaine lexical précis le plus en cause, en choisissant EXACTEMENT un mot dans cette liste -- jamais un mot en dehors de cette liste, jamais une formulation inventée : ${SOUS_CATEGORIES_BY_TYPE.vocabulaire.join(", ")}. Si vraiment aucun mot de la liste ne correspond, ou si le score est ≥ 55, mets "vocabulaire_sous_categorie" à null.
${calibrationExemplar}
${isInsufficientSpeech ? `\nMATIÈRE INSUFFISANTE : le candidat n'a produit que ${candidateWordCount} mots sur toute la session (seuil minimal : ${MIN_CANDIDATE_WORDS}). Note tous les critères bas (10-20), quelle que soit leur qualité apparente, et mentionne ce manque de matière en premier dans "general_comment".` : ""}

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
  "grammaire_sous_categorie": "un mot EXACT de la liste grammaire ci-dessus, ou null",
  "vocabulaire_sous_categorie": "un mot EXACT de la liste vocabulaire ci-dessus, ou null",
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

    const rawData = JSON.parse(response.choices[0].message.content || "{}");
    const parsed = OralFeedbackSchema.safeParse(rawData);

    if (!parsed.success) {
      console.error("Réponse IA invalide (schéma inattendu):", parsed.error.flatten());
      // Pas de persistance en base sur une réponse invalide : mieux vaut laisser le
      // candidat relancer l'analyse qu'enregistrer une session à 0/100 dans son historique.
      return NextResponse.json(
        { error: "L'analyse n'a pas pu être générée correctement. Merci de réessayer.", saved: false },
        { status: 200 }
      );
    }

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
      scores[key] = parsed.data.scores[key].score;
    }

    // Garde-fou déterministe (item 14, même principe que writing/correct/route.ts
    // item 10.12) : toute sous_categorie hors taxonomie officielle est ramenée à null
    // plutôt que remontée telle quelle -- garantit que la sous-catégorie, si présente,
    // pointera toujours vers une vraie leçon (analyzeUserErrorsAndRecommend).
    const grammaireSousCategorie =
      parsed.data.grammaire_sous_categorie && SOUS_CATEGORIES_BY_TYPE.grammaire.includes(parsed.data.grammaire_sous_categorie)
        ? parsed.data.grammaire_sous_categorie
        : null;
    const vocabulaireSousCategorie =
      parsed.data.vocabulaire_sous_categorie && SOUS_CATEGORIES_BY_TYPE.vocabulaire.includes(parsed.data.vocabulaire_sous_categorie)
        ? parsed.data.vocabulaire_sous_categorie
        : null;

    // Application déterministe du seuil "matière insuffisante" : la consigne du prompt
    // le demande déjà, mais comme pour l'EE, une règle purement mécanique (nombre de mots
    // du candidat, connu avec certitude côté serveur) est plus fiable qu'une obéissance au
    // prompt seule -- on plafonne donc ici plutôt que d'espérer que le modèle applique la
    // consigne à chaque fois.
    if (isInsufficientSpeech) {
      for (const key of scoreKeys) {
        scores[key] = Math.min(scores[key], 20);
      }
    }

    // Calcul déterministe côté serveur : garantit que overall_score et estimated_level
    // sont toujours cohérents avec les 5 notes par critère (le LLM ne les invente plus).
    const overall_score = Math.round(
      scoreKeys.reduce((sum, key) => sum + scores[key], 0) / scoreKeys.length
    );
    const estimated_level = levelFromScore(overall_score);

    let general_comment = parsed.data.general_comment;
    if (isInsufficientSpeech && !/mots|matière|court/i.test(general_comment)) {
      general_comment = `Cette session est bien trop courte pour évaluer correctement la production orale (${candidateWordCount} mots prononcés), ce qui limite fortement l'évaluation. ${general_comment}`;
    }

    const analysis = {
      overall_score,
      estimated_level,
      scores,
      strengths: parsed.data.strengths,
      improvements: parsed.data.improvements,
      general_comment,
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
        context: sessionContext,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert oral_session_results error:", insertError);
      // On renvoie quand même l'analyse même si la sauvegarde échoue (dégradation gracieuse).
      return NextResponse.json({ ...analysis, saved: false });
    }

    // Remonte les points faibles vers user_errors (seuls Grammaire et Vocabulaire ont un
    // équivalent dans l'enum exercises.category -- pertinence/cohérence/fluidité n'ont pas
    // d'exercice ciblé existant, les y remonter ne ferait que polluer le widget "Points
    // faibles" sans jamais alimenter de recommandation). Miroir du choix EE : on ne
    // "résout" jamais un point faible ici, une bonne session ne prouve pas une maîtrise
    // durable -- seul un signal de faiblesse répété (frequency) doit s'accumuler.
    //
    // Sous-catégorie précise (item 14) : quand l'IA en identifie une (validée par le
    // garde-fou ci-dessus), elle est transmise à trackUserError au lieu de null --
    // permet un rapprochement erreur -> leçon aussi précis que pour l'Écrit. Reste
    // null par défaut (Oral ne peut pas toujours isoler une notion précise), auquel
    // cas le fallback de résolution générique (item 2) continue de s'appliquer.
    const WEAK_SCORE_THRESHOLD = 55;
    try {
      const sourceLabel = sessionContext === 'exam' ? 'Examen blanc' : 'Oral';
      if (scores.correction_grammaticale < WEAK_SCORE_THRESHOLD) {
        await trackUserError(user.id, "Grammaire", grammaireSousCategorie, sourceLabel, scenario.level);
      }
      if (scores.etendue_et_precision_du_vocabulaire < WEAK_SCORE_THRESHOLD) {
        await trackUserError(user.id, "Vocabulaire", vocabulaireSousCategorie, sourceLabel, scenario.level);
      }
      await analyzeUserErrorsAndRecommend(user.id);
    } catch (recoError) {
      console.error("Recommendation engine error (oral session):", recoError);
    }

    return NextResponse.json({ ...analysis, saved: true, id: saved.id });
  } catch (error: any) {
    console.error("Oral analyze error:", error);
    return NextResponse.json({ error: "Erreur lors de l'analyse IA" }, { status: 500 });
  }
}
