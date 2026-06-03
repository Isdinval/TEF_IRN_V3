"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Sparkles, Mic, Zap, Target, BookOpen, ChevronRight, Star, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const features = [
    { title: "Coach Oral IA", desc: "Pratiquez sans stress avec une IA qui simule l'examinateur en temps réel.", icon: Mic, color: "bg-indigo-100 text-indigo-600" },
    { title: "Correction Écrite", desc: "Feedback détaillé ligne par ligne avec explications pédagogiques.", icon: Sparkles, color: "bg-amber-100 text-amber-600" },
    { title: "Radar de Compétences", desc: "Visualisez vos points forts et progressez là où ça compte vraiment.", icon: Target, color: "bg-emerald-100 text-emerald-600" },
    { title: "Méthode Adaptative", desc: "Nos algorithmes personnalisent vos exercices selon vos erreurs passées.", icon: Zap, color: "bg-purple-100 text-purple-600" },
  ];

  return (
    <div className="bg-background text-foreground font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 font-black text-2xl text-indigo-600">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">M</div>
            Maitris
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
            <Link href="/guides" className="hover:text-indigo-600 transition-colors">Guides</Link>
            <Link href="/pricing" className="hover:text-indigo-600 transition-colors">Tarifs</Link>
            <Link href="/login" className="hover:text-indigo-600 transition-colors">Connexion</Link>
            <Link href="/login">
              <Button className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl font-bold shadow-lg shadow-indigo-100">
                S'entraîner gratuitement
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 mb-6 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
              L'alternative intelligente à PrepMyFuture
            </Badge>
            <h1 className="text-6xl lg:text-7xl font-black font-heading tracking-tight leading-[1.1] mb-8">
              Décrochez votre <span className="text-primary">TEF IRN</span> avec l'IA.
            </h1>
            <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-lg">
              Le seul coach IA personnel qui vous accompagne du niveau A1 au B2. Plus intelligent, plus abordable, et disponible 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login">
                <Button className="h-16 px-10 text-xl font-black bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-2xl shadow-indigo-100 w-full sm:w-auto">
                  Commencer maintenant
                </Button>
              </Link>
              <Link href="/exercice-gratuit">
                <Button variant="outline" className="h-16 px-10 text-xl font-black border-2 rounded-2xl w-full sm:w-auto">
                  Essayer gratuitement
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-4 text-sm font-bold text-slate-400">
               <div className="flex -space-x-2">
                 {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white" />)}
               </div>
               <span>Rejoint par +1,200 candidats ce mois-ci</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
             <div className="absolute inset-0 bg-indigo-600/5 blur-3xl rounded-full" />
             <Card className="border-none shadow-2xl shadow-slate-200 rounded-[3rem] overflow-hidden bg-white/50 backdrop-blur-xl relative z-10 p-2">
                <div className="rounded-[2.5rem] w-full aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white overflow-hidden">
                   <Target size={80} className="opacity-20 animate-pulse" />
                   <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl" />
                   <div className="relative z-20 p-12 w-full h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                         <div className="w-12 h-3 bg-white/20 rounded-full" />
                         <div className="w-8 h-8 bg-white/20 rounded-lg" />
                      </div>
                      <div className="space-y-4">
                         <div className="h-6 w-2/3 bg-white/40 rounded-lg" />
                         <div className="h-4 w-full bg-white/20 rounded-md" />
                         <div className="h-4 w-1/2 bg-white/20 rounded-md" />
                      </div>
                      <div className="flex gap-2">
                         <div className="h-8 w-24 bg-white/30 rounded-xl" />
                         <div className="h-8 w-24 bg-white/10 rounded-xl" />
                      </div>
                   </div>
                </div>
                <div className="absolute top-1/2 -right-12 p-6 bg-white rounded-3xl shadow-2xl shadow-indigo-100 border border-indigo-50 hidden lg:block">
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                        <CheckCircle2 />
                      </div>
                      <div className="font-bold text-slate-900">Niveau B2 Atteint !</div>
                   </div>
                   <p className="text-xs text-slate-400">Basé sur vos 10 dernières simulations</p>
                </div>
             </Card>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
             <h2 className="text-4xl font-black mb-4">Pourquoi choisir Maitris ?</h2>
             <p className="text-slate-500 text-lg max-w-2xl mx-auto">
               Nous avons réinventé la préparation aux examens pour les adultes pressés. Pas de cours interminables, juste de la pratique intelligente.
             </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <Card key={i} className="p-8 rounded-[2rem] border-none shadow-xl shadow-slate-200/50 hover:translate-y-[-8px] transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${f.color}`}>
                   <f.icon size={28} />
                </div>
                <h3 className="text-xl font-black mb-3">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <Card className="rounded-[3rem] border-none shadow-2xl shadow-indigo-100 overflow-hidden">
             <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-12 lg:p-16 bg-slate-900 text-white">
                   <h2 className="text-4xl font-black mb-8">Arrêtez de payer trop cher pour des QCM statiques.</h2>
                   <div className="space-y-6">
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={14} />
                         </div>
                         <span className="font-bold">IA Conversationnelle vs PDFs figés</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={14} />
                         </div>
                         <span className="font-bold">Correction en 3 secondes vs 3 jours</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={14} />
                         </div>
                         <span className="font-bold">Accès à vie vs Abonnements limités</span>
                      </div>
                   </div>
                   <Link href="/pricing">
                      <Button className="mt-12 h-14 px-8 bg-indigo-600 rounded-xl font-bold text-lg">Découvrir les tarifs</Button>
                   </Link>
                </div>
                <div className="p-12 lg:p-16 flex flex-col justify-center gap-8 bg-indigo-50/30">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-indigo-600">
                        <Globe size={24} />
                      </div>
                      <div>
                        <div className="font-black">Nationalité & Séjour</div>
                        <div className="text-xs text-slate-500">Conforme à la loi 2024-42</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-indigo-600">
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <div className="font-black">+5,000 Exercices</div>
                        <div className="text-xs text-slate-500">Générés et validés pédagogiquement</div>
                      </div>
                   </div>
                </div>
             </div>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-indigo-600 text-white overflow-hidden relative">
         <div className="absolute top-0 right-0 p-24 opacity-10 rotate-12">
            <Sparkles size={400} />
         </div>
         <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <h2 className="text-4xl font-black mb-16">Ils ont réussi avec Maitris.</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                 { name: "Sami", origin: "Algérie", text: "J'ai obtenu mon B1 pour la nationalité en 3 semaines. Le coach oral m'a vraiment aidé à ne plus bégayer." },
                 { name: "Maria", origin: "Brésil", text: "La correction écrite est bluffante. L'IA explique exactement pourquoi on s'est trompé. Indispensable." },
                 { name: "Ahmed", origin: "Égypte", text: "Maitris est 10 fois mieux que PrepMyFuture. C'est plus moderne et on progresse beaucoup plus vite." }
               ].map((t, i) => (
                 <Card key={i} className="p-8 bg-white/10 backdrop-blur-md border-white/20 text-white text-left rounded-[2rem]">
                    <div className="flex gap-1 mb-4">
                       {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="currentColor" className="text-yellow-400" />)}
                    </div>
                    <p className="italic text-lg mb-6">"{t.text}"</p>
                    <div className="font-bold">{t.name}</div>
                    <div className="text-xs text-indigo-200">TEF IRN {t.origin}</div>
                 </Card>
               ))}
            </div>
         </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-32 text-center px-6">
         <h2 className="text-5xl font-black mb-6 tracking-tight">Prêt pour votre réussite ?</h2>
         <p className="text-xl text-slate-500 mb-12 max-w-xl mx-auto leading-relaxed">
            Ne laissez pas votre avenir au hasard. Rejoignez la plateforme la plus avancée pour le TEF IRN.
         </p>
         <Link href="/login">
            <Button size="lg" className="h-20 px-16 text-2xl font-black bg-indigo-600 hover:bg-indigo-700 rounded-[2rem] shadow-2xl shadow-indigo-100">
               Créer mon compte gratuit <ChevronRight className="ml-2" />
            </Button>
         </Link>
         <div className="mt-24 pt-12 border-t text-sm text-slate-400 font-bold flex justify-center gap-8">
            <span>© 2025 Maitris AI. Tous droits réservés.</span>
            <Link href="/guides">Guides TEF</Link>
            <Link href="/pricing">Tarifs</Link>
         </div>
      </footer>
    </div>
  );
}
