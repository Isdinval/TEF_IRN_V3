"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Element as HastElement, ElementContent } from "hast";
import { BookOpen, GraduationCap, Sparkles, MessageSquare, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────
// Utilisés par LessonMarkdown, importé par toute page affichant du contenu de
// leçon (lessons/[slug]/LessonInteractive, grammar-check, practice, etc.)
// pour garantir un rendu identique sur toute l'app.

function stripEmoji(text: string) {
  return text.replace(/^[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, "").trim();
}

function isMnemo(text: string) {
  return /^[A-Z][A-Z\s·\-]+[A-Z]$/.test(text.trim()) && text.trim().length > 4;
}

function parseMnemoLetters(text: string): string[] {
  return text.trim().split(/[\s·]+/).filter(Boolean);
}

/** Concatène récursivement le texte brut d'un noeud hast (Element ou ElementContent). */
function getNodeText(node: ElementContent | HastElement | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(getNodeText).join("");
  return "";
}

const DialogueContent = ({ text, isMe }: { text: string; isMe: boolean }) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div className={`flex my-2 ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-base font-semibold not-italic leading-snug ${
        isMe ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-slate-100 text-slate-700 rounded-tl-sm"
      }`}>
        {parts.map((part, index) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={index} className="font-black">{part.slice(2, -2)}</strong>;
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    </div>
  );
};

/**
 * Rendu markdown d'un contenu de leçon, avec le même habillage visuel que
 * la page /tef-irn/lessons/[slug] (titres avec icône, dialogues, tableaux,
 * encadré "Astuce du Coach", mnémotechniques, etc.).
 *
 * Utiliser ce composant partout où du contenu de leçon (lesson.content /
 * lessonCache[...].content) est affiché, plutôt que ReactMarkdown brut ou
 * des classes `prose`, pour garantir un rendu identique sur toute l'app.
 */
export default function LessonMarkdown({ content }: { content: string }) {
  let dialogueLineIndex = 0;
  // react-markdown v10 (API hast) ne fournit plus le prop `ordered` sur li ni
  // `node.parent` sur les noeuds — ces deux informations doivent être suivies
  // manuellement au fil du rendu, sur le même principe que dialogueLineIndex.
  let currentListOrdered = false;
  let currentColumnIndex = 0;

  const markdownComponents: Components = {
    h1: ({ children }) => <h1 className="hidden">{children}</h1>,
    h2: ({ children }) => {
      const raw = children?.toString() || "";
      const title = stripEmoji(raw);
      const isTheorie = title.includes("Théorie");
      const isExemple = title.includes("Exemple");
      dialogueLineIndex = 0;
      return (
        <div className="flex items-center gap-3 mt-10 mb-5 first:mt-0">
          <div className={`w-9 h-9 flex items-center justify-center rounded-xl shrink-0 ${isTheorie ? "bg-indigo-100 text-indigo-600" : isExemple ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
            {isTheorie ? <BookOpen size={18} /> : isExemple ? <GraduationCap size={18} /> : <Sparkles size={18} />}
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{title}</h2>
        </div>
      );
    },
    h3: ({ children }) => <h3 className="text-lg font-bold text-slate-700 mt-8 mb-4 border-l-4 border-indigo-200 pl-4">{children}</h3>,
    p: ({ children, node }) => {
      const isBoldLabel = node?.children?.length === 1 && node.children[0]?.type === "element" && node.children[0].tagName === "strong";
      if (isBoldLabel) {
        dialogueLineIndex = 0;
        return (
          <div className="flex items-center gap-2 mt-8 mb-3">
            <MessageSquare size={15} className="text-emerald-500 shrink-0" />
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">{children}</p>
          </div>
        );
      }
      return <p className="text-slate-600 leading-relaxed mb-4 font-medium">{children}</p>;
    },
    ul: ({ children }) => { currentListOrdered = false; return <ul className="space-y-2 my-6">{children}</ul>; },
    ol: ({ children }) => { currentListOrdered = true; return <ol className="space-y-3 my-6 list-none p-0">{children}</ol>; },
    li: ({ children, node }) => {
      const ordered = currentListOrdered;
      const rawText = node?.children?.map(getNodeText).join("") || "";
      if (rawText.startsWith("⚠️") || rawText.startsWith("⚠")) {
        return (
          <li className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 text-[11px] font-black uppercase tracking-wide">
              <AlertTriangle size={11} /> Attention
            </span>
            <span className="text-slate-600 font-medium">{children}</span>
          </li>
        );
      }
      if (rawText.startsWith("✅")) {
        return (
          <li className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[11px] font-black uppercase tracking-wide">
              <CheckCircle2 size={11} /> Règle
            </span>
            <span className="text-slate-600 font-medium">{children}</span>
          </li>
        );
      }
      if (ordered) return <li className="p-4 rounded-2xl border bg-slate-50 border-slate-200 text-slate-700 font-medium">{children}</li>;
      return (
        <li className="flex items-start gap-3 text-slate-600 font-medium">
          <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
          <span>{children}</span>
        </li>
      );
    },
    em: ({ children, node }) => {
      let text = "";
      if (node?.children) {
        for (const child of node.children) {
          if (child.type === "text") text += child.value;
          else if (child.type === "element" && child.tagName === "strong") {
            text += `**${child.children.map(getNodeText).join("")}**`;
          } else if (child.type === "element") text += child.children.map(getNodeText).join("");
        }
      } else text = children?.toString() || "";
      if (text.startsWith("— ")) {
        const idx = dialogueLineIndex++;
        const isMe = idx % 2 === 0;
        return <DialogueContent text={text.replace(/^— /, "")} isMe={isMe} />;
      }
      return <em className="italic text-slate-600">{children}</em>;
    },
    strong: ({ children }) => {
      const text = children?.toString() || "";
      if (isMnemo(text)) {
        const letters = parseMnemoLetters(text);
        return (
          <span className="inline-flex flex-wrap gap-1.5 my-2">
            {letters.map((word, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black tracking-wide">{word}</span>
            ))}
          </span>
        );
      }
      return <strong className="font-black text-indigo-900">{children}</strong>;
    },
    table: ({ children }) => <div className="my-6 rounded-2xl overflow-hidden border border-zinc-100 shadow-sm"><table className="w-full text-sm">{children}</table></div>,
    thead: ({ children }) => <thead className="bg-indigo-50 text-indigo-700">{children}</thead>,
    tbody: ({ children }) => <tbody className="divide-y divide-zinc-50 bg-white">{children}</tbody>,
    tr: ({ children }) => { currentColumnIndex = 0; return <tr className="hover:bg-zinc-50/60 transition-colors">{children}</tr>; },
    th: ({ children }) => <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-widest">{children}</th>,
    td: ({ children }) => {
      const isFirst = currentColumnIndex === 0;
      currentColumnIndex++;
      return <td className={`px-5 py-3 ${isFirst ? "font-bold text-slate-800" : "text-slate-500 font-medium"}`}>{children}</td>;
    },
    blockquote: ({ children }) => (
      <div className="my-10 p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-100 rounded-[2rem] relative overflow-hidden shadow-sm">
        <Lightbulb className="absolute -right-4 -top-4 text-amber-200/30 w-32 h-32 rotate-12" />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase text-amber-600 tracking-[0.2em] mb-3 flex items-center gap-2"><Lightbulb size={14} fill="currentColor" /> L'Astuce du Coach</p>
          <div className="text-amber-900 font-bold text-base leading-relaxed space-y-1">{children}</div>
        </div>
      </div>
    ),
  };

  const cleanContent = content ? content.replace(/\\n/g, "\n").replace(/\r/g, "") : "";

  return (
    <div className="prose-none max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
}
