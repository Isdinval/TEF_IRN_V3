"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, HelpCircle, ArrowRight, RotateCcw } from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuickQuizProps {
  title: string;
  questions: Question[];
}

const QuickQuiz: React.FC<QuickQuizProps> = ({ title, questions }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;

    if (selectedOption === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
  };

  if (showResults) {
    return (
      <div className="bg-zinc-900 rounded-3xl p-8 text-white">
        <h3 className="text-2xl font-black mb-4">Résultats</h3>
        <p className="text-zinc-400 mb-6 text-lg">
          Vous avez obtenu <span className="text-blue-400 font-black">{score} sur {questions.length}</span> bonnes réponses.
        </p>
        <Button
          onClick={resetQuiz}
          className="bg-white text-black hover:bg-zinc-200 font-bold rounded-xl"
        >
          <RotateCcw size={18} className="mr-2" /> Recommencer
        </Button>
      </div>
    );
  }

  const q = questions[currentQuestion];

  return (
    <div className="bg-white border-2 border-zinc-100 rounded-3xl p-8 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-zinc-900 flex items-center gap-2">
          <HelpCircle className="text-blue-500" />
          {title}
        </h3>
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
          Question {currentQuestion + 1} / {questions.length}
        </span>
      </div>

      <p className="text-lg font-bold text-zinc-800 mb-8">{q.question}</p>

      <div className="space-y-3 mb-8">
        {q.options.map((option, index) => {
          let variant = "border-zinc-100 hover:border-blue-200 hover:bg-blue-50";
          if (isAnswered) {
            if (index === q.correctAnswer) variant = "border-emerald-500 bg-emerald-50 text-emerald-900";
            else if (index === selectedOption) variant = "border-red-500 bg-red-50 text-red-900";
            else variant = "opacity-50 border-zinc-100";
          } else if (selectedOption === index) {
            variant = "border-blue-500 bg-blue-50 text-blue-900";
          }

          return (
            <button
              key={index}
              onClick={() => handleOptionSelect(index)}
              disabled={isAnswered}
              className={`w-full text-left p-4 rounded-2xl border-2 font-medium transition-all flex justify-between items-center ${variant}`}
            >
              {option}
              {isAnswered && index === q.correctAnswer && <Check size={20} className="text-emerald-500" />}
              {isAnswered && index === selectedOption && index !== q.correctAnswer && <X size={20} className="text-red-500" />}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-sm text-zinc-600 leading-relaxed"
          >
            <p className="font-bold text-zinc-900 mb-1">Explication :</p>
            {q.explanation}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end">
        {!isAnswered ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl px-8"
          >
            Valider
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="bg-zinc-900 hover:bg-zinc-800 font-bold rounded-xl px-8"
          >
            {currentQuestion < questions.length - 1 ? 'Suivant' : 'Terminer'} <ArrowRight size={18} className="ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuickQuiz;
