/**
 * Recherche géographique pour la page /examen-civique/centres.
 *
 * La recherche texte (nom/ville/code postal) ne trouve rien pour une commune
 * qui n'a pas de centre agréé (ex. "Gignac-la-Nerthe"), même quand des centres
 * existent à quelques km (Marseille, Aix-en-Provence...). On complète donc avec
 * un autocomplete d'adresse (API Adresse data.gouv.fr) + un filtre par rayon.
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

export interface AddressSuggestion extends GeoPoint {
  id: string;
  /** Contexte secondaire renvoyé par l'API (ex. "13 - Bouches-du-Rhône - Provence-Alpes-Côte d'Azur"). */
  context?: string;
}

interface ApiAdresseFeature {
  geometry: { coordinates: [number, number] };
  properties: { id?: string; label: string; context?: string };
}

/**
 * Recherche d'adresses via l'API Adresse (data.gouv.fr) : gratuite, sans clé,
 * CORS ouvert pour un appel côté navigateur. Contrairement à l'ancien
 * `geocodeCity` (restreint aux communes), cet endpoint couvre tous les
 * niveaux de précision (numéro de rue, rue, lieu-dit, commune) — nécessaire
 * pour un autocomplete d'adresse fiable. `signal` permet d'annuler une
 * requête devenue obsolète (l'utilisateur a retapé entre-temps).
 */
export async function searchAddresses(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`, {
    signal,
  });
  if (!res.ok) return [];
  const data = await res.json();
  const features: ApiAdresseFeature[] = data?.features ?? [];
  return features.map((f, i) => {
    const [lon, lat] = f.geometry.coordinates;
    return {
      id: f.properties.id ?? `${lat}-${lon}-${i}`,
      lat,
      lon,
      label: f.properties.label,
      context: f.properties.context,
    };
  });
}
