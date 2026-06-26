'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import {
  X, Send, Bot, Sparkles, Loader2, MessageCircle, AlertCircle, BookOpen, GraduationCap, PenTool, Copy, ThumbsUp, ThumbsDown, RotateCcw, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

const SUGGESTIONS_BY_PATH: Record<string, { label: string; prompt: string; icon: any }[]> = {
  '/TEF_IRN/dashboard': [
    { label: "Comment réviser aujourd'hui ?", prompt: "Quelles sont les meilleures révisions à faire aujourd'hui selon mon profil ?", icon: Sparkles },
    { label: "Mes points faibles", prompt: "Quelles sont mes erreurs les plus fréquentes et comment les corriger ?", icon: AlertCircle }
  ],
  '/TEF_IRN/lessons': [
    { label: "Explique-moi cette leçon", prompt: "Peux-tu m'expliquer les points clés de cette leçon de manière simple ?", icon: BookOpen },
    { label: "Donne-moi un exemple", prompt: "Donne-moi 3 exemples concrets d'utilisation de ce point de grammaire.", icon: GraduationCap }
  ],
  '/writing': [
    { label: "Conseils de rédaction", prompt: "Donne-moi des conseils pour améliorer la structure de mes textes au TEF IRN.", icon: PenTool },
    { label: "Vocabulaire utile", prompt: "Quel vocabulaire formel devrais-je utiliser pour la section B de l'expression écrite ?", icon: BookOpen }
  ]
};

const DEFAULT_SUGGESTIONS = [
  { label: "C'est quoi le TEF IRN ?", prompt: "Peux-tu m'expliquer le format de l'examen TEF IRN ?", icon: GraduationCap },
  { label: "Génère un exercice", prompt: "Génère-moi un petit exercice de grammaire rapide pour m'entraîner.", icon: Sparkles }
];

export function ChatCoach({ mode = 'popup', initialMessage }: { mode?: 'popup' | 'full', initialMessage?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [interactionCount, setInteractionCount] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chat = useChat({
    api: '/api/coach/chat',
    body: {
        pageContext: pathname,
        interactionCount: interactionCount
    },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Bonjour ! Je suis ton **Coach TEF**, ton professeur particulier de français. Je suis là pour t\'aider à préparer ton examen TEF IRN avec bienveillance et pédagogie.'
      }
    ],
    onFinish: () => {
        setInteractionCount(prev => prev + 1);
    }
  });

  const { messages, input, handleInputChange, handleSubmit, isLoading, append, error, reload } = chat as any;

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentSuggestions = SUGGESTIONS_BY_PATH[Object.keys(SUGGESTIONS_BY_PATH).find(p => pathname?.startsWith(p)) || ''] || DEFAULT_SUGGESTIONS;

  const chatContent = (
    <div className={`flex flex-col bg-white shadow-2xl overflow-hidden ${
      mode === 'popup'
        ? 'fixed bottom-6 right-6 w-[92vw] md:w-[420px] h-[85vh] max-h-[700px] rounded-2xl border border-zinc-200 z-[100]'
        : 'w-full h-full rounded-3xl border-none'
    }`}>
      {/* Fixed Header */}
      <div className="p-4 bg-indigo-600 text-white flex justify-between items-center shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight text-white">Coach TEF</h3>
            <p className="text-[10px] text-indigo-100 uppercase tracking-widest font-bold">Assistant Pédagogique</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {mode === 'popup' && (
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 rounded-full h-9 w-9">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Area */}
      <ScrollArea className="flex-1 bg-zinc-50/50 h-0">
        <div className="p-4 space-y-6">
          {messages.filter((m: any) => m.content || m.role === 'user').map((m: any, idx: number) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[88%] p-4 rounded-2xl text-sm shadow-sm relative group ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white text-zinc-800 border border-zinc-200 rounded-tl-none font-medium'
              }`}>
                <div className={`prose prose-sm max-w-none prose-p:leading-relaxed ${
                  m.role === 'user'
                    ? 'prose-invert text-white'
                    : 'text-zinc-800 prose-headings:text-indigo-900 prose-strong:text-indigo-700'
                }`}>
                  <ReactMarkdown>{m.content || ''}</ReactMarkdown>
                </div>

                {m.role === 'assistant' && m.id !== 'welcome' && (
                  <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => copyToClipboard(m.content, m.id)}
                        className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-indigo-600 transition-colors"
                        title="Copier"
                    >
                      {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-green-600 transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    {idx === messages.length - 1 && !isLoading && (
                      <button
                        onClick={() => reload()}
                        className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-indigo-600 transition-colors"
                        title="Régénérer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && !messages[messages.length - 1]?.content && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-zinc-200 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-2 p-4 bg-red-50 rounded-xl border border-red-100 text-red-600 text-xs">
              <AlertCircle className="w-5 h-5" />
              <p className="text-center font-medium">Une erreur est survenue lors de la connexion au Coach.</p>
              <Button variant="outline" size="sm" onClick={() => reload()} className="mt-2 text-xs h-8 border-red-200 hover:bg-red-100 text-red-700">
                Réessayer
              </Button>
            </div>
          )}

          {messages.length === 1 && !isLoading && (
            <div className="pt-2 space-y-2">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest pl-1">Suggestions</p>
                <div className="grid grid-cols-1 gap-2">
                    {currentSuggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => append({ role: 'user', content: s.prompt })}
                            className="flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-xl text-left hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
                        >
                            <div className="p-2 bg-zinc-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                <s.icon className="w-4 h-4 text-zinc-500 group-hover:text-indigo-600" />
                            </div>
                            <span className="text-xs font-semibold text-zinc-700 group-hover:text-indigo-900">{s.label}</span>
                        </button>
                    ))}
                </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>

      {/* Fixed Footer */}
      <div className="p-4 border-t bg-white shrink-0">
        <form onSubmit={(e: any) => {
            e.preventDefault();
            handleSubmit(e);
        }} className="flex gap-2 items-center bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Posez votre question au coach..."
            className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-10 px-3"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 h-10 w-10 p-0 shrink-0 shadow-lg shadow-indigo-100"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </form>
        <p className="text-[10px] text-zinc-400 text-center mt-2 font-medium">Coach TEF peut faire des erreurs. Vérifie les infos.</p>
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
        className="fixed bottom-6 right-6 z-[100] flex items-center gap-3"
      >
        <div className="bg-white px-4 py-2.5 rounded-2xl shadow-2xl border border-zinc-100 text-indigo-600 font-extrabold text-sm hidden md:block">
          Besoin d'aide ?
        </div>
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-2xl bg-indigo-600 hover:bg-indigo-700 relative overflow-hidden group border-4 border-white"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-white/30 rounded-full"
          />
          <MessageCircle className="w-7 h-7 text-white relative z-10" />
        </Button>
      </motion.div>
    );
  }

  return (
    <div className={mode === 'popup' ? "" : "h-full"}>
       <AnimatePresence>
         {(isOpen || mode === 'full') && (
           <motion.div
             initial={mode === 'popup' ? { opacity: 0, y: 40, scale: 0.95 } : {}}
             animate={mode === 'popup' ? { opacity: 1, y: 0, scale: 1 } : {}}
             exit={mode === 'popup' ? { opacity: 0, y: 40, scale: 0.95 } : {}}
             className="h-full"
           >
             {chatContent}
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
}
