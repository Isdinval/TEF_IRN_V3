import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getOpenAIClient } from '@/lib/openai';
import { createClient } from '@/lib/supabase-server';
import { captureServerEvent } from '@/lib/posthog-server';

// Nombre de mots minimum par défaut si le sujet ne fournit pas min_words (cas legacy /
// entrée libre). Correspond aux seuils standards du barème TEF IRN par section.
const DEFAULT_MIN_WORDS: Record<string, number> = { A2: 40, B1: 100, B2: 100 };

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

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

// Référentiel de DÉTECTION du niveau apparent — distinct de LEVEL_GUIDELINES ci-dessus.
// LEVEL_GUIDELINES calibre la CORRECTION (quoi tolérer/signaler) relativement au niveau
// VISÉ par le sujet ; ce bloc calibre une évaluation INDÉPENDANTE de la richesse
// linguistique réellement observée dans le texte, quel que soit le sujet. Sans ce bloc,
// un texte A1 sans fautes obtenait un score de conformité proche de 100 (comportement
// voulu, cf. docs/writing-correction-levels.md règle transverse #4), ensuite mal
// réinterprété côté client comme "niveau CECRL absolu" (computeWritingLevel) -- d'où un
// niveau B2 quasi systématique dès qu'il n'y avait aucune faute, peu importe le texte.
// Toujours donné, indépendamment de effectiveLevel (contrairement à LEVEL_GUIDELINES, qui
// n'a pas d'entrée A1 -- ici A1 est un résultat possible, pas seulement un défaut vers B1).
// Statique (pas de template littéral) : ce bloc ne dépend d'aucune variable de la requête.
// Miroir du pattern déjà en prod côté Oral (RÈGLE ANTI-BIAIS, src/app/api/oral/analyze/route.ts:159),
// mais avec un résultat catégoriel direct (enum) plutôt qu'un score+seuils : suffisant ici
// car déjà protégé par WritingFeedbackSchema (z.enum ci-dessous rejette toute valeur hors liste),
// pas besoin de dupliquer le mécanisme "score brut + fonction de seuillage" de l'Oral.
const LEVEL_DETECTION_MARKERS = `
ANALYSE INDÉPENDANTE DU NIVEAU RÉELLEMENT DÉMONTRÉ (distincte de ta correction ci-dessus) :
En plus de ta notation de conformité au niveau visé, indique le niveau CECRL que ce texte
démontrerait s'il était lu SANS connaître le niveau visé.

RÈGLE ANTI-BIAIS : ignore le niveau visé pour cette partie précise de l'analyse. Base-toi
UNIQUEMENT sur les marqueurs linguistiques objectivement présents dans le texte du candidat.

MARQUEURS DE NIVEAU :
- A1 : phrases courtes juxtaposées (sujet + verbe + complément), quasi exclusivement le
  présent, connecteurs limités ("et", "mais", "si"), vocabulaire concret et basique, peu ou
  pas de développement des idées.
- A2 : structures un peu plus variées ("je voulais t'informer que...", "je voudrais..."),
  emploi du futur proche ET/OU du futur simple, message organisé répondant clairement à
  chaque point de la consigne, vocabulaire courant mais sans nuance.
- B1 : ajout d'une justification ou d'un point de vue personnel (pas seulement transmettre
  l'info), connecteurs ("comme", "donc", "parce que") utilisés pour articuler une raison,
  tournures un peu plus élaborées, expression idiomatique courante ("ça te dirait que...").
- B2 : proposition ou opinion formulée de façon indirecte et nuancée ("je pensais que...",
  "il me semble que..."), vocabulaire plus précis et moins répétitif, syntaxe plus complexe
  (subordonnées), enchaînement logique fluide entre les idées.

Détermine le niveau qui correspond le MIEUX à l'ENSEMBLE de ces marqueurs -- l'absence de
fautes ne suffit PAS à elle seule : un texte A1 sans aucune faute reste un texte A1 si sa
structure et son vocabulaire restent basiques. Fournis aussi une justification courte (1
phrase) citant un marqueur CONCRET tiré du texte du candidat (ex. "emploi du futur proche et
du futur simple, structure organisée" plutôt qu'une remarque générique).`;

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

