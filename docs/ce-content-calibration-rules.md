# Règles de calibration du contenu CE — LlamaKusi

**Contexte** : ce document fige les règles de conception des questions de Compréhension Écrite
(TEF IRN), établies le 13/08/2026 suite à un défaut identifié par Olivier sur la 1ère version
du contenu (item 5/6 du plan "Refonte CE examen blanc") : les bonnes réponses étaient des
quasi-citations verbatim du texte, rendant les questions résolubles par simple repérage de
mots-clés, sans compréhension réelle.

Recalibré à partir de captures PrepMyFuture montrant le corrigé détaillé (EXPLICATION/CONTEXTE
pour chaque question, niveau B1-B2), et de la source **officielle et IRN-spécifique** de la CCI
Paris Île-de-France (voir section Sources ci-dessous).

**Toute génération future de contenu CE (manuelle ou via un futur pipeline) doit respecter
ces règles.**

---

## Règle n°1 — La bonne réponse ne cite JAMAIS le texte mot pour mot

C'est la règle la plus importante. Systématiquement violée dans la 1ère version du contenu.

❌ **Mauvais** (bonne réponse = citation directe) :
> Texte : *"...avec parking privatif inclus dans le loyer."*
> Question : "Qu'est-ce qui est inclus dans le loyer ?"
> Bonne réponse : "B) Le parking privatif" *(recopie exacte du texte)*

✅ **Bon** (bonne réponse = reformulation) :
> Texte : *"...l'attestation de loyer signée par votre bailleur n'a pas été jointe."*
> Question : "Pourquoi le dossier ne peut-il pas être instruit pour l'instant ?"
> Bonne réponse : "B) Un document obligatoire n'a pas été fourni" *(paraphrase, aucun mot commun avec le texte)*

**Test de validation avant de livrer une question** : si on surligne dans le texte les mots qui
apparaissent aussi dans la bonne réponse, il ne doit rester **aucune expression de 2+ mots
identique**. Des mots isolés et très courants (articles, prépositions) ne comptent pas.

---

## Règle n°2 — Les distracteurs doivent être plausibles, jamais aléatoires

Deux façons valables de construire un distracteur (observées chez PrepMyFuture) :

1. **Un fait vrai du texte qui répond à une autre question** (le plus rigoureux, à privilégier
   quand le texte le permet).
