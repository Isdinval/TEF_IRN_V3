# Catalogue de Simulations d'Examen (Oral & Écrit) - Décision d'architecture

Ce doc explique **pourquoi** les modules "simulation d'examen" (`/tef-irn/oral`, `/tef-irn/writing`)
utilisent des tables séparées du système SRS/parcours (`exercises`), et comment ne pas les recasser
par erreur en y touchant plus tard.

## Le principe : deux produits pédagogiques différents, deux pools de contenu

| | `exercises` (SRS / parcours) | `oral_exam_scenarios` / `writing_exam_scenarios` |
|---|---|---|
| Objectif | Micro-apprentissage : ancrer un point précis (grammaire, conjugaison...) | Simulation d'examen en conditions réelles, choisie librement |
| Déclenché par | Moteur de recommandation (`resolveNextExercises`), rattaché à une leçon | Choix libre de l'utilisateur dans un catalogue (+ bouton "Surprends-moi") |
| Rythme | Répétition espacée (SM-2), revient selon l'algorithme SRS | Pas de notion de répétition — c'est un entraînement à la demande |
| Suivi historique | `exercise_attempts`, `user_reviews`, `user_errors`, XP/gamification | Table dédiée par module (ex: `oral_session_results`) ou pas de suivi SRS |
| Entrée dans le produit | `/parcours/[slug]`, `/lessons/[slug]/complete`, retry depuis `/correction` | Clic direct nav/bottom-nav sur `/tef-irn/oral` ou `/tef-irn/writing` (sans id) |

**Ces deux pools ne se mélangent jamais.** Une table `*_exam_scenarios` n'hérite d'aucune donnée de
`exercises`, et inversement. Ajouter un sujet dans l'un n'alimente pas l'autre — ce sont deux banques
de contenu à écrire séparément, avec des schémas différents (voir `exercises.content` JSONB libre vs
colonnes structurées `section`/`level`/`min_words`/`duration_seconds` ci-dessous).

## Pourquoi cette séparation (et pas une fusion)

`exercises` est le cœur du moteur de recommandation SRS (`src/lib/recommendation-resolver.ts`),
avec une FK stricte `exercise_attempts.exercise_id → exercises.id`. Faire porter les scénarios
d'examen par cette même table obligerait à :
- réécrire `resolveNextExercises()` pour fusionner deux pools hétérogènes dans un même système de tiers,
- gérer une FK polymorphe (ou une table d'attempts séparée) pour `exercise_attempts`,
- adapter `ExerciseCard.tsx`, `correction/page.tsx`, `coach/chat/route.ts` pour deux formes d'exercice.

Pour un bénéfice quasi nul : une simulation d'examen chronométrée n'a pas vocation à être "spacée"
comme un point de grammaire. Le pattern oral (en place depuis le début, jamais rattaché à `exercises`)
valide déjà cette séparation en prod — le writing suit le même chemin.

> Note historique : `docs/DATABASE_AND_SRS.md` mentionne que les types `ecrit` et `oral` existent
> dans le schéma `exercises` mais **ne sont pas consommés par le moteur de recommandation**. C'est
> volontaire et à préserver : `ecrit` reste utilisé par le parcours/SRS pour des drills courts,
> indépendamment du catalogue décrit ici.

## État par module

### Oral (`/tef-irn/oral`) — référence

- Table `oral_exam_scenarios` (`section`, `level`, `role_interlocuteur`, `sujet`, `objectifs`, `contraintes`, `voice`).
- `GET /api/oral/scenarios` → liste pour le catalogue (`ScenarioCatalogue.tsx`).
- `GET /api/oral/session?scenarioId=...` ou `?section=&level=` (tirage aléatoire = "Surprends-moi").
- Aucune ligne `type='oral'` n'existe dans `exercises` — le module est 100% indépendant du SRS.

### Écrit (`/tef-irn/writing`) — nouveau, même pattern

- Table `writing_exam_scenarios` (`section` A/B, `level`, `type_texte`, `sujet`, `min_words`, `duration_seconds`, `contraintes`).
- `GET /api/writing/scenarios` → liste pour `WritingScenarioCatalogue.tsx`.
- `WritingTimer` se cale sur `duration_seconds` du scénario choisi (au lieu de sniffer le texte des instructions).
- **4 points d'entrée sur `/tef-irn/writing`, seul le 1er change de comportement :**
  1. Nav directe sans paramètre → **nouveau** : affiche le catalogue (`writing_exam_scenarios`).
  2. Parcours SRS (`ExerciseCard.tsx`) → `/writing/[id]` avec un exercice `exercises` (type='ecrit') — **inchangé**.
  3. Retry depuis `/correction` → `/writing/[id]` — **inchangé**.
  4. Lien contextuel du coach chat → `/writing/[id]` — **inchangé**.
- `exercises` (type='ecrit') continue d'être alimenté séparément si on veut plus de drills SRS — ce n'est pas lié à ce chantier et n'alimente jamais `writing_exam_scenarios`.

## Règle à suivre pour tout futur module de simulation (CE, CO...)

Répliquer ce même pattern : une table `*_exam_scenarios` dédiée, jamais de lien avec `exercises`
ni avec le moteur SRS. Ça scale proprement sans jamais toucher au cœur du système de recommandation.

---
© 2025 LlamaKusi AI
