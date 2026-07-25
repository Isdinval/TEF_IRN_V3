# Référentiel de correction — Expression Écrite (EE) par niveau CECRL

Ce document sert de source de vérité pour calibrer le prompt IA de correction écrite
(`src/app/api/writing/correct/route.ts`). Il définit, pour chaque niveau visé par le
TEF IRN (A2 / B1 / B2), ce que l'IA doit signaler, tolérer et **s'interdire**.

Principe directeur : le niveau de correction suit le niveau du **sujet choisi**
(`exercise.level`), jamais un niveau supérieur "par excellence". Une faute qui n'est
pas évaluée à ce niveau ne doit pas être signalée, même si elle est objectivement
incorrecte en français standard.

---

## A2 — Carte de séjour pluriannuelle (CSP) — Section A (message court, 40 mots min)

**Attendus grammaticaux évalués à ce niveau**
- Conjugaison : présent, passé composé, futur proche (aller + infinitif).
- Accords de base : sujet-verbe, déterminant-nom, nom-adjectif (singulier/pluriel, masculin/féminin).
- Phrases simples, éventuellement juxtaposées ou reliées par des connecteurs basiques
  (et, mais, parce que, alors, donc).
- Orthographe des mots courants de la vie quotidienne.

**À signaler en priorité**
- Toute erreur qui **empêche ou gêne la compréhension** du message.
- Erreurs de conjugaison sur les verbes fréquents (être, avoir, aller, faire + 1er groupe).
- Accords de base manquants.
- Oublis d'éléments essentiels du message (ex : absence de proposition, d'information demandée).

**Tolérances (ne pas pénaliser / ne pas commenter)**
- Répétitions de mots simples.
- Phrases courtes et juxtaposées plutôt qu'un texte fluide.
- Absence de connecteurs logiques élaborés.
- Vocabulaire limité tant que le message reste compréhensible.

**Interdits stricts pour ce niveau**
- Ne jamais suggérer le subjonctif, le conditionnel complexe, ou des temps composés rares.
- Ne jamais proposer un connecteur soutenu (« néanmoins », « quand bien même », « en dépit de »).
- Ne jamais proposer un synonyme recherché ou littéraire à la place d'un mot simple correct.
- Ne jamais commenter le "style" ou la "richesse" du texte.

**Ton de l'explication**
Phrases courtes, vocabulaire simple, une règle à la fois, comparaison concrète
("comme pour...", "on dit toujours..."). Pas de terminologie grammaticale savante
(éviter "complément circonstanciel", préférer "le mot qui dit où/quand").

---

## B1 — Carte de résident (CR) — Section B (texte argumentatif/motivation, 100 mots min)

**Attendus grammaticaux évalués à ce niveau**
- Contraste imparfait / passé composé.
- Expression de l'opinion et de la justification (je pense que, parce que, car).
- Connecteurs logiques simples (donc, cependant, par contre, ensuite, d'abord/enfin).
- Début de structuration du texte (introduction du sujet, développement, courte conclusion).

**À signaler en priorité**
- Erreurs de conjugaison sur les temps du passé et le futur.
- Accords (y compris participe passé avec "avoir" dans les cas simples).
- Incohérences dans l'enchaînement des idées (texte qui "saute" d'une idée à l'autre sans lien).
- Répétition d'une même erreur sur plusieurs occurrences (à regrouper en une seule explication).

**Tolérances**
- Tournures encore un peu lourdes ou maladroites, tant que le message est clair et l'argumentation compréhensible.
- Vocabulaire simple répété, tant qu'il est correct.

**Interdits stricts pour ce niveau**
- Ne jamais exiger le subjonctif imparfait ou des tournures littéraires.
- Ne jamais suggérer un vocabulaire rare, technique ou livresque.
- Ne pas pénaliser un texte qui reste "simple" s'il est correct et cohérent — la simplicité n'est pas une faute à B1.

**Ton de l'explication**
Explication un peu plus détaillée qu'à A2, la règle peut être nommée simplement
(« l'accord du participe passé », « l'imparfait pour décrire une habitude »), toujours
avec un exemple concret tiré du texte du candidat.

---

## B2 — Naturalisation — Section B (texte argumentatif/motivation, 100 mots min)

**Attendus grammaticaux évalués à ce niveau**
- Précision des accords, y compris cas un peu plus complexes (participe passé avec "être"
  et pronominaux, accords dans les subordonnées).
- Usage de subordonnées relatives et complétives simples (qui, que, parce que, bien que — usage basique).
- Connecteurs logiques variés mais courants (cependant, en revanche, ainsi, par conséquent, de plus).
- Registre adapté à un texte formel/argumentatif (lettre de motivation, exposé d'opinion).
- Nuance dans l'argumentation (justifier, illustrer, concéder puis contre-argumenter).

**À signaler en priorité**
- Erreurs de précision grammaticale qui restent dans le champ B2 (voir ci-dessus).
- Manque de cohérence ou de nuance dans l'argumentation.
- Registre inadapté (trop familier pour un texte formel).
- Vocabulaire imprécis ou répétitif quand une alternative **courante** existe.

**Tolérances**
- Style encore simple tant que le texte est précis et bien articulé — B2 évalue la précision
  et la cohérence, pas la sophistication littéraire.

**Interdits stricts pour ce niveau (même à B2, le TEF IRN n'est pas un examen de littérature)**
- Ne jamais suggérer de vocabulaire soutenu/livresque hors de l'usage courant
  (pas de mots rares, pas de tournures d'écrivain, pas de figures de style).
- Ne jamais réécrire une phrase correcte simplement pour la rendre "plus élégante".
- Rester dans le français courant/soutenu standard, jamais au-delà.

**Ton de l'explication**
Explication plus fine que B1, peut nommer des notions grammaticales usuelles
(subordonnée, pronom relatif), mais reste pédagogique — jamais un cours de linguistique.

---

## Règle transverse — toutes les erreurs, tous niveaux

1. Ne signaler que ce qui est pertinent pour le niveau visé (voir grilles ci-dessus).
2. Regrouper les erreurs répétitives identiques en une seule explication.
3. Prioriser les erreurs bloquantes (qui gênent la compréhension) sur les maladresses mineures.
4. Le score sur 100 répond à la question *"ce texte est-il prêt pour CE niveau d'examen ?"*,
   pas *"ce texte est-il parfait en français ?"*.
5. Le conseil général se limite à 1-2 points d'amélioration maximum, formulés de façon motivante.
