"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
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
  }, [params?.id, searchParams]);


  const categories = ["Administration", "Santé", "Travail", "Logement"];
  const levels = ["A1", "A2", "B1", "B2"];


  const startSpecificCard = async (id: string) => {
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
  };

  const startTraining = async (review: boolean = false, lvl?: string, cat?: string) => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    let query = supabase.from('vocabulary').select('*');

    if (review && user) {
      setIsReviewMode(true);
      const { data: reviews } = await supabase
        .from('user_vocabulary_reviews')
        .select('vocabulary_id')
        .eq('user_id', user.id)
        .lte('next_review_at', new Date().toISOString())
        .limit(10);

      if (reviews && reviews.length > 0) {
        query = query.in('id', reviews.map((r: any) => r.vocabulary_id));
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
  };

  const handleStepComplete = async (isCorrect: boolean) => {
    const current = cards[index];

    if (step === "presentation") {
      prepareQuiz();
      setStep("quiz");
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
        await handleWordMastered();
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
      setSelectedOption(null);
      setQuizChecked(false);
      setUserInput("");
      setTypeChecked(false);
    } else {
      setFinished(true);
    }
  };

  const handleWordMastered = async () => {
    const current = cards[index];
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await updateVocabularySRS(user.id, current.id, true);
      await supabase.rpc('add_xp', { amount: 15 });
    }

    setSessionMasteredCount(prev => prev + 1);

    if (index < cards.length - 1) {
      setIndex(index + 1);
      setStep("presentation");
      setFlipped(false);
      setSelectedOption(null);
      setQuizChecked(false);
    } else {
      setFinished(true);
    }
  };

  const prepareQuiz = () => {
    const current = cards[index];
    const otherDefs = cards
      .filter(c => c.id !== current.id)
      .map(c => c.definition);

    const options = [current.definition, ...otherDefs].sort(() => Math.random() - 0.5).slice(0, 4);
    setQuizOptions(options);
    setSelectedOption(null);
    setQuizChecked(false);
  };

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
                <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-6 uppercase">
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
                    <Sparkles size={16} /> Thématique
                  </label>
                  <div className="grid grid-cols-2 gap-2">
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
              <Card className="p-8 rounded-[2.5rem] border-none bg-emerald-600 text-white shadow-xl shadow-emerald-200/50 flex flex-col justify-center relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4 opacity-80">
                    <Zap size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Mode Classique</span>
                  </div>
                  <h3 className="text-2xl font-black mb-2 uppercase">Prêt à mémoriser ?</h3>
                  <p className="text-sm font-medium opacity-80 mb-6 italic">
                    Une session de 10 mots basée sur vos critères pour un entraînement rapide.
                  </p>
                  <Button
                    onClick={() => startTraining()}
                    disabled={loading}
                    className="w-full h-14 bg-white text-emerald-600 hover:bg-zinc-100 font-black rounded-xl shadow-lg"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "COMMENCER LA SESSION"}
                  </Button>
                </div>
                <Sparkles className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 rotate-12" />
              </Card>

              <Card className="border-none shadow-xl shadow-zinc-200/50 rounded-[2.5rem] p-8 bg-white relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Brain size={28} />
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 mb-2 uppercase tracking-tight leading-none">SRS Intelligent</h3>
                    <p className="text-zinc-500 text-xs font-medium leading-relaxed italic mb-6">
                      Révisez uniquement les mots que vous êtes sur le point d'oublier.
                    </p>
                    <Button
                      onClick={() => startTraining(true)}
                      className="w-full h-14 bg-zinc-900 hover:bg-black text-white font-black rounded-xl shadow-lg"
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
        </div>
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

  const current = cards[index];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <div className="max-w-4xl mx-auto w-full p-6 lg:p-12 space-y-8">
        <header className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => setMode("selection")}
            className="text-zinc-400 hover:text-zinc-900 font-black text-xs uppercase tracking-widest"
          >
            Quitter
          </Button>

          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Maîtrise session</div>
               <div className="text-sm font-black text-emerald-600">{index + 1} / {cards.length}</div>
             </div>
             <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center font-black text-zinc-900">
               {Math.round(((index + 1) / cards.length) * 100)}%
             </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {step === "presentation" && (
            <motion.div
              key="pres"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-12"
            >
              <div
                className="w-full aspect-[4/3] max-w-lg cursor-pointer perspective-1000 group"
                onClick={() => setFlipped(!flipped)}
              >
                <div className={`
                  relative w-full h-full transition-transform duration-700 transform-style-3d
                  ${flipped ? 'rotate-y-180' : ''}
                `}>
                  <Card className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-12 border-none shadow-2xl shadow-zinc-200 rounded-[3.5rem] group-hover:shadow-emerald-100 transition-all duration-500 bg-white text-center">
                    <h2 className="text-6xl font-black text-zinc-900 mb-8 tracking-tighter">{current.word}</h2>
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
              className="w-full max-w-lg mx-auto space-y-8"
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
                  className={`w-full h-16 text-white font-black rounded-2xl ${selectedOption === current.definition ? 'bg-emerald-600' : 'bg-red-500'}`}
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
              className="w-full max-w-lg mx-auto space-y-10"
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
