# Base de Données & SRS - LlamaKusi

> Régénéré le 07/09/2026 directement depuis le schéma live du projet Supabase
> (`jksrmyyfllitrkarvgvk`), pas depuis une lecture de migrations — 37 tables en
> `public`, RLS activée sur toutes. L'ancienne version de ce document (et son
> doublon `DATABASE_AND_SRS_new.md`, supprimé) ne couvrait que 11 tables sur 37 :
> tout le module Examen Civique, la gamification, le coach IA et les tables
> d'administration/tracking en étaient absents.

LlamaKusi utilise Supabase (PostgreSQL 17) pour la persistance des données et implémente
**trois systèmes de répétition espacée (SRS) parallèles** — un par domaine de contenu —
pour optimiser la mémorisation.

## 1. Schéma de la base de données, par domaine

### 1.1 Profil, gamification & suivi transverse

| Table | Rôle |
|---|---|
| `profiles` | Identité, niveau courant/objectif, XP, streak, mode d'apprentissage (`libre`/`academique`), abonnement (`free`/`premium`), crédits IA, `is_admin` |
| `leagues` | Paliers de ligues (nom, `min_xp`, couleur) pour le classement gamifié |
| `weekly_challenges` / `user_challenges` | Défis hebdomadaires et progression par utilisateur (`current_progress`, `is_completed`) |
| `user_streaks` | Série de jours consécutifs (`current_streak`, `longest_streak`) — distincte de `profiles.streak_count`, à ne pas confondre |
| `study_activity` | Minutes étudiées par jour (`user_id`, `activity_date`) — alimente le heatmap d'activité du dashboard |
| `user_preferences` | Préférences de notification (email, push, fréquence) |
| `admin_actions_log` | Journal des actions admin (promotion, reset progression, suppression compte) |
| `ai_usage_daily` | Compteur d'appels IA par utilisateur/route/jour — base du rate limiting (`check_and_increment_ai_usage`) |

### 1.2 Contenu pédagogique TEF IRN (parcours, leçons, exercices)

| Table | Rôle |
|---|---|
| `parcours` | Un parcours = (niveau A1-B2 × catégorie grammaire/vocabulaire/conjugaison/syntaxe/orthographe), nommé selon le référentiel CECRL officiel |
| `lessons` | Contenu théorique, avec `tags`, `vocab_theme_categories`, compteurs `have_qcm`/`have_trous`/`have_qcm_centre_entrainement` maintenus par trigger |
| `exercises` | Types actifs dans la contrainte `CHECK` : `qcm`, `trous`, `association`, `reformulage`, `ecrit`, `oral`, `qcm_centre_entrainement` — **seuls `qcm`, `trous` et `qcm_centre_entrainement` sont consommés par le moteur de recommandation** (voir §3) |
| `lesson_progress` | Leçons marquées terminées par un utilisateur |
| `user_parcours_progress` | Avancement par parcours (`status`, `progress_percentage`, `current_lesson_id`) |
| `exercise_attempts` | Historique des tentatives, alimenté exclusivement via `POST /api/exercise-complete` |
| `user_errors` | Compteur de fréquence d'erreur par catégorie — source du moteur de recommandation |
| `recommendations` | Recommandations générées à partir de `user_errors`, plafonnées à 3 `pending` par utilisateur |
| `vocabulary` | Mots du module SRS vocabulaire (indépendant des `exercises`) |
| `guides` | Guides SEO publics, partagés entre les deux produits via `product` (`tef-irn` / `examen-civique`) et `silo_role` (`hub`/`pilier`/`satellite`) |

### 1.3 Simulations d'examen (hors SRS — voir `docs/architecture/exam-scenarios.md`)

| Table | Rôle |
|---|---|
| `exams` / `exam_questions` | Examens blancs complets (CE/CO/EE/EO), avec sous-formats dédiés CE (`ce_format`) et CO (`co_format`) |
| `exam_ce_co_attempts` | Réponses individuelles aux questions CE/CO d'un examen blanc |
| `oral_exam_scenarios` / `oral_session_results` | Catalogue + résultats des simulations orales (`context`: `standalone` ou `exam`) |
| `writing_exam_scenarios` / `writing_scenario_attempts` | Catalogue + résultats des simulations écrites, avec `niveau_apparent_cecrl` estimé par l'IA |

### 1.4 Coach IA (chat + RAG)

| Table | Rôle |
|---|---|
| `chat_sessions` / `chat_messages` | Historique des conversations avec le coach |
| `coach_generated_exercises` | Exercices générés à la volée par le coach, rattachés à une session/un message |
| `tef_knowledge` / `documents_embeddings` | Base RAG (colonne `vector`, extension `pgvector`) interrogée via `match_tef_knowledge()` / `match_knowledge_for_coach()` |
| `ai_feedback` | Feedback détaillé (annotations, score, niveau estimé) rattaché à un `exercise_attempts` |

### 1.5 Examen Civique (produit distinct, `src/app/examen-civique/`)

| Table | Rôle |
|---|---|
| `civic_questions` | QCM civique, classé par `theme` (principes/valeurs, système politique, droits/devoirs, histoire/géo/culture, vivre en société) et `mentions` (CSP/CR/naturalisation) |
| `user_civic_reviews` | SRS dédié — mirror exact de `user_vocabulary_reviews`, sur `question_id` |
| `civic_exam_attempts` | Résultat d'un examen blanc civique (40 questions, `mention` visée, `passed`) |
| `centres_examen_civique` | Annuaire des centres d'examen (248 lignes), géolocalisé (`latitude`/`longitude`) pour la carte |

