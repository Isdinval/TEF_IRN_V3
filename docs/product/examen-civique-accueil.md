# Accueil Examen Civique (`/examen-civique`)

Page d'entrée du produit gratuit Examen Civique : à la fois page d'atterrissage SEO, tableau de bord de l'apprenant et porte d'entrée vers le TEF IRN. Fichiers : `src/app/examen-civique/page.tsx` (Server Component : FAQ, JSON-LD) et `CivicHub.tsx` (rendu).

## Ordre des blocs (une seule colonne, mobile comme ordinateur)

1. **En-tête** (`ExerciseLayout` → `PageHeader`) + « L'examen en bref » : 40 questions, 45 min, 32/40, centre agréé, 5 thématiques, réassurance.
2. **Prochaine étape** — la seule carte mise en avant. Priorité : examen blanc interrompu > révisions dues (« Mémoriser ») > nouvelles questions (« Commencer » / « Continuer »).
3. **Démarche** — choix direct CSP / CR / Naturalisation (`setMention`), niveau de français requis, liens éligibilité et exemptions.
4. **Progression « Êtes-vous prêt ? »** — verdict (moyenne des 5 derniers examens blancs vs seuil) puis questions maîtrisées et 3 indicateurs. Nouvel apprenant : phrase d'accueil. Visiteur anonyme avec progression : invitation à créer un compte.
5. **Votre dossier complet** *(si l'apprenant est prêt)*.
6. **Outils** — Parcourir, Examen blanc, Livret, Centres.
7. **Historique** — mini-graphique des 5 derniers scores (dès 2 examens) + liste.
8. **Votre dossier complet** *(sinon)*, **Guides** de la démarche, **FAQ**.

## Règles

- Aucune infobulle ⓘ : toute explication est écrite dans la page.
- Pas de contenu `sr-only` réservé aux moteurs : tout le contenu indexable est visible.
- « Votre dossier complet » ne s'affiche que pour un visiteur anonyme ou un palier gratuit (`useShowCivicTefBridge`). Visiteur : `/tef-irn/exercice-gratuit` (gratuit, sans compte) ; connecté : `/tef-irn/dashboard`. Le prix reste une information secondaire, jamais « gratuit » pour une offre payante.

## Événements PostHog

| Événement | Propriétés |
|---|---|
| `civic_page_viewed` | `page: "hub"` |
| `civic_bridge_cta_clicked` | `page`, `cta` (`tester_niveau_gratuit` / `decouvrir_llamakusi`), `placement` (`apres_progression` / `bas_de_page`), `exam_ready` |
| `civic_signup_nudge_clicked` | `page: "hub"` |
