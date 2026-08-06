-- Item 10.6b du plan de robustification des étiquettes (dashboard) :
--
-- Aucune leçon n'aborde la formation et la place des adverbes en français,
-- pourtant un point grammatical fréquent aux niveaux A2/B1 (accord des
-- adjectifs déjà couvert, mais pas leur transformation en adverbes).
-- Trou identifié en construisant la liste officielle des étiquettes de leçons.
--
-- Ajoutée en fin de la catégorie Grammaire B1 (order_index 6).

INSERT INTO public.lessons (id, title, slug, objective, duration, difficulty, "mots_clefs_SEO", content, level, category, order_index, tags, have_qcm, have_qcm_centre_entrainement, have_trous)
VALUES (
  'c6d7c4e1-1102-4336-b7bf-f9938dd95043',
  'Les Adverbes au TEF IRN | Formation en -ment et place dans la phrase pour un discours fluide niveau B1',
  'les-adverbes-au-tef-irn',
  $obj$Cette leçon explique comment former des adverbes de manière à partir d'adjectifs et où les placer dans la phrase, pour enrichir votre expression écrite et orale au TEF IRN niveau B1.

À la fin, vous serez capable de :
• Former un adverbe en -ment à partir d'un adjectif au féminin
• Reconnaître et utiliser les adverbes irréguliers (constamment, évidemment, vite, bien, mal)
• Placer correctement l'adverbe selon le temps du verbe (simple ou composé)
• Utiliser les adverbes de fréquence et d'intensité les plus courants au TEF IRN$obj$,
  15,
  'moyen',
  ' préparation TEF IRN, adverbes français, formation adverbe -ment, grammaire TEF IRN B1, expression orale et écrite TEF',
  $lesson$## Théorie — Pourquoi les adverbes rendent votre discours plus naturel au TEF IRN B1

Un adverbe modifie un verbe, un adjectif ou un autre adverbe. Bien les placer et bien les former donne une impression de fluidité — un critère observé à l'oral comme à l'écrit au niveau B1.

### 🔑 La règle générale de formation en -ment

| Étape | Règle | Exemple |
|-------|-------|---------|
| 1 | Prendre l'adjectif au **féminin** | *lent → lente* |
| 2 | Ajouter **-ment** | *lente → lentement* |

| Adjectif (masculin) | Adjectif (féminin) | Adverbe |
|----------------------|---------------------|---------|
| doux | douce | doucement |
| heureux | heureuse | heureusement |
| sérieux | sérieuse | sérieusement |
| franc | franche | franchement |

**Cas particulier** : si l'adjectif se termine déjà par une voyelle au masculin, on ajoute -ment directement au masculin (pas de forme féminine nécessaire).

| Adjectif (masculin) | Adverbe |
|----------------------|---------|
| vrai | vraiment |
| poli | poliment |
| absolu | absolument |

---

### ⚠️ Les adverbes irréguliers à connaître

| Adjectif | Adverbe | Remarque |
|----------|---------|----------|
| constant | **constamment** | -ant → -amment |
| récent | **récemment** | -ent → -emment (se prononce pareil que -amment) |
| bon | **bien** | forme totalement irrégulière |
| mauvais | **mal** | forme totalement irrégulière |
| meilleur | **mieux** | superlatif/comparatif irrégulier (déjà vu) |

**Astuce** : les adjectifs en *-ant* et *-ent* ne suivent jamais la règle générale — retenez-les comme des exceptions à part.

---

### 🔑 Où placer l'adverbe dans la phrase ?

| Temps du verbe | Position de l'adverbe | Exemple |
|-----------------|------------------------|---------|
| Temps simple (présent, imparfait, futur...) | **après** le verbe conjugué | *Elle parle **couramment** français.* |
| Temps composé (passé composé, plus-que-parfait...) | **entre** l'auxiliaire et le participe passé (adverbes courts et fréquents) | *Il a **bien** compris la consigne.* |
| Adverbes longs en -ment (temps composé) | souvent **après** le participe passé | *Elle a répondu **calmement**.* |

---

### 🔑 Adverbes de fréquence et d'intensité utiles au TEF IRN

| Catégorie | Adverbes | Exemple |
|-----------|----------|---------|
| Fréquence | toujours, souvent, parfois, rarement, jamais | *Je vais **rarement** au cinéma.* |
| Intensité | très, trop, assez, tellement, vraiment | *C'est **tellement** utile pour l'examen.* |

---

## Exemples Concrets — Ce qui vous attend le jour J du TEF IRN B1

**Situation 1 — Dialogue type à l'oral**

*— Comment se sont passés vos débuts en France ?*
*— Franchement, ça a été difficile au début. J'ai dû apprendre rapidement les démarches administratives, mais j'ai été aidé constamment par mes voisins. Aujourd'hui, je me sens vraiment plus à l'aise.*

**Situation 2 — Compte-rendu d'expérience (expression écrite)**

Notre équipe a travaillé sérieusement sur ce projet. Nous avons régulièrement échangé avec le client, qui a répondu rapidement à nos questions. Le résultat final a été présenté clairement et a été accueilli favorablement.

---

## L'Astuce du Coach — La formule magique pour former vos adverbes au TEF IRN B1

> Pour former un adverbe, pensez toujours en 2 étapes :
>
> **1. Adjectif au féminin** → *lente*
> **2. + -ment** → *lentement*
>
> 💡 *"Elle a **calmement** expliqué la situation, et j'ai **vraiment** apprécié sa patience."*
>
> Attention aux 5 irréguliers à mémoriser par cœur : **constamment, récemment, bien, mal, mieux** — aucune règle ne les explique, seule la mémorisation fonctionne.$lesson$,
  'B1',
  'grammaire',
  6,
  ARRAY['grammaire', 'adverbes', 'formation -ment'],
  1,
  1,
  8
);

