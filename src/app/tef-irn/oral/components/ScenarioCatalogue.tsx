"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shuffle, Loader2, Play, Target, Layers } from "lucide-react";

export type Section = "A" | "B";
export type Level = "A2" | "B1" | "B2";

export type ScenarioListItem = {
  id: string;
  section: Section;
  level: Level;
  title: string;
  role_interlocuteur: string;
  sujet: string;
};

export function ScenarioCatalogue({
  scenarios,
  loading,
  section,
  level,
  onSectionChange,
  onLevelChange,
  onSelectScenario,
  onSurpriseMe,
}: {
  scenarios: ScenarioListItem[];
  loading: boolean;
  section: Section | "all";
  level: Level | "all";
  onSectionChange: (s: Section | "all") => void;
  onLevelChange: (l: Level | "all") => void;
  onSelectScenario: (scenarioId: string) => void;
  onSurpriseMe: () => void;
}) {
  const filtered = scenarios.filter(
    (s) => (section === "all" || s.section === section) && (level === "all" || s.level === level)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 space-y-4 shadow-sm">
          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Layers size={14} className="text-indigo-600" /> Section
          </div>
          <div className="flex gap-2">
            {(["all", "A", "B"] as const).map((s) => (
              <button
                key={s}
                onClick={() => onSectionChange(s)}
                className={`flex-1 h-12 rounded-2xl font-black transition-all ${section === s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-50 text-zinc-400 hover:border-zinc-200'}`}
              >
                {s === "all" ? "Toutes" : s}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 space-y-4 shadow-sm">
          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Target size={14} className="text-indigo-600" /> Niveau
          </div>
          <div className="flex gap-2">
            {(["all", "A2", "B1", "B2"] as const).map((l) => (
              <button
                key={l}
                onClick={() => onLevelChange(l)}
                className={`flex-1 h-12 rounded-2xl font-black transition-all ${level === l ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-50 text-zinc-400 hover:border-zinc-200'}`}
              >
                {l === "all" ? "Tous" : l}
              </button>
            ))}
          </div>
        </div>

        <div
          onClick={onSurpriseMe}
          className="bg-indigo-600 p-6 rounded-[2.5rem] text-white space-y-4 shadow-2xl shadow-indigo-100 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
            <Shuffle size={14} /> Scénario surprise
          </div>
          <h4 className="text-base font-black leading-tight">Laissez-vous surprendre</h4>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase">
            <Play size={16} /> Tirage aléatoire
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-zinc-400">
          <Loader2 className="mr-2 animate-spin" /> Chargement des scénarios...
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm font-medium text-zinc-400">
          Aucun scénario disponible pour ces filtres.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Card
              key={s.id}
              className="group cursor-pointer overflow-hidden rounded-[1.75rem] border-none bg-white shadow-lg shadow-zinc-200/50 transition-transform hover:-translate-y-1 hover:shadow-xl"
              onClick={() => onSelectScenario(s.id)}
            >
              <CardContent className="flex flex-col gap-3 p-6">
                <div className="flex items-center gap-2">
                  <Badge className="rounded-full border-none bg-indigo-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    Section {s.section}
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                    {s.level}
                  </Badge>
                </div>
                <h3 className="text-lg font-black leading-tight tracking-tight text-zinc-900">
                  {s.title}
                </h3>
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                  {s.role_interlocuteur}
                </p>
                <p className="line-clamp-3 text-sm font-medium leading-relaxed text-zinc-500">
                  {s.sujet}
                </p>
                <Button
                  size="sm"
                  className="mt-2 w-fit rounded-xl bg-zinc-900 font-black group-hover:bg-indigo-600"
                >
                  <Play className="mr-2" size={14} /> Démarrer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
