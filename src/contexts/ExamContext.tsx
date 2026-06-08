'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ExamSectionType, ExamSessionState, Question, ExamResult } from '../types/exam';
import { EXAM_QUESTIONS } from '../data/examQuestions';

interface ExamContextType {
  state: ExamSessionState;
  questions: Question[];
  currentQuestion: Question;
  startExam: (type: 'single' | 'full', section?: ExamSectionType) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  setQuestionIndex: (index: number) => void;
  setAnswer: (questionId: string, answer: string) => void;
  finishSection: () => void;
  startNextSection: () => void;
  finishExam: () => void;
  resetExam: () => void;
  sessionResults: ExamResult[];
}

const STORAGE_KEY = 'tef_irn_exam_state';
const RESULTS_KEY = 'tef_irn_session_results';
const HISTORY_KEY = 'tef_irn_exam_history';

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ExamSessionState>({
    section: 'CO',
    currentQuestionIndex: 0,
    answers: {},
    status: 'idle',
    examType: 'single',
  });

  const [sessionResults, setSessionResults] = useState<ExamResult[]>([]);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed);
      } catch (e) {
        console.error("Failed to load exam state", e);
      }
    }

    const savedResults = localStorage.getItem(RESULTS_KEY);
    if (savedResults) {
      try {
        setSessionResults(JSON.parse(savedResults));
      } catch (e) {
        console.error("Failed to load session results", e);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (state.status !== 'idle' && state.status !== 'finished') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else if (state.status === 'finished') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(RESULTS_KEY);
    }
  }, [state]);

  // Save session results to localStorage
  useEffect(() => {
    if (sessionResults.length > 0) {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(sessionResults));
    }
  }, [sessionResults]);

  const questions = EXAM_QUESTIONS.filter(q => q.section === state.section);
  const currentQuestion = questions[state.currentQuestionIndex];

  const startExam = (type: 'single' | 'full', section?: ExamSectionType) => {
    const startSection = type === 'full' ? 'CO' : (section || 'CO');
    const newState: ExamSessionState = {
      examType: type,
      section: startSection,
      selectedSection: section,
      currentQuestionIndex: 0,
      answers: {},
      status: 'in_progress',
      startedAt: Date.now(),
    };
    setState(newState);
    setSessionResults([]);
    localStorage.removeItem(RESULTS_KEY);
  };

  const nextQuestion = () => {
    if (state.currentQuestionIndex < questions.length - 1) {
      setState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
    } else {
      finishSection();
    }
  };

  const prevQuestion = () => {
    if (state.currentQuestionIndex > 0) {
      setState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 }));
    }
  };

  const setQuestionIndex = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setState(prev => ({ ...prev, currentQuestionIndex: index }));
    }
  };

  const setAnswer = (questionId: string, answer: string) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer }
    }));
  };

  const calculateSectionResults = (section: ExamSectionType, answers: Record<string, string>): ExamResult => {
    const sectionQuestions = EXAM_QUESTIONS.filter(q => q.section === section);
    let score = 0;
    const detailAnswers: any[] = [];
    const sectionAnswers: Record<string, string> = {};

    sectionQuestions.forEach(q => {
      const answer = answers[q.id] || '';
      sectionAnswers[q.id] = answer;

      if (q.type === 'audio' || q.type === 'text') {
        const isCorrect = answer === (q as any).correctAnswer;
        if (isCorrect) score++;
        detailAnswers.push({
          questionId: q.id,
          userAnswer: answer,
          isCorrect,
          correctAnswer: (q as any).correctAnswer
        });
      }
    });

    return {
      section,
      score,
      total: sectionQuestions.length,
      answers: detailAnswers,
      writingProductions: section === 'EE' ? sectionAnswers : undefined,
      date: Date.now()
    };
  };

  const finishSection = () => {
    const currentResult = calculateSectionResults(state.section, state.answers);
    setSessionResults(prev => [...prev, currentResult]);

    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    localStorage.setItem(HISTORY_KEY, JSON.stringify([...history, currentResult]));

    if (state.examType === 'full') {
      const order: ExamSectionType[] = ['CO', 'CE', 'EE', 'EO'];
      const currentIndex = order.indexOf(state.section);
      if (currentIndex < order.length - 1) {
        setState(prev => ({
          ...prev,
          status: 'paused',
        }));
      } else {
        finishExam();
      }
    } else {
      finishExam();
    }
  };

  const startNextSection = () => {
    const order: ExamSectionType[] = ['CO', 'CE', 'EE', 'EO'];
    const currentIndex = order.indexOf(state.section);
    if (currentIndex < order.length - 1) {
      const nextSect = order[currentIndex + 1];
      setState(prev => ({
        ...prev,
        section: nextSect,
        currentQuestionIndex: 0,
        status: 'in_progress',
        startedAt: Date.now(),
      }));
    }
  };

  const finishExam = () => {
    setState(prev => ({ ...prev, status: 'finished' }));
  };

  const resetExam = () => {
    setState({
      section: 'CO',
      currentQuestionIndex: 0,
      answers: {},
      status: 'idle',
      examType: 'single',
    });
    setSessionResults([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RESULTS_KEY);
  };

  return (
    <ExamContext.Provider value={{
      state,
      questions,
      currentQuestion,
      startExam,
      nextQuestion,
      prevQuestion,
      setQuestionIndex,
      setAnswer,
      finishSection,
      startNextSection,
      finishExam,
      resetExam,
      sessionResults,
    }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) throw new Error('useExam must be used within an ExamProvider');
  return context;
};
