"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, Loader2, Rocket, Headphones, BookOpen, Mic, PenLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TOTAL_STEPS = 5;

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
  { id: "A2", label: "Titre de séjour (A2)" },
  { id: "B1", label: "Nationalité (B1)" },
  { id: "B2", label: "Excellence (B2)" },
] as const;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [level, setLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [weakSkill, setWeakSkill] = useState("");
  const [examDate, setExamDate] = useState("");
  const [noExamDateYet, setNoExamDateYet] = useState(false);
  const [availability, setAvailability] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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
        onboarding_completed: true,
      }).eq('id', user.id);

      if (error) {
        alert("Une erreur est survenue, réessayez.");
        setLoading(false);
        return;
      }
      router.push('/tef-irn/dashboard');
    }
    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 font-black text-3xl text-indigo-600">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">M</div>
            LlamaKusi
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="p-8 rounded-3xl border-none shadow-2xl shadow-slate-200">
                <CardHeader className="p-0 mb-8">
                  <Badge className="bg-indigo-600 mb-2">ÉTAPE 1/{TOTAL_STEPS}</Badge>
                  <CardTitle className="text-3xl font-black">Quel est votre niveau actuel ?</CardTitle>
                </CardHeader>
                <div className="grid grid-cols-1 gap-4">
                  {['A1', 'A2', 'B1', 'B2'].map(l => (
                    <button
                      key={l}
                      onClick={() => setLevel(l)}
                      className={`p-6 rounded-2xl border-2 text-left font-bold text-xl transition-all ${level === l ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 hover:border-indigo-200 text-slate-600'}`}
                    >
                      Niveau {l}
                    </button>
                  ))}
                </div>
                <Button
                  disabled={!level}
                  onClick={() => setStep(2)}
                  className="w-full mt-8 h-16 text-xl font-bold bg-indigo-600 rounded-2xl"
                >
                  Continuer <ChevronRight className="ml-2" />
                </Button>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="p-8 rounded-3xl border-none shadow-2xl shadow-slate-200">
                <CardHeader className="p-0 mb-8">
                  <Badge className="bg-indigo-600 mb-2">ÉTAPE 2/{TOTAL_STEPS}</Badge>
                  <CardTitle className="text-3xl font-black">Quel objectif visez-vous ?</CardTitle>
                </CardHeader>
                <div className="grid grid-cols-1 gap-4">
                  {GOAL_OPTIONS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      className={`p-6 rounded-2xl border-2 text-left font-bold text-xl transition-all ${goal === g.id ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 hover:border-indigo-200 text-slate-600'}`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-8">
                  <Button variant="outline" onClick={() => setStep(1)} className="h-16 px-6 rounded-2xl">
                    <ChevronLeft />
                  </Button>
                  <Button
                    disabled={!goal}
                    onClick={() => setStep(3)}
                    className="flex-1 h-16 text-xl font-bold bg-indigo-600 rounded-2xl"
                  >
                    Continuer <ChevronRight className="ml-2" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="p-8 rounded-3xl border-none shadow-2xl shadow-slate-200">
                <CardHeader className="p-0 mb-8">
                  <Badge className="bg-indigo-600 mb-2">ÉTAPE 3/{TOTAL_STEPS}</Badge>
                  <CardTitle className="text-3xl font-black">Quelle compétence vous inquiète le plus ?</CardTitle>
                  <p className="text-slate-500 font-medium mt-2">On adaptera vos premières recommandations en priorité sur ce point.</p>
                </CardHeader>
                <div className="grid grid-cols-1 gap-4">
                  {WEAK_SKILLS.map(s => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setWeakSkill(s.id)}
                        className={`p-6 rounded-2xl border-2 text-left font-bold text-xl transition-all flex items-center gap-4 ${weakSkill === s.id ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 hover:border-indigo-200 text-slate-600'}`}
                      >
                        <Icon size={24} className={weakSkill === s.id ? 'text-indigo-600' : 'text-slate-400'} />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-8">
                  <Button variant="outline" onClick={() => setStep(2)} className="h-16 px-6 rounded-2xl">
                    <ChevronLeft />
                  </Button>
                  <Button
                    disabled={!weakSkill}
                    onClick={() => setStep(4)}
                    className="flex-1 h-16 text-xl font-bold bg-indigo-600 rounded-2xl"
                  >
                    Continuer <ChevronRight className="ml-2" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="p-8 rounded-3xl border-none shadow-2xl shadow-slate-200">
                <CardHeader className="p-0 mb-8">
                  <Badge className="bg-indigo-600 mb-2">ÉTAPE 4/{TOTAL_STEPS}</Badge>
                  <CardTitle className="text-3xl font-black">Avez-vous une date d'examen ?</CardTitle>
                  <p className="text-slate-500 font-medium mt-2">Ça nous permet de calibrer le rythme de votre parcours.</p>
                </CardHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="exam-date" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Date visée</Label>
                    <Input
                      id="exam-date"
                      type="date"
                      className="h-14 border-zinc-200 focus:border-indigo-600 rounded-2xl font-bold transition-all"
                      value={examDate}
                      disabled={noExamDateYet}
                      onChange={(e) => setExamDate(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => { setNoExamDateYet(!noExamDateYet); setExamDate(""); }}
                    className={`w-full p-4 rounded-2xl border-2 text-left font-bold transition-all ${noExamDateYet ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 hover:border-indigo-200 text-slate-600'}`}
                  >
                    Je n'ai pas encore fixé de date
                  </button>
                </div>
                <div className="flex gap-3 mt-8">
                  <Button variant="outline" onClick={() => setStep(3)} className="h-16 px-6 rounded-2xl">
                    <ChevronLeft />
                  </Button>
                  <Button
                    disabled={!noExamDateYet && !examDate}
                    onClick={() => setStep(5)}
                    className="flex-1 h-16 text-xl font-bold bg-indigo-600 rounded-2xl"
                  >
                    Continuer <ChevronRight className="ml-2" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="p-8 rounded-3xl border-none shadow-2xl shadow-slate-200">
                <CardHeader className="p-0 mb-8">
                  <Badge className="bg-indigo-600 mb-2">ÉTAPE 5/{TOTAL_STEPS}</Badge>
                  <CardTitle className="text-3xl font-black">Combien de temps par semaine ?</CardTitle>
                </CardHeader>
                <div className="grid grid-cols-1 gap-4">
                  {AVAILABILITY_OPTIONS.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setAvailability(a.id)}
                      className={`p-6 rounded-2xl border-2 text-left font-bold text-xl transition-all ${availability === a.id ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 hover:border-indigo-200 text-slate-600'}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-8">
                  <Button variant="outline" onClick={() => setStep(4)} className="h-16 px-6 rounded-2xl" disabled={loading}>
                    <ChevronLeft />
                  </Button>
                  <Button
                    disabled={!availability || loading}
                    onClick={handleFinish}
                    className="flex-1 h-16 text-xl font-bold bg-indigo-600 rounded-2xl"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <><Rocket className="mr-2" /> C'est parti !</>}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
