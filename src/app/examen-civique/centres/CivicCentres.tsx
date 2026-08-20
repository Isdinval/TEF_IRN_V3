"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Mail, ExternalLink, MapPin, Loader2, Map as MapIcon, List as ListIcon } from "lucide-react";
import type { Centre } from "./types";
import { PRODUIT_LABELS } from "./types";
import {
  DEFAULT_RADIUS_KM,
  RADIUS_OPTIONS_KM,
  MAJOR_CITIES,
  haversineDistanceKm,
  geocodeCity,
  type GeoPoint,
} from "./geo";

// react-leaflet manipule le DOM directement (pas de SSR possible) : chargement
// client uniquement, avec un placeholder le temps du chargement du bundle.
const CentresMap = dynamic(() => import("./CentresMap").then((m) => m.CentresMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[65vh] min-h-[420px] items-center justify-center rounded-[2rem] border border-zinc-100 bg-white text-xs font-bold text-zinc-400">
      Chargement de la carte…
    </div>
  ),
});

type CentreWithDistance = Centre & { distanceKm?: number };

export function CivicCentres({ initialCentres }: { initialCentres: Centre[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<"map" | "liste">("map");
  const [query, setQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM);
  const [activeGeo, setActiveGeo] = useState<GeoPoint | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoNotFound, setGeoNotFound] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const textMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialCentres;
    return initialCentres.filter((c) => {
      const haystack = `${c.ville ?? ""} ${c.code_postal ?? ""} ${c.nom}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [initialCentres, query]);

  // Bascule automatique en recherche géographique : uniquement quand la
  // recherche texte ne trouve rien (pas d'appel réseau superflu quand
  // "Marseille" ou un code postal fonctionne déjà tel quel).
  useEffect(() => {
    const q = query.trim();
    setGeoNotFound(false);

    if (!q) {
      setActiveGeo(null);
      return;
    }
    // Déjà résolu pour cette valeur exacte (recherche géocodée ou ville rapide) : rien à refaire.
    if (activeGeo && activeGeo.label.toLowerCase() === q.toLowerCase()) return;
    if (textMatches.length > 0 || q.length < 3) {
      setActiveGeo(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setGeoLoading(true);
    debounceRef.current = setTimeout(async () => {
      const result = await geocodeCity(q);
      setActiveGeo(result);
      setGeoNotFound(!result);
      setGeoLoading(false);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, textMatches.length]);

  // Lecture au montage uniquement (pas useSearchParams : ce hook forcerait un
  // Suspense boundary et désactiverait le rendu statique/ISR de la page pour
  // un simple confort de lien partageable — pas justifié ici).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("vue") === "liste") setActiveTab("liste");
  }, []);

  const handleTabChange = (value: string) => {
    const tab = value === "liste" ? "liste" : "map";
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    if (tab === "map") {
      params.delete("vue");
    } else {
      params.set("vue", tab);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const pickCity = (city: GeoPoint) => {
    setQuery(city.label);
    setActiveGeo(city);
    setGeoNotFound(false);
  };

  const geoMatches: CentreWithDistance[] | null = useMemo(() => {
    if (!activeGeo) return null;
    return initialCentres
      .filter((c) => c.latitude !== null && c.longitude !== null)
      .map((c) => ({
        ...c,
        distanceKm: haversineDistanceKm(activeGeo.lat, activeGeo.lon, c.latitude as number, c.longitude as number),
      }))
      .filter((c) => (c.distanceKm as number) <= radiusKm)
      .sort((a, b) => (a.distanceKm as number) - (b.distanceKm as number));
  }, [initialCentres, activeGeo, radiusKm]);

  const filtered: CentreWithDistance[] = geoMatches ?? textMatches;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-6 py-8 lg:px-10">
        <ExerciseLayout
          title={
            <>
              Trouvez votre <span className="text-indigo-600">centre d&apos;examen</span>
            </>
          }
          badge={`${initialCentres.length} centres agréés`}
          description="Centres agréés CCI pour passer l'examen civique : naturalisation, carte de résident, carte de séjour pluriannuelle."
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une ville, un code postal ou une adresse…"
            aria-label="Rechercher un centre par ville ou code postal"
            className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 sm:max-w-xs"
          />

          {geoMatches !== null && (
            <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
              Rayon
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="h-9 rounded-xl border border-zinc-200 bg-white px-2 text-sm font-bold text-zinc-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              >
                {RADIUS_OPTIONS_KM.map((r) => (
                  <option key={r} value={r}>
                    {r} km
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Villes principales :</span>
          {MAJOR_CITIES.map((city) => (
            <button
              key={city.label}
              type="button"
              onClick={() => pickCity(city)}
              className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-zinc-600 hover:border-indigo-300 hover:text-indigo-600"
            >
              {city.label}
            </button>
          ))}
        </div>

        {geoLoading && (
          <p className="mt-3 flex items-center gap-1.5 px-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">
            <Loader2 size={12} className="animate-spin" /> Recherche du lieu…
          </p>
        )}
        {!geoLoading && geoNotFound && (
          <p className="mt-3 px-1 text-[10px] font-black uppercase tracking-widest text-amber-500">
            Lieu introuvable — essayez une ville proche ou choisissez-en une ci-dessus.
          </p>
        )}
        {!geoLoading && geoMatches !== null && !geoNotFound && (
          <p className="mt-3 px-1 text-[10px] font-black uppercase tracking-widest text-zinc-400" aria-live="polite">
            {filtered.length} centre{filtered.length > 1 ? "s" : ""} à moins de {radiusKm} km de {activeGeo?.label}
          </p>
        )}
        {!geoLoading && geoMatches === null && (
          <p className="mt-3 px-1 text-[10px] font-black uppercase tracking-widest text-zinc-400" aria-live="polite">
            {filtered.length} centre{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
          </p>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4 flex-col">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-zinc-100 rounded-2xl h-11 sm:w-64">
            <TabsTrigger value="map" className="gap-1.5 rounded-xl font-bold data-[active]:bg-white data-[active]:shadow-sm">
              <MapIcon size={14} /> Carte
            </TabsTrigger>
            <TabsTrigger value="liste" className="gap-1.5 rounded-xl font-bold data-[active]:bg-white data-[active]:shadow-sm">
              <ListIcon size={14} /> Liste
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-4">
            <CentresMap centres={filtered} activeGeo={activeGeo} radiusKm={radiusKm} />
          </TabsContent>

          <TabsContent value="liste" className="mt-4">
            <CentresList centres={filtered} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CentresList({ centres }: { centres: CentreWithDistance[] }) {
  if (centres.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-zinc-200 rounded-[2.5rem] text-zinc-400 font-bold text-sm">
        Aucun centre ne correspond à cette recherche.
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {centres.map((centre) => (
        <li
          key={centre.id}
          className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-5"
        >
          <h2 className="text-sm font-black text-zinc-900">{centre.nom}</h2>
          <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{centre.adresse}</p>
          {centre.distanceKm !== undefined && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-indigo-500">
              <MapPin size={11} /> à {Math.round(centre.distanceKm)} km
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1">
            {centre.produits.map((p) => (
              <Badge
                key={p}
                className="border-none rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase bg-zinc-100 text-zinc-500"
              >
                {PRODUIT_LABELS[p] ?? p}
              </Badge>
            ))}
          </div>

          <div className="mt-4 space-y-1.5 text-xs font-bold text-zinc-600">
            {centre.telephone && (
              <a href={`tel:${centre.telephone}`} className="flex items-center gap-1.5 hover:text-indigo-600">
                <Phone size={12} /> {centre.telephone}
              </a>
            )}
            {centre.email && (
              <a href={`mailto:${centre.email}`} className="flex items-center gap-1.5 hover:text-indigo-600">
                <Mail size={12} /> {centre.email}
              </a>
            )}
            <a
              href={centre.url_contact}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-indigo-500 hover:underline"
            >
              <ExternalLink size={12} /> Voir sur le site CCI
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
