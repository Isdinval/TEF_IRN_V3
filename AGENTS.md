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

**URL de production** : https://llamakusi.com

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
├── api/                      # Route Handlers Next.js 15 (server-side uniquement)
│   ├── exercise-complete/    # Point d'entrée unique post-exercice (attempts, XP, SRS, recommandations)
│   └── ...                   # Stripe webhooks, OpenAI, Supabase helpers
│
├── auth/
│   └── callback/             # Callback OAuth Supabase (magic link, Google, etc.)
│
└── tef-irn/                  # ⚠️ TOUT le produit vit sous ce préfixe de route (voir avertissement ci-dessous)
    ├── admin/generator/      # Interface admin de génération de contenu IA
    ├── correction/           # Correction écrite IA — feedback ligne par ligne
    ├── dashboard/            # Tableau de bord utilisateur (radar, historique, stats)
    ├── exam/                 # Simulation d'examen TEF IRN complet
    ├── exercice-gratuit/     # Page d'exercice sans authentification (acquisition)
    ├── grammar-check/        # Exercices "texte à trous" (type exercises.type = 'trous')
    ├── guides/               # Guides TEF IRN (pages publiques SEO)
    ├── lessons/              # Leçons + mini-quiz de fin de leçon (type 'qcm_centre_entrainement')
    ├── login/                # Authentification (Supabase Auth UI)
    ├── onboarding/           # Onboarding post-inscription (niveau initial, objectif)
    ├── oral/                 # Coach oral IA — simulation examinateur en temps réel
    ├── parcours/             # Parcours d'apprentissage par niveau/catégorie + moteur de recommandation
    ├── practice/             # Exercices adaptatifs généraux (type 'qcm', 'association')
    ├── pricing/              # Page tarifs + intégration Stripe Checkout
    ├── profile/              # Profil utilisateur
    ├── settings/             # Paramètres du compte
    ├── vocab/                # Entraînement vocabulaire (SRS dédié)
    └── writing/              # Exercices d'expression écrite (type 'ecrit')

