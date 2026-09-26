"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCivicContext } from "@/components/features/examen-civique/useCivicContext";
import {
  LayoutDashboard,
  ClipboardCheck,
  Mic,
  PenTool,
  Landmark,
  Clock,
  Brain,
  MapPin,
  Menu as MenuIcon,
} from "lucide-react";

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

// Barre de navigation basse mobile/tablette (< md). Le contenu s'adapte selon
// le produit actif (TEF IRN vs Examen Civique), déterminé par le préfixe de
// route -- même logique de détection que le regroupement des menus dans
// Sidebar.tsx. Le 5e emplacement ("Menu") ouvre MobileDrawer, qui donne accès
// à l'intégralité de l'arborescence (les deux produits + Admin le cas échéant).
export function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { buildHref: buildCivicHref } = useCivicContext();

  const parcoursId = searchParams ? searchParams.get("parcoursId") : null;
  const getHrefWithContext = (baseHref: string) =>
    parcoursId ? `${baseHref}?parcoursId=${parcoursId}` : baseHref;

  const isCivic = pathname?.startsWith("/examen-civique") ?? false;

  const items = isCivic
    ? [
        { label: "Dashboard", icon: Landmark, href: buildCivicHref("/examen-civique") },
        { label: "Examen blanc", icon: Clock, href: buildCivicHref("/examen-civique/examen-blanc") },
        { label: "Entraînement", icon: Brain, href: buildCivicHref("/examen-civique/entrainement") },
        { label: "Centres", icon: MapPin, href: buildCivicHref("/examen-civique/centres") },
      ]
    : [
        { label: "Dashboard", icon: LayoutDashboard, href: getHrefWithContext("/tef-irn/dashboard") },
        { label: "Examen blanc", icon: ClipboardCheck, href: getHrefWithContext("/tef-irn/exam") },
        { label: "Expr. Orale", icon: Mic, href: getHrefWithContext("/tef-irn/oral") },
        { label: "Expr. Écrite", icon: PenTool, href: getHrefWithContext("/tef-irn/writing") },
      ];

  const activeColor = isCivic ? "text-blue-600" : "text-indigo-600";

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-[100] bg-white border-t border-zinc-100 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => {
          const isActive = pathname === item.href.split("?")[0];
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 text-xs font-bold ${isActive ? activeColor : "text-zinc-500"}`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center gap-0.5 text-xs font-bold text-zinc-500"
        >
          <MenuIcon size={20} />
          Menu
        </button>
      </div>
    </nav>
  );
}
