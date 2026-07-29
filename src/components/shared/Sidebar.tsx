"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCivicContext } from "@/components/features/examen-civique/useCivicContext";
import {
  BookOpen,
  PenTool,
  LayoutDashboard,
  Settings,
  LogOut,
  Flame,
  Mic,
  Target,
  RotateCcw,
  Zap,
  Sparkles,
  History,
  Shield,
  Flag,
  Landmark,
  GraduationCap,
  ChevronDown,
  Brain,
  Clock,
  ShieldCheck,
  Wrench,
  HelpCircle,
  MapPin,
  BookMarked,
  Map
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";

function SidebarContent() {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { user } = useAuth();
  const { buildHref: buildCivicHref } = useCivicContext();

  const parcoursId = searchParams ? searchParams.get("parcoursId") : null;

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, streak_count, subscription_tier, is_admin')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      } catch (e) { console.error(e); }
    }
    fetchProfile();
  }, [supabase, user]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.refresh(); router.push("/tef-irn/login");
    } catch (e) { console.error(e); }
  };

  const getHrefWithContext = (baseHref: string) => {
    if (!parcoursId) return baseHref;
    return `${baseHref}?parcoursId=${parcoursId}`;
  };

  const menuGroups = [
    {
      key: "tef-irn",
      label: "TEF IRN",
      icon: GraduationCap,
      baseHref: "/tef-irn/dashboard",
      activePrefix: "/tef-irn",
      items: [
        { label: "Tableau de bord", icon: LayoutDashboard, href: "/tef-irn/dashboard" },
        { label: "Leçons", icon: BookOpen, href: "/tef-irn/lessons" },
        { label: "Mes Parcours", icon: Flag, href: "/tef-irn/parcours" },
        { label: "Chasse aux erreurs", icon: Zap, href: "/tef-irn/grammar-check" },
        { label: "Développez votre Vocabulaire", icon: RotateCcw, href: "/tef-irn/vocab" },
        { label: "Entraînement QCM", icon: Target, href: "/tef-irn/practice" },
        { label: "Rédaction", icon: PenTool, href: "/tef-irn/writing" },
        { label: "Expression Orale", icon: Mic, href: "/tef-irn/oral" },
        { label: "Corrections", icon: History, href: "/tef-irn/correction" },
        { label: "Guides", icon: Sparkles, href: "/tef-irn/guides" },
      ],
    },
    {
      key: "examen-civique",
      label: "Examen civique",
      icon: Landmark,
      baseHref: "/examen-civique",
      activePrefix: "/examen-civique",
      items: [
        { label: "Tableau de bord", icon: Landmark, href: "/examen-civique" },
        { label: "Livret du citoyen", icon: BookOpen, href: "/examen-civique/livret" },
        { label: "Éligibilité", icon: HelpCircle, href: "/examen-civique/eligibilite" },
        { label: "Parcourir les questions", icon: BookOpen, href: "/examen-civique/parcourir" },
        { label: "Entraînement", icon: Brain, href: "/examen-civique/entrainement" },
        { label: "Examen blanc", icon: Clock, href: "/examen-civique/examen-blanc" },
        { label: "Centres d'examen", icon: MapPin, href: "/examen-civique/centres" },
        { label: "Guides", icon: Sparkles, href: "/examen-civique/guides" },
      ],
    },
  ];

  if (profile?.is_admin) {
    menuGroups.push({
      key: "admin",
      label: "Admin",
      icon: ShieldCheck,
      baseHref: "/tef-irn/admin/exercises",
      activePrefix: "/tef-irn/admin",
      items: [
        { label: "Exercices", icon: Wrench, href: "/tef-irn/admin/exercises" },
        { label: "Questions civiques", icon: HelpCircle, href: "/tef-irn/admin/civic-questions" },
        { label: "Guides", icon: BookMarked, href: "/tef-irn/admin/guides" },
        { label: "Sitemap Debug", icon: Map, href: "/sitemap-debug" },
      ],
    });
  }

  // Le groupe contenant la page courante s'ouvre par défaut ; les autres restent repliés.
  // Repliage/dépliage indépendant ensuite (plusieurs groupes peuvent être ouverts en même temps).
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    "tef-irn": (pathname?.startsWith("/tef-irn") && !pathname?.startsWith("/tef-irn/admin")) ?? true,
    "examen-civique": pathname?.startsWith("/examen-civique") ?? false,
    "admin": pathname?.startsWith("/tef-irn/admin") ?? false,
  }));

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isActive = (href: string) => pathname === href;

  return (
    <div className="w-64 border-r border-zinc-100 bg-white h-screen sticky top-0 flex flex-col selection:bg-indigo-100 shrink-0">
      <div className="p-8">
        <Link href={getHrefWithContext("/tef-irn/dashboard")} className="flex items-center gap-3 font-black text-2xl tracking-tighter text-zinc-900 group">
          <div className="relative w-9 h-9 overflow-hidden rounded-xl shadow-xl">
            <Image
              src="/logo.png"
              alt="LlamaKusi Logo"
              fill
              className="object-cover"
            />
          </div>
          <span>LlamaKusi</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 mt-4">Menu</p>
        {menuGroups.map((group) => {
          const isGroupActive =
            (pathname?.startsWith(group.activePrefix) ?? false) &&
            (group.key === "tef-irn" ? !pathname?.startsWith("/tef-irn/admin") : true);
          const isOpen = openGroups[group.key];
          // Le groupe "Examen civique" doit propager la démarche/thématique choisie par
          // l'utilisateur (sinon un clic direct depuis la sidebar retombe sur les valeurs par
          // défaut, différentes de celles réellement en cours). Le groupe "TEF IRN" garde le
          // contexte parcoursId, propre à ce produit.
          const buildItemHref = group.key === "examen-civique" ? buildCivicHref : getHrefWithContext;
          return (
            <div key={group.key} className="space-y-0.5">
              <div className={`flex items-center rounded-xl transition-all ${isGroupActive ? "bg-zinc-50 border border-zinc-100 shadow-sm" : ""}`}>
                <Link
                  href={buildItemHref(group.baseHref)}
                  className={`flex-1 flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl ${isGroupActive ? "text-zinc-900" : "text-zinc-500 hover:bg-zinc-50"}`}
                >
                  <group.icon size={18} className={isGroupActive ? "text-indigo-600" : "text-zinc-400"} />
                  {group.label}
                </Link>
                <button
                  onClick={() => toggleGroup(group.key)}
                  aria-label={isOpen ? `Replier ${group.label}` : `Déplier ${group.label}`}
                  className="px-3 py-2.5 text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
              {isOpen && (
                <div className="pl-4 space-y-0.5">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={buildItemHref(item.href)}
                      className={`flex items-center gap-3 px-4 py-2 text-[13px] font-bold rounded-xl transition-all ${isActive(item.href) ? "bg-zinc-50 text-zinc-900 border border-zinc-100 shadow-sm" : "text-zinc-500 hover:bg-zinc-50"}`}
                    >
                      <item.icon size={16} className={isActive(item.href) ? "text-indigo-600" : "text-zinc-400"} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-zinc-100 space-y-3 bg-zinc-50/30">
        <div className="px-4 py-2 flex items-center justify-between text-xs font-bold bg-white border border-zinc-100 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-orange-600"><Flame size={16} fill="currentColor" /><span>{profile?.streak_count || 0}d</span></div>
          <div className="w-px h-4 bg-zinc-100" />
          <div className="flex items-center gap-2 text-indigo-600 uppercase text-[10px] font-black tracking-widest"><Shield size={14} /> {profile?.subscription_tier === 'premium' ? 'Pro' : 'Free'}</div>
        </div>
        <div className="flex flex-col gap-1">
          <Link href={getHrefWithContext("/tef-irn/settings")} className={`flex items-center gap-3 px-4 py-2 text-[11px] font-black uppercase tracking-widest ${isActive("/tef-irn/settings") ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-900"}`}><Settings size={16} />Paramètres</Link>
          <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-4 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-all"><LogOut size={16} />Déconnexion</button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<div className="w-64 border-r border-zinc-100 bg-white h-screen" />}>
      <SidebarContent />
    </Suspense>
  );
}
