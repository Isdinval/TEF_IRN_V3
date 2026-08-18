# Taxonomie officielle des étiquettes de leçons (`lessons.tags`)

Ce document sert de source de vérité pour les étiquettes valides sur les leçons et
les exercices LlamaKusi. Il a été construit dans le cadre du chantier de robustification
du dashboard (items 10.6 à 10.12), pour fiabiliser le lien entre une erreur détectée
chez un utilisateur (Écrit, Oral, Examen blanc, Exercices) et la bonne leçon à lui
recommander.

---

## Pourquoi cette liste existe

Avant ce chantier, le rapprochement entre une erreur utilisateur et une leçon se
faisait par une recherche de texte approximative dans le **titre** de la leçon
(`ilike title, '%sous-catégorie%'`), sans jamais utiliser les étiquettes (`tags`)
pourtant déjà posées sur chaque leçon et indexées pour ça (index GIN).

Ce mécanisme fragile devait être remplacé par un rapprochement fiable sur les
étiquettes elles-mêmes (item 10.11) — mais cela suppose que la liste des étiquettes
soit elle-même propre, fixe et sans ambiguïté. D'où ce document.

## Comment elle a été construite

1. Lecture exhaustive des 99 leçons (`lessons`), catégorie par catégorie.
2. Retrait de l'étiquette redondante avec la catégorie (ex. l'étiquette "conjugaison"
   sur une leçon déjà classée catégorie `conjugaison`) — appliqué en base le
   2026-08-06 (`20260806000004_clean_lessons_redundant_category_tags.sql`).
3. Vérification qu'aucune leçon ne se retrouve sans étiquette après ce retrait (0/99).
4. Vérification qu'il n'existe pas d'autre incohérence : espaces parasites, doublons
   au sein d'une même leçon, variations de casse pour un même mot entre deux leçons.
   Aucune trouvée.
