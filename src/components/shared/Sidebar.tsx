"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
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
  Flag
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";

function SidebarContent() {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const parcoursId = searchParams ? searchParams.get("parcoursId") : null;

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, streak_count, subscription_tier')
            .eq('id', authData.user.id)
            .single();
          if (data) setProfile(data);
        }
      } catch (e) { console.error(e); }
    }
    fetchProfile();
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (e) { console.error(e); }
  };

  const getHrefWithContext = (baseHref: string) => {
    if (!parcoursId) return baseHref;
    return `${baseHref}?parcoursId=${parcoursId}`;
  };

  const menuItems = [
    { label: "Tableau de bord", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Leçons", icon: BookOpen, href: "/lessons" },
    { label: "Mes Parcours", icon: Flag, href: "/parcours" },
    { label: "Orthographe", icon: Zap, href: "/grammar-check" },
    { label: "Vocabulaire", icon: RotateCcw, href: "/vocab" },
    { label: "QCM Grammaire/Vocab", icon: Target, href: "/practice" },
    { label: "Rédaction", icon: PenTool, href: "/writing" },
    { label: "Expression Orale", icon: Mic, href: "/oral" },
    { label: "Corrections", icon: History, href: "/correction" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="w-64 border-r border-zinc-100 bg-white h-screen sticky top-0 flex flex-col selection:bg-indigo-100 shrink-0">
      <div className="p-8">
        <Link href={getHrefWithContext("/dashboard")} className="flex items-center gap-3 font-black text-2xl tracking-tighter text-zinc-900 group">
          <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-xl">M</div>
          <span>Maitris</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto">
        <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 mt-4">Menu</p>
        {menuItems.map((item) => (
          <Link key={item.href} href={getHrefWithContext(item.href)} className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${isActive(item.href) ? "bg-zinc-50 text-zinc-900 border border-zinc-100 shadow-sm" : "text-zinc-500 hover:bg-zinc-50"}`}>
            <item.icon size={18} className={isActive(item.href) ? "text-indigo-600" : "text-zinc-400"} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-zinc-100 space-y-3 bg-zinc-50/30">
        <div className="px-4 py-2 flex items-center justify-between text-xs font-bold bg-white border border-zinc-100 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-orange-600"><Flame size={16} fill="currentColor" /><span>{profile?.streak_count || 0}d</span></div>
          <div className="w-px h-4 bg-zinc-100" />
          <div className="flex items-center gap-2 text-indigo-600 uppercase text-[10px] font-black tracking-widest"><Shield size={14} /> {profile?.subscription_tier === 'premium' ? 'Pro' : 'Free'}</div>
        </div>
        <div className="flex flex-col gap-1">
          <Link href={getHrefWithContext("/settings")} className={`flex items-center gap-3 px-4 py-2 text-[11px] font-black uppercase tracking-widest ${isActive("/settings") ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-900"}`}><Settings size={16} />Paramètres</Link>
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
