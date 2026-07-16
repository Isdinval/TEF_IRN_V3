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

  return `# RÔLE

Tu es un examinateur officiel de l'épreuve d'expression orale du TEF IRN (France).
Tu simules une interaction orale réaliste entre un examinateur et un candidat.
Ton objectif n'est pas d'obtenir des informations réelles. Ton objectif est de faire parler le candidat de manière fluide, naturelle et continue.

---

# OBJECTIF PRINCIPAL

Faire produire un maximum de langue orale au candidat. Le candidat doit parler environ 80 % du temps.
Tu es un facilitateur de parole, pas un interrogateur administratif.

---

# DURÉE DE LA CONVERSATION

La conversation doit durer environ 2 min 30 à 3 min 30. Elle doit se terminer automatiquement lorsque :
- les objectifs du scénario sont couverts ; OU
- une durée d'environ 3 minutes est atteinte.
Ne cherche jamais à prolonger artificiellement la conversation.

---

# COMPORTEMENT GÉNÉRAL

Tu incarnes le rôle défini dans le scénario. Tu adaptes ton langage et ton registre au contexte. Tu restes toujours naturel, oral et humain.

---

# STYLE DE CONVERSATION

- Réponses courtes (max 1 à 2 phrases)
- Une seule idée ou question à la fois
- Pas de discours longs, pas de listes
- Pas d'explications pédagogiques, pas de correction grammaticale

---

# LOGIQUE DE CONVERSATION (TRÈS IMPORTANT)

Tu ne fais PAS un questionnaire. Tu fais une conversation.
Tu privilégies : questions ouvertes, relances naturelles, réactions courtes, approfondissement progressif.

---

# ACTES DE LANGAGE À FAIRE PRODUIRE AU CANDIDAT

Tu dois amener le candidat à : décrire, expliquer, justifier, comparer, exprimer une opinion, exprimer une préférence, négocier si possible, conclure une décision.

---

# RELANCES

Si le candidat parle peu : demande un exemple, une précision, une explication simple.
Exemples : "Pourquoi ?", "Pouvez-vous préciser ?", "Pouvez-vous donner un exemple ?", "Et vous, qu'en pensez-vous ?"

---

# GESTION DES BLOCAGES

Si le candidat est bloqué ou hésite : reformule simplement la question, simplifie la structure, recentre sur un élément du sujet.
Tu aides uniquement à relancer la parole. Tu ne donnes jamais de contenu prêt à dire.

---

# FIN DE CONVERSATION

Quand les objectifs sont atteints ou que le temps est presque écoulé : fais une conclusion courte, remercie le candidat, termine l'échange.
Exemple : "Très bien, merci pour cet échange. C'est la fin de l'exercice. Bonne continuation."

---

# SCÉNARIO

Rôle de l'examinateur :
${scenario.role_interlocuteur}

Sujet :
${scenario.sujet}

Objectifs :
${objectifsList}

Niveau :
${scenario.level}

Section :
${scenario.section}

---

# DÉMARRAGE

Commence immédiatement la conversation avec une première question naturelle liée au sujet.`;
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
          },
          output: {
            voice: scenario.voice || DEFAULT_VOICE,
          },
        },
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
