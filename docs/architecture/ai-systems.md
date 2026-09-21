# Systèmes d'Intelligence Artificielle - LlamaKusi

LlamaKusi intègre l'IA au cœur de l'expérience utilisateur pour transformer l'apprentissage passif en coaching actif.

## 1. Correction de l'Expression Écrite
Le système utilise le modèle `gpt-4o-mini` pour fournir des analyses pédagogiques détaillées.

### Fonctionnement
1. **Extraction** : L'IA identifie les segments erronés (`texte_original`).
2. **Classification** : Chaque erreur est catégorisée (grammaire, conjugaison, etc.).
3. **Pédagogie** : Pour chaque erreur, l'IA génère une explication de 2-3 phrases rappelant la règle grammaticale.
4. **Scoring** : Calcul d'un score global basé sur la cohérence, le vocabulaire et la rigueur linguistique.

### Prompt Engineering
Le prompt système est conçu pour être exigeant mais réaliste par rapport aux niveaux A2/B1/B2, évitant de corriger des nuances de style trop complexes (C1/C2) qui pourraient décourager l'apprenant.

## 2. Coach Oral (OpenAI Realtime)
LlamaKusi utilise les capacités multimodales d'OpenAI pour simuler des interactions vocales humaines.

### Architecture
- **WebRTC** : Utilisé pour la communication bidirectionnelle à faible latence entre le navigateur et OpenAI.
- **Session Ephemeral** : Gestion des tokens de session sécurisée via `/api/oral/session`.
- **Instructions Système** : L'IA adopte le rôle d'un examinateur TEF IRN bienveillant mais rigoureux dans ses relances.

## 3. Coach Conversationnel (`/api/coach/chat`)
Chat pédagogique construit avec le Vercel AI SDK (`streamText`, modèle `gpt-4o-mini`), qui expose 5 tools à l'IA : `get_resources` (recherche par tags dans `lessons`/`exercises`), `get_next_recommendation` (réutilise `resolveNextExercises()`, voir §4), `get_random_exercise`, `get_tef_info`, `get_vocab_list`.

### ⚠️ Pas de RAG vectoriel dans l'implémentation réellement appelée par le frontend
Les fonctions `match_tef_knowledge()` / `match_knowledge_for_coach()` et les tables `tef_knowledge` / `documents_embeddings` existent en base (extension `pgvector`), mais **la route que le frontend appelle réellement (`/api/coach/chat`, confirmé dans `ChatCoach.tsx`) ne fait aucune recherche vectorielle** — `get_resources` interroge `lessons`/`exercises` par simple correspondance de tags (`.overlaps()`). `match_knowledge_for_coach()` n'est appelée que par une Edge Function Supabase distincte, `supabase/functions/coach-chat/`, qui n'est référencée nulle part côté client actuel — voir `COACH_GUIDE.md` pour le détail et une piste de nettoyage.

`tef_knowledge` est bien utilisé en production, mais ailleurs : par la correction Écrite et l'analyse Orale (`/api/writing/correct`, `/api/oral/analyze`) comme banque d'exemplaires de calibration, via un lookup déterministe par niveau/catégorie — pas une recherche vectorielle.

### Persistance de l'historique : à vérifier
`chat_sessions` / `chat_messages` existent en base et la route sauvegarde la réponse de l'assistant si un `sessionId` est fourni au moment de l'appel — mais rien d'identifié dans `ChatCoach.tsx` ne fournit ce `sessionId` à ce jour. `coach_generated_exercises` n'est écrit que par l'Edge Function legacy, jamais par la route active.

### Périmètre
Ce système couvre uniquement le TEF IRN — **le module Examen Civique n'a aucune IA runtime** : ses QCM et guides sont du contenu statique généré hors ligne (voir les skills `llamakusi-examen-civique-guide` / `llamakusi-image-prompt-examen-civique`), pas un système consulté en direct par l'utilisateur.