// Sous-catégories valides par type d'erreur, alignées sur la taxonomie officielle
// des étiquettes de leçons (docs/lessons-tags-taxonomy.md) -- c'est ce qui garantit
// que la sous-catégorie remontée par l'IA pourra toujours être reliée à une vraie
// leçon (item 10.11 : rapprochement erreur -> leçon via les étiquettes). Pas de
// liste pour "orthographe" : aucune leçon de cette catégorie n'existe (choix
// assumé, l'orthographe recoupe les 4 autres catégories).
//
// Item 22 du plan "Refonte recommandation erreur -> tag -> ressource" : 29 tags
// précis promus depuis les tags d'exercices existants (ex. "adjectifs
// démonstratifs", "pronom en"/"pronom y", "déclencheurs du subjonctif"...),
// jusque-là jamais accessibles à l'IA car absents de cette liste alors qu'ils
// existaient déjà sur les leçons concernées (lessons.tags) -- validé un par un
// avec Olivier sur un critère de confusion pédagogique classique + volume
// suffisant, pas une promotion automatique de tous les tags fantômes trouvés
// par le diagnostic (item 21, ~200 tags hors taxonomie, la plupart trop
// contextuels/thématiques pour servir de sous-catégorie d'erreur).
const SOUS_CATEGORIES_BY_TYPE: Record<string, string[]> = {
  grammaire: ['accord des adjectifs', 'accord du participe passé', 'adjectifs démonstratifs', 'adverbes', 'articles', 'choix défini indéfini', 'comparatifs', 'connecteurs cause/conséquence', 'constructions participiales', 'depuis', 'distinction adjectif pronom démonstratif', 'distinction adjectif pronom possessif', 'distinction ci là', 'distinction depuis pendant il y a', 'distinction y en', "déclencheurs de l'indicatif", 'déclencheurs du subjonctif', 'démonstratifs', 'est-ce que', "familles d'articles", 'formation -ment', 'formes interrogatives', 'genre et nombre', 'il y a', 'infinitif', 'interrogation', 'inversion sujet-verbe', 'mise en relief', 'mots interrogatifs', 'nominalisation', 'nuances des connecteurs de cause', 'négation', 'négation avec infinitif', 'pendant', 'placement pronoms cod coi', 'placement pronoms y en', 'pluriel', 'possessifs', 'pronom COD', 'pronom COI', 'pronom en', 'pronom y', 'pronoms COD antéposés', 'pronoms COD/COI', 'pronoms démonstratifs', 'pronoms indéfinis', 'pronoms relatifs', 'pronoms relatifs composés', 'pronoms Y/EN', 'préférences', 'prépositions de lieu', 'prépositions de temps', 'quantités', 'registre soutenu', 'subjonctif vs indicatif', 'superlatif'],
  conjugaison: ['aller', 'avoir', 'concordance des temps', 'conditionnel passé', 'conditionnel présent', 'discours rapporté', "déclencheurs de l'indicatif", 'déclencheurs du subjonctif', 'être', 'faire', 'futur antérieur', 'futur proche', 'futur simple', 'gérondif', 'imparfait', 'impératif', 'négation', 'participe présent', 'passé composé', 'passé récent', 'plus-que-parfait', 'politesse', 'pouvoir', 'présent', 'quotidien', 'regret', 'subjonctif passé', 'subjonctif présent', 'tournures impersonnelles', 'venir', 'verbes en -er', 'verbes en -ir', 'verbes en -re', 'verbes irréguliers', 'verbes pronominaux', 'voix passive', 'vouloir'],
  vocabulaire: ['collocations', 'collocations faire passer prendre avoir', 'faux-amis', 'registre de langue', 'registre soutenu', 'types de collocations', 'vocabulaire administratif', 'vocabulaire arts', 'vocabulaire civique', 'vocabulaire culture', 'vocabulaire économie', 'vocabulaire emploi', 'vocabulaire environnement', 'vocabulaire famille', 'vocabulaire famille/logement', 'vocabulaire horaires', 'vocabulaire logement', 'vocabulaire loisirs', 'vocabulaire médias', 'vocabulaire nombres', 'vocabulaire prix', 'vocabulaire quotidien', 'vocabulaire salutations', 'vocabulaire santé', 'vocabulaire sciences', 'vocabulaire société', 'vocabulaire transports', 'vocabulaire travail', 'vocabulaire ville'],
  syntaxe: ['argumentation', 'argumentation avancée', 'compréhension écrite', 'compréhension orale', 'connecteurs cause/conséquence', 'connecteurs de but', 'connecteurs de séquence', 'connecteurs logiques complexes', 'connecteurs opposition', 'consignes et panneaux', 'correspondance', 'description', 'discours rapporté', 'est-ce que', 'expression orale', 'exprimer une opinion', 'formes interrogatives', 'hypothèses et conditions', 'interrogation', 'inversion sujet-verbe', 'mots interrogatifs', 'négation', 'ordre des mots', 'rédaction email amical', 'rédaction message simple', 'section b écrit', 'vocabulaire salutations'],
};

