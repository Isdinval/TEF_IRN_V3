"use client";

import Link from "next/link";
import { ChevronRight, Home, BookOpen } from "lucide-react";
import { useParcours } from "@/contexts/ParcoursContext";

interface BreadcrumbParcoursProps {
  currentPage?: string;
}

export function BreadcrumbParcours({ currentPage }: BreadcrumbParcoursProps) {
  const { activeParcours } = useParcours();

  return (
    <nav className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-6 px-1">
      <Link href="/dashboard" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
        <Home size={12} />
        Tableau de bord
      </Link>

      <ChevronRight size={12} className="text-zinc-300" />

      <Link href="/parcours" className="hover:text-indigo-600 transition-colors">
        Mes Parcours
      </Link>

      {activeParcours && (
        <>
          <ChevronRight size={12} className="text-zinc-300" />
          <Link
            href={`/parcours/${activeParcours.id}`}
            className="hover:text-indigo-600 transition-colors text-zinc-500 max-w-[150px] truncate"
          >
            {activeParcours.category} {activeParcours.level}
          </Link>
        </>
      )}

      {currentPage && (
        <>
          <ChevronRight size={12} className="text-zinc-300" />
          <span className="text-indigo-600 font-black truncate max-w-[200px]">
            {currentPage}
          </span>
        </>
      )}
    </nav>
  );
}
