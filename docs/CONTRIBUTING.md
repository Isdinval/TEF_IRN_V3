# Guide de Contribution - Maitris

Ce document définit les standards et procédures pour contribuer au projet Maitris.

## 1. Environnement de Développement

### Pré-requis
- Node.js 18+
- npm ou bun
- Supabase CLI (optionnel pour le dev local)

### Configuration
1. Cloner le dépôt.
2. Copier `.env.example` en `.env.local` et remplir les clés API.
3. `npm install` pour installer les dépendances.

## 2. Standards de Code

### TypeScript
- Utilisez des interfaces pour les props de composants.
- Évitez l'usage de `any`.
- Exportez les types réutilisables dans `src/types/`.

### Composants React
- Favorisez les **Server Components** pour la récupération de données.
- Utilisez `"use client"` uniquement lorsque l'interactivité (hooks, event listeners) est nécessaire.
- Respectez l'architecture atomique simplifiée : UI (Shadcn) -> Shared -> Features.

### CSS & Tailwind v4
- Utilisez les classes utilitaires directement dans le JSX.
- Pour les animations complexes, utilisez `framer-motion`.
- Ne modifiez pas les fichiers dans `src/components/ui/` manuellement.

## 3. Workflow Git

1. Créez une branche descriptive (ex: `feature/nom-feature`, `fix/nom-bug`).
2. Faites des commits atomiques et explicites (anglais ou français au choix).
3. Assurez-vous que le projet compile (`npm run build`) avant de pousser vos changements.

## 4. Base de Données
Si vous modifiez le schéma :
1. Créez une nouvelle migration dans `supabase/migrations/`.
2. Utilisez un timestamp pour le nom du fichier.
3. Testez votre SQL localement avant de le commiter.

---
Merci de contribuer à Maitris ! 🚀
