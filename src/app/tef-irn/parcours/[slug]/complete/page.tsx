"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getParcoursBySlug, getParcoursById, Parcours } from "@/lib/parcours";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  Trophy,
  ArrowRight,
  Sparkles,
  Target,
  Layout,
  TrendingUp,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { useParcours } from "@/contexts/ParcoursContext";

export default function ParcoursCompletePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [loading, setLoading] = useState(true);
  const [parcours, setParcours] = useState<Parcours | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const { exitParcours } = useParcours();

  useEffect(() => {
    async function fetchData() {
      let p = await getParcoursBySlug(slug, supabase);

      // Backward compatibility
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!p && uuidRegex.test(slug)) {
        p = await getParcoursById(slug, supabase);
        if (p) {
          router.replace(`/tef-irn/parcours/${p.slug}/complete`);
          return;
        }
      }

      setParcours(p);
      setLoading(false);
    }
    fetchData();
  }, [slug, supabase, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!parcours) return <div className="p-8 text-center">Parcours non trouvé.</div>;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 py-12 lg:p-12 overflow-hidden">
      <div className="max-w-3xl w-full text-center space-y-12 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10" />

        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 100 }}
          className="relative inline-block"
        >
          <div className="w-40 h-40 bg-white rounded-[3rem] shadow-2xl shadow-indigo-100 flex items-center justify-center relative z-10 border-4 border-indigo-50">
            <Trophy size={80} className="text-orange-400 drop-shadow-lg" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-4 -right-4 bg-indigo-600 text-white p-3 rounded-2xl shadow-lg"
          >
            <Sparkles size={24} />
          </motion.div>
        </motion.div>

        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight"
          >
            PARCOURS <span className="text-indigo-600 uppercase">TERMINÉ !</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl lg:text-2xl font-medium text-slate-500 max-w-xl mx-auto"
          >
            Félicitations ! Vous avez complété avec succès le parcours de
            <span className="text-zinc-900 font-black italic"> {parcours.category} {parcours.level}</span>.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="p-6 rounded-3xl border-none shadow-xl shadow-zinc-200/50 bg-white">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Target size={20} />
            </div>
            <div className="text-2xl font-black text-zinc-900">100%</div>
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Réussite</div>
          </Card>

          <Card className="p-6 rounded-3xl border-none shadow-xl shadow-zinc-200/50 bg-white">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={20} />
            </div>
            <div className="text-2xl font-black text-zinc-900">+500</div>
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">XP Bonus</div>
          </Card>

          <Card className="p-6 rounded-3xl border-none shadow-xl shadow-zinc-200/50 bg-white">
            <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Clock size={20} />
            </div>
            <div className="text-2xl font-black text-zinc-900">Terminé</div>
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Statut</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <Button
            onClick={() => router.push("/tef-irn/parcours")}
            size="lg"
            className="w-full h-20 text-xl font-black rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
          >
            Choisir mon prochain parcours <ArrowRight size={24} />
          </Button>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push("/tef-irn/dashboard")}
              variant="outline"
              size="lg"
              className="flex-1 h-16 rounded-2xl border-2 border-zinc-200 font-black uppercase text-xs tracking-widest hover:bg-zinc-100 transition-all"
            >
              <Layout className="mr-2" size={18} /> Retour au Dashboard
            </Button>

            <Button
              onClick={exitParcours}
              variant="ghost"
              size="lg"
              className="flex-1 h-16 rounded-2xl font-black uppercase text-xs tracking-widest text-zinc-400 hover:text-red-500 transition-all"
            >
              Mode libre
            </Button>
          </div>
        </motion.div>

        <div className="pt-8 text-indigo-300 font-medium italic">
          "L'éducation est l'arme la plus puissante pour changer le monde."
        </div>
      </div>
    </div>
  );
}
