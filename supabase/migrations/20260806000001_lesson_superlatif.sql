-- Item 10.6a du plan de robustification des étiquettes (dashboard) :
--
-- La leçon "Comparer et Exprimer ses Préférences" (Grammaire A2) couvre les
-- comparatifs (plus/moins/aussi que) mais aucune leçon n'aborde le superlatif
-- (le plus / le moins), pourtant un point classique du TEF IRN. Ce trou avait
-- été identifié en construisant la liste officielle des étiquettes de leçons.
--
-- Ajoutée en fin de la catégorie Grammaire A2 (order_index 7) pour ne pas
-- perturber l'ordre des leçons existantes.
--
-- Toutes les chaînes contenant des apostrophes françaises utilisent la
-- syntaxe dollar-quoted ($tag$...$tag$) plutôt que l'échappement '' --
-- plus sûr et plus lisible pour un texte aussi long.

INSERT INTO public.lessons (id, title, slug, objective, duration, difficulty, "mots_clefs_SEO", content, level, category, order_index, tags, have_qcm, have_qcm_centre_entrainement, have_trous)
VALUES (
  '006661aa-20f7-41ea-a209-93ceb99655fd',
  'Le Superlatif au TEF IRN | Le plus, le moins : exprimer le degré extrême pour marquer des points niveau A2',
  'le-superlatif-au-tef-irn',
  $obj$Cette leçon explique comment maîtriser le superlatif (le plus / le moins), la suite logique du comparatif, pour désigner ce qui est au sommet ou au plus bas d'un groupe au TEF IRN niveau A2.

À la fin, vous serez capable de :
• Former le superlatif de supériorité et d'infériorité avec un adjectif ou un adverbe
• Utiliser correctement les superlatifs irréguliers (le meilleur, le mieux, le pire) — l'erreur la plus repérée par les correcteurs
• Placer correctement l'article défini selon la position de l'adjectif
• Préciser un groupe de comparaison avec "de" (le plus animé de la ville)$obj$,
  15,
  'facile',
  ' préparation TEF IRN, superlatif français, comparatifs et superlatifs, grammaire TEF IRN A2, expression écrite et orale TEF',
  $lesson$## Théorie — Pourquoi le superlatif renforce vos réponses au TEF IRN A2

Après le comparatif (plus/moins/aussi que), le superlatif est l'étape suivante pour marquer des points : il permet de désigner ce qui est au sommet ou au plus bas d'un groupe. C'est une structure courte, mais très remarquée par les examinateurs quand elle est bien placée.

### 🔑 Les 2 structures de superlatif à connaître

| Type | Structure | Exemple |
|------|-----------|---------|
| **Le plus (supériorité)** | *le/la/les plus + adjectif* | *C'est **le plus grand** quartier de la ville.* |
| **Le moins (infériorité)** | *le/la/les moins + adjectif* | *C'est **la moins chère** des trois solutions.* |

**Avec un adverbe** (pour qualifier une action) :

| Structure | Exemple |
|-----------|---------|
| *le plus + adverbe* | *C'est elle qui parle **le plus** vite.* |
| *le moins + adverbe* | *C'est lui qui travaille **le moins** souvent.* |

---

### ⚠️ Les superlatifs irréguliers

Comme au comparatif, *bon* et *bien* ont des formes irrégulières au superlatif — c'est l'erreur la plus repérée par les correcteurs.

| Mot de base | Superlatif | Exemple |
|-------------|-----------|---------|
| bon(ne) (adjectif) | **le/la meilleur(e)** | *C'est **le meilleur** restaurant du quartier.* |
| bien (adverbe) | **le mieux** | *C'est elle qui s'exprime **le mieux**.* |
| mauvais(e) (adjectif) | **le/la pire** (ou *le/la plus mauvais(e)*) | *C'était **le pire** moment de la journée.* |

**Astuce** : même piège qu'au comparatif — remplaçable par *bon* → **meilleur** ; par *bien* → **mieux**.

---

### 🔑 Place de l'adjectif au superlatif

L'article défini (*le/la/les*) doit apparaître **deux fois** si l'adjectif se place après le nom.

| Position de l'adjectif | Structure | Exemple |
|--------------------------|-----------|---------|
| Avant le nom (adjectifs courts : petit, grand, bon...) | *le/la/les plus + adjectif + nom* | *le plus grand appartement* |
| Après le nom (la majorité des adjectifs) | *le/la/les + nom + le/la/les plus + adjectif* | *l'appartement **le plus** spacieux* |

---

### 🔑 Préciser le groupe de comparaison avec "de"

Pour indiquer dans quel ensemble se situe le superlatif, on ajoute *de + groupe*.

| Structure | Exemple |
|-----------|---------|
| *le plus/moins + adjectif + de + nom* | *C'est le quartier **le plus animé de** la ville.* |
| *le/la meilleur(e) + nom + de + nom* | *C'est **la meilleure** période **de** l'année pour visiter.* |

---

## Exemples Concrets — Ce qui vous attend le jour J du TEF IRN A2

**Situation 1 — Dialogue type à l'oral**

*— Quel est le meilleur quartier de la ville selon vous ?*
*— Pour moi, c'est le centre-ville : c'est **le plus animé de** la ville et **le mieux** desservi par les transports. C'est aussi **le plus cher**, mais c'est **le meilleur** choix si on travaille en centre.*

**Situation 2 — Comparaison de logements (expression écrite)**

Parmi les trois appartements visités, le premier est **le plus spacieux** mais **le moins bien situé**. Le deuxième est **le moins cher de** tous, et le troisième reste **la meilleure** option car il est **le plus proche** de mon travail.

---

## L'Astuce du Coach — La formule magique pour réussir vos superlatifs au TEF IRN A2

> Une fois le comparatif maîtrisé, le superlatif s'obtient simplement en ajoutant l'article défini :
>
> **comparatif** *plus grand que* → **superlatif** *le plus grand*
>
> 💡 *"C'est **le plus grand** appartement **de** tous ceux que j'ai visités, et c'est aussi **le mieux** situé."*
>
> En cas de doute avec *bon/bien* : remplaçable par *bon* → **le meilleur** ; par *bien* → **le mieux**.$lesson$,
  'A2',
  'grammaire',
  7,
  ARRAY['grammaire', 'superlatif', 'comparatifs'],
  1,
  1,
  8
);

