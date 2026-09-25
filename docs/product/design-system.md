# Design system LlamaKusi

> **Source de vérité du design de l'application.** Tout agent IA (Claude, Claude Code, Jules, Copilot) doit lire ce document **avant** de créer ou de modifier une page ou un composant visible par l'apprenant.
> Vitrine visuelle (Claude Design, privée) : https://claude.ai/artifact/U6NuuHqLuDxidH6F9nfXyG — elle reflète ce document, qui fait foi en cas d'écart.
> Ce document fixe des règles déjà tranchées. En cas de doute, on reproduit la **page de référence** : le catalogue Expression Orale (`/tef-irn/oral`), jugé idéal par le fondateur.

Périmètre : les pages applicatives `/tef-irn/*` et `/examen-civique/*`. Trois univers ont leur propre style et ne suivent **pas** ces règles d'en-tête :
- la landing page ;
- les pages de détail de guide (en-tête éditorial `GuideDetail` / `CivicGuideDetail`) ;
- le simulateur d'examen blanc (tokens `--exam-*` de `globals.css`, esthétique « copie d'examen »).

---

## 1. Principes

1. **Une seule couleur d'accent : l'indigo.** Tout le reste est neutre (blanc + gris `zinc`) ou un état (succès / attention / erreur).
2. **La hiérarchie avant la décoration.** On fait ressortir l'information par la taille, la graisse et l'espace, pas par la couleur.
3. **Mobile d'abord.** Chaque taille de texte, grille ou marge se pense à 375 px de large, puis s'élargit (`md:`, `lg:`). Attendus détaillés au §7.
4. **Réutiliser avant de recoder.** Si un motif existe déjà (en-tête de page, bandeau KPI admin, barre de progression), on réutilise le composant. On ne recopie jamais son balisage.
5. **Moins de clics, moins de couleurs, moins d'imbrication.** Pas d'accordéon dans un accordéon, pas d'icône ⓘ quand une phrase suffit.

---

## 2. Couleurs

### 2.1 Palette autorisée

| Rôle | Classes | Usage |
|---|---|---|
| **Accent** | `indigo-600` (hover `indigo-700`) | Badge d'en-tête, dernier mot du titre, bouton principal, filtre actif, barre de progression, élément « en cours » |
| Accent clair | `indigo-50` / `indigo-100` / `indigo-200` | Fonds et bordures de mise en avant, ombres (`shadow-indigo-100`) |
| Texte fort | `zinc-900` | Titres |
| Texte courant | `zinc-600` / `zinc-700` | Paragraphes, contenu de carte |
| Texte secondaire | `zinc-500` | Descriptions, légendes |
| Texte discret | `zinc-400` | Micro-labels décoratifs et icônes uniquement (voir 2.3) |
| Bordures | `zinc-100` / `zinc-200` | Contours de cartes, séparateurs |
| Fonds | `white`, `zinc-50` | Cartes (`white`) sur fond de page (`zinc-50/50`) |
| **Succès** | `emerald-50` (fond) / `emerald-600` (icône, barre) / `emerald-700` (texte) | Terminé, réponse correcte, objectif atteint |
| **Attention** | `amber-50` (fond) / `amber-600` (icône, barre) / `amber-700` (texte) | Quota bientôt atteint, point à revoir |
| **Erreur** | `red-50` / `red-200` / `red-600` (texte `red-700` sur fond `red-50`) | Erreur de chargement, réponse fausse, action destructive, **enregistrement micro en cours** (convention « REC »), chronomètre presque écoulé |

### 2.2 Interdits (nouveau code)

