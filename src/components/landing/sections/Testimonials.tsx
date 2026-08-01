"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FileText, Clock, Mic, Layers, Info } from "lucide-react";
import { Card } from "@/components/ui/card";

// Mêmes accents que la section Features, pour une cohérence visuelle sur toute la page
const ACCENT_STYLES: Record<string, { bar: string; iconBg: string; needText: string }> = {
  blue: { bar: "from-blue-500 to-blue-400", iconBg: "bg-blue-500", needText: "text-blue-600 dark:text-blue-400" },
  purple: { bar: "from-purple-500 to-purple-400", iconBg: "bg-purple-500", needText: "text-purple-600 dark:text-purple-400" },
  amber: { bar: "from-amber-500 to-amber-400", iconBg: "bg-amber-500", needText: "text-amber-600 dark:text-amber-400" },
  emerald: { bar: "from-emerald-500 to-emerald-400", iconBg: "bg-emerald-500", needText: "text-emerald-600 dark:text-emerald-400" },
};

const personas = [
  {
    flag: "pe",
    name: "Maria",
    role: "Ingénieure informatique à Lyon · Naturalisation B2",
    image: "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/landing_page/Maria_Ingenieur_informatique_Lyon.webp",
    text: "Je comprends tout ce qu'on me dit au travail, mais quand il faut écrire une lettre officielle ou parler à quelqu'un que je ne connais pas… je bloque complètement.",
    need: "Coach à l'écrit et à l'oral, dans un registre formel",
    icon: <FileText size={16} />,
    accent: "blue",
  },
  {
    flag: "ma",
    name: "Ahmed",
    role: "Chef d'équipe BTP à Nantes · Carte de résident B1",
    image: "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/landing_page/Ahmed_Chef_Equipe_BTP_Nantes.webp",
    text: "J'ai pas le temps d'aller à des cours le soir. Il me faut quelque chose que je peux faire sur mon téléphone, à mon rythme.",
    need: "Disponible le soir, entre 21h et 23h",
    icon: <Clock size={16} />,
    accent: "purple",
  },
  {
    flag: "sn",
    name: "Fatou",
    role: "Assistante administrative en mairie à Bordeaux · Naturalisation B2",
    image: "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/landing_page/Fatou_Assistante_Administrative_Mairie_Bordeaux.webp",
    text: "J'ai besoin de quelqu'un qui me corrige vraiment, pas juste qui me dise ce qui est faux.",
    need: "Correction écrite détaillée, pas juste un score",
    icon: <Mic size={16} />,
    accent: "amber",
  },
  {
    flag: "dz",
    name: "Karim",
    role: "Comptable à Toulouse · Naturalisation B2",
    image: "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/landing_page/Karim_comptable_Toulouse.webp",
    text: "Je devais réussir l'Examen Civique et le TEF IRN la même année. Avoir les deux parcours au même endroit m'a fait gagner un temps fou.",
    need: "Un seul coach pour l'Examen Civique et le TEF IRN",
    icon: <Layers size={16} />,
    accent: "emerald",
  },
];

export function Testimonials() {
  return (
    <section className="py-32 bg-white dark:bg-brand-dark overflow-hidden px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 dark:bg-brand-gold/10 border border-brand-blue/20 dark:border-brand-gold/20 text-brand-blue dark:text-brand-gold text-[10px] font-black uppercase tracking-wider mb-6">
            <Info size={12} />
            <span>Exemples de parcours illustratifs</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-slate-900 dark:text-white">
            Vous vous <span className="text-brand-blue dark:text-brand-gold">reconnaissez</span> ?
          </h2>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-xl">
            Des profils-types, avec des contraintes réelles de candidats à la naturalisation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {personas.map((p, i) => {
            const accent = ACCENT_STYLES[p.accent];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full p-8 rounded-[2rem] border-none shadow-xl bg-slate-50 dark:bg-white/5 group relative overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                  {/* Barre d'accent colorée en haut, comme les cartes Features */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${accent.bar}`} />

                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-6 shadow-lg transition-transform group-hover:scale-[1.02] duration-300">
                    <Image
                      src={p.image}
                      alt={`Portrait aquarelle de ${p.name}, ${p.role}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 45vw, 280px"
                    />
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg text-slate-900 dark:text-white leading-tight">{p.name}</span>
                      <img
                        src={`https://flagcdn.com/w40/${p.flag}.png`}
                        srcSet={`https://flagcdn.com/w80/${p.flag}.png 2x`}
                        alt=""
                        width={20}
                        height={15}
                        className="rounded-sm shadow-sm shrink-0"
                      />
                    </div>
                    <div className="text-xs text-slate-500 leading-tight">{p.role}</div>
                  </div>

                  <p className="text-sm leading-relaxed italic text-slate-700 dark:text-slate-200 mb-8">
                    "{p.text}"
                  </p>

                  <div className="pt-5 border-t border-slate-100 dark:border-white/10 flex items-start gap-2.5">
                    <span className={`shrink-0 w-7 h-7 rounded-lg ${accent.iconBg} text-white flex items-center justify-center mt-0.5`}>
                      {p.icon}
                    </span>
                    <span className={`text-sm font-bold leading-snug ${accent.needText}`}>{p.need}</span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
