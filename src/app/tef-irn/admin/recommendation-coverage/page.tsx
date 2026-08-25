"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, XCircle, Gauge } from "lucide-react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminGuardScreen } from "@/components/shared/AdminGuardScreen";

// Dashboard admin de couverture (item 8 du plan "Refonte matching Leçon -> Exercices") :
// pour chaque combinaison (catégorie de leçon, niveau, tag) réellement posée sur au
// moins une leçon, indique si au moins un exercice existe quelque part avec ce même
// tag et niveau -- afin de repérer un trou de contenu AVANT qu'il ne redevienne un
// bug de recommandation utilisateur (cf. bug "présent"/B1 corrigé par l'item 1).
//
// Volontairement construit à partir des tags RÉELLEMENT posés sur les leçons
// (lessons.tags), pas d'une liste blanche recopiée à la main (SOUS_CATEGORIES_BY_TYPE
// de writing/correct/route.ts) : ça évite un deuxième point de maintenance qui
// dérive silencieusement de la vraie base -- docs/lessons-tags-taxonomy.md est déjà
// construit de cette façon.
//
// Règle IMPORTANTE (voir docs/vocabulaire-particularites-recommandation.md) : la
// vérification de couverture "exercice" se fait UNIQUEMENT par tag + niveau, jamais
// par catégorie d'exercice -- exercises.category ne vaut jamais 'Vocabulaire' et
// diverge légitimement de la thématique dans la majorité des cas (item 3bis). Filtrer
// par catégorie ici referait exactement l'erreur d'audit qu'on a déjà commise une fois.

interface LessonTagRow {
  category: string;
  level: string;
  tags: string[] | null;
}

interface ExerciseTagRow {
  level: string;
  tags: string[] | null;
}

interface CoverageRow {
  category: string;
  level: string;
  tag: string;
  hasExercise: boolean;
}

const LEVELS = ["A1", "A2", "B1", "B2"];

export default function RecommendationCoverageAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const authState = useAdminGuard();
  const [rows, setRows] = useState<CoverageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("Toutes");
  const [levelFilter, setLevelFilter] = useState("Tous");
  const [gapsOnly, setGapsOnly] = useState(false);
  const [search, setSearch] = useState("");

  const fetchCoverage = useCallback(async () => {
    setLoading(true);
    try {
      // Deux requêtes larges plutôt qu'un croisement SQL complexe : volumes modestes
      // (~99 leçons, ~1700 exercices), le calcul de couverture se fait ensuite en
      // mémoire -- plus simple à lire et à maintenir qu'une requête SQL imbriquée.
      const [{ data: lessonsData }, { data: exercisesData }] = await Promise.all([
        supabase.from("lessons").select("category, level, tags").limit(500),
        supabase.from("exercises").select("level, tags").limit(5000),
      ]);

      const lessons = (lessonsData as LessonTagRow[] | null) || [];
      const exercises = (exercisesData as ExerciseTagRow[] | null) || [];

      // Ensemble (level|tag) -- category volontairement absente, voir note en tête
      // de fichier : la couverture exercice ne doit jamais dépendre de la catégorie
      // propre de l'exercice.
      const exerciseCoverage = new Set<string>();
      for (const ex of exercises) {
        for (const tag of ex.tags || []) {
          exerciseCoverage.add(`${ex.level}|${tag}`);
        }
      }

      // Déduplication (category, level, tag) : plusieurs leçons peuvent partager le
      // même tag au même niveau (ex. "être"/"avoir" couvrent une douzaine de leçons).
      const seen = new Map<string, CoverageRow>();
      for (const lesson of lessons) {
        if (!lesson.category || !lesson.level) continue;
        for (const tag of lesson.tags || []) {
          const key = `${lesson.category}|${lesson.level}|${tag}`;
          if (seen.has(key)) continue;
          seen.set(key, {
            category: lesson.category,
            level: lesson.level,
            tag,
            hasExercise: exerciseCoverage.has(`${lesson.level}|${tag}`),
          });
        }
      }

      const computed = Array.from(seen.values()).sort((a, b) =>
        a.category.localeCompare(b.category) ||
        a.level.localeCompare(b.level) ||
        a.tag.localeCompare(b.tag)
      );
      setRows(computed);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (authState === "granted") fetchCoverage();
  }, [authState, fetchCoverage]);

  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category))).sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (categoryFilter !== "Toutes" && r.category !== categoryFilter) return false;
      if (levelFilter !== "Tous" && r.level !== levelFilter) return false;
      if (gapsOnly && r.hasExercise) return false;
      if (search.trim() && !r.tag.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [rows, categoryFilter, levelFilter, gapsOnly, search]);

  const totalGaps = useMemo(() => rows.filter((r) => !r.hasExercise).length, [rows]);
  const coveragePct = rows.length > 0 ? Math.round(((rows.length - totalGaps) / rows.length) * 100) : 100;

  if (authState !== "granted") {
    return <AdminGuardScreen state={authState} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 pt-12">
      <header className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <Badge className="bg-slate-900 mb-2">ZONE ADMIN</Badge>
          <h1 className="text-3xl font-black tracking-tight">Couverture leçon → exercice</h1>
          <p className="text-muted-foreground">
            {rows.length} combinaison{rows.length > 1 ? "s" : ""} catégorie/niveau/tag —{" "}
            <span className={totalGaps > 0 ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
              {totalGaps} trou{totalGaps > 1 ? "s" : ""} détecté{totalGaps > 1 ? "s" : ""}
            </span>{" "}
            ({coveragePct}% couvert)
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white border border-zinc-100 shadow-sm px-5 py-3">
          <Gauge size={20} className={coveragePct === 100 ? "text-emerald-600" : "text-amber-600"} />
          <span className="text-2xl font-black text-zinc-900">{coveragePct}%</span>
        </div>
      </header>

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="Toutes">Toutes les catégories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="Tous">Tous les niveaux</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <Input placeholder="Rechercher un tag..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 max-w-xs" />
        <label className="flex items-center gap-2 text-sm font-bold text-zinc-600 cursor-pointer select-none">
          <input type="checkbox" checked={gapsOnly} onChange={(e) => setGapsOnly(e.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
          Trous uniquement
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden">
          {filteredRows.length === 0 ? (
            <p className="p-8 text-center text-zinc-400 font-bold text-sm">
              {gapsOnly ? "Aucun trou pour ces filtres — bien joué." : "Aucune combinaison ne correspond à ces filtres."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-[10px] uppercase tracking-widest text-zinc-400 font-black">
                <tr>
                  <th className="text-left px-5 py-3">Catégorie</th>
                  <th className="text-left px-5 py-3">Niveau</th>
                  <th className="text-left px-5 py-3">Tag</th>
                  <th className="text-left px-5 py-3">Leçon</th>
                  <th className="text-left px-5 py-3">Exercice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filteredRows.map((r) => (
                  <tr key={`${r.category}|${r.level}|${r.tag}`} className={!r.hasExercise ? "bg-rose-50/40" : undefined}>
                    <td className="px-5 py-3 capitalize font-bold text-zinc-700">{r.category}</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className="text-[10px] font-black">{r.level}</Badge>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{r.tag}</td>
                    <td className="px-5 py-3">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    </td>
                    <td className="px-5 py-3">
                      {r.hasExercise ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                          <XCircle size={16} /> Manquant
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