- ❌ Gris `slate-*` et `gray-*` → utiliser `zinc-*`. Harmoniser au fil des chantiers, uniquement sur les fichiers touchés.
- ❌ Couleurs décoratives : `violet`, `purple`, `rose`, `orange`, `blue`, `green`, etc. Une couleur doit **signifier** quelque chose (accent ou état).
- ❌ Une couleur différente par compétence, par niveau ou par catégorie. Le niveau (A1–B2) et la compétence (CE/CO/EE/EO) s'affichent en **texte** (badge neutre ou indigo), pas en couleur.
- ❌ Plus de 3 couleurs visibles dans un même écran, hors neutres.
- ❌ Une couleur par type d'erreur (grammaire, conjugaison…). Les erreurs surlignées dans un texte de l'apprenant sont toutes en **attention** (`amber`), l'élément actif en indigo ; le type s'écrit dans la fiche de l'erreur.
- ❌ `rose-*` pour un état : utiliser `red-*` (erreur) ou `amber-*` (attention).

> Règle 60-30-10 : ~60 % de fond neutre, ~30 % de texte et de gris, ~10 % d'indigo.

### 2.3 Contraste (accessibilité, WCAG 2.2 AA)

- Tout texte porteur d'information : **`zinc-500` minimum** sur fond blanc (ratio ≥ 4,5:1).
- `zinc-400` ne passe pas ce seuil : on le réserve aux icônes, aux puces « • » et aux micro-labels répétant une information déjà visible ailleurs.
- Texte blanc uniquement sur `indigo-600` ou plus foncé.
- Succès et attention : **texte en `-700`** (`text-emerald-700`, `text-amber-700`), car les teintes `-600` n'atteignent que 3,8:1 et 3,2:1. Les `-600` restent pour les icônes, les barres et les textes ≥ 24 px.

### 2.4 Écart connu à ne pas reproduire

Le token shadcn `--primary` de `globals.css` vaut `#002395` (bleu de marque historique). Un `<Button>` sans classe de couleur s'affiche donc en bleu marine, pas en indigo. **Toujours** préciser `bg-indigo-600 hover:bg-indigo-700` sur un bouton principal.

### 2.5 Écarts tolérés

- Éditeur Expression Écrite (`writing/page.tsx`, `ZoneRedaction.tsx`) : ses panneaux redimensionnables utilisent `max-md:` pour forcer la pleine largeur sur mobile. Toléré tant que la mise en page n'est pas refondue ; ne pas reproduire ailleurs.
- Panneaux sombres (analyse orale, feedback EE) : sur fond `zinc-900`/`zinc-950`, le texte secondaire reste en `zinc-400` (le `zinc-500` y serait moins lisible).

---

## 3. Typographie

Polices déjà configurées : **Montserrat** (`font-heading`) et **Inter** (`font-sans`, par défaut). Aucune autre police.

### 3.1 Échelle

| Élément | Classes | Remarque |
|---|---|---|
| Titre de page (H1) | `text-4xl md:text-5xl font-black uppercase tracking-tighter text-zinc-900` | Un seul H1 par page. Voir §5. |
| Titre de section (H2) | `text-lg font-black uppercase tracking-tight text-zinc-900` | |
| Titre de carte (H3) | `text-base md:text-lg font-bold text-zinc-900` (carte mise en avant : `text-2xl font-black tracking-tight`) | |
| Description d'en-tête | `max-w-2xl text-base md:text-lg font-medium leading-relaxed text-zinc-500` | |
| Texte courant | `text-sm md:text-base font-medium text-zinc-600` | |
| Micro-label | `text-[10px] font-black uppercase tracking-widest text-zinc-500` | « Section », « Niveau », « Mise en situation »… |
| Chiffre clé (KPI) | `text-3xl font-black text-zinc-900` | |

Tailles : **uniquement l'échelle Tailwind** (`text-xs` à `text-5xl`) + `text-[10px]` pour les micro-labels. ❌ Rien sous 10 px, pas de `text-[11px]`…`text-[19px]`, pas de `text-[clamp(...)]` : une taille qui grandit avec l'écran s'écrit `text-2xl md:text-4xl`.
Police : celle du thème (`font-sans`, définie une seule fois dans le layout). ❌ Pas de police locale à une page.