5. Combler les trous de contenu identifiés en construisant cette liste : ajout des
   leçons Superlatif (Grammaire, A2), Adverbes (Grammaire, B1), Gérondif et Participe
   Présent (Conjugaison, B2) — la catégorie Orthographe reste volontairement absente
   (elle recoupe les 4 autres catégories existantes, décision d'Olivier).

## La liste (136 étiquettes, 4 catégories, mise à jour au 2026-08-18 — item 22)

### Conjugaison (37)
aller, avoir, concordance des temps, conditionnel passé, conditionnel présent,
discours rapporté, **déclencheurs de l'indicatif**, **déclencheurs du subjonctif**,
être, faire, futur antérieur, futur proche, futur simple, **gérondif**,
imparfait, impératif, négation, **participe présent**, **passé récent**, passé composé,
plus-que-parfait, politesse, pouvoir, présent, quotidien, regret, subjonctif passé,
subjonctif présent, tournures impersonnelles, venir, verbes en -er, verbes en -ir,
verbes en -re, verbes irréguliers, verbes pronominaux, voix passive, vouloir

### Grammaire (56)
accord des adjectifs, accord du participe passé, **adjectifs démonstratifs**,
**adverbes**, articles, **choix défini indéfini**, comparatifs,
connecteurs cause/conséquence, constructions participiales, **depuis**,
**distinction adjectif pronom démonstratif**, **distinction adjectif pronom possessif**,
**distinction ci là**, **distinction depuis pendant il y a**, **distinction y en**,
**déclencheurs de l'indicatif**, **déclencheurs du subjonctif**, démonstratifs,
**est-ce que**, **familles d'articles**, **formation -ment**, **formes interrogatives**,
genre et nombre, **il y a**, infinitif, interrogation, **inversion sujet-verbe**,
mise en relief, **mots interrogatifs**, négation, nominalisation,
**nuances des connecteurs de cause**, **négation avec infinitif**, **pendant**,
**placement pronoms cod coi**, **placement pronoms y en**, pluriel, possessifs,
**pronom COD**, **pronom COI**, **pronom en**, **pronom y**, **pronoms COD antéposés**,
pronoms COD/COI, **pronoms démonstratifs**, pronoms indéfinis, pronoms relatifs,
pronoms relatifs composés, pronoms Y/EN, préférences, prépositions de lieu,
prépositions de temps, quantités, registre soutenu, subjonctif vs indicatif,
**superlatif**

### Syntaxe (27)
argumentation, argumentation avancée, compréhension écrite, compréhension orale,
connecteurs cause/conséquence, connecteurs de but, connecteurs de séquence,
connecteurs logiques complexes, connecteurs opposition, consignes et panneaux,
correspondance, description, discours rapporté, **est-ce que**, expression orale,
exprimer une opinion, **formes interrogatives**, hypothèses et conditions,
interrogation, **inversion sujet-verbe**, **mots interrogatifs**, négation,
ordre des mots, rédaction email amical, rédaction message simple, section b écrit,
vocabulaire salutations

### Vocabulaire (29)
collocations, **collocations faire passer prendre avoir**, faux-amis, registre de
langue, registre soutenu, **types de collocations**, vocabulaire
administratif, vocabulaire arts, vocabulaire civique, vocabulaire culture,
vocabulaire économie, vocabulaire emploi, vocabulaire environnement, vocabulaire
famille, vocabulaire famille/logement, vocabulaire horaires, vocabulaire logement,
vocabulaire loisirs, vocabulaire médias, vocabulaire nombres, vocabulaire prix,
vocabulaire quotidien, vocabulaire salutations, vocabulaire santé, vocabulaire
sciences, vocabulaire société, vocabulaire transports, vocabulaire travail,
vocabulaire ville

**Note** : plusieurs étiquettes existent légitimement dans deux catégories
(ex. "négation" en Conjugaison, Grammaire et Syntaxe ; "déclencheurs du
subjonctif"/"déclencheurs de l'indicatif" en Conjugaison et Grammaire ;
"formes interrogatives"/"mots interrogatifs"/"inversion sujet-verbe"/
"est-ce que" en Grammaire et Syntaxe) — ce n'est pas une erreur, ce sont des
notions transversales qui peuvent être travaillées sous plusieurs angles
selon la leçon.

**Item 22 (2026-08-18)** : 29 étiquettes en **gras** ci-dessus ont été promues
depuis des tags déjà utilisés sur des exercices et des leçons (vérifié :
elles existaient déjà sur `lessons.tags` avant cette promotion, seule leur
absence de cette liste empêchait l'IA de correction de les choisir comme
sous-catégorie). Sélection validée une par une avec Olivier sur deux
critères : une confusion pédagogique classique et isolable (ex. adjectif vs
pronom démonstratif, COD vs COI, subjonctif vs indicatif via leurs
déclencheurs), et un volume d'exercices suffisant pour la justifier — pas
une promotion automatique des ~200 tags hors taxonomie détectés par le
diagnostic complémentaire (item 21) : la plupart sont des habillages
contextuels/thématiques (ex. "annonce immobiliere", "phrases sante"), pas
de vraies notions grammaticales/lexicales isolables, et restent
délibérément hors de cette liste.

## Comment l'utiliser pour la suite du plan

Cette liste est la **référence unique** pour tout ce qui doit désigner une notion
grammaticale/lexicale précise dans le produit, notamment :

- **Item 10.8** — Trancher, catégorie par catégorie, sur les étiquettes "orphelines"
  des exercices (celles qui ne figurent pas dans cette liste : verbes précis, groupes
  de conjugaison, "orthographe"...) : soit les remplacer par l'étiquette officielle
  la plus proche, soit les faire entrer officiellement dans cette liste si elles
  désignent une vraie notion manquante. Item 22 traite une première vague de ce
  chantier (29 étiquettes), le reste des ~200 tags hors taxonomie identifiés
  (item 21) reste délibérément hors de cette liste (contextuel/thématique, pas
  une notion isolable).
- **Item 10.11** ✅ — Le rapprochement erreur → leçon (`analyzeUserErrorsAndRecommend`,
  `src/lib/recommendation-engine.ts`) cherche désormais une leçon par correspondance
  sur `tags` (opérateur de recouvrement de tableau, déjà indexé), et non plus par
  recherche de texte dans le titre.
- **Item 10.12** ✅ — L'IA de correction Écrit (et donc Examen blanc, même pipeline)
  choisit désormais sa sous-catégorie d'erreur **dans cette liste** (garde-fou
  déterministe côté serveur si elle s'en écarte), jamais en la formulant librement —
  ce qui garantit que la sous-catégorie remontée pointera toujours vers une vraie leçon.
- **Toute nouvelle leçon créée à l'avenir** doit être étiquetée avec un ou plusieurs
  mots de cette liste. Si aucune étiquette existante ne convient, c'est le signal
  qu'il faut l'ajouter officiellement ici — pas inventer un mot ponctuel dans
  `lessons.tags` sans le documenter.
- **Tout nouvel exercice** doit partager au moins une étiquette de cette liste avec
  sa leçon parente (règle vérifiée vraie à 100% aujourd'hui, formalisée à l'item 10.9).
- **Cross-tagging autorisé** (item 10.10) : un exercice peut porter des étiquettes
  empruntées à d'autres leçons que la sienne (une notion transversale peut
  légitimement toucher plusieurs leçons), à condition que ces étiquettes empruntées
  existent déjà dans cette taxonomie officielle — jamais un mot inventé à la volée.
  Un garde-fou en base (trigger `check_exercise_shares_lesson_tag`) impose cette
  règle pour tout nouvel exercice ou toute modification de tags.

## Usage sur `exam_questions` (CE/CO d'examen blanc)

Depuis la migration `20260817000002`, les questions CE et CO de `exam_questions`
portent aussi `category`/`tags`, selon la même logique que `exercises` :

- **CE (hors format `trous`) et CO (tous formats)** : tag générique
  `compréhension écrite` / `compréhension orale` (catégorie `Syntaxe`) — ces
  formats évaluent une compréhension globale, pas une notion isolée.
- **CE format `trous`** : tag précis choisi dans cette liste, car ce format
  teste une distinction lexicale/grammaticale ciblée (règle n°3,
  `docs/ce-content-calibration-rules.md`), comme un exercice `trous` classique.

**Contrat `user_errors.sub_category` / `recommendations.sub_category`** :
cette colonne n'est **pas** un synonyme de tag. Elle vaut soit un tag de cette
liste (garanti pour Exercices, Écrit, et désormais CE format `trous`), soit
`NULL` quand la source ne permet pas d'isoler une notion précise (Oral, CE
hors `trous`, CO). Toute nouvelle source d'erreur doit respecter ce contrat.

## Mise à jour de ce document

Cette liste n'est pas figée pour toujours — elle doit évoluer avec le catalogue de
leçons. À chaque nouvelle leçon créée ou étiquette ajoutée, ce document doit être
mis à jour dans le même commit que la migration correspondante, pour rester la
source de vérité.
