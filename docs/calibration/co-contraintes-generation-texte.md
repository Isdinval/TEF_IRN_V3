# Contraintes de génération — Compréhension Orale (CO), contenu texte

Ce document résume les contraintes qui s'appliquent au **texte/script** de la Compréhension
Orale du TEF IRN (LlamaKusi), à respecter avant de confier ces scripts à un outil de
génération audio (TTS). Il ne couvre pas la génération audio elle-même.

---

## 1. Structure de l'épreuve

- 20 questions au total, réparties en 5 formats officiels (voir §2).
- Chaque question a : un audio (ou un audio partagé, voir micro-trottoir), une consigne, une
  question, 4 options de réponse (A/B/C/D), une bonne réponse, une explication de correction.
- Aucune pénalité pour une mauvaise réponse ou une absence de réponse.
- Le candidat n'a **qu'une seule écoute** par audio (pas de réécoute) — donc le script doit
  être compréhensible en une seule passe, sans ambiguïté qui nécessiterait de réentendre.

## 2. Les 5 formats officiels et leurs contraintes de longueur

**⚠️ Important : les durées ci-dessous pour Annonce et Message répondeur sont des
estimations non confirmées par une source officielle — seules Chronique radio et
Micro-trottoir sont des durées mesurées sur de vrais exemples (vidéo officielle CCI +
captures PrepMyFuture). À affiner si vous obtenez une source plus précise.**

| Format | Audio | Durée cible | Mots cibles (≈150 mots/min à l'oral) | Question |
|---|---|---|---|---|
| **Annonce** | 1 indépendant | ~20-35s *(estimation)* | ~50-90 mots | « Ce message annonce... » (complétion) |
| **Message répondeur** | 1 indépendant | ~20-35s *(estimation)* | ~50-90 mots | « La personne appelle pour... » (complétion) |
| **Chronique radio** | 1 indépendant | **45 à 75s** (mesuré) | **~110-190 mots** | Question ouverte sur l'info/opinion principale |
| **Micro-trottoir** | **1 partagé entre 3 questions** (3 personnes qui parlent à la suite dans le même fichier) | **~85s pour les 3 interventions combinées** (mesuré) | **~65-75 mots par personne** (× 3) | Mêmes 4 options pour les 3 questions (ex. « est totalement pour / plutôt pour avec réserves / totalement contre / ne se prononce pas ») |
| **Conversation** | Audio + 4 images | — | — | **Reporté, hors scope pour l'instant** (nécessite génération d'images) |

**Défaut historique corrigé (exam-1, v2)** : les tout premiers scripts faisaient ~30-40 mots
(9-15 secondes) — 3 fois trop courts par rapport aux références ci-dessus. Un script trop
court ne laisse pas de place à une information secondaire ou une nuance, ce qui rend la
question trop facile (la réponse est mécaniquement la seule information prononcée). Corrigé
sur exam-1 ; à surveiller sur toute nouvelle génération (exam-2, exam-3, etc.).

## 3. Règles de qualité du contenu (transposées de la Compréhension Écrite)

Les mêmes défauts que ceux corrigés sur la CE s'appliquent à l'oral et doivent être évités
dès la rédaction du script :

1. **La bonne réponse ne doit jamais être une quasi-citation mot pour mot** d'un passage du
   script — toujours une reformulation/synthèse. (Le candidat n'a pas le texte sous les yeux,
   mais un script trop calqué sur les options produit quand même des questions triviales.)
   *Vérification recommandée : comparer chaque option correcte au script par recherche de
   séquences de 5 mots consécutifs identiques (n-grammes) — un chevauchement signale une
   quasi-citation à reformuler.*
