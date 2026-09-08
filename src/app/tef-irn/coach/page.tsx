'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatCoach } from '@/components/features/coach/ChatCoach';
import { Bot, Sparkles, Target, Zap, History, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase';

function CoachPageContent() {
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get('prompt') || undefined;
  const { user } = useAuth();
  const supabase = React.useMemo(() => createClient(), []);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!user) { setSubscriptionTier(null); return; }
    supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setSubscriptionTier(data?.subscription_tier ?? 'free'));
  }, [supabase, user]);

  // undefined = chargement en cours, ne rien afficher pour éviter un flash.
  if (subscriptionTier === undefined) {
    return <div className="flex justify-center h-screen items-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  if (!subscriptionTier || subscriptionTier === 'free') {
    return (
      <div className="max-w-2xl mx-auto p-8 py-24 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center">
          <Lock className="w-7 h-7 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-black text-zinc-900">Le Coach IA n'est pas inclus dans le plan Gratuit</h1>
        <p className="text-zinc-500 font-medium">
          Passez à un abonnement payant pour débloquer l'Assistant LlamaKusi : explications personnalisées, exercices générés à la volée, et suivi de votre progression en temps réel.
        </p>
        <Link href="/tef-irn/pricing">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 rounded-xl shadow-lg shadow-indigo-100">
            Voir les abonnements
          </Button>
        </Link>
      </div>
    );
  }

  return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
              Assistant LlamaKusi
            </h1>
            <p className="text-zinc-500 mt-1 font-medium">Expert pédagogique TEF IRN disponible 24/7.</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 p-3 px-5 rounded-2xl flex items-center gap-4">
             <div className="flex items-center gap-2">
                <Target className="text-indigo-600 w-5 h-5" />
                <span className="text-sm font-bold text-indigo-900">Objectif TEF IRN</span>
             </div>
             <div className="h-4 w-[1px] bg-indigo-200" />
             <div className="flex items-center gap-2">
                <Zap className="text-amber-500 w-5 h-5 fill-amber-500" />
                <span className="text-sm font-bold text-zinc-900">Premium</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 h-[750px]">
            <ChatCoach mode="full" initialMessage={initialMessage} />
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
               <h3 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
                 <Bot className="w-5 h-5 text-indigo-600" />
                 Capacités du Coach
               </h3>
               <ul className="space-y-3">
                 {[
                   "Expliquer des points de grammaire",
                   "Générer des exercices de vocabulaire",
                   "Simuler des questions d'oral",
                   "Analyser vos erreurs fréquentes",
                   "Donner des astuces pour l'examen"
                 ].map((text, i) => (
                   <li key={i} className="text-sm text-zinc-600 flex items-start gap-2 leading-relaxed">
                     <span className="text-indigo-600 mt-1">✓</span> {text}
                   </li>
                 ))}
               </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl text-white shadow-xl">
               <h3 className="font-bold mb-2 flex items-center gap-2">
                 <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                 Mode Ultra-Intelligent
               </h3>
               <p className="text-xs text-indigo-100 leading-relaxed mb-4">
                 Le coach utilise vos données de progrès et vos erreurs passées pour personnaliser ses réponses en temps réel.
               </p>
               <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border-none font-bold rounded-xl shadow-lg">
                 En savoir plus
               </Button>
            </div>

            <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-200/50">
               <h3 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
                 <History className="w-5 h-5 text-zinc-400" />
                 Historique
               </h3>
               <p className="text-xs text-zinc-500 italic">
                 Bientôt disponible : Retrouvez toutes vos conversations passées.
               </p>
            </div>
          </div>
        </div>
      </div>
  );
}

export default function CoachPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center h-screen items-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>}>
      <CoachPageContent />
    </Suspense>
  );
}
