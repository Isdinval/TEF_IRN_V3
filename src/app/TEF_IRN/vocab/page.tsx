"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import VocabCard from "./components/VocabCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Volume2,
  ArrowRight,
  Loader2,
  Sparkles,
  Trophy,
  Brain,
  Target,
  Zap
} from "lucide-react";
import { updateVocabularySRS } from "@/lib/srs-engine";
import { motion, AnimatePresence } from "framer-motion";
import { validateVocabResponse } from "@/lib/vocab/utils";
import { ParcoursBreadcrumb } from "@/components/shared/ParcoursBreadcrumb";
import { useParcours } from "@/contexts/ParcoursContext";

interface Flashcard {
  id: string;
  word: string;
  definition: string;
  example: string;
  level: string;
  category: string;
}

type Step = "presentation" | "quiz" | "type";

export function VocabCoachContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>("presentation");
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catalogue, setCatalogue] = useState<any[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
  const [mode, setMode] = useState<"selection" | "training">("selection");
  const [filters, setFilters] = useState({ level: "A2", category: "Administration" });
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [sessionMasteredCount, setSessionMasteredCount] = useState(0);

  // Quiz state
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);

  // Type state
  const [userInput, setUserInput] = useState("");
  const [typeChecked, setTypeChecked] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; toleranceApplied: boolean; message?: string } | null>(null);

  const supabase = createClient();
  const { activeParcours, nextLesson } = useParcours();

  const fetchCatalogue = useCallback(async () => {
    setLoadingCatalogue(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from("vocabulary")
        .select("*")
        .eq("level", filters.level);

      if (filters.category !== "Toutes") {
        query = query.ilike("category", `%${filters.category}%`);
      }

      const { data: items } = await query.limit(20);

      if (items && user) {
        const { data: reviews } = await supabase
          .from("user_vocabulary_reviews")
          .select("vocab_id")
          .eq("user_id", user.id)
          .in("vocab_id", items.map((i: any) => i.id));

        const mapped = items.map((item: any) => ({
          ...item,
          is_completed: reviews?.some((r: any) => r.vocab_id === item.id)
        }));
        setCatalogue(mapped);
      } else {
        setCatalogue(items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCatalogue(false);
    }
  }, [filters, supabase]);

  useEffect(() => {
    if (mode === "selection") {
      fetchCatalogue();
    }
  }, [fetchCatalogue, mode]);

  const startSpecificCard = useCallback(async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vocabulary")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      setCards([data as Flashcard]);
      setMode("training");
      setIndex(0);
      setStep("presentation");
      setFinished(false);
      setSessionMasteredCount(0);
    }
    setLoading(false);
  }, [supabase]);

  const startTraining = useCallback(async (review: boolean = false, lvl?: string, cat?: string) => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    let query = supabase.from('vocabulary').select('*');

    if (review && user) {
      setIsReviewMode(true);
      const { data: reviews } = await supabase
        .from('user_vocabulary_reviews')
        .select('vocab_id')
        .eq('user_id', user.id)
        .lte('next_review_at', new Date().toISOString())
        .limit(10);

      if (reviews && reviews.length > 0) {
        query = query.in('id', reviews.map((r: any) => r.vocab_id));
      } else {
        query = query.eq('level', lvl || filters.level).eq('category', cat || filters.category).limit(10);
      }
    } else {
      setIsReviewMode(false);
      query = query.eq('level', lvl || filters.level).eq('category', cat || filters.category).limit(10);
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
  }, [filters, supabase]);

  useEffect(() => {
    const cardId = (params?.id as string | undefined) || searchParams.get("id");
    const lessonId = searchParams.get("lessonId");
    const topic = searchParams.get("topic");
    const level = searchParams.get("level");

    if (cardId) {
      startSpecificCard(cardId);
    } else if (lessonId && topic) {
      setFilters(prev => ({
        ...prev,
        category: topic,
        level: level || prev.level
      }));

      const timer = setTimeout(() => {
        startTraining();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [params?.id, searchParams, startSpecificCard, startTraining]);

  const categories = ["Toutes", "Administration", "Santé", "Travail", "Logement"];
  const levels = ["A1", "A2", "B1", "B2"];

  const handleStepComplete = async (isCorrect: boolean) => {
    if (isCorrect && step === "type") {
      setSessionMasteredCount(prev => prev + 1);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateVocabularySRS(user.id, cards[index].id, true);
      }
    }

    if (step === "presentation") {
      setStep("quiz");
      prepareQuiz(cards[index]);
    } else if (step === "quiz") {
      if (isCorrect) {
        setStep("type");
        setUserInput("");
        setTypeChecked(false);
      } else {
        setStep("presentation");
        setFlipped(false);
      }
    } else if (step === "type") {
      if (isCorrect) {
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

  const prepareQuiz = (current: Flashcard) => {
    const options = [current.definition];
    const others = catalogue.filter((c: any) => c.id !== current.id).map((c: any) => c.definition);
    while (options.length < 3 && others.length > 0) {
      const rand = others.splice(Math.floor(Math.random() * others.length), 1)[0];
      if (!options.includes(rand)) options.push(rand);
    }
    setQuizOptions(options.sort(() => Math.random() - 0.5));
    setSelectedOption(null);
    setQuizChecked(false);
  };

  const handleSkip = () => {
    if (index < cards.length - 1) {
      setIndex(index + 1);
      setStep("presentation");
      setFlipped(false);
    } else {
      setFinished(true);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 gap-6">
        <Loader2 className="animate-spin text-emerald-600" size={64} />
        <p className="text-sm font-black text-zinc-400 uppercase tracking-widest animate-pulse">Initialisation du Coach...</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-zinc-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl"
        >
          <Card className="text-center p-12 rounded-[4rem] shadow-2xl shadow-emerald-100 border-none bg-white">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600">
              <Trophy size={48} />
            </div>
            <h1 className="text-4xl font-black mb-4 tracking-tighter">Session Terminée !</h1>
            <p className="text-zinc-400 mb-10 font-bold text-lg">
              Mots maîtrisés : <span className="text-emerald-600">{sessionMasteredCount}</span> / {cards.length}
            </p>

            <div className="space-y-4">
              {activeParcours && (
                <Button
                  className="w-full h-20 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-3xl text-xl shadow-2xl shadow-emerald-200 transition-all"
                  onClick={() => nextLesson()}
                >
                  Continuer mon parcours
                </Button>
              )}
              <Button
                variant={activeParcours ? "ghost" : "default"}
                className={`w-full ${activeParcours ? 'h-12 text-zinc-400 hover:text-indigo-600' : 'h-20 bg-zinc-900 hover:bg-zinc-800 text-white'} font-black rounded-3xl text-lg transition-all`}
                onClick={() => {
                  setMode("selection");
                  setFinished(false);
                }}
              >
                {activeParcours ? "Retour à la sélection libre" : "Nouvelle session"}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (mode === "selection") {
    return (
      <div className="min-h-screen bg-zinc-50/50 p-6 pt-16 lg:p-16">
        <div className="max-w-6xl mx-auto">
          <ParcoursBreadcrumb className="mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <header>
                <Badge className="mb-4 rounded-full border-none bg-emerald-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100">
                  Coach Vocabulaire
                </Badge>
                <h1 className="text-[clamp(1.875rem,4vw+1rem,3rem)] font-black text-slate-900 tracking-tighter mb-6 uppercase">
                  VOTRE <span className="text-emerald-600">LEXIQUE</span> <br />IMMÉDIAT.
                </h1>
                <p className="max-w-2xl text-xl font-medium text-slate-500 leading-relaxed italic">
                  Maîtrisez les mots essentiels du TEF IRN grâce à notre méthode de mémorisation active en 3 étapes.
                </p>
              </header>

              <Card className="p-8 rounded-[2.5rem] border-none bg-white shadow-xl shadow-zinc-200/50 space-y-6">
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Target size={16} /> Niveau
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {levels.map((l) => (
                      <button
                        key={l}
                        onClick={() => setFilters({ ...filters, level: l })}
                        className={`h-12 rounded-xl font-black text-sm transition-all ${filters.level === l ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Zap size={16} /> Catégorie
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setFilters({ ...filters, category: c })}
                        className={`h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filters.category === c ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-10 rounded-[3rem] border-none bg-emerald-600 text-white shadow-2xl shadow-emerald-200/50 relative overflow-hidden flex flex-col justify-center min-h-[300px] group cursor-pointer" onClick={() => startTraining()}>
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                      <Brain size={28} />
                    </div>
                    <h3 className="text-3xl font-black mb-2 uppercase">Prêt ?</h3>
                    <p className="text-emerald-50 text-sm font-medium mb-8 leading-relaxed opacity-80 italic">
                      Apprenez 10 nouveaux mots basés sur votre sélection.
                    </p>
                    <Button className="w-full h-14 bg-white text-emerald-600 hover:bg-emerald-50 font-black rounded-xl shadow-xl transition-transform group-active:scale-95 border-none">
                      LANCER LA SESSION
                    </Button>
                 </div>
                 <Sparkles className="absolute -bottom-6 -right-6 w-32 h-32 text-white/10 rotate-12 group-hover:scale-110 transition-transform" />
              </Card>

              <Card className="p-8 rounded-[2.5rem] border-none bg-zinc-900 text-white shadow-xl relative overflow-hidden">
                 <div className="relative z-10">
                    <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-2">Mode Révision</h4>
                    <p className="text-xs text-zinc-400 mb-6 leading-relaxed">Repassez les mots qui ont besoin d'être consolidés selon l'algorithme SRS.</p>
                    <Button
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white hover:text-black font-black rounded-xl"
                      onClick={() => startTraining(true)}
                    >
                      Réviser mon Vocab
                    </Button>
                 </div>
              </Card>

              <Card className="border-none shadow-xl shadow-zinc-100 rounded-[2.5rem] p-8 bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="text-zinc-400" size={20} />
                  <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Récompenses</h4>
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed italic">
                  Chaque mot maîtrisé vous rapporte +15 XP. Complétez une session de 10 mots pour un bonus !
                </p>
              </Card>
            </div>
          </div>

          {/* Catalogue Section */}
          <section className="mt-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Badge className="bg-emerald-600 rounded-full px-3 py-1 text-white border-none">Niveau {filters.level}</Badge>
                <span className="text-zinc-400">•</span>
                <span className="capitalize text-zinc-500">{filters.category}</span>
              </h2>
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                {catalogue.length} mot{catalogue.length > 1 ? 's' : ''} disponible{catalogue.length > 1 ? 's' : ''}
              </div>
            </div>

            {loadingCatalogue ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i: number) => (
                  <div key={i} className="h-64 rounded-[2rem] bg-zinc-100 animate-pulse" />
                ))}
              </div>
            ) : catalogue.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catalogue.map((item: any) => (
                  <VocabCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-zinc-200 rounded-[2rem] p-12 text-center bg-zinc-50/50">
                <Brain className="mx-auto mb-4 text-zinc-300" size={40} />
                <p className="font-bold text-zinc-500">Aucun mot trouvé pour cette sélection.</p>
              </Card>
            )}
          </section>
        </div>
      </div>
    );
  }

  const current = cards[index];

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-6 lg:px-12 flex flex-col items-center">
      <div className="max-w-4xl w-full flex flex-col items-center">
        <header className="w-full flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                if (activeParcours) {
                   // Logic for parcours back
                }
                setMode("selection");
              }}
              className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-zinc-400 hover:text-emerald-600 transition-colors"
            >
              <ArrowRight className="rotate-180" size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Badge className="bg-emerald-600 rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border-none">
                  {current?.level}
                </Badge>
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest italic">{current?.category}</span>
              </div>
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Mot {index + 1} / {cards.length}</h2>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
             <div className="text-right">
                <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">Maîtrise</div>
                <div className="text-lg font-black text-zinc-900">{sessionMasteredCount} / {cards.length}</div>
             </div>
             <div className="h-10 w-px bg-zinc-200 mx-2" />
             <div className="w-32 h-2 bg-zinc-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((index + 1) / cards.length) * 100}%` }}
                  className="h-full bg-emerald-600"
                />
             </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {step === "presentation" && (
            <motion.div
              key="presentation"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full flex flex-col items-center gap-12"
            >
              <div
                className="relative w-full aspect-[4/3] max-w-lg cursor-pointer perspective-1000 group"
                onClick={() => setFlipped(!flipped)}
              >
                <div className={`
                  relative w-full h-full transition-transform duration-700 transform-style-3d
                  ${flipped ? 'rotate-y-180' : ''}
                `}>
                  <Card className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-12 border-none shadow-2xl shadow-zinc-200 rounded-[3.5rem] group-hover:shadow-emerald-100 transition-all duration-500 bg-white text-center">
                    <h2 className="text-[clamp(1.875rem,4vw+1rem,3rem)] font-black text-zinc-900 mb-8 tracking-tighter">{current?.word}</h2>
                    <Button size="icon" variant="secondary" className="rounded-full h-16 w-16 bg-zinc-50 text-zinc-900 hover:bg-emerald-600 hover:text-white transition-colors">
                      <Volume2 size={32} />
                    </Button>
                    <p className="absolute bottom-12 text-[10px] text-zinc-300 uppercase font-black tracking-[0.4em] italic">Cliquer pour révéler</p>
                  </Card>

                  <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-12 border-none bg-zinc-900 text-white shadow-2xl rounded-[3.5rem] overflow-hidden text-center">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                       <div className="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full blur-3xl" />
                       <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500 rounded-full blur-3xl" />
                    </div>
                    <div className="text-center space-y-10 z-10">
                      <div className="space-y-4">
                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Définition</div>
                        <p className="text-[clamp(1.125rem,2vw+0.75rem,1.5rem)] font-bold leading-tight tracking-tight text-white">{current?.definition}</p>
                      </div>
                      <div className="space-y-4">
                        <div className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em]">Exemple</div>
                        <p className="text-lg italic text-zinc-300 bg-white/5 p-6 rounded-[2rem] border border-white/10 leading-relaxed font-medium">
                          "${current?.example}"
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
              className="w-full max-w-lg mx-auto space-y-8"
            >
              <div className="text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Quelle est la définition de</p>
                <h2 className="text-[clamp(1.5rem,3vw+1rem,2.25rem)] font-black text-zinc-900 tracking-tighter">"{current?.word}" ?</h2>
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
                      ${quizChecked && opt === current?.definition ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : ''}
                      ${quizChecked && selectedOption === opt && opt !== current?.definition ? 'border-rose-500 bg-rose-50 text-rose-900' : ''}
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
                  onClick={() => handleStepComplete(selectedOption === current?.definition)}
                  className={`w-full h-16 text-white font-black rounded-2xl ${selectedOption === current?.definition ? 'bg-emerald-600' : 'bg-red-500'}`}
                >
                  {selectedOption === current?.definition ? "Continuer" : "Réessayer le mot"} <ArrowRight className="ml-2" />
                </Button>
              )}
            </motion.div>
          )}

          {step === "type" && (
            <motion.div
              key="type"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg mx-auto space-y-10"
            >
              <div className="text-center space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Écrivez le mot correspondant à</p>
                <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 italic text-xl font-medium text-zinc-700">
                  "${current?.definition}"
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={typeChecked}
                  placeholder="Tapez le mot ici..."
                  className={`h-20 text-center text-[clamp(1.125rem,2vw+0.75rem,1.5rem)] font-black rounded-2xl border-2 transition-all ${
                    typeChecked
                    ? (validationResult?.isValid ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-rose-500 bg-rose-50 text-rose-900')
                    : 'border-zinc-200 focus:border-emerald-600 bg-white'
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
                        const res = validateVocabResponse(userInput, current?.word);
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
                        La bonne réponse était : <span className="text-xl uppercase underline decoration-2">{current?.word}</span>
                      </div>
                    )}
                    <Button
                      onClick={() => handleStepComplete(validationResult?.isValid || false)}
                      className={`w-full h-16 text-white font-black rounded-2xl ${validationResult?.isValid ? 'bg-emerald-600' : 'bg-red-500'}`}
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>}>
      <VocabCoachContent />
    </Suspense>
  );
}
