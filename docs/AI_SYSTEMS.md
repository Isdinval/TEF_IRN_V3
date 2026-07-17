# Systèmes d'Intelligence Artificielle - LlamaKusi

LlamaKusi intègre l'IA au cœur de l'expérience utilisateur pour transformer l'apprentissage passif en coaching actif.

## 1. Correction de l'Expression Écrite
Le système utilise le modèle `gpt-4o-mini` pour fournir des analyses pédagogiques détaillées.

### Fonctionnement
1. **Extraction** : L'IA identifie les segments erronés (`texte_original`).
2. **Classification** : Chaque erreur est catégorisée (grammaire, conjugaison, etc.).
3. **Pédagogie** : Pour chaque erreur, l'IA génère une explication de 2-3 phrases rappelant la règle grammaticale.
4. **Scoring** : Calcul d'un score global basé sur la cohérence, le vocabulaire et la rigueur linguistique.

### Prompt Engineering
Le prompt système est conçu pour être exigeant mais réaliste par rapport aux niveaux A2/B1/B2, évitant de corriger des nuances de style trop complexes (C1/C2) qui pourraient décourager l'apprenant.

## 2. Coach Oral (OpenAI Realtime)
LlamaKusi utilise les capacités multimodales d'OpenAI pour simuler des interactions vocales humaines.

### Architecture
- **WebRTC** : Utilisé pour la communication bidirectionnelle à faible latence entre le navigateur et OpenAI.
- **Session Ephemeral** : Gestion des tokens de session sécurisée via `/api/oral/session`.
- **Instructions Système** : L'IA adopte le rôle d'un examinateur TEF IRN bienveillant mais rigoureux dans ses relances.

## 3. Analyse des Erreurs & Recommandations
Le moteur de recommandation a deux volets distincts :
- **Écriture** (`src/lib/recommendation-engine.ts`) : après chaque tentative d'exercice, si un utilisateur échoue (`score < 50`), sa catégorie d'erreur est incrémentée dans `user_errors`. Si un utilisateur échoue plusieurs fois sur des exercices de "Conjugaison", une leçon pertinente est proposée dans la table `recommendations` avec une raison textuelle.
- **Lecture / sélection** (`src/lib/recommendation-resolver.ts`) : `resolveNextExercises()` est la fonction qui décide réellement quels exercices s'affichent à l'écran (`/parcours/[slug]`, `/lessons/[slug]/complete`), par palier de priorité (SRS dû, contexte de la leçon en cours, jamais tenté, puis score le plus faible) — indépendante de la table `recommendations`, qui sert surtout de signal textuel exploitable ailleurs (coach, dashboard).

## 4. Sécurité & Coûts
- **Server-Side Only** : Toutes les clés API OpenAI sont stockées côté serveur et jamais exposées au client.
- **Optimisation des Tokens** : Utilisation de modèles "mini" pour les tâches de classification et d'analyse textuelle afin de garantir un service réactif et économiquement viable.

---
© 2025 LlamaKusi AI