supabase/
└── migrations/               # Migrations SQL — NE PAS modifier manuellement, créer un nouveau fichier
```

### ⚠️ Piège fréquent : le préfixe `/tef-irn/`

**Toutes les routes produit sont sous `src/app/tef-irn/`, pas directement sous `src/app/`.** Un agent qui cherche `src/app/practice/page.tsx` ne trouvera rien — le vrai fichier est `src/app/tef-irn/practice/page.tsx`. Le middleware normalise aussi une variante `/tef_irn` (underscore) vers `/tef-irn` (tiret) par redirection 301 — ne pas la retirer.

### Routes protégées vs publiques (source : `src/middleware.ts`, section `protectedRoutes`)

| Protégée (redirige vers `/tef-irn/login` si non connecté) | Publique ou "soft-gated" (accessible sans compte, fonctionnalités réduites) |
|---|---|
| `/tef-irn/dashboard` | `/tef-irn/` (landing) |
| `/tef-irn/practice` | `/tef-irn/guides` |
| `/tef-irn/writing` | `/tef-irn/pricing` |
| `/tef-irn/grammar-check` | `/tef-irn/exercice-gratuit` |
| `/tef-irn/vocab` | `/tef-irn/login` |
| `/tef-irn/oral` | `/tef-irn/parcours` (soft-gated : consultable sans compte, CTA connexion pour les exercices) |
| `/tef-irn/coach` | `/tef-irn/lessons` (soft-gated : lecture libre, quiz nécessite un compte) |
| `/tef-irn/correction` | `/tef-irn/exam`, `/tef-irn/onboarding`, `/tef-irn/admin/generator` (gérés par leur propre logique, pas par le middleware) |
| `/tef-irn/settings` | |
| `/tef-irn/profile` | |

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

## Moteur de recommandation d'exercices (`src/lib/`)

Point d'entrée unique côté serveur : `POST /api/exercise-complete` (`src/app/api/exercise-complete/route.ts`). **Les 3 pages qui enregistrent une tentative d'exercice (`practice`, `grammar-check`, le mini-quiz dans `lessons/[slug]`) doivent toutes appeler cette route** — ne jamais réintroduire un `supabase.from('exercise_attempts').insert()` direct côté client, ça prive silencieusement l'utilisateur du tracking d'erreurs, du SRS et des recommandations.

| Fichier | Rôle |
|---|---|
| `src/lib/recommendation-resolver.ts` | `resolveNextExercises()` — moteur de sélection unifié, appelé par `/parcours/[slug]` et `/lessons/[slug]/complete`. Priorité stricte par paliers (SRS dû > contexte leçon > jamais tenté > tenté), pas de formule pondérée. |
| `src/lib/recommendation-engine.ts` | `trackUserError()` (alimente `user_errors`) + `analyzeUserErrorsAndRecommend()` (alimente la table `recommendations` avec une raison textuelle, pour affichage futur côté coach/dashboard). |
| `src/lib/srs-engine.ts` | `updateVocabularySRS()` — **client navigateur uniquement**, appelé depuis `vocab/page.tsx` (composant client). |
| `src/lib/srs-engine-server.ts` | `updateSRS()` — **client serveur uniquement** (`@/lib/supabase-server`), appelé depuis `api/exercise-complete/route.ts`. |

**Piège à ne pas réintroduire** : ces deux derniers fichiers ont été séparés volontairement. Mélanger les deux fonctions SRS dans un seul fichier avec les deux clients Supabase importés en haut cassait le build (`next/headers` ne peut pas être bundlé dans un composant client) dès qu'un composant client important une seule des deux fonctions du fichier. Toujours garder une frontière stricte fichier serveur / fichier client pour ce genre d'utilitaire partagé.

### Taxonomie des types d'exercices (`exercises.type`)

Trois types actifs, chacun lié à une page précise — ne pas les confondre, c'est la source de bug la plus fréquente rencontrée sur ce module :

| `type` | Page qui le consomme | Usage |
|---|---|---|
| `qcm` | `/tef-irn/practice/[id]` | Entraînement QCM général |
| `trous` | `/tef-irn/grammar-check/[id]` | Texte à trous |
| `qcm_centre_entrainement` | `lessons/[slug]/page.tsx` (mini-quiz de fin de leçon) | Un seul exercice par leçon, filtré par `lesson_id` + `type` |

`reformulage`, `ecrit` et `oral` existent dans la contrainte `CHECK` de la table mais ne sont pas consommés par le moteur de recommandation.

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
SUPABASE_SERVICE_ROLE_KEY       (server-only, jobs cron/admin — voir src/lib/supabase-admin.ts)
RESEND_API_KEY                  (rappels email SRS, voir /api/cron/srs-reminders)
RESEND_FROM_EMAIL
CRON_SECRET                     (vérifie l'appel Vercel Cron sur /api/cron/srs-reminders)
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
- ❌ Insérer une tentative d'exercice directement (`exercise_attempts.insert()` côté client) au lieu d'appeler `POST /api/exercise-complete` — ça contourne le tracking d'erreurs, le SRS et les recommandations
- ❌ Mélanger un import `@/lib/supabase` (client) et `@/lib/supabase-server` (serveur) dans le même fichier `src/lib/` partagé entre composants client et server — voir `srs-engine.ts` / `srs-engine-server.ts` pour le pattern correct de séparation

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

### Génération de patchs

Toujours utiliser `git format-patch` (jamais `git diff`) pour fournir un patch à appliquer :

```bash
git format-patch -1 HEAD          # patch du dernier commit
git format-patch main..HEAD       # patch de tous les commits depuis main
```

Un patch `git diff` n'a pas de métadonnées (`From`, `Date`, `Subject`) et n'est pas applicable avec `git am`.

---

## Domaine métier — TEF IRN

Le **TEF IRN** est un examen de français reconnu par les autorités françaises pour :
- La demande de **nationalité française**
- La demande de **carte de résident** (10 ans)

Niveaux cibles : A2 minimum (titre de séjourpluriannuelle), B1 (arte de résident de longue durée) et B2 (demande de nationalité française). 

Compétences évaluées : compréhension orale, compréhension écrite, expression orale, expression écrite.

Compétiteur principal mentionné dans l'app : **PrepMyFuture**.
