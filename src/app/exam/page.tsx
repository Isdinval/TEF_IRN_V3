'use client';

import React, { useState } from 'react';
import { ExamProvider, useExam } from '@/contexts/ExamContext';
import { TimerModal } from '@/components/exam/TimerModal';
import { ExamHeader } from '@/components/exam/ExamHeader';
import { ProgressBar } from '@/components/exam/ProgressBar';
import { QuestionNavigator } from '@/components/exam/QuestionNavigator';
import { QuestionCard } from '@/components/exam/QuestionCard';
import { ResultsScreen } from '@/components/exam/ResultsScreen';
import { SectionTransition } from '@/components/exam/SectionTransition';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Clock, Award, CheckCircle2 } from 'lucide-react';

function ExamContent() {
  const { state } = useExam();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (state.status === 'finished') {
    return <ResultsScreen />;
  }

  if (state.status === 'paused') {
    return <SectionTransition />;
  }

  if (state.status === 'in_progress') {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <ExamHeader />
        <ProgressBar />
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-12">
            <QuestionCard />
          </div>
          <QuestionNavigator />
        </main>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[90vh] p-4 bg-slate-50">
      <Card className="w-full max-w-2xl overflow-hidden rounded-[2.5rem] border-none shadow-2xl shadow-indigo-100">
        <div className="bg-[#002654] p-12 text-center text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck size={120} />
          </div>
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
            <Award size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black mb-2">Simulateur d'Examen Blanc</h1>
          <p className="text-indigo-200 font-medium">
            Entraînez-vous dans les conditions réelles du TEF IRN.
          </p>
        </div>

        <div className="p-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#002654] shadow-sm">
                  <Clock size={18} />
                </div>
                <span className="font-black text-[#002654]">Temps Réel</span>
              </div>
              <p className="text-sm text-slate-500 font-medium">Chronomètre décompteur avec alerte fin de temps.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm">
                  <CheckCircle2 size={18} />
                </div>
                <span className="font-black text-[#002654]">Score Immédiat</span>
              </div>
              <p className="text-sm text-slate-500 font-medium">Correction automatique pour les épreuves QCM.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              size="lg"
              className="w-full h-16 bg-[#002654] hover:bg-slate-800 text-xl font-black rounded-2xl shadow-xl shadow-slate-200"
              onClick={() => setIsModalOpen(true)}
            >
              Lancer le chronomètre
            </Button>
            <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
              Conforme au format officiel 2025
            </p>
          </div>
        </div>

        <TimerModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
      </Card>
    </div>
  );
}

export default function ExamPage() {
  return (
    <ExamProvider>
      <ExamContent />
    </ExamProvider>
  );
}
