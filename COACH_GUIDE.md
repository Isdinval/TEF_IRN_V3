# Guide du Coach IA - Maitris TEF IRN

Le Coach IA est un chatbot pédagogique conçu pour aider les élèves à préparer le TEF IRN.

## Installation & Déploiement

### 1. Base de données
Appliquer la migration SQL :
```bash
# Dans le dossier supabase/migrations/
# Appliquer 20240520000016_coach_chat.sql via Supabase Dashboard ou CLI
```

### 2. Déploiement de l'Edge Function
```bash
supabase functions deploy coach-chat
supabase secrets set OPENAI_API_KEY=votre_cle_ici
```

### 3. Variables d'Environnement Frontend
Assurez-vous que `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont configurés.

## Test du Flux Complet

Vous pouvez tester l'Edge Function via curl (remplacez les variables) :

```bash
curl -X POST "https://[PROJ_ID].supabase.co/functions/v1/coach-chat" \
  -H "Authorization: Bearer [USER_JWT]" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Génère-moi un exercice de niveau A2 sur les verbes du premier groupe."}],
    "stream": false
  }'
```

## Architecture Technique

- **RAG** : Utilise pgvector pour rechercher des contextes dans la table `tef_knowledge`.
- **Tools** :
  - `generate_exercise` : Crée et sauvegarde un exercice dans `coach_generated_exercises`.
  - `correct_text` : Analyse pédagogique de texte.
  - `get_weak_points` : Analyse basée sur la table `user_errors`.
- **Crédits** : Déduits via la fonction RPC `decrement_ai_credits`.
  - Message simple : 1 crédit.
  - Usage des outils : 3 crédits.

## Maintenance
Le système de summarization se déclenche automatiquement après 12 messages pour économiser les tokens tout en préservant le contexte pédagogique.