INSERT INTO public.exercises (lesson_id, type, level, instructions, content, tags) VALUES
('006661aa-20f7-41ea-a209-93ceb99655fd', 'trous', 'A2',
  'Corrigez l''erreur : Superlatif de supériorité',
  $j1${"sentence": "C'est ___ quartier de la ville. (superlatif de \"grand\")", "explanation": "Le superlatif de supériorité se forme avec le/la/les plus + adjectif. Réponse attendue : le plus grand.", "correct_answer": "le plus grand", "error_fragment": ""}$j1$::jsonb,
  ARRAY['grammaire', 'superlatif', 'supériorité']),
('006661aa-20f7-41ea-a209-93ceb99655fd', 'trous', 'A2',
  'Corrigez l''erreur : Superlatif d''infériorité',
  $j2${"sentence": "C'est ___ des trois solutions. (superlatif de \"chère\")", "explanation": "Le superlatif d'infériorité se forme avec le/la/les moins + adjectif. Réponse attendue : la moins chère.", "correct_answer": "la moins chère", "error_fragment": ""}$j2$::jsonb,
  ARRAY['grammaire', 'superlatif', 'infériorité']),
('006661aa-20f7-41ea-a209-93ceb99655fd', 'trous', 'A2',
  'Corrigez l''erreur : Superlatif irrégulier de "bon"',
  $j3${"sentence": "C'est ___ restaurant du quartier. (superlatif irrégulier de \"bon\")", "explanation": "Le plus bon n'existe pas. Le superlatif irrégulier de bon est le meilleur.", "correct_answer": "le meilleur", "error_fragment": ""}$j3$::jsonb,
  ARRAY['grammaire', 'superlatif', 'adjectif irrégulier', 'meilleur']),
