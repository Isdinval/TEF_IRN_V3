"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookMarked, GraduationCap, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export function VocabProgress({ stats }: { stats: any }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
          <BookMarked size={14} className="text-indigo-500" /> LlamaKusie Vocabulaire
        </h3>
        <div
          onClick={() => router.push('/vocab')}
          className="flex items-center gap-1 text-[10px] font-black text-indigo-600 cursor-pointer hover:underline"
        >
          Apprendre <ChevronRight size={10} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 bg-white border border-zinc-100 rounded-3xl shadow-sm text-center">
          <p className="text-[10px] font-black uppercase text-zinc-400 mb-1">Mots Appris</p>
          <p className="text-3xl font-black text-zinc-900">{stats?.total || 0}</p>
        </div>
        <div className="p-5 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-100 text-center text-white">
          <p className="text-[10px] font-black uppercase opacity-60 mb-1">Niveau Clé</p>
          <p className="text-3xl font-black">{stats?.topLevel || 'A1'}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
           <span className="text-[10px] font-black uppercase text-zinc-400">Progression par Niveau</span>
        </div>
        <div className="flex gap-2">
          {['A1', 'A2', 'B1', 'B2'].map(lvl => (
            <div
              key={lvl}
              className={`flex-1 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${
                (stats?.levels?.[lvl] || 0) > 0
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-zinc-50 text-zinc-300 border border-transparent'
              }`}
            >
              {lvl}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
