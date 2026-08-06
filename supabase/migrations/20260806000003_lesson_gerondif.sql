-- Item 10.6c du plan de robustification des étiquettes (dashboard) :
--
-- Aucune leçon n'aborde le gérondif ni le participe présent, pourtant un
-- point B2 assez classique (simultanéité, manière, cause). Trou identifié
-- en construisant la liste officielle des étiquettes de leçons.
--
-- Classée en Conjugaison (comme "Voix Passive et Tournures Impersonnelles",
-- une construction verbale déjà classée dans cette catégorie), plutôt qu'en
-- Grammaire -- décision par défaut d'Olivier, non contestée.
--
-- Ajoutée en fin de la catégorie Conjugaison B2 (order_index 6).

INSERT INTO public.lessons (id, title, slug, objective, duration, difficulty, "mots_clefs_SEO", content, level, category, order_index, tags, have_qcm, have_qcm_centre_entrainement, have_trous)
VALUES (
  '65056aca-daaa-468c-b7e9-5437c8c7b8e9',
  'Le Gérondif et le Participe Présent au TEF IRN | En + -ant : simultanéité, manière et cause niveau B2',
  'le-gerondif-et-le-participe-present-au-tef-irn',
  $obj$Cette leçon explique comment former et utiliser le gérondif (en + participe présent) et le participe présent seul, deux structures qui permettent d'alléger et de varier vos phrases au TEF IRN niveau B2.

À la fin, vous serez capable de :
• Former le participe présent d'un verbe régulier ou irrégulier
• Utiliser le gérondif pour exprimer la simultanéité, la manière ou la cause
• Distinguer le gérondif (en + participe présent) du participe présent seul
• Éviter l'erreur la plus fréquente : confondre le participe présent avec l'adjectif verbal$obj$,
  15,
  'difficile',
  ' préparation TEF IRN, gérondif français, participe présent, conjugaison TEF IRN B2, expression écrite avancée TEF',
  $lesson$## Théorie — Pourquoi le gérondif enrichit votre discours au TEF IRN B2

Le gérondif et le participe présent permettent d'alléger une phrase en évitant une proposition subordonnée complète — un signe de maîtrise recherché au niveau B2, à l'oral comme à l'écrit.

### 🔑 Comment former le participe présent

| Étape | Règle | Exemple |
|-------|-------|---------|
| 1 | Prendre la base de la 1ère personne du pluriel au présent | *nous parl-ons* |
| 2 | Remplacer la terminaison par **-ant** | *parlant* |

| Verbe | Base (nous) | Participe présent |
|-------|-------------|---------------------|
| parler | parl-ons | parlant |
| finir | finiss-ons | finissant |
| faire | fais-ons | faisant |

**3 exceptions à connaître** :

| Verbe | Participe présent |
|-------|---------------------|
| être | **étant** |
| avoir | **ayant** |
| savoir | **sachant** |

---

### 🔑 Le gérondif : en + participe présent

Le gérondif se forme en ajoutant *en* devant le participe présent. Il exprime la **simultanéité**, la **manière** ou la **cause** — et se rapporte toujours au sujet du verbe principal.

| Valeur | Exemple |
|--------|---------|
| **Simultanéité** (deux actions en même temps) | *Il écoute la radio **en conduisant**.* |
| **Manière** (comment on fait l'action) | *Elle a réussi **en travaillant** régulièrement.* |
| **Cause** (pourquoi) | ***En arrivant** en retard, il a raté le début de l'entretien.* |

**Astuce** : si on peut remplacer par *pendant que* (simultanéité), *grâce à/en faisant ça* (manière) ou *parce que* (cause), le gérondif est la structure adaptée.

---

### ⚠️ Gérondif ou participe présent seul ?

C'est l'erreur la plus fréquente au niveau B2 : le gérondif a toujours *en* devant lui, le participe présent seul n'en a jamais.

| Structure | Usage | Exemple |
|-----------|-------|---------|
| **en + participe présent** (gérondif) | action simultanée/manière/cause, se rapporte au sujet | *Il chante **en travaillant**.* |
| **participe présent seul** | remplace une proposition relative ("qui + verbe"), s'accorde parfois comme un adjectif | *Les candidats **habitant** à Paris... (= qui habitent à Paris)* |

---

### ⚠️ Participe présent ou adjectif verbal ?

Certains participes présents ont une forme d'adjectif légèrement différente, qui s'accorde en genre et en nombre — contrairement au participe présent, toujours invariable.

| Verbe | Participe présent (invariable) | Adjectif verbal (variable) |
|-------|----------------------------------|------------------------------|
| fatiguer | fatiguant | fatigant(e) |
| négliger | négligeant | négligent(e) |
| différer | différant | différent(e) |

---

## Exemples Concrets — Ce qui vous attend le jour J du TEF IRN B2

**Situation 1 — Dialogue type à l'oral**

*— Comment avez-vous amélioré votre français aussi rapidement ?*
*— En pratiquant tous les jours et en regardant des séries en version originale, j'ai progressé très vite. En arrivant en France, je ne comprenais presque rien, mais en persévérant, j'ai fini par me sentir à l'aise.*

**Situation 2 — Argumentation (expression écrite)**

Les candidats souhaitant réussir le TEF IRN doivent s'entraîner régulièrement. En multipliant les exercices oraux et en révisant chaque jour le vocabulaire, on progresse plus rapidement qu'en révisant seulement la veille de l'examen.

---

## L'Astuce du Coach — La formule magique pour maîtriser le gérondif au TEF IRN B2

> Pour ne jamais confondre gérondif et participe présent, posez-vous une seule question : y a-t-il *en* devant ?
>
> **en + participe présent** → gérondif (simultanéité/manière/cause) : *en travaillant*
> **participe présent seul** → remplace "qui + verbe" : *les étudiants travaillant sérieusement*
>
> 💡 *"C'est **en révisant** chaque jour et **en pratiquant** l'oral que les candidats **souhaitant** réussir progressent le plus vite."*
>
> 3 exceptions à retenir par cœur : être → **étant**, avoir → **ayant**, savoir → **sachant**.$lesson$,
  'B2',
  'conjugaison',
  6,
  ARRAY['conjugaison', 'gérondif', 'participe présent'],
  1,
  1,
  8
);

INSERT INTO public.exercises (lesson_id, type, level, instructions, content, tags) VALUES
('65056aca-daaa-468c-b7e9-5437c8c7b8e9', 'trous', 'B2',
  'Corrigez l''erreur : Formation régulière du participe présent',
  $j1${"sentence": "Il écoute la radio en ___. (participe présent de \"conduire\", base : nous conduis-ons)", "explanation": "On forme le participe présent à partir de la base de nous au présent + ant : conduis + ant = conduisant.", "correct_answer": "conduisant", "error_fragment": ""}$j1$::jsonb,
  ARRAY['conjugaison', 'gérondif', 'formation']),
('65056aca-daaa-468c-b7e9-5437c8c7b8e9', 'trous', 'B2',
  'Corrigez l''erreur : Exception "être"',
  $j2${"sentence": "___ en retard, il a présenté ses excuses. (participe présent de \"être\", exception)", "explanation": "Le participe présent de être est une exception totale : étant.", "correct_answer": "Étant", "error_fragment": ""}$j2$::jsonb,
  ARRAY['conjugaison', 'gérondif', 'exception']),
('65056aca-daaa-468c-b7e9-5437c8c7b8e9', 'trous', 'B2',
  'Corrigez l''erreur : Exception "avoir"',
  $j3${"sentence": "___ déjà fini, elle a pu partir plus tôt. (participe présent de \"avoir\", exception)", "explanation": "Le participe présent de avoir est une exception totale : ayant.", "correct_answer": "Ayant", "error_fragment": ""}$j3$::jsonb,
  ARRAY['conjugaison', 'gérondif', 'exception']),
('65056aca-daaa-468c-b7e9-5437c8c7b8e9', 'trous', 'B2',
  'Corrigez l''erreur : Gérondif de simultanéité',
  $j4${"sentence": "Il chante ___ travaillant. (marqueur du gérondif)", "explanation": "Le gérondif se forme avec en + participe présent : en travaillant.", "correct_answer": "en", "error_fragment": ""}$j4$::jsonb,
  ARRAY['conjugaison', 'gérondif', 'simultanéité']),
('65056aca-daaa-468c-b7e9-5437c8c7b8e9', 'trous', 'B2',
  'Corrigez l''erreur : Gérondif de manière',
  $j5${"sentence": "Elle a réussi ___ travaillant régulièrement. (gérondif de manière)", "explanation": "Pour exprimer la manière, on utilise le gérondif : en travaillant régulièrement.", "correct_answer": "en", "error_fragment": ""}$j5$::jsonb,
  ARRAY['conjugaison', 'gérondif', 'manière']),
('65056aca-daaa-468c-b7e9-5437c8c7b8e9', 'trous', 'B2',
  'Corrigez l''erreur : Participe présent seul (relative)',
  $j6${"sentence": "Les candidats ___ à Paris peuvent choisir un autre centre. (participe présent de \"habiter\", sans en, = qui habitent)", "explanation": "Sans en devant, le participe présent seul remplace une proposition relative : les candidats habitant à Paris (= qui habitent à Paris).", "correct_answer": "habitant", "error_fragment": ""}$j6$::jsonb,
  ARRAY['conjugaison', 'participe présent', 'relative']),
('65056aca-daaa-468c-b7e9-5437c8c7b8e9', 'trous', 'B2',
  'Corrigez l''erreur : Adjectif verbal accordé',
  $j7${"sentence": "Cette tâche est très ___. (adjectif verbal de \"fatiguer\", accordé au féminin)", "explanation": "L'adjectif verbal s'accorde et diffère parfois du participe présent : fatiguant (invariable) devient fatigante (adjectif, féminin).", "correct_answer": "fatigante", "error_fragment": ""}$j7$::jsonb,
  ARRAY['conjugaison', 'participe présent', 'adjectif verbal']),
('65056aca-daaa-468c-b7e9-5437c8c7b8e9', 'trous', 'B2',
  'Corrigez l''erreur : Exception "savoir"',
  $j8${"sentence": "___ la réponse, elle a levé la main immédiatement. (participe présent de \"savoir\", exception)", "explanation": "Le participe présent de savoir est une exception totale : sachant.", "correct_answer": "Sachant", "error_fragment": ""}$j8$::jsonb,
  ARRAY['conjugaison', 'gérondif', 'exception']),
('65056aca-daaa-468c-b7e9-5437c8c7b8e9', 'qcm', 'B2',
  'Choisissez la bonne réponse (Conjugaison B2 — Gérondif et participe présent)',
  $j9${"options": [["étant", "êtant", "étante", "étanant"], ["ayant", "avant", "ayanant", "ayante"], ["sachant", "savant", "sachante", "sachanant"], ["en travaillant", "travaillant", "en travailler", "au travaillant"]], "questions": ["Participe présent de \"être\" ?", "Participe présent de \"avoir\" ?", "Participe présent de \"savoir\" ?", "Gérondif de manière avec \"travailler\" ?"], "correct_answers": [0, 0, 0, 0]}$j9$::jsonb,
  ARRAY['conjugaison', 'gérondif']),
('65056aca-daaa-468c-b7e9-5437c8c7b8e9', 'qcm_centre_entrainement', 'B2',
  'Choisissez la bonne réponse (Conjugaison B2 — Gérondif et participe présent)',
  $j10${"options": [["conduisant", "conduisiant", "conduiant", "conduireant"], ["fatigant", "fatiguant", "fatigeant", "fatiguent"], ["habitant", "en habitant", "habite", "habitante"], ["en révisant", "révisant", "en réviser", "au révisant"]], "questions": ["Participe présent de \"conduire\" ?", "Participe présent (invariable) de \"fatiguer\" ?", "Les candidats ___ à Paris (= qui habitent) ?", "Gérondif de manière avec \"réviser\" ?"], "correct_answers": [0, 1, 0, 0]}$j10$::jsonb,
  ARRAY['conjugaison', 'gérondif']);
