"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { BookOpen, PenTool, LayoutDashboard, Settings, LogOut, Flame, Mic, Target, RotateCcw, Zap, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

export function Sidebar() {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('ai_credits, subscription_tier').eq('id', user.id).single();
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
    { label: "Mon Profil", icon: Settings, href: "/profile" },
  ];

  return (
    <div className="w-64 border-r bg-card h-screen sticky top-0 flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-indigo-600">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">M</div>
          Maitris
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors group"
          >
            <item.icon size={18} className="text-muted-foreground group-hover:text-indigo-600 transition-colors" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t space-y-3">
        {profile && (
          <div className="px-3 py-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Crédits IA</span>
              <Sparkles size={12} className="text-indigo-500" />
            </div>
            <div className="flex items-end gap-1">
              <span className="text-xl font-black text-indigo-900">{profile.ai_credits}</span>
              <span className="text-[10px] text-indigo-400 mb-1">restants</span>
            </div>
            <button
              onClick={() => router.push('/pricing')}
              className="w-full mt-2 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              RECHARGER
            </button>
          </div>
        )}

        <div className="px-3 py-2 flex items-center gap-2 text-xs font-semibold text-orange-600 bg-orange-50 rounded-md">
          <Flame size={14} fill="currentColor" /> 5 jours de streak
        </div>
        <button
          onClick={() => router.push("/profile")}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-muted-foreground"
        >
          <Settings size={18} /> Paramètres
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-red-50 text-red-600"
        >
          <LogOut size={18} /> Déconnexion
        </button>
      </div>
    </div>
  );
}