// Validation minimale de la réponse IA : response_format:"json_object" garantit un JSON
// valide, mais pas la présence/le type des champs attendus par le frontend (FeedbackIA,
// ZoneRedaction lisent scores_par_competence.* et liste_des_erreurs sans garde-fou et
// plantent si ces champs sont absents). On valide donc la forme avant de renvoyer.
const WritingFeedbackSchema = z.object({
  score_global: z.number(),
  scores_par_competence: z.object({
    grammaire: z.number(),
    vocabulaire: z.number(),
    coherence: z.number(),
    orthographe: z.number(),
  }),
  liste_des_erreurs: z.array(z.object({
    texte_original: z.string(),
    texte_corrige: z.string(),
    explication: z.string(),
    type_erreur: z.enum(['conjugaison', 'grammaire', 'vocabulaire', 'orthographe', 'syntaxe']),
    sous_categorie: z.string().nullable().optional(),
  })),
  conseil_general: z.string(),
  texte_corrige_complet: z.string(),
  // Niveau CECRL apparent (indépendant du niveau visé par le sujet, voir
  // LEVEL_DETECTION_MARKERS) -- distinct de score_global/scores_par_competence qui
  // mesurent la conformité au niveau VISÉ, pas le niveau réellement démontré.
  niveau_apparent_cecrl: z.enum(['A1', 'A2', 'B1', 'B2']),
  niveau_apparent_justification: z.string(),
});

// Réponse de repli, toujours conforme au schéma attendu par le frontend, utilisée à la
// fois si l'IA renvoie une forme invalide et si l'appel OpenAI échoue (catch global).
function buildFallbackFeedback(text: string, message: string) {
  return {
    score_global: 0,
    scores_par_competence: { grammaire: 0, vocabulaire: 0, coherence: 0, orthographe: 0 },
    liste_des_erreurs: [],
    conseil_general: message,
    texte_corrige_complet: text,
    niveau_apparent_cecrl: null,
    niveau_apparent_justification: null,
    error: message,
  };
}

