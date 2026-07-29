import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import { createClient } from '@/lib/supabase-server';

// Référentiel condensé par niveau CECRL — source détaillée : docs/writing-correction-levels.md
// Objectif : éviter (1) une correction trop sévère/littéraire pour un niveau A2/B1,
// (2) une correction trop laxiste pour un niveau B2.
const LEVEL_GUIDELINES: Record<string, string> = {
  A2: `
NIVEAU CIBLE : A2 (Carte de séjour pluriannuelle) — message court, 40 mots min.
- Attentes évaluées : présent, passé composé, futur proche, accords de base (sujet-verbe, déterminant-nom-adjectif).
- Priorité de signalement : uniquement les erreurs qui gênent la compréhension du message, les fautes de conjugaison sur les verbes fréquents (être/avoir/aller/faire + 1er groupe) et les accords de base manquants.
- TOLÉRER sans les signaler : phrases courtes/juxtaposées, répétitions de mots simples, absence de connecteurs élaborés, vocabulaire limité mais compréhensible.
- INTERDIT : ne jamais suggérer subjonctif, conditionnel complexe, connecteurs soutenus ("néanmoins", "quand bien même"), synonymes recherchés/littéraires, ou commenter le "style"/la "richesse" du texte.
- Ton des explications : phrases courtes, une règle à la fois, vocabulaire simple, pas de jargon grammatical savant.`,
  B1: `
NIVEAU CIBLE : B1 (Carte de résident) — texte argumentatif/motivation, 100 mots min.
- Attentes évaluées : contraste imparfait/passé composé, expression de l'opinion et justification, connecteurs logiques simples (donc, cependant, par contre, d'abord/ensuite/enfin), début de structuration (intro/développement/conclusion courte).
- Priorité de signalement : erreurs de conjugaison sur les temps du passé/futur, accords (dont participe passé avec "avoir" dans les cas simples), incohérences dans l'enchaînement des idées. Regrouper les erreurs répétées identiques en une seule explication.
- TOLÉRER sans les signaler : tournures encore un peu lourdes tant que le message est clair, vocabulaire simple répété mais correct. Un texte simple et correct n'est PAS une faute à ce niveau.
- INTERDIT : ne jamais exiger le subjonctif imparfait, des tournures littéraires, ou un vocabulaire rare/technique/livresque.
- Ton des explications : un peu plus détaillé qu'à A2, la règle peut être nommée simplement, toujours avec un exemple tiré du texte du candidat.`,
  B2: `
NIVEAU CIBLE : B2 (Naturalisation) — texte argumentatif/motivation, 100 mots min.
- Attentes évaluées : précision des accords (y compris participe passé avec "être"/pronominaux), subordonnées relatives/complétives simples, connecteurs logiques variés mais courants (cependant, en revanche, ainsi, par conséquent), registre adapté à un texte formel, nuance dans l'argumentation.
- Priorité de signalement : erreurs de précision grammaticale du champ B2, manque de cohérence/nuance dans l'argumentation, registre trop familier, vocabulaire imprécis quand une alternative COURANTE existe.
- TOLÉRER sans les signaler : un style encore simple tant que le texte est précis et bien articulé — B2 évalue la précision et la cohérence, pas la sophistication littéraire.
- INTERDIT MÊME À CE NIVEAU : ne jamais suggérer de vocabulaire soutenu/livresque hors usage courant, ne jamais réécrire une phrase déjà correcte juste pour la rendre "plus élégante", ne jamais introduire de figures de style. Le TEF IRN n'est pas un examen de littérature.
- Ton des explications : plus fin qu'à B1, peut nommer des notions grammaticales usuelles (subordonnée, pronom relatif), mais reste pédagogique, jamais un cours de linguistique.`,
};

function getLevelGuidelines(level: string): string {
  const normalized = level.toUpperCase().trim();
  return LEVEL_GUIDELINES[normalized] || LEVEL_GUIDELINES['B1'];
}

// Le barème EE du TEF IRN ne couvre que A2/B1/B2 (sections A et B). Le profil de
// l'apprenant (current_level) peut lui être A1 à C2 : on ramène ces bornes vers
// le niveau EE le plus proche (A1 -> A2, C1/C2 -> B2) pour pouvoir le comparer
// au niveau du sujet choisi.
const EE_LEVEL_ORDER = ['A2', 'B1', 'B2'];

