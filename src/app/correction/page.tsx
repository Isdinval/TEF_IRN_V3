"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
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

  if (loading) return <div className="p-8 flex justify-center h-screen items-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8 selection:bg-indigo-100 h-full flex flex-col">
      <AnimatePresence mode="wait">
        {!selectedAttempt ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-900">Historique des Corrections</h1>
                <p className="text-muted-foreground font-medium">Retrouvez toutes vos analyses d'expression écrite et orale.</p>
              </div>
              <Link href="/writing">
                <Button className="bg-indigo-600 font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                  Nouvelle Rédaction <Sparkles className="ml-2" size={16} />
                </Button>
              </Link>
            </header>

            {attempts.length === 0 ? (
              <Card className="p-12 text-center rounded-[2.5rem] border-dashed border-slate-200 bg-white">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="text-slate-300" size={32} />
                </div>
                <h3 className="font-bold text-zinc-900">Aucune correction pour le moment</h3>
                <p className="text-sm text-slate-500 mt-2">Commencez un exercice d'expression pour voir vos progrès ici.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {attempts.map((attempt, i) => (
                  <motion.div
                    key={attempt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedAttempt(attempt)}
                  >
                    <Card className="hover:border-indigo-200 transition-all cursor-pointer group rounded-2xl overflow-hidden border-slate-100 shadow-sm bg-white">
                      <div className="flex items-center p-6 gap-6">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <FileText size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-zinc-900 line-clamp-1">
                              {attempt.answers?.subject || "Expression Écrite"}
                            </h3>
                            <Badge variant="outline" className="text-[10px] font-black tracking-widest uppercase py-0.5 border-slate-200 shrink-0">B2</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(attempt.created_at).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><History size={12} /> Score : {attempt.score || 0}/100</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-indigo-50 hover:text-indigo-600 shrink-0">
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
            className="space-y-6 flex-1 min-h-0 flex flex-col"
          >
            <div className="flex items-center gap-4 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setSelectedAttempt(null)} className="rounded-xl">
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Détails de la Correction</h2>
                <p className="text-xs text-slate-500 font-medium">{new Date(selectedAttempt.created_at).toLocaleDateString()} • {selectedAttempt.score}/100</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-0">
               {/* Original Text */}
               <Card className="rounded-[2rem] border-slate-100 shadow-sm flex flex-col overflow-hidden">
                 <CardHeader className="bg-slate-50/50 py-3 px-6 border-b border-slate-100 shrink-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Votre Rédaction</p>
                 </CardHeader>
                 <CardContent className="p-8 overflow-auto flex-1">
                    <div className="text-lg leading-relaxed font-medium text-zinc-800 whitespace-pre-wrap italic">
                      "{selectedAttempt.answers?.text}"
                    </div>
                 </CardContent>
               </Card>

               {/* Feedback Detail */}
               <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden">
                 <CardHeader className="bg-zinc-900 text-white p-6 shrink-0">
                    <div className="flex justify-between items-center">
                       <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <Sparkles size={20} className="text-indigo-400" /> Analyse IA
                       </CardTitle>
                       <Badge className="bg-indigo-600 text-white font-black text-[10px] border-none">NIVEAU {selectedAttempt.answers?.feedback?.level || "B2"}</Badge>
                    </div>
                 </CardHeader>
                 <CardContent className="p-0 flex-1 overflow-hidden">
                    <ScrollArea className="h-full p-8">
                       <div className="space-y-8 pb-8">
                          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-sm font-medium text-slate-600 leading-relaxed relative">
                            <Quote className="absolute -top-3 left-4 text-slate-200" size={24} fill="currentColor" />
                            "{selectedAttempt.answers?.feedback?.comment}"
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Target size={14} /> Corrections détaillées</h3>
                            <div className="space-y-3">
                              {selectedAttempt.answers?.feedback?.annotations?.map((ann: any, idx: number) => (
                                <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                                   <div className="flex items-start gap-3">
                                      <div className={`mt-1 shrink-0 ${ann.type === "error" ? "text-red-500" : "text-amber-500"}`}>
                                        {ann.type === "error" ? <AlertCircle size={16} /> : <Info size={16} />}
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-sm">
                                          <span className="line-through text-slate-400 mr-2">{ann.original_fragment}</span>
                                          <span className="font-bold text-green-600">{ann.correction}</span>
                                        </p>
                                        <p className="text-xs text-slate-500 font-medium">{ann.explanation}</p>
                                      </div>
                                   </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4">
                            <Badge className="bg-zinc-900 text-white font-black text-[9px] uppercase tracking-widest mb-3">Version Améliorée</Badge>
                            <div className="p-6 bg-slate-900 rounded-2xl text-slate-300 text-sm font-medium leading-relaxed border border-white/5">
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
  );
}
