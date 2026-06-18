'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { MessageSquare, X, Send, Bot, User, Mic, MicOff, Copy, RotateCcw, Save, Sparkles, BookOpen, Target, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatCoachProps {
  mode?: 'popup' | 'full';
  initialMessage?: string;
}

export const ChatCoach = ({ mode = 'popup', initialMessage }: ChatCoachProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVocal, setIsVocal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // @ts-ignore
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, append } = useChat({
    // @ts-ignore
    api: '/api/coach/chat',
    onResponse: (response: any) => {
      if (response.status === 401) {
        console.error('Unauthorized');
      }
    }
  });

  useEffect(() => {
    if (initialMessage && isOpen && (messages?.length || 0) === 0) {
      append({ role: 'user', content: initialMessage });
    }
  }, [initialMessage, isOpen, (messages?.length || 0), append]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const toggleVocal = () => {
    if (!isVocal) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsVocal(false);
        };
        recognition.start();
        setIsVocal(true);
      }
    } else {
      setIsVocal(false);
    }
  };

  const suggestions = [
    { text: "Mes points faibles ?", icon: <Target className="w-3 h-3" /> },
    { text: "Explique-moi le subjonctif", icon: <BookOpen className="w-3 h-3" /> },
    { text: "Génère un exercice A2", icon: <Sparkles className="w-3 h-3" /> },
  ];

  const chatContent = (
    <div className={`flex flex-col h-full bg-white shadow-2xl ${mode === 'popup' ? 'w-[420px] max-h-[650px] rounded-2xl border overflow-hidden' : 'w-full rounded-3xl border-none'}`}>
      <div className="p-4 border-b bg-indigo-600 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-none">Coach Maitris</h3>
            <p className="text-[10px] text-indigo-200 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Expert TEF IRN
            </p>
          </div>
        </div>
        {mode === 'popup' && (
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 rounded-full">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 p-4 bg-zinc-50/50">
        <div className="space-y-6 pb-4">
          {(messages?.length || 0) === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
               <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
                  <Bot className="w-8 h-8" />
               </div>
               <div className="space-y-1">
                 <h4 className="font-bold text-zinc-900">Bienvenue sur votre Coach IA</h4>
                 <p className="text-sm text-zinc-500 px-8">Posez vos questions sur le TEF, demandez des exercices ou une correction.</p>
               </div>
            </div>
          )}

          {(messages || []).map((m: any) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-indigo-600' : 'bg-white border'}`}>
                  {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-indigo-600" />}
                </div>
                <div className="space-y-2">
                  <div className={`p-4 rounded-2xl text-sm shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-zinc-800 border rounded-tl-none'}`}>
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-indigo-400">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                  {m.tool_calls && m.tool_calls.map((tc: any) => (
                    <div key={tc.id} className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                         <Sparkles className="w-4 h-4" />
                         {tc.function.name === 'generate_exercise' ? "Exercice généré !" : "Outil actif..."}
                      </div>
                      <Button size="sm" variant="outline" className="h-8 text-[10px] font-black uppercase tracking-wider bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                        ESSAYER MAINTENANT
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {isLoading && !(messages || []).some((m: any) => m.role === 'assistant' && m.content) && (
            <div className="flex justify-start">
               <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="bg-white border p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span className="text-xs text-zinc-400 font-medium">Réflexion...</span>
                  </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-white shrink-0 space-y-4">
        {(messages?.length || 0) < 5 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => append({ role: 'user', content: s.text })}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
              >
                {s.icon}
                {s.text}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleVocal}
            className={`shrink-0 ${isVocal ? 'text-red-500 bg-red-50' : 'text-zinc-400 hover:text-indigo-600'}`}
          >
            {isVocal ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Écrivez votre message..."
            className="flex-1 h-11 border-zinc-200 bg-zinc-50 focus-visible:ring-indigo-500 rounded-xl text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="h-11 w-11 bg-indigo-600 hover:bg-indigo-700 shrink-0 rounded-xl shadow-lg shadow-indigo-100"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );

  if (mode === 'popup' && !isOpen) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-2xl bg-indigo-600 hover:bg-indigo-700 hover:scale-105 transition-all group"
        >
          <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
        </Button>
      </motion.div>
    );
  }

  return (
    <div className={mode === 'popup' ? "fixed bottom-24 right-6 z-50" : "h-full"}>
       <AnimatePresence>
         {(isOpen || mode === 'full') && (
           <motion.div
             initial={mode === 'popup' ? { opacity: 0, y: 20, scale: 0.95 } : {}}
             animate={mode === 'popup' ? { opacity: 1, y: 0, scale: 1 } : {}}
             exit={mode === 'popup' ? { opacity: 0, y: 20, scale: 0.95 } : {}}
             className="h-full"
           >
             {chatContent}
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
};