function normalizeToEEScale(level?: string | null): string | null {
  if (!level) return null;
  const normalized = level.toUpperCase().trim();
  if (normalized === 'A1') return 'A2';
  if (normalized === 'C1' || normalized === 'C2') return 'B2';
  return EE_LEVEL_ORDER.includes(normalized) ? normalized : null;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { text, subject, targetLevel, learnerLevel } = body;
    const openai = getOpenAIClient();

    if (!openai) {
      return NextResponse.json({ error: "OpenAI API Key non configurée" }, { status: 500 });
    }

    if (!text) {
      return NextResponse.json({ error: "Texte manquant" }, { status: 400 });
    }

    const effectiveSubject = subject || "Sujet libre";
    const effectiveLevel = targetLevel || "B1";
    const levelGuidelines = getLevelGuidelines(effectiveLevel);

    // Écart profil apprenant / niveau du sujet : le sujet fait TOUJOURS foi pour la
    // correction (barème inchangé). Seul cas particulier : l'apprenant est en dessous
    // du niveau du sujet choisi -> on ajoute une phrase de contextualisation dans le
    // conseil général. Dans le cas inverse (apprenant au-dessus, ex. révision d'un
    // niveau déjà acquis), aucune mention particulière : c'est un usage normal.
    const normalizedLearnerLevel = normalizeToEEScale(learnerLevel);
    const normalizedTargetLevel = normalizeToEEScale(effectiveLevel) || effectiveLevel;
    const learnerBelowTarget =
      normalizedLearnerLevel !== null &&
      EE_LEVEL_ORDER.indexOf(normalizedLearnerLevel) < EE_LEVEL_ORDER.indexOf(normalizedTargetLevel);

    const levelGapInstruction = learnerBelowTarget
      ? `\nCONTEXTE APPRENANT : le niveau de l'apprenant (${learnerLevel}) est en dessous du niveau visé par ce sujet (${effectiveLevel}). Corrige et note STRICTEMENT selon le niveau du sujet (${effectiveLevel}), sans rien assouplir. Ajoute uniquement, dans "conseil_general", 1 phrase bienveillante qui resitue l'écart (ex. : ce sujet est plus exigeant que son niveau actuel, et quels points travailler avant d'y revenir) — sans décourager.`
      : "";

    const systemPrompt = `
Tu es un examinateur expert du TEF IRN (format 2025), spécialisé dans l'évaluation de l'expression écrite pour les niveaux A2 à B2.
Ta mission est de fournir une correction EXTRÊMEMENT détaillée, pédagogique et complète de la production d'un candidat.

OBJECTIF :
- Fournir une analyse approfondie qui aide réellement le candidat à comprendre ses erreurs.
- Adapter STRICTEMENT ton niveau d'exigence au niveau visé ci-dessous — jamais au-dessus (ça décourage inutilement), jamais en-dessous (ça ne prépare pas à l'examen).
- Ne JAMAIS proposer de correction "littéraire" : reste toujours dans le français courant, adapté au niveau visé. Le TEF IRN évalue une communication fonctionnelle, pas un style d'écrivain.
- Détecte les erreurs récurrentes et les points de blocage.

${levelGuidelines}
${levelGapInstruction}

CONSIGNES DE CORRECTION :
1. Analyse le texte par rapport au sujet : "${effectiveSubject}" et au niveau visé : "${effectiveLevel}", en appliquant STRICTEMENT les attentes, tolérances et interdits du référentiel ci-dessus.
2. Identifie les erreurs selon ces catégories précises :
   - "conjugaison" : erreurs de temps, de mode ou de terminaisons verbales.
   - "grammaire" : erreurs d'accords, de pronoms, d'articles, de prépositions.
   - "syntaxe" : erreurs d'ordre des mots, de connecteurs logiques, de structure de phrase.
   - "orthographe" : fautes d'orthographe pure, accents, ponctuation.
   - "vocabulaire" : mauvais choix de mot, anglicismes, registre inadapté.
3. Pour chaque erreur, fournis l'extrait EXACT du texte original.
4. **EXPLICATION DÉTAILLÉE** : Pour chaque erreur, fournis une explication complète (2-3 phrases). Explique POURQUOI c'est une erreur, quelle est la règle de français appliquée, et donne un conseil pour ne plus la refaire.
5. Donne un score global sur 100 et des scores détaillés par compétence.
6. Fournis un conseil général structuré et motivant.

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
      "explication": "Explication longue et détaillée de la règle grammaticale ou syntaxique. Pourquoi est-ce faux ? Quelle est la règle précise ? Comment s'en souvenir ?",
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
