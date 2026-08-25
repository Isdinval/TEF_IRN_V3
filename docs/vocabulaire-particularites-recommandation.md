# Le Vocabulaire est un cas à part dans le moteur de recommandation

Ce document existe pour ne plus perdre ce point entre deux sessions : le
Vocabulaire ne se comporte **pas** comme les 3 autres catégories (Conjugaison,
Grammaire, Syntaxe) dans le pipeline erreur → leçon → exercice, pour deux
raisons structurelles distinctes. À lire avant tout audit de couverture, toute
requête de diagnostic, ou toute évolution du moteur de recommandation touchant
au Vocabulaire.

---

## 1. `exercises.category` ne vaut JAMAIS `'Vocabulaire'`

Vérifié en base (2026-08-25) :

```sql
select category, count(*) from exercises where category is not null group by category;
-- Conjugaison  : 389
-- Grammaire    : 956
-- Orthographe  : 92
-- Syntaxe      : 199
-- Vocabulaire  : 0   <-- toujours zéro
```

Pourtant, **24 leçons** sont catégorisées `vocabulaire` (`lessons.category`).
Les exercices qui testent un point de vocabulaire existent bel et bien, mais
sont catégorisés selon la compétence linguistique réellement testée
(Grammaire, Conjugaison, Syntaxe) plutôt que selon le thème lexical — même
pattern que la divergence déjà documentée dans
[`lessons-tags-taxonomy.md`](./lessons-tags-taxonomy.md) pour ~950 exercices
sur ~1050 au global.

### Conséquence pratique

**Ne jamais filtrer ou auditer par `exercises.category = 'Vocabulaire'`** — le
résultat sera toujours 0, à tort. Le rapprochement doit se faire uniquement
sur `tags` (recoupement avec la taxonomie officielle
`SOUS_CATEGORIES_BY_TYPE.vocabulaire`, voir `writing/correct/route.ts`),
jamais sur la catégorie de l'exercice lui-même.

C'est précisément ce que fait `resolveNextExercises`
(`src/lib/recommendation-resolver.ts`) depuis l'item 3bis du plan "Refonte
matching Leçon → Exercices" (2026-08-25) : le filtre `category` devient une
préférence souple (`categoryMismatch`) plutôt qu'un filtre dur dès qu'un tag
précis est fourni — un exercice Vocabulaire recommandé se retrouve donc bien
servi, même si aucun exercice n'est jamais littéralement `category='Vocabulaire'`.

Vérifié à l'audit du 2026-08-25 : une fois cette règle appliquée (recherche
par tag, sans filtre sur `exercises.category`), la couverture leçon/exercice
du Vocabulaire est à **100 %** partout où une leçon existe — comme pour les 3
autres catégories.

---

## 2. Le SRS vocabulaire est un système entièrement séparé

LlamaKusi a en réalité **deux systèmes de vocabulaire indépendants**, qui ne
communiquent jamais entre eux :

| | Système "erreur classique" | Système "SRS vocabulaire" |
|---|---|---|
| Tables | `user_errors`, `lessons`, `exercises` | `vocabulary`, `user_vocabulary_reviews` |
| Alimenté par | `trackUserError()` (EE/EO/CE/CO, `type_erreur='vocabulaire'`) | Révisions faites sur `/tef-irn/vocab` |
| Moteur de reco | `analyzeUserErrorsAndRecommend()` | `analyzeVocabStruggleAndRecommend()` |
| Granularité | Thématique (`sub_category`, ex. `vocabulaire administratif`, `faux-amis`) | Mot précis (`vocabulary.word`) |
| Type de recommandation produite | `lesson` ou `exercise` | `vocab` |

Une erreur de vocabulaire détectée dans une correction écrite ou orale
(ex. un faux-ami mal employé) alimente `user_errors` et peut déclencher une
recommandation de **leçon** ou d'**exercice QCM** sur le thème concerné — ce
canal fonctionne normalement (cf. point 1 ci-dessus).

**Mais elle n'a strictement aucune influence sur le SRS vocabulaire.**
`analyzeVocabStruggleAndRecommend()` ne lit que `user_vocabulary_reviews`
(`ease_factor <= 2.0`, `consecutive_correct = 0`) — jamais `user_errors`. Le
mot précis qui a posé problème dans une correction n'est jamais rattaché à
une entrée `vocabulary`, et ne remonte donc jamais plus tôt en révision SRS
à cause de cette erreur.

### Ce que ça veut dire concrètement pour l'utilisateur

Un candidat qui confond systématiquement deux faux-amis dans ses productions
écrites peut recevoir une recommandation de leçon/exercice sur "faux-amis" en
général (canal 1), mais les mots précis concernés ne seront jamais priorisés
dans ses révisions de vocabulaire du quotidien (canal 2) tant qu'il ne les a
pas lui-même mal révisés sur `/tef-irn/vocab`.

### Statut

Identifié le 2026-08-25 (chantier "Refonte matching Leçon → Exercices"),
**non traité** — chantier séparé, nécessiterait a minima que l'IA de
correction identifie le mot fautif précis (pas seulement la sous-catégorie
thématique) et un mécanisme de rapprochement vers `vocabulary.word`. Hors
scope du moteur de recommandation leçon/exercice actuel.

---

## Rappel pour toute session future (humaine ou IA)

Avant de répondre à une question sur le Vocabulaire dans le contexte du
moteur de recommandation, dashboard, ou couverture de contenu : relire ce
document. Les deux pièges classiques sont (1) auditer/filtrer par
`exercises.category = 'Vocabulaire'` et conclure à tort à un manque de
contenu, et (2) supposer qu'une erreur de vocabulaire détectée influence le
SRS — ce n'est le cas d'aucun des deux.
