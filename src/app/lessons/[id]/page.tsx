"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Target, Sparkles, ArrowRight, Lightbulb,
  BookOpen, GraduationCap, CheckCircle2, MessageSquare, AlertTriangle,
  Moon, Sun, Type, List, Bookmark, Clock, Share2,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── helpers ────────────────────────────────────────────────────────────────

function stripEmoji(text: string) {
  return text.replace(/^[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, "").trim();
}

function isMnemo(text: string) {
  return /^[A-Z][A-Z\s·\-]+[A-Z]$/.test(text.trim()) && text.trim().length > 4;
}

function parseMnemoLetters(text: string): string[] {
  return text.trim().split(/[\s·]+/).filter(Boolean);
}

// Estimation du temps de lecture (200 mots/min)
function estimateReadingTime(content: string): number {
  const words = content.replace(/[#*_`\[\](){}]/g, '').split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// ─── component ──────────────────────────────────────────────────────────────

export default function LessonDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lesson, setLesson] = useState<any>(null);
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"reading" | "quiz" | "result">("reading");
  const [readingProgress, setReadingProgress] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [showToc, setShowToc] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [sections, setSections] = useState<{ id: string; title: string; level: number }[]>([]);
  const [savedScrollPos, setSavedScrollPos] = useState<number | null>(null);
  
  const contentRef = useRef<HTMLDivElement>(null);

  // Quiz state
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);

  const supabase = createClient();
  const router = useRouter();

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      const { data: lessonData } = await supabase.from('lessons').select('*').eq('id', id).single();
      if (lessonData) setLesson(lessonData);
      const { data: exoData } = await supabase.from('exercises').select('*').eq('lesson_id', id).eq('type', 'qcm').limit(1).maybeSingle();
      if (exoData) setExercise(exoData);
      setLoading(false);
    }
    fetchData();
    
    // Récupérer la position de scroll sauvegardée
    const saved = localStorage.getItem(`lesson_scroll_${id}`);
    if (saved) setSavedScrollPos(parseInt(saved));
  }, [id, supabase]);

  // Restaurer la position de scroll
  useEffect(() => {
    if (step === "reading" && savedScrollPos && !loading) {
      window.scrollTo({ top: savedScrollPos, behavior: "instant" });
      setSavedScrollPos(null);
    }
  }, [step, loading, savedScrollPos]);

  // Sauvegarder la position au scroll
  useEffect(() => {
    if (step !== "reading") return;
    const saveScroll = () => {
      localStorage.setItem(`lesson_scroll_${id}`, window.scrollY.toString());
    };
    window.addEventListener("scrollend", saveScroll);
    return () => window.removeEventListener("scrollend", saveScroll);
  }, [step, id]);

  // Scroll progress + section detection
  useEffect(() => {
    if (step !== "reading") return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const total = scrollHeight - clientHeight;
      const progress = total > 0 ? Math.min(100, (scrollTop / total) * 100) : 0;
      setReadingProgress(progress);
      
      // Détecter la section active pour le TOC flottant
      const headings = document.querySelectorAll("h2, h3");
      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 150) {
          setActiveSection(heading.id || heading.textContent || "");
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [step]);

  // Extraire les sections du contenu Markdown
  useEffect(() => {
    if (lesson?.content) {
      const headingRegex = /^##\s+(.+)$/gm;
      const matches = [...lesson.content.matchAll(headingRegex)];
      const extracted = matches.map((match, i) => ({
        id: `section-${i}`,
        title: stripEmoji(match[1]),
        level: 2,
      }));
      setSections(extracted);
    }
  }, [lesson]);

  const handleNextQuestion = async () => {
    if (currentQ < (exercise?.content?.questions?.length || 0) - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setIsChecked(false);
    } else {
      setLoading(true);
      await saveResults();
      setStep("result");
      setLoading(false);
    }
  };

  const handleFinishLesson = async () => {
    if (exercise) {
      setStep("quiz");
    } else {
      setLoading(true);
      await awardXpOnly();
      setStep("result");
      setLoading(false);
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

  const scrollToSection = (id: string, title: string) => {
    const element = document.querySelector(`h2:contains("${title}")`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setShowToc(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const fontSizeClasses = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
  };

  if (loading && step === "reading") return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );
  if (!lesson) return <div className="p-8 text-center text-slate-500 font-bold">Leçon non trouvée.</div>;

  const readingTime = estimateReadingTime(lesson.content || "");
  const readingTimeMinutes = Math.floor(readingTime);
  const readingTimeSeconds = Math.round((readingTime - readingTimeMinutes) * 60);

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
      const sectionId = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      return (
        <div id={sectionId} className="scroll-mt-24 flex items-center gap-3 mt-10 mb-5 first:mt-0">
          <div className={`w-9 h-9 flex items-center justify-center rounded-xl shrink-0
            ${isTheorie ? 'bg-indigo-100 text-indigo-600' : isExemple ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            {isTheorie ? <BookOpen size={18} /> : isExemple ? <GraduationCap size={18} /> : <Sparkles size={18} />}
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none dark:text-slate-200">{title}</h2>
        </div>
      );
    },

    h3: ({ children }: any) => (
      <h3 className="text-lg font-bold text-slate-700 mt-8 mb-4 border-l-4 border-indigo-200 pl-4 dark:text-slate-300 dark:border-indigo-800">{children}</h3>
    ),

    p: ({ children, node }: any) => {
      const isBoldLabel = node?.children?.length === 1 && node.children[0]?.tagName === "strong";
      if (isBoldLabel) {
        dialogueLineIndex = 0;
        return (
          <div className="flex items-center gap-2 mt-8 mb-3">
            <MessageSquare size={15} className="text-emerald-500 shrink-0" />
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{children}</p>
          </div>
        );
      }
      return <p className={`text-slate-600 leading-relaxed mb-4 font-medium ${fontSizeClasses[fontSize]} dark:text-slate-400`}>{children}</p>;
    },

    ul: ({ children }: any) => <ul className="space-y-2 my-6">{children}</ul>,
    ol: ({ children }: any) => <ol className="space-y-3 my-6 list-none p-0">{children}</ol>,

    li: ({ children, node, ordered }: any) => {
      const rawText = node?.children?.map((c: any) => c.value || c.children?.map((cc: any) => cc.value || "").join("") || "").join("") || "";
      
      if (rawText.startsWith("⚠️") || rawText.startsWith("⚠")) {
        return (
          <li className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 text-[11px] font-black uppercase tracking-wide dark:bg-orange-900/30 dark:text-orange-400">
              <AlertTriangle size={11} /> Attention
            </span>
            <span className={`text-slate-600 font-medium ${fontSizeClasses[fontSize]} dark:text-slate-400`}>{children}</span>
          </li>
        );
      }
      
      if (rawText.startsWith("✅")) {
        return (
          <li className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[11px] font-black uppercase tracking-wide dark:bg-emerald-900/30 dark:text-emerald-400">
              <CheckCircle2 size={11} /> Règle
            </span>
            <span className={`text-slate-600 font-medium ${fontSizeClasses[fontSize]} dark:text-slate-400`}>{children}</span>
          </li>
        );
      }

      if (ordered) {
        return (
          <li className="p-4 rounded-2xl border bg-slate-50 border-slate-200 text-slate-700 font-medium dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300">
            {children}
          </li>
        );
      }

      return (
        <li className="flex items-start gap-3 text-slate-600 font-medium dark:text-slate-400">
          <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
          <span className={fontSizeClasses[fontSize]}>{children}</span>
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
                : 'bg-slate-100 text-slate-700 rounded-tl-sm dark:bg-slate-700 dark:text-slate-200'
            }`}>
              {text.replace(/^— /, '')}
            </div>
          </div>
        );
      }
      return <em className="italic text-slate-600 dark:text-slate-400">{children}</em>;
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
      return <strong className="font-black text-indigo-900 dark:text-indigo-400">{children}</strong>;
    },

    table: ({ children }: any) => (
      <div className="my-6 rounded-2xl overflow-hidden border border-zinc-100 shadow-sm dark:border-zinc-800">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">{children}</thead>,
    tbody: ({ children }: any) => <tbody className="divide-y divide-zinc-50 bg-white dark:divide-zinc-800 dark:bg-slate-900">{children}</tbody>,
    tr: ({ children }: any) => <tr className="hover:bg-zinc-50/60 transition-colors dark:hover:bg-zinc-800/50">{children}</tr>,
    th: ({ children }: any) => (
      <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-widest">{children}</th>
    ),
    td: ({ children, node }: any) => {
      const isFirst = (node?.parent?.children?.indexOf(node) === 0);
      return (
        <td className={`px-5 py-3 ${isFirst ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-500 font-medium dark:text-slate-400'}`}>
          {children}
        </td>
      );
    },

    blockquote: ({ children }: any) => (
      <div className="my-10 p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-100 rounded-[2rem] relative overflow-hidden shadow-sm dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800">
        <Lightbulb className="absolute -right-4 -top-4 text-amber-200/30 w-32 h-32 rotate-12 dark:text-amber-800/20" />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase text-amber-600 tracking-[0.2em] mb-3 flex items-center gap-2 dark:text-amber-400">
            <Lightbulb size={14} fill="currentColor" /> L'Astuce du Coach
          </p>
          <div className="text-amber-900 font-bold text-base leading-relaxed space-y-1 dark:text-amber-200">
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
    <div className={`min-h-screen pb-20 transition-colors duration-300 ${darkMode ? 'dark bg-slate-900' : 'bg-zinc-50/50'}`}>
      {/* Top reading progress bar */}
      {step === "reading" && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-zinc-100 dark:bg-slate-800">
          <motion.div
            className="h-full bg-indigo-500"
            style={{ width: `${readingProgress}%` }}
            transition={{ ease: "linear", duration: 0.1 }}
          />
        </div>
      )}

      {/* Floating TOC button and reading tools */}
      {step === "reading" && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2">
          {/* Temps de lecture */}
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg text-xs font-black flex items-center gap-2 dark:bg-slate-800/90">
            <Clock size={14} className="text-indigo-500" />
            <span className="text-slate-600 dark:text-slate-300">{readingTimeMinutes}:{readingTimeSeconds.toString().padStart(2, '0')}</span>
          </div>
          
          {/* Bouton TOC */}
          <button
            onClick={() => setShowToc(!showToc)}
            className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
          >
            <List size={20} />
          </button>
          
          {/* Bouton mode sombre */}
          <button
            onClick={toggleDarkMode}
            className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 p-3 rounded-full shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {/* Contrôle taille police */}
          <div className="bg-white dark:bg-slate-800 rounded-full shadow-lg flex p-1">
            {(["sm", "base", "lg"] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-3 py-2 rounded-full text-xs font-bold transition-all ${
                  fontSize === size 
                    ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300" 
                    : "text-slate-500 hover:text-indigo-500"
                }`}
              >
                <Type size={14} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu TOC flottant */}
      <AnimatePresence>
        {showToc && step === "reading" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-32 right-6 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-zinc-100 dark:border-slate-700 p-4 z-50"
          >
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3">Sommaire</p>
            <div className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id, section.title)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeSection === section.title
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && step !== "reading" && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center dark:bg-slate-900/80">
          <div className="text-center space-y-4">
            <Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Enregistrement de vos progrès...</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 pt-8">
        <Link
          href="/lessons"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition-colors mb-10 group dark:text-zinc-500 dark:hover:text-indigo-400"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Retour au catalogue
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
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-100 text-indigo-600 border-0 dark:bg-indigo-900/50 dark:text-indigo-300">
                        {lesson.level}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-zinc-100 text-zinc-500 border-0 dark:bg-slate-800 dark:text-zinc-400">
                        {lesson.category}
                      </Badge>
                    </div>
                    
                    {/* Partager */}
                    <button
                      onClick={() => navigator.share?.({ title: lesson.title, url: window.location.href })}
                      className="text-zinc-400 hover:text-indigo-500 transition-colors"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>

                  <h1 className="text-5xl font-black tracking-tight text-slate-900 leading-[1.1] dark:text-white">
                    {lesson.title}
                  </h1>

                  {lesson.objective && (
                    <div className="p-6 bg-white border border-zinc-100 rounded-[2rem] flex gap-5 items-center shadow-sm dark:bg-slate-800 dark:border-slate-700">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 dark:bg-indigo-900/50 dark:text-indigo-400">
                        <Target size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Objectif de la leçon</p>
                        <p className="text-slate-700 font-bold text-lg dark:text-slate-300">{lesson.objective}</p>
                      </div>
                    </div>
                  )}

                  {/* Résumé rapide si présent dans le contenu */}
                  <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-800">
                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-2 flex items-center gap-2">
                      <Bookmark size={12} /> Dans cette leçon
                    </p>
                    <ul className="space-y-1">
                      {sections.map((section) => (
                        <li key={section.id} className="text-sm text-slate-600 dark:text-slate-400">
                          • {section.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </header>

                <div 
                  ref={contentRef}
                  className={`bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-white transition-colors dark:bg-slate-800 dark:shadow-slate-900/50 dark:border-slate-700`}
                >
                  <div className={`prose-none max-w-none ${fontSizeClasses[fontSize]}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {cleanContent}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Key takeaways - points clés générés automatiquement */}
                <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 dark:from-indigo-950/30 dark:to-purple-950/30 dark:border-indigo-800">
                  <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-3 flex items-center gap-2 dark:text-indigo-400">
                    <Sparkles size={14} /> À retenir
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                      <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>Révisez les points marqués ⚠️ et ✅ pour éviter les erreurs courantes</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                      <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>Entraînez-vous avec les exemples pour maîtriser la leçon</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                      <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>Utilisez la mnémotechnique quand elle est disponible</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <Button
                    size="lg"
                    className="w-full h-20 text-xl font-black rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] dark:shadow-indigo-950/50"
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

          {/* Quiz et Result - inchangés mais avec support dark mode */}
          {step === "quiz" && exercise && (
            <motion.div key="quiz" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}>
              <div className="space-y-8">
                <div className="flex justify-between items-center bg-white px-8 py-6 rounded-[2rem] border border-zinc-100 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Entraînement</p>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">{lesson.title}</h2>
                  </div>
                  <div className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-black dark:bg-indigo-600">
                    {currentQ + 1} / {exercise.content.questions.length}
                  </div>
                </div>

                <Card className="border-none shadow-2xl shadow-zinc-200/50 bg-white rounded-[2.5rem] overflow-hidden dark:bg-slate-800 dark:shadow-slate-900/50">
                  <CardContent className="p-12 text-center space-y-10">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto dark:bg-indigo-900/50 dark:text-indigo-400">
                      <GraduationCap size={32} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 leading-tight dark:text-white">
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
                            ${selected === i ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-500' : 'border-zinc-100 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-600 dark:hover:text-indigo-400'}
                            ${isChecked && i === exercise.content.correct_answers[currentQ] ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300' : ''}
                            ${isChecked && selected === i && i !== exercise.content.correct_answers[currentQ] ? 'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-900/30 dark:text-rose-300' : ''}
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
                      className="px-12 h-16 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 dark:shadow-indigo-950/50"
                    >
                      Vérifier ma réponse
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextQuestion}
                      className="px-12 h-16 bg-zinc-900 hover:bg-black rounded-2xl font-black text-lg shadow-xl shadow-zinc-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:shadow-slate-900/50"
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
                  ${(!exercise || score >= (exercise?.content?.questions?.length || 0) / 2) ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'} rotate-12`}>
                  <Sparkles size={80} />
                </div>
                <div className="absolute inset-0 bg-indigo-200 blur-3xl opacity-20 -z-10 dark:bg-indigo-900" />
              </div>

              <div className="space-y-4">
                <h2 className="text-5xl font-black text-slate-900 dark:text-white">Bien joué !</h2>
                <p className="text-2xl text-slate-500 font-medium italic dark:text-slate-400">Vous avez complété la leçon avec succès.</p>
              </div>

              <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
                <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Score</p>
                  <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                    {(exercise && exercise.content.questions.length > 0)
                      ? Math.round((score / exercise.content.questions.length) * 100)
                      : 100}%
                  </p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Récompense</p>
                  <p className="text-4xl font-black text-amber-500">+100 XP</p>
                </div>
              </div>

              <Button
                size="lg"
                className="px-16 h-20 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-2xl font-black shadow-2xl shadow-indigo-200 transition-all hover:scale-105 dark:shadow-indigo-950/50"
                onClick={() => router.push('/dashboard')}
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

// Helper pour le sélecteur :contains (ajouter si besoin)
declare global {
  interface Element {
    contains(selector: string): boolean;
  }
}
