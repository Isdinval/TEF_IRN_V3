'use client';

import React from 'react';
import { useExam } from '@/contexts/ExamContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, CheckCircle2, Clock, Coffee, ListChecks, Lightbulb } from 'lucide-react';
import { ExamSectionType } from '@/types/exam';
import { SECTION_BRIEFINGS } from '@/lib/exam-briefings';

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
    <div className="min-h-screen bg-[var(--exam-paper)] flex items-center justify-center p-4">
      <Card className="max-w-xl w-full rounded-sm border border-[var(--exam-line)] shadow-2xl shadow-[var(--exam-ink)]/5 overflow-hidden">
        <div className="bg-[var(--exam-blue)] p-12 text-center text-white">
          <div className="w-20 h-20 bg-white/10 rounded-sm flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>
          {isInitialBriefing ? (
            <>
              <h2 className="font-[family-name:var(--exam-font-display)] text-3xl font-semibold mb-2">Épreuve : {sectionNames[targetSection]}</h2>
              <p className="text-white/70 font-medium">
                Prenez un instant pour lire les consignes avant de commencer.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-[family-name:var(--exam-font-display)] text-3xl font-semibold mb-2">Section Terminée !</h2>
              <p className="text-white/70 font-medium">
                Vous avez complété l'épreuve de {sectionNames[state.section]}.
              </p>
            </>
          )}
        </div>

        <CardContent className="p-12 space-y-8">
          {!isInitialBriefing && (
            <div className="flex items-center gap-6 p-6 bg-white rounded-sm border border-dashed border-[var(--exam-line)]">
              <div className="w-14 h-14 bg-[var(--exam-paper)] rounded-sm flex items-center justify-center shadow-sm text-[var(--exam-blue)]">
                 <Coffee size={28} />
              </div>
              <div>
                <div className="font-[family-name:var(--exam-font-display)] font-semibold text-[var(--exam-ink)]">Prenez une courte pause</div>
                <div className="text-sm text-[var(--exam-ink)]/60 font-medium">Respirez un grand coup avant la suite.</div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="font-[family-name:var(--exam-font-mono)] text-xs font-bold text-[var(--exam-ink)]/45 uppercase tracking-widest">{isInitialBriefing ? 'Cette Épreuve' : 'Épreuve Suivante'}</div>
            <div className="flex items-center justify-between p-6 bg-[var(--exam-blue)]/5 rounded-sm border border-[var(--exam-blue)]/15">
               <div>
                  <div className="font-[family-name:var(--exam-font-display)] font-semibold text-[var(--exam-ink)] text-xl">{sectionNames[targetSection]}</div>
                  <div className="flex items-center gap-3 text-[var(--exam-blue)] text-sm font-bold mt-1">
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {getDuration(targetSection)}</span>
                    {questionCount > 0 && <span>{questionCount} question{questionCount > 1 ? 's' : ''}</span>}
                  </div>
               </div>
               <div className="w-12 h-12 bg-white rounded-sm flex items-center justify-center text-[var(--exam-blue)] shadow-sm font-[family-name:var(--exam-font-mono)] font-bold">
                  {targetSection}
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 font-[family-name:var(--exam-font-mono)] text-xs font-bold text-[var(--exam-ink)]/45 uppercase tracking-widest">
              <ListChecks size={14} /> Consignes
            </div>
            <ul className="space-y-2">
              {briefing.rules.map((rule) => (
                <li key={rule} className="flex items-start gap-2 text-sm text-[var(--exam-ink)]/75">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--exam-ink)]/40 shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 font-[family-name:var(--exam-font-mono)] text-xs font-bold text-[var(--exam-success)]/80 uppercase tracking-widest">
              <Lightbulb size={14} /> Conseils
            </div>
            <ul className="space-y-2">
              {briefing.tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-[var(--exam-ink)]/75">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--exam-success)] shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>

        <CardFooter className="p-12 pt-0 bg-white">
           <Button
             onClick={isInitialBriefing ? beginCurrentSection : startNextSection}
             className="w-full h-16 bg-[var(--exam-blue)] hover:bg-[var(--exam-ink)] rounded-sm text-xl font-bold shadow-xl shadow-[var(--exam-ink)]/10"
           >
             {isInitialBriefing ? "Commencer l'épreuve" : "Commencer l'épreuve suivante"} <ArrowRight className="ml-2" />
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
