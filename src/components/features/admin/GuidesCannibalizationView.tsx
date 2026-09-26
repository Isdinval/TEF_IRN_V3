"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { detectCannibalization, type GuideForCannibalization } from "@/lib/guides-cannibalization";

// Onglet "Cannibalisation" de l'admin des guides : groupes de guides publies qui visent le meme
// mot_cle_principal (correspondance exacte apres normalisation espaces/casse), donc se disputent
// le meme classement Google au lieu de se completer. Detection au chargement, sur les guides
// publies uniquement (un brouillon ne cannibalise rien tant qu'il n'est pas en ligne).

interface GuideRowForCannibalization extends GuideForCannibalization {
  is_published: boolean;
}

export default function GuidesCannibalizationView() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<GuideRowForCannibalization[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from("guides")
      .select("id, slug, title, product, mot_cle_principal, is_published")
      .eq("is_published", true)
      .then(({ data, error }: { data: GuideRowForCannibalization[] | null; error: { message: string } | null }) => {
        if (!active) return;
        if (error) setErrorMsg(error.message);
        else setRows(data || []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [supabase]);

  const groups = useMemo(() => detectCannibalization(rows), [rows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-500">
        <Loader2 className="animate-spin mr-2" size={20} /> Recherche de doublons de mot-clé...
      </div>
    );
  }
  if (errorMsg) {
    return <p className="text-red-600 text-sm p-6">{errorMsg}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {groups.length === 0 ? (
          <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
            Aucune cannibalisation détectée sur les guides publiés
          </span>
        ) : (
          <span className="text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-700 font-bold">
            {groups.length} mot{groups.length > 1 ? "s" : ""}-clé{groups.length > 1 ? "s" : ""} partagé
            {groups.length > 1 ? "s" : ""} par plusieurs guides publiés
          </span>
        )}
      </div>

      <div className="space-y-3">
        {groups.map((group) => {
          const crossProduct = new Set(group.guides.map((g) => g.product)).size > 1;
          return (
            <div key={group.keyword} className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <p className="font-black text-sm">« {group.keyword} »</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                  {group.guides.length} guides
                </span>
                {crossProduct && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    cross-produit
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {group.guides.map((g) => (
                  <div key={g.id} className="flex items-center gap-2 text-sm">
                    <span className="px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 shrink-0">
                      {g.product}
                    </span>
                    <span className="font-bold truncate">{g.title}</span>
                    <span className="text-zinc-500 truncate">{g.slug}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-zinc-500">
        Correspondance exacte sur mot_cle_principal (espaces/casse ignorés) uniquement — ne détecte pas les
        mots-clés proches mais non identiques (ex. synonymes, singulier/pluriel).
      </p>
    </div>
  );
}
