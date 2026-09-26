"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
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
        <p className="text-zinc-700 font-medium">{description}</p>
        <div className="space-y-2">
          <p className="text-xs font-black uppercase text-zinc-500 tracking-widest">À la fin, vous serez capable de :</p>
          {skills.map((skill: string, index: number) => (
            <div key={index} className="flex items-start gap-3 text-zinc-700 font-medium">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
              <span>{skill}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <p className="text-zinc-700 font-bold text-lg">{description}</p>;
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
          <motion.div className="h-full bg-indigo-600" style={{ width: `${readingProgress}%` }} transition={{ ease: "linear", duration: 0.1 }} />
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      )}

      <div className="mx-auto max-w-5xl p-4 md:p-10 lg:p-12">
        <AnimatePresence mode="wait">
          {step === "reading" && (
            <motion.div key="reading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <article className="space-y-10">
                <header className="space-y-8">
                  <Link
                    href="/tef-irn/lessons"
                    aria-label="Retour au catalogue des leçons"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                  >
                    <ArrowLeft size={20} aria-hidden />
                  </Link>

                  <PageHeader badge={lesson.category} title={mainTitle} description={subtitle || undefined} />

                  {lesson.objective && (
                    <div className="p-6 bg-white border border-zinc-100 rounded-3xl flex gap-5 items-start shadow-sm">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 mt-1"><Target size={24} /></div>
                      <div>
                        <p className="text-xs font-black uppercase text-zinc-500 tracking-widest mb-1">Objectif de la leçon</p>
                        <ObjectiveContent>{lesson.objective}</ObjectiveContent>
                      </div>
                    </div>
                  )}
                </header>

                <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-zinc-100">
                  <LessonMarkdown content={lesson.content} />
                </div>

                <div className="pt-6">
                  <Button
                    size="lg"
                    className="w-full h-14 text-sm font-black uppercase tracking-widest rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
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
              <div className="text-center py-20 space-y-8 bg-white rounded-3xl shadow-sm border border-zinc-100 p-6 md:p-12">
                 <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <GraduationCap size={48} />
                 </div>
                 <div className="space-y-4">
                    <h2 className="text-lg font-black uppercase tracking-tight text-zinc-900">Valide ta progression !</h2>
                    <p className="text-sm text-zinc-500 font-medium max-w-md mx-auto">
                      Connecte-toi gratuitement pour valider cette leçon et gagner de l'XP.
                    </p>
                 </div>
                 <div className="flex flex-col gap-4 max-w-xs mx-auto pt-6">
                    <Link href={`/tef-irn/login?redirect=/tef-irn/lessons/${lesson.slug}`}>
                      <Button size="lg" className="w-full h-12 text-sm font-black uppercase tracking-widest rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                        Se connecter
                      </Button>
                    </Link>
                    <Button variant="ghost" onClick={() => setStep("reading")} className="h-11 font-bold text-zinc-500">
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
