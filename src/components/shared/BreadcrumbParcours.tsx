"use client";

import { useParcours } from "@/contexts/ParcoursContext";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BreadcrumbParcours() {
  const { activeParcours, currentLesson } = useParcours();
  const pathname = usePathname();

  if (!activeParcours) return null;

  const steps = [
    { label: "Parcours", href: "/parcours" },
    {
      label: `${activeParcours.category} ${activeParcours.level}`,
      href: `/parcours/${activeParcours.id}`
    }
  ];

  if (pathname.includes("/lessons/")) {
    steps.push({ label: currentLesson?.title || "Leçon", href: "#" });
  } else if (pathname.includes("/practice")) {
    steps.push({ label: "Pratique", href: "#" });
  } else if (pathname.includes("/vocab")) {
    steps.push({ label: "Vocabulaire", href: "#" });
  } else if (pathname.includes("/grammar-check")) {
    steps.push({ label: "Grammaire", href: "#" });
  }

  return (
    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 overflow-x-auto whitespace-nowrap pb-2">
      <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
        <Home size={12} />
      </Link>

      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={10} className="shrink-0 text-zinc-300" />
          <Link
            href={step.href === "#" ? "#" : `${step.href}?parcoursId=${activeParcours.id}`}
            className={index === steps.length - 1 ? "text-indigo-600" : "hover:text-indigo-600 transition-colors"}
          >
            {step.label}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}

import React from "react";
