# Documentation Technique - LlamaKusi

Ce document détaille l'architecture technique et les choix technologiques du projet LlamaKusi.

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
│   ├── tef-irn/         # Produit principal — TEF IRN (quasi-totalité des routes)
│   └── examen-civique/  # Second produit — QCM civique (CSP/Carte de Résident/Naturalisation), hors préfixe /tef-irn/
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
> Arborescence détaillée (sous-dossiers de `tef-irn/` et `examen-civique/`, routes protégées vs publiques) : voir [`AGENTS.md`](../AGENTS.md#structure-des-dossiers), qui fait référence pour éviter que les deux documents divergent.

## 4. Gestion de l'État
LlamaKusi utilise une approche hybride pour la gestion de l'état :
- **Server State** : Géré par les Server Components de Next.js et Supabase. Les données sont récupérées directement au niveau de la route pour minimiser le JavaScript côté client.
- **Client Contexts** : Utilisés pour les états complexes et interactifs (ex: `ExamContext` pour la simulation d'examen, `ParcoursContext` pour le suivi du chemin d'apprentissage).
- **LocalStorage** : Persistance légère pour les sessions d'examen en cours et les préférences utilisateur.

## 5. Base de Données (Supabase)
- **Migrations** : Toutes les modifications de schéma sont tracées dans `supabase/migrations`.
- **RLS (Row Level Security)** : La sécurité est gérée au niveau de la base de données. Chaque table possède des politiques strictes garantissant que l'utilisateur ne peut accéder qu'à ses propres données.
- **Domaines couverts** : contenu pédagogique TEF IRN (parcours, leçons, exercices), simulations d'examen, coach IA (chat + RAG via `pgvector`), Examen Civique (produit distinct), gamification, administration. Schéma complet (37 tables), les 3 systèmes SRS et les fonctions RPC : voir [`docs/DATABASE_AND_SRS.md`](./DATABASE_AND_SRS.md), qui fait référence pour éviter toute divergence avec ce document.

## 6. Conventions de Développement
- **Server Components par défaut** : Optimisation de la performance et du SEO.
- **Typage Strict** : Utilisation systématique de TypeScript pour réduire les bugs de production.
- **Tailwind v4** : Utilisation des nouvelles fonctionnalités CSS-first de Tailwind v4.

## 7. Déploiement
Le projet est optimisé pour un déploiement sur **Vercel**, bénéficiant ainsi de la mise à l'échelle automatique des fonctions Edge et de l'optimisation des images.

---
Dernière révision de fond : 07/09/2026 (ajout Examen Civique, renvoi vers AGENTS.md et DATABASE_AND_SRS.md comme sources uniques pour la structure des dossiers et le schéma — évite que ce document diverge des deux autres au prochain changement).
