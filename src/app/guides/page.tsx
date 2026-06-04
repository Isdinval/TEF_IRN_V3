"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChevronRight, GraduationCap, BookOpen, Scale, Sparkles, Zap, Target } from "lucide-react";
import { motion } from "framer-motion";
import { guides } from "@/data/guides";

const iconMap: Record<string, any> = {
  "tout-comprendre-tef-irn-2025": GraduationCap,
  "reussir-expression-orale-section-a": BookOpen,
  "preparer-naturalisation-francaise": Scale,
  "pourquoi-utiliser-ia-pour-tef": Zap,
  "eviter-echec-tef-irn": Target,
};

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 pb-24">
      {/* Hero Section */}
      <section className="bg-slate-50 border-b border-slate-100 py-24 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Badge className="bg-indigo-600 text-white hover:bg-indigo-600 mb-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
              Centre de Ressources
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-6xl font-black tracking-tight text-zinc-900"
          >
            Réussir le <span className="text-indigo-600">TEF IRN</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-500 max-w-2xl mx-auto font-medium"
          >
            Découvrez nos guides experts pour comprendre l'examen, maîtriser les épreuves et accélérer vos démarches administratives.
          </motion.p>
        </div>
      </section>

      {/* Guides Grid */}
      <main className="max-w-6xl mx-auto px-6 -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {guides.map((guide, i) => {
            const Icon = iconMap[guide.slug] || BookOpen;
            return (
              <motion.div
                key={guide.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/guides/${guide.slug}`}>
                  <Card className="h-full group hover:border-indigo-600 transition-all duration-300 cursor-pointer overflow-hidden border-2 border-slate-100 shadow-xl shadow-slate-100/50 rounded-[2.5rem] flex flex-col bg-white">
                    <CardHeader className="p-8 pb-4">
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all group-hover:scale-110 shadow-sm">
                          <Icon size={24} />
                        </div>
                        <Badge variant="secondary" className="bg-slate-50 text-slate-400 font-black text-[9px] uppercase tracking-widest border-none">
                          {guide.tag}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-bold group-hover:text-indigo-600 transition-colors leading-tight">
                        {guide.title}
                      </CardTitle>
                      <CardDescription className="text-sm font-medium leading-relaxed mt-3 line-clamp-2">
                        {guide.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 mt-auto flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <div className="flex items-center gap-1.5">
                         <Clock size={14} /> {guide.readTime}
                       </div>
                       <div className="flex items-center gap-1 text-indigo-600 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                         Lire <ChevronRight size={14} />
                       </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* CTA Bottom */}
      <section className="mt-32 max-w-5xl mx-auto px-6">
        <div className="bg-zinc-900 rounded-[3rem] p-12 lg:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
           <div className="absolute top-0 left-0 p-12 opacity-10">
              <Sparkles size={100} className="text-indigo-400" />
           </div>

           <h2 className="text-3xl lg:text-4xl font-black mb-6 relative z-10">Prêt à obtenir votre certificat ?</h2>
           <p className="text-zinc-400 text-lg mb-12 max-w-xl mx-auto font-medium relative z-10">
             Ne vous contentez pas de lire des guides. Rejoignez Maitris et pratiquez avec le meilleur coach IA du marché.
           </p>

           <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
             <Link href="/login">
               <Button size="lg" className="h-16 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
                 S'entraîner Gratuitement
               </Button>
             </Link>
             <Link href="/pricing">
               <Button size="lg" variant="outline" className="h-16 px-10 border-white/20 hover:bg-white/5 text-white font-bold text-lg rounded-2xl">
                 Nos offres Premium
               </Button>
             </Link>
           </div>
        </div>
      </section>
    </div>
  );
}
