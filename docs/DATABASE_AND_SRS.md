# Base de Données & SRS - LlamaKusi

LlamaKusi utilise Supabase pour la persistance des données et implémente un système de répétition espacée (SRS) pour optimiser l'apprentissage.

## 1. Schéma de la Base de Données

Le schéma est structuré pour supporter la progression utilisateur et le contenu pédagogique.

### Tables Principales
- **`profiles`** : Informations utilisateur, XP total, niveau, ligue actuelle, et préférences.
- **`lessons`** : Contenu théorique organisé par niveau (A1-B2) et catégorie.
- **`exercises`** : Questions de type QCM liées aux leçons.
- **`exams` & `exam_questions`** : Structure et contenu des simulations d'examen TEF IRN.
- **`user_reviews`** : Suivi SRS pour les exercices généraux.
- **`user_vocabulary_reviews`** : Suivi SRS spécifique au module vocabulaire.

## 2. Spaced Repetition System (SRS)

LlamaKusi implémente une variante de l'algorithme **SM-2** pour déterminer la date idéale de révision.

### Paramètres SRS
- **Ease Factor (Facilité)** : Un multiplicateur (défaut: 2.5) qui ajuste l'intervalle selon la difficulté ressentie.
- **Intervalle** : Nombre de jours avant la prochaine révision.
- **Consecutive Correct** : Nombre de fois que l'utilisateur a réussi l'item d'affilée.

### Logique de mise à jour
1. **Réussite** : L'intervalle augmente de manière exponentielle (`interval * ease`). L'ease factor augmente légèrement (+0.1).
2. **Échec** : L'intervalle est réinitialisé à 1 jour. L'ease factor diminue (-0.2).

### Implémentation
Le code source de cette logique se trouve dans `src/lib/srs-engine.ts`.

## 3. Moteur de Recommandation

Le système analyse les 5 derniers échecs de l'utilisateur pour identifier la catégorie la plus problématique. Il recherche ensuite dans la table `lessons` une ressource non encore complétée pour cette catégorie et l'ajoute à la table `recommendations`.

---
© 2025 LlamaKusi AI
