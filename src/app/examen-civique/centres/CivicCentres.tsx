"use client";

import { useMemo, useState } from "react";
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, ExternalLink } from "lucide-react";
import type { Centre } from "./types";
import { PRODUIT_LABELS } from "./types";

export function CivicCentres({ initialCentres }: { initialCentres: Centre[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialCentres;
    return initialCentres.filter((c) => {
      const haystack = `${c.ville ?? ""} ${c.code_postal ?? ""} ${c.nom}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [initialCentres, query]);

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

        <div className="mt-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une ville ou un code postal…"
            aria-label="Rechercher un centre par ville ou code postal"
            className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 sm:max-w-xs"
          />
        </div>

        <p className="mt-3 px-1 text-[10px] font-black uppercase tracking-widest text-zinc-400" aria-live="polite">
          {filtered.length} centre{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
        </p>

        <div className="mt-4">
          <CentresList centres={filtered} />
        </div>
      </div>
    </div>
  );
}

function CentresList({ centres }: { centres: Centre[] }) {
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
