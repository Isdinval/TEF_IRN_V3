'use client';

import React from 'react';
import { useExam } from '@/contexts/ExamContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Trophy,
  RotateCcw,
  Home,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquare
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from '@/components/ui/progress';
import { EXAM_QUESTIONS } from '@/data/examQuestions';
import { ExamSectionType, ExamResult, Question } from '@/types/exam';

export function ResultsScreen() {
  const { sessionResults, resetExam, allQuestions } = useExam();

  const totalPossible = sessionResults.reduce((acc: number, res: ExamResult) => acc + res.total, 0);
  const totalScored = sessionResults.reduce((acc: number, res: ExamResult) => acc + res.score, 0);
  const percentage = totalPossible > 0 ? (totalScored / totalPossible) * 100 : 0;

  const getEncouragement = (p: number) => {
    if (p < 50) return "Continuez vos efforts ! La régularité est la clé de la réussite.";
    if (p < 70) return "Bon travail ! Vous êtes sur la bonne voie pour obtenir votre TEF IRN.";
    return "Excellent score ! Vous maîtrisez parfaitement les épreuves QCM.";
  };

  const sectionLabels: Record<ExamSectionType, string> = {
    CO: 'Compréhension Orale',
    CE: 'Compréhension Écrite',
    EE: 'Expression Écrite',
    EO: 'Expression Orale',
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center mx-auto mb-6 border-4 border-white ring-4 ring-indigo-50">
            <Trophy size={48} className="text-indigo-600" />
          </div>
          <h1 className="text-4xl font-black text-[#002654]">Résultats de l'examen</h1>
          <p className="text-xl text-slate-500 font-medium">{getEncouragement(percentage)}</p>
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="bg-[#002654] text-white p-10 text-center flex flex-col items-center">
            <div className="text-6xl font-black mb-2">{totalScored}/{totalPossible}</div>
            <div className="text-indigo-200 font-bold uppercase tracking-widest text-sm">Score Global (QCM)</div>
            <div className="mt-8 w-full max-w-md">
              <Progress value={percentage} className="h-3 w-full" />
              <div className="mt-2 text-xs font-black text-white/60">{Math.round(percentage)}% DE RÉUSSITE</div>
            </div>
          </CardHeader>

          <CardContent className="p-10 space-y-10">
            {sessionResults.map((result: ExamResult) => (
              <div key={result.section} className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <h3 className="text-xl font-black text-[#002654]">{sectionLabels[result.section]}</h3>
                  {result.section === 'CO' || result.section === 'CE' ? (
                    <div className="px-4 py-1 bg-slate-100 rounded-full font-black text-slate-600">
                      {result.score} / {result.total}
                    </div>
                  ) : (
                    <div className="px-4 py-1 bg-indigo-50 rounded-full font-black text-indigo-600 text-xs">
                      AUTO-ÉVALUATION
                    </div>
                  )}
                </div>

                {(result.section === 'CO' || result.section === 'CE') && (
                  <Accordion className="w-full">
                    <AccordionItem value="details" className="border-none">
                      <AccordionTrigger className="hover:no-underline py-4 px-6 bg-slate-50 rounded-2xl flex justify-between items-center w-full">
                        <span className="font-bold text-slate-600">Détail des réponses</span>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 px-2 space-y-3">
                        {result.answers.map((ans: any, idx: number) => {
                          const q = (allQuestions || []).find((currQ: Question) => currQ.id === ans.questionId) || EXAM_QUESTIONS.find((currQ: Question) => currQ.id === ans.questionId);
                          return (
                            <div key={ans.questionId} className="p-4 rounded-xl border border-slate-100 flex items-start gap-4">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black ${ans.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                {idx + 1}
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-bold text-slate-700 mb-1">{(q as any)?.question}</div>
                                <div className="flex flex-wrap gap-4 text-sm font-bold">
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    Votre réponse: <span className={ans.isCorrect ? 'text-emerald-600' : 'text-red-600'}>{ans.userAnswer || 'Aucune'}</span>
                                  </div>
                                  {!ans.isCorrect && (
                                    <div className="flex items-center gap-1.5 text-emerald-600">
                                      Bonne réponse: <span>{ans.correctAnswer}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {ans.isCorrect ? <CheckCircle2 className="text-emerald-500 shrink-0" size={20} /> : <XCircle className="text-red-500 shrink-0" size={20} />}
                            </div>
                          );
                        })}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {result.section === 'EE' && result.writingProductions && (
                  <div className="space-y-4">
                    {Object.entries(result.writingProductions).map(([qId, text]: [string, string], idx: number) => (
                      <div key={qId} className="p-6 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-[#002654]">
                          <FileText size={20} />
                          <span className="font-black">Production {idx + 1}</span>
                        </div>
                        <div className="text-slate-600 whitespace-pre-wrap italic">
                          "{text || "Aucun texte rédigé."}"
                        </div>
                      </div>
                    ))}
                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-amber-800 text-sm font-medium">
                      Note : Les productions écrites ne sont pas corrigées automatiquement dans cette simulation. Nous vous conseillons de les partager avec un tuteur pour une évaluation précise.
                    </div>
                  </div>
                )}

                {result.section === 'EO' && (
                  <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 text-center">
                    <MessageSquare className="mx-auto mb-3 text-indigo-600" size={32} />
                    <div className="font-black text-[#002654] mb-2">Simulation orale terminée</div>
                    <p className="text-slate-500 text-sm font-medium">Vous avez suivi les instructions pour les deux sections de l'épreuve orale. Bravo pour cet entraînement !</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row gap-4">
          <Button
            onClick={resetExam}
            className="flex-1 h-16 rounded-2xl bg-[#002654] hover:bg-slate-800 text-lg font-black shadow-xl"
          >
            <RotateCcw className="mr-2" size={20} /> Refaire un examen
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 h-16 rounded-2xl border-2 border-[#002654] text-[#002654] hover:bg-slate-50 text-lg font-black"
          >
            <Home className="mr-2" size={20} /> Retour au tableau de bord
          </Button>
        </div>
      </div>
    </div>
  );
}
