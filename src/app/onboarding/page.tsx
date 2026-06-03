"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Star, ChevronRight, Loader2, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleFinish = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        current_level: level,
        goal_level: goal,
      }).eq('id', user.id);
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 font-black text-3xl text-indigo-600">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">M</div>
            Maitris
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="p-8 rounded-3xl border-none shadow-2xl shadow-slate-200">
                <CardHeader className="p-0 mb-8">
                  <Badge className="bg-indigo-600 mb-2">ÉTAPE 1/2</Badge>
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
                  <Badge className="bg-indigo-600 mb-2">ÉTAPE 2/2</Badge>
                  <CardTitle className="text-3xl font-black">Quel objectif visez-vous ?</CardTitle>
                </CardHeader>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'A2', label: 'Titre de séjour (A2)' },
                    { id: 'B1', label: 'Nationalité (B1)' },
                    { id: 'B2', label: 'Excellence (B2)' }
                  ].map(g => (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      className={`p-6 rounded-2xl border-2 text-left font-bold text-xl transition-all ${goal === g.id ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 hover:border-indigo-200 text-slate-600'}`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <Button
                  disabled={!goal || loading}
                  onClick={handleFinish}
                  className="w-full mt-8 h-16 text-xl font-bold bg-indigo-600 rounded-2xl"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><Rocket className="mr-2" /> C'est parti !</>}
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
