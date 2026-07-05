import React, { useMemo } from 'react';
import { Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

interface SpecialGuideSectionProps {
  title: string;
  content: string;
  type: 'llamakusi-help' | 'faq';
}

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

export const SpecialGuideSection: React.FC<SpecialGuideSectionProps> = ({ title, content, type }) => {
  const id = useMemo(() => slugify(title), [title]);

  const faqItems = useMemo(() => {
    if (type !== 'faq') return [];
    const items: { question: string; answer: string }[] = [];
    const regex = /(?:^|\n)\*\*(.*?)\*\*\n*(.*?)(?=\n\*\*|$)/gs;
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match[1].trim()) {
        items.push({
          question: match[1].trim(),
          answer: match[2].trim()
        });
      }
    }
    return items;
  }, [content, type]);

  if (type === 'llamakusi-help') {
    return (
      <section className="my-16 p-8 md:p-12 rounded-[3rem] bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/80 border-l-8 border-emerald-500 relative overflow-hidden shadow-xl shadow-emerald-100/20 dark:from-emerald-950/20 dark:to-amber-950/20 dark:border-emerald-700 dark:shadow-none">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Sparkles size={160} className="text-emerald-600" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col gap-4 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest w-fit dark:bg-emerald-900/40 dark:text-emerald-400">
              <Sparkles size={12} />
              Propulsé par LlamaKusi
            </div>
            <h2 id={id} className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 m-0 dark:text-zinc-100">
              {title}
            </h2>
          </div>
          <div className="prose prose-emerald max-w-none prose-lg dark:prose-invert prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed prose-strong:text-emerald-700 dark:prose-strong:text-emerald-400">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => {
                  const isInternal = href?.startsWith('/') || href?.startsWith('https://llamakusi.com') || href?.startsWith('/TEF_IRN');
                  const Component = isInternal ? Link : 'a';
                  return (
                    <Component
                      href={href || '#'}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-100 hover:shadow-emerald-200 hover:-translate-y-0.5 no-underline my-4 group dark:shadow-none"
                    >
                      {children}
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Component>
                  );
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="my-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100 dark:shadow-none">
          <HelpCircle size={24} />
        </div>
        <h2 id={id} className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 m-0 dark:text-zinc-100">
          {title}
        </h2>
      </div>

      <Accordion className="space-y-4">
        {faqItems.map((item, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border border-slate-100 rounded-[1.5rem] bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow dark:bg-zinc-900/50 dark:border-zinc-800"
          >
            <AccordionTrigger className="px-6 py-5 hover:no-underline text-left group">
              <span className="text-lg font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors dark:text-zinc-100 dark:group-hover:text-indigo-400">
                {item.question}
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 text-slate-600 leading-relaxed text-base dark:text-slate-400 prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {item.answer}
              </ReactMarkdown>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {faqItems.length === 0 && (
         <div className="prose prose-slate max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
         </div>
      )}
    </section>
  );
};
