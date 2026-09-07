# Guide du Coach IA - LlamaKusi TEF IRN

> Réécrit le 07/09/2026 : la version précédente documentait une Edge Function
> Supabase (`supabase/functions/coach-chat/`) qui n'est plus l'implémentation
> utilisée en production. Le frontend (`ChatCoach.tsx`) appelle en réalité
> `/api/coach/chat`, une route Next.js Edge avec une architecture différente.

Le Coach IA est un chatbot pédagogique conçu pour aider les élèves à préparer le TEF IRN.

## Architecture réelle (`src/app/api/coach/chat/route.ts`)

- **Runtime** : Next.js Edge Function (`export const runtime = 'edge'`), pas une Edge Function Supabase.
- **SDK** : Vercel AI SDK (`streamText`, `@ai-sdk/openai`), modèle `gpt-4o-mini`.
- **Auth** : session Supabase lue via cookies (`@supabase/ssr`) ; requête rejetée (401) sans utilisateur connecté.
- **Rate limiting** : `checkAiRateLimit(userId, 'coach_chat', tier)` — voir `docs/architecture/ai-systems.md` §5 pour les quotas (15/jour en Free, 300/jour en Premium). Utilise la table `ai_usage_daily`, **pas** `ai_credits`/`decrement_ai_credits`.
- **Contexte de page** : le client envoie un `pageContext` typé (leçon, parcours, écriture, oral, guide, navigation libre) que la route traduit en une phrase de contexte injectée dans le prompt système.

### Tools exposés au modèle

| Tool | Rôle |
|---|---|
| `get_resources` | Recherche des leçons/exercices par tags (`.overlaps('tags', keywords)`) — **pas de recherche vectorielle** |
| `get_next_recommendation` | Réutilise `resolveNextExercises()` (le même moteur que `/parcours/[slug]`, voir `docs/architecture/database-and-srs.md` §3) |
| `get_random_exercise` | Exercice aléatoire au niveau de l'utilisateur, ou recommandation déjà calculée si on est sur un parcours |
| `get_tef_info` | Informations statiques sur les épreuves CO/CE/EE/EO |
| `get_vocab_list` | Liste de vocabulaire par thème depuis la table `vocabulary` |

### Garde-fous du prompt système
- Périmètre strict : refuse poliment tout sujet hors français/TEF IRN.
- Interdiction de générer des URLs, sauf recopie exacte d'un champ `url` déjà fourni par `get_next_recommendation` (anti-hallucination de liens).
- Balise de mood en fin de réponse (`[[mood:victorieux|perplexe|neutre]]`) consommée par l'UI pour animer la mascotte, jamais montrée à l'utilisateur.

## ⚠️ Point à trancher : l'Edge Function Supabase legacy

Le dossier `supabase/functions/coach-chat/` existe toujours et implémente une **architecture différente** :
- Crédits déduits via `decrement_ai_credits` (1 crédit par message simple, 3 avec outils) — système distinct du rate limiting `ai_usage_daily` de la route active.
- Tools différents : `generate_exercise` (écrit dans `coach_generated_exercises`), `correct_text`, `get_weak_points`.
- Recherche vectorielle réelle via `match_knowledge_for_coach()` sur `tef_knowledge`/`documents_embeddings`.

**Aucune référence à cette Edge Function n'a été trouvée dans `src/`** (ni son URL `functions/v1/coach-chat`, ni un appel `supabase.functions.invoke('coach-chat')`) — elle semble non branchée au produit actuel. Deux hypothèses, à trancher avec l'équipe plutôt que par ce document :
1. Code mort à supprimer (Edge Function + migrations `20240520000016_coach_chat.sql` / `20240520000017_coach_rag_v2.sql` si rien d'autre n'en dépend).
2. Prototype d'une v2 (RAG vectoriel + génération d'exercices) en pause, à ne pas supprimer.

## Persistance de l'historique : incomplète en l'état

La route sauvegarde la réponse de l'assistant dans `chat_messages` **si** un `sessionId` est fourni dans le corps de la requête (`onFinish`). Aucun code identifié dans `ChatCoach.tsx` / `CoachContext.tsx` ne génère ou ne transmet ce `sessionId` aujourd'hui, ni ne sauvegarde le message de l'utilisateur — la persistance semble actuellement inatteignable en pratique. À vérifier côté produit si c'est un chantier en cours ou un oubli.

## Déploiement

Aucune étape de déploiement spécifique : la route fait partie du build Next.js standard (Vercel). Seule variable requise : `OPENAI_API_KEY` côté serveur (jamais exposée au client).

---
© 2025 LlamaKusi AI
