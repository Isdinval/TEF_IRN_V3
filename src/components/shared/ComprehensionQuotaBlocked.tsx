'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { captureEvent } from '@/lib/analytics';

// Écran de blocage du quota freemium de la pratique CE/CO -- même rendu que
// l'écran "Limite quotidienne atteinte" de /tef-irn/practice.
export function ComprehensionQuotaBlocked({ skill, message, catalogueHref }: { skill: 'CE' | 'CO'; message: string; catalogueHref: string }) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6 max-w-md w-full">
        <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center mx-auto">
          <Sparkles size={28} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Limite quotidienne atteinte</h2>
          <p className="text-sm text-zinc-500 font-medium">{message}</p>
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={() => { captureEvent('comprehension_paywall_cta_clicked', { skill }); router.push('/tef-irn/pricing'); }} className="h-12 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 transition-all">Voir les abonnements</Button>
          <Button variant="ghost" onClick={() => router.push(catalogueHref)} className="h-12 text-zinc-400 font-black uppercase tracking-widest text-[10px] hover:text-zinc-900">Retourner au catalogue</Button>
        </div>
      </motion.div>
    </div>
  );
}
