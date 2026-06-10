"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  SkipForward
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

  // Quiz state
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);

  // Type state
  const [userInput, setUserInput] = useState("");
  const [typeChecked, setTypeChecked] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; toleranceApplied: boolean; message?: string } | null>(null);

      const supabase = createClient();

  useEffect(() => {
    const lessonId = searchParams.get('lessonId');
    const topic = searchParams.get('topic');
    const level = searchParams.get('level');

    if (lessonId && topic) {
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
  }, [searchParams]);

  useEffect(() => {
    const lessonId = searchParams.get('lessonId');
    const topic = searchParams.get('topic');

    if (lessonId && topic) {
      // Pour vocab, on pré-remplit les filtres et on lance
      setFilters(prev => ({ ...prev, category: topic }));
      startTraining();
    }
  }, [searchParams]);
  const categories = ["Administration", "Santé", "Travail", "Logement"];
  const levels = ["A1", "A2", "B1", "B2"];

  const startTraining = async (review: boolean = false, lvl?: string, cat?: string) => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    let query = supabase.from('vocabulary').select('*');

    if (review && user) {
      const { data: reviews } = await supabase
        .from('user_vocabulary_reviews')
        .select('vocab_id')
        .eq('user_id', user.id)
        .lte('next_review_at', new Date().toISOString());

      const ids = reviews?.map((r: any) => r.vocab_id) || [];
      if (ids.length === 0) {
        alert("Bravo ! Vous n'avez aucune révision urgente.");
        setLoading(false);
        return;
      }
      query = query.in('id', ids);
      setIsReviewMode(true);
    } else {
      const targetLevel = lvl || filters.level;
      const targetCategory = cat || filters.category;
      const normalizedCategory = targetCategory ? (targetCategory.charAt(0).toUpperCase() + targetCategory.slice(1).toLowerCase()) : targetCategory;
      query = query.eq('level', targetLevel).eq('category', normalizedCategory);
      setIsReviewMode(false);
    }

    const { data } = await query.limit(10);

    if (data && data.length > 0) {
      setCards(data);
      prepareNextWord(data, 0, "presentation");
      setMode("training");
      setFinished(false);
      setSessionMasteredCount(0);
    } else {
      alert("Aucun mot trouvé.");
    }
    setLoading(false);
  };

  const prepareNextWord = (currentCards: Flashcard[], idx: number, nextStep: Step) => {
    setIndex(idx);
    setStep(nextStep);
    setFlipped(false);
    setSelectedOption(null);
    setQuizChecked(false);
    setUserInput("");
    setTypeChecked(false);
    setValidationResult(null);

    if (nextStep === "quiz") {
      // Generate distractors
      const distractors = currentCards
        .filter(c => c.id !== currentCards[idx].id)
        .map(c => c.definition)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const options = [...distractors, currentCards[idx].definition].sort(() => Math.random() - 0.5);
      setQuizOptions(options);
    }
  };

  const handleSkip = () => {
    if (index < cards.length - 1) {
      prepareNextWord(cards, index + 1, "presentation");
    } else {
      finishSession(sessionMasteredCount);
    }
  };

  const handleStepComplete = async (success: boolean) => {
    if (step === "presentation") {
      prepareNextWord(cards, index, "quiz");
    } else if (step === "quiz") {
      if (success) prepareNextWord(cards, index, "type");
      else prepareNextWord(cards, index, "presentation");
    } else if (step === "type") {
      const { data: { user } } = await supabase.auth.getUser();
      if (success) {
        if (user) await updateVocabularySRS(user.id, cards[index].id, true);
        setSessionMasteredCount(prev => prev + 1);

        if (index < cards.length - 1) {
          prepareNextWord(cards, index + 1, "presentation");
        } else {
          finishSession(sessionMasteredCount + 1);
        }
      } else {
        prepareNextWord(cards, index, "presentation");
      }
    }
  };

  const finishSession = async (count: number) => {
    await fetch('/api/exercise-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseId: cards[index].id,
        score: count * 10,
        answers: { type: 'vocab_memrise', mastered: count, category: filters.category, level: filters.level }
      })
    });
    setFinished(true);
  };

  if (mode === "selection") {
    return (
      <div className="max-w-5xl mx-auto p-8 pt-16 min-h-screen">
        <header className="mb-12">
          <Badge className="bg-emerald-600 mb-4 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-none shadow-lg shadow-emerald-100">
            Entraînement Cognitif
          </Badge>
          <h1 className="text-5xl font-black text-zinc-900 tracking-tighter mb-4">
            MAÎTRISE DU <span className="text-emerald-600">VOCABULAIRE</span>
          </h1>
          <p className="text-zinc-500 text-lg font-medium max-w-2xl">
            Apprenez les mots utiles au TEF IRN par la répétition espacée, avec reconnaissance puis production active.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="md:col-span-2 border-none shadow-2xl shadow-zinc-200/50 rounded-[3rem] p-10 bg-white">
            <div className="space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <GraduationCap size={24} />
                  </div>
                  <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Choisir mon niveau</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {levels.map((l) => (
                    <button
                      key={l}
                      onClick={() => setFilters({ ...filters, level: l })}
                      className={`
                        h-20 rounded-2xl border-2 font-black text-xl transition-all
                        ${filters.level === l ? "border-emerald-600 bg-emerald-50 text-emerald-600 shadow-inner" : "border-zinc-100 hover:border-zinc-300 text-zinc-400"}
                      `}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <LayoutGrid size={24} />
                  </div>
                  <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Thématique</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setFilters({ ...filters, category: c })}
                      className={`
                        p-6 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between
                        ${filters.category === c ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-zinc-100 hover:border-zinc-300 text-zinc-500"}
                      `}
                    >
                      {c}
                      {filters.category === c && <div className="w-2 h-2 bg-emerald-600 rounded-full" />}
                    </button>
                  ))}
                </div>
              </section>

              <Button
                className="w-full h-20 bg-zinc-900 hover:bg-zinc-800 text-white rounded-[2rem] text-2xl font-black shadow-2xl shadow-zinc-300 transition-all active:scale-[0.98]"
                onClick={() => startTraining(false)}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : "DÉCOUVRIR DE NOUVEAUX MOTS"}
              </Button>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-2xl shadow-emerald-100 rounded-[2.5rem] p-8 bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                  <Brain size={28} />
                </div>
                <h3 className="text-2xl font-black mb-2 tracking-tight">Révision urgente</h3>
                <p className="text-emerald-50 text-sm font-medium mb-8 leading-relaxed">
                  Votre mémoire vous signale les mots à revoir maintenant. Réactivez-les avant qu'ils ne s'effacent.
                </p>
                <Button
                  onClick={() => startTraining(true)}
                  disabled={loading}
                  className="w-full h-14 bg-white text-emerald-600 hover:bg-emerald-50 font-black rounded-xl shadow-xl border-none"
                >
                  Réviser mon SRS
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
                  Chaque mot passe par une découverte, un QCM de reconnaissance puis une saisie active pour renforcer la mémorisation.
                </p>
                <div className="h-px bg-zinc-200 w-full" />
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase">
                  <Target size={14} className="text-emerald-600" /> Objectif : 10 mots ancrés
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-8">
        <Card className="max-w-md w-full text-center p-12 rounded-[3rem] border-none shadow-2xl shadow-emerald-100 bg-white">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600">
            <Trophy size={48} />
          </div>
          <h2 className="text-4xl font-black mb-4 text-zinc-900 tracking-tight">Félicitations !</h2>
          <p className="text-zinc-500 mb-10 font-medium italic text-lg leading-relaxed">
            Vous avez ancré <span className="text-zinc-900 font-bold">{sessionMasteredCount}</span> nouveaux mots dans votre mémoire à long terme.
          </p>
          <div className="flex flex-col gap-4">
            <Button className="w-full h-16 bg-zinc-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-zinc-200" onClick={() => window.location.href='/dashboard'}>
              Tableau de bord
            </Button>
            <Button variant="ghost" className="text-zinc-400 font-bold hover:text-zinc-900" onClick={() => setMode("selection")}>
              Nouvelle thématique
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const current = cards[index];

  return (
    <div className="max-w-3xl mx-auto p-8 pt-16 min-h-screen flex flex-col">
      <header className="mb-12 flex justify-between items-center">
        <div className="space-y-1">
          <Badge className="bg-emerald-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 border-none shadow-lg shadow-emerald-100">
            {current.category} • {current.level}
          </Badge>
          <h1 className="text-2xl font-black text-zinc-900 uppercase">
             {step === "presentation" && "Phase de Découverte"}
             {step === "quiz" && "Reconnaissance"}
             {step === "type" && "Production Active"}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className="text-xs font-black text-zinc-400 uppercase tracking-widest">
              Mot {index + 1} / {cards.length}
            </div>
            <div className="h-1.5 w-32 bg-zinc-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${((index) / cards.length) * 100}%` }}
                />
            </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-10">
        <AnimatePresence mode="wait">
          {step === "presentation" && (
            <motion.div
              key="pres"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full flex flex-col items-center gap-10"
            >
              <div
                className="relative w-full max-w-lg aspect-[4/3] cursor-pointer perspective-1000 group"
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