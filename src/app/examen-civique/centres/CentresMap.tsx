"use client";

/**
 * Vue carte de /examen-civique/centres. Chargé exclusivement via
 * `next/dynamic(..., { ssr: false })` depuis CivicCentres.tsx — react-leaflet
 * manipule le DOM directement et ne supporte pas le rendu serveur.
 */
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Phone, Mail, ExternalLink } from "lucide-react";
import type { Centre } from "./types";
import { PRODUIT_LABELS } from "./types";
import type { GeoPoint } from "./geo";

type CentreWithDistance = Centre & { distanceKm?: number };

// Icône de marqueur custom (pin indigo + point blanc), cohérente avec l'accent
// visuel déjà utilisé sur cette page (MapPin indigo dans la vue Liste). Évite
// aussi le hack habituel de rechargement des icônes par défaut de Leaflet
// depuis un CDN externe — pas de dépendance réseau au runtime.
const markerIcon = L.divIcon({
  className: "",
  html: `<svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.268 21.732 0 14 0z" fill="#4f46e5"/>
    <circle cx="14" cy="14" r="5.5" fill="white"/>
  </svg>`,
  iconSize: [28, 38],
  iconAnchor: [14, 38],
  popupAnchor: [0, -34],
});

// Marqueur du point de recherche : forme cible dorée, bien distincte des pins
// indigo des centres, pour repérer immédiatement le centre du cercle de rayon.
const searchOriginIcon = L.divIcon({
  className: "",
  html: `<svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
    <circle cx="13" cy="13" r="11" fill="#D4AF37" fill-opacity="0.18" stroke="#D4AF37" stroke-width="1.5"/>
    <circle cx="13" cy="13" r="4.5" fill="#D4AF37" stroke="white" stroke-width="2"/>
  </svg>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -13],
});

const FRANCE_CENTER: [number, number] = [46.6, 2.4];
const FRANCE_DEFAULT_ZOOM = 6;

/** Recentre la carte quand la recherche (texte ou ville) change. */
function MapUpdater({
  activeGeo,
  markers,
  radiusKm,
}: {
  activeGeo: GeoPoint | null;
  markers: CentreWithDistance[];
  radiusKm: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!activeGeo) {
      map.flyTo(FRANCE_CENTER, FRANCE_DEFAULT_ZOOM);
      return;
    }
    // Le cercle de rayon doit rester visible même quand peu (ou aucun) centre
    // n'est dans le résultat : on inclut ses propres bornes dans le fitBounds.
    // ⚠️ Ne PAS utiliser L.circle(...).getBounds() ici : cette méthode lit
    // this._map en interne (source Leaflet, Circle.getBounds), qui n'est
    // défini qu'une fois le cercle ajouté à la carte — sur une instance
    // autonome comme celle-ci, ça plante avec "Cannot read properties of
    // undefined (reading 'layerPointToLatLng')" dès qu'une recherche
    // géocodée aboutit. Calcul géographique direct à la place.
    const latOffset = radiusKm / 111; // ~111 km par degré de latitude
    const lonOffset = radiusKm / (111 * Math.cos((activeGeo.lat * Math.PI) / 180));
    const bounds = L.latLngBounds(
      [activeGeo.lat - latOffset, activeGeo.lon - lonOffset],
      [activeGeo.lat + latOffset, activeGeo.lon + lonOffset]
    );
    markers.forEach((c) => {
      if (c.latitude !== null && c.longitude !== null) bounds.extend([c.latitude, c.longitude]);
    });
    map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 13 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGeo, radiusKm, map]);

  return null;
}

export function CentresMap({
  centres,
  activeGeo,
  radiusKm,
}: {
  centres: CentreWithDistance[];
  activeGeo: GeoPoint | null;
  radiusKm: number;
}) {
  const markers = centres.filter((c) => c.latitude !== null && c.longitude !== null);

  return (
    <div className="h-[65vh] min-h-[420px] w-full overflow-hidden rounded-[2rem] border border-zinc-100 shadow-sm">
      <MapContainer center={FRANCE_CENTER} zoom={FRANCE_DEFAULT_ZOOM} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater activeGeo={activeGeo} markers={markers} radiusKm={radiusKm} />
        {activeGeo && (
          <>
            <Circle
              center={[activeGeo.lat, activeGeo.lon]}
              radius={radiusKm * 1000}
              pathOptions={{ color: "#4f46e5", weight: 1.5, fillColor: "#4f46e5", fillOpacity: 0.06 }}
            />
            <Marker position={[activeGeo.lat, activeGeo.lon]} icon={searchOriginIcon} zIndexOffset={1000}>
              <Popup>
                <p className="text-xs font-black text-zinc-900">{activeGeo.label}</p>
              </Popup>
            </Marker>
          </>
        )}
        <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
          {markers.map((centre) => (
            <Marker key={centre.id} position={[centre.latitude as number, centre.longitude as number]} icon={markerIcon}>
              <Popup>
                <div className="min-w-[200px] text-xs">
                  <p className="text-sm font-black text-zinc-900">{centre.nom}</p>
                  <p className="mt-1 text-zinc-500">{centre.adresse}</p>
                  {centre.distanceKm !== undefined && (
                    <p className="mt-1 font-bold text-indigo-500">à {Math.round(centre.distanceKm)} km</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {centre.produits.map((p) => (
                      <span
                        key={p}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-black uppercase text-zinc-500"
                      >
                        {PRODUIT_LABELS[p] ?? p}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 space-y-1 font-bold text-zinc-600">
                    {centre.telephone && (
                      <a href={`tel:${centre.telephone}`} className="flex items-center gap-1 hover:text-indigo-600">
                        <Phone size={11} /> {centre.telephone}
                      </a>
                    )}
                    {centre.email && (
                      <a href={`mailto:${centre.email}`} className="flex items-center gap-1 hover:text-indigo-600">
                        <Mail size={11} /> {centre.email}
                      </a>
                    )}
                    <a
                      href={centre.url_contact}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-500 hover:underline"
                    >
                      <ExternalLink size={11} /> Voir sur le site CCI
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
