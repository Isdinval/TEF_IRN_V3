/**
 * Recherche géographique pour la page /examen-civique/centres.
 *
 * La recherche texte (nom/ville/code postal) ne trouve rien pour une commune
 * qui n'a pas de centre agréé (ex. "Gignac-la-Nerthe"), même quand des centres
 * existent à quelques km (Marseille, Aix-en-Provence...). On complète donc avec
 * un géocodage + un filtre par rayon.
 */

export interface GeoPoint {
  lat: number;
  lon: number;
  label: string;
}

export const DEFAULT_RADIUS_KM = 50;
export const RADIUS_OPTIONS_KM = [25, 50, 100, 200] as const;

// Coordonnées codées en dur (pas d'appel réseau nécessaire pour ces raccourcis).
export const MAJOR_CITIES: GeoPoint[] = [
  { label: "Paris", lat: 48.8566, lon: 2.3522 },
  { label: "Marseille", lat: 43.2965, lon: 5.3698 },
  { label: "Lyon", lat: 45.764, lon: 4.8357 },
  { label: "Toulouse", lat: 43.6047, lon: 1.4442 },
  { label: "Nice", lat: 43.7102, lon: 7.262 },
  { label: "Nantes", lat: 47.2184, lon: -1.5536 },
  { label: "Strasbourg", lat: 48.5734, lon: 7.7521 },
  { label: "Montpellier", lat: 43.6108, lon: 3.8767 },
  { label: "Bordeaux", lat: 44.8378, lon: -0.5792 },
  { label: "Lille", lat: 50.6292, lon: 3.0573 },
  { label: "Rennes", lat: 48.1173, lon: -1.6778 },
  { label: "Reims", lat: 49.2583, lon: 4.0317 },
];

/** Distance à vol d'oiseau entre deux points GPS, en km. */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Géocode une commune française via l'API Adresse (data.gouv.fr) : gratuite,
 * sans clé, CORS ouvert pour un appel côté navigateur. `type=municipality`
 * restreint aux communes (on cherche une ville, pas une adresse postale précise).
 */
export async function geocodeCity(query: string): Promise<GeoPoint | null> {
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data?.features?.[0];
    if (!feature) return null;
    const [lon, lat] = feature.geometry.coordinates;
    return { lat, lon, label: feature.properties.label as string };
  } catch {
    return null;
  }
}
