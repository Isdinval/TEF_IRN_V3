'use client';

import React from 'react';
import { useExam } from '@/contexts/ExamContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, CheckCircle2, Clock, Coffee } from 'lucide-react';
import { ExamSectionType } from '@/types/exam';

const sectionNames: Record<ExamSectionType, string> = {
  CO: 'Compréhension Orale',
  CE: 'Compréhension Écrite',
  EE: 'Expression Écrite',
  EO: 'Expression Orale',
};

const sectionDurations: Record<ExamSectionType, string> = {
  CO: '20 minutes',
  CE: '30 minutes',
  EE: '30 minutes',
  EO: '10 minutes',
};

export function SectionTransition() {
  const { state, startNextSection } = useExam();

  const order: ExamSectionType[] = ['CO', 'CE', 'EE', 'EO'];
  const currentIndex = order.indexOf(state.section);
  const nextSection = order[currentIndex + 1];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-white/5 dark:bg-brand-dark flex items-center justify-center p-4">
      <Card className="max-w-xl w-full rounded-[3.5rem] border-none shadow-2xl shadow-indigo-100 overflow-hidden">
        <div className="bg-[#002654] p-12 text-center text-white">
          <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black mb-2">Section Terminée !</h2>
          <p className="text-indigo-200 font-bold">
            Vous avez complété l'épreuve de {sectionNames[state.section]}.
          </p>
        </div>

        <CardContent className="p-12 space-y-8">
          <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-white/5 dark:bg-brand-dark rounded-[2rem] border-2 border-slate-100 dark:border-white/10 border-dashed">
            <div className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center shadow-sm text-[#002654] dark:text-white">
               <Coffee size={28} />
            </div>
            <div>
              <div className="font-black text-[#002654] dark:text-white">Prenez une courte pause</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 font-bold">Respirez un grand coup avant la suite.</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Épreuve Suivante</div>
            <div className="flex items-center justify-between p-6 bg-indigo-50 rounded-[2rem] border-2 border-indigo-100">
               <div>
                  <div className="font-black text-[#002654] dark:text-white text-xl">{sectionNames[nextSection]}</div>
                  <div className="flex items-center gap-1.5 text-indigo-600 text-sm font-black mt-1">
                    <Clock size={14} /> {sectionDurations[nextSection]}
                  </div>
               </div>
               <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm font-black">
                  {nextSection}
               </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-12 pt-0 bg-white">
           <Button
             onClick={startNextSection}
             className="w-full h-16 bg-[#002654] hover:bg-slate-800 rounded-3xl text-xl font-black shadow-xl shadow-slate-200"
           >
             Commencer l'épreuve suivante <ArrowRight className="ml-2" />
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
