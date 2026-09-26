'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatCoach } from '@/components/features/coach/ChatCoach';
import { Bot, Target, Zap, History, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
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
      .then(({ data }: { data: { subscription_tier: string } | null }) => setSubscriptionTier(data?.subscription_tier ?? 'gratuit'));
  }, [supabase, user]);

  // undefined = chargement en cours, ne rien afficher pour éviter un flash.
  if (subscriptionTier === undefined) {
    return <div className="flex justify-center h-screen items-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  if (!subscriptionTier || subscriptionTier === 'gratuit') {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="max-w-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Lock className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-lg font-black uppercase tracking-tight text-zinc-900">Le Coach IA n'est pas inclus dans le plan Gratuit</h1>
          <p className="text-zinc-500 font-medium">
            Passez à un abonnement payant pour débloquer l'Assistant LlamaKusi : explications personnalisées, exercices générés à la volée, et suivi de votre progression en temps réel.
          </p>
          <Link href="/tef-irn/pricing">
            <Button className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-sm px-8 rounded-full shadow-lg shadow-indigo-200">
              Voir les abonnements
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-zinc-50/50 pb-20">
      <div className="mx-auto max-w-6xl p-4 md:p-10 lg:p-12 space-y-8">
        <PageHeader
          badge="Coach IA"
          title="Assistant"
          highlight="LlamaKusi"
          description="Expert pédagogique TEF IRN disponible 24/7."
          aside={
            <div className="bg-indigo-50 border border-indigo-100 p-3 px-5 rounded-2xl flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="text-indigo-600 w-5 h-5" aria-hidden />
                <span className="text-sm font-bold text-indigo-900">Objectif TEF IRN</span>
              </div>
              <div className="h-4 w-[1px] bg-indigo-200" />
              <div className="flex items-center gap-2">
                <Zap className="text-amber-500 w-5 h-5 fill-amber-500" aria-hidden />
                <span className="text-sm font-bold text-zinc-900">Premium</span>
              </div>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 h-[750px]">
            <ChatCoach mode="full" initialMessage={initialMessage} />
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
               <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 mb-3 flex items-center gap-2">
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

            <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-100">
               <h3 className="text-sm font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                 <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                 Mode Ultra-Intelligent
               </h3>
               <p className="text-sm text-indigo-100 font-medium leading-relaxed mb-4">
                 Le coach utilise vos données de progrès et vos erreurs passées pour personnaliser ses réponses en temps réel.
               </p>
               <Button className="w-full h-11 bg-white text-indigo-600 hover:bg-indigo-50 border-none font-black uppercase tracking-widest text-xs rounded-2xl">
                 En savoir plus
               </Button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
               <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 mb-3 flex items-center gap-2">
                 <History className="w-5 h-5 text-zinc-500" aria-hidden />
                 Historique
               </h3>
               <p className="text-sm font-medium text-zinc-500">
                 Bientôt disponible : Retrouvez toutes vos conversations passées.
               </p>
            </div>
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
