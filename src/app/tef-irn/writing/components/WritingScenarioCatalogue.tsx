"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shuffle, Loader2, Play } from "lucide-react";

export type Section = "A" | "B";
export type Level = "A2" | "B1" | "B2";

export const TYPE_TEXTE_LABELS: Record<string, string> = {
  message_informatif: "Message informatif",
  lettre_formelle: "Lettre formelle",
  lettre_reclamation: "Lettre de réclamation",
  texte_argumentatif: "Texte argumentatif",
};

export type WritingScenarioListItem = {
  id: string;
  section: Section;
  level: Level;
  type_texte: string;
  title: string;
  sujet: string;
  min_words: number;
  duration_seconds: number;
};

export function WritingScenarioCatalogue({
  scenarios,
  loading,
  section,
  level,
  typeTexte,
  onSectionChange,
  onLevelChange,
  onTypeTexteChange,
  onSelectScenario,
  onSurpriseMe,
}: {
  scenarios: WritingScenarioListItem[];
  loading: boolean;
  section: Section | "all";
  level: Level | "all";
  typeTexte: string | "all";
  onSectionChange: (s: Section | "all") => void;
  onLevelChange: (l: Level | "all") => void;
  onTypeTexteChange: (t: string | "all") => void;
  onSelectScenario: (scenarioId: string) => void;
  onSurpriseMe: () => void;
}) {
  const typesDisponibles = Array.from(new Set(scenarios.map((s) => s.type_texte)));

  const filtered = scenarios.filter(
    (s) =>
      (section === "all" || s.section === section) &&
      (level === "all" || s.level === level) &&
      (typeTexte === "all" || s.type_texte === typeTexte)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Section</span>
            <div className="flex gap-2">
              {(["all", "A", "B"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={section === s ? "default" : "outline"}
                  onClick={() => onSectionChange(s)}
                >
                  {s === "all" ? "Toutes" : `Section ${s}`}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Niveau</span>
            <div className="flex gap-2">
              {(["all", "A2", "B1", "B2"] as const).map((l) => (
                <Button
                  key={l}
                  size="sm"
                  variant={level === l ? "default" : "outline"}
                  onClick={() => onLevelChange(l)}
                >
                  {l === "all" ? "Tous" : l}
                </Button>
              ))}
            </div>
          </div>
          {typesDisponibles.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Type de texte</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={typeTexte === "all" ? "default" : "outline"}
                  onClick={() => onTypeTexteChange("all")}
                >
                  Tous
                </Button>
                {typesDisponibles.map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={typeTexte === t ? "default" : "outline"}
                    onClick={() => onTypeTexteChange(t)}
                  >
                    {TYPE_TEXTE_LABELS[t] ?? t}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button
          size="lg"
          variant="outline"
          className="h-11 rounded-2xl border-indigo-200 bg-indigo-50 font-black text-indigo-600 hover:bg-indigo-100"
          onClick={onSurpriseMe}
        >
          <Shuffle className="mr-2" size={18} /> Surprends-moi
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-zinc-400">
          <Loader2 className="mr-2 animate-spin" /> Chargement des sujets...
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm font-medium text-zinc-400">
          Aucun sujet disponible pour ces filtres.
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
                  {TYPE_TEXTE_LABELS[s.type_texte] ?? s.type_texte} · {s.min_words} mots min.
                </p>
                <p className="line-clamp-3 text-sm font-medium leading-relaxed text-zinc-500">
                  {s.sujet}
                </p>
                <Button
                  size="sm"
                  className="mt-2 w-fit rounded-xl bg-zinc-900 font-black group-hover:bg-indigo-600"
                >
                  <Play className="mr-2" size={14} /> Rédiger
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
