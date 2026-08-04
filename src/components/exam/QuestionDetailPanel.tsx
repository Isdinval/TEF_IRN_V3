'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, FileText, ChevronDown } from 'lucide-react';
import { Question, QCMQuestion, ExamResult } from '@/types/exam';

interface QuestionDetailPanelProps {
  answers: ExamResult['answers'];
  allQuestions: Question[];
}

export function QuestionDetailPanel({ answers, allQuestions }: QuestionDetailPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getQuestion = (id: string) => allQuestions.find((q) => q.id === id) as QCMQuestion | undefined;

  return (
    <div className="space-y-2">
      {answers.map((ans, idx) => {
        const question = getQuestion(ans.questionId);
        const hasContext = !!(question?.texte || question?.audioUrl);
        const isExpanded = hasContext && ans.questionId === expandedId;

        return (
          <div
            key={ans.questionId}
            className={`rounded-2xl border transition-colors overflow-hidden ${isExpanded ? 'border-indigo-600' : 'border-zinc-100'}`}
          >
            <button
              onClick={() => hasContext && setExpandedId(isExpanded ? null : ans.questionId)}
              className={`w-full p-4 text-left flex items-start gap-4 ${hasContext ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black ${ans.isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-zinc-800 mb-1">{question?.question}</div>
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
              <div className="flex items-center gap-2 shrink-0">
                {hasContext && (
                  <ChevronDown
                    size={16}
                    className={`text-zinc-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                )}
                {ans.isCorrect ? <CheckCircle2 className="text-emerald-600" size={20} /> : <XCircle className="text-rose-600" size={20} />}
              </div>
            </button>

            {isExpanded && question && (
              <div className="px-4 pb-4">
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
                  <div className="text-xs font-black text-zinc-400 uppercase tracking-widest">Contexte de la question</div>

                  {question.texte && (
                    <p className="text-sm leading-relaxed text-zinc-600 italic">{question.texte}</p>
                  )}

                  {question.audioUrl && (
                    <div className="space-y-3">
                      <audio controls className="w-full h-10" src={question.audioUrl} />
                      {question.transcription && (
                        <div className="pt-3 border-t border-zinc-200">
                          <div className="flex items-center gap-1.5 text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                            <FileText size={12} /> Transcription
                          </div>
                          <p className="text-sm leading-relaxed text-zinc-600 italic">{question.transcription}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
