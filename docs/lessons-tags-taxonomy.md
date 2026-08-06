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

## La liste (113 étiquettes, 4 catégories, mise à jour au 2026-08-06)

### Conjugaison (34)
aller, avoir, concordance des temps, conditionnel passé, conditionnel présent,
discours rapporté, être, faire, futur antérieur, futur proche, futur simple,
**gérondif**, imparfait, impératif, négation, **participe présent**, passé composé,
plus-que-parfait, politesse, pouvoir, présent, quotidien, regret, subjonctif passé,
subjonctif présent, tournures impersonnelles, venir, verbes en -er, verbes en -ir,
verbes en -re, verbes irréguliers, verbes pronominaux, voix passive, vouloir

### Grammaire (29)
accord des adjectifs, accord du participe passé, **adverbes**, articles, comparatifs,
connecteurs cause/conséquence, constructions participiales, démonstratifs,
**formation -ment**, genre et nombre, infinitif, interrogation, mise en relief,
négation, nominalisation, pluriel, possessifs, préférences, prépositions de lieu,
prépositions de temps, pronoms COD/COI, pronoms indéfinis, pronoms relatifs,
pronoms relatifs composés, pronoms Y/EN, quantités, registre soutenu,
subjonctif vs indicatif, **superlatif**

### Syntaxe (23)
argumentation, argumentation avancée, compréhension écrite, compréhension orale,
connecteurs cause/conséquence, connecteurs de but, connecteurs de séquence,
connecteurs logiques complexes, connecteurs opposition, consignes et panneaux,
correspondance, description, discours rapporté, expression orale, exprimer une
opinion, hypothèses et conditions, interrogation, négation, ordre des mots,
rédaction email amical, rédaction message simple, section b écrit,
vocabulaire salutations

### Vocabulaire (27)
collocations, faux-amis, registre de langue, registre soutenu, vocabulaire
administratif, vocabulaire arts, vocabulaire civique, vocabulaire culture,
vocabulaire économie, vocabulaire emploi, vocabulaire environnement, vocabulaire
famille, vocabulaire famille/logement, vocabulaire horaires, vocabulaire logement,
vocabulaire loisirs, vocabulaire médias, vocabulaire nombres, vocabulaire prix,
vocabulaire quotidien, vocabulaire salutations, vocabulaire santé, vocabulaire
sciences, vocabulaire société, vocabulaire transports, vocabulaire travail,
vocabulaire ville

**Note** : plusieurs étiquettes existent légitimement dans deux catégories
(ex. "négation" en Conjugaison, Grammaire et Syntaxe) — ce n'est pas une erreur,
ce sont des notions transversales qui peuvent être travaillées sous plusieurs
angles selon la leçon.

## Comment l'utiliser pour la suite du plan

Cette liste est la **référence unique** pour tout ce qui doit désigner une notion
grammaticale/lexicale précise dans le produit, notamment :

- **Item 10.8** — Trancher, catégorie par catégorie, sur les étiquettes "orphelines"
  des exercices (celles qui ne figurent pas dans cette liste : verbes précis, groupes
  de conjugaison, "orthographe"...) : soit les remplacer par l'étiquette officielle
  la plus proche, soit les faire entrer officiellement dans cette liste si elles
  désignent une vraie notion manquante.
- **Item 10.11** ✅ — Le rapprochement erreur → leçon (`analyzeUserErrorsAndRecommend`,
  `src/lib/recommendation-engine.ts`) cherche désormais une leçon par correspondance
  sur `tags` (opérateur de recouvrement de tableau, déjà indexé), et non plus par
  recherche de texte dans le titre.
- **Item 10.12** — L'IA de correction Écrit (et donc Examen blanc) doit choisir sa
  sous-catégorie d'erreur **dans cette liste**, jamais en la formulant librement —
  c'est ce qui garantit que la sous-catégorie remontée pourra toujours être reliée
  à une vraie leçon.
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

## Mise à jour de ce document

Cette liste n'est pas figée pour toujours — elle doit évoluer avec le catalogue de
leçons. À chaque nouvelle leçon créée ou étiquette ajoutée, ce document doit être
mis à jour dans le même commit que la migration correspondante, pour rester la
source de vérité.
