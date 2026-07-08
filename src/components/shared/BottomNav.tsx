"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Dumbbell, Languages, PenTool } from "lucide-react";
import { motion } from "framer-motion";

export function BottomNav() {
  const pathname = usePathname();

  const items = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/tef-irn/dashboard" },
    { label: "Parcours", icon: GraduationCap, href: "/tef-irn/parcours" },
    { label: "Practice", icon: Dumbbell, href: "/tef-irn/practice" },
    { label: "Vocab", icon: Languages, href: "/tef-irn/vocab" },
    { label: "Rédaction", icon: PenTool, href: "/tef-irn/writing" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-100 bg-white/80 pb-6 pt-3 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around px-4">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="relative flex flex-col items-center gap-1">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
              isActive(item.href) ? "bg-zinc-900 text-white shadow-lg" : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
            }`}>
              <item.icon size={20} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${
              isActive(item.href) ? "text-zinc-900" : "text-zinc-400"
            }`}>
              {item.label}
            </span>
            {isActive(item.href) && (
              <motion.div
                layoutId="activeBottomNav"
                className="absolute -top-3 h-1 w-4 rounded-full bg-indigo-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
