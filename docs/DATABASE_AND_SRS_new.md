# Base de Données & SRS - LlamaKusi

LlamaKusi utilise Supabase pour la persistance des données et implémente un système de répétition espacée (SRS) pour optimiser l'apprentissage.

## 1. Schéma de la Base de Données

Le schéma est structuré pour supporter la progression utilisateur et le contenu pédagogique.

### Tables Principales
- **`profiles`** : Informations utilisateur, XP total, niveau, ligue actuelle, et préférences.
- **`lessons`** : Contenu théorique organisé par niveau (A1-B2) et catégorie.
- **`exercises`** : Trois types actifs — `qcm` (pratique générale), `trous` (texte à trous), `qcm_centre_entrainement` (mini-quiz de fin de leçon, un par leçon via `lesson_id`). `reformulage`, `ecrit` et `oral` existent dans le schéma mais ne sont pas consommés par le moteur de recommandation.
- **`oral_exam_scenarios`** / **`writing_exam_scenarios`** : catalogues de simulation d'examen (oral/écrit), volontairement séparés de `exercises` et du moteur SRS — voir `docs/EXAM_SCENARIOS_CATALOGUE.md` pour la justification de cette séparation et ne pas les fusionner.
- **`exercise_attempts`** : Historique des tentatives (score, complétion), alimenté exclusivement via `POST /api/exercise-complete`.
- **`user_errors`** : Compteur de fréquence d'erreur par catégorie (`category`, `sub_category`), alimenté à chaque échec (`score < 50`). Source de données du moteur de recommandation.
- **`recommendations`** : Recommandations de leçons/exercices avec une raison textuelle, générées à partir de `user_errors`.
- **`exams` & `exam_questions`** : Structure et contenu des simulations d'examen TEF IRN.
- **`user_reviews`** : Suivi SRS pour les exercices généraux (tous types confondus).
- **`user_vocabulary_reviews`** : Suivi SRS spécifique au module vocabulaire.

## 2. Spaced Repetition System (SRS)

LlamaKusi implémente une variante de l'algorithme **SM-2** pour déterminer la date idéale de révision.

### Paramètres SRS
- **Ease Factor (Facilité)** : Un multiplicateur (défaut: 2.5) qui ajuste l'intervalle selon la difficulté ressentie.
- **Intervalle** : Nombre de jours avant la prochaine révision.
- **Consecutive Correct** : Nombre de fois que l'utilisateur a réussi l'item d'affilée.

### Logique de mise à jour
1. **Réussite** : L'intervalle augmente de manière exponentielle (`interval * ease`). L'ease factor augmente légèrement (+0.1).
2. **Échec** : L'intervalle est réinitialisé à 1 jour. L'ease factor diminue (-0.2).

### Implémentation

La logique SM-2 est dupliquée volontairement dans deux fichiers séparés par frontière client/serveur :
- **`src/lib/srs-engine.ts`** — `updateVocabularySRS()`, appelée côté client depuis `vocab/page.tsx`.
- **`src/lib/srs-engine-server.ts`** — `updateSRS()`, appelée côté serveur depuis `api/exercise-complete/route.ts`.

Ne pas les fusionner dans un seul fichier : un composant client qui importerait une fonction serveur (laquelle dépend de `next/headers` via `@/lib/supabase-server`) casse le build Next.js.

## 3. Moteur de Recommandation

### Écriture (déclenchée à chaque tentative d'exercice)

`POST /api/exercise-complete` orchestre, dans l'ordre :
1. Enregistrement de la tentative dans `exercise_attempts`.
2. Mise à jour de l'XP (`profiles.total_xp`), proportionnelle au score.
3. Si `score < 50` : `trackUserError()` incrémente `user_errors` pour la catégorie de l'exercice.
4. `analyzeUserErrorsAndRecommend()` (`src/lib/recommendation-engine.ts`) : identifie la catégorie la plus fréquente dans `user_errors`, cherche une leçon correspondante, et upsert une entrée dans `recommendations` (plafonnée à 3 recommandations `pending` par utilisateur).
5. `updateSRS()` : met à jour `user_reviews` pour l'exercice tenté.

### Lecture (côté UI)

`resolveNextExercises()` (`src/lib/recommendation-resolver.ts`) est le point d'entrée unique consommé par `/parcours/[slug]` et `/lessons/[slug]/complete`. Il construit un pool candidat (`exercises` filtré par `level`, et par `category` si fourni), puis classe chaque exercice par palier de priorité stricte — pas de formule pondérée :

0. **Dû au sens SRS** (`user_reviews.next_review_at <= maintenant`)
1. **Même leçon que le contexte fourni** (`lessonId`), pas encore réussi
2. **Jamais tenté**
3. **Déjà tenté**, trié par score croissant (le moins bien réussi en premier)

La "catégorie faible" (`user_errors`) agit comme un critère de tri secondaire, pas comme un palier : dans un pool mono-catégorie (cas de `/parcours/[slug]`, filtré sur la catégorie du parcours), elle n'a mécaniquement aucun effet observable. Elle ne redevient utile que si `resolveNextExercises` est appelée sans `category` (pool multi-catégories sur tout le niveau).

Chaque exercice retourné porte un champ `recommendation_reason` dérivé de son palier, affiché côté UI sur la carte mise en avant (`ExerciseCard` variant `hero`, utilisé sur `/lessons/[slug]/complete`).

---
© 2025 LlamaKusi AI
