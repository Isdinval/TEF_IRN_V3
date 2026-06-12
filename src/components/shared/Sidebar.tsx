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

  const parcoursId = searchParams.get("parcoursId");

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, streak_count, subscription_tier')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
    }
    fetchProfile();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getHrefWithContext = (baseHref: string) => {
    if (!parcoursId) return baseHref;
    // When navigating via sidebar, we keep the parcoursId context but drop lessonId
    const newParams = new URLSearchParams();
    newParams.set("parcoursId", parcoursId);
    return `${baseHref}?${newParams.toString()}`;
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
      {/* Brand Header */}
      <div className="p-8">
        <Link href={getHrefWithContext("/dashboard")} className="flex items-center gap-3 font-black text-2xl tracking-tighter text-zinc-900 group">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-xl shadow-zinc-200"
          >
            M
          </motion.div>
          <span>Maitris</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto">
        <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 mt-4">Menu</p>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={getHrefWithContext(item.href)}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all group ${
              isActive(item.href)
                ? "bg-zinc-50 text-zinc-900 border border-zinc-100 shadow-sm"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            <item.icon size={18} className={isActive(item.href) ? "text-indigo-600" : "text-zinc-400 group-hover:text-zinc-600"} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer / User Space */}
      <div className="p-4 mt-auto border-t border-zinc-100 space-y-3 bg-zinc-50/30">

        {/* User Badge Section */}
        <div className="px-4 py-2 flex items-center justify-between text-xs font-bold bg-white border border-zinc-100 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-orange-600">
            <Flame size={16} fill="currentColor" />
            <span>{profile?.streak_count || 0}d</span>
          </div>
          <div className="w-px h-4 bg-zinc-100" />
          <div className="flex items-center gap-2 text-indigo-600 uppercase text-[10px] font-black tracking-widest">
            <Shield size={14} /> {profile?.subscription_tier === 'premium' ? 'Pro' : 'Free'}
          </div>
        </div>

        {profile?.subscription_tier === 'free' && (
          <button
            onClick={() => router.push('/pricing')}
            className="w-full py-2.5 bg-zinc-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles size={14} /> Passer au Premium
          </button>
        )}

        {/* User Actions */}
        <div className="flex flex-col gap-1">
          <Link
            href={getHrefWithContext("/settings")}
            className={`flex items-center gap-3 px-4 py-2 text-[11px] font-black uppercase tracking-widest ${
              isActive("/settings") ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <Settings size={16} />
            Paramètres
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-all"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
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
