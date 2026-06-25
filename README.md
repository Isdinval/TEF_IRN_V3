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

### 🧠 Apprentissage Adaptatif (SRS)
Optimisez votre mémorisation avec notre moteur de répétition espacée (Spaced Repetition System).
- **SRS Intelligent** : Algorithme SM-2 personnalisé pour le vocabulaire et les exercices.
- **Moteur de Recommandation** : Suggestions de leçons basées sur vos erreurs récurrentes.

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

Pour plus de détails, explorez notre dossier `docs/` :
- [Documentation Technique](./docs/technical-documentation.md)
- [Systèmes IA](./docs/AI_SYSTEMS.md)
- [Base de données & SRS](./docs/DATABASE_AND_SRS.md)
- [Référentiel TEF IRN](./docs/tef-irn-reference.md)

---

## ⚖️ Licence

Projet privé — tous droits réservés © 2025 LlamaKusi AI.