## 4. Analyse des Erreurs & Recommandations
Le moteur de recommandation a deux volets distincts :
- **Écriture** (`src/lib/recommendation-engine.ts`) : après chaque tentative d'exercice, si un utilisateur échoue (`score < 50`), sa catégorie d'erreur est incrémentée dans `user_errors`. Si un utilisateur échoue plusieurs fois sur des exercices de "Conjugaison", une leçon pertinente est proposée dans la table `recommendations` avec une raison textuelle.
- **Lecture / sélection** (`src/lib/recommendation-resolver.ts`) : `resolveNextExercises()` est la fonction qui décide réellement quels exercices s'affichent à l'écran (`/parcours/[slug]`, `/lessons/[slug]/complete`), par palier de priorité (SRS dû, contexte de la leçon en cours, jamais tenté, puis score le plus faible) — indépendante de la table `recommendations`, qui sert surtout de signal textuel exploitable ailleurs (coach, dashboard).

## 5. Sécurité & Coûts
- **Server-Side Only** : Toutes les clés API OpenAI sont stockées côté serveur et jamais exposées au client.
- **Optimisation des Tokens** : Utilisation de modèles "mini" pour les tâches de classification et d'analyse textuelle afin de garantir un service réactif et économiquement viable.
- **Rate Limiting par Route** (`src/lib/ai-rate-limit.ts`, table `ai_usage_daily`, RPC `check_and_increment_ai_usage`) : quota quotidien par utilisateur et par route IA, distinct selon le palier d'abonnement.

| Route | Gratuit / jour | Essentiel / jour | Premium / jour | Super Premium / jour |
|---|---|---|---|---|
| `coach_chat` | 0 | 300 | 300 | 300 |
| `writing_correct` | 3 | 100 | 100 | 100 |
| `oral_analyze` | 3 | 3 | 100 | 100 |
| `oral_session` | 2 | 2 | 50 | 50 |
| `vocab_exercise` | 3 | 300 | 300 | 300 |
| `qcm_exercise` | 3 | 300 | 300 | 300 |
| `grammar_trous_exercise` | 3 | 300 | 300 | 300 |

  Les plafonds "essentiel"/"premium"/"super_premium" sur `coach_chat`/`writing_correct` sont un garde-fou anti-abus (script, bug, compte compromis), pas une vraie limite commerciale — l'offre annonce un accès illimité à l'écrit pour ces 3 paliers payants. Sur `oral_analyze`/`oral_session`, "essentiel" garde le seuil le plus bas mais c'est sans effet : le verrou dur décrit en §6 bloque déjà ce palier avant même d'atteindre ce quota. Les 3 routes `*_exercise` (depuis le 2026-09-17) ne sont pas de la génération IA à proprement parler mais réutilisent le même mécanisme (`checkAiRateLimit`) pour plafonner les exercices de pratique individuels (vocabulaire, QCM, chasse aux erreurs) via `POST /api/exercise-practice/check`, vérifiée à chaque exercice affiché — pas au chargement du lot.

- **Quota de la pratique libre CE/CO** (depuis le 2026-09-21) : mécanisme **distinct** de `DAILY_LIMITS`, qui n'incrémente aucun compteur. `src/lib/comprehension-quota.ts` compte les **sujets distincts déjà entamés aujourd'hui (jour UTC)** depuis `ce_scenario_attempts` / `co_scenario_attempts` : Gratuit = **1 sujet CE + 1 sujet CO par jour** (constante `FREE_DAILY_SCENARIOS`), Essentiel/Premium/Super Premium = illimité (aucune requête). L'unité est le sujet (5 questions), pas la question : un sujet commencé se termine toujours et rejouer un sujet déjà entamé ne consomme rien. Fail-open en cas d'erreur de requête, comme `checkAiRateLimit` — pas d'événement `ai_usage_checked` sur ce mécanisme, voir les événements `comprehension_*` dans `docs/calibration/ce-pratique-libre.md` §2.