## 2. Spaced Repetition System (SRS) — trois systèmes parallèles

LlamaKusi implémente une variante de l'algorithme **SM-2**, avec la **même logique dupliquée
trois fois** — une table + un moteur par domaine de contenu, jamais de table SRS partagée :

| Domaine | Table SRS | Moteur | Client/Serveur |
|---|---|---|---|
| Exercices (parcours) | `user_reviews` | `updateSRS()` — `src/lib/srs-engine-server.ts` | Serveur uniquement, appelé depuis `POST /api/exercise-complete` |
| Vocabulaire | `user_vocabulary_reviews` | `updateVocabularySRS()` — `src/lib/srs-engine.ts` | Client uniquement, appelé depuis `vocab/page.tsx` |
| Examen Civique | `user_civic_reviews` | `updateCivicSRS()` — `src/lib/civic-srs-engine.ts` | Client uniquement, appelé depuis `examen-civique/entrainement/page.tsx` |

### Paramètres SRS (communs aux trois)

- **Ease Factor** : multiplicateur (défaut 2.5) qui ajuste l'intervalle
- **Intervalle** (`interval_days`) : nombre de jours avant la prochaine révision
- **Consecutive Correct** : nombre de réussites d'affilée

### Logique de mise à jour (identique dans les 3 moteurs)

1. **Réussite** : intervalle multiplié par l'ease factor, ease +0.1
2. **Échec** : intervalle réinitialisé à 1 jour, ease -0.2

### Pourquoi trois fichiers séparés et jamais fusionnés

- **Frontière client/serveur** : `srs-engine.ts` (client, `vocab/page.tsx`) et `srs-engine-server.ts`
  (serveur, `@/lib/supabase-server` via `next/headers`) ne peuvent pas cohabiter dans un seul
  fichier — un composant client qui importerait la fonction serveur casse le build Next.js
  (`next/headers` non bundlable côté client).
- **`civic-srs-engine.ts`** suit le même pattern client que `srs-engine.ts` (pas de variante
  serveur à ce jour, car l'entraînement civique n'a pas de point d'entrée serveur équivalent
  à `POST /api/exercise-complete`).

**Piège à ne pas réintroduire** : ne jamais fusionner ces trois fichiers, même partiellement.

### Vue agrégée : `get_due_srs_reminders()`

Fonction RPC qui retourne, par utilisateur, le nombre d'items dus dans les **trois** systèmes
(`due_exercises_count`, `due_vocab_count`, `due_civic_count`) — utilisée par le job de rappels
email (`RESEND_API_KEY`, voir `/api/cron/srs-reminders`).

## 3. Moteur de recommandation (exercices uniquement — pas de portée SRS-transverse)

### Écriture (déclenchée à chaque tentative d'exercice)

`POST /api/exercise-complete` orchestre, dans l'ordre :
1. Enregistrement dans `exercise_attempts`.
2. Mise à jour de l'XP (`profiles.total_xp` via `increment_xp()`), proportionnelle au score.
3. Si `score < 50` : `track_user_error()` incrémente `user_errors`.
4. `analyzeUserErrorsAndRecommend()` (`src/lib/recommendation-engine.ts`) : identifie la
   catégorie la plus fréquente dans `user_errors`, cherche une leçon correspondante, upsert
   `recommendations` (plafonné à 3 `pending`).
5. `updateSRS()` : met à jour `user_reviews`.

### Lecture (côté UI)

`resolveNextExercises()` (`src/lib/recommendation-resolver.ts`) — point d'entrée unique
consommé par `/parcours/[slug]` et `/lessons/[slug]/complete`. Palier de priorité stricte,
pas de formule pondérée :

0. **Dû au sens SRS** (`user_reviews.next_review_at <= maintenant`)
1. **Même leçon que le contexte fourni**, pas encore réussi
2. **Jamais tenté**
3. **Déjà tenté**, trié par score croissant

Chaque exercice retourné porte un `recommendation_reason`, affiché sur `ExerciseCard`
(variant `hero`). Voir `docs/calibration/vocabulaire-particularites-recommandation.md` pour le cas
particulier du Vocabulaire dans ce pipeline.

> Ce moteur ne couvre ni les scénarios d'examen (`oral_exam_scenarios` / `writing_exam_scenarios`
> — voir `docs/architecture/exam-scenarios.md`), ni le module Examen Civique, qui a son propre
> cycle entraînement → SRS → examen blanc entièrement indépendant.

## 4. Fonctions RPC principales (hors pgvector)

| Fonction | Retour | Usage |
|---|---|---|
| `get_dashboard_data` | `jsonb` | Agrégat principal du dashboard utilisateur |
| `get_today_checklist` | `jsonb` | Checklist du jour (onglet "Aujourd'hui" du dashboard) |
| `get_activity_heatmap` | `jsonb` | Heatmap d'activité (`study_activity`) |
| `get_exam_readiness` | `jsonb` | Score de préparation à l'examen |
| `get_eo_stats` / `get_qcm_stats` / `get_trous_stats` | `jsonb` | Statistiques par type d'exercice/épreuve |
| `get_due_srs_reminders` | table | Items dus, 3 systèmes SRS confondus — voir §2 |
| `check_and_increment_ai_usage` | `boolean` | Rate limiting des appels IA (`ai_usage_daily`) |
| `decrement_ai_credits` | `void` | Décrément des crédits IA (coach chat) |
| `admin_get_user_stats` / `admin_reset_user_progress` | `jsonb` / `integer` | Outils admin |
| `match_tef_knowledge` / `match_knowledge_for_coach` | table | Recherche vectorielle RAG (coach) |

---
© 2025 LlamaKusi AI