INSERT INTO public.exercises (lesson_id, type, level, instructions, content, tags) VALUES
('c6d7c4e1-1102-4336-b7bf-f9938dd95043', 'trous', 'B1',
  'Corrigez l''erreur : Formation régulière en -ment',
  $j1${"sentence": "Elle parle ___ français. (adverbe de \"lent\")", "explanation": "On forme l'adverbe à partir du féminin de l'adjectif : lente + ment = lentement.", "correct_answer": "lentement", "error_fragment": ""}$j1$::jsonb,
  ARRAY['grammaire', 'adverbes', 'formation -ment']),
('c6d7c4e1-1102-4336-b7bf-f9938dd95043', 'trous', 'B1',
  'Corrigez l''erreur : Adjectif terminé par une voyelle',
  $j2${"sentence": "Il a ___ terminé son travail. (adverbe de \"vrai\")", "explanation": "Quand l'adjectif se termine par une voyelle au masculin, on ajoute -ment directement : vrai + ment = vraiment.", "correct_answer": "vraiment", "error_fragment": ""}$j2$::jsonb,
  ARRAY['grammaire', 'adverbes', 'formation -ment']),
('c6d7c4e1-1102-4336-b7bf-f9938dd95043', 'trous', 'B1',
  'Corrigez l''erreur : Adverbe irrégulier -ant',
  $j3${"sentence": "Il a été aidé ___ par ses voisins. (adverbe de \"constant\")", "explanation": "Les adjectifs en -ant deviennent des adverbes en -amment. Réponse attendue : constamment.", "correct_answer": "constamment", "error_fragment": ""}$j3$::jsonb,
  ARRAY['grammaire', 'adverbes', 'adjectif irrégulier']),
('c6d7c4e1-1102-4336-b7bf-f9938dd95043', 'trous', 'B1',
  'Corrigez l''erreur : Adverbe irrégulier -ent',
  $j4${"sentence": "Ce problème est apparu ___. (adverbe de \"récent\")", "explanation": "Les adjectifs en -ent deviennent des adverbes en -emment. Réponse attendue : récemment.", "correct_answer": "récemment", "error_fragment": ""}$j4$::jsonb,
  ARRAY['grammaire', 'adverbes', 'adjectif irrégulier']),