## 6. Paliers d'abonnement (Entitlements)

Les 4 paliers réels (`gratuit`, `essentiel`, `premium`, `super_premium`, colonne `profiles.subscription_tier`) sont ceux affichés sur la landing page (`src/components/landing/sections/Pricing.tsx`). `src/lib/entitlements.ts` est la source de vérité unique de qui a accès à quoi — toute nouvelle route/composant qui doit gater une fonctionnalité par palier doit passer par `getEntitlements(tier)`, pas par une comparaison directe sur la chaîne `subscription_tier`.

### Droits modélisés aujourd'hui
- **`hasOralCoach`** (Premium/Super Premium uniquement) : verrou dur identique en pratique libre (`/tef-irn/oral`) et dans l'examen blanc (section EO), car les deux passent par les mêmes routes `/api/oral/session` et `/api/oral/analyze`.
- **`hasExamWritingCorrection`** (Essentiel/Premium/Super Premium) : verrou dur, mais **uniquement** dans le contexte "examen blanc" de `/api/writing/correct` (paramètre `context: 'exam'` envoyé par `ExamContext.tsx`). La pratique libre EE (page `/writing`, même endpoint sans ce paramètre) est plafonnée séparément à 1 essai à vie pour Gratuit via `profiles.free_ee_correction_used` (migration 20260909000002) — le quota quotidien de `writing_correct` (voir tableau ci-dessus) ne s'applique donc jamais en pratique à ce palier, le verrou à vie intervenant avant.
- **`oralDailyMinutes`** (40 pour Premium, 75 pour Super Premium) : quota réel en minutes, vérifié par `api/oral/session` (RPC `get_oral_seconds_used_today`, colonne `ai_usage_daily.seconds_used`) avant de délivrer un nouveau token — refus (429) si le cumul du jour dépasse `oralDailyMinutes * 60` secondes. La durée est déclarée côté client (`api/oral/analyze`, RPC `increment_oral_seconds`) : le serveur n'observe jamais la session Realtime WebRTC en direct. Les quotas d'appels du tableau ci-dessus restent une limite indépendante, toujours active en plus de ce quota en minutes.

### Où c'est appliqué
- **Backend** : `api/coach/chat` (403 direct, Gratuit uniquement), `api/oral/session` + `api/oral/analyze` (403 via `hasOralCoach`), `api/writing/correct` (403 via `hasExamWritingCorrection`, uniquement si `context === 'exam'`).
- **Frontend** (écran verrouillé + CTA `/tef-irn/pricing`, redondant avec le verrou serveur mais évite une UX cassée) : `coach/page.tsx`, `oral/page.tsx`, `SpeakingSession.tsx` (section EO de l'examen blanc, aperçu verrouillé plutôt qu'écran plein).
- **Admin** : `/tef-irn/admin/profiles`, sélecteur de palier par compte (route `api/admin/profiles/set-subscription-tier`, loggé dans `admin_actions_log`) — c'est aujourd'hui le seul moyen de changer un palier, aucune intégration Stripe n'existe encore.
- **Pratique libre CE/CO** : `api/comprehension/complete` (429 avant toute correction si le quota du jour est dépassé — source de vérité, y compris pour un envoi mêlant plusieurs sujets), `api/comprehension/check` (contrôle en lecture seule à l'ouverture d'un sujet, et statut `{ limit, used }` sans `scenarioId` pour le badge des catalogues). Frontend : écran `ComprehensionQuotaBlocked` (CTA `/tef-irn/pricing`) sur les deux pages `[scenarioId]`, badge `ComprehensionDailyQuotaBadge` sur les deux catalogues.

### Écarts connus, non corrigés à ce jour
- Aucun test A/B ni donnée d'usage réel n'a servi à fixer les 6 chiffres du tableau ci-dessus (hérités de l'audit sécurité 2026-08, avant même l'existence des 4 paliers) — une recalibration reste à faire.

---
© 2025 LlamaKusi AI
