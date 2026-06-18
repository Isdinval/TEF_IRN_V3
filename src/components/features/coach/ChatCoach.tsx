'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import {
  X, Send, Bot, User, Sparkles, Loader2
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

  const chat = useChat({
    api: '/api/coach/chat',
  });

  const messages = chat.messages || [];
  const input = chat.input || '';
  const isLoading = chat.isLoading || false;

  useEffect(() => {
    if (isMounted && initialMessage && isOpen && messages.length === 0 && chat.append) {
      chat.append({ role: 'user', content: initialMessage });
    }
  }, [isMounted, initialMessage, isOpen, messages.length, chat]);

  useEffect(() => {
    if (isMounted && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isMounted, messages, isLoading]);

  if (!isMounted) return null;

  const chatContent = (
    <div className={`flex flex-col h-full bg-white shadow-2xl ${mode === 'popup' ? 'w-[420px] max-h-[650px] rounded-2xl border overflow-hidden' : 'w-full rounded-3xl border-none'}`}>
      <div className="p-4 border-b bg-indigo-600 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5" />
          <h3 className="font-bold text-sm">Coach Maitris</h3>
        </div>
        {mode === 'popup' && (
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 p-4 bg-zinc-50/50">
        <div className="space-y-6 pb-4">
          {messages.length === 0 && <div className="text-center py-12 text-zinc-400 text-sm italic">Posez votre question...</div>}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-zinc-800 border rounded-tl-none'}`}>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{m.content || ''}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && <div className="flex justify-start p-2"><Loader2 className="w-4 h-4 animate-spin text-indigo-600" /></div>}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-white shrink-0">
        <form onSubmit={chat.handleSubmit} className="flex gap-2 items-center">
          <Input value={input} onChange={chat.handleInputChange} placeholder="Écrivez..." className="flex-1 rounded-xl" />
          <Button type="submit" disabled={isLoading || !input.trim()} className="rounded-xl"><Send className="w-4 h-4" /></Button>
        </form>
      </div>
    </div>
  );

  if (mode === 'popup' && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-2xl bg-indigo-600 z-50">
        <Sparkles className="w-6 h-6 text-white" />
      </Button>
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
}
