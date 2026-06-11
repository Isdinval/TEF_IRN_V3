'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ExamSectionType, ExamSessionState, Question, ExamResult } from '../types/exam';
import { createClient } from '@/lib/supabase';

export interface ExamMetadata {
  id: string;
  label: string;
  duration_co: number;
  duration_ce: number;
  duration_ee: number;
  duration_eo: number;
}

interface ExamContextType {
  state: ExamSessionState;
  questions: Question[];
  allQuestions: Question[];
  currentQuestion: Question;
  activeExam: ExamMetadata | null;
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
  isLoading: boolean;
}

const STORAGE_KEY = 'tef_irn_exam_state';
const RESULTS_KEY = 'tef_irn_session_results';
const HISTORY_KEY = 'tef_irn_exam_history';
const QUESTIONS_CACHE_KEY = 'tef_irn_questions_cache';

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ExamSessionState>({
    section: 'CO',
    currentQuestionIndex: 0,
    answers: {},
    status: 'idle',
    examType: 'single',
  });

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [activeExam, setActiveExam] = useState<ExamMetadata | null>(null);
  const [sessionResults, setSessionResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchExamContent = useCallback(async (examId?: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('exams')
        .select('id, label, duration_co, duration_ce, duration_ee, duration_eo');

      if (examId) {
        query = query.eq('id', examId);
      } else {
        query = query.eq('is_active', true);
      }

      const { data: examData, error: examError } = await query.single();

      if (examError || !examData) {
        throw new Error(examError?.message || 'No active exam found');
      }

      setActiveExam(examData as ExamMetadata);

      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examData.id)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      const mappedQuestions: Question[] = (questionsData || []).map((q: any) => ({
        id: q.id,
        section: q.section as ExamSectionType,
        type: q.type as any,
        instructions: q.instructions,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct_answer,
        audioUrl: q.audio_url,
        maxPlays: q.max_plays,
        transcription: q.transcription,
        texte: q.texte,
        prompt: q.prompt,
        minWords: q.min_words,
        maxTime: q.max_time,
        prepTime: q.prep_time,
        speakTime: q.speak_time,
      }));

      setAllQuestions(mappedQuestions);
      localStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify({
        examId: examData.id,
        questions: mappedQuestions,
        examMetadata: examData,
        timestamp: Date.now()
      }));

      return { examId: examData.id, questions: mappedQuestions };
    } catch (error) {
      console.error("Failed to fetch exam from Supabase:", error);
      return { examId: null, questions: [] };
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Load state from localStorage on mount or fetch active exam
  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedResults = localStorage.getItem(RESULTS_KEY);
      const cachedQuestions = localStorage.getItem(QUESTIONS_CACHE_KEY);

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setState(parsed);

          if (cachedQuestions) {
            const { examId, questions, examMetadata } = JSON.parse(cachedQuestions);
            if (examId === parsed.examId) {
              setAllQuestions(questions);
              setActiveExam(examMetadata);
              setIsLoading(false);
              return;
            }
          }
          await fetchExamContent(parsed.examId);
        } catch (e) {
          console.error("Failed to load exam state", e);
          await fetchExamContent();
        }
      } else {
        // No saved session, but we still want to preload the active exam metadata for the UI
        await fetchExamContent();
      }

      if (savedResults) {
        try {
          setSessionResults(JSON.parse(savedResults));
        } catch (e) {
          console.error("Failed to load session results", e);
        }
      }
    };

    init();
  }, [fetchExamContent]);

  // Save state to localStorage
  useEffect(() => {
    if (state.status !== 'idle' && state.status !== 'finished') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else if (state.status === 'finished') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(RESULTS_KEY);
      localStorage.removeItem(QUESTIONS_CACHE_KEY);
    }
  }, [state]);

  // Save session results to localStorage
  useEffect(() => {
    if (sessionResults.length > 0) {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(sessionResults));
    }
  }, [sessionResults]);

  const questions = allQuestions.filter((q: Question) => q.section === state.section);
  const currentQuestion = questions[state.currentQuestionIndex] || ({} as Question);

  const startExam = async (type: 'single' | 'full', section?: ExamSectionType) => {
    let currentExamId = activeExam?.id;
    let currentQuestions = allQuestions;

    if (!currentExamId) {
      const result = await fetchExamContent();
      currentExamId = result.examId || undefined;
      currentQuestions = result.questions;
    }

    const startSection = type === 'full' ? 'CO' : (section || 'CO');
    const newState: ExamSessionState = {
      examType: type,
      examId: currentExamId,
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
    const sectionQuestions = allQuestions.filter((q: Question) => q.section === section);
    let score = 0;
    const detailAnswers: any[] = [];
    const sectionAnswers: Record<string, string> = {};

    sectionQuestions.forEach((q: Question) => {
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
    setAllQuestions([]);
    // Note: We don't clear activeExam here as we want to keep the metadata for the landing page
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RESULTS_KEY);
    localStorage.removeItem(QUESTIONS_CACHE_KEY);
  };

  return (
    <ExamContext.Provider value={{
      state,
      questions,
      allQuestions,
      currentQuestion,
      activeExam,
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
      isLoading,
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
