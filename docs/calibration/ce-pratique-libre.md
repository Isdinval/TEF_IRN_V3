# Pratique libre CE — sujets autonomes (`ce_scenarios`)

**Périmètre** : la page `/tef-irn/comprehension-ecrite` permet de s'entraîner à la Compréhension Écrite
**hors Examen Blanc**, par format de texte et par niveau. Ce document fige le modèle de données, les règles
de contenu et la procédure pour ajouter des sujets. Les règles des questions des **Examens Blancs**
(`exam_questions`) sont dans [ce-content-calibration-rules.md](./ce-content-calibration-rules.md).

## 1. Modèle de données

| Table | Rôle |
|---|---|
| `ce_scenarios` | Un sujet : `format`, `level`, `title`, `texte` (ou `sub_texts` pour `multi_texte`), `is_active` |
| `ce_scenario_questions` | Les questions d'un sujet : `question`, `options` (4, préfixées `A) `…), `correct_answer` (lettre), `explanation`, `highlight_gap` (trous) |
| `ce_scenario_attempts` | Réponses des utilisateurs (FK vers `ce_scenario_questions` **sans** `ON DELETE CASCADE`) |

- `format` est contraint (`CHECK`) à : `court`, `trous`, `multi_texte`, `long_admin`, `article_presse`.
- `level` est un texte libre, **sans contrainte** : la convention est **`A2`, `B1` ou `B2` uniquement**
  (les plages `A2-B1` / `B1-B2` restent réservées aux Examens Blancs).
- Pour supprimer des sujets : **purger d'abord `ce_scenario_attempts`** des questions concernées (sinon la FK bloque).
- Les nouveaux sujets n'ont pas de `source_exam_id` (seuls les sujets migrés des Examens Blancs en avaient).

## 2. Pages et API

