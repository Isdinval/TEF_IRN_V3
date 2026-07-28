"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Download, List,
  Flag, Scale, Landmark, MapPin, Globe2, ShieldCheck, Gavel,
  BookOpenCheck, ScrollText, Users2, Mountain, Palette, Home,
  HeartPulse, Briefcase, HeartHandshake, FileText, Sparkles,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LIVRET_PAGES, LIVRET_PARTS, type LivretIcon, type LivretPage } from "@/lib/civic-livret-data";

const ICONS: Record<LivretIcon, React.ElementType> = {
  flag: Flag,
  scale: Scale,
  landmark: Landmark,
  vote: Landmark,
  "map-pin": MapPin,
  globe: Globe2,
  "shield-check": ShieldCheck,
  gavel: Gavel,
  "book-open-check": BookOpenCheck,
  "scroll-text": ScrollText,
  "user-check": Users2,
  history: ScrollText,
  users: Users2,
  mountain: Mountain,
  palette: Palette,
  home: Home,
  bike: Home,
  "heart-pulse": HeartPulse,
  briefcase: Briefcase,
  "heart-handshake": HeartHandshake,
  "file-text": FileText,
  sparkles: Sparkles,
};

const PDF_HREF = "/documents/livret-du-citoyen-2026.pdf";

function PageBlocks({ page }: { page: LivretPage }) {
  return (
    <div className="space-y-5">
      {page.blocks.map((block, i) => {
        switch (block.type) {
          case "lead":
            return (
              <p key={i} className="text-lg sm:text-xl font-semibold text-slate-800 leading-relaxed">
                {block.text}
              </p>
            );
          case "subheading":
            return (
              <h3 key={i} className="text-sm font-black uppercase tracking-wide text-indigo-600 pt-2">
                {block.text}
              </h3>
            );
          case "paragraph":
            return (
              <p key={i} className="text-[15px] sm:text-base text-slate-600 leading-relaxed">
                {block.text}
              </p>
            );
          case "list":
            return (
              <ul key={i} className="space-y-2.5">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-3 text-[15px] sm:text-base text-slate-600 leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          case "callout":
            return (
              <div key={i} className="rounded-2xl bg-indigo-50 border border-indigo-100 px-5 py-4 text-[15px] text-indigo-900 leading-relaxed">
                {block.text}
              </div>
            );
          case "quote":
            return (
              <blockquote key={i} className="border-l-4 border-indigo-200 pl-4 italic text-slate-700">
                « {block.text} »
                {block.source && (
                  <footer className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400 not-italic">
                    {block.source}
                  </footer>
                )}
              </blockquote>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

export default function LivretReader() {
  const [index, setIndex] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);

  const total = LIVRET_PAGES.length;
  const page = LIVRET_PAGES[index];
  const progress = Math.round(((index + 1) / total) * 100);
  const Icon = ICONS[page.icon];

  const pagesByPart = useMemo(() => {
    return LIVRET_PARTS.map((part) => ({
      part,
      pages: LIVRET_PAGES.map((p, i) => ({ ...p, i })).filter((p) => p.part === part.index),
    })).filter((group) => group.pages.length > 0);
  }, []);

  const goTo = (i: number) => {
    setIndex(Math.max(0, Math.min(total - 1, i)));
    setTocOpen(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 pb-24">
      {/* Nav sticky */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-gray-50">
        <div className="max-w-3xl mx-auto px-5 py-3.5 flex items-center justify-between gap-3">
          <Link
            href="/examen-civique"
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
            <span className="text-sm hidden sm:inline">Examen civique</span>
          </Link>

          <button
            onClick={() => setTocOpen(true)}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50 truncate"
          >
            <List size={16} className="shrink-0" />
            <span className="truncate">{page.partTitle}</span>
          </button>

          <a href={PDF_HREF} download className="shrink-0">
            <Button size="sm" variant="outline" className="rounded-xl font-bold gap-1.5 hidden sm:flex">
              <Download size={15} />
              PDF
            </Button>
            <Button size="icon" variant="outline" className="rounded-xl sm:hidden">
              <Download size={16} />
            </Button>
          </a>
        </div>
        <Progress value={progress} />
      </nav>

      {/* Contenu */}
      <main className="max-w-3xl mx-auto px-5 pt-10 sm:pt-14">
        <AnimatePresence mode="wait">
          <motion.div
            key={page.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 shrink-0">
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-indigo-400">
                  {page.partTitle} · {index + 1}/{total}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {page.title}
                </h1>
              </div>
            </div>

            <PageBlocks page={page} />
          </motion.div>
        </AnimatePresence>

        {/* Navigation prev/next */}
        <div className="mt-14 flex items-center justify-between gap-3 border-t border-gray-100 pt-6">
          <Button
            variant="ghost"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            className="rounded-xl font-bold gap-1.5 text-slate-600 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
            Précédent
          </Button>
          <Button
            onClick={() => goTo(index + 1)}
            disabled={index === total - 1}
            className="rounded-xl font-black gap-1.5 bg-indigo-600 shadow-lg shadow-indigo-100 disabled:opacity-30"
          >
            Suivant
            <ChevronRight size={16} />
          </Button>
        </div>
      </main>

      {/* Sommaire */}
      <Dialog open={tocOpen} onOpenChange={setTocOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sommaire du livret</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            {pagesByPart.map(({ part, pages }) => (
              <div key={part.index}>
                <p className="text-xs font-black uppercase tracking-wide text-indigo-400 mb-2">
                  {part.title}
                </p>
                <div className="space-y-1">
                  {pages.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => goTo(p.i)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        p.i === index
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
