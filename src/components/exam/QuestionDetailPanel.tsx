'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, FileText, ChevronDown, Lightbulb } from 'lucide-react';
import { Question, QCMQuestion, ExamResult } from '@/types/exam';
import { renderClozeText } from '@/lib/ce-format';

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
        const hasContext = !!(question?.texte || question?.audioUrl || question?.options?.length || question?.subTexts?.length || question?.explanation);
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

                  {question.ceFormat === 'multi_texte' && question.subTexts && question.subTexts.length > 0 && (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {question.subTexts.map((st, i) => (
                        <div key={i} className="p-3 bg-white rounded-xl border border-zinc-200">
                          <div className="text-[10px] font-black uppercase tracking-wide text-indigo-600 mb-1">
                            {st.label}
                          </div>
                          <p className="text-sm leading-relaxed text-zinc-600">{st.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.ceFormat !== 'multi_texte' && question.texte && (
                    <div className="text-sm leading-relaxed text-zinc-600">
                      {question.ceFormat === 'trous' ? (
                        renderClozeText(question.texte, question.highlightGap)
                      ) : question.ceFormat === 'long_admin' || question.ceFormat === 'article_presse' ? (
                        question.texte
                          .split(/\n+/)
                          .filter((p) => p.trim() !== '')
                          .map((paragraph, i) => (
                            <p key={i} className={i > 0 ? 'mt-2' : ''}>
                              {paragraph}
                            </p>
                          ))
                      ) : (
                        <p className="italic">{question.texte}</p>
                      )}
                    </div>
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

                  {question.options && question.options.length > 0 && (
                    <div className="pt-3 border-t border-zinc-200 space-y-1.5">
                      <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Options de réponse</div>
                      {question.options.map((opt) => {
                        const letter = opt.substring(0, 1);
                        const label = opt.substring(3);
                        const isCorrectOption = letter === ans.correctAnswer;
                        const isUserChoice = letter === ans.userAnswer;
                        return (
                          <div
                            key={opt}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium ${
                              isCorrectOption
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isUserChoice
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'text-zinc-500'
                            }`}
                          >
                            <span className="font-black w-4 shrink-0">{letter}</span>
                            <span className="flex-1">{label}</span>
                            {isCorrectOption && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                            {isUserChoice && !isCorrectOption && <XCircle size={14} className="text-rose-600 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {question.explanation && (
                    <div className="pt-3 border-t border-zinc-200">
                      <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">
                        <Lightbulb size={12} /> Explication
                      </div>
                      <p className="text-sm leading-relaxed text-zinc-600">{question.explanation}</p>
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
