"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Volume2,
  ArrowRight,
  Brain,
  Sparkles,
  Trophy,
  Loader2,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { validateVocabResponse } from "@/lib/vocab/utils";
import { BreadcrumbParcours } from "@/components/parcours/BreadcrumbParcours";

interface Word {
  id: string;
  word: string;
  definition: string;
  example: string;
  category: string;
  level: string;
}

type Step = "discovery" | "quiz" | "type" | "complete";

function VocabCoachContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState<Step>("discovery");
  const [masteredCount, setMasteredCount] = useState(0);

  // States for Discovery
  const [flipped, setFlipped] = useState(false);

  // States for Quiz
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);

  // States for Type
  const [userInput, setUserInput] = useState("");
  const [typeChecked, setTypeChecked] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean, message?: string } | null>(null);

  const router = useRouter();
  const supabase = createClient();
  const parcoursId = searchParams.get("parcoursId");

  const generateQuizOptions = useCallback((correctDef: string, allWords: Word[]) => {
    const others = allWords.filter(w => w.definition !== correctDef).map(w => w.definition);
    const shuffled = others.sort(() => 0.5 - Math.random()).slice(0, 3);
    return [...shuffled, correctDef].sort(() => 0.5 - Math.random());
  }, []);

  const loadWords = useCallback(async (level: string, category: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("vocabulary")
      .select("*")
      .eq("level", level)
      .eq("category", category.toLowerCase())
      .limit(5);

    if (data && data.length > 0) {
      setWords(data);
      setQuizOptions(generateQuizOptions(data[0].definition, data));
    }
    setLoading(false);
  }, [supabase, generateQuizOptions]);

  useEffect(() => {
    const level = searchParams.get("level") || "A2";
    const topic = searchParams.get("topic") || "Culture";
    loadWords(level, topic);
  }, [searchParams, loadWords]);

  const handleStepComplete = async (isCorrect: boolean) => {
    if (isCorrect) {
      if (step === "discovery") {
        setStep("quiz");
        setFlipped(false);
      } else if (step === "quiz") {
        setStep("type");
        setQuizChecked(false);
        setSelectedOption(null);
      } else if (step === "type") {
        // Record mastery in SRS
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('user_vocabulary_reviews').upsert({
                    user_id: user.id,
                    vocab_id: words[currentIndex].id,
                    last_seen_at: new Date().toISOString(),
                    consecutive_correct: 1 // simplified for now
                });
            }
        } catch (e) {}

        if (currentIndex < words.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setMasteredCount(m => m + 1);
          setStep("discovery");
          setTypeChecked(false);
          setUserInput("");
          setQuizOptions(generateQuizOptions(words[currentIndex+1].definition, words));
        } else {
          setMasteredCount(m => m + 1);
          setStep("complete");
          // Award XP
          await fetch('/api/exercise-complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  exerciseId: null,
                  score: 100,
                  answers: []
              })
          });
        }
      }
    } else {
      // Re-discovery on fail
      setStep("discovery");
      setFlipped(false);
      setQuizChecked(false);
      setTypeChecked(false);
      setUserInput("");
    }
  };

  const handleSkip = () => {
    if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setStep("discovery");
        setFlipped(false);
        setQuizChecked(false);
        setTypeChecked(false);
        setUserInput("");
        setQuizOptions(generateQuizOptions(words[currentIndex+1].definition, words));
    } else {
        setStep("complete");
    }
  };

  if (loading || words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-bold">Mémorisation des mots...</p>
      </div>
    );
  }

  const current = words[currentIndex];
  const progress = (currentIndex / words.length) * 100 + ((step === "quiz" ? 1 : step === "type" ? 2 : 0) / 3) * (100 / words.length);

  if (step === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-12">
          <div className="relative inline-block">
             <div className="w-48 h-48 rounded-[3.5rem] bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto rotate-12 relative z-10 shadow-xl shadow-emerald-50">
                <Trophy size={80} />
             </div>
             <div className="absolute inset-0 bg-emerald-200 blur-3xl opacity-20 -z-10" />
          </div>
          <div className="space-y-4">
            <h2 className="text-5xl font-black text-zinc-900 tracking-tighter">Bravo !</h2>
            <p className="text-2xl text-zinc-500 font-medium italic">Vous avez mémorisé {masteredCount} nouveaux mots.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Mots</p>
                <p className="text-3xl font-black text-emerald-600">{masteredCount}</p>
             </div>
             <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">XP</p>
                <p className="text-3xl font-black text-amber-500">+150</p>
             </div>
          </div>
          <div className="flex flex-col gap-3">
            {parcoursId ? (
                <Button onClick={() => router.push(`/parcours/${parcoursId}`)} className="h-16 w-full rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-xl shadow-indigo-100">
                    Reprendre mon parcours
                </Button>
            ) : (
                <Button onClick={() => router.push("/dashboard")} className="h-16 w-full rounded-2xl bg-zinc-900 text-white font-black text-xl shadow-xl shadow-zinc-200">
                    Tableau de bord
                </Button>
            )}
            <Button variant="ghost" onClick={() => window.location.reload()} className="font-bold text-zinc-400">Refaire une session</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <BreadcrumbParcours currentPage="Vocabulaire" />

        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard")} className="w-12 h-12 rounded-2xl bg-white text-zinc-400 flex items-center justify-center hover:text-indigo-600 transition-colors shadow-sm">
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Coach Vocabulaire</h1>
              <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest">{current.category} • {current.level}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">Progression</p>
                <p className="text-lg font-black text-emerald-600 leading-none">{currentIndex + 1} / {words.length}</p>
             </div>
             <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                {Math.round(progress)}%
             </div>
          </div>
        </header>

        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
           <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-emerald-500" />
        </div>

        <AnimatePresence mode="wait">
          {step === "discovery" && (
            <motion.div
              key="discovery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-12"
            >
              <div
                className="w-full max-w-lg aspect-[4/3] cursor-pointer perspective-1000 group"
                onClick={() => setFlipped(!flipped)}
              >
                <div className={`
                  relative w-full h-full transition-transform duration-700 transform-style-3d
                  ${flipped ? 'rotate-y-180' : ''}
                `}>
                  {/* Recto */}
                  <Card className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-12 border-none shadow-2xl shadow-zinc-200 rounded-[3.5rem] group-hover:shadow-emerald-100 transition-all duration-500 bg-white">
                    <h2 className="text-6xl font-black text-zinc-900 mb-8 text-center tracking-tighter">{current.word}</h2>
                    <Button size="icon" variant="secondary" className="rounded-full h-16 w-16 bg-zinc-50 text-zinc-900 hover:bg-emerald-600 hover:text-white transition-colors">
                      <Volume2 size={32} />
                    </Button>
                    <p className="absolute bottom-12 text-[10px] text-zinc-300 uppercase font-black tracking-[0.4em] italic">Cliquer pour révéler</p>
                  </Card>

                  {/* Verso */}
                  <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-12 border-none bg-zinc-900 text-white shadow-2xl rounded-[3.5rem] overflow-hidden">
                    <div className="text-center space-y-10 z-10">
                      <div className="space-y-4">
                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Définition</div>
                        <p className="text-3xl font-bold leading-tight tracking-tight text-white">{current.definition}</p>
                      </div>
                      <div className="space-y-4">
                        <div className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em]">Exemple</div>
                        <p className="text-lg italic text-zinc-300 bg-white/5 p-6 rounded-[2rem] border border-white/10 leading-relaxed font-medium">
                          "{current.example}"
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
              <div className="flex gap-4 w-full max-w-lg">
                <Button onClick={handleSkip} variant="secondary" className="h-16 flex-1 bg-zinc-100 text-zinc-600 font-black rounded-2xl text-xl hover:bg-zinc-200">
                  Passer
                </Button>
                <Button onClick={() => handleStepComplete(true)} className="h-16 flex-[2] bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 text-xl">
                  C'est compris <ArrowRight className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "quiz" && (
            <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-lg mx-auto space-y-8">
              <div className="text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Quelle est la définition de</p>
                <h2 className="text-5xl font-black text-zinc-900 tracking-tighter">"{current.word}" ?</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {quizOptions.map((opt, i) => (
                  <button
                    key={i}
                    disabled={quizChecked}
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full p-6 rounded-2xl border-2 text-left transition-all font-bold text-base leading-snug
                      ${selectedOption === opt ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300'}
                      ${quizChecked && opt === current.definition ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : ''}
                      ${quizChecked && selectedOption === opt && opt !== current.definition ? 'border-rose-500 bg-rose-50 text-rose-900' : ''}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {!quizChecked ? (
                <div className="flex gap-4">
                  <Button onClick={handleSkip} variant="secondary" className="h-16 flex-1 bg-zinc-100 text-zinc-600 font-black rounded-2xl">Passer</Button>
                  <Button disabled={!selectedOption} onClick={() => setQuizChecked(true)} className="h-16 flex-[2] bg-zinc-900 text-white font-black rounded-2xl">Vérifier</Button>
                </div>
              ) : (
                <Button onClick={() => handleStepComplete(selectedOption === current.definition)} className={`w-full h-16 text-white font-black rounded-2xl ${selectedOption === current.definition ? 'bg-emerald-600' : 'bg-rose-500'}`}>
                  {selectedOption === current.definition ? "Continuer" : "Réessayer le mot"} <ArrowRight className="ml-2" />
                </Button>
              )}
            </motion.div>
          )}

          {step === "type" && (
            <motion.div key="type" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto space-y-10">
              <div className="text-center space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Écrivez le mot correspondant à</p>
                <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 italic text-xl font-medium text-zinc-700">"{current.definition}"</div>
              </div>
              <div className="space-y-4">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={typeChecked}
                  placeholder="Tapez le mot ici..."
                  className={`h-20 text-center text-3xl font-black rounded-2xl border-2 transition-all ${typeChecked ? (validationResult?.isValid ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-rose-500 bg-rose-50 text-rose-900') : 'border-zinc-200 focus:border-emerald-600'}`}
                />
                {!typeChecked ? (
                  <div className="flex gap-4">
                    <Button onClick={handleSkip} variant="secondary" className="h-16 flex-1 bg-zinc-100 text-zinc-600 font-black rounded-2xl">Passer</Button>
                    <Button disabled={!userInput.trim()} onClick={() => {
                        const res = validateVocabResponse(userInput, current.word);
                        setValidationResult(res);
                        setTypeChecked(true);
                      }} className="h-16 flex-[2] bg-zinc-900 text-white font-black rounded-2xl">Valider</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`text-center p-3 rounded-xl font-bold text-sm ${validationResult?.isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{validationResult?.isValid ? "Excellent !" : `La bonne réponse était : ${current.word}`}</div>
                    <Button onClick={() => handleStepComplete(validationResult?.isValid || false)} className={`w-full h-16 text-white font-black rounded-2xl ${validationResult?.isValid ? 'bg-emerald-600' : 'bg-rose-500'}`}>
                      {validationResult?.isValid ? "Maîtrisé !" : "Reprendre du début"} <ArrowRight className="ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function VocabCoach() {
  return (
    <Suspense fallback={null}>
      <VocabCoachContent />
    </Suspense>
  );
}
