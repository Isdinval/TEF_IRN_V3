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

| Route | Free / jour | Premium / jour |
|---|---|---|
| `coach_chat` | 15 | 300 |
| `writing_correct` | 3 | 100 |
| `oral_analyze` | 3 | 100 |
| `oral_session` | 2 | 50 |

  Le plafond "premium" est un garde-fou anti-abus (script, bug, compte compromis), pas une vraie limite commerciale — l'offre annonce un accès illimité à ce palier.

---
© 2025 LlamaKusi AI