2. **Distracteurs plausibles**, dans le thème du script — jamais aléatoires ou hors-sujet.
3. **Privilégier les questions de fonction/synthèse** plutôt que le simple repérage d'un
   détail isolé, surtout sur Chronique radio (ex. « Que révèle cette étude ? » plutôt que
   « Quel jour a eu lieu l'événement ? »). Éviter aussi les questions à double clause qui
   forcent structurellement une réponse correcte à deux informations (donc plus longue que
   les distracteurs) — une question à focus unique suffit ; la nuance/info secondaire reste
   disponible dans le script pour nourrir des distracteurs plausibles (cf. règle 4).
4. **Le script doit contenir une information secondaire ou une nuance** en plus de
   l'information-réponse, pour que la longueur cible (§2) ait une utilité réelle et ne soit
   pas du remplissage artificiel. **Cette nuance reste dans le script, pas dans le texte de
   l'option correcte** (cf. règle 7) — sinon elle rend l'option correcte mécaniquement plus
   longue et donc repérable sans écouter l'audio.
5. **Micro-trottoir** : les 3 interventions doivent exprimer des nuances clairement
   différenciées (ex. une position tranchée contre, une position favorable mais nuancée, une
   position tranchée pour) — pas 3 variantes trop proches à départager. Les 4 options restant
   identiques sur les 3 questions-sœurs, ce format n'est pas concerné par le biais de la
   règle 7 (aucune option n'est associée à une seule bonne réponse a priori).
6. **Chaque question a une explication de correction** qui cite/paraphrase le passage du
   script qui justifie la bonne réponse (même principe que la CE, règle 9).
7. **Aucun pattern structurel ne doit permettre de deviner la bonne réponse sans écouter
   l'audio.** Deux biais identifiés en pratique sur une première génération (exam-1, v2) :
   - **Longueur** : la bonne réponse ne doit pas être systématiquement l'option la plus
     longue (ni la plus courte) des 4. Les 4 options d'une même question doivent avoir des
     longueurs globalement comparables (écart maîtrisé, pas d'option 2× plus longue que les
     autres), indépendamment de laquelle est correcte.
   - **Position** : sur l'ensemble d'un examen (20 questions, donc 14 hors micro-trottoir où
     les options sont fixes), la lettre de la bonne réponse (A/B/C/D) doit être répartie de
     façon à peu près équilibrée — éviter qu'elle tombe systématiquement sur la même lettre
     (ex. B) par habitude de rédaction.

   *Vérification recommandée avant de considérer un lot de questions comme terminé : calculer
   par script la longueur de chaque option et vérifier que l'option correcte n'est pas
   systématiquement `max(longueurs)`, puis calculer la distribution des lettres correctes sur
   l'ensemble des questions à options variables (hors micro-trottoir) et vérifier qu'elle est
   raisonnablement plate (pas de lettre représentant plus de la moitié des questions).*

## 4. Contraintes techniques liées au texte (pour la cohérence avec la base de données)

- Chaque script est stocké dans le champ `transcription` (texte intégral, jamais montré
  pendant l'examen — seulement en revue de correction après coup).
- **Micro-trottoir** : le champ `transcription` doit contenir le script complet des **3
  personnes** (identique sur les 3 questions-sœurs), pas seulement celle concernée par la
  question — pour que la revue de correction affiche tout le contexte.
- Format attendu pour un script de micro-trottoir (3 interventions balisées) :
  ```
  « Question posée aux 3 personnes interrogées »

  Personne 1 : [intervention 1]

  Personne 2 : [intervention 2]

  Personne 3 : [intervention 3]
  ```
- Le texte doit être écrit pour être **lu à voix haute naturellement** : phrases orales
  courantes, pas de tournures trop écrites/littéraires, ponctuation qui aide la respiration
  (éviter les phrases de plus de 25-30 mots d'un seul tenant). *Vérification recommandée :
  découper chaque script sur `.`/`!`/`?` et signaler toute phrase de plus de 30 mots — une
  formulation riche en clauses reliées par des virgules dépasse facilement cette limite sans
  qu'on s'en aperçoive à la relecture.*

## 5. Ce qui n'est PAS couvert par ce document

- La génération audio elle-même (voix, moteur TTS, format de fichier) — hors scope ici par
  choix explicite.
- Le format Conversation (audio + images) — reporté, non traité pour l'instant.
