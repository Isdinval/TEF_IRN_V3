"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Sparkles, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FreeExercisePage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setStep(3);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 font-black text-3xl text-indigo-600 mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">M</div>
            Maitris
          </div>
          <h1 className="text-4xl font-black tracking-tight">L'Exercice Gratuit du Jour</h1>
          <p className="text-muted-foreground text-lg mt-2">Testez votre niveau TEF IRN en 2 minutes.</p>
        </header>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
              <Card className="p-12 rounded-[2rem] border-none shadow-2xl shadow-indigo-100">
                <Badge className="bg-indigo-600 mb-6">COMPRÉHENSION ÉCRITE • A2</Badge>
                <div className="text-2xl font-bold mb-8 leading-relaxed">
                  "Chers voisins, je vous invite à mon anniversaire samedi prochain à 20h au 3ème étage. Merci de confirmer votre présence."
                </div>
                <div className="space-y-3">
                  <p className="font-bold text-slate-500 mb-4 uppercase tracking-widest text-xs">Que demande l'auteur du message ?</p>
                  {["De l'argent", "Une confirmation", "De la nourriture", "Un déménagement"].map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(2)}
                      className="w-full p-6 text-left border-2 border-slate-100 rounded-2xl font-bold text-lg hover:border-indigo-600 hover:bg-indigo-50 transition-all"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="p-12 rounded-[2rem] border-none shadow-2xl shadow-indigo-100 text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-black mb-4">Bonne réponse !</h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Voulez-vous recevoir votre score détaillé et une explication pédagogique complète ?
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="email"
                    required
                    placeholder="Votre email professionnel..."
                    className="w-full h-16 px-6 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 focus:outline-none font-bold"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button className="w-full h-16 text-xl font-black bg-indigo-600 rounded-2xl" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : <><Sparkles className="mr-2" /> Recevoir mon analyse IA</>}
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
               <Card className="p-12 rounded-[2rem] border-none shadow-2xl shadow-indigo-100 text-center bg-indigo-600 text-white">
                  <Send className="mx-auto mb-6 opacity-50" size={60} />
                  <h2 className="text-3xl font-black mb-4">C'est envoyé !</h2>
                  <p className="text-indigo-100 text-lg mb-12">
                    Consultez votre boîte mail. Nous vous avons également envoyé un guide de préparation au TEF IRN.
                  </p>
                  <Button variant="secondary" className="w-full h-16 text-xl font-black rounded-2xl" onClick={() => window.location.href='/login'}>
                    Créer mon compte complet
                  </Button>
               </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
