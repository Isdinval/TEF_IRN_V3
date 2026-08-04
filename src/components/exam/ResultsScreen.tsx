'use client';

import React from 'react';
import { useExam } from '@/contexts/ExamContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
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
import { ExamSectionType, ExamResult, Question } from '@/types/exam';
import { WritingFeedback } from '@/types/writing';
import { ORAL_CRITERIA_LABELS } from '@/lib/oral-criteria';
import { computeSkillLevels, computeGlobalLevel, CecrlLevel } from '@/lib/exam-level';

export function ResultsScreen() {
  const { sessionResults, resetExam, allQuestions } = useExam();

  const skillLevels = computeSkillLevels(sessionResults);
  const globalLevel = computeGlobalLevel(skillLevels);

  const getEncouragement = (level: CecrlLevel | undefined) => {
    if (level === 'B2') return "Excellent score ! Vous maîtrisez très bien le niveau visé pour le TEF IRN.";
    if (level === 'B1') return "Bon travail ! Vous êtes sur la bonne voie pour obtenir votre TEF IRN.";
    return "Continuez vos efforts ! La régularité est la clé de la réussite.";
  };

  const sectionLabels: Record<ExamSectionType, string> = {
    CO: 'Compréhension Orale',
    CE: 'Compréhension Écrite',
    EE: 'Expression Écrite',
    EO: 'Expression Orale',
  };

  return (
    <div className="min-h-screen bg-slate-50/30 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center mx-auto mb-6 border-4 border-white ring-4 ring-indigo-100">
            <Trophy size={48} className="text-indigo-600" />
          </div>
          <h1 className="text-4xl font-black text-zinc-900">Résultats de l'examen</h1>
          <p className="text-xl text-zinc-500 font-medium">{getEncouragement(globalLevel?.level)}</p>
        </div>

        <Card className="rounded-[2.5rem] border-none py-0 shadow-2xl shadow-zinc-200/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-10 text-center flex flex-col items-center">
            {globalLevel && (
              <>
                <div className="text-white/70 font-black uppercase tracking-widest text-xs mb-2">
                  Niveau CECRL estimé
                </div>
                <div className="text-7xl font-black mb-2 leading-none">
                  {globalLevel.level}{globalLevel.plus ? '+' : ''}
                </div>
                <p className="text-white/60 text-xs font-medium max-w-sm">
                  Estimation indicative basée sur vos résultats à cet examen blanc — ne remplace pas le score officiel du TEF IRN.
                </p>
              </>
            )}
          </CardHeader>

          <CardContent className="p-10 space-y-10">
            {sessionResults.map((result: ExamResult) => {
              const skillLevel = skillLevels.find((s) => s.section === result.section);
              return (
              <div key={result.section} className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <h3 className="text-xl font-black text-zinc-900">{sectionLabels[result.section]}</h3>
                  <div className="flex items-center gap-2">
                    {skillLevel && (
                      <div className="px-3 py-1 bg-violet-50 rounded-full font-black text-violet-600 text-xs">
                        {skillLevel.level}
                      </div>
                    )}
                    {result.section === 'CO' || result.section === 'CE' ? (
                      <div className="px-4 py-1 bg-zinc-50 rounded-full font-black text-zinc-600">
                        {result.score} / {result.total}
                      </div>
                    ) : result.section === 'EE' && result.writingFeedbacks && Object.keys(result.writingFeedbacks).length > 0 ? (
                      <div className="px-4 py-1 bg-indigo-50 rounded-full font-black text-indigo-600">
                        {Math.round(
                          Object.values(result.writingFeedbacks).reduce((sum, f) => sum + f.score_global, 0) /
                          Object.values(result.writingFeedbacks).length
                        )}/100 (IA)
                      </div>
                    ) : null}
                  </div>
                </div>

                {(result.section === 'CO' || result.section === 'CE') && (
                  <Accordion className="w-full">
                    <AccordionItem value="details" className="border-none">
                      <AccordionTrigger className="hover:no-underline py-4 px-6 bg-zinc-50 rounded-2xl flex justify-between items-center w-full">
                        <span className="font-black text-zinc-600">Détail des réponses</span>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 px-2 space-y-3">
                        {result.answers.map((ans: any, idx: number) => {
                          const q = (allQuestions || []).find((currQ: Question) => currQ.id === ans.questionId);
                          return (
                            <div key={ans.questionId} className="p-4 rounded-2xl border border-zinc-100 flex items-start gap-4">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black ${ans.isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {idx + 1}
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-bold text-zinc-800 mb-1">{(q as any)?.question}</div>
                                <div className="flex flex-wrap gap-4 text-sm font-bold">
                                  <div className="flex items-center gap-1.5 text-zinc-400">
                                    Votre réponse: <span className={ans.isCorrect ? 'text-emerald-600' : 'text-rose-600'}>{ans.userAnswer || 'Aucune'}</span>
                                  </div>
                                  {!ans.isCorrect && (
                                    <div className="flex items-center gap-1.5 text-emerald-600">
                                      Bonne réponse: <span>{ans.correctAnswer}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {ans.isCorrect ? <CheckCircle2 className="text-emerald-600 shrink-0" size={20} /> : <XCircle className="text-rose-600 shrink-0" size={20} />}
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
                        <div key={qId} className="p-6 bg-white border border-zinc-100 rounded-2xl shadow-sm space-y-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-600">
                              <FileText size={20} />
                              <span className="font-black">Production {idx + 1}</span>
                            </div>
                            {feedback && (
                              <div className="text-sm font-black text-indigo-600">
                                {feedback.score_global}/100
                              </div>
                            )}
                          </div>

                          <div className="text-zinc-600 whitespace-pre-wrap italic">
                            "{text || "Aucun texte rédigé."}"
                          </div>

                          {feedback ? (
                            <div className="space-y-4 pt-4 border-t border-dashed border-zinc-200">
                              <div className="flex items-center gap-2 text-indigo-600">
                                <Sparkles size={16} />
                                <span className="text-xs font-black uppercase tracking-widest">Correction IA</span>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div className="p-3 bg-zinc-50 rounded-xl text-center">
                                  <div className="font-black text-zinc-900">{feedback.scores_par_competence.grammaire}</div>
                                  <div className="text-zinc-400">Grammaire</div>
                                </div>
                                <div className="p-3 bg-zinc-50 rounded-xl text-center">
                                  <div className="font-black text-zinc-900">{feedback.scores_par_competence.vocabulaire}</div>
                                  <div className="text-zinc-400">Vocabulaire</div>
                                </div>
                                <div className="p-3 bg-zinc-50 rounded-xl text-center">
                                  <div className="font-black text-zinc-900">{feedback.scores_par_competence.coherence}</div>
                                  <div className="text-zinc-400">Cohérence</div>
                                </div>
                                <div className="p-3 bg-zinc-50 rounded-xl text-center">
                                  <div className="font-black text-zinc-900">{feedback.scores_par_competence.orthographe}</div>
                                  <div className="text-zinc-400">Orthographe</div>
                                </div>
                              </div>

                              <p className="text-sm italic text-zinc-600">"{feedback.conseil_general}"</p>

                              {feedback.liste_des_erreurs?.length > 0 && (
                                <div className="space-y-2">
                                  {feedback.liste_des_erreurs.map((err, i) => (
                                    <div key={i} className="text-sm p-3 bg-zinc-50 rounded-xl">
                                      <span className="line-through text-rose-500/80">{err.texte_original}</span>
                                      {' → '}
                                      <span className="font-black text-emerald-600">{err.texte_corrige}</span>
                                      <p className="text-xs text-zinc-400 mt-1">{err.explication}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-400">
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
                        <div key={qId} className="p-6 bg-white border border-zinc-100 rounded-2xl shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-600">
                              <MessageSquare size={20} />
                              <span className="font-black">Échange {idx + 1}</span>
                            </div>
                            <div className="text-sm font-black text-indigo-600">
                              Niveau {analysis.estimated_level}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            {Object.entries(analysis.scores).map(([key, value]) => (
                              <div key={key} className="p-3 bg-zinc-50 rounded-xl text-center">
                                <div className="font-black text-zinc-900">{value}</div>
                                <div className="text-zinc-400">{ORAL_CRITERIA_LABELS[key as keyof typeof ORAL_CRITERIA_LABELS]}</div>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm italic text-zinc-600">"{analysis.general_comment}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                      <MessageSquare className="mx-auto mb-3 text-indigo-600" size={32} />
                      <div className="font-black text-zinc-900 mb-2">Simulation orale terminée</div>
                      <p className="text-zinc-500 text-sm font-medium">Vous avez suivi les instructions pour les deux sections de l'épreuve orale. Bravo pour cet entraînement !</p>
                    </div>
                  )
                )}
              </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row gap-4">
          <Button
            onClick={resetExam}
            className="flex-1 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-black shadow-xl"
          >
            <RotateCcw className="mr-2" size={20} /> Refaire un examen
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/tef-irn/dashboard'}
            className="flex-1 h-16 rounded-2xl border border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-lg font-black"
          >
            <Home className="mr-2" size={20} /> Retour au tableau de bord
          </Button>
        </div>
      </div>
    </div>
  );
}