- `src/app/tef-irn/comprehension-ecrite/page.tsx` — catalogue avec filtres format et niveau (niveaux triés A2, B1, B2).
- `src/app/tef-irn/comprehension-ecrite/[scenarioId]/page.tsx` — une question à la fois, texte du sujet toujours
  affiché, **consigne propre au format** au-dessus de la question (constante `FORMAT_CONSIGNES`, reprise des
  consignes de l'Examen Blanc).
- `POST /api/comprehension/complete` — correction et enregistrement des réponses, **après contrôle du quota** (429 sinon).
- `POST /api/comprehension/check` — contrôle du quota en lecture seule (aucun incrément), avec `scenarioId` à l'ouverture d'un sujet, sans `scenarioId` pour le badge des catalogues.

### Quota freemium (CE et CO)

- **Gratuit : 1 sujet CE + 1 sujet CO par jour** ; Essentiel, Premium, Super Premium : illimité. Constante unique : `FREE_DAILY_SCENARIOS` dans `src/lib/comprehension-quota.ts`.
- **Unité = le sujet** (5 questions) : compte des sujets distincts ayant au moins une tentative aujourd'hui (jour UTC, comme `ai_usage_daily`), dérivé de `ce_scenario_attempts` / `co_scenario_attempts` — aucun compteur à incrémenter. Un sujet commencé se termine toujours ; rejouer un sujet déjà entamé ne consomme rien.
- **Le verrou réel est `/complete`** (seul point qui délivre `correct_answer` / `explanation`). Le contrôle à l'ouverture et l'écran `ComprehensionQuotaBlocked` ne sont que de l'UX : `ce_scenarios` / `co_scenarios` restent lisibles par tous (RLS `select to public`).
- Erreur de requête sur le contrôle : **fail-open** (la pratique n'est pas cassée), erreur loguée `Comprehension quota check failed`.
- Wording : `Pricing.tsx` et `TIER_FEATURES` (`src/lib/entitlements.ts`) — Gratuit « 1 sujet de Compréhension Écrite et 1 de Compréhension Orale par jour », paliers payants « Compréhension Écrite & Orale illimitée ».
- **Événements PostHog** : `comprehension_scenario_started` (serveur, à chaque ouverture autorisée, tous paliers — pas un compte de sujets distincts), `comprehension_quota_reached` (serveur, propriété `source` = `check` ou `complete` ; filtrer sur `check` pour compter les personnes bloquées), `comprehension_paywall_cta_clicked` (client, clic « Voir les abonnements » de l'écran de blocage). Propriété `skill` = `CE` ou `CO` partout.

## 3. Règles de contenu

**Volume** : un sujet a **exactement 5 questions**. Objectif atteint : **5 sujets par couple niveau × format**
(3 niveaux × 5 formats = 75 sujets, 375 questions).

**Une question est toujours une vraie interrogative** (finit par « ? », se lit seule). Bug corrigé le 2026-09-21 :
une situation nue en `multi_texte` ne dit pas au candidat quoi faire.

| Format | 5 questions | Consigne affichée |
|---|---|---|
| `court` | 1 générale + 3 détail + 1 synthèse | Lisez attentivement le texte et répondez à la question. |
| `trous` | 1 lacune = 1 question ; un seul texte à 5 lacunes `___________ (n)` | Lisez le texte et choisissez le mot qui complète la lacune indiquée. |
| `multi_texte` | situation + contrainte discriminante + interrogative (« …Quelle offre peut me convenir ? ») | Lisez les documents et répondez à la question. |
| `long_admin` | objet, obligation, procédure, condition, délai / pièces | Lisez attentivement le document et répondez à la question. |
| `article_presse` | constat, cause, avantage, frein, réserve | Lisez attentivement l'article et répondez à la question. |

**Longueur du texte (mots)** — `court` validé ; les autres formats sont des extensions à ajuster :

| Niveau | court | trous / long_admin / article_presse | multi_texte (par sous-texte) |
|---|---|---|---|
| A2 | 60-100 | 90-140 | 25-45 |
| B1 | 120-180 | 150-220 | 35-65 |
| B2 | 180-250 | 220-320 | 55-95 |

**Qualité des options** (défauts réels constatés puis corrigés) :

- Bonne réponse **jamais la plus longue dans plus de 2 questions sur 5** (défaut initial : 4 sur 5).
- Pas de distracteur absolu (« totalement », « jamais », « aucun »…) : éliminable sans lire le texte.
- Bonnes réponses réparties sur **au moins 3 lettres**, jamais plus de 2 fois la même dans un sujet.
- Reformuler : la bonne réponse ne cite pas le texte mot pour mot ; en `multi_texte`, ne pas reprendre le mot du label dans la question.
- `trous` : **test de substitution** — chaque distracteur doit rendre la phrase inacceptable (pièges vus :
  « a envisagé / a parlé de », « veut / peut / doit »). Vérifier aussi que le subjonctif et l'indicatif ne se confondent pas (verbes en -er).
- `multi_texte` : au moins 3 sous-textes différents visés, jamais le même plus de 2 fois.
- Chaque question a une `explanation` non vide.

## 4. Procédure pour ajouter des sujets

Utiliser le skill Claude **`llamakusi-ce-scenario-content`** (maintenu hors dépôt) :

1. Rédiger le JSON compact (1 lot = 1 niveau) selon les règles ci-dessus.
2. `scripts/validate_content.py` — bloque niveau ≠ A2/B1/B2, question sans « ? », biais de longueur, répartition
   des lettres, `multi_texte` mal formé ; avertit sur distracteurs absolus, modaux interchangeables, longueur hors cible.
3. `scripts/build_sql.py` — génère le SQL (jamais écrit à la main).
4. Assembler une migration `supabase/migrations/<horodatage>_ce_scenarios_<lot>.sql` **avec garde-fou d'idempotence**
   (`DO $$ … RAISE EXCEPTION … $$` sur le titre du 1er sujet), la tester sur une base locale au schéma identique.
5. Exécution **manuelle** dans le SQL Editor Supabase (jamais via un connecteur), puis contrôle en base
   (`select level, format, count(*) from ce_scenarios group by 1,2`).

Avant d'ajouter un sujet, vérifier que son thème n'existe pas déjà (catalogue ci-dessous).

## 5. Catalogue actuel (75 sujets)

| Niveau · format | Sujets |
|---|---|
| A2 · court | Changement d'horaires sur la ligne 12 · Collecte des encombrants · Une sortie scolaire au musée · Règles de la piscine municipale · Horaires de la mairie pendant les vacances |
| A2 · trous | Un message pour mon propriétaire · Une candidature par e-mail · Une invitation pour un anniversaire · Un mot pour ma voisine · Un message pour prendre rendez-vous |
| A2 · multi_texte | Quatre services de santé près de chez vous · Quatre activités de sport et de loisirs · Quatre offres d'emploi · Quatre petites annonces · Quatre activités pour les enfants |
| A2 · long_admin | Inscription à la cantine scolaire · Coupure d'eau dans le quartier · Un colis à retirer à la poste · Un rendez-vous à la banque · Inscription à un cours de français |
| A2 · article_presse | Une nouvelle bibliothèque dans le quartier · Un marché de producteurs en centre-ville · La fête de quartier · Un tournoi de football pour les jeunes · Un nouveau parc pour les enfants |
| B1 · court | Nouvelle organisation des congés d'été · Consignes avant une prise de sang · Perturbations sur la ligne de train · Échanges et remboursements en magasin · Le tri des déchets dans la résidence |
| B1 · trous | Une ville qui verdit ses trottoirs · Reprendre des cours de français · Bouger au quotidien · Gérer son budget · Le bénévolat dans les associations |
| B1 · multi_texte | Quatre gestes pour son quartier · Quatre annonces de logement · Quatre sorties culturelles ce week-end · Quatre cours du soir · Quatre modes de garde pour jeunes enfants |
| B1 · long_admin | Travaux de rénovation dans la résidence · Dossier de remboursement incomplet · Confirmation d'embauche · Inscription à un club sportif · Convocation à un examen de français |
| B1 · article_presse | Les toits végétalisés progressent en ville · Des permanences pour les démarches en ligne · Le sommeil des adolescents · Les librairies indépendantes résistent · Moins gaspiller la nourriture |
| B2 · court | Consultation sur la place du Marché · Nouveau calendrier à l'école · Nouvelle organisation des urgences · Mots de passe : nouvelle politique de sécurité · L'entretien annuel d'évaluation |
| B2 · trous | La colocation entre générations · Les économies d'énergie à la maison · Le télétravail : un bilan nuancé · Lire à l'ère du numérique · L'intelligence artificielle au travail |
| B2 · multi_texte | Quatre dispositifs pour évoluer professionnellement · Quatre façons de s'engager dans sa commune · Quatre offres d'abonnement internet et mobile · Quatre services pour être aidé dans ses démarches · Quatre façons de voyager jusqu'à la capitale |
| B2 · long_admin | Inscription administrative à l'université · Aide municipale à l'achat d'un vélo · Réponse d'un assureur après un dégât des eaux · Report ou annulation d'une inscription à une formation · Autorisation de travaux : réponse de la mairie |
| B2 · article_presse | Réparer plutôt que racheter · Les écrans chez les jeunes enfants · Vieillir chez soi · Le tourisme de masse : les habitants à bout · La mode rapide : le prix caché des vêtements |

Tous les textes sont **fictifs** (aucun montant, délai ou règle juridique réel).

## 6. Limites connues (état au 2026-09-21)

- **Compréhension Orale non alignée** : `co_scenarios` conserve les niveaux composites hérités des Examens Blancs
  (`A2-B1`, `B1`, `B1-B2`). Décision prise d'aligner aussi la CO sur A2 / B1 / B2, mais dans un chantier ultérieur.
- **Quota du jour remis à zéro à minuit UTC** (1 h ou 2 h à Paris), aligné sur `ai_usage_daily` ; un utilisateur peut aussi lire le texte de plusieurs sujets sans répondre (aucune correction délivrée, donc sans valeur).
- **Répartition des bonnes réponses légèrement inégale** sur le catalogue (A 96 · B 116 · C 88 · D 75) : à
  compenser (davantage de D) dans les prochains lots.
