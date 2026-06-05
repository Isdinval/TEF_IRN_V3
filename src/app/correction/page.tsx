"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Calendar,
  FileText,
  ChevronRight,
  History,
  Sparkles,
  ArrowLeft,
  Quote,
  Target,
  AlertCircle,
  Info
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function CorrectionHistoryPage() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadHistory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('exercise_attempts')
          .select('*')
          .order('created_at', { ascending: false });

        setAttempts(data || []);
      }
      setLoading(false);
    }
    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50">
        <Loader2 className="mb-4 animate-spin text-indigo-600" size={44} />
        <p className="animate-pulse text-sm font-black uppercase tracking-widest text-zinc-400">
          Chargement de vos corrections...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 selection:bg-indigo-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col p-6 pt-10 lg:p-10">
        <AnimatePresence mode="wait">
          {!selectedAttempt ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <Badge className="mb-4 rounded-full border-none bg-indigo-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                    Historique
                  </Badge>
                  <h1 className="mb-4 text-5xl font-black tracking-tighter text-zinc-900">
                    VOS <span className="text-indigo-600">CORRECTIONS</span>
                  </h1>
                  <p className="max-w-2xl text-lg font-medium leading-relaxed text-zinc-500">
                    Retrouvez toutes vos analyses d'expression écrite et orale, vos scores et les recommandations détaillées du coach IA.
                  </p>
                </div>
                <Link href="/writing">
                  <Button className="h-14 rounded-2xl bg-zinc-900 px-6 font-black text-white shadow-xl shadow-zinc-200 hover:bg-zinc-800">
                    Nouvelle rédaction <Sparkles className="ml-2" size={16} />
                  </Button>
                </Link>
              </header>

              {attempts.length === 0 ? (
                <Card className="rounded-[2.5rem] border-2 border-dashed border-zinc-100 bg-white p-12 text-center shadow-xl shadow-zinc-100">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50">
                    <History className="text-zinc-300" size={32} />
                  </div>
                  <h3 className="font-black text-zinc-900">Aucune correction pour le moment</h3>
                  <p className="mt-2 text-sm font-medium text-zinc-500">
                    Commencez un exercice d'expression pour voir vos progrès ici.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {attempts.map((attempt, index) => (
                    <motion.div
                      key={attempt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedAttempt(attempt)}
                    >
                      <Card className="group cursor-pointer overflow-hidden rounded-[2rem] border-none bg-white shadow-xl shadow-zinc-100 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-100">
                        <div className="flex items-center gap-6 p-6">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                            <FileText size={24} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex items-center gap-3">
                              <h3 className="line-clamp-1 font-black text-zinc-900">
                                {attempt.answers?.subject || "Expression Écrite"}
                              </h3>
                              <Badge variant="outline" className="shrink-0 rounded-full border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                {attempt.answers?.feedback?.level || "B2"}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-400">
                              <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(attempt.created_at).toLocaleDateString()}</span>
                              <span className="flex items-center gap-1"><History size={12} /> Score : {attempt.score || 0}/100</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0 rounded-full hover:bg-indigo-50 hover:text-indigo-600">
                            <ChevronRight size={20} />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex min-h-0 flex-1 flex-col space-y-8"
            >
              <header className="flex shrink-0 items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setSelectedAttempt(null)} className="rounded-xl bg-white shadow-sm hover:bg-zinc-50">
                  <ArrowLeft size={20} />
                </Button>
                <div>
                  <Badge className="mb-2 rounded-full border-none bg-indigo-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    Correction détaillée
                  </Badge>
                  <h1 className="text-3xl font-black tracking-tight text-zinc-900">Analyse de votre production</h1>
                  <p className="text-xs font-medium text-zinc-500">
                    {new Date(selectedAttempt.created_at).toLocaleDateString()} • {selectedAttempt.score}/100
                  </p>
                </div>
              </header>

              <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-2">
                <Card className="flex flex-col overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-zinc-200/50">
                  <CardHeader className="shrink-0 border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Votre rédaction</p>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto p-8">
                    <div className="whitespace-pre-wrap text-lg font-medium italic leading-relaxed text-zinc-800">
                      “{selectedAttempt.answers?.text}”
                    </div>
                  </CardContent>
                </Card>

                <Card className="flex flex-col overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-indigo-100/50">
                  <CardHeader className="shrink-0 bg-zinc-900 p-6 text-white">
                    <div className="flex items-center justify-between gap-4">
                      <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tighter">
                        <Sparkles size={20} className="text-indigo-400" /> Analyse IA
                      </CardTitle>
                      <Badge className="border-none bg-indigo-600 text-[10px] font-black text-white">
                        NIVEAU {selectedAttempt.answers?.feedback?.level || "B2"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full p-8">
                      <div className="space-y-8 pb-8">
                        <div className="relative rounded-[2rem] border border-zinc-100 bg-zinc-50 p-6 text-sm font-medium italic leading-relaxed text-zinc-600">
                          <Quote className="absolute -top-3 left-6 text-zinc-200" size={24} fill="currentColor" />
                          “{selectedAttempt.answers?.feedback?.comment}”
                        </div>

                        <div className="space-y-4">
                          <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                            <Target size={14} className="text-indigo-600" /> Corrections détaillées
                          </h3>
                          <div className="space-y-3">
                            {selectedAttempt.answers?.feedback?.annotations?.map((ann: any, idx: number) => (
                              <div key={idx} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                                <div className="flex items-start gap-3">
                                  <div className={`mt-1 shrink-0 ${ann.type === "error" ? "text-rose-500" : "text-amber-500"}`}>
                                    {ann.type === "error" ? <AlertCircle size={18} /> : <Info size={18} />}
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-sm">
                                      <span className="mr-2 text-zinc-400 line-through">{ann.original_fragment}</span>
                                      <span className="font-black text-emerald-600">{ann.correction}</span>
                                    </p>
                                    <p className="text-xs font-medium leading-relaxed text-zinc-500">{ann.explanation}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4">
                          <Badge className="mb-3 rounded-full bg-zinc-900 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                            Version améliorée
                          </Badge>
                          <div className="rounded-2xl border border-white/5 bg-slate-900 p-6 text-sm font-medium leading-relaxed text-slate-300">
                            {selectedAttempt.answers?.feedback?.improved}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
