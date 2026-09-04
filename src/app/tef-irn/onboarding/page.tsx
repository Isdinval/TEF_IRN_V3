"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, Loader2, Rocket, Headphones, BookOpen, Mic, PenLine, Check, GraduationCap, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TOTAL_STEPS = 6;

const LEVEL_OPTIONS = ["A1", "A2", "B1", "B2"] as const;

const LEARNING_MODE_OPTIONS = [
  { id: "academique", label: "Parcours guidé", sub: "Une leçon, ses exercices, puis la suivante — un programme structuré, étape par étape.", icon: GraduationCap },
  { id: "libre", label: "Entraînement libre", sub: "Vous choisissez vous-même vos leçons, exercices et examens blancs, à votre rythme.", icon: Compass },
] as const;

const WEAK_SKILLS = [
  { id: "comprehension_orale", label: "Compréhension orale", icon: Headphones },
  { id: "comprehension_ecrite", label: "Compréhension écrite", icon: BookOpen },
  { id: "expression_orale", label: "Expression orale", icon: Mic },
  { id: "expression_ecrite", label: "Expression écrite", icon: PenLine },
] as const;

const AVAILABILITY_OPTIONS = [
  { id: "lt_2h", label: "Moins de 2h / semaine" },
  { id: "2_5h", label: "2 à 5h / semaine" },
  { id: "5_10h", label: "5 à 10h / semaine" },
  { id: "gt_10h", label: "Plus de 10h / semaine" },
] as const;

const GOAL_OPTIONS = [
  { id: "A2", label: "Titre de séjour", sub: "Carte de séjour pluriannuelle" },
  { id: "B1", label: "Résidence", sub: "Carte de résident (10 ans)" },
  { id: "B2", label: "Naturalisation", sub: "Nationalité française" },
] as const;

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-indigo-600" : "bg-zinc-100"}`}
        />
      ))}
    </div>
  );
}

