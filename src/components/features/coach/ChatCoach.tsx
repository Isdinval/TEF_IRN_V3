'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import {
  X, Send, Bot, Sparkles, Loader2, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatCoach({ mode = 'popup', initialMessage }: { mode?: 'popup' | 'full', initialMessage?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append, setMessages } = useChat({
    api: '/api/coach/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Bonjour ! Je suis ton Coach IA Maitris. Je suis là pour t\'aider à préparer ton TEF IRN. Comment puis-je t\'aider aujourd\'hui ?'
      }
    ]
  });

  useEffect(() => {
    if (isMounted && initialMessage && isOpen && messages.length <= 1) {
      append({ role: 'user', content: initialMessage });
    }
  }, [isMounted, initialMessage, isOpen, messages.length, append]);

  useEffect(() => {
    if (isMounted && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isMounted, messages, isLoading]);

  if (!isMounted) return null;

  const chatContent = (
    <div className={`flex flex-col h-full bg-white shadow-2xl ${mode === 'popup' ? 'w-[420px] max-h-[650px] rounded-2xl border border-zinc-200 overflow-hidden' : 'w-full rounded-3xl border-none'}`}>
      <div className="p-4 border-b bg-indigo-600 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">Coach Maitris</h3>
            <p className="text-[10px] text-indigo-100 uppercase tracking-wider font-medium">Assistant Pédagogique</p>
          </div>
        </div>
        {mode === 'popup' && (
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 rounded-full">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 bg-zinc-50/30">
        <div className="p-4 space-y-6 min-h-full">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-indigo-50 text-indigo-950 border border-indigo-100 rounded-tl-none font-medium'
              }`}>
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-indigo-900">
                  <ReactMarkdown>{m.content || ''}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-indigo-50 p-3 rounded-2xl rounded-tl-none border border-indigo-100">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-white shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Posez votre question..."
            className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-10 px-3"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 h-10 w-10 p-0 shrink-0 shadow-lg shadow-indigo-100"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-[10px] text-zinc-400 text-center mt-2">Le Coach peut faire des erreurs. Vérifie les infos importantes.</p>
      </div>
    </div>
  );

  if (mode === 'popup' && !isOpen) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3"
      >
        <div className="bg-white px-4 py-2 rounded-2xl shadow-xl border border-zinc-100 text-indigo-600 font-bold text-sm hidden md:block">
          Besoin d'aide ?
        </div>
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-2xl bg-indigo-600 hover:bg-indigo-700 relative overflow-hidden group"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors"
          />
          <MessageCircle className="w-6 h-6 text-white relative z-10" />
        </Button>
      </motion.div>
    );
  }

  return (
    <div className={mode === 'popup' ? "fixed bottom-24 right-6 z-50" : "h-full"}>
       <AnimatePresence>
         {(isOpen || mode === 'full') && (
           <motion.div
             initial={mode === 'popup' ? { opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' } : {}}
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
}