('006661aa-20f7-41ea-a209-93ceb99655fd', 'trous', 'A2',
  'Corrigez l''erreur : Superlatif irrégulier de "bien"',
  $j4${"sentence": "C'est elle qui s'exprime ___. (superlatif irrégulier de \"bien\")", "explanation": "Le plus bien n'existe pas. Le superlatif irrégulier de l'adverbe bien est le mieux.", "correct_answer": "le mieux", "error_fragment": ""}$j4$::jsonb,
  ARRAY['grammaire', 'superlatif', 'adjectif irrégulier', 'mieux']),
('006661aa-20f7-41ea-a209-93ceb99655fd', 'trous', 'A2',
  'Corrigez l''erreur : Groupe de comparaison avec "de"',
  $j5${"sentence": "C'est le quartier le plus animé ___ la ville. (préposition pour préciser le groupe)", "explanation": "Pour préciser le groupe de comparaison, on utilise de. Réponse attendue : de.", "correct_answer": "de", "error_fragment": ""}$j5$::jsonb,
  ARRAY['grammaire', 'superlatif', 'groupe de comparaison']),
('006661aa-20f7-41ea-a209-93ceb99655fd', 'trous', 'A2',
  'Corrigez l''erreur : Position de l''adjectif après le nom',
  $j6${"sentence": "C'est l'appartement ___ spacieux. (superlatif de \"spacieux\", adjectif après le nom)", "explanation": "Quand l'adjectif se place après le nom, l'article défini réapparaît devant plus. Réponse attendue : le plus.", "correct_answer": "le plus", "error_fragment": ""}$j6$::jsonb,
  ARRAY['grammaire', 'superlatif', 'position adjectif']),
('006661aa-20f7-41ea-a209-93ceb99655fd', 'trous', 'A2',
  'Corrigez l''erreur : Superlatif irrégulier de "mauvais"',
  $j7${"sentence": "C'était ___ moment de la journée. (superlatif irrégulier de \"mauvais\")", "explanation": "Le superlatif irrégulier de mauvais est le pire (ou le plus mauvais). Réponse attendue : le pire.", "correct_answer": "le pire", "error_fragment": ""}$j7$::jsonb,
  ARRAY['grammaire', 'superlatif', 'adjectif irrégulier']),
('006661aa-20f7-41ea-a209-93ceb99655fd', 'trous', 'A2',
  'Corrigez l''erreur : Superlatif avec un adverbe',
  $j8${"sentence": "C'est elle qui parle ___ vite. (superlatif de l'adverbe \"vite\")", "explanation": "Avec un adverbe, on utilise le plus invariable (pas d'accord). Réponse attendue : le plus.", "correct_answer": "le plus", "error_fragment": ""}$j8$::jsonb,
  ARRAY['grammaire', 'superlatif', 'adverbe']),
('006661aa-20f7-41ea-a209-93ceb99655fd', 'qcm', 'A2',
  'Choisissez la bonne réponse (Grammaire A2 — Superlatif)',
  $j9${"options": [["le plus bon", "le meilleur", "le mieux", "le plus bien"], ["la moins chère", "la moins cher", "le moins chère", "moins chère"], ["le mieux", "le meilleur", "le plus bien", "la mieux"], ["le pire", "le plus mauvais", "le moins bon", "le mauvais"]], "questions": ["C'est ___ restaurant de la ville. (bon)", "C'est ___ des trois offres. (chère)", "C'est lui qui cuisine ___. (bien)", "C'était ___ jour de l'année. (mauvais)"], "correct_answers": [1, 0, 0, 0]}$j9$::jsonb,
  ARRAY['grammaire', 'superlatif']),
('006661aa-20f7-41ea-a209-93ceb99655fd', 'qcm_centre_entrainement', 'A2',
  'Choisissez la bonne réponse (Grammaire A2 — Superlatif)',
  $j10${"options": [["le plus grand", "plus grand", "le grand plus", "grand le plus"], ["de", "que", "à", "en"], ["le mieux", "le meilleur", "le plus bien", "meilleur"], ["la moins", "le moins", "moins la", "la moin"]], "questions": ["C'est ___ appartement de tous ceux visités. (grand)", "C'est le quartier le plus animé ___ la ville.", "C'est elle qui s'exprime ___ dans le groupe. (bien)", "C'est ___ chère des trois solutions. (chère)"], "correct_answers": [0, 0, 0, 0]}$j10$::jsonb,
  ARRAY['grammaire', 'superlatif']);
