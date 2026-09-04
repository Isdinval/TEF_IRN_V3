"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Target,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import LessonMarkdown from "@/components/shared/LessonMarkdown";
import { useCoachContext } from "@/contexts/CoachContext";

import { splitTitle, parseObjective } from "@/lib/lessons";
// ─── helpers ────────────────────────────────────────────────────────────────



// ─── components ─────────────────────────────────────────────────────────────

const ObjectiveContent = ({ children }: { children: any }) => {
  const content = children?.toString() || "";
  const { description, skills } = parseObjective(content);

  if (skills.length > 0) {
    return (
      <div className="space-y-4">
        <p className="text-slate-700 font-medium">{description}</p>
        <div className="space-y-2">
          <p className="text-xs font-black uppercase text-indigo-400 tracking-widest">À la fin, vous serez capable de :</p>
          {skills.map((skill: string, index: number) => (
            <div key={index} className="flex items-start gap-3 text-slate-700 font-medium">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              <span>{skill}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <p className="text-slate-700 font-bold text-lg">{description}</p>;
};

export default function LessonInteractive({ lesson, initialUser }: { lesson: any, initialUser: any }) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<"reading" | "gate">("reading");
  const [loading, setLoading] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const { setPageContext } = useCoachContext();

  useEffect(() => {
    setPageContext({
      type: "lesson",
      title: lesson.title,
      level: lesson.level,
      category: lesson.category,
      difficulty: lesson.difficulty,
      objective: lesson.objective,
    });
    return () => setPageContext(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  useEffect(() => {
    if (step !== "reading") return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const total = scrollHeight - clientHeight;
      const progress = total > 0 ? Math.min(100, (scrollTop / total) * 100) : 0;
      setReadingProgress(progress);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [step]);

  const handleFinishLesson = async () => {
    if (!initialUser) {
      setStep("gate"); // Soft-gate : incite à se connecter pour valider la leçon et gagner l'XP
      return;
    }

    setLoading(true);
    await completeLesson();
    router.push(`/tef-irn/lessons/${lesson.slug}/complete`);
  };

  const completeLesson = async () => {
    await supabase.from('lesson_progress').upsert({ user_id: initialUser.id, lesson_id: lesson.id });
    await supabase.rpc('increment_xp', { amount: 100 });
  };

  const { main: mainTitle, subtitle } = splitTitle(lesson.title || "");

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      {step === "reading" && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-zinc-100">
          <motion.div className="h-full bg-indigo-500" style={{ width: `${readingProgress}%` }} transition={{ ease: "linear", duration: 0.1 }} />
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 pt-12">
        <AnimatePresence mode="wait">
          {step === "reading" && (
            <motion.div key="reading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <article className="space-y-10">
                <header className="space-y-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Link href="/tef-irn/lessons">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white shadow-sm border border-transparent hover:border-zinc-100 transition-all">
                          <ArrowLeft size={20} />
                        </Button>
                      </Link>
                      <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50 border-none font-black uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 rounded-full shadow-sm">
                        {lesson.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight">{mainTitle}</h1>
                    {subtitle && <p className="text-sm font-medium text-indigo-500 leading-tight">{subtitle}</p>}
                  </div>

                  {lesson.objective && (
                    <div className="p-6 bg-white border border-zinc-100 rounded-[2rem] flex gap-5 items-start shadow-sm">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 mt-1"><Target size={24} /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Objectif de la leçon</p>
                        <ObjectiveContent>{lesson.objective}</ObjectiveContent>
                      </div>
                    </div>
                  )}
                </header>

                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-white">
                  <LessonMarkdown content={lesson.content} />
                </div>

                <div className="pt-6">
                  <Button
                    size="lg"
                    className="w-full h-14 text-base font-black rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={handleFinishLesson}
                  >
                    Terminer la leçon
                  </Button>
                </div>
              </article>
            </motion.div>
          )}

          {step === "gate" && (
            <motion.div key="gate" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}>
              <div className="text-center py-20 space-y-8 bg-white rounded-[3rem] shadow-xl border border-zinc-100 p-12">
                 <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                    <GraduationCap size={48} />
                 </div>
                 <div className="space-y-4">
                    <h2 className="text-xl font-black text-slate-900">Valide ta progression !</h2>
                    <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
                      Connecte-toi gratuitement pour valider cette leçon et gagner de l'XP.
                    </p>
                 </div>
                 <div className="flex flex-col gap-4 max-w-xs mx-auto pt-6">
                    <Link href={`/tef-irn/login?redirect=/tef-irn/lessons/${lesson.slug}`}>
                      <Button size="lg" className="w-full h-16 text-lg font-black rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100">
                        Se connecter
                      </Button>
                    </Link>
                    <Button variant="ghost" onClick={() => setStep("reading")} className="font-bold text-slate-400">
                      Retour à la leçon
                    </Button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