export async function POST(req: Request) {
  let text: string = "";
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    ({ text } = body);
    const { subject, targetLevel, learnerLevel, minWords } = body;
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

    // Longueur minimale réelle du sujet (variable par scénario) plutôt que la valeur
    // générique mentionnée dans LEVEL_GUIDELINES : le score doit refléter le seuil du
    // sujet réellement choisi, pas un standard approximatif.
    const effectiveMinWords = Number(minWords) > 0
      ? Number(minWords)
      : (DEFAULT_MIN_WORDS[effectiveLevel.toUpperCase().trim()] || 100);
    const actualWordCount = countWords(text);
    const halfMinWords = Math.floor(effectiveMinWords / 2);

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

    // Exemplaires de calibration (tef_knowledge) : ancrage concret sur TOUT le spectre de
    // score (excellent/moyen/faible), pas un seul repère central -- avec un seul exemplaire,
    // le modèle a tendance à converger vers son score plutôt que d'explorer tout le barème
    // (surtout avec une température basse). Lookup déterministe par niveau (pas de
    // recherche vectorielle : le niveau recherché est toujours connu à l'avance). Best-effort :
    // la table peut être vide ou la requête échouer sans jamais bloquer la correction.
    let calibrationExemplar = "";
    try {
      const { data: exemplarRows } = await supabase
        .from('tef_knowledge')
        .select('content, metadata')
        .eq('metadata->>category', 'ee_calibration_exemplar')
        .eq('metadata->>level', normalizedTargetLevel)
        .limit(3);

      if (exemplarRows && exemplarRows.length > 0) {
        const TIER_ORDER: Record<string, number> = { excellent: 0, moyen: 1, faible: 2 };
        const sorted = [...exemplarRows].sort(
          (a, b) => (TIER_ORDER[a.metadata?.tier] ?? 99) - (TIER_ORDER[b.metadata?.tier] ?? 99)
        );
        calibrationExemplar = `\nREPÈRES DE SÉVÉRITÉ (ne pas recopier, servent uniquement à calibrer ta notation sur TOUT le barème -- positionne le candidat par interpolation entre ces 3 repères, ne convergent PAS systématiquement vers le repère "moyen" par prudence) :\n${sorted.map((r) => r.content).join('\n\n')}`;
      }
    } catch (ragError) {
      console.error("Lecture tef_knowledge échouée (non bloquant):", ragError);
    }

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
${calibrationExemplar}
${LEVEL_DETECTION_MARKERS}

CONSIGNES DE CORRECTION :
1. Analyse le texte par rapport au sujet : "${effectiveSubject}" et au niveau visé : "${effectiveLevel}", en appliquant STRICTEMENT les attentes, tolérances et interdits du référentiel ci-dessus.
1bis. LONGUEUR (à vérifier AVANT toute autre chose, ce n'est pas une note informative annexe) : le texte du candidat fait ${actualWordCount} mots ; le minimum requis pour ce sujet est ${effectiveMinWords} mots.
   - Si ${actualWordCount} < ${halfMinWords} mots (moins de 50% du minimum) : matière insuffisante pour évaluer correctement la production, quelle que soit la qualité du peu de texte produit -- comme dans les certifications de français comparables (DELF/TCF), score_global ET tous les scores_par_competence doivent être TRÈS bas (10-20). "conseil_general" doit mentionner ce point en premier, avant tout autre commentaire.
   - Si ${halfMinWords} <= ${actualWordCount} < ${effectiveMinWords} : pénalise nettement "score_global" (retire au moins 15 à 20 points par rapport à ce qu'il aurait obtenu à longueur suffisante) et mentionne explicitement le déficit de longueur dans "conseil_general", même si le reste du texte est par ailleurs correct.
   - Si ${actualWordCount} >= ${effectiveMinWords} : le seuil est atteint, ne commente PAS la longueur.
2. Identifie les erreurs selon ces catégories précises :
   - "conjugaison" : erreurs de temps, de mode ou de terminaisons verbales.
   - "grammaire" : erreurs d'accords, de pronoms, d'articles, de prépositions.
   - "syntaxe" : erreurs d'ordre des mots, de connecteurs logiques, de structure de phrase.
   - "orthographe" : fautes d'orthographe pure, accents, ponctuation.
   - "vocabulaire" : mauvais choix de mot, anglicismes, registre inadapté.
2bis. NE signale une erreur QUE s'il s'agit d'une vraie violation du français standard (accord, conjugaison, orthographe, syntaxe, mot incorrect) -- JAMAIS une préférence de style ou un choix par ailleurs valide. En particulier :
   - Le conditionnel de politesse ("je souhaiterais", "pourriez-vous", "il serait utile de") dans un texte formel est CORRECT et même recommandé -- ne JAMAIS le signaler comme une faute de conjugaison.
   - Reformuler une phrase déjà correcte pour la rendre "plus élégante" ou proposer un synonyme d'une phrase déjà juste n'est PAS une erreur -- ne l'ajoute pas à liste_des_erreurs.
   - Si le texte ne contient AUCUNE erreur réelle au sens ci-dessus, liste_des_erreurs doit être vide (ou quasi vide) -- ne fabrique jamais une erreur artificielle pour "remplir" la réponse.
2ter. Pour chaque erreur (sauf "orthographe", qui n'a pas de sous-catégorie), choisis EXACTEMENT UN mot dans la liste correspondant à son type_erreur -- jamais un mot en dehors de cette liste, jamais une formulation inventée. Si vraiment aucun mot de la liste ne correspond, mets sous_categorie à null plutôt que d'inventer.
   - grammaire : ${SOUS_CATEGORIES_BY_TYPE.grammaire.join(', ')}
   - conjugaison : ${SOUS_CATEGORIES_BY_TYPE.conjugaison.join(', ')}
   - vocabulaire : ${SOUS_CATEGORIES_BY_TYPE.vocabulaire.join(', ')}
   - syntaxe : ${SOUS_CATEGORIES_BY_TYPE.syntaxe.join(', ')}
   - orthographe : toujours null (pas de liste pour cette catégorie).
3. Pour chaque erreur, fournis l'extrait EXACT du texte original.
4. **EXPLICATION DÉTAILLÉE** : Pour chaque erreur, fournis une explication complète (2-3 phrases). Explique POURQUOI c'est une erreur, quelle est la règle de français appliquée, et donne un conseil pour ne plus la refaire.
5. Donne un score_global sur 100 et des scores_par_competence -- CHACUN AUSSI SUR 100 (même échelle 0-100, jamais un compte de fautes, jamais une note sur 10). score_global doit être COHÉRENT avec ces 4 sous-scores : à quelques points près, il reflète leur moyenne pondérée par la gravité des erreurs trouvées -- jamais une valeur déconnectée. Un texte dont liste_des_erreurs est vide ou quasi vide doit avoir des scores_par_competence ET un score_global élevés (85-100), jamais l'inverse (sous-scores bas + score_global haut, ou l'inverse, sont tous les deux des incohérences à éviter).
6. Fournis un conseil général structuré et motivant. Si liste_des_erreurs est vide ou quasi vide, "conseil_general" doit être une simple validation/encouragement sincère (ex. : féliciter la clarté, la structure, l'adéquation au sujet) -- ne JAMAIS y glisser une suggestion d'amélioration ("travaillez les accords", "variez les connecteurs"...) qui ne correspond à AUCUNE erreur réellement listée : ce serait contredire ton propre score_global élevé et ta propre liste_des_erreurs vide.
7. Détermine "niveau_apparent_cecrl" et "niveau_apparent_justification" en appliquant STRICTEMENT la section "ANALYSE INDÉPENDANTE DU NIVEAU RÉELLEMENT DÉMONTRÉ" ci-dessus -- cette évaluation est SÉPARÉE de ta correction (elle peut donner un niveau différent du niveau visé, y compris quand score_global est élevé : un texte simple et parfaitement correct pour un niveau A2 reste un niveau apparent A2, pas B2).

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
      "type_erreur": "conjugaison" | "grammaire" | "vocabulaire" | "orthographe" | "syntaxe",
      "sous_categorie": "un mot EXACT de la liste correspondante ci-dessus, ou null"
    }
  ],
  "conseil_general": "string",
  "texte_corrige_complet": "string",
  "niveau_apparent_cecrl": "A1" | "A2" | "B1" | "B2",
  "niveau_apparent_justification": "string (1 phrase, cite un marqueur concret du texte)"
}

IMPORTANT : Ne fournis PAS d'index de position. Concentre-toi sur le fait que "texte_original" soit une chaîne de caractères EXACTEMENT présente dans le texte fourni.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2, // Correction notée : on veut de la constance, pas de créativité.
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Texte du candidat : "${text}"` }
      ],
      response_format: { type: "json_object" }
    });

    const rawData = JSON.parse(response.choices[0].message.content || '{}');
    const parsed = WritingFeedbackSchema.safeParse(rawData);

    if (!parsed.success) {
      console.error("Réponse IA invalide (schéma inattendu):", parsed.error.flatten());
      return NextResponse.json(
        buildFallbackFeedback(text, "La correction n'a pas pu être générée correctement. Merci de réessayer."),
        { status: 200 }
      );
    }

    // Application déterministe du seuil "matière insuffisante" (<50% du minimum de mots).
    // La consigne 1bis du prompt demande déjà ceci, mais observée 2 fois en test réel à ne
    // PAS être respectée (score renvoyé au-dessus de 20, longueur absente de conseil_general)
    // -- alors que actualWordCount/halfMinWords sont connus avec certitude côté serveur, sans
    // dépendre du jugement du modèle. On corrige donc ici plutôt que d'espérer une meilleure
    // obéissance au prompt sur une règle purement mécanique.
    const finalData = {
      ...parsed.data,
      scores_par_competence: { ...parsed.data.scores_par_competence },
    };

    // Garde-fou déterministe (item 10.12) : même consigné dans le prompt, l'IA peut
    // s'écarter de la liste officielle -- on ne lui fait donc pas confiance à l'aveugle,
    // même principe que les autres garde-fous serveur de cette route. Toute sous_categorie
    // hors de la liste valide pour son type_erreur est ramenée à null plutôt que de laisser
    // passer un mot qui ne correspondra jamais à une leçon (item 10.11).
    finalData.liste_des_erreurs = finalData.liste_des_erreurs.map((erreur) => {
      const validList = SOUS_CATEGORIES_BY_TYPE[erreur.type_erreur];
      const isValid = erreur.sous_categorie && validList?.includes(erreur.sous_categorie);
      return { ...erreur, sous_categorie: isValid ? erreur.sous_categorie : null };
    });
    const isInsufficientLength = actualWordCount < halfMinWords;
    if (isInsufficientLength) {
      finalData.score_global = Math.min(finalData.score_global, 20);
      for (const key of Object.keys(finalData.scores_par_competence) as (keyof typeof finalData.scores_par_competence)[]) {
        finalData.scores_par_competence[key] = Math.min(finalData.scores_par_competence[key], 20);
      }
      if (!/mots|longueur/i.test(finalData.conseil_general)) {
        finalData.conseil_general = `Ce texte est bien en dessous de la longueur minimale requise (${actualWordCount} mots sur ${effectiveMinWords} attendus), ce qui limite fortement l'évaluation. ${finalData.conseil_general}`;
      }
    }

    // Garde-fou d'observabilité (non bloquant) : score_global et scores_par_competence sont
    // censés être sur la même échelle 0-100 et cohérents entre eux (cf. consigne 5 du prompt).
    // On loggue si un écart important survient malgré cette consigne, pour pouvoir suivre si
    // le problème réapparaît -- sans jamais modifier ni bloquer la réponse renvoyée.
    const competenceValues = Object.values(finalData.scores_par_competence);
    const competenceAverage = competenceValues.reduce((sum, v) => sum + v, 0) / competenceValues.length;
    if (Math.abs(finalData.score_global - competenceAverage) > 25) {
      console.warn(
        `Incohérence de score détectée : score_global=${finalData.score_global} vs moyenne scores_par_competence=${competenceAverage.toFixed(1)}`,
        finalData.scores_par_competence
      );
    }

    await captureServerEvent(user.id, "writing_correction_completed", {
      target_level: effectiveLevel,
      word_count: actualWordCount,
      minimum_word_count: effectiveMinWords,
      score: finalData.score_global,
      is_insufficient_length: isInsufficientLength,
    });

    return NextResponse.json(finalData);
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json(
      buildFallbackFeedback(text, "Erreur lors de l'analyse IA. Merci de réessayer dans quelques instants."),
      { status: 200 }
    );
  }
}
