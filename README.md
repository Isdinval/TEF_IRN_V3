# Maitris — Coach IA pour le TEF IRN

> Plateforme SaaS de préparation au TEF IRN (Test d'Évaluation de Français — Immigration, Réfugiés, Nationalité) alimentée par l'IA. Live sur [tef-irn-v3.vercel.app](https://tef-irn-v3.vercel.app).

---

## Présentation

Maitris est un coach IA personnel qui accompagne les candidats au TEF IRN du niveau A1 au B2. La plateforme propose :

- **Coach Oral IA** — simulation d'examinateur en temps réel via l'API OpenAI
- **Correction Écrite** — feedback ligne par ligne avec explications pédagogiques
- **Radar de Compétences** — visualisation des points forts/faibles par compétence
- **Méthode Adaptative** — exercices personnalisés selon l'historique d'erreurs
- **+5 000 exercices** générés et validés pédagogiquement
- Conforme à la **loi 2024-42** (nationalité & séjour)

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) |
| Langage | TypeScript 5 |
| Base de données | Supabase (PostgreSQL + Auth + SSR) |
| Paiement | Stripe |
| IA | OpenAI API (`openai` ^4.68) |
| Analytics | PostHog |
| UI | Tailwind CSS v4 + shadcn/ui + Framer Motion |
| Charts | Recharts |
| Tests E2E | Playwright |
| Déploiement | Vercel |

---

## Structure du projet

```
TEF_IRN_V3/
├── src/
│   ├── app/                  # App Router Next.js 15
│   │   ├── (auth)/           # Routes authentifiées
│   │   ├── (public)/         # Landing, guides, tarifs
│   │   ├── api/              # Route Handlers (API server-side)
│   │   └── layout.tsx
│   ├── components/           # Composants React réutilisables
│   ├── lib/
│   │   ├── supabase/         # Clients Supabase (server, client, middleware)
│   │   └── stripe/           # Helpers Stripe
│   └── types/                # Types TypeScript globaux
├── public/                   # Assets statiques
├── supabase/
│   └── migrations/           # Migrations SQL Supabase
├── docs/                     # Documentation interne
├── AGENTS.md                 # Instructions pour agents IA (Jules, Claude, Copilot)
└── CLAUDE.md                 # Alias → AGENTS.md
```

---

## Démarrage local

### Prérequis

- Node.js 22+
- npm 11+ (ou pnpm / bun)
- Compte Supabase (projet créé)
- Compte Stripe (mode test)
- Clé API OpenAI

### Installation

```bash
git clone https://github.com/Isdinval/TEF_IRN_V3.git
cd TEF_IRN_V3
npm install
```

### Variables d'environnement

Crée un fichier `.env.local` à la racine :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<projet>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé_anon>
SUPABASE_SERVICE_ROLE_KEY=<clé_service>

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PostHog (optionnel)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
```

### Lancer le serveur de développement

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

### Appliquer les migrations Supabase

```bash
npx supabase db push
```

---

## Scripts disponibles

```bash
npm run dev      # Serveur de développement (Next.js)
npm run build    # Build de production
npm run start    # Serveur de production
npm run lint     # ESLint
npx playwright test  # Tests E2E
```

---

## Déploiement

Le projet est déployé automatiquement sur **Vercel** à chaque push sur `main`.

Variables d'environnement à configurer dans le dashboard Vercel (identiques au `.env.local`).

Pour les webhooks Stripe en production, mettre à jour l'URL dans le dashboard Stripe :
```
https://tef-irn-v3.vercel.app/api/stripe/webhook
```

---

## Notes importantes

- **Next.js 15 App Router uniquement** — pas de `pages/`, toute la logique est dans `src/app/`
- **Tailwind CSS v4** — syntaxe et configuration différentes de v3 (pas de `tailwind.config.js` classique)
- Les **Route Handlers** (`app/api/`) remplacent les anciens `pages/api/`
- L'authentification est gérée entièrement via **Supabase SSR** (`@supabase/ssr`)
- Les appels OpenAI se font **côté serveur uniquement** (Route Handlers), jamais côté client

---

## Licence

Projet privé — tous droits réservés © 2025 Maitris AI.
