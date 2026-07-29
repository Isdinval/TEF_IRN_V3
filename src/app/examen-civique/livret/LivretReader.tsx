"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Download,
  Flag, Scale, Landmark, MapPin, Globe2, ShieldCheck, Gavel,
  BookOpenCheck, ScrollText, Users2, Mountain, Palette, Home,
  HeartPulse, Briefcase, HeartHandshake, FileText, Sparkles,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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

// Classes Tailwind écrites en toutes lettres (le JIT de Tailwind ne résout pas les
// classes construites dynamiquement du type `bg-${color}-600`).
const PART_THEME: Record<number, { badge: string; kicker: string; heading: string; dot: string; tocActive: string; callout: string }> = {
  0: { badge: "bg-slate-600 shadow-slate-100", kicker: "text-slate-400", heading: "text-slate-600", dot: "bg-slate-400", tocActive: "bg-slate-100 text-slate-700", callout: "bg-slate-50 border-slate-100 text-slate-900" },
  1: { badge: "bg-indigo-600 shadow-indigo-100", kicker: "text-indigo-400", heading: "text-indigo-600", dot: "bg-indigo-400", tocActive: "bg-indigo-50 text-indigo-700", callout: "bg-indigo-50 border-indigo-100 text-indigo-900" },
  2: { badge: "bg-blue-600 shadow-blue-100", kicker: "text-blue-400", heading: "text-blue-600", dot: "bg-blue-400", tocActive: "bg-blue-50 text-blue-700", callout: "bg-blue-50 border-blue-100 text-blue-900" },
  3: { badge: "bg-violet-600 shadow-violet-100", kicker: "text-violet-400", heading: "text-violet-600", dot: "bg-violet-400", tocActive: "bg-violet-50 text-violet-700", callout: "bg-violet-50 border-violet-100 text-violet-900" },
  4: { badge: "bg-amber-600 shadow-amber-100", kicker: "text-amber-500", heading: "text-amber-600", dot: "bg-amber-400", tocActive: "bg-amber-50 text-amber-700", callout: "bg-amber-50 border-amber-100 text-amber-900" },
  5: { badge: "bg-emerald-600 shadow-emerald-100", kicker: "text-emerald-500", heading: "text-emerald-600", dot: "bg-emerald-400", tocActive: "bg-emerald-50 text-emerald-700", callout: "bg-emerald-50 border-emerald-100 text-emerald-900" },
  6: { badge: "bg-zinc-600 shadow-zinc-100", kicker: "text-zinc-400", heading: "text-zinc-600", dot: "bg-zinc-400", tocActive: "bg-zinc-100 text-zinc-700", callout: "bg-zinc-50 border-zinc-100 text-zinc-900" },
};

const PDF_HREF = "/documents/livret-du-citoyen-2026.pdf";