### 3.2 Graisses : 3 niveaux, pas plus

- **`font-black` (900)** : H1, H2, micro-labels, badges, boutons principaux, chiffres clés.
- **`font-bold` (700)** : titres de cartes, mots importants dans un paragraphe, boutons secondaires.
- **`font-medium` (500)** : tout le texte courant et les descriptions.

❌ Jamais de `font-black` sur un paragraphe. Si tout est en gras, plus rien ne ressort.
❌ Pas de `font-semibold` ni de `font-extrabold` (niveaux intermédiaires inutiles).

### 3.3 Majuscules

- Les majuscules s'obtiennent **par la classe `uppercase`**, jamais en tapant le texte en capitales dans le JSX. Un texte saisi en capitales peut être épelé lettre par lettre par les lecteurs d'écran et se traduit mal (projet multilingue).
- Majuscules réservées aux : H1, H2, badges, micro-labels, boutons principaux.

---

## 4. Espacements, rayons, ombres

### 4.1 Conteneur de page

```tsx
<div className="min-h-screen bg-zinc-50/50 pb-20">
  <div className="mx-auto max-w-5xl p-4 md:p-10 lg:p-12">
    {/* en-tête, puis contenu */}
  </div>
</div>
```

- Largeur max : `max-w-5xl` (pages catalogue et parcours). `max-w-3xl` pour une page de lecture (leçon).
- Espacement vertical entre blocs : `gap-8` (ou `mb-8`). Dans une carte : `gap-3` à `gap-4`.
- Échelle d'espacement Tailwind par multiples de 4 px (`2`, `3`, `4`, `6`, `8`, `12`). Pas de valeurs arbitraires (`mt-[13px]`).

### 4.2 Rayons (nouveau code)

| Rayon | Usage |
|---|---|
| `rounded-full` | Badges, pastilles, barres de progression, boutons CTA en pilule |
| `rounded-2xl` | Boutons de filtre, champs de saisie, petits blocs, icônes encadrées |
| `rounded-3xl` | Cartes et panneaux |

Les valeurs `rounded-[1.75rem]`, `rounded-[2rem]` et `rounded-[2.5rem]` existent dans le code actuel. On les tolère là où elles sont, mais on n'en crée pas de nouvelles.

### 4.3 Ombres

