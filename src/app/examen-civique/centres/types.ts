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

/**
 * Lien "Itinéraire" (Google Maps) vers un centre. Utilise les coordonnées GPS
 * quand elles existent (précision maximale) ; à défaut, l'adresse texte —
 * Google Maps sait résoudre les deux formats de `destination`.
 */
export function directionsUrl(centre: Pick<Centre, "latitude" | "longitude" | "adresse">): string {
  const destination =
    centre.latitude !== null && centre.longitude !== null
      ? `${centre.latitude},${centre.longitude}`
      : encodeURIComponent(centre.adresse);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}
