"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
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
  Zap,
  GraduationCap
} from "lucide-react";
import { updateVocabularySRS } from "@/lib/srs-engine";
import { motion, AnimatePresence } from "framer-motion";
import { validateVocabResponse } from "@/lib/vocab/utils";
import { useParcours } from "@/contexts/ParcoursContext";
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import { useExerciseFilters } from "@/hooks/useExerciseFilters";

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
  const router = useRouter();
  const { filters, setLevel, setCategory } = useExerciseFilters("A2", "Administration");

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>("presentation");
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catalogue, setCatalogue] = useState<any[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
  const [mode, setMode] = useState<"selection" | "training">("selection");
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
  }, [filters.level, filters.category, supabase]);

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
  }, [filters.level, filters.category, supabase]);

  useEffect(() => {
    const cardId = (params?.id as string | undefined) || searchParams.get("id");
    const lessonId = searchParams.get("lessonId");
    const topic = searchParams.get("topic");
    const level = searchParams.get("level");

    if (cardId) {
      startSpecificCard(cardId);
    } else if (lessonId && topic) {
      setLevel(level || filters.level);
      setCategory(topic);

      const timer = setTimeout(() => {
        startTraining();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [params?.id, searchParams, startSpecificCard, startTraining, filters.level, filters.category, setLevel, setCategory]);

  const categoriesList = ["Toutes", "Administration", "Santé", "Travail", "Logement"];
  const levelsList = ["A1", "A2", "B1", "B2"];

  const handleStepComplete = async (isCorrect: boolean) => {
    if (isCorrect && step === "type") {
      setSessionMasteredCount(prev => prev + 1);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateVocabularySRS(user.id, cards[index].id, true);
      }
    }

    if (isCorrect) {
      if (step === "presentation") {
        const otherCards = catalogue.filter(c => c.id !== cards[index].id);
        const distractors = otherCards.sort(() => 0.5 - Math.random()).slice(0, 3).map(c => c.definition);
        const options = [...distractors, cards[index].definition].sort(() => 0.5 - Math.random());
        setQuizOptions(options);
        setStep("quiz");
        setFlipped(false);
        setSelectedOption(null);
        setQuizChecked(false);
      } else if (step === "quiz") {
        setStep("type");
        setUserInput("");
        setTypeChecked(false);
        setValidationResult(null);
      } else if (step === "type") {
        if (index < cards.length - 1) {
          setIndex(index + 1);
          setStep("presentation");
          setFlipped(false);
        } else {
          setFinished(true);
        }
      }
    } else {
      if (step === "quiz") {
        setStep("presentation");
        setFlipped(false);
      } else if (step === "type") {
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
    } else {
      setFinished(true);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-600" size={48} />
    </div>
  );

  if (finished) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 max-w-md w-full">
           <div className="w-32 h-32 bg-emerald-600 rounded-[3rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-emerald-200">
              <Trophy size={48} />
           </div>
           <div className="space-y-2">
              <h2 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter">Session Terminée !</h2>
              <p className="text-zinc-500 font-medium">Vous avez enrichi votre lexique aujourd'hui.</p>
           </div>
           <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-zinc-100 flex items-center justify-around">
              <div className="text-center">
                 <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Maîtrisés</div>
                 <div className="text-3xl font-black text-emerald-600">+{sessionMasteredCount}</div>
              </div>
              <div className="w-px h-12 bg-zinc-100" />
              <div className="text-center">
                 <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Mots vus</div>
                 <div className="text-3xl font-black text-zinc-900">{cards.length}</div>
              </div>
           </div>
           <div className="flex flex-col gap-3">
              <Button onClick={() => setMode("selection")} className="h-16 bg-zinc-900 text-white rounded-2xl font-black text-lg">RETOURNER AU LEXIQUE</Button>
              {nextLesson && (
                <Button onClick={() => nextLesson()} variant="outline" className="h-16 border-2 border-zinc-100 rounded-2xl font-black text-zinc-600">LEÇON SUIVANTE</Button>
              )}
           </div>
        </motion.div>
      </div>
    );
  }

  if (mode === "selection") {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12 lg:px-12">
          <ExerciseLayout
            title="VOTRE LEXIQUE IMMÉDIAT"
            badge="Coach Vocabulaire"
            badgeColor="emerald"
            description="Maîtrisez les mots clés du TEF IRN grâce à notre méthode active de mémorisation en 3 étapes : découverte, association, maîtrise."
          >
            {/* Quick Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-50 p-6 rounded-[2.5rem] border border-zinc-100 space-y-4">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} className="text-emerald-600" /> Votre Niveau
                </div>
                <div className="flex gap-2">
                  {levelsList.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLevel(lvl)}
                      className={`flex-1 h-12 rounded-2xl font-black transition-all ${filters.level === lvl ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-zinc-400 border border-zinc-100 hover:border-zinc-200'}`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-50 p-6 rounded-[2.5rem] border border-zinc-100 space-y-4 lg:col-span-2">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <GraduationCap size={14} className="text-emerald-600" /> Thématiques
                </div>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-6 h-12 rounded-2xl font-black text-sm transition-all ${filters.category === cat ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white text-zinc-400 border border-zinc-100 hover:border-zinc-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div
                onClick={() => startTraining(true)}
                className="bg-emerald-600 p-6 rounded-[2.5rem] text-white space-y-4 shadow-2xl shadow-emerald-100 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                   <Brain size={14} /> Mémoire Active
                </div>
                <h4 className="text-xl font-black leading-tight">Lancer vos révisions SRS</h4>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                    <Zap size={16} /> Spaced Repetition
                 </div>
              </div>
            </div>

            {/* Catalogue */}
            <section className="mt-12">
               <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                  <Badge className="bg-emerald-600 rounded-full px-3 py-1 text-white border-none">Niveau {filters.level}</Badge>
                  <span className="text-zinc-400">•</span>
                  <span className="capitalize text-zinc-500">{filters.category}</span>
                </h2>
              </div>

              {loadingCatalogue ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="aspect-[4/5] rounded-[2rem] bg-zinc-100 animate-pulse" />
                  ))}
                </div>
              ) : catalogue.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {catalogue.map((item) => (
                    <VocabCard
                      key={item.id}
                      item={item}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-zinc-200 rounded-[2.5rem] p-12 text-center bg-zinc-50/50">
                  <Brain className="mx-auto mb-4 text-zinc-300" size={40} />
                  <p className="font-bold text-zinc-500">Aucun mot trouvé dans cette catégorie.</p>
                </Card>
              )}
            </section>
          </ExerciseLayout>
        </div>
      </div>
    );
  }

  const current = cards[index];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <ExerciseLayout
        variant="compact"
        title="VOTRE LEXIQUE IMMÉDIAT"
        badge="Coach Vocabulaire"
        badgeColor="emerald"
        onBack={() => setMode("selection")}
        rightElement={
          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Session</div>
              <div className="text-xl font-black text-zinc-900">{index + 1} / {cards.length}</div>
            </div>
            <div className="h-10 w-px bg-zinc-100" />
            <div className="w-32 h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((index + 1) / cards.length) * 100}%` }}
                className="h-full bg-emerald-600"
              />
            </div>
          </div>
        }
      />

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === "presentation" && (
            <motion.div
              key="presentation"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full max-w-2xl flex flex-col items-center gap-10"
            >
              <div
                className="w-full aspect-[4/3] cursor-pointer perspective-1000 group"
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
                          "{current?.example}"
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
                  "{current?.definition}"
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
