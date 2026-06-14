"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input as ShadcnInput } from "@/components/ui/input";

interface CorrectionFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  level: string;
  setLevel: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
}

export const CorrectionFilters = ({
  search,
  setSearch,
  level,
  setLevel,
  sortBy,
  setSortBy
}: CorrectionFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-3xl shadow-xl shadow-zinc-100 border border-zinc-50">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <ShadcnInput
          placeholder="Rechercher par sujet ou feedback..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 focus-visible:ring-indigo-500 font-medium"
        />
      </div>

      <div className="flex gap-2 w-full md:w-auto">
        <Select value={level} onValueChange={(val) => setLevel(val || "all")}>
          <SelectTrigger className="h-12 w-[140px] rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold text-zinc-600">
            <SelectValue placeholder="Niveau" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-zinc-100">
            <SelectItem value="all">Tous niveaux</SelectItem>
            <SelectItem value="A1">Niveau A1</SelectItem>
            <SelectItem value="A2">Niveau A2</SelectItem>
            <SelectItem value="B1">Niveau B1</SelectItem>
            <SelectItem value="B2">Niveau B2</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(val) => setSortBy(val || "newest")}>
          <SelectTrigger className="h-12 w-[160px] rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold text-zinc-600">
            <SlidersHorizontal size={14} className="mr-2" />
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-zinc-100">
            <SelectItem value="newest">Plus récent</SelectItem>
            <SelectItem value="oldest">Plus ancien</SelectItem>
            <SelectItem value="score_desc">Meilleur score</SelectItem>
            <SelectItem value="score_asc">Moins bon score</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