2. **Une affirmation plausible dans le même registre/thème, mais non confirmée par le texte**
   (acceptable — c'est ce que fait PrepMyFuture elle-même sur plusieurs questions : ex. "les
   vétérinaires ont augmenté leurs tarifs" comme distracteur sur un texte qui n'en parle pas,
   mais qui reste un sujet plausible dans le contexte d'une association animalière).

Ce qui est **toujours interdit** : un distracteur totalement hors-sujet par rapport au thème du
texte (ex. répondre "une amende" à une question sur un délai de traitement administratif, sans
aucun lien thématique).

**Piège à privilégier quand possible** : une **déformation légère** du fait correct (négation,
inversion de sens, mauvais chiffre/délai, mauvais sujet de la phrase). Exemple vu chez
PrepMyFuture : une critique de film qui dit *"n'est pas le film de l'année, mais reste une belle
surprise"* est un distracteur plausible pour "quelle critique est négative ?" — le ton est
mitigé, pas franchement négatif, ce qui oblige à lire la nuance.

---

## Règle n°3 — Format `trous` : distracteurs sémantiquement proches

Les 4 options d'une lacune doivent être :
- **De même nature grammaticale** (4 verbes, ou 4 noms, ou 4 adjectifs — jamais mélangés)
- **Grammaticalement toutes acceptables** dans la phrase (aucune ne doit être écartée par la
  seule syntaxe)
- **Sémantiquement dans le même champ lexical**, départagées uniquement par le sens précis
  dans le contexte

Exemple validé (PrepMyFuture) : *"réduire leur ___ sur l'environnement"* → impact / consommation
/ effort / conséquence. Les 4 sont des noms plausibles dans une phrase sur l'écologie ; seul
"impact" convient précisément au sens de "effet négatif".

❌ À éviter : lacune avec des options trop éloignées ("garantit" vs "vend" vs "efface" vs
"peint") qui se départagent par pure logique sans lire le texte.

---

## Règle n°4 — Format `multi_texte` : chaque sous-texte doit couvrir un thème distinct

Les 4 sous-documents ne doivent jamais se chevaucher sur le même sujet. Le lecteur doit être
obligé de lire les 4 pour éliminer les 3 mauvais, pas juste repérer un mot-clé qui saute aux
yeux dans un seul des 4.

La question formule une **situation/besoin** (paraphrasé), jamais une reprise du vocabulaire
exact d'un des sous-textes. Exemple validé (PrepMyFuture) : *"Je m'intéresse à l'histoire de la
médecine"* → doit être relié à *"riche collection d'instruments médicaux et objets de
pharmacie"* (paraphrase), pas à un sous-texte qui contiendrait littéralement "histoire de la
médecine".

---

## Règle n°5 — Formats `long_admin`/`article_presse` : privilégier les questions de fonction/synthèse

Sur ces deux formats (10 des 20 questions CE, la moitié de l'épreuve — donc les plus
importants), privilégier les questions qui portent sur :
- La **fonction du document** ("Quel est le rôle de... ?", "L'association a pour mission de...")
- Une **synthèse** de plusieurs informations éparpillées dans le texte (ex. relier
  "l'Agence nationale de la statistique" mentionnée au paragraphe 1 avec "organisme national"
  formulé différemment dans la question)
- Ce que le texte **révèle/met en évidence/laisse entendre**, plutôt qu'un fait isolé facile à
  pointer du doigt

Plutôt qu'une question de simple repérage factuel ("À quelle date... ?", "Combien de... ?"),
qui reste acceptable en complément mais ne doit pas être l'unique type de question sur ces
formats.

---

## Règle n°6 — Calibrer la difficulté selon le niveau de l'examen

| Examen | Niveau | Application des règles |
|---|---|---|
| exam-1 | A2-B1 | Paraphrase systématique (règle 1) obligatoire, mais peut rester majoritairement factuelle. Distracteurs plausibles simples. |
| exam-2 | B1 | Idem + quelques distracteurs "déformation légère" (règle 2, piège). |
| exam-3 | B1-B2 | Paraphrase systématique + au moins 30% des questions `long_admin`/`article_presse` en questions de fonction/synthèse (règle 5) + distracteurs avec nuance/piège plus fréquents. |

---

## Règle n°7 — Format `trous` : deux sous-types à mixer, pas un seul

La vidéo officielle CCI distingue explicitement deux exercices différents, tous deux couverts
par notre `ce_format = 'trous'` :

- **Phrase à trous** : une seule phrase courte, une seule lacune, 1 question. Difficulté basse,
  se résout par le sens global de la phrase (ex. officiel : *"Katia aime ___ des livres le soir
  avant de dormir"* → lire, et non voir/boire/avoir).
- **Texte à trous** : un paragraphe complet avec plusieurs lacunes numérotées visibles
  simultanément, 1 question par lacune (`highlight_gap`). Difficulté plus élevée, nécessite de
  comprendre le sens global du texte pour choisir entre synonymes proches.

**Sur les 4 questions `trous` d'un examen, mixer les deux sous-types** (ex. 1 texte à trous à 2
lacunes + 2 phrases à trous indépendantes = 4 questions), plutôt que de n'utiliser que la
variante paragraphe. Les phrases à trous n'ont techniquement qu'une seule lacune ; `highlight_gap`
vaut alors toujours `1`.

---

## Règle n°8 — Format `long_admin` : 1 question générale + 1 question précise par document

Confirmé par la vidéo officielle CCI (exemple 5) : sur un document de 2 questions, la première
porte sur le **sens global/le message principal** du document, la seconde sur **un détail
précis**. Ne pas poser 2 questions de détail sur le même document.

✅ **Bon** (exemple officiel, mail de réservation d'hôtel) :
> Q1 (générale) : "Quel est le message principal du texte ?" → confirme une réservation
> Q2 (précise) : détail sur le parking non inclus dans le prix

Cette règle s'applique aux paires de questions sur un même document (2 des 3 documents de
`long_admin`, qui en compte 5 au total : 2+2+1). Le document à question unique peut rester une
question générale ou précise selon ce qui convient le mieux au contenu.

---

## Décision produit — pas d'adaptativité de section, choix de l'examen par l'utilisateur

Le TEF IRN réel comporte 2 sections de 10 questions (15 min chacune) : la section 2 est
*"adaptée à votre niveau"* selon la performance en section 1 — un vrai moteur d'examen
adaptatif. LlamaKusi ne réplique pas cette adaptativité intra-examen (changement d'architecture
trop lourd : pool de questions par niveau, branchement dynamique, refonte d'`ExamContext.tsx`).

**Décision (13/08/2026)** : à la place, c'est l'utilisateur qui choisit lui-même le niveau/thème
de l'examen blanc qu'il souhaite passer, via le choix entre `exam-1` (A2-B1), `exam-2` (B1),
`exam-3` (B1-B2) — mécanisme déjà existant dans l'app. Chaque examen reste un bloc fixe de 20
questions CE, non adaptatif en interne.

---

## Checklist avant de livrer une question CE

- [ ] La bonne réponse ne partage aucune expression de 2+ mots avec le texte
- [ ] Les 3 distracteurs sont plausibles dans le thème/registre du texte (pas aléatoires)
- [ ] (`trous`) Les 4 options sont de même nature grammaticale et sémantiquement proches
- [ ] (`multi_texte`) Les 4 sous-textes couvrent des thèmes réellement distincts
- [ ] (`long_admin`/`article_presse`) Au moins certaines questions portent sur la fonction/la
      synthèse du document, pas uniquement sur un détail isolé
- [ ] (`trous`) Les 4 questions mixent phrase à trous et texte à trous (règle 7), pas uniquement
      la variante paragraphe
- [ ] (`long_admin`) Sur chaque document à 2 questions, une question générale + une précise
      (règle 8)
- [ ] Le niveau de difficulté correspond au niveau CECRL de l'examen (voir règle 6)

---

## Sources

- **Vidéo officielle CCI Paris Île-de-France** (source IRN-spécifique) :
  ["TEF IRN | Atelier Se préparer à l'épreuve de compréhension écrite"](https://www.youtube.com/watch?v=P1aw5hFmJCY),
  publiée sur la [page officielle de préparation TEF IRN](https://www.lefrancaisdesaffaires.fr/candidat/test-evaluation-francais/tef-irn/preparation/).
  Confirme : 20 questions / 30 min, structure en 2 sections de 10 questions (15 min chacune, la
  2e "adaptée au niveau" — voir décision produit ci-dessus), pas de pénalité pour mauvaise
  réponse/absence de réponse, et les 6 types d'exercices (affiche/document simple, phrase à
  trous, texte à trous, lecture rapide multi-documents, questions sur document administratif
  avec 2 questions générale+précise, article de presse).
- Captures PrepMyFuture (fournies par Olivier, 13/08/2026) : exemples avec corrigé détaillé
  (EXPLICATION/CONTEXTE) sur `trous`, `multi_texte`, `long_admin` (Section F — "Documents
  administratifs et professionnels"), `article_presse` (Section G — "Articles de presse"),
  niveau B1-B2.

**Correction (13/08/2026)** : une version précédente de ce document citait le
[PDF d'exemples CCI](https://www.lefrancaisdesaffaires.fr/wp-content/uploads/2024/10/tef-exemples-epreuves-ce.pdf)
comme référence de structure. Ce PDF documente le **TEF général** (40 questions / 60 min,
format international/Canada), **pas le TEF IRN**. Il reste valable comme illustration générale
des types de questions (structure similaire), mais la vidéo ci-dessus est la source à privilégier
pour tout ce qui est spécifique au format IRN (volume, timing, règles précises par exercice).
