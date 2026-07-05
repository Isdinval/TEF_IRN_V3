import React, { useMemo } from 'react';
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
      <section className="my-12 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-emerald-50/50 to-amber-50/50 border-l-4 border-emerald-500 shadow-sm dark:from-emerald-950/10 dark:to-amber-950/10 dark:border-emerald-700">
        <h2 id={id} className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 mb-6 mt-0 dark:text-zinc-100">
          {title}
        </h2>
        <div className="prose prose-emerald max-w-none dark:prose-invert prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                const isInternal = href?.startsWith('/') || href?.startsWith('https://llamakusi.com') || href?.startsWith('/TEF_IRN');
                const Component = isInternal ? Link : 'a';
                return (
                  <Component
                    href={href || '#'}
                    className="font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4 decoration-2 decoration-emerald-100 hover:decoration-emerald-400 transition-all dark:text-emerald-400 dark:hover:text-emerald-300 no-underline"
                  >
                    {children}
                  </Component>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </section>
    );
  }

  return (
    <section className="my-12">
      <h2 id={id} className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 mb-8 mt-0 dark:text-zinc-100">
        {title}
      </h2>

      <Accordion className="space-y-4">
        {faqItems.map((item, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border border-slate-100 rounded-2xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow dark:bg-zinc-900/50 dark:border-zinc-800"
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
