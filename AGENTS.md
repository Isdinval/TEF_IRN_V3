# AGENTS.md — Instructions pour agents IA (Jules, Claude Code, Copilot)

> Ce fichier est lu automatiquement par Jules (Google), Claude Code et GitHub Copilot.
> Il contient les règles absolues, la carte du projet et les conventions à respecter.

---

## ⚠️ Avertissement framework critique

**Ce projet utilise Next.js 15 avec l'App Router.** Les APIs, conventions et structure de fichiers sont significativement différents des versions antérieures à Next.js 13. Avant d'écrire du code :

- Toute la logique de routage est dans `src/app/` — **pas de dossier `pages/`**
- Les Server Components sont le comportement par défaut — ajouter `"use client"` explicitement si nécessaire
- Les Route Handlers remplacent les anciens `pages/api/` → ils se trouvent dans `src/app/api/`
- **Tailwind CSS v4** est utilisé — la configuration diffère de v3 (pas de `tailwind.config.js` traditionnel)
- `@supabase/ssr` gère l'auth (pas `@supabase/auth-helpers-nextjs` qui est déprécié)

---

## Projet : LlamaKusi — Coach IA TEF IRN

Plateforme SaaS de préparation au **TEF IRN** (Test d'Évaluation de Français pour l'immigration et la nationalité française). L'application propose des exercices oraux et écrits adaptatifs, un coach IA conversationnel, et un suivi de progression.

**URL de production** : https://tef-irn-v3.vercel.app

---

## Stack technique

- **Framework** : Next.js 15 (App Router, TypeScript)
- **Auth + DB** : Supabase (`@supabase/ssr` + `@supabase/supabase-js`)
- **Paiement** : Stripe (`stripe` server-side + `@stripe/stripe-js` client-side)
- **IA** : OpenAI API (package `openai` ^4.68)
- **UI** : Tailwind CSS v4 + shadcn/ui (`components.json` à la racine) + Framer Motion + Lucide React
- **Charts** : Recharts
- **Analytics** : PostHog
- **Tests** : Playwright (`@playwright/test`)
- **Déploiement** : Vercel

---

## Structure des dossiers

```
src/app/
├── page.tsx                  # Landing page publique (/)
├── layout.tsx                # Layout racine (providers, fonts)
├── globals.css               # Styles globaux Tailwind v4
│
├── admin/
│   └── generator/            # Interface admin de génération de contenu IA
│
├── api/                      # Route Handlers Next.js 15 (server-side uniquement)
│   └── ...                   # Stripe webhooks, OpenAI, Supabase helpers
│
├── auth/
│   └── callback/             # Callback OAuth Supabase (magic link, Google, etc.)
│
├── correction/               # Correction écrite IA — feedback ligne par ligne
├── dashboard/                # Tableau de bord utilisateur (radar, historique, stats)
├── exam/                     # Simulation d'examen TEF IRN complet
├── exercice-gratuit/         # Page d'exercice sans authentification (acquisition)
├── grammar-check/            # Vérification grammaticale assistée par IA
├── guides/                   # Guides TEF IRN (pages publiques SEO)
├── lessons/                  # Leçons structurées (120 leçons : 4 niveaux × 5 catégories × 6)
├── login/                    # Authentification (Supabase Auth UI)
├── onboarding/               # Onboarding post-inscription (niveau initial, objectif)
├── oral/                     # Coach oral IA — simulation examinateur en temps réel
├── practice/                 # Exercices adaptatifs généraux
├── pricing/                  # Page tarifs + intégration Stripe Checkout
├── profile/                  # Profil utilisateur
├── settings/                 # Paramètres du compte
├── vocab/                    # Entraînement vocabulaire
└── writing/                  # Exercices d'expression écrite

supabase/
└── migrations/               # Migrations SQL — NE PAS modifier manuellement, créer un nouveau fichier
```

### Routes protégées vs publiques

| Publique (sans auth) | Protégée (session requise) |
|---|---|
| `/` | `/dashboard` |
| `/guides` | `/lessons` |
| `/pricing` | `/practice` |
| `/exercice-gratuit` | `/oral` |
| `/login` | `/correction` |
| | `/exam` |
| | `/vocab` |
| | `/writing` |
| | `/grammar-check` |
| | `/profile` |
| | `/settings` |
| | `/onboarding` |
| | `/admin/generator` |

---

## Conventions de code

### TypeScript
- Typage strict activé (`tsconfig.json`)
- Pas de `any` implicite
- Interfaces préférées aux `type` pour les objets publics
- Les types globaux partagés vont dans `src/types/`

### Composants React
- Server Components par défaut — ajouter `"use client"` uniquement si nécessaire (hooks, événements browser)
- Props typées avec une interface dédiée dans le même fichier
- Nommage : PascalCase pour les composants, kebab-case pour les fichiers (`my-component.tsx`)

### Supabase
- Toujours utiliser les helpers `@supabase/ssr` — **ne jamais importer directement** `createClient` de `@supabase/supabase-js` dans des Server Components sans passer par `src/lib/supabase/`
- Le middleware (`middleware.ts`) gère le rafraîchissement de session — ne pas le supprimer
- Les migrations SQL sont dans `supabase/migrations/` — utiliser `npx supabase db push` pour les appliquer

### Stripe
- Les appels à l'API Stripe se font **uniquement côté serveur** (Route Handlers ou Server Actions)
- `STRIPE_SECRET_KEY` n'est jamais exposée côté client
- Le webhook est sur `/api/stripe/webhook`

### OpenAI
- Les appels OpenAI se font **exclusivement dans les Route Handlers** (`src/app/api/openai/`)
- `OPENAI_API_KEY` n'est jamais utilisée dans du code client-side
- Streaming possible via `Response` avec `ReadableStream`

### Styling
- Tailwind CSS v4 — utiliser les classes utilitaires directement
- shadcn/ui pour les composants de base — ne pas modifier les fichiers dans `src/components/ui/` générés automatiquement
- Framer Motion pour les animations — uniquement dans des composants `"use client"`

---

## Variables d'environnement requises

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_POSTHOG_KEY         (optionnel)
NEXT_PUBLIC_POSTHOG_HOST        (optionnel)
```

---

## Ce qu'il ne faut jamais faire

- ❌ Créer des fichiers dans `src/pages/` — App Router uniquement
- ❌ Utiliser `getServerSideProps` ou `getStaticProps` — remplacés par les Server Components et `fetch` avec cache
- ❌ Appeler l'API OpenAI depuis le client — sécurité de la clé API
- ❌ Appeler l'API Stripe (secret key) depuis le client
- ❌ Modifier les fichiers `supabase/migrations/` manuellement sans créer une nouvelle migration
- ❌ Utiliser `@supabase/auth-helpers-nextjs` — déprécié, remplacé par `@supabase/ssr`
- ❌ Modifier `src/components/ui/` manuellement (fichiers gérés par shadcn CLI)

---

## Commandes utiles

```bash
npm run dev              # Serveur de développement
npm run build            # Build de production
npm run lint             # ESLint
npx playwright test      # Tests E2E
npx supabase db push     # Appliquer les migrations
npx shadcn@latest add <composant>  # Ajouter un composant shadcn/ui
```

---

## Domaine métier — TEF IRN

Le **TEF IRN** est un examen de français reconnu par les autorités françaises pour :
- La demande de **nationalité française**
- La demande de **carte de résident** (10 ans)

Niveaux cibles : A2 minimum (titre de séjour), B1 (nationalité).

Compétences évaluées : compréhension orale, compréhension écrite, expression orale, expression écrite.

Compétiteur principal mentionné dans l'app : **PrepMyFuture**.
