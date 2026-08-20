"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone,
  Mail,
  ExternalLink,
  MapPin,
  Loader2,
  Map as MapIcon,
  List as ListIcon,
  X,
  LocateFixed,
  Navigation,
} from "lucide-react";
import type { Centre } from "./types";
import { PRODUIT_LABELS, directionsUrl } from "./types";
import {
  DEFAULT_RADIUS_KM,
  RADIUS_OPTIONS_KM,
  MAJOR_CITIES,
  haversineDistanceKm,
  searchAddresses,
  type GeoPoint,
  type AddressSuggestion,
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
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoNotFound, setGeoNotFound] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateDenied, setLocateDenied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const textMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialCentres;
    return initialCentres.filter((c) => {
      const haystack = `${c.ville ?? ""} ${c.code_postal ?? ""} ${c.nom}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [initialCentres, query]);

  // Autocomplete d'adresse : uniquement quand la recherche texte locale ne
  // trouve rien (pas d'appel réseau superflu quand "Marseille" ou un code
  // postal fonctionne déjà tel quel). Les suggestions sont affichées pour
  // sélection explicite — plus de résolution silencieuse au 1er résultat.
  useEffect(() => {
    const q = query.trim();
    setGeoNotFound(false);

    if (!q) {
      setActiveGeo(null);
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }
    // Déjà résolu pour cette valeur exacte (suggestion sélectionnée ou ville rapide) : rien à refaire.
    if (activeGeo && activeGeo.label.toLowerCase() === q.toLowerCase()) {
      setSuggestionsOpen(false);
      return;
    }
    if (textMatches.length > 0 || q.length < 3) {
      setActiveGeo(null);
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    setGeoLoading(true);
    setSuggestionsOpen(true);

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const results = await searchAddresses(q, controller.signal);
        setSuggestions(results);
        setHighlightedIndex(-1);
        setGeoNotFound(results.length === 0);
      } catch (e) {
        // AbortError : une recherche plus récente a pris le relais, on ignore silencieusement.
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          setSuggestions([]);
          setGeoNotFound(true);
        }
      } finally {
        if (abortRef.current === controller) setGeoLoading(false);
      }
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
    setSuggestions([]);
    setSuggestionsOpen(false);
    setGeoNotFound(false);
  };

  const selectSuggestion = (s: AddressSuggestion) => {
    setQuery(s.label);
    setActiveGeo(s);
    setSuggestions([]);
    setSuggestionsOpen(false);
    setHighlightedIndex(-1);
    setGeoNotFound(false);
  };

  const clearSearch = () => {
    setQuery("");
    setActiveGeo(null);
    setSuggestions([]);
    setSuggestionsOpen(false);
    setHighlightedIndex(-1);
    setGeoNotFound(false);
    setLocateDenied(false);
    inputRef.current?.focus();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestionsOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setSuggestionsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    setLocateDenied(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point: GeoPoint = { lat: pos.coords.latitude, lon: pos.coords.longitude, label: "Votre position" };
        setQuery(point.label);
        setActiveGeo(point);
        setSuggestions([]);
        setSuggestionsOpen(false);
        setGeoNotFound(false);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocateDenied(true);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
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
          <div className="relative w-full sm:max-w-xs">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setSuggestionsOpen(true);
              }}
              onBlur={() => setSuggestionsOpen(false)}
              placeholder="Rechercher une ville, un code postal ou une adresse…"
              aria-label="Rechercher un centre par ville, code postal ou adresse"
              role="combobox"
              aria-expanded={suggestionsOpen}
              aria-controls="centres-search-listbox"
              aria-autocomplete="list"
              aria-activedescendant={highlightedIndex >= 0 ? `centres-suggestion-${highlightedIndex}` : undefined}
              className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 pr-8 text-sm font-medium text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
            {query && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearSearch}
                aria-label="Effacer la recherche"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X size={14} />
              </button>
            )}

            {suggestionsOpen && (
              <ul
                id="centres-search-listbox"
                role="listbox"
                className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
              >
                {geoLoading && (
                  <li className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-400">
                    <Loader2 size={12} className="animate-spin" /> Recherche…
                  </li>
                )}
                {!geoLoading && suggestions.length === 0 && geoNotFound && (
                  <li className="px-3 py-2 text-xs font-bold text-amber-500">
                    Aucun lieu trouvé — essayez une ville proche ou choisissez-en une ci-dessous.
                  </li>
                )}
                {!geoLoading &&
                  suggestions.map((s, i) => (
                    <li
                      key={s.id}
                      id={`centres-suggestion-${i}`}
                      role="option"
                      aria-selected={i === highlightedIndex}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(s)}
                      onMouseEnter={() => setHighlightedIndex(i)}
                      className={`cursor-pointer px-3 py-2 text-xs ${
                        i === highlightedIndex ? "bg-indigo-50" : "hover:bg-zinc-50"
                      }`}
                    >
                      <p className="font-bold text-zinc-800">{s.label}</p>
                      {s.context && <p className="text-zinc-400">{s.context}</p>}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
          >
            {locating ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
            Ma position
          </button>

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

        {locateDenied && (
          <p className="mt-2 px-1 text-[10px] font-black uppercase tracking-widest text-amber-500">
            Position non disponible — vérifiez l&apos;autorisation de géolocalisation de votre navigateur.
          </p>
        )}

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
            <a
              href={directionsUrl(centre)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-indigo-500 hover:underline"
            >
              <Navigation size={12} /> Itinéraire
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
