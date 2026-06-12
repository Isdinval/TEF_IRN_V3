"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useParcours } from "@/contexts/ParcoursContext";
import { BreadcrumbParcours } from "@/components/shared/BreadcrumbParcours";
import {
  Volume2,
  ArrowRight,
  LayoutGrid,
  GraduationCap,
  Loader2,
  Calendar,
  Sparkles,
  Trophy,
  Brain,
  Target,
  SkipForward,
  X
} from "lucide-react";
import { updateVocabularySRS } from "@/lib/srs-engine";
import { motion, AnimatePresence } from "framer-motion";
import { validateVocabResponse } from "@/lib/vocab/utils";

interface Flashcard {
  id: string;
  word: string;
  definition: string;
  example: string;
  level: string;
  category: string;
}

type Step = "presentation" | "quiz" | "type";

function VocabCoachContent() {
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>("presentation");
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"selection" | "training">("selection");
  const [filters, setFilters] = useState({ level: "A2", category: "Administration" });
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [sessionMasteredCount, setSessionMasteredCount] = useState(0);
  const { activeParcours } = useParcours();

  // Quiz state
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);

  // Type state
  const [userInput, setUserInput] = useState("");
  const [typeChecked, setTypeChecked] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; message?: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const lessonId = searchParams.get('lessonId');
    const level = searchParams.get('level');
    const topic = searchParams.get('topic');

    if (level && topic) {
      setFilters({ level, category: topic });
    } else if (activeParcours && mode === "selection") {
      // Just pre-fill, don't force
      setFilters({ level: activeParcours.level, category: "Administration" }); // Category mapping might be needed
    }
  }, [searchParams, activeParcours]);

  const startTraining = async (review = false) => {
    setLoading(true);
    setIsReviewMode(review);

    let query = supabase.from("vocabulary").select("*");

    if (review) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // En mode révision, on récupère les mots SRS dus
        const { data: srsData } = await supabase
          .from("user_vocabulary_reviews")
          .select("word_id")
          .eq("user_id", user.id)
          .lte("next_review", new Date().toISOString());

        if (srsData && srsData.length > 0) {
          query = query.in("id", srsData.map((d: any) => d.word_id));
        } else {
          query = query.eq("level", filters.level).limit(10);
        }
      }
    } else {
      query = query.eq("level", filters.level).eq("category", filters.category).limit(10);
    }

    const { data, error } = await query;

    if (data && data.length > 0) {
      setCards(data as Flashcard[]);
      setMode("training");
      setIndex(0);
      setStep("presentation");
      setFinished(false);
      setSessionMasteredCount(0);
    }
    setLoading(false);
  };

  const handleStepComplete = async (success: boolean) => {
    const current = cards[index];

    if (step === "presentation") {
      setStep("quiz");
      prepareQuiz(current);
    } else if (step === "quiz") {
      if (success) {
        setStep("type");
        setUserInput("");
        setTypeChecked(false);
      } else {
        setStep("presentation");
        setFlipped(false);
      }
    } else if (step === "type") {
      if (success) {
        // Record mastery
        setSessionMasteredCount(s => s + 1);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await updateVocabularySRS(user.id, current.id, true);

          // Update last_practice_at in user_parcours_progress if in parcours mode
          if (activeParcours) {
            await supabase.from('user_parcours_progress')
              .update({ last_practice_at: new Date().toISOString() })
              .eq('user_id', user.id)
              .eq('parcours_id', activeParcours.id);
          }
        }

        if (index < cards.length - 1) {
          setIndex(index + 1);
          setStep("presentation");
          setFlipped(false);
        } else {
          setFinished(true);
        }
      } else {
        setStep("presentation");
        setFlipped(false);
      }
    }
  };

  const handleSkip = () => {
     if (index < cards.length - 1) {
          setIndex(index + 1);
          setStep("presentation");
          setFlipped(false);
          setQuizChecked(false);
          setSelectedOption(null);
          setTypeChecked(false);
          setUserInput("");
      } else {
          setFinished(true);
      }
  };

  const prepareQuiz = (current: Flashcard) => {
    const others = cards.filter((c: any) => c.id !== current.id).map((c: any) => c.definition);
    const options = [current.definition, ...others.slice(0, 3)];
    setQuizOptions(options.sort(() => Math.random() - 0.5));
    setQuizChecked(false);
    setSelectedOption(null);
  };

  if (mode === "selection") {
    return (
      <div className="max-w-6xl mx-auto p-8 pt-16 min-h-screen">
        <BreadcrumbParcours />
        <header className="mb-16 space-y-4">
          <div className="flex items-center gap-3">
             <Badge className="bg-sky-600 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none">
                Vocab Coach
             </Badge>
             {activeParcours && (
               <Badge variant="outline" className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-sky-200 text-sky-600 bg-sky-50 flex items-center gap-2">
                 <Sparkles size={12} /> Contextualisé : {activeParcours.level}
               </Badge>
             )}
          </div>
          <h1 className="text-6xl font-black text-zinc-900 tracking-tighter leading-none">
            Maîtrisez le <br />Vocabulaire
          </h1>
          <p className="text-xl text-zinc-400 font-medium max-w-2xl leading-relaxed">
            Un système d'apprentissage intelligent qui s'adapte à votre mémoire pour un vocabulaire durable.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <Card className="border-none shadow-2xl shadow-zinc-100 rounded-[3rem] p-10 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Niveau</label>
                  <div className="flex flex-wrap gap-2">
                    {["A1", "A2", "B1", "B2"].map((l) => (
                      <button
                        key={l}
                        onClick={() => setFilters({ ...filters, level: l })}
                        className={`h-14 flex-1 rounded-2xl font-black text-sm transition-all ${filters.level === l ? 'bg-zinc-900 text-white shadow-xl' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Thématique</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-4 font-bold text-zinc-900 focus:ring-2 focus:ring-sky-600"
                  >
                    {["Administration", "Logement", "Santé", "Travail", "Vie quotidienne"].map((c: any) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={() => startTraining()}
                disabled={loading}
                className="w-full h-20 mt-10 bg-zinc-900 hover:bg-black text-white font-black rounded-3xl text-xl shadow-2xl shadow-zinc-200 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Lancer la session"}
                <ArrowRight className="ml-2" />
              </Button>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="relative overflow-hidden border-none shadow-2xl shadow-sky-100 rounded-[3rem] p-10 bg-sky-600 text-white">
               <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-2 tracking-tight">Révisions SRS</h3>
                  <p className="text-sky-100 text-sm font-medium mb-8 leading-relaxed">
                    Vous avez 12 mots à réviser aujourd'hui pour ne pas les oublier.
                  </p>
                  <Button
                    onClick={() => startTraining(true)}
                    className="w-full h-14 bg-white text-sky-600 hover:bg-sky-50 font-black rounded-xl shadow-xl"
                  >
                    Réviser maintenant
                  </Button>
               </div>
               <Brain className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-zinc-50">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl">
          <Card className="text-center p-12 rounded-[4rem] shadow-2xl bg-white border-none">
            <div className="w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Trophy className="text-sky-600" size={48} />
            </div>
            <h1 className="text-4xl font-black mb-4 tracking-tighter uppercase">Session terminée !</h1>
            <p className="text-zinc-400 mb-10 font-bold text-lg">Vous avez maîtrisé {sessionMasteredCount} nouveaux mots.</p>
            <Button
              className="w-full h-20 bg-zinc-900 text-white font-black rounded-3xl text-xl"
              onClick={() => setMode("selection")}
            >
              Retour
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  const current = cards[index];

  return (
    <div className="min-h-screen bg-zinc-50/50 flex flex-col p-8 pt-16">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-center">
        <div className="w-full flex justify-between items-center mb-12">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Niveau {current.level}</span>
              <span className="text-sm font-black text-zinc-900 uppercase">{current.category}</span>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Progression</p>
                <p className="text-lg font-black text-sky-600">{index + 1} / {cards.length}</p>
              </div>
              <div className="w-16 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                <div className="h-full bg-sky-600 transition-all duration-500" style={{ width: `${((index + 1) / cards.length) * 100}%` }} />
              </div>
           </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "presentation" && (
            <motion.div
              key="presentation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col items-center gap-10"
            >
              <div
                className="w-full h-[450px] cursor-pointer perspective-1000 group"
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
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                       <div className="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full blur-3xl" />
                       <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500 rounded-full blur-3xl" />
                    </div>
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
                <Button
                  onClick={handleSkip}
                  variant="secondary"
                  className="h-16 flex-1 bg-zinc-100 text-zinc-600 font-black rounded-2xl text-xl hover:bg-zinc-200"
                >
                  Passer
                </Button>
                <Button
                  onClick={() => handleStepComplete(true)}
                  className="h-16 flex-[2] bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 text-xl"
                >
                  C'est compris <ArrowRight className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "quiz" && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-lg space-y-8"
            >
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
                    className={`
                      w-full p-6 rounded-2xl border-2 text-left transition-all font-bold text-base leading-snug
                      ${selectedOption === opt ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300'}
                      ${quizChecked && opt === current.definition ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : ''}
                      ${quizChecked && selectedOption === opt && opt !== current.definition ? 'border-rose-500 bg-rose-50 text-rose-900' : ''}
                    `}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {!quizChecked ? (
                <div className="flex gap-4">
                  <Button
                    onClick={handleSkip}
                    variant="secondary"
                    className="h-16 flex-1 bg-zinc-100 text-zinc-600 font-black rounded-2xl hover:bg-zinc-200"
                  >
                    Passer
                  </Button>
                  <Button
                    disabled={!selectedOption}
                    onClick={() => setQuizChecked(true)}
                    className="h-16 flex-[2] bg-zinc-900 text-white font-black rounded-2xl"
                  >
                    Vérifier
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleStepComplete(selectedOption === current.definition)}
                  className={`w-full h-16 text-white font-black rounded-2xl ${selectedOption === current.definition ? 'bg-emerald-600' : 'bg-rose-500'}`}
                >
                  {selectedOption === current.definition ? "Continuer" : "Réessayer le mot"} <ArrowRight className="ml-2" />
                </Button>
              )}
            </motion.div>
          )}

          {step === "type" && (
            <motion.div
              key="type"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg space-y-10"
            >
              <div className="text-center space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Écrivez le mot correspondant à</p>
                <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 italic text-xl font-medium text-zinc-700">
                  "{current.definition}"
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={typeChecked}
                  placeholder="Tapez le mot ici..."
                  className={`h-20 text-center text-3xl font-black rounded-2xl border-2 transition-all ${
                    typeChecked
                    ? (validationResult?.isValid ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-rose-500 bg-rose-50 text-rose-900')
                    : 'border-zinc-200 focus:border-emerald-600'
                  }`}
                />

                {!typeChecked ? (
                  <div className="flex gap-4">
                    <Button
                      onClick={handleSkip}
                      variant="secondary"
                      className="h-16 flex-1 bg-zinc-100 text-zinc-600 font-black rounded-2xl hover:bg-zinc-200"
                    >
                      Passer
                    </Button>
                    <Button
                      disabled={!userInput.trim()}
                      onClick={() => {
                        const res = validateVocabResponse(userInput, current.word);
                        setValidationResult(res);
                        setTypeChecked(true);
                      }}
                      className="h-16 flex-[2] bg-zinc-900 text-white font-black rounded-2xl"
                    >
                      Valider
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`text-center p-3 rounded-xl font-bold text-sm ${validationResult?.isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                         {validationResult?.isValid ? (validationResult.message || "Excellent !") : "Presque ! Réessayez (attention à l'orthographe)"}
                    </div>
                    {!validationResult?.isValid && (
                      <div className="text-center p-4 bg-rose-50 rounded-xl text-rose-600 font-bold">
                        La bonne réponse était : <span className="text-xl uppercase underline decoration-2">{current.word}</span>
                      </div>
                    )}
                    <Button
                      onClick={() => handleStepComplete(validationResult?.isValid || false)}
                      className={`w-full h-16 text-white font-black rounded-2xl ${validationResult?.isValid ? 'bg-emerald-600' : 'bg-rose-500'}`}
                    >
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-sky-600" size={48} /></div>}>
      <VocabCoachContent />
    </Suspense>
  );
}
