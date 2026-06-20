"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Target, Sparkles, ArrowRight, Lightbulb,
  BookOpen, GraduationCap, CheckCircle2, MessageSquare, Bot, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Strip leading emoji + space from section titles */
function stripEmoji(text: string) {
  return text.replace(/^[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, "").trim();
}

/**
 * Detect a mnemo string: a `strong` whose text is ALL-CAPS words
 */
function isMnemo(text: string) {
  return /^[A-Z][A-Z\s·\-]+[A-Z]$/.test(text.trim()) && text.trim().length > 4;
}

function parseMnemoLetters(text: string): string[] {
  return text.trim().split(/[\s·]+/).filter(Boolean);
}

/**
 * Split title into main title and subtitle
 * Supports: "Main Title | Subtitle" or "Main Title — Subtitle" or "Main Title : Subtitle"
 */
function splitTitle(title: string): { main: string; subtitle: string | null } {
  const separators = [' | ', ' — ', ' : ', ' - '];
  for (const sep of separators) {
    if (title.includes(sep)) {
      const parts = title.split(sep);
      return { main: parts[0].trim(), subtitle: parts.slice(1).join(sep).trim() };
    }
  }
  return { main: title, subtitle: null };
}

// ─── objective component ────────────────────────────────────────────────────

const ObjectiveContent = ({ children }: { children: any }) => {
  const content = children?.toString() || "";
  
  // Détecter si l'objectif contient des puces (• ou -)
  if (content.includes("•") || content.includes("- ")) {
    const lines = content.split("\n").filter(Boolean);
    return (
      <div className="space-y-2">
        {lines.map((line: string, index: number) => {
          const cleanLine = line.replace(/^[•\-]\s*/, "");
          // Si la ligne commence par une puce
          if (line.match(/^[•\-]\s*/)) {
            return (
              <div key={index} className="flex items-start gap-3 text-slate-700 font-medium">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span>{cleanLine}</span>
              </div>
            );
          }
          // Sinon, c'est une ligne de texte normale (comme la phrase d'intro)
          return <p key={index} className="text-slate-700 font-medium">{cleanLine}</p>;
        })}
      </div>
    );
  }
  
  // Si pas de puces, afficher comme un paragraphe simple
  return <p className="text-slate-700 font-bold text-lg">{children}</p>;
};

// ─── component ──────────────────────────────────────────────────────────────

export default function LessonDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lesson, setLesson] = useState<any>(null);
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"reading" | "quiz" | "result">("reading");
  const [readingProgress, setReadingProgress] = useState(0);

  // Quiz state
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: lessonData } = await supabase.from('lessons').select('*').eq('id', id).single();
      if (lessonData) setLesson(lessonData);
      const { data: exoData } = await supabase.from('exercises').select('*').eq('lesson_id', id).eq('type', 'qcm').limit(1).maybeSingle();
      if (exoData) setExercise(exoData);
      setLoading(false);
    }
    fetchData();
  }, [id, supabase]);

  // Reading progress
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

  const handleNextQuestion = async () => {
    if (currentQ < (exercise?.content?.questions?.length || 0) - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setIsChecked(false);
    } else {
      setLoading(true);
      await saveResults();
      router.push(`/lessons/${id}/complete`);
    }
  };

  const handleFinishLesson = async () => {
    if (exercise) {
      setStep("quiz");
    } else {
      setLoading(true);
      await awardXpOnly();
      router.push(`/lessons/${id}/complete`);
    }
  };

  const awardXpOnly = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('lesson_progress').upsert({ user_id: user.id, lesson_id: id });
      await supabase.rpc('increment_xp', { amount: 100 });
    }
  };

  const saveResults = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && exercise) {
      const totalQuestions = exercise.content.questions.length;
      const finalScore = (score / totalQuestions) * 100;
      await supabase.from('exercise_attempts').insert({
        user_id: user.id,
        exercise_id: exercise.id,
        score: finalScore,
        is_completed: true,
      });
      if (finalScore >= 50) {
        await supabase.from('lesson_progress').upsert({ user_id: user.id, lesson_id: id });
        await supabase.rpc('increment_xp', { amount: 100 });
      }
    }
  };

  if (loading && step === "reading") return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );
  if (!lesson) return <div className="p-8 text-center text-slate-500 font-bold">Leçon non trouvée.</div>;

  // ── split title ──
  const { main: mainTitle, subtitle } = splitTitle(lesson.title || "");

  // ── markdown state ──
  let dialogueLineIndex = 0;

  const markdownComponents = {
    h1: ({ children }: any) => <h1 className="hidden">{children}</h1>,

    h2: ({ children }: any) => {
      const raw = children?.toString() || "";
      const title = stripEmoji(raw);
      const isTheorie = title.includes("Théorie");
      const isExemple = title.includes("Exemple");
      dialogueLineIndex = 0;
      return (
        <div className="flex items-center gap-3 mt-10 mb-5 first:mt-0">
          <div className={`w-9 h-9 flex items-center justify-center rounded-xl shrink-0
            ${isTheorie ? 'bg-indigo-100 text-indigo-600' : isExemple ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            {isTheorie ? <BookOpen size={18} /> : isExemple ? <GraduationCap size={18} /> : <Sparkles size={18} />}
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{title}</h2>
        </div>
      );
    },

    h3: ({ children }: any) => (
      <h3 className="text-lg font-bold text-slate-700 mt-8 mb-4 border-l-4 border-indigo-200 pl-4">{children}</h3>
    ),

    p: ({ children, node }: any) => {
      const isBoldLabel = node?.children?.length === 1 && node.children[0]?.tagName === "strong";
      if (isBoldLabel) {
        dialogueLineIndex = 0;
        return (
          <div className="flex items-center gap-2 mt-8 mb-3">
            <MessageSquare size={15} className="text-emerald-500 shrink-0" />
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">{children}</p>
          </div>
        );
      }
      return <p className="text-slate-600 leading-relaxed mb-4 font-medium">{children}</p>;
    },

    ul: ({ children }: any) => <ul className="space-y-2 my-6">{children}</ul>,

    ol: ({ children }: any) => (
      <ol className="space-y-3 my-6 list-none p-0">{children}</ol>
    ),

    li: ({ children, node, ordered }: any) => {
      const rawText = node?.children?.map((c: any) => c.value || c.children?.map((cc: any) => cc.value || "").join("") || "").join("") || "";
      
      if (rawText.startsWith("⚠️") || rawText.startsWith("⚠")) {
        return (
          <li className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 text-[11px] font-black uppercase tracking-wide">
              <AlertTriangle size={11} /> Attention
            </span>
            <span className="text-slate-600 font-medium">{children}</span>
          </li>
        );
      }
      
      if (rawText.startsWith("✅")) {
        return (
          <li className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[11px] font-black uppercase tracking-wide">
              <CheckCircle2 size={11} /> Règle
            </span>
            <span className="text-slate-600 font-medium">{children}</span>
          </li>
        );
      }

      if (ordered) {
        return (
          <li className="p-4 rounded-2xl border bg-slate-50 border-slate-200 text-slate-700 font-medium">
            {children}
          </li>
        );
      }

      return (
        <li className="flex items-start gap-3 text-slate-600 font-medium">
          <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
          <span>{children}</span>
        </li>
      );
    },

    em: ({ children }: any) => {
      const text = children?.toString() || "";
      if (text.startsWith("— ")) {
        const idx = dialogueLineIndex++;
        const isMe = idx % 2 === 0;
        return (
          <div className={`flex my-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-base font-semibold not-italic leading-snug ${
              isMe
                ? 'bg-indigo-600 text-white rounded-tr-sm'
                : 'bg-slate-100 text-slate-700 rounded-tl-sm'
            }`}>
              {text.replace(/^— /, '')}
            </div>
          </div>
        );
      }
      return <em className="italic text-slate-600">{children}</em>;
    },

    strong: ({ children }: any) => {
      const text = children?.toString() || "";
      if (isMnemo(text)) {
        const letters = parseMnemoLetters(text);
        return (
          <span className="inline-flex flex-wrap gap-1.5 my-2">
            {letters.map((word, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black tracking-wide">
                {word}
              </span>
            ))}
          </span>
        );
      }
      return <strong className="font-black text-indigo-900">{children}</strong>;
    },

    table: ({ children }: any) => (
      <div className="my-6 rounded-2xl overflow-hidden border border-zinc-100 shadow-sm">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-indigo-50 text-indigo-700">{children}</thead>,
    tbody: ({ children }: any) => <tbody className="divide-y divide-zinc-50 bg-white">{children}</tbody>,
    tr: ({ children }: any) => <tr className="hover:bg-zinc-50/60 transition-colors">{children}</tr>,
    th: ({ children }: any) => (
      <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-widest">{children}</th>
    ),
    td: ({ children, node }: any) => {
      const isFirst = (node?.parent?.children?.indexOf(node) === 0);
      return (
        <td className={`px-5 py-3 ${isFirst ? 'font-bold text-slate-800' : 'text-slate-500 font-medium'}`}>
          {children}
        </td>
      );
    },

    blockquote: ({ children }: any) => (
      <div className="my-10 p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-100 rounded-[2rem] relative overflow-hidden shadow-sm">
        <Lightbulb className="absolute -right-4 -top-4 text-amber-200/30 w-32 h-32 rotate-12" />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase text-amber-600 tracking-[0.2em] mb-3 flex items-center gap-2">
            <Lightbulb size={14} fill="currentColor" /> L'Astuce du Coach
          </p>
          <div className="text-amber-900 font-bold text-base leading-relaxed space-y-1">
            {children}
          </div>
        </div>
      </div>
    ),
  };

  const cleanContent = lesson.content
    ? lesson.content.replace(/\\n/g, '\n').replace(/\r/g, '')
    : "";

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      {step === "reading" && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-zinc-100">
          <motion.div
            className="h-full bg-indigo-500"
            style={{ width: `${readingProgress}%` }}
            transition={{ ease: "linear", duration: 0.1 }}
          />
        </div>
      )}

      {loading && step !== "reading" && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Enregistrement de vos progrès...
            </p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 pt-8">
        <Link
          href="/lessons"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition-colors mb-10 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Retour au catalogue
        </Link>

        <AnimatePresence mode="wait">
          {step === "reading" && (
            <motion.div
              key="reading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <article className="space-y-10">
                <header className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-100 text-indigo-600 border-0">
                        {lesson.level}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-zinc-100 text-zinc-500 border-0">
                        {lesson.category}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const coachBtn = document.querySelector(".fixed.bottom-6.right-6") as HTMLButtonElement;
                        if (coachBtn) coachBtn.click();
                      }}
                      className="rounded-xl border-indigo-100 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 font-bold flex gap-2 h-9"
                    >
                      <Bot size={16} />
                      Question au Coach ?
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
                      {mainTitle}
                    </h1>
                    {subtitle && (
                      <p className="text-lg font-medium text-indigo-500 leading-tight">
                        {subtitle}
                      </p>
                    )}
                  </div>

                  {lesson.objective && (
                    <div className="p-6 bg-white border border-zinc-100 rounded-[2rem] flex gap-5 items-start shadow-sm">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 mt-1">
                        <Target size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">
                          Objectif de la leçon
                        </p>
                        <ObjectiveContent>{lesson.objective}</ObjectiveContent>
                      </div>
                    </div>
                  )}
                </header>

                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-white">
                  <div className="prose-none max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {cleanContent}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    size="lg"
                    className="w-full h-20 text-xl font-black rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={handleFinishLesson}
                  >
                    {exercise ? (
                      <span className="flex items-center gap-3">Valider & Passer au Quiz <ArrowRight /></span>
                    ) : (
                      "Terminer la leçon"
                    )}
                  </Button>
                </div>
              </article>
            </motion.div>
          )}

          {step === "quiz" && exercise && (
            <motion.div key="quiz" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}>
              <div className="space-y-8">
                <div className="flex justify-between items-center bg-white px-8 py-6 rounded-[2rem] border border-zinc-100 shadow-sm">
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Entraînement</p>
                    <h2 className="text-xl font-black text-slate-800">{mainTitle}</h2>
                  </div>
                  <div className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-black">
                    {currentQ + 1} / {exercise.content.questions.length}
                  </div>
                </div>

                <Card className="border-none shadow-2xl shadow-zinc-200/50 bg-white rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-12 text-center space-y-10">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                      <GraduationCap size={32} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 leading-tight">
                      {exercise.content.questions[currentQ]}
                    </h3>

                    <div className="grid grid-cols-1 gap-4 text-left max-w-2xl mx-auto">
                      {exercise.content.options[currentQ].map((opt: string, i: number) => (
                        <button
                          key={i}
                          disabled={isChecked}
                          onClick={() => setSelected(i)}
                          className={`
                            w-full p-6 rounded-2xl border-2 transition-all font-bold text-lg flex items-center justify-between group
                            ${selected === i ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-zinc-100 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600'}
                            ${isChecked && i === exercise.content.correct_answers[currentQ] ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : ''}
                            ${isChecked && selected === i && i !== exercise.content.correct_answers[currentQ] ? 'border-rose-500 bg-rose-50 text-rose-900' : ''}
                          `}
                        >
                          <span>{opt}</span>
                          {isChecked && i === exercise.content.correct_answers[currentQ] && <CheckCircle2 className="text-emerald-500" />}
                          {isChecked && selected === i && i !== exercise.content.correct_answers[currentQ] && <XCircleIcon className="text-rose-500" />}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  {!isChecked ? (
                    <Button
                      disabled={selected === null}
                      onClick={() => {
                        setIsChecked(true);
                        if (selected === exercise.content.correct_answers[currentQ]) setScore(score + 1);
                      }}
                      className="px-12 h-16 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100"
                    >
                      Vérifier ma réponse
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextQuestion}
                      className="px-12 h-16 bg-zinc-900 hover:bg-black rounded-2xl font-black text-lg shadow-xl shadow-zinc-200"
                    >
                      {currentQ < exercise.content.questions.length - 1 ? "Question Suivante" : "Terminer la session"}
                      <ArrowRight className="ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === "result" && (
            <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-12 py-12">
              <div className="relative inline-block">
                <div className={`w-48 h-48 rounded-[3rem] flex items-center justify-center mx-auto relative z-10
                  ${(!exercise || score >= (exercise?.content?.questions?.length || 0) / 2) ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'} rotate-12`}>
                  <Sparkles size={80} />
                </div>
                <div className="absolute inset-0 bg-indigo-200 blur-3xl opacity-20 -z-10" />
              </div>

              <div className="space-y-4">
                <h2 className="text-5xl font-black text-slate-900">Bien joué !</h2>
                <p className="text-2xl text-slate-500 font-medium italic">Vous avez complété la leçon avec succès.</p>
              </div>

              <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
                <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Score</p>
                  <p className="text-4xl font-black text-indigo-600">
                    {(exercise && exercise.content.questions.length > 0)
                      ? Math.round((score / exercise.content.questions.length) * 100)
                      : 100}%
                  </p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Récompense</p>
                  <p className="text-4xl font-black text-amber-500">+100 XP</p>
                </div>
              </div>

              <Button
                size="lg"
                className="px-16 h-20 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-2xl font-black shadow-2xl shadow-indigo-200 transition-all hover:scale-105"
                onClick={() => router.push(`/lessons/${id}/complete`)}
              >
                Retour au Dashboard
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function XCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
