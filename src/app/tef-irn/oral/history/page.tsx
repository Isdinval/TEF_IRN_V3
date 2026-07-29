"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { OralAnalysisView } from "../components/OralAnalysisView";
import { OralAnalysis, OralTurn } from "@/lib/oral-criteria";

// v1 volontairement minimal : liste + détail, pas de filtres/tri/export PDF
// (contrairement à /tef-irn/correction) -- à ajouter plus tard si le besoin se
// confirme, mais rien ne le justifie encore pour l'oral.
interface OralSession extends OralAnalysis {
  id: string;
  created_at: string;
  section: "A" | "B";
  level: "A2" | "B1" | "B2";
  transcript: OralTurn[];
}

export default function OralHistoryPage() {
  const [sessions, setSessions] = useState<OralSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OralSession | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/tef-irn/login");
      return;
    }

    const { data, error } = await supabase
      .from("oral_session_results")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading oral sessions:", error);
    } else {
      setSessions((data as unknown as OralSession[]) || []);
    }
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50/50">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-sm font-black uppercase tracking-widest text-zinc-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/30 selection:bg-indigo-100">
      <div className="mx-auto max-w-4xl p-6 pt-8 lg:p-10">
        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <Badge className="rounded-full border-none bg-indigo-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 text-white">
                    Progression
                  </Badge>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-zinc-900 leading-tight uppercase">
                    Historique <span className="text-indigo-600">oral</span>
                  </h1>
                  <p className="max-w-xl text-sm font-medium leading-relaxed text-zinc-500">
                    Retrouvez vos sessions d'entretien oral et leurs analyses détaillées.
                  </p>
                </div>
                <Link href="/tef-irn/oral">
                  <Button className="h-11 rounded-2xl bg-zinc-900 px-6 font-black text-sm text-white shadow-xl shadow-zinc-200 hover:bg-zinc-800 transition-all active:scale-95 group">
                    Nouvelle session
                    <Sparkles className="ml-2 group-hover:rotate-12 transition-transform" size={16} />
                  </Button>
                </Link>
              </header>

              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-[2.5rem] border-2 border-dashed border-zinc-100 bg-white">
                  <Mic size={48} className="text-zinc-200 mb-4" />
                  <p className="text-sm font-bold text-zinc-400">
                    Aucune session pour l'instant. Lancez votre premier entretien oral !
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelected(s)}
                      className="w-full text-left p-5 bg-white border border-zinc-100 rounded-[2rem] shadow-sm hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/30 transition-all flex items-center gap-4"
                    >
                      <div className="w-14 h-14 shrink-0 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                        <Mic size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-indigo-50 text-indigo-600 border-none rounded-full px-3 py-0.5 text-[9px] uppercase font-black tracking-widest">
                            Section {s.section} · {s.level}
                          </Badge>
                          <span className="text-[11px] font-bold text-zinc-400">
                            {new Date(s.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 truncate italic">{s.general_comment}</p>
                      </div>
                      <div
                        className={`text-xl font-black shrink-0 ${
                          s.overall_score >= 70
                            ? "text-emerald-600"
                            : s.overall_score >= 55
                            ? "text-amber-600"
                            : "text-rose-600"
                        }`}
                      >
                        {s.overall_score}
                        <span className="text-xs text-zinc-400 ml-0.5">/100</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Button
                variant="ghost"
                className="mb-4 font-black text-zinc-500 hover:text-zinc-900"
                onClick={() => setSelected(null)}
              >
                ← Retour à l'historique
              </Button>
              <OralAnalysisView
                analysis={selected}
                transcript={selected.transcript}
                onRestart={() => router.push("/tef-irn/oral")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
