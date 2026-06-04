"use client";

import { useParams, useRouter } from "next/navigation";
import { guides } from "@/data/guides";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  Share2,
  Sparkles,
  ChevronRight,
  BookOpen
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { motion } from "framer-motion";

export default function GuideDetailPage() {
  const { slug } = useParams();
  const router = useRouter();

  const guide = guides.find((g) => g.slug === slug);

  if (!guide) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Guide non trouvé</h1>
        <Button onClick={() => router.push("/guides")}>Retour aux guides</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 pb-20">
      {/* Navigation Sticky Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/guides" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm">Retour aux guides</span>
          </Link>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
              <Share2 size={18} />
            </button>
            <Link href="/login">
              <Button size="sm" className="bg-indigo-600 font-bold rounded-xl shadow-lg shadow-indigo-100">
                S'entraîner
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="max-w-4xl mx-auto px-6 pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50 border-none font-black uppercase tracking-widest text-[10px] px-3 py-1">
              {guide.tag}
            </Badge>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
              <Clock size={14} />
              {guide.readTime} de lecture
            </div>
          </div>

          <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-zinc-900 leading-[1.1]">
            {guide.title}
          </h1>

          <p className="text-xl text-slate-500 font-medium leading-relaxed italic border-l-4 border-indigo-100 pl-6">
            {guide.description}
          </p>
        </motion.div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6">
        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose prose-slate prose-indigo max-w-none
            prose-headings:font-black prose-headings:tracking-tight
            prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
            prose-p:text-lg prose-p:leading-relaxed prose-p:text-slate-600
            prose-strong:text-zinc-900 prose-strong:font-bold
            prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50/50 prose-blockquote:p-6 prose-blockquote:rounded-2xl prose-blockquote:not-italic prose-blockquote:font-bold prose-blockquote:text-indigo-900"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {guide.content}
          </ReactMarkdown>
        </motion.article>

        {/* Dynamic CTA Section */}
        <section className="mt-24 p-8 lg:p-12 bg-zinc-900 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Sparkles size={120} className="text-indigo-400" />
          </div>

          <div className="relative z-10 space-y-6">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-none font-black text-[10px] uppercase tracking-widest">
              Passer à l'action
            </Badge>
            <h2 className="text-3xl font-black tracking-tight">
              Ne laissez pas votre avenir au hasard.
            </h2>
            <p className="text-zinc-400 text-lg font-medium max-w-xl">
              Les guides sont un bon début, mais la pratique est la clé. Notre IA vous prépare aux conditions réelles du TEF IRN 2025.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/login">
                <Button size="lg" className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-600/20 w-full sm:w-auto">
                  Essayer Maitris Gratuitement
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="h-14 px-8 border-white/20 hover:bg-white/5 text-white font-bold rounded-2xl w-full sm:w-auto">
                  Voir les offres Premium
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="mt-20 pt-12 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">M</div>
              <div>
                <p className="font-bold text-zinc-900">Maitris</p>
                <p className="text-xs text-slate-400">Le coach IA pour votre réussite.</p>
              </div>
           </div>
           <Link href="/guides" className="text-indigo-600 font-bold flex items-center gap-2 hover:translate-x-1 transition-transform">
             Plus de guides <ChevronRight size={18} />
           </Link>
        </div>
      </main>
    </div>
  );
}
