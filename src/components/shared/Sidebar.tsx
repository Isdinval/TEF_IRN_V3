"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
  History
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function Sidebar() {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

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

  const menuItems = [
    { label: "Tableau de bord", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Leçons", icon: BookOpen, href: "/lessons" },
    { label: "Orthographe & Syntaxe", icon: Zap, href: "/grammar-check" },
    { label: "Vocabulaire", icon: RotateCcw, href: "/vocab" },
    { label: "Compréhension", icon: Target, href: "/practice" },
    { label: "Expression Écrite", icon: PenTool, href: "/writing" },
    { label: "Expression Orale", icon: Mic, href: "/oral" },
    { label: "Corrections", icon: History, href: "/correction" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="w-64 border-r border-slate-100 bg-white h-screen sticky top-0 flex flex-col selection:bg-indigo-100 shrink-0">
      {/* Brand Header */}
      <div className="p-8">
        <Link href="/dashboard" className="flex items-center gap-3 font-black text-2xl tracking-tighter text-indigo-600 group">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100"
          >
            M
          </motion.div>
          <span>Maitris</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 mt-4">Menu Principal</p>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all group ${
              isActive(item.href)
                ? "bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <item.icon size={18} className={isActive(item.href) ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer / User Space */}
      <div className="p-4 mt-auto border-t border-slate-100 space-y-3 bg-slate-50/50">
        {/* Subscription Status Card */}
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statut Compte</span>
            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black ${profile?.subscription_tier === 'free' ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-600'}`}>
              {profile?.subscription_tier === 'free' ? 'GRATUIT' : 'PREMIUM'}
            </div>
          </div>

          {profile?.subscription_tier === 'free' && (
            <button
              onClick={() => router.push('/pricing')}
              className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles size={14} /> Passer au Premium
            </button>
          )}
        </div>

        {/* User Actions */}
        <div className="flex flex-col gap-1">
          <div className="px-4 py-2 flex items-center gap-3 text-xs font-bold text-orange-600 bg-orange-50 rounded-xl">
            <Flame size={16} fill="currentColor" />
            <span>{profile?.streak_count || 0} jours de streak</span>
          </div>

          <Link
            href="/settings"
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
              isActive("/settings") ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Settings size={18} className="text-slate-400" />
            Paramètres
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold rounded-xl text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
