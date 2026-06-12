"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParcours } from "@/contexts/ParcoursContext";
import { BreadcrumbParcours } from "@/components/shared/BreadcrumbParcours";
import { CheckCircle2, XCircle, ArrowRight, Loader2, Target, Sparkles, Zap, GraduationCap, LayoutGrid, Calendar, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GrammarQuestion {
  id: string;
  sentence: string;
  error_fragment: string;
  correction: string;
  explanation: string;
  category: string;
  level: string;
}

function GrammarCheckContent() {
  const searchParams = useSearchParams();
  const [isStarted, setIsStarted] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("A2");
  const [selectedCategory, setSelectedCategory] = useState("Grammaire");

  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<"typing" | "correct" | "wrong">("typing");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const { activeParcours } = useParcours();

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const lessonId = searchParams.get('lessonId');
    const topic = searchParams.get('topic');
    const level = searchParams.get('level');

    if (lessonId && topic) {
      if (topic) setSelectedCategory(topic);
      if (level) setSelectedLevel(level);
      startExercise(level || undefined, topic || undefined);
    } else if (activeParcours && !isStarted) {
      setSelectedLevel(activeParcours.level);
      setSelectedCategory(activeParcours.category);
    }
  }, [searchParams, activeParcours]);

  const startExercise = async (lvl?: string, cat?: string) => {
    setLoading(true);
    const targetLevel = lvl || selectedLevel;
    const targetCategory = cat || selectedCategory;
    const normalizedCategory = targetCategory ? (targetCategory.charAt(0).toUpperCase() + targetCategory.slice(1).toLowerCase()) : targetCategory;
    try {
      let query = supabase
        .from("exercises")
        .select("*")
        .eq("type", "trous")
        .eq("level", targetLevel);

      if (targetCategory && targetCategory !== "Toutes") {
        // Essayer d'abord par le champ category exact
        const { data: catMatch } = await supabase
          .from("exercises")
          .select("*")
          .eq("type", "trous")
          .eq("level", targetLevel)
          .eq("category", normalizedCategory)
          .limit(5);

        if (catMatch && catMatch.length > 0) {
          const formatted = catMatch.map((d: any) => ({
            id: d.id,
            sentence: d.content.sentence || d.instructions,
            error_fragment: d.content.error_fragment || "...",
            correction: d.content.correct_answer || d.content.correct_answers?.[0],
            explanation: d.content.explanation || "Règle de grammaire standard.",
            category: d.category || targetCategory,
            level: d.level || targetLevel
          }));
          setQuestions(formatted);
          setIsStarted(true);
          setLoading(false);
          return;
        }
      }

      // Fallback
      const { data } = await query.limit(5);
      if (data) {
        const formatted = data.map((d: any) => ({
          id: d.id,
          sentence: d.content.sentence || d.instructions,
          error_fragment: d.content.error_fragment || "...",
          correction: d.content.correct_answer || d.content.correct_answers?.[0],
          explanation: d.content.explanation || "Règle de grammaire standard.",
          category: d.category || targetCategory,
          level: d.level || targetLevel
        }));
        setQuestions(formatted);
        setIsStarted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    const current = questions[currentIdx];
    const isCorrect = inputValue.trim().toLowerCase() === current.correction.toLowerCase();

    if (isCorrect) {
      setScore(s => s + 1);
      setStatus("correct");
    } else {
      setStatus("wrong");
    }
  };

  const nextQuestion = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setInputValue("");
      setStatus("typing");
    } else {
      setFinished(true);
      // Update XP and practice status
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Update last_practice_at in user_parcours_progress if in parcours mode
        if (activeParcours) {
          await supabase.from('user_parcours_progress')
            .update({ last_practice_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('parcours_id', activeParcours.id);
        }
      }
    }
  };

  if (!isStarted) {
    return (
      <div className="max-w-6xl mx-auto p-8 pt-16 min-h-screen">
        <BreadcrumbParcours />
        <header className="mb-16 space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-rose-600 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none">
              Grammar Checker
            </Badge>
             {activeParcours && (
               <Badge variant="outline" className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-rose-200 text-rose-600 bg-rose-50 flex items-center gap-2">
                 <Sparkles size={12} /> Contextualisé : {activeParcours.category} {activeParcours.level}
               </Badge>
             )}
          </div>
          <h1 className="text-6xl font-black text-zinc-900 tracking-tighter leading-none">
            Zéro faute, <br />Maximum Impact
          </h1>
          <p className="text-xl text-zinc-400 font-medium max-w-2xl leading-relaxed">
            Corrigez des phrases réelles pour maîtriser les subtilités de la langue française.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <Card className="lg:col-span-2 border-none shadow-2xl shadow-zinc-100 rounded-[3rem] p-10 bg-white">
            <div className="space-y-10">
              <section className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Choisir votre niveau</label>
                <div className="flex flex-wrap gap-2">
                  {["A1", "A2", "B1", "B2"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedLevel(lvl)}
                      className={`
                        h-16 flex-1 rounded-2xl font-black text-lg transition-all
                        ${selectedLevel === lvl ? "bg-zinc-900 text-white shadow-xl" : "bg-zinc-50 hover:bg-zinc-100 text-zinc-400"}
                      `}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Thématique</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["Grammaire", "Conjugaison", "Syntaxe", "Toutes"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`
                        p-6 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between
                        ${selectedCategory === cat ? "border-rose-600 bg-rose-50 text-rose-900" : "border-zinc-100 hover:border-zinc-300 text-zinc-500"}
                      `}
                    >
                      {cat}
                      {selectedCategory === cat && <div className="w-2 h-2 bg-rose-600 rounded-full" />}
                    </button>
                  ))}
                </div>
              </section>

              <Button
                onClick={() => startExercise()}
                disabled={loading}
                className="w-full h-20 bg-zinc-900 hover:bg-zinc-800 text-white rounded-[2rem] text-2xl font-black shadow-2xl shadow-zinc-300 transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin" /> : "COMMENCER L'ENTRAÎNEMENT"}
              </Button>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-2xl shadow-rose-100 rounded-[2.5rem] p-8 bg-gradient-to-br from-rose-600 to-orange-600 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                  <Zap size={28} />
                </div>
                <h3 className="text-2xl font-black mb-2 tracking-tight">Erreurs fréquentes</h3>
                <p className="text-rose-50 text-sm font-medium mb-8 leading-relaxed">
                  Travaillez les accords, la conjugaison et la syntaxe avec un feedback immédiat à chaque phrase.
                </p>
                <Button
                  onClick={() => startExercise()}
                  disabled={loading}
                  className="w-full h-14 bg-white text-rose-600 hover:bg-rose-50 font-black rounded-xl shadow-xl border-none"
                >
                  Lancer une correction
                </Button>
              </div>
              <Sparkles className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
            </Card>

            <Card className="border-none shadow-xl shadow-zinc-100 rounded-[2.5rem] p-8 bg-zinc-50">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="text-zinc-400" size={20} />
                <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Guide rapide</h4>
              </div>
              <div className="space-y-4">
                <p className="text-xs text-zinc-500 font-medium leading-relaxed italic">
                  Une session contient 5 phrases. Repérez l'erreur, tapez la forme correcte puis lisez la règle associée.
                </p>
                <div className="h-px bg-zinc-200 w-full" />
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase">
                  <Target size={14} className="text-rose-600" /> Objectif : 80% de réussite
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-rose-600" size={48} />
      </div>
    );
  }

  // ====================== EXERCICE + FIN ======================
  if (finished) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md text-center p-10 rounded-3xl shadow-2xl">
          <CheckCircle2 className="w-20 h-20 text-emerald-600 mx-auto mb-6" />
          <h2 className="text-3xl font-black mb-2">Session terminée !</h2>
          <p className="text-zinc-600 mb-8">Score final</p>
          <div className="text-7xl font-black text-rose-600 mb-8">
            {Math.round((score / questions.length) * 100)}%
          </div>
          <Button onClick={() => setFinished(false) || setIsStarted(false)} className="w-full h-14 rounded-2xl text-lg bg-zinc-900 hover:bg-zinc-800 text-white font-black">
            Terminer
          </Button>
        </Card>
      </div>
    );
  }

  const current = questions[currentIdx];

  return (
    <div className="max-w-2xl mx-auto p-8 pt-16">
      <div className="mb-8 flex justify-between items-center px-2">
        <div className="space-y-1">
          <Badge variant="outline" className="text-rose-600 border-rose-100 bg-rose-50 font-black text-[10px] uppercase tracking-widest">
            {selectedLevel} • {selectedCategory}
          </Badge>
          <h2 className="text-2xl font-black text-zinc-900">{current.category}</h2>
          <p className="text-[11px] font-medium text-zinc-400 italic">Identifiez l'erreur entre crochets et tapez la forme correcte.</p>
        </div>
        <div className="text-xs font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 px-3 py-1.5 rounded-full">
          Question {currentIdx + 1} / {questions.length}
        </div>
      </div>

      <div className="mb-12">
        <div className="p-10 bg-white border border-zinc-100 shadow-xl shadow-zinc-100/50 rounded-[2.5rem] text-3xl text-center font-bold text-zinc-900 leading-tight">
          {current.sentence.split('[').map((part, i) => {
             if (part.includes(']')) {
               const [fragment, rest] = part.split(']');
               return (
                 <span key={i}>
                   <span className={`px-3 py-1 rounded-xl border-2 transition-all ${status === 'correct' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : status === 'wrong' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                     {status === 'typing' ? fragment : current.correction}
                   </span>
                   {rest}
                 </span>
               );
             }
             return part;
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === "typing" ? (
          <motion.div key="typing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <input
              type="text"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && inputValue.trim() && handleVerify()}
              placeholder="Saisissez la correction..."
              className="w-full h-20 text-3xl font-black text-center border-b-4 border-rose-600 focus:outline-none bg-transparent placeholder:text-zinc-100 text-zinc-900"
            />
            <Button
              className="w-full h-16 text-xl font-black bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl shadow-xl shadow-zinc-200 transition-all active:scale-[0.98]"
              onClick={handleVerify}
              disabled={!inputValue.trim()}
            >
              VÉRIFIER MA RÉPONSE
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-8 rounded-[2.5rem] border-2 shadow-lg ${status === 'correct' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}
          >
            <div className="flex items-start gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${status === 'correct' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {status === 'correct' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
              </div>
              <div className="space-y-6 flex-1">
                <div className="space-y-1">
                  <h3 className={`text-xl font-black uppercase tracking-tight ${status === 'correct' ? 'text-emerald-900' : 'text-rose-900'}`}>
                    {status === 'correct' ? "Excellent !" : "Presque..."}
                  </h3>
                  <p className="text-zinc-600 font-medium italic">
                    {status === 'correct'
                      ? `Effectivement, la réponse est bien "${current.correction}".`
                      : `La réponse correcte était "${current.correction}".`
                    }
                  </p>
                </div>

                <div className="p-6 bg-white/60 rounded-3xl border border-white/80 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center gap-2 mb-3 font-black text-[10px] uppercase tracking-widest text-zinc-400">
                    <Target size={14} className="text-rose-500" /> La règle pédagogique
                  </div>
                  <p className="text-zinc-700 leading-relaxed font-bold text-sm italic">
                    {current.explanation}
                  </p>
                </div>

                <Button
                  className={`w-full h-16 text-lg font-black rounded-2xl shadow-lg transition-all active:scale-[0.98] ${status === 'correct' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'}`}
                  onClick={nextQuestion}
                >
                  CONTINUER <ArrowRight className="ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


export default function GrammarCheckPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-rose-600" size={48} /></div>}>
      <GrammarCheckContent />
    </Suspense>
  );
}
