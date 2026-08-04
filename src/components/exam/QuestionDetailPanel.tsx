'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, FileText } from 'lucide-react';
import { Question, QCMQuestion, ExamResult } from '@/types/exam';

interface QuestionDetailPanelProps {
  answers: ExamResult['answers'];
  allQuestions: Question[];
}

export function QuestionDetailPanel({ answers, allQuestions }: QuestionDetailPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(answers[0]?.questionId ?? null);

  const getQuestion = (id: string) => allQuestions.find((q) => q.id === id) as QCMQuestion | undefined;
  const selectedQuestion = selectedId ? getQuestion(selectedId) : undefined;
  const hasContext = !!(selectedQuestion?.texte || selectedQuestion?.audioUrl);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <div className="space-y-2">
        {answers.map((ans, idx) => {
          const question = getQuestion(ans.questionId);
          const isSelected = ans.questionId === selectedId;
          return (
            <button
              key={ans.questionId}
              onClick={() => setSelectedId(ans.questionId)}
              className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-colors ${
                isSelected ? 'border-indigo-600 bg-indigo-50/60' : 'border-zinc-100 bg-white hover:border-zinc-200'
              }`}
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
              {ans.isCorrect ? <CheckCircle2 className="text-emerald-600 shrink-0" size={20} /> : <XCircle className="text-rose-600 shrink-0" size={20} />}
            </button>
          );
        })}
      </div>

      <div className="lg:sticky lg:top-4">
        <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-4 min-h-[120px]">
          <div className="text-xs font-black text-zinc-400 uppercase tracking-widest">Contexte de la question</div>

          {!selectedQuestion || !hasContext ? (
            <p className="text-sm text-zinc-400">
              {selectedQuestion ? 'Aucun contexte disponible pour cette question.' : 'Sélectionnez une question pour voir son contexte.'}
            </p>
          ) : (
            <>
              {selectedQuestion.texte && (
                <p className="text-sm leading-relaxed text-zinc-600 italic">{selectedQuestion.texte}</p>
              )}

              {selectedQuestion.audioUrl && (
                <div className="space-y-3">
                  <audio controls className="w-full h-10" src={selectedQuestion.audioUrl} />
                  {selectedQuestion.transcription && (
                    <div className="pt-3 border-t border-zinc-200">
                      <div className="flex items-center gap-1.5 text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                        <FileText size={12} /> Transcription
                      </div>
                      <p className="text-sm leading-relaxed text-zinc-600 italic">{selectedQuestion.transcription}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
