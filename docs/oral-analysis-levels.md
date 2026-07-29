# Référentiel de notation — Expression Orale (EO) par niveau CECRL

Ce document sert de source de vérité pour calibrer le prompt IA d'analyse orale
(`src/app/api/oral/analyze/route.ts`). Il définit, pour chaque niveau visé par le
TEF IRN (A2 / B1 / B2) et pour les deux sections d'épreuve, ce que l'IA doit
attendre, tolérer et **s'interdire** sur les 5 critères de la grille officielle.

Principe directeur (identique à l'EE, voir `docs/writing-correction-levels.md`) : le
niveau d'évaluation suit le niveau du **scénario choisi** (`scenario.level`), jamais un
niveau supérieur "par excellence" — c'est la règle anti-biais déjà appliquée en dur dans
le prompt (`oral/analyze/route.ts`).

## Les 2 sections d'épreuve (transverses à tous les niveaux)

- **Section A — Renseignement** (`oral_exam_scenarios.section = 'A'`) : le candidat
  appelle un interlocuteur professionnel (secrétariat, recrutement, cabinet médical...)
  pour obtenir une information. Registre **formel, vouvoiement**.
- **Section B — Convaincre** (`section = 'B'`) : le candidat doit persuader un
  interlocuteur familier (ami, collègue) qui hésite sur un sujet donné. Registre
  **informel, tutoiement**.

Les 5 critères ci-dessous s'appliquent aux deux sections de la même façon : le registre
(vouvoiement/tutoiement) ne doit jamais être confondu avec une erreur de grammaire — un
tutoiement correct en Section B n'est pas une faute.

## Les 5 critères (grille officielle TEF IRN, Compétence Production orale)

Labels d'affichage : voir `src/lib/oral-criteria.ts` (`ORAL_CRITERIA_LABELS`).

1. `pertinence_et_adequation_au_sujet` — le candidat répond-il vraiment à ce qui est
   demandé (obtenir l'info / convaincre), et pas à côté ?
2. `coherence_et_interaction` — le candidat réagit-il à ce que dit l'interlocuteur
   (relances, objections), ou débite-t-il un discours indépendant de l'échange ?
3. `etendue_et_precision_du_vocabulaire` — alimente aussi `user_errors` (catégorie
   `Vocabulaire`, voir `src/app/api/oral/analyze/route.ts`).
4. `correction_grammaticale` — alimente aussi `user_errors` (catégorie `Grammaire`).
5. `aisance_et_fluidite` — hésitations, reformulations, fluidité du débit (tel que
   restitué par la transcription vocale — voir la règle anti-bruit de transcription
   ci-dessous, valable pour ce critère en particulier).

---

## A2 — Renseignement (Section A) / Convaincre (Section B), niveau CSP

**Attendus évalués à ce niveau**
- Questions/réponses courtes mais complètes (ne pas exiger de phrases développées).
- Vocabulaire du quotidien : dates, chiffres, lieux, formules de politesse de base.
- Capacité à répondre à une question simple de l'interlocuteur sans quitter le sujet.

**À signaler en priorité**
- Absence de réponse à une question directe de l'interlocuteur (silence, hors-sujet).
- Erreurs de conjugaison sur les verbes fréquents (être, avoir, aller, faire).
- Incapacité à formuler une phrase complète (mots isolés juxtaposés sans verbe).

**Tolérances (ne pas pénaliser)**
- Hésitations ("euh"), reformulations, pauses — normales à ce niveau.
- Réponses très courtes tant qu'elles répondent effectivement à la question.
- Vocabulaire limité tant que le message reste compréhensible.

**Interdits stricts pour ce niveau**
- Ne jamais exiger de nuance, de justification développée ou de connecteurs élaborés.
- Ne jamais pénaliser l'absence de reformulation face à une objection (A2 n'évalue pas
  la capacité à argumenter, seulement à informer/être informé).

---

## B1 — Renseignement (Section A) / Convaincre (Section B), niveau CR

**Attendus évalués à ce niveau**
- Réponses développées avec une justification simple (parce que, car).
- Réaction visible à une relance ou objection de l'interlocuteur (pas juste "oui, oui").
- Enchaînement logique entre les tours de parole (le candidat construit l'échange).

**À signaler en priorité**
- Réponses qui ignorent l'objection/la relance de l'interlocuteur.
- Erreurs de conjugaison sur les temps du passé, incohérences temporelles.
- Argumentation qui reste au stade de l'opinion sans aucune justification.

**Tolérances**
- Connecteurs encore simples (mais, parce que, donc) — ne pas exiger "cependant",
  "en revanche" à ce niveau.
- Petites hésitations qui n'empêchent pas la compréhension globale.

**Interdits stricts pour ce niveau**
- Ne jamais exiger une argumentation nuancée en plusieurs étapes (c'est l'attendu B2).
- Ne jamais pénaliser un registre informel en Section B (tutoiement, familiarité) —
  c'est le registre attendu par la mise en scène, pas une faute.

---

## B2 — Renseignement (Section A) / Convaincre (Section B), niveau Naturalisation

**Attendus évalués à ce niveau**
- Argumentation nuancée : distinguer plusieurs causes/options, concéder un point puis
  contre-argumenter (voir l'exemplaire de calibration B2 excellent dans `tef_knowledge`).
- Capacité à faire évoluer la position de l'interlocuteur (preuve d'une interaction réelle,
  pas d'un monologue récité).
- Usage du conditionnel dans l'argumentation ("il vaudrait mieux", "ça vaudrait le coup").

**À signaler en priorité**
- Argumentation qui reste générale/évasive malgré une question directe et une relance.
- Absence de prise de position claire quand l'interlocuteur la demande explicitement.
- Erreurs de précision grammaticale qui restent dans le champ B2 (accords complexes,
  subordonnées).

**Tolérances**
- Style encore simple tant que l'argumentation est précise et bien articulée — B2 évalue
  la nuance et l'interaction réelle, pas la sophistication du vocabulaire.

**Interdits stricts pour ce niveau (même à B2, le TEF IRN n'est pas un examen de rhétorique)**
- Ne jamais exiger de vocabulaire soutenu/livresque hors de l'usage courant.
- Ne jamais pénaliser une argumentation efficace parce qu'elle est formulée simplement.

---

## Règles transverses — tous niveaux, tous critères

1. **Anti-biais de niveau** : noter ce qui est observé dans la transcription, jamais ce
   que le niveau visé du scénario laisserait supposer (règle déjà en dur dans le prompt).
2. **Anti-bruit de transcription** : un mot isolé incohérent, sans lien logique avec le
   contexte, est probablement un artefact de reconnaissance vocale (Whisper), pas une
   erreur du candidat — ne jamais l'utiliser comme `evidence` pour baisser un score
   (règle ajoutée après observation en test réel, cf. commit `fix(coach-eo)` du
   29/07/2026).
3. **Matière insuffisante** : en dessous de 20 mots prononcés par le candidat sur toute
   la session, tous les critères sont plafonnés à 20/100 côté serveur, quelle que soit
   la qualité apparente — un échange trop court ne permet pas d'évaluer la grille de
   façon fiable (seuil appliqué en dur, pas seulement demandé au prompt).
4. Le score sur 100 répond à la question *"cette performance est-elle au niveau de CE
   scénario ?"*, pas *"ce candidat parle-t-il un français parfait ?"*.
5. `strengths`/`improvements` doivent citer des faits observés dans la transcription,
   jamais des généralités interchangeables d'une session à l'autre.
