export interface Centre {
  id: string;
  tc_id: number;
  nom: string;
  adresse: string;
  code_postal: string | null;
  ville: string | null;
  latitude: number | null;
  longitude: number | null;
  produits: string[]; // 'naturalisation' | 'carte_resident' | 'csp'
  email: string | null;
  telephone: string | null;
  url_contact: string;
}

export const PRODUIT_LABELS: Record<string, string> = {
  naturalisation: "Naturalisation",
  carte_resident: "Carte de résident",
  csp: "Carte de séjour pluriannuelle",
};
