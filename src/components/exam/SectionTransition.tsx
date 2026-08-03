'use client';

import React, { useMemo } from 'react';
import { useExam } from '@/contexts/ExamContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, CheckCircle2, Clock, ListChecks, Lightbulb } from 'lucide-react';
import { ExamSectionType } from '@/types/exam';
import { SECTION_BRIEFINGS, pickRandomTips } from '@/lib/exam-briefings';

const sectionNames: Record<ExamSectionType, string> = {
  CO: 'Compréhension Orale',
  CE: 'Compréhension Écrite',
  EE: 'Expression Écrite',
  EO: 'Expression Orale',
};

export function SectionTransition() {
  const { state, startNextSection, beginCurrentSection, activeExam, sessionResults, allQuestions } = useExam();

  const order: ExamSectionType[] = ['CO', 'CE', 'EE', 'EO'];
  const currentIndex = order.indexOf(state.section);
  const nextSection = order[currentIndex + 1];

  // Pas encore de résultat = c'est le tout premier écran avant la 1ère épreuve, pas une transition entre 2 épreuves
  const isInitialBriefing = sessionResults.length === 0;
  const targetSection = isInitialBriefing ? state.section : nextSection;
  const briefing = SECTION_BRIEFINGS[targetSection];
  const displayedTips = useMemo(() => pickRandomTips(briefing.tips, 2), [briefing.tips]);
  const questionCount = allQuestions.filter(q => q.section === targetSection).length;

  const getDuration = (section: ExamSectionType) => {
    if (!activeExam) return '20 minutes';
    switch(section) {
      case 'CO': return `${activeExam.duration_co || 20} minutes`;
      case 'CE': return `${activeExam.duration_ce || 30} minutes`;
      case 'EE': return `${activeExam.duration_ee || 30} minutes`;
      case 'EO': return `${activeExam.duration_eo || 10} minutes`;
      default: return '20 minutes';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/30 flex items-center justify-center p-4">
      <Card className="max-w-xl w-full rounded-[2.5rem] border-none shadow-2xl shadow-zinc-200/50 overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-10 text-center text-white">
          {!isInitialBriefing && (
            <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <CheckCircle2 size={30} />
            </div>
          )}
          {isInitialBriefing ? (
            <>
              <h2 className="text-2xl md:text-3xl font-black mb-2">Épreuve : {sectionNames[targetSection]}</h2>
              <p className="text-white/75 font-medium">
                Prenez un instant pour lire les consignes avant de commencer.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-black mb-2">Section terminée !</h2>
              <p className="text-white/75 font-medium">
                Vous avez complété l'épreuve de {sectionNames[state.section]}.
              </p>
            </>
          )}
        </div>

        <CardContent className="p-8 space-y-6">
          <div className="space-y-3">
            {!isInitialBriefing && (
              <div className="text-xs font-black text-zinc-400 uppercase tracking-widest">Épreuve suivante</div>
            )}
            <div className="flex items-center justify-between p-5 bg-indigo-50/60 rounded-2xl">
               <div>
                  <div className="font-black text-zinc-900 text-lg">{sectionNames[targetSection]}</div>
                  <div className="flex items-center gap-3 text-indigo-600 text-sm font-bold mt-1">
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {getDuration(targetSection)}</span>
                    {questionCount > 0 && <span>{questionCount} question{questionCount > 1 ? 's' : ''}</span>}
                  </div>
               </div>
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm font-black shrink-0">
                  {targetSection}
               </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-zinc-900 uppercase tracking-wide">
              <ListChecks size={16} /> Consignes
            </div>
            <ul className="space-y-2">
              {briefing.rules.map((rule) => (
                <li key={rule} className="flex items-start gap-2 text-sm text-zinc-500">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-zinc-300 shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-600 uppercase tracking-wide">
              <Lightbulb size={16} /> Conseils
            </div>
            <ul className="space-y-2">
              {displayedTips.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-zinc-500">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>

        <CardFooter className="p-8 pt-0">
           <Button
             onClick={isInitialBriefing ? beginCurrentSection : startNextSection}
             className="w-full h-14 bg-zinc-900 hover:bg-black rounded-2xl text-base font-black"
           >
             {isInitialBriefing ? "Commencer l'épreuve" : "Commencer l'épreuve suivante"} <ArrowRight className="ml-2" size={18} />
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
