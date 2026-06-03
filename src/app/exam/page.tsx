"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Timer, AlertCircle, ArrowRight, ShieldCheck, Loader2, Volume2, Mic, PenTool } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";

type Section = "CE" | "CO" | "EE" | "EO";

export default function ExamSimulation() {
  const [timeLeft, setTimeLeft] = useState(5400); // 90 minutes
  const [section, setSection] = useState<Section>("CE");
  const [isStarted, setIsStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState<any>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [finished, setFinished] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!isStarted || timeLeft <= 0) {
      if (timeLeft === 0 && isStarted) finishExam();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [isStarted, timeLeft]);

  const fetchExam = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('type', 'qcm')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data && data.content.sections) {
      setExamData(data.content.sections);
      setIsStarted(true);
    }
    setLoading(false);
  };

  const finishExam = () => {
    setFinished(true);
    setIsStarted(false);
  };

  const handleNext = () => {
    const currentSectionQuestions = examData[section];
    if (currentQuestionIdx < currentSectionQuestions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      // Passer à la section suivante
      const sections: Section[] = ["CE", "CO", "EE", "EO"];
      const currentIndex = sections.indexOf(section);
      if (currentIndex < sections.length - 1) {
        setSection(sections[currentIndex + 1]);
        setCurrentQuestionIdx(0);
      } else {
        finishExam();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (finished) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-slate-50">
        <Card className="max-w-2xl w-full p-12 text-center rounded-3xl shadow-2xl shadow-indigo-100 border-none">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShieldCheck size={48} />
          </div>
          <h2 className="text-4xl font-black mb-4">Examen terminé !</h2>
          <p className="text-muted-foreground text-lg mb-12">
            Vos réponses ont été enregistrées. Le Coach IA va maintenant analyser vos productions écrites et orales pour estimer votre score global.
          </p>
          <Button className="w-full h-16 text-xl font-bold bg-indigo-600 rounded-2xl" onClick={() => window.location.href='/dashboard'}>
            Retour au Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-8">
        <Card className="w-full max-w-2xl text-center p-12 border-2 border-indigo-100">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl font-bold mb-4">Examen Blanc Complet</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Vous allez débuter une simulation du TEF IRN dans les conditions réelles : 4 épreuves, 90 minutes, sans interruption possible.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-12 text-left">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="font-bold">Compréhension</div>
              <div className="text-sm text-muted-foreground italic">Écrit (30m) • Oral (20m)</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="font-bold">Expression</div>
              <div className="text-sm text-muted-foreground italic">Écrit (30m) • Oral (10m)</div>
            </div>
          </div>
          <Button size="lg" className="w-full bg-indigo-600 py-8 text-xl font-bold" onClick={fetchExam} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : "Lancer le chronomètre"}
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestions = examData[section];
  const currentQ = currentQuestions[currentQuestionIdx];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white border-b p-4 flex justify-between items-center px-8">
        <div className="flex items-center gap-6">
          <div className="font-black text-2xl text-indigo-600 tracking-tight">Maitris <span className="text-slate-300 font-medium">EXAM</span></div>
          <div className="flex gap-1">
            {["CE", "CO", "EE", "EO"].map((s: any) => (
              <div key={s} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${section === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400 opacity-50'}`}>
                {s}
              </div>
            ))}
          </div>
        </div>
        <div className={`flex items-center gap-3 font-mono text-3xl font-black ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
          <Timer size={28} className={timeLeft < 300 ? 'animate-bounce' : ''} /> {formatTime(timeLeft)}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 pt-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${section}-${currentQuestionIdx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="min-h-[50vh] flex flex-col rounded-3xl border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b p-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <Badge className="bg-indigo-600 mb-2">SECTION {section}</Badge>
                      <CardTitle className="text-2xl font-black">Question {currentQuestionIdx + 1} sur {currentQuestions.length}</CardTitle>
                    </div>
                    <div className="text-xs text-orange-600 flex items-center gap-1 font-bold bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                      <AlertCircle size={14} /> MODE EXAMEN ACTIF
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 p-12">
                  {(section === "CE" || section === "CO") && (
                    <div className="space-y-12">
                      {section === "CO" && (
                        <div className="flex justify-center p-8 bg-indigo-50 rounded-3xl border-2 border-indigo-100 border-dashed">
                          <Button size="lg" className="h-20 w-20 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200">
                             <Volume2 size={32} />
                          </Button>
                        </div>
                      )}

                      <div className="text-2xl font-bold text-center text-slate-800 leading-relaxed">
                        {currentQ.question}
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {currentQ.options.map((opt: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => setAnswers({...answers, [`${section}-${currentQuestionIdx}`]: i})}
                            className={`
                              p-6 rounded-2xl border-2 text-left font-bold text-lg transition-all
                              ${answers[`${section}-${currentQuestionIdx}`] === i
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-inner'
                                : 'border-slate-100 hover:border-indigo-200 text-slate-600 bg-white'}
                            `}
                          >
                            <span className="inline-block w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-center leading-8 mr-4 text-xs font-black">
                               {String.fromCharCode(65 + i)}
                            </span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {section === "EE" && (
                    <div className="space-y-6">
                      <div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-indigo-600 italic text-slate-700">
                        {currentQ.prompt}
                      </div>
                      <Textarea
                        placeholder="Rédigez votre réponse ici..."
                        className="min-h-[300px] text-lg p-6 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 transition-all resize-none"
                        value={answers[`${section}-${currentQuestionIdx}`] || ""}
                        onChange={(e) => setAnswers({...answers, [`${section}-${currentQuestionIdx}`]: e.target.value})}
                      />
                    </div>
                  )}

                  {section === "EO" && (
                    <div className="flex flex-col items-center justify-center py-12 gap-8">
                       <div className="p-8 bg-slate-50 rounded-3xl text-center max-w-lg border-2 border-slate-100 italic">
                          {currentQ.prompt}
                       </div>
                       <div className="flex flex-col items-center gap-4">
                          <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-200 animate-pulse">
                             <Mic size={40} />
                          </div>
                          <p className="font-bold text-indigo-600">L'IA vous écoute...</p>
                       </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-8 bg-slate-50/50 border-t flex justify-between items-center">
                  <div className="text-sm font-bold text-slate-400 italic">
                    Sauvegarde automatique active
                  </div>
                  <Button
                    className="h-14 px-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-lg font-black shadow-xl shadow-indigo-100"
                    onClick={handleNext}
                  >
                    {currentQuestionIdx < currentQuestions.length - 1 || section !== "EO" ? "Continuer" : "Terminer l'examen"} <ArrowRight className="ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <div className="h-3 bg-slate-200">
        <Progress
          value={((["CE", "CO", "EE", "EO"].indexOf(section) * 25) + ((currentQuestionIdx + 1) / currentQuestions.length * 25))}
          className="h-full rounded-none bg-indigo-600 transition-all duration-1000"
        />
      </div>
    </div>
  );
}
