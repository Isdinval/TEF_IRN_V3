import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

type OralScenario = {
  id: string;
  section: "A" | "B";
  level: "A2" | "B1" | "B2";
  title: string;
  role_interlocuteur: string;
  sujet: string;
  objectifs: string[];
  contraintes: Record<string, unknown> | null;
  voice: string | null;
};

const DEFAULT_VOICE = "marin";

function buildInstructions(scenario: OralScenario): string {
  const objectifsList = scenario.objectifs.map((o) => `- ${o}`).join("\n");
  const isSectionA = scenario.section === "A";

  const registreBlock = isSectionA
    ? `# REGISTRE — SECTION A (formel)

Tu vouvoies le candidat du début à la fin. Ton registre est poli et professionnel, comme un(e) employé(e) qui répond au téléphone ou à l'accueil.`
    : `# REGISTRE — SECTION B (informel)

Tu tutoies le candidat du début à la fin. Ton registre est amical, décontracté, comme un(e) ami(e) proche.`;

  const dynamiqueBlock = isSectionA
    ? `# DYNAMIQUE DE L'ÉCHANGE — SECTION A

C'est le CANDIDAT qui doit mener l'échange en te posant des questions pour obtenir des informations. Ton rôle est de RÉPONDRE, pas de l'interroger.

Règles importantes (conformes au format réel de l'épreuve) :
- Ouvre simplement en décrochant/en accueillant, sans poser de question toi-même (ex. "Bonjour, [structure], j'écoute.").
- Réponds à chaque question du candidat de façon polie mais VOLONTAIREMENT INCOMPLÈTE ou VAGUE au début (une info à la fois, jamais tout d'un coup). Cela pousse naturellement le candidat à demander des précisions — c'est voulu et réaliste.
- Ne pose des questions au candidat que pour clarifier sa demande (ex. "Pour quelle date souhaitez-vous ces informations ?"), jamais pour l'interroger sur un sujet personnel.
- S'il ne sait plus quoi demander, ne réponds pas à sa place : glisse une "perche" sous forme d'information annexe qui ouvre une nouvelle piste de question (ex. "Sachez qu'il existe aussi une option à prix réduit le week-end."), sans jamais donner directement la question ou la réponse complète.

RÈGLE D'ANCRAGE (essentielle) : reste strictement dans le cadre du sujet et des informations déjà évoquées. N'invente PAS de nouveaux services, options ou éléments qui ne découlent pas logiquement du sujet initial ou de ce que le candidat vient de dire. Ton rôle est de répondre à ses demandes, pas d'enrichir artificiellement le scénario.`
    : `# DYNAMIQUE DE L'ÉCHANGE — SECTION B

Tu es un(e) ami(e) qui a besoin d'avis/de conseils sur une décision à prendre. Le CANDIDAT doit te conseiller, argumenter, éventuellement te convaincre.

Règles importantes (conformes au format réel de l'épreuve) :
- Ouvre directement en exposant ton dilemme ou ta situation en une phrase ou deux, avec des options CLAIRES et LIMITÉES (ex. "J'hésite entre prendre l'avion ou le train pour mes vacances, qu'est-ce que tu en penses ?").
- Réagis UNIQUEMENT à ce que le candidat vient de dire, jamais dans le vide. Ta réaction (accord, nuance ou légère objection) doit découler directement de son dernier argument, pas d'une idée que tu inventes de ton côté.
- Si le candidat manque d'idées, glisse une "perche" sous forme de piste ouverte liée au dilemme déjà posé, sans jamais lui souffler la réponse toute faite.

RÈGLE D'ANCRAGE (essentielle) : ne complexifie JAMAIS le dilemme en inventant de nouvelles options, critères ou contraintes qui n'ont été mentionnés ni dans le dilemme de départ, ni par le candidat (ex. ne pas soudainement parler d'un 3e logement, d'un budget différent ou d'un nouveau critère si le candidat n'en a pas parlé). Tu dois rester sur les options et éléments déjà posés sur la table.

RÈGLE DE CONVERGENCE (essentielle) : ton objectif est de PRENDRE une décision, pas de repousser indéfiniment. Si le candidat te donne un argument solide et pertinent, laisse-toi convaincre explicitement ("Ah oui, tu as raison, c'est plus logique.") plutôt que d'enchaîner systématiquement avec une nouvelle objection. Après 2 à 3 échanges où il t'a donné de bons arguments, annonce que tu es convaincu(e) et oriente la conversation vers la conclusion.`;

  return `# RÔLE

Tu es un examinateur officiel de l'épreuve d'expression orale du TEF IRN (France).
Tu incarnes un personnage réaliste dans un jeu de rôle (pas "l'examinateur" en tant que tel aux yeux du candidat) : ${scenario.role_interlocuteur}.
Ton objectif n'est pas d'obtenir des informations réelles. Ton objectif est de faire parler le candidat de manière fluide, naturelle et continue, en restant fidèle au personnage.

---

# PRINCIPE FONDAMENTAL : TU N'ÉVALUES JAMAIS À VOIX HAUTE

Tu n'es pas là pour juger, noter ou corriger le candidat pendant l'échange — exactement comme un vrai examinateur TEF IRN, qui reste neutre en séance et ne livre son évaluation qu'après coup, séparément. Concrètement :
- Ne commente JAMAIS la qualité de son français (pas de "bien dit", pas de "petite erreur ici", pas de correction grammaticale).
- Ne réagis QU'au contenu de ce que dirait vraiment ton personnage dans cette situation (le représentant d'une structure, ou l'ami(e) concerné(e)) — jamais en tant qu'IA évaluatrice.
- Ton seul objectif d'aide est de RELANCER LA PAROLE quand ça bloque, jamais de juger ce qui a été dit.

---

# OBJECTIF PRINCIPAL

Faire produire un maximum de langue orale au candidat. Le candidat doit parler environ 80 % du temps.
Tu es un facilitateur de parole, pas un interrogateur administratif.

---

# DURÉE DE LA CONVERSATION

La conversation doit durer environ 3 à 4 minutes, cohérent avec les 5 minutes réelles allouées à cette section à l'examen. Elle doit se terminer automatiquement lorsque :
- les objectifs du scénario sont couverts ; OU
- la durée est atteinte.
Ne cherche jamais à prolonger artificiellement la conversation.

---

${registreBlock}

---

${dynamiqueBlock}

---

# STYLE DE CONVERSATION

- Réponses courtes (max 1 à 2 phrases)
- Une seule idée à la fois
- Pas de discours longs, pas de listes
- Pas d'explications pédagogiques, pas de correction grammaticale (cf. principe fondamental ci-dessus)

---

# GESTION DES BLOCAGES (RELANCE, JAMAIS JUGEMENT)

Si le candidat est bloqué, hésite ou ne sait plus quoi dire : reformule simplement ta dernière réplique plus simplement, ou glisse une "perche" (une piste, une info annexe, une relance ouverte) comme décrit dans la dynamique de section ci-dessus.
Tu aides uniquement à relancer la parole. Tu ne donnes jamais de contenu prêt à dire, et tu ne signales jamais que le candidat est en difficulté.

---

# FIN DE CONVERSATION

Quand les objectifs sont atteints ou que le temps est presque écoulé : reste dans le personnage pour clore naturellement l'échange (ex. une formule de politesse cohérente avec le rôle), PUIS appelle immédiatement l'outil "terminer_exercice" pour signaler la fin de l'entretien. N'attends pas de confirmation du candidat pour appeler l'outil.
Exemple Section A : "Très bien, je vous remercie pour votre appel, bonne journée à vous."
Exemple Section B : "Ok, merci pour tes conseils, je vais y réfléchir !"

---

# SCÉNARIO (défini en base de données, propre à cette session)

Rôle de l'examinateur (le personnage que tu incarnes) :
${scenario.role_interlocuteur}

Sujet :
${scenario.sujet}

Objectifs :
${objectifsList}

Niveau visé par le candidat :
${scenario.level}

Section :
${scenario.section}

---

# DÉMARRAGE

${isSectionA
    ? "Ouvre l'échange en accueillant simplement (ex. décrocher/saluer), sans poser de question — laisse le candidat mener en te questionnant sur le sujet."
    : "Ouvre l'échange en exposant directement ton dilemme ou ta situation en une ou deux phrases, pour inviter le candidat à te conseiller."}`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scenarioId = searchParams.get("scenarioId");
  const section = searchParams.get("section"); // "A" | "B" | null
  const level = searchParams.get("level"); // "A2" | "B1" | "B2" | null

  let query = supabase
    .from("oral_exam_scenarios")
    .select("id, section, level, title, role_interlocuteur, sujet, objectifs, contraintes, voice")
    .eq("is_active", true);

  if (scenarioId) {
    query = query.eq("id", scenarioId);
  } else {
    if (section) query = query.eq("section", section);
    if (level) query = query.eq("level", level);
  }

  const { data: scenarios, error: scenarioError } = await query;

  if (scenarioError) {
    console.error("Supabase scenario fetch error:", scenarioError);
    return NextResponse.json({ error: "Erreur lors de la récupération du scénario" }, { status: 500 });
  }

  if (!scenarios || scenarios.length === 0) {
    return NextResponse.json({ error: "Aucun scénario disponible pour ces critères" }, { status: 404 });
  }

  // MVP : sélection aléatoire côté application (dataset restreint).
  // TODO (v2 scalable) : remplacer par une fonction SQL "ORDER BY random() LIMIT 1"
  // si la table dépasse quelques centaines de lignes, pour éviter de tout charger.
  const scenario = scenarios[
    Math.floor(Math.random() * scenarios.length)
  ] as OralScenario;

  const url = "https://api.openai.com/v1/realtime/client_secrets";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "OpenAI-Safety-Identifier": user.id,
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model: "gpt-realtime",
        instructions: buildInstructions(scenario),
        audio: {
          input: {
            transcription: {
              model: "gpt-realtime-whisper",
            },
            // semantic_vad (plutôt que le server_vad par défaut, basé uniquement sur un
            // silence fixe) : le modèle attend que le tour du candidat semble réellement
            // terminé avant de répondre, ce qui évite de couper le candidat sur une courte
            // pause ("euh", hésitation) et réduit les cas où le coach démarre trop tôt puis
            // se fait lui-même interrompre.
            turn_detection: {
              type: "semantic_vad",
              eagerness: "low",
              create_response: true,
              interrupt_response: true,
            },
          },
          output: {
            voice: scenario.voice || DEFAULT_VOICE,
          },
        },
        tools: [
          {
            type: "function",
            name: "terminer_exercice",
            description:
              "À appeler uniquement quand l'examinateur (toi) considère que l'entretien est terminé (objectifs couverts ou temps écoulé), juste après avoir dit une phrase de conclusion au candidat.",
            parameters: {
              type: "object",
              properties: {
                raison: {
                  type: "string",
                  description: "Motif court de la fin de l'exercice (ex: objectifs atteints, temps écoulé).",
                },
              },
              required: ["raison"],
            },
          },
        ],
        tool_choice: "auto",
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("OpenAI Realtime Session Error:", data);
    return NextResponse.json({ error: data.error?.message || "Erreur OpenAI" }, { status: response.status });
  }

  return NextResponse.json({ ...data, scenario });
}