- Carte standard : `shadow-sm` + `border border-zinc-100`.
- Carte cliquable : `shadow-lg shadow-zinc-200/50`, avec `hover:-translate-y-1 hover:shadow-xl transition`.
- Élément accent (badge d'en-tête, CTA) : `shadow-lg shadow-indigo-100`.
- ❌ Jamais `shadow-2xl` sur plus d'un élément par écran.

---

## 5. En-tête de page — badge + titre + description ⭐

**Motif le plus corrigé du projet.** Toute page applicative de premier niveau (catalogues CE/CO/EE/EO, Ma Progression, Parcours, etc.) commence par cet en-tête, **à l'identique**.

### 5.1 Anatomie

```
[ BADGE ]                         ← pilule indigo, 1 à 3 mots, ex. « Coach CE »
TITRE EN MAJUSCULES DERNIER-MOT   ← le dernier mot (ou groupe) en indigo
Description courte, 1 à 2 phrases, en gris, qui dit quoi faire sur la page.
(optionnel : un élément sous la description, ex. le quota du jour)
```

### 5.2 Composant obligatoire : `PageHeader`

```tsx
import { PageHeader } from "@/components/shared/PageHeader";

<PageHeader
  badge="Coach CE"
  title="Coach de compréhension"
  highlight="écrite"
  description="Choisissez un format précis pour cibler ce qui vous pose le plus de difficulté."
>
  {/* optionnel : élément sous la description, ex. <ComprehensionDailyQuotaBadge skill="CE" /> */}
</PageHeader>
```

Prop optionnelle `aside` : élément affiché à droite sur desktop, en dessous sur mobile (ex. badge « Session vocale »).

Le composant (`src/components/shared/PageHeader.tsx`) porte seul les classes de taille et de couleur. Il n'a **pas de marge externe** : l'espace de 32 px sous l'en-tête est fourni par la page (conteneur `flex flex-col gap-8`, ou `mb-8` autour du composant). Pour changer l'en-tête de **toutes** les pages, on modifie ce fichier, jamais une page.

`ExerciseLayout` (variante `full`, pages QCM, Chasse aux erreurs, Vocabulaire, Examen Civique) délègue à `PageHeader` : même rendu, props `title` + `highlight`. Sa variante `compact` est la barre collante **pendant** un exercice, pas un en-tête de page.

### 5.3 Règles

- Badge : 1 à 3 mots, sans emoji, texte saisi normalement (la classe gère les majuscules).
- Titre : 2 à 5 mots, **exactement un** segment en indigo, toujours à la fin.
- Description : 1 à 2 phrases, 160 caractères max, orientée action (« Choisissez… », « Reprenez… »).
- Aucune autre variante de taille, de couleur ou de marge. Si une page « a besoin » d'un en-tête différent, c'est une décision produit à faire valider, pas une initiative.
- Un contenu contextuel (badge secondaire « Session vocale », quota) se place **à droite sur desktop** (`md:flex-row md:items-end md:justify-between`) et **en dessous sur mobile**.

---

## 6. Composants récurrents

### 6.1 Badges

| Type | Classes |
|---|---|
| Badge d'en-tête | géré par `PageHeader` (§5.2) |
| Badge accent (« Conseillé », « En cours ») | `rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white` |
| Badge neutre (niveau, format, compteur) | `rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-600` |
| Badge contour (métadonnée sur fond coloré) | `variant="outline"` + `border-indigo-200 bg-white text-[10px] font-black uppercase tracking-widest` |
| Badge d'état | `bg-emerald-50 text-emerald-700`, `bg-amber-50 text-amber-700` ou `bg-red-50 text-red-600` |

Badges de carte (format + niveau) :
- Le niveau s'affiche **seul** (`B2`), jamais « Niveau B2 » : le code CECRL suffit et évite la troncature.
- Le libellé de format s'affiche **en entier** (« Document administratif »), jamais abrégé.
- La rangée de badges est en `flex flex-wrap gap-2` : si la place manque, un badge passe à la ligne, il n'est **jamais tronqué**.

Un badge doit être **compréhensible sans explication**. Exemple : « Conseillé » a été mal interprété, donc le libellé doit dire pourquoi (« Conseillé pour vous », « Suite logique »).

### 6.2 Boutons

| Type | Classes |
|---|---|
| **Principal** (1 par zone, max) | `rounded-full bg-indigo-600 px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700` |
| Secondaire | `variant="outline"` + `rounded-2xl font-bold` |
| Filtre (gabarit unique) | `h-12 flex-1 rounded-2xl font-black transition-all` + actif `bg-indigo-600 text-white shadow-lg` / inactif `bg-zinc-50 text-zinc-500 hover:bg-zinc-100` |
| Destructif | `bg-red-600 text-white hover:bg-red-700`, toujours avec confirmation |

- Zone tactile minimale : **44 px** de haut sur mobile (`h-11` ou plus).
- Libellé = verbe d'action (« Commencer », « Continuer », « Réessayer »). Jamais deux boutons au même rôle sur un écran (cf. suppression de « Reprendre », doublon de « Continuer »).

### 6.3 Cartes

- Fond `bg-white`, `rounded-3xl`, `p-6`, bordure `border-zinc-100` ou ombre (pas les deux fortes).
- Structure interne : micro-label → titre → 1 à 2 lignes d'info → action. Maximum **4 informations** visibles par carte.
- Carte mise en avant (ex. « Reprendre ») : **une seule par page**, `border-2 border-indigo-600 bg-indigo-50/60`.
- Une carte cliquable l'est entièrement (toute la surface est le lien), avec l'effet de survol du §4.3. La navigation se fait par un `<Link>` Next.js (clavier, préchargement, nouvel onglet), jamais par `onClick` + `router.push` sur une `div`. Pas de `<Button>` dans un lien : l'action visible est une simple étiquette (`<span>`). Si la carte **déclenche une action** sans changer de page (ex. démarrer une session EE/EO), le bouton d'action de la carte est le seul élément interactif et il est étendu à toute la carte (`relative` sur la carte, `after:absolute after:inset-0` sur le bouton) : jamais d'`onClick` sur la carte elle-même.

### 6.4 Progression

- Barre : piste `rounded-full bg-indigo-100`, remplissage `rounded-full bg-indigo-600`. Terminé : `emerald-600`.
- Toujours accompagner le pourcentage d'un **compte concret** (« 4 / 6 exercices »).
- Un élément à 0 % n'est pas « En cours ». Il reste dans « À découvrir ».

### 6.5 Navigation dans une page

- Choix de niveau A1–B2 : composant `Tabs` (onglets), pas des boutons colorés.
- Listes longues : section repliée par défaut pour « Terminés ». **Jamais d'accordéon imbriqué.**
- Pas d'icône ⓘ / tooltip pour une information essentielle : l'écrire directement.

### 6.6 États obligatoires

Chaque bloc qui charge des données gère ses 3 états :

| État | Rendu |
|---|---|
| Chargement | `Loader2` animé, `text-zinc-300`, centré (`py-20`) |
| Erreur | Carte `border-2 border-red-200 bg-red-50/50` + message clair + bouton « Réessayer » |
| Vide | Carte `border border-dashed border-zinc-200`, texte `zinc-500`, et une action pour en sortir |

### 6.7 Composants partagés existants — à réutiliser

| Besoin | Composant |
|---|---|
| En-tête de page (badge + titre + description) | `src/components/shared/PageHeader.tsx` |
| Bandeau KPI d'une page admin | `src/components/shared/AdminKpiBand.tsx` |
| Barre de progression parcours | `src/components/shared/ParcoursProgressBar.tsx` |
| Pagination de catalogue | `src/components/shared/CataloguePagination.tsx` |
| Badge de quota d'exercices | `src/components/shared/ExerciseQuotaBadge.tsx` |
| Quota journalier CE/CO | `src/components/shared/ComprehensionDailyQuotaBadge.tsx` |
| Composants de base | `src/components/ui/*` (shadcn, **ne pas modifier**) |


### 6.8 Écran d'exercice (pendant la question)

S'applique à QCM, Chasse aux erreurs, Vocabulaire, CE/CO et à tout futur exercice :

- Barre du haut : `ExerciseLayout` variante `compact` (badge indigo, bouton retour 44 px).
- Contexte : `ExerciseContextHeader` (fil d'Ariane, badges niveau indigo + catégorie et difficulté **neutres**).
- Carte de question : `rounded-3xl border border-zinc-100 bg-white shadow-sm`, **sans halo**.
- Réponses cliquables : 44 px minimum, `rounded-2xl` ; sélection = indigo ; après validation : bonne réponse `emerald`, mauvaise `red`.
- Une seule action principale à la fois (« Vérifier », puis « Question suivante ») : bouton indigo `font-black uppercase tracking-widest`.
- Retour après réponse : carte d'état claire (`emerald-50`/`emerald-700` ou `red-50`/`red-700`, bordure `-200`), explication en texte courant, **sans italique ni guillemets**.

---

## 7. Ordinateur vs Mobile ⭐

Chaque écran est **conçu d'abord pour le téléphone**, puis élargi. Une page n'est terminée que si elle est vérifiée dans les deux formats.

### 7.1 Les 3 formats de référence

| Format | Largeur | Préfixe Tailwind | Largeur de test |
|---|---|---|---|
| **Mobile** | < 768 px | *(aucun, style de base)* | **375 px** (iPhone SE / 13 mini) |
| Tablette | 768 – 1023 px | `md:` | 768 px |
| **Ordinateur** | ≥ 1024 px | `lg:` | **1280 px** |

Règle d'écriture : la classe **sans préfixe** décrit le mobile, `md:` / `lg:` décrivent l'élargissement. Exemple : `text-4xl md:text-5xl`, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
❌ Jamais de préfixe `max-md:` pour « réparer » le mobile après coup.

### 7.2 Attendus élément par élément

| Élément | 📱 Mobile (< 768 px) | 💻 Ordinateur (≥ 1024 px) |
|---|---|---|
| **Navigation principale** | Barre du bas fixe (`MobileBottomNav`, 64 px) + menu tiroir (`MobileDrawer`). Le contenu garde une marge basse de 64 px pour ne pas passer sous la barre. | Barre latérale (`Sidebar`). Pas de barre du bas. |
| **Barre de parcours** (`ParcoursTopBar`) | Version compacte empilée. | Version complète sur une ligne. |
| **Marges de page** | `p-4` (16 px) sur les côtés. | `lg:p-12` (48 px), contenu centré `max-w-5xl`. |
| **En-tête de page** (`PageHeader`) | Titre 36 px ; élément `aside` **sous** la description. | Titre 48 px ; `aside` **à droite**, aligné en bas. |
| **Texte** | Courant 14 px, description 16 px. Jamais sous 12 px (sauf micro-labels 10 px). | Courant 16 px, description 18 px. |
| **Filtres** (section, niveau, format) | Empilés en pleine largeur, boutons ≥ 44 px de haut. | Côte à côte (`md:grid-cols-3`). |
| **Grille de cartes** | 1 colonne. | 3 colonnes (2 en tablette). |
| **Carte mise en avant** (« Reprendre ») | Pleine largeur, bouton principal **en pleine largeur sous** le texte. | Pleine largeur, bouton **à droite** du texte. |
| **Maître-détail** (Ma Progression) | Empilé : liste puis détail. Toucher un élément fait défiler jusqu'au détail. | Côte à côte : liste à gauche, détail à droite. |
| **Onglets de niveau** (A1–B2) | Pleine largeur, 4 onglets égaux. | Même rendu, largeur du contenu. |
| **Tableaux** | Défilement horizontal **dans leur propre cadre** (`overflow-x-auto`), jamais la page entière. Si > 4 colonnes : préférer une liste de cartes. | Tableau complet. |
| **Page d'exercice** | Ordre vertical imposé : **consigne → texte/audio → réponses → bouton de validation**. Bouton de validation en pleine largeur. | Mise en page libre (côte à côte possible), même ordre de lecture. |
| **Boutons** | Principal en **pleine largeur** (`w-full md:w-auto`). Zone tactile ≥ 44 × 44 px. | Largeur ajustée au texte. |
| **Fenêtres (dialogues)** | Quasi plein écran, bouton d'action en bas. | Fenêtre centrée, largeur max `max-w-lg`. |
| **Survols** (`hover:`) | Aucune information ne doit dépendre du survol (le doigt ne survole pas). | Effets de survol autorisés en complément. |
| **Images décoratives** (lama, monuments) | Masquées si elles gênent la lecture (`hidden md:block`). | Affichées. |

### 7.3 Interdits mobile

- ❌ Défilement horizontal de la page (tester en balayant l'écran de gauche à droite).
- ❌ Texte ou bouton caché sous la barre de navigation du bas.
- ❌ Hauteur en `100vh` (coupée par la barre d'adresse) → utiliser `100dvh`.
- ❌ Deux éléments tactiles à moins de 8 px l'un de l'autre.
- ❌ Information disponible uniquement dans une infobulle au survol.

### 7.4 Comment vérifier (2 minutes)

1. Chrome → `F12` → icône téléphone (`Ctrl+Shift+M`) → choisir **iPhone SE** (375 px).
2. Parcourir la page de haut en bas : rien ne déborde, tout est lisible sans zoomer, chaque bouton se touche facilement.
3. Passer à **1280 px** (« Responsive » → 1280) et vérifier l'alignement ordinateur décrit au §7.2.

## 8. Ton des textes d'interface

- Vouvoiement, phrases courtes, verbes d'action.
- Parler de l'objectif TEF IRN de l'apprenant (« pour viser le B1 »), pas de la mécanique interne. Jamais de codes internes (C1–C4, noms de tables).
- Ne jamais qualifier de « gratuit » une fonctionnalité réservée à un abonnement payant.

---

## 9. Checklist de relecture UI (avant chaque livraison)

À vérifier sur **chaque** patch qui touche une page visible.

**« Revoir le design d'une page » = revue complète**, jamais seulement les couleurs : en-tête (§5), conteneur (§4.1), couleurs (§2), typographie — tailles, graisses, casse, police (§3), rayons et ombres (§4), composants (§6), mobile (§7), accessibilité RGAA / WCAG 2.2 AA (contraste, clavier, focus visible, `aria-label` des boutons-icônes, `alt` des images, cibles de 44 px).

- [ ] L'en-tête suit le §5 **à l'identique** (taille, couleurs, marges, majuscules via `uppercase`).
- [ ] Une seule couleur d'accent (indigo) ; les autres couleurs sont des états justifiés.
- [ ] Aucun nouveau `slate-*`, `gray-*`, `violet-*`, `purple-*`, `rose-*`.
- [ ] Hiérarchie visible : titres en `font-black`, texte courant en `font-medium`.
- [ ] Texte porteur d'information en `zinc-500` minimum.
- [ ] Un seul bouton principal par zone ; aucun doublon d'action.
- [ ] Rendu vérifié à **375 px et à 1280 px** selon le tableau du §7.2 : pas de débordement, zones tactiles ≥ 44 px, rien sous la barre du bas.
- [ ] États chargement / erreur / vide gérés.
- [ ] Un composant partagé existant a été réutilisé si le motif existait déjà.
- [ ] Pas d'accordéon imbriqué, pas de ⓘ pour une info essentielle.
- [ ] `npm run design:check` passe (classes interdites dans les lignes ajoutées).

---

## 10. Pages conformes

Pages entièrement relues avec la checklist §9. Toute autre page applicative est présumée **non conforme** tant qu'elle n'apparaît pas ici.

| Page | Chantier |
|---|---|
| `/tef-irn/parcours` | `apply_ligne_directrice_design` |
| `/tef-irn/comprehension-ecrite` | `apply_ligne_directrice_design` |
| `/tef-irn/comprehension-orale` | `apply_ligne_directrice_design` (lot 2) |
| `/tef-irn/writing` (catalogue et session) | `apply_ligne_directrice_design` (lots 2 et 3) |
| `/tef-irn/oral` (catalogue et session) | `apply_ligne_directrice_design` (lots 2 et 3) |
| `/tef-irn/comprehension-ecrite/[scenarioId]`, `/tef-irn/comprehension-orale/[scenarioId]` | `apply_ligne_directrice_design` (lot 3) |
| `/tef-irn/practice`, `/tef-irn/grammar-check`, `/tef-irn/vocab` | `apply_ligne_directrice_design` (lot 3) |
| `/tef-irn/correction` | `apply_ligne_directrice_design` (lot 3) |
| Écrans d'exercice QCM, Chasse aux erreurs, Vocabulaire, CE, CO | `apply_ligne_directrice_design` (lot 3 ter) |

---

## 11. Faire évoluer ce document

- Toute décision de design validée par le fondateur est ajoutée ici **dans le même patch** que le code qui l'applique.
- Un motif qui revient sur 2 pages ou plus devient un composant partagé (`src/components/shared/`) et est listé au §6.7.
