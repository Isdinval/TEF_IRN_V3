# LlamaKusi — Coach IA pour le TEF IRN 🇫🇷

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai)](https://openai.com/)

**LlamaKusi** est une plateforme SaaS de pointe conçue pour accompagner les candidats à la réussite du **TEF IRN** (Test d'Évaluation de Français pour l'Intégration, la Résidence et la Nationalité). Alliant intelligence artificielle et pédagogie moderne, LlamaKusi offre une expérience d'apprentissage immersive et personnalisée.

---

## ✨ Fonctionnalités Clés

### ✍️ Written Expression Coach
Un éditeur intelligent qui fournit un feedback instantané et détaillé sur vos productions écrites.
- **Analyse pédagogique** : Correction par type d'erreur (grammaire, syntaxe, vocabulaire).
- **Reformulations réalistes** : Suggestions adaptées aux niveaux A2 à B2.
- **Double Scroll Sync** : Navigation fluide entre vos erreurs et les explications de l'IA.

### 🗣️ Oral Coach (OpenAI Realtime)
Pratiquez l'épreuve orale avec un examinateur virtuel en temps réel.
- **Conversations fluides** : Basé sur l'API OpenAI Realtime pour une latence minimale.
- **Simulations de sections** : Entraînement spécifique pour les Sections A et B de l'examen.

### 📊 Dashboard & Progression
Suivez vos performances grâce à un tableau de bord premium et gamifié.
- **Radar de Compétences** : Visualisation de votre niveau sur les différents axes du CECRL.
- **Système de Ligues** : Restez motivé en grimpant dans le classement des utilisateurs.
- **Objectifs Quotidiens** : Suivi de l'XP et de la régularité.
- **Page Progression** : Vue d'ensemble du parcours guidé, niveau par niveau (A1 à B2) — parcours, expression écrite, expression orale et examens blancs en un seul endroit.

### 🧠 Apprentissage Adaptatif (SRS)
Optimisez votre mémorisation avec notre moteur de répétition espacée (Spaced Repetition System).
- **SRS Intelligent** : Algorithme SM-2 personnalisé, décliné sur trois domaines (exercices, vocabulaire, Examen Civique).
- **Moteur de Recommandation Unifié** : Un exercice recommandé n'est jamais choisi au hasard — priorité aux révisions dues, puis à la leçon en cours, puis aux points jamais abordés, avec la raison de la recommandation affichée directement à l'écran.

### 🏛️ Examen Civique (CSP / Carte de Résident / Naturalisation)
Un second produit à part entière, dédié au QCM de connaissances civiques obligatoire depuis le 1er janvier 2026.
- **Simulateur d'éligibilité** : Identifie la mention visée (CSP, Carte de Résident, Naturalisation) selon la situation du candidat.
- **Entraînement & Examen Blanc** : QCM thématique (institutions, valeurs de la République, histoire, vie en société) avec SRS dédié, puis simulation en conditions réelles (40 questions).
- **Carte des Centres d'Examen** : Localisation des centres agréés partout en France.
- **Livret du Citoyen & Guides** : Contenu de référence et guides pédagogiques publics, en cross-sell avec le TEF IRN.

---

## 🛠️ Stack Technique

- **Frontend** : Next.js 15 (App Router), React 19, TypeScript.
- **Styling** : Tailwind CSS v4, Framer Motion, @base-ui/react.
- **Backend & Auth** : Supabase (PostgreSQL, Auth SSR, Edge Functions).
- **IA** : OpenAI GPT-4o-mini & GPT-Realtime (WebRTC).
- **Paiements** : Stripe Checkout & Webhooks.

---

## 🚀 Installation & Développement

```bash
npm install
npm run dev
```

---

## 📄 Documentation

### Pour démarrer
- [Documentation Technique](./docs/technical-documentation.md)
- [Fonctionnalités Produit](./docs/FEATURES.md)
- [Référentiel TEF IRN](./docs/tef-irn-reference.md)
- [Guide du Coach IA](./COACH_GUIDE.md)

### Architecture & Base de données
- [Systèmes IA](./docs/AI_SYSTEMS.md)
- [Base de données & SRS](./docs/DATABASE_AND_SRS.md)
- [Catalogue des simulations d'examen (oral/écrit)](./docs/EXAM_SCENARIOS_CATALOGUE.md)

### Calibration pédagogique (prompts IA)
- [Correction Expression Écrite par niveau CECRL](./docs/writing-correction-levels.md)
- [Notation Expression Orale par niveau CECRL](./docs/oral-analysis-levels.md)
- [Calibration Compréhension Écrite](./docs/ce-content-calibration-rules.md)
- [Contraintes de génération Compréhension Orale](./docs/CO-contraintes-generation-texte.md)
- [Taxonomie des tags de leçons](./docs/lessons-tags-taxonomy.md)
- [Particularités du Vocabulaire dans le moteur de recommandation](./docs/vocabulaire-particularites-recommandation.md)

### Ops & contribution
- [Guide de Contribution](./docs/CONTRIBUTING.md)
- [Piège PostgREST : troncature à 1000 lignes](./docs/postgrest-max-rows-truncation.md)

### Pour les agents IA
- [AGENTS.md](./AGENTS.md) — conventions, structure des dossiers, méthode de travail

---

## ⚖️ Licence

Projet privé — tous droits réservés © 2025 LlamaKusi AI.
