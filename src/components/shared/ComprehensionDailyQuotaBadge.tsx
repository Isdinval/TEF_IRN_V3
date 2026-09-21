'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getComprehensionQuotaStatus } from '@/lib/comprehension-quota-client';

// Badge « sujet gratuit aujourd'hui » des catalogues CE/CO : affiché pour le
// palier Gratuit uniquement (rien pour un palier payant ou en cas d'erreur).
// Le quota est annoncé avant d'être atteint, pas découvert en cliquant.
export function ComprehensionDailyQuotaBadge({ skill }: { skill: 'CE' | 'CO' }) {
  const [status, setStatus] = useState<{ limit: number; used: number } | null>(null);

  useEffect(() => {
    let active = true;
    getComprehensionQuotaStatus(skill).then((s) => { if (active) setStatus(s); });
    return () => { active = false; };
  }, [skill]);

  if (!status) return null;

  const remaining = Math.max(0, status.limit - status.used);
  return remaining > 0 ? (
    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-indigo-600">
      <Sparkles size={12} /> {remaining} sujet{remaining > 1 ? 's' : ''} gratuit{remaining > 1 ? 's' : ''} aujourd'hui
    </div>
  ) : (
    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-zinc-500">
      Sujet du jour utilisé : de retour demain, ou illimité avec un abonnement
    </div>
  );
}
