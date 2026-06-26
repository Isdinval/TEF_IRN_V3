"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  Share2,
  Sparkles,
  ChevronRight,
  BookOpen,
  Calendar,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Guide } from "@/types/guides";
import GuideContent from "@/components/features/guides/GuideContent";

export default function GuideDetail({ guide }: { guide: Guide }) {
  const router = useRouter();

  const formattedDate = new Date(guide.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 pb-20">
      {/* Navigation Sticky Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/TEF_IRN/guides" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm">Ressources</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              className="p-2 hover:bg-gray-50 rounded-full transition-colors text-slate-400"
              onClick={() => {
                navigator.share({
                  title: guide.title,
                  text: guide.description || '',
                  url: window.location.href,
                }).catch(() => {
                   navigator.clipboard.writeText(window.location.href);
                   alert('Lien copié dans le presse-papier !');
                });
              }}
            >
              <Share2 size={18} />
            </button>
            <Link href="/TEF_IRN/login">
              <Button size="sm" className="bg-blue-600 font-black rounded-xl shadow-lg shadow-blue-100 px-6">
                S'entraîner
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="max-w-6xl mx-auto px-6 pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex flex-wrap items-center gap-4">
            <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none font-black uppercase tracking-widest text-[10px] px-3 py-1">
              {guide.type}
            </Badge>
            {guide.level && (
               <Badge variant="outline" className="text-slate-400 font-black text-[10px] uppercase border-gray-100">
                 {guide.level}
               </Badge>
            )}
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
              <Clock size={14} />
              {guide.reading_time} min de lecture
            </div>
          </div>

          <h1 className="text-4xl lg:text-7xl font-black tracking-tight text-zinc-900 leading-[1.05]">
            {guide.title}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 py-6 border-y border-gray-50">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  M
                </div>
                <div>
                   <p className="text-xs font-black text-zinc-900 uppercase tracking-widest">Par LlamaKusi</p>
                   <p className="text-xs text-slate-400 font-medium">Expert TEF IRN</p>
                </div>
             </div>
             <div className="hidden sm:block w-[1px] h-8 bg-gray-100"></div>
             <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                <Calendar size={14} />
                Publié le {formattedDate}
             </div>
          </div>

          <p className="text-2xl text-slate-500 font-medium leading-relaxed max-w-4xl">
            {guide.description}
          </p>
        </motion.div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 pt-8">
        <GuideContent guide={guide} />

        {/* Action Sidebar for Desktop / Bottom CTA for Mobile */}
        <section className="mt-24 p-8 lg:p-16 bg-blue-600 rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-blue-100">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Sparkles size={140} className="text-white" />
          </div>

          <div className="relative z-10 space-y-8 max-w-2xl">
            <Badge className="bg-white/20 text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-1">
              Prêt à passer à l'action ?
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-black tracking-tight leading-tight">
              Ne laissez pas votre avenir au hasard. Pratiquez dès maintenant.
            </h2>
            <p className="text-blue-100 text-xl font-medium">
              Ce guide vous a donné les bases. Notre IA vous donne l'expérience nécessaire pour réussir le jour J.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/TEF_IRN/login" className="w-full sm:w-auto">
                <Button size="lg" className="h-16 px-10 bg-white text-blue-600 hover:bg-blue-50 font-black text-xl rounded-2xl shadow-xl w-full">
                  Démarrer l'entraînement
                </Button>
              </Link>
              <Link href="/TEF_IRN/practice" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="h-16 px-10 border-white/30 hover:bg-white/10 text-white font-bold text-lg rounded-2xl w-full">
                  Voir les exercices <ExternalLink size={18} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="mt-20 pt-12 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-100">M</div>
              <div>
                <p className="font-black text-zinc-900 tracking-tight">LlamaKusi</p>
                <p className="text-xs text-slate-400 font-medium">Le coach IA pour votre réussite au TEF IRN.</p>
              </div>
           </div>
           <Link href="/TEF_IRN/guides" className="text-blue-600 font-black flex items-center gap-2 hover:translate-x-1 transition-transform">
             Voir tous les guides <ChevronRight size={18} />
           </Link>
        </div>
      </main>
    </div>
  );
}
