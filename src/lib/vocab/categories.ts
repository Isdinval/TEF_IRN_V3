/**
 * Source unique de vérité pour les catégories de la table `vocabulary`.
 * Utilisé par l'admin (CRUD) et par la page utilisateur /tef-irn/vocab (filtres).
 * Ne jamais dupliquer cette liste ailleurs — voir plan vocabulaire 1500 mots.
 */
export const VOCAB_CATEGORIES = [
  "Administration",
  "Logement",
  "Santé",
  "Travail",
  "Vie Sociale",
  "Vie Quotidienne & Consommation",
  "Alimentation & Restauration",
  "Transport & Mobilité",
  "Éducation & Formation",
  "Loisirs, Culture & Médias",
  "Environnement, Météo & Nature",
  "Technologies & Numérique",
] as const;
