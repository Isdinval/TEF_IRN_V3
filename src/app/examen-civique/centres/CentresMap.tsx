"use client";

/**
 * Vue carte de /examen-civique/centres. Chargé exclusivement via
 * `next/dynamic(..., { ssr: false })` depuis CivicCentres.tsx — react-leaflet
 * manipule le DOM directement et ne supporte pas le rendu serveur.
 */
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Phone, Mail, ExternalLink } from "lucide-react";
import type { Centre } from "./types";
import { PRODUIT_LABELS } from "./types";
import type { GeoPoint } from "./geo";

type CentreWithDistance = Centre & { distanceKm?: number };

// Les icônes par défaut de Leaflet référencent des chemins d'images que le
// bundler Next.js casse. On les recharge explicitement depuis le CDN unpkg
// (même version que la dépendance "leaflet" installée).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const FRANCE_CENTER: [number, number] = [46.6, 2.4];
const FRANCE_DEFAULT_ZOOM = 6;

/** Recentre la carte quand la recherche (texte ou ville) change. */
function MapUpdater({ activeGeo, markers }: { activeGeo: GeoPoint | null; markers: CentreWithDistance[] }) {
  const map = useMap();

  useEffect(() => {
    if (!activeGeo) {
      map.flyTo(FRANCE_CENTER, FRANCE_DEFAULT_ZOOM);
      return;
    }
    const bounds = L.latLngBounds([[activeGeo.lat, activeGeo.lon]]);
    markers.forEach((c) => {
      if (c.latitude !== null && c.longitude !== null) bounds.extend([c.latitude, c.longitude]);
    });
    map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 13 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGeo, map]);

  return null;
}

export function CentresMap({
  centres,
  activeGeo,
}: {
  centres: CentreWithDistance[];
  activeGeo: GeoPoint | null;
}) {
  const markers = centres.filter((c) => c.latitude !== null && c.longitude !== null);

  return (
    <div className="h-[65vh] min-h-[420px] w-full overflow-hidden rounded-[2rem] border border-zinc-100 shadow-sm">
      <MapContainer center={FRANCE_CENTER} zoom={FRANCE_DEFAULT_ZOOM} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater activeGeo={activeGeo} markers={markers} />
        {markers.map((centre) => (
          <Marker key={centre.id} position={[centre.latitude as number, centre.longitude as number]}>
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
      </MapContainer>
    </div>
  );
}
