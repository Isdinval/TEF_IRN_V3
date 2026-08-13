# Référentiel TEF IRN (Intégration, Résidence, Nationalité)

## Structure des épreuves (V2026)

### 1. Compréhension Écrite (CE)
*   **Durée** : 30 minutes
*   **Format** : 20 questions (QCM)
*   **Objectif** : Comprendre des documents simples, des messages courants, des articles courts.

**Sources** : confirmé par la vidéo officielle CCI Paris Île-de-France, IRN-spécifique
(["Atelier Se préparer à l'épreuve de compréhension écrite"](https://www.youtube.com/watch?v=P1aw5hFmJCY),
page officielle [lefrancaisdesaffaires.fr/candidat/.../tef-irn/preparation](https://www.lefrancaisdesaffaires.fr/candidat/test-evaluation-francais/tef-irn/preparation/)) :
20 questions / 30 min, réparties en 2 sections de 10 questions (15 min chacune), la seconde
section étant nativement adaptative selon la performance en section 1 (voir décision produit
ci-dessous — LlamaKusi ne réplique pas cette adaptativité). Le TEF IRN n'a pas été concerné par
l'évolution du format TEF de décembre 2023
([lefrancaisdesaffaires.fr](https://www.lefrancaisdesaffaires.fr/evolutions-tef-2023/)) et garde
sa propre structure indépendante — le [PDF d'exemples CCI](https://www.lefrancaisdesaffaires.fr/wp-content/uploads/2024/10/tef-exemples-epreuves-ce.pdf)
cité dans une version antérieure de ce document concerne le **TEF général** (40 questions, format
international), pas le TEF IRN ; il reste une illustration valable des types d'exercices mais
la vidéo ci-dessus prime pour tout ce qui est spécifique au format IRN.

**Répartition retenue (5 formats, `ce_format` en base)** :

| Format (`ce_format`) | Qté | Description |
|---|---|---|
| `court` | 4 | Texte court (vie quotidienne / document simple), 1 question par texte |
| `trous` | 4 | Mix de phrase à trous (1 lacune, phrase courte) et texte à trous (paragraphe, 2 lacunes partagées) — voir règle 7 de `ce-content-calibration-rules.md`. Lacunes numérotées `___________ (N)` ; `highlight_gap` indique la lacune active pour chaque question |
| `multi_texte` | 2 | Grille de sous-documents (`sub_texts` jsonb), 1 question transversale par set — correspond à l'exercice "lecture rapide" officiel |
| `long_admin` | 5 | Texte long structuré en paragraphes (documents administratifs/professionnels), 1 question générale + 1 précise par document (règle 8) |
| `article_presse` | 5 | Texte long structuré en paragraphes — articles de presse |

`long_admin` et `article_presse` partagent le même rendu UI (texte en paragraphes) mais sont
distingués en base pour pouvoir cibler l'un sans l'autre. Règles de conception détaillées :
voir `docs/ce-content-calibration-rules.md`.

**Décision produit — pas d'adaptativité, choix de l'examen par l'utilisateur** : plutôt que de
répliquer la section 2 adaptative du TEF IRN réel, LlamaKusi laisse l'utilisateur choisir
lui-même le niveau/thème de l'examen blanc (`exam-1`/`exam-2`/`exam-3`). Chaque examen est un
bloc fixe de 20 questions CE, non adaptatif en interne. Détail dans
`docs/ce-content-calibration-rules.md`.

**Thématique par examen blanc** (contenu, pas structure — les 3 examens suivent la même
répartition de formats ci-dessus) :

| Examen | Niveau | Thématique |
|---|---|---|
| exam-1 | A2-B1 | Vie administrative quotidienne |
| exam-2 | B1 | Vie professionnelle & recherche d'emploi |
| exam-3 | B1-B2 | Vie sociale, santé, logement |

### 2. Compréhension Orale (CO)
*   **Durée** : 20 minutes
*   **Format** : 20 questions (QCM)
*   **Objectif** : Comprendre des annonces, des conversations téléphoniques, des messages radio simples.

### 3. Expression Écrite (EE)
*   **Durée** : 30 minutes
*   **Format** : 2 sections
    *   **Section A (10 min)** : Rédiger un message pour donner des nouvelles ou des informations (min 40 mots). Niveau A1/A2.
    *   **Section B (20 min)** : Rédiger un texte pour convaincre ou exposer ses motivations (min 100 mots). Niveau B1/B2.

### 4. Expression Orale (EO)
*   **Durée** : 10 minutes
*   **Format** : 2 sections
    *   **Section A (5 min)** : Obtenir des informations (simuler un appel ou une visite).
    *   **Section B (5 min)** : Convaincre un ami ou un proche.

---

## Niveaux CECRL cibles
*   **A2** : Carte de séjour pluriannuelle.
*   **B1** : Carte de résident.
*   **B2** : Naturalisation française.

## Thématiques clés
*   Vie quotidienne (logement, santé, achats).
*   Travail et administration.
*   Loisirs et environnement.
*   Valeurs de la République française.
