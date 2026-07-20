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
  MessageSquare,
  Sparkles
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from '@/components/ui/progress';
import { ExamSectionType, ExamResult, Question } from '@/types/exam';
import { WritingFeedback } from '@/types/writing';
import { ORAL_CRITERIA_LABELS } from '@/lib/oral-criteria';

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
    <div className="min-h-screen bg-[var(--exam-paper)] py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center mx-auto mb-6 border-4 border-white ring-4 ring-[var(--exam-blue)]/10">
            <Trophy size={48} className="text-[var(--exam-blue)]" />
          </div>
          <h1 className="font-[family-name:var(--exam-font-display)] text-4xl font-semibold text-[var(--exam-ink)]">Résultats de l'examen</h1>
          <p className="text-xl text-[var(--exam-ink)]/60 font-medium">{getEncouragement(percentage)}</p>
        </div>

        <Card className="rounded-sm border border-[var(--exam-line)] shadow-2xl shadow-[var(--exam-ink)]/5 overflow-hidden">
          <CardHeader className="bg-[var(--exam-blue)] text-white p-10 text-center flex flex-col items-center">
            <div className="font-[family-name:var(--exam-font-mono)] text-6xl font-bold mb-2">{totalScored}/{totalPossible}</div>
            <div className="text-white/70 font-bold uppercase tracking-widest text-sm">Score Global (QCM)</div>
            <div className="mt-8 w-full max-w-md">
              <Progress value={percentage} className="h-3 w-full" />
              <div className="mt-2 font-[family-name:var(--exam-font-mono)] text-xs font-bold text-white/60">{Math.round(percentage)}% DE RÉUSSITE</div>
            </div>
          </CardHeader>

          <CardContent className="p-10 space-y-10">
            {sessionResults.map((result: ExamResult) => (
              <div key={result.section} className="space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--exam-line)] pb-4">
                  <h3 className="font-[family-name:var(--exam-font-display)] text-xl font-semibold text-[var(--exam-ink)]">{sectionLabels[result.section]}</h3>
                  {result.section === 'CO' || result.section === 'CE' ? (
                    <div className="px-4 py-1 bg-[var(--exam-paper)] rounded-full font-[family-name:var(--exam-font-mono)] font-bold text-[var(--exam-ink)]/70">
                      {result.score} / {result.total}
                    </div>
                  ) : result.section === 'EE' && result.writingFeedbacks && Object.keys(result.writingFeedbacks).length > 0 ? (
                    <div className="px-4 py-1 bg-[var(--exam-blue)]/5 rounded-full font-[family-name:var(--exam-font-mono)] font-bold text-[var(--exam-blue)]">
                      {Math.round(
                        Object.values(result.writingFeedbacks).reduce((sum, f) => sum + f.score_global, 0) /
                        Object.values(result.writingFeedbacks).length
                      )}/100 (IA)
                    </div>
                  ) : (
                    <div className="px-4 py-1 bg-[var(--exam-blue)]/5 rounded-full font-bold text-[var(--exam-blue)] text-xs">
                      AUTO-ÉVALUATION
                    </div>
                  )}
                </div>

                {(result.section === 'CO' || result.section === 'CE') && (
                  <Accordion className="w-full">
                    <AccordionItem value="details" className="border-none">
                      <AccordionTrigger className="hover:no-underline py-4 px-6 bg-[var(--exam-paper)] rounded-sm flex justify-between items-center w-full">
                        <span className="font-bold text-[var(--exam-ink)]/70">Détail des réponses</span>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 px-2 space-y-3">
                        {result.answers.map((ans: any, idx: number) => {
                          const q = (allQuestions || []).find((currQ: Question) => currQ.id === ans.questionId);
                          return (
                            <div key={ans.questionId} className="p-4 rounded-sm border border-[var(--exam-line)] flex items-start gap-4">
                              <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 font-[family-name:var(--exam-font-mono)] font-bold ${ans.isCorrect ? 'bg-[var(--exam-success)]/10 text-[var(--exam-success)]' : 'bg-[var(--exam-seal)]/10 text-[var(--exam-seal)]'}`}>
                                {idx + 1}
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-bold text-[var(--exam-ink)]/85 mb-1">{(q as any)?.question}</div>
                                <div className="flex flex-wrap gap-4 text-sm font-bold">
                                  <div className="flex items-center gap-1.5 text-[var(--exam-ink)]/40">
                                    Votre réponse: <span className={ans.isCorrect ? 'text-[var(--exam-success)]' : 'text-[var(--exam-seal)]'}>{ans.userAnswer || 'Aucune'}</span>
                                  </div>
                                  {!ans.isCorrect && (
                                    <div className="flex items-center gap-1.5 text-[var(--exam-success)]">
                                      Bonne réponse: <span>{ans.correctAnswer}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {ans.isCorrect ? <CheckCircle2 className="text-[var(--exam-success)] shrink-0" size={20} /> : <XCircle className="text-[var(--exam-seal)] shrink-0" size={20} />}
                            </div>
                          );
                        })}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {result.section === 'EE' && result.writingProductions && (
                  <div className="space-y-4">
                    {Object.entries(result.writingProductions).map(([qId, text]: [string, string], idx: number) => {
                      const feedback: WritingFeedback | undefined = result.writingFeedbacks?.[qId];
                      return (
                        <div key={qId} className="p-6 bg-white border border-[var(--exam-line)] rounded-sm shadow-sm space-y-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[var(--exam-blue)]">
                              <FileText size={20} />
                              <span className="font-[family-name:var(--exam-font-display)] font-semibold">Production {idx + 1}</span>
                            </div>
                            {feedback && (
                              <div className="font-[family-name:var(--exam-font-mono)] text-sm font-bold text-[var(--exam-blue)]">
                                {feedback.score_global}/100
                              </div>
                            )}
                          </div>

                          <div className="text-[var(--exam-ink)]/70 whitespace-pre-wrap italic">
                            "{text || "Aucun texte rédigé."}"
                          </div>

                          {feedback ? (
                            <div className="space-y-4 pt-4 border-t border-dashed border-[var(--exam-line)]">
                              <div className="flex items-center gap-2 text-[var(--exam-blue)]">
                                <Sparkles size={16} />
                                <span className="font-[family-name:var(--exam-font-mono)] text-xs font-bold uppercase tracking-widest">Correction IA</span>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-[family-name:var(--exam-font-mono)] text-xs">
                                <div className="p-3 bg-[var(--exam-paper)] rounded-sm text-center">
                                  <div className="font-bold text-[var(--exam-ink)]">{feedback.scores_par_competence.grammaire}</div>
                                  <div className="text-[var(--exam-ink)]/45">Grammaire</div>
                                </div>
                                <div className="p-3 bg-[var(--exam-paper)] rounded-sm text-center">
                                  <div className="font-bold text-[var(--exam-ink)]">{feedback.scores_par_competence.vocabulaire}</div>
                                  <div className="text-[var(--exam-ink)]/45">Vocabulaire</div>
                                </div>
                                <div className="p-3 bg-[var(--exam-paper)] rounded-sm text-center">
                                  <div className="font-bold text-[var(--exam-ink)]">{feedback.scores_par_competence.coherence}</div>
                                  <div className="text-[var(--exam-ink)]/45">Cohérence</div>
                                </div>
                                <div className="p-3 bg-[var(--exam-paper)] rounded-sm text-center">
                                  <div className="font-bold text-[var(--exam-ink)]">{feedback.scores_par_competence.orthographe}</div>
                                  <div className="text-[var(--exam-ink)]/45">Orthographe</div>
                                </div>
                              </div>

                              <p className="text-sm italic text-[var(--exam-ink)]/70">"{feedback.conseil_general}"</p>

                              {feedback.liste_des_erreurs?.length > 0 && (
                                <div className="space-y-2">
                                  {feedback.liste_des_erreurs.map((err, i) => (
                                    <div key={i} className="text-sm p-3 bg-[var(--exam-paper)] rounded-sm">
                                      <span className="line-through text-[var(--exam-seal)]/70">{err.texte_original}</span>
                                      {' → '}
                                      <span className="font-bold text-[var(--exam-success)]">{err.texte_corrige}</span>
                                      <p className="text-xs text-[var(--exam-ink)]/50 mt-1">{err.explication}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs font-[family-name:var(--exam-font-mono)] text-[var(--exam-ink)]/40">
                              Correction IA indisponible pour cette production.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {result.section === 'EO' && (
                  result.oralAnalyses && Object.keys(result.oralAnalyses).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(result.oralAnalyses).map(([qId, analysis], idx) => (
                        <div key={qId} className="p-6 bg-white border border-[var(--exam-line)] rounded-sm shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[var(--exam-blue)]">
                              <MessageSquare size={20} />
                              <span className="font-[family-name:var(--exam-font-display)] font-semibold">Échange {idx + 1}</span>
                            </div>
                            <div className="font-[family-name:var(--exam-font-mono)] text-sm font-bold text-[var(--exam-blue)]">
                              Niveau {analysis.estimated_level}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-[family-name:var(--exam-font-mono)] text-xs">
                            {Object.entries(analysis.scores).map(([key, value]) => (
                              <div key={key} className="p-3 bg-[var(--exam-paper)] rounded-sm text-center">
                                <div className="font-bold text-[var(--exam-ink)]">{value}</div>
                                <div className="text-[var(--exam-ink)]/45">{ORAL_CRITERIA_LABELS[key as keyof typeof ORAL_CRITERIA_LABELS]}</div>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm italic text-[var(--exam-ink)]/70">"{analysis.general_comment}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-[var(--exam-paper)] rounded-sm border border-[var(--exam-line)] text-center">
                      <MessageSquare className="mx-auto mb-3 text-[var(--exam-blue)]" size={32} />
                      <div className="font-[family-name:var(--exam-font-display)] font-semibold text-[var(--exam-ink)] mb-2">Simulation orale terminée</div>
                      <p className="text-[var(--exam-ink)]/60 text-sm font-medium">Vous avez suivi les instructions pour les deux sections de l'épreuve orale. Bravo pour cet entraînement !</p>
                    </div>
                  )
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row gap-4">
          <Button
            onClick={resetExam}
            className="flex-1 h-16 rounded-sm bg-[var(--exam-blue)] hover:bg-[var(--exam-ink)] text-lg font-bold shadow-xl"
          >
            <RotateCcw className="mr-2" size={20} /> Refaire un examen
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 h-16 rounded-sm border border-[var(--exam-blue)] text-[var(--exam-blue)] hover:bg-[var(--exam-paper)] text-lg font-bold"
          >
            <Home className="mr-2" size={20} /> Retour au tableau de bord
          </Button>
        </div>
      </div>
    </div>
  );
}