// Convention légère type markdown : **mot** → gras. Évite de complexifier le modèle de
// données (pas de champ structuré par mot) tout en permettant de mettre en avant les
// notions-clés (dates, seuils, noms de lois) directement dans le contenu de civic-livret-data.ts.
function renderRich(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function renderListItem(text: string) {
  // Pattern récurrent dans le contenu du livret : "Libellé : reste de la phrase".
  // On met le libellé en gras automatiquement, sans avoir à baliser chaque item à la main
  // avec **...** dans civic-livret-data.ts.
  const match = text.match(/^([^:]{2,60}) : (.+)$/s);
  if (!match) return renderRich(text);
  const [, label, rest] = match;
  return (
    <>
      <strong className="font-bold text-slate-900">{label}</strong>
      {" : "}
      {renderRich(rest)}
    </>
  );
}

function PageBlocks({ page, theme }: { page: LivretPage; theme: typeof PART_THEME[number] }) {
  return (
    <div className="space-y-5">
      {page.blocks.map((block, i) => {
        switch (block.type) {
          case "lead":
            return (
              <p key={i} className="text-lg sm:text-xl font-semibold text-slate-800 leading-relaxed">
                {renderRich(block.text)}
              </p>
            );
          case "subheading":
            return (
              <h3 key={i} className={`text-sm font-black uppercase tracking-wide pt-2 ${theme.heading}`}>
                {block.text}
              </h3>
            );
          case "paragraph":
            return (
              <p key={i} className="text-[15px] sm:text-base text-slate-600 leading-relaxed">
                {renderRich(block.text)}
              </p>
            );
          case "list":
            return (
              <motion.ul
                key={i}
                className="space-y-2.5"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              >
                {block.items.map((item, j) => (
                  <motion.li
                    key={j}
                    variants={{ hidden: { opacity: 0, x: -6 }, show: { opacity: 1, x: 0 } }}
                    className="flex gap-3 text-[15px] sm:text-base text-slate-600 leading-relaxed"
                  >
                    <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${theme.dot}`} />
                    <span>{renderListItem(item)}</span>
                  </motion.li>
                ))}
              </motion.ul>
            );
          case "callout":
            return (
              <div
                key={i}
                className={`rounded-2xl border px-5 py-4 text-[15px] leading-relaxed transition-transform hover:-translate-y-0.5 ${theme.callout}`}
              >
                <Badge className={`mb-2 text-white border-none ${theme.badge}`}>
                  <Sparkles size={11} />
                  À retenir
                </Badge>
                <p>{renderRich(block.text)}</p>
              </div>
            );
          case "quote":
            return (
              <blockquote key={i} className="border-l-4 border-slate-200 pl-4 italic text-slate-700">
                « {renderRich(block.text)} »
                {block.source && (
                  <footer className="mt-2 not-italic">
                    <Badge variant="outline" className="text-slate-500 font-bold uppercase tracking-wide text-[10px]">
                      {block.source}
                    </Badge>
                  </footer>
                )}
              </blockquote>
            );
          case "cta":
            return (
              <a
                key={i}
                href={block.href}
                download={block.download}
                target={block.download ? undefined : "_blank"}
                rel={block.download ? undefined : "noopener noreferrer"}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-5 py-4 transition-transform hover:-translate-y-0.5 ${theme.callout}`}
              >
                <span className="text-[15px] leading-relaxed">{renderRich(block.text)}</span>
                <Button size="sm" className={`rounded-xl font-black gap-1.5 shrink-0 text-white border-none ${theme.badge}`}>
                  {block.download ? <Download size={14} /> : <ChevronRight size={14} />}
                  {block.label}
                </Button>
              </a>
            );
          case "image":
            return (
              <figure key={i} className="my-2">
                <div className="relative w-full overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-slate-50">
                  <Image
                    src={block.src}
                    alt={block.alt}
                    width={1200}
                    height={800}
                    className="w-full h-auto object-cover"
                  />
                </div>
                {block.caption && (
                  <figcaption className="mt-2 text-xs text-slate-400 text-center italic">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
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
  const topRef = useRef<HTMLDivElement>(null);

  const total = LIVRET_PAGES.length;
  const page = LIVRET_PAGES[index];
  const progress = Math.round(((index + 1) / total) * 100);
  const Icon = ICONS[page.icon];
  const theme = PART_THEME[page.part] ?? PART_THEME[1];

  const pagesByPart = useMemo(() => {
    return LIVRET_PARTS.map((part) => ({
      part,
      pages: LIVRET_PAGES.map((p, i) => ({ ...p, i })).filter((p) => p.part === part.index),
    })).filter((group) => group.pages.length > 0);
  }, []);

  const goTo = (i: number) => {
    setIndex(Math.max(0, Math.min(total - 1, i)));
    // window.scrollTo ne fonctionne pas ici : le conteneur qui défile réellement
    // est <main className="overflow-auto"> dans AppLayout (mode anonyme comme
    // authentifié), jamais `window`. scrollIntoView remonte le bon ancêtre
    // scrollable automatiquement, quel qu'il soit.
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-indigo-100">
      <div ref={topRef} />
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

          <select
            aria-label="Aller à la page"
            value={index}
            onChange={(e) => goTo(Number(e.target.value))}
            className="text-sm font-bold text-slate-600 border border-gray-200 rounded-lg px-2 py-1.5 bg-white hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 max-w-[9rem] sm:max-w-[20rem] truncate"
          >
            {pagesByPart.map(({ part, pages }) => (
              <optgroup key={part.index} label={part.title}>
                {pages.map((p) => (
                  <option key={p.id} value={p.i}>
                    {p.i + 1}. {p.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

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
      <main className="flex-1 max-w-3xl mx-auto px-5 pt-10 sm:pt-14 pb-8 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={page.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                initial={{ scale: 0.9, rotate: -4 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg shrink-0 ${theme.badge}`}
              >
                <Icon size={20} />
              </motion.div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge className={`text-white border-none ${theme.badge}`}>
                    {page.part === 0 ? "Avant-propos" : page.part === 6 ? "Annexes" : `Partie ${page.part}`}
                  </Badge>
                  <span className="text-xs font-black text-slate-400">{index + 1}/{total}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {page.title}
                </h1>
              </div>
            </div>

            <PageBlocks page={page} theme={theme} />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Barre de navigation précédent/suivant — sticky (pas fixed) pour rester dans le
          même contexte de largeur que le contenu : avec `fixed`, la barre se centrait sur
          tout le viewport et ignorait le décalage introduit par la sidebar en mode authentifié.
          `mt-auto` la plaque en bas même quand le contenu est plus court que l'écran. */}
      <div className="sticky bottom-0 z-50 mt-auto bg-white/90 backdrop-blur-md border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
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
            className={`rounded-xl font-black gap-1.5 shadow-lg disabled:opacity-30 ${theme.badge}`}
          >
            Suivant
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
