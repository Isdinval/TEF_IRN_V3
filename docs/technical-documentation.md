# Documentation Technique - Maitris

Ce document détaille l'architecture technique et les choix technologiques du projet Maitris.

## 1. Architecture Globale
Le projet est une application web moderne basée sur **Next.js 15** utilisant l'**App Router**. Il suit une architecture orientée composants, avec une séparation claire entre la logique métier, les services (IA/DB) et l'interface utilisateur.

## 2. Stack Technologique
- **Framework** : Next.js 15 (React 19, TypeScript)
- **Styling** : Tailwind CSS v4.0 (Performance accrue, configuration simplifiée)
- **Base de données & Auth** : Supabase (PostgreSQL + RLS + Auth SSR)
- **Composants UI** : @base-ui/react (primitives) + shadcn/ui
- **Animations** : Framer Motion
- **IA** : OpenAI (GPT-4o-mini & Realtime API)

## 3. Structure du Projet
```text
src/
├── app/          # Routes, Layouts et API Handlers (App Router)
├── components/   # Composants React
│   ├── ui/       # Composants atomiques (shadcn)
│   ├── shared/   # Composants transverses (Sidebar, Layouts)
│   └── features/ # Composants métier complexes
├── contexts/     # Contextes React (Exam, Parcours)
├── hooks/        # Hooks réutilisables (useTimer, etc.)
├── lib/          # Logique métier, clients API, moteurs (SRS, Reco)
├── types/        # Définitions TypeScript centralisées
└── middleware.ts # Gestion de la session et des redirections
```

## 4. Gestion de l'État
Maitris utilise une approche hybride pour la gestion de l'état :
- **Server State** : Géré par les Server Components de Next.js et Supabase. Les données sont récupérées directement au niveau de la route pour minimiser le JavaScript côté client.
- **Client Contexts** : Utilisés pour les états complexes et interactifs (ex: `ExamContext` pour la simulation d'examen, `ParcoursContext` pour le suivi du chemin d'apprentissage).
- **LocalStorage** : Persistance légère pour les sessions d'examen en cours et les préférences utilisateur.

## 5. Base de Données (Supabase)
- **Migrations** : Toutes les modifications de schéma sont tracées dans `supabase/migrations`.
- **RLS (Row Level Security)** : La sécurité est gérée au niveau de la base de données. Chaque table possède des politiques strictes garantissant que l'utilisateur ne peut accéder qu'à ses propres données.
- **Tables clés** : `profiles`, `lessons`, `exercises`, `user_reviews` (SRS), `user_vocabulary_reviews`.

## 6. Conventions de Développement
- **Server Components par défaut** : Optimisation de la performance et du SEO.
- **Typage Strict** : Utilisation systématique de TypeScript pour réduire les bugs de production.
- **Tailwind v4** : Utilisation des nouvelles fonctionnalités CSS-first de Tailwind v4.

## 7. Déploiement
Le projet est optimisé pour un déploiement sur **Vercel**, bénéficiant ainsi de la mise à l'échelle automatique des fonctions Edge et de l'optimisation des images.

---
Dernière mise à jour : Février 2025
