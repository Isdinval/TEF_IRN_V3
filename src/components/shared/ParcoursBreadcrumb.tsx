"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useParcours } from "@/contexts/ParcoursContext";
import { cn } from "@/lib/utils";

interface ParcoursBreadcrumbProps {
  className?: string;
}

export function ParcoursBreadcrumb({ className }: ParcoursBreadcrumbProps) {
  const { activeParcours, activeLesson } = useParcours();

  if (!activeParcours) return null;

  return (
    <nav className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400", className)}>
      <Link href="/tef-irn/dashboard" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
        <Home size={12} />
      </Link>
      <ChevronRight size={12} />
      <Link href="/tef-irn/parcours" className="hover:text-indigo-600 transition-colors">
        Parcours
      </Link>
      <ChevronRight size={12} />
      <Link
        href={`/tef-irn/parcours/${activeParcours.slug}`}
        className="hover:text-indigo-600 transition-colors text-zinc-500"
      >
        {activeParcours.category} {activeParcours.level}
      </Link>

      {activeLesson && (
        <>
          <ChevronRight size={12} />
          <span className="text-indigo-600 truncate max-w-[150px]">
            {activeLesson.title}
          </span>
        </>
      )}
    </nav>
  );
}
