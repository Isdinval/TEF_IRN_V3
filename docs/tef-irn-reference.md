# Référentiel TEF IRN (Intégration, Résidence, Nationalité)

## Structure des épreuves (V2026)

### 1. Compréhension Écrite (CE)
*   **Durée** : 30 minutes
*   **Format** : 20 questions (QCM)
*   **Objectif** : Comprendre des documents simples, des messages courants, des articles courts.

**Sources** : le TEF IRN n'a pas été concerné par l'évolution du format TEF de décembre 2023
([lefrancaisdesaffaires.fr](https://www.lefrancaisdesaffaires.fr/evolutions-tef-2023/)) et garde
sa propre structure indépendante. Le volume (20 questions / 30 min) est confirmé par plusieurs
sources mises à jour pour 2026 ([frademy.com](https://frademy.com/tef-irn-presentation),
[lillangues.com](https://lillangues.com/centre-dexamen/test-devaluation-de-francais-tef/)) ; une
page CCI de 2023 mentionne 13 questions, probablement non actualisée depuis. Aucune source
officielle ne publie la répartition par sous-type des 20 questions IRN — la répartition
ci-dessous est extrapolée de la structure du TEF général (40 questions,
[PDF officiel CCI](https://www.lefrancaisdesaffaires.fr/wp-content/uploads/2024/10/tef-exemples-epreuves-ce.pdf))
et recoupée avec des captures d'un concurrent (PrepMyFuture), validée par Olivier le 13/08/2026.

**Répartition retenue (5 formats, `ce_format` en base)** :

| Format (`ce_format`) | Qté | Description |
|---|---|---|
| `court` | 4 | Texte court (vie quotidienne), 1 question par texte |
| `trous` | 4 | 2 textes partagés × 2 lacunes chacun. Lacunes numérotées `___________ (N)` dans le texte ; `highlight_gap` indique la lacune active pour chaque question |
| `multi_texte` | 2 | Grille de sous-documents (`sub_texts` jsonb), 1 question transversale par set |
| `long_admin` | 5 | Texte long structuré en paragraphes — documents administratifs/professionnels |
| `article_presse` | 5 | Texte long structuré en paragraphes — articles de presse |

`long_admin` et `article_presse` partagent le même rendu UI (texte en paragraphes) mais sont
distingués en base pour pouvoir cibler l'un sans l'autre. Détail de la démarche et du contenu :
voir `CE-refonte-examen-blanc.md` (document de travail, non versionné).

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