function OptionButton({
  selected,
  onClick,
  label,
  sub,
  icon: Icon,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
  icon?: React.ElementType;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
        selected
          ? "border-indigo-600 bg-indigo-50/60"
          : "border-zinc-200 hover:border-indigo-300 hover:bg-zinc-50"
      }`}
    >
      {Icon && <Icon size={18} className={selected ? "text-indigo-600 shrink-0" : "text-zinc-400 shrink-0"} />}
      <span className="flex-1">
        <span className={`block text-sm font-bold ${selected ? "text-indigo-900" : "text-zinc-700"}`}>{label}</span>
        {sub && <span className="block text-xs text-zinc-400 font-medium">{sub}</span>}
      </span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
          selected ? "border-indigo-600 bg-indigo-600" : "border-zinc-300"
        }`}
      >
        {selected && <Check size={12} className="text-white" strokeWidth={3} />}
      </span>
    </button>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [level, setLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [weakSkill, setWeakSkill] = useState("");
  const [examDate, setExamDate] = useState("");
  const [noExamDateYet, setNoExamDateYet] = useState(false);
  const [availability, setAvailability] = useState("");
  const [learningMode, setLearningMode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/tef-irn/login");
        return;
      }
      setCheckingAuth(false);
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFinish = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('profiles').update({
        current_level: level,
        goal_level: goal,
        weak_skill: weakSkill,
        target_exam_date: noExamDateYet ? null : (examDate || null),
        weekly_availability: availability,
        learning_mode: learningMode,
        onboarding_completed: true,
      }).eq('id', user.id);

      if (error) {
        alert("Une erreur est survenue, réessayez.");
        setLoading(false);
        return;
      }
      // Le dashboard garde en cache (React Query) la réponse du RPC
      // get_dashboard_data() obtenue lors du 1er passage sur /dashboard,
      // où onboarding_completed valait encore false. Sans ce removeQueries,
      // le dashboard sert cette réponse obsolète au montage et redirige
      // aussitôt vers /onboarding, avant même que le refetch en arrière-plan
      // ne confirme onboarding_completed:true → boucle infinie perçue.
      queryClient.removeQueries({ queryKey: ["dashboard-data"] });
      router.push('/tef-irn/dashboard');
    }
    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
      </div>
    );
  }

  const stepTransition = { duration: 0.2 };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 overflow-hidden rounded-lg shadow-sm">
              <Image src="/logo.png" alt="LlamaKusi" fill className="object-cover" />
            </div>
            <span className="font-black text-lg tracking-tight text-zinc-900">LlamaKusi</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl shadow-zinc-200/50 p-6">
          <ProgressDots step={step} />

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={stepTransition}>
                <h1 className="text-xl font-black text-zinc-900 mb-1">Quel est votre niveau actuel ?</h1>
                <p className="text-sm text-zinc-400 font-medium mb-5">Une estimation suffit, on affinera ensuite.</p>
                <div className="grid grid-cols-1 gap-2">
                  {LEVEL_OPTIONS.map(l => (
                    <OptionButton key={l} selected={level === l} onClick={() => setLevel(l)} label={`Niveau ${l}`} />
                  ))}
                </div>
                <Button
                  disabled={!level}
                  onClick={() => setStep(2)}
                  className="w-full mt-6 h-11 font-bold bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Continuer <ChevronRight size={16} className="ml-1" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={stepTransition}>
                <h1 className="text-xl font-black text-zinc-900 mb-1">Quel objectif visez-vous ?</h1>
                <p className="text-sm text-zinc-400 font-medium mb-5">Le niveau requis a changé au 1er janvier 2026.</p>
                <div className="grid grid-cols-1 gap-2">
                  {GOAL_OPTIONS.map(g => (
                    <OptionButton key={g.id} selected={goal === g.id} onClick={() => setGoal(g.id)} label={g.label} sub={g.sub} />
                  ))}
                </div>
                <div className="flex gap-2 mt-6">
                  <Button variant="outline" onClick={() => setStep(1)} className="h-11 px-4 rounded-xl border-zinc-200">
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    disabled={!goal}
                    onClick={() => setStep(3)}
                    className="flex-1 h-11 font-bold bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                  >
                    Continuer <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={stepTransition}>
                <h1 className="text-xl font-black text-zinc-900 mb-1">Quelle compétence vous inquiète le plus ?</h1>
                <p className="text-sm text-zinc-400 font-medium mb-5">On priorise vos premières recommandations dessus.</p>
                <div className="grid grid-cols-1 gap-2">
                  {WEAK_SKILLS.map(s => (
                    <OptionButton key={s.id} selected={weakSkill === s.id} onClick={() => setWeakSkill(s.id)} label={s.label} icon={s.icon} />
                  ))}
                </div>
                <div className="flex gap-2 mt-6">
                  <Button variant="outline" onClick={() => setStep(2)} className="h-11 px-4 rounded-xl border-zinc-200">
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    disabled={!weakSkill}
                    onClick={() => setStep(4)}
                    className="flex-1 h-11 font-bold bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                  >
                    Continuer <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={stepTransition}>
                <h1 className="text-xl font-black text-zinc-900 mb-1">Avez-vous une date d'examen ?</h1>
                <p className="text-sm text-zinc-400 font-medium mb-5">Ça calibre le rythme de votre parcours.</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="exam-date" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Date visée</Label>
                    <Input
                      id="exam-date"
                      type="date"
                      className="h-11 border-zinc-200 focus:border-indigo-600 rounded-xl text-sm font-bold"
                      value={examDate}
                      disabled={noExamDateYet}
                      onChange={(e) => setExamDate(e.target.value)}
                    />
                  </div>
                  <OptionButton
                    selected={noExamDateYet}
                    onClick={() => { setNoExamDateYet(!noExamDateYet); setExamDate(""); }}
                    label="Je n'ai pas encore fixé de date"
                  />
                </div>
                <div className="flex gap-2 mt-6">
                  <Button variant="outline" onClick={() => setStep(3)} className="h-11 px-4 rounded-xl border-zinc-200">
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    disabled={!noExamDateYet && !examDate}
                    onClick={() => setStep(5)}
                    className="flex-1 h-11 font-bold bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                  >
                    Continuer <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={stepTransition}>
                <h1 className="text-xl font-black text-zinc-900 mb-1">Combien de temps par semaine ?</h1>
                <p className="text-sm text-zinc-400 font-medium mb-5">Avant-dernière étape.</p>
                <div className="grid grid-cols-1 gap-2">
                  {AVAILABILITY_OPTIONS.map(a => (
                    <OptionButton key={a.id} selected={availability === a.id} onClick={() => setAvailability(a.id)} label={a.label} />
                  ))}
                </div>
                <div className="flex gap-2 mt-6">
                  <Button variant="outline" onClick={() => setStep(4)} className="h-11 px-4 rounded-xl border-zinc-200">
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    disabled={!availability}
                    onClick={() => setStep(6)}
                    className="flex-1 h-11 font-bold bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                  >
                    Continuer <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div key="step6" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={stepTransition}>
                <h1 className="text-xl font-black text-zinc-900 mb-1">Comment voulez-vous apprendre ?</h1>
                <p className="text-sm text-zinc-400 font-medium mb-5">Vous pourrez changer d'avis à tout moment dans les paramètres.</p>
                <div className="grid grid-cols-1 gap-2">
                  {LEARNING_MODE_OPTIONS.map(m => (
                    <OptionButton key={m.id} selected={learningMode === m.id} onClick={() => setLearningMode(m.id)} label={m.label} sub={m.sub} icon={m.icon} />
                  ))}
                </div>
                <div className="flex gap-2 mt-6">
                  <Button variant="outline" onClick={() => setStep(5)} className="h-11 px-4 rounded-xl border-zinc-200" disabled={loading}>
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    disabled={!learningMode || loading}
                    onClick={handleFinish}
                    className="flex-1 h-11 font-bold bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <><Rocket size={16} className="mr-1.5" /> C'est parti</>}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