('c6d7c4e1-1102-4336-b7bf-f9938dd95043', 'trous', 'B1',
  'Corrigez l''erreur : Adverbe totalement irrégulier de "bon"',
  $j5${"sentence": "Il a ___ compris la consigne. (adverbe de \"bon\")", "explanation": "L'adverbe de bon est totalement irrégulier : bien, pas bonnement.", "correct_answer": "bien", "error_fragment": ""}$j5$::jsonb,
  ARRAY['grammaire', 'adverbes', 'adjectif irrégulier']),
('c6d7c4e1-1102-4336-b7bf-f9938dd95043', 'trous', 'B1',
  'Corrigez l''erreur : Adverbe totalement irrégulier de "mauvais"',
  $j6${"sentence": "Cette réunion s'est ___ passée. (adverbe de \"mauvais\")", "explanation": "L'adverbe de mauvais est totalement irrégulier : mal, pas mauvaisement.", "correct_answer": "mal", "error_fragment": ""}$j6$::jsonb,
  ARRAY['grammaire', 'adverbes', 'adjectif irrégulier']),
('c6d7c4e1-1102-4336-b7bf-f9938dd95043', 'trous', 'B1',
  'Corrigez l''erreur : Position au temps composé',
  $j7${"sentence": "Il a ___ compris la consigne. (placer \"bien\" correctement)", "explanation": "Au temps composé, les adverbes courts et fréquents comme bien se placent entre l'auxiliaire et le participe passé.", "correct_answer": "bien", "error_fragment": ""}$j7$::jsonb,
  ARRAY['grammaire', 'adverbes', 'position adverbe']),
('c6d7c4e1-1102-4336-b7bf-f9938dd95043', 'trous', 'B1',
  'Corrigez l''erreur : Adverbe de fréquence',
  $j8${"sentence": "Je vais ___ au cinéma. (adverbe de fréquence faible)", "explanation": "Pour exprimer une fréquence faible, on utilise rarement.", "correct_answer": "rarement", "error_fragment": ""}$j8$::jsonb,
  ARRAY['grammaire', 'adverbes', 'fréquence']),
('c6d7c4e1-1102-4336-b7bf-f9938dd95043', 'qcm', 'B1',
  'Choisissez la bonne réponse (Grammaire B1 — Adverbes)',
  $j9${"options": [["lentement", "lentment", "lentesment", "lenment"], ["vraiment", "vraiement", "vraisment", "vraiiment"], ["constamment", "constantement", "constanment", "constammant"], ["bien", "bonnement", "bonement", "biennement"]], "questions": ["Adverbe de \"lent\" ?", "Adverbe de \"vrai\" ?", "Adverbe de \"constant\" ?", "Adverbe de \"bon\" ?"], "correct_answers": [0, 0, 0, 0]}$j9$::jsonb,
  ARRAY['grammaire', 'adverbes']),
('c6d7c4e1-1102-4336-b7bf-f9938dd95043', 'qcm_centre_entrainement', 'B1',
  'Choisissez la bonne réponse (Grammaire B1 — Adverbes)',
  $j10${"options": [["mal", "mauvaisement", "malement", "mauvaisment"], ["récemment", "récentement", "récement", "récenment"], ["Il a bien compris", "Il a compris bien", "Il bien a compris", "Bien il a compris"], ["rarement", "rarment", "rairement", "rarrement"]], "questions": ["Adverbe de \"mauvais\" ?", "Adverbe de \"récent\" ?", "Quelle phrase place correctement l'adverbe ?", "Adverbe de fréquence faible ?"], "correct_answers": [0, 0, 0, 0]}$j10$::jsonb,
  ARRAY['grammaire', 'adverbes']);
