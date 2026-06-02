"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Timer, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

export default function ExamSimulation() {
  const [timeLeft, setTimeLeft] = useState(5400); // 90 minutes
  const [section, setSection] = useState<"CE" | "CO" | "EE" | "EO">("CE");
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (!isStarted || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [isStarted, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
          <Button size="lg" className="w-full bg-indigo-600 py-8 text-xl font-bold" onClick={() => setIsStarted(true)}>
            Lancer le chronomètre
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white border-b p-4 flex justify-between items-center px-8">
        <div className="flex items-center gap-6">
          <div className="font-bold text-xl text-indigo-600">TEF IRN Simulation</div>
          <div className="flex gap-2">
            {["CE", "CO", "EE", "EO"].map(s => (
              <div key={s} className={`px-3 py-1 rounded text-xs font-bold ${section === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {s}
              </div>
            ))}
          </div>
        </div>
        <div className={`flex items-center gap-2 font-mono text-2xl font-bold ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
          <Timer size={24} /> {formatTime(timeLeft)}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <Card className="max-w-4xl mx-auto min-h-[60vh] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <CardTitle>Section {section} - Question 1 sur 20</CardTitle>
              <div className="text-sm text-orange-600 flex items-center gap-1 font-medium">
                <AlertCircle size={14} /> Ne pas rafraîchir la page
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-12 flex items-center justify-center italic text-muted-foreground text-xl">
            [ Contenu de l'examen en cours de chargement... ]
          </CardContent>
          <footer className="p-6 border-t flex justify-end">
            <Button className="bg-indigo-600 px-8">
              Question suivante <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </footer>
        </Card>
      </main>

      <div className="h-2 bg-slate-200">
        <Progress value={10} className="h-full rounded-none bg-indigo-600" />
      </div>
    </div>
  );
}
