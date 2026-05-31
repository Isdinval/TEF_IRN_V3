# Documentation Technique - Maitris

## 1. Installation en local
1.  Cloner le dépôt.
2.  Installer les dépendances : `npm install`.
3.  Lancer le serveur de développement : `npm run dev`.

## 2. Configuration Supabase
Le projet utilise Supabase CLI pour la base de données locale.
*   Les migrations se trouvent dans `supabase/migrations`.
*   Le schéma inclut la gestion des profils, leçons, exercices et feedback IA.

## 3. Intégration IA (OpenAI)
*   Modèle utilisé : `gpt-4o-mini`.
*   Les appels sont centralisés dans `src/services/ai.ts`.
*   Nécessite une clé `OPENAI_API_KEY` dans le fichier `.env`.

## 4. Structure du Code
*   `/src/app` : Routes Next.js 15.
*   `/src/components/features` : Composants métier (Dashboard, Writing Coach).
*   `/src/components/ui` : Composants atomiques Shadcn/UI.
*   `/src/lib` : Configuration des clients (Supabase, OpenAI).

## 5. Roadmap Technique future
*   Passer les appels OpenAI dans des **Edge Functions** Supabase pour plus de sécurité.
*   Implémenter **pgvector** pour le RAG (recherche sémantique dans les leçons).
*   Ajouter l'**Expression Orale** via OpenAI Realtime API.
