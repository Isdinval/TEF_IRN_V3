"use client";

import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Dumbbell, Highlighter, Languages, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

export function QuickAccess() {
  const router = useRouter();

  const links = [
    { label: "Parcours", icon: GraduationCap, href: "/parcours", color: "bg-indigo-50 text-indigo-600", hover: "hover:shadow-indigo-100" },
    { label: "Practice", icon: Dumbbell, href: "/practice", color: "bg-orange-50 text-orange-600", hover: "hover:shadow-orange-100" },
    { label: "Correction IA", icon: Highlighter, href: "/correction", color: "bg-violet-50 text-violet-600", hover: "hover:shadow-violet-100" },
    { label: "Vocabulaire", icon: Languages, href: "/vocab", color: "bg-emerald-50 text-emerald-600", hover: "hover:shadow-emerald-100" },
    { label: "Examens Blancs", icon: BookOpen, href: "/exam", color: "bg-rose-50 text-rose-600", hover: "hover:shadow-rose-100" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {links.map((link, i) => (
        <button
          key={i}
          onClick={() => router.push(link.href)}
          className="group"
        >
          <Card className={`h-full overflow-hidden border-none bg-white shadow-xl shadow-zinc-100 rounded-[2rem] transition-all group-hover:-translate-y-2 ${link.hover}`}>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-[1.25rem] ${link.color} transition-transform group-hover:scale-110`}>
                <link.icon size={28} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-zinc-900">{link.label}</span>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
