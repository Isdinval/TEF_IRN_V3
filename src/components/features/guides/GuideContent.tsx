"use client";

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Guide } from '@/types/guides';
import { Sparkles, HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

interface GuideContentProps {
  guide: Guide;
}

const GuideContent: React.FC<GuideContentProps> = ({ guide }) => {
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);

  useEffect(() => {
    if (guide.content) {
      const headingLines = guide.content.split('\n').filter(line => line.startsWith('#'));
      const extractedHeadings = headingLines.map(line => {
        const level = line.match(/^#+/)?.[0].length || 0;
        const text = line.replace(/^#+\s*/, '').trim();
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        return { id, text, level };
      }).filter(h => h.level > 1 && h.level < 4);
      setHeadings(extractedHeadings);
    }
  }, [guide.content]);

  // Custom components with special handling
  const components = {
    h2: ({ children, node }: any) => {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

      if (text.includes('Comment LlamaKusi vous aide')) {
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="my-12"
          >
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 border border-blue-100 rounded-3xl p-10 shadow-xl shadow-blue-100/50 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 opacity-10">
                <Sparkles size={140} className="text-blue-500" />
              </div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="text-white" size={32} />
                </div>
                <h2 id={id} className="text-4xl font-black tracking-tight text-zinc-900">{children}</h2>
              </div>
              <div className="prose prose-lg max-w-none">
                {/* Content will be handled by parent markdown */}
              </div>
            </div>
          </motion.div>
        );
      }

      if (text.includes('FAQ')) {
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="my-12"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <HelpCircle className="text-white" size={32} />
              </div>
              <h2 id={id} className="text-4xl font-black tracking-tight text-zinc-900">{children}</h2>
            </div>
          </motion.div>
        );
      }

      return <h2 id={id} className="text-3xl font-black mt-12 mb-6 tracking-tight text-zinc-900">{children}</h2>;
    },
    // Other components remain
    h3: ({ children, ...props }: any) => {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      return <h3 id={id} {...props} className="text-2xl font-bold mt-8 mb-4 tracking-tight text-zinc-800">{children}</h3>;
    },
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 p-6 rounded-2xl not-italic font-bold text-blue-900 my-8">
        {children}
      </blockquote>
    ),
    ul: ({ children }: any) => <ul className="list-disc pl-6 space-y-3 my-6 text-slate-600 text-lg">{children}</ul>,
    p: ({ children }: any) => <p className="text-lg leading-relaxed text-slate-600 my-6">{children}</p>,
    strong: ({ children }: any) => <strong className="font-semibold text-zinc-900">{children}</strong>,
  };

  return (
    <div className="flex flex-col lg:flex-row gap-12">
      {headings.length > 0 && (
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Sommaire</h4>
            <nav className="space-y-2">
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className={`block text-sm font-medium transition-colors hover:text-blue-600 ${heading.level === 3 ? 'pl-4 text-slate-400' : 'text-slate-500'}`}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}

      <div className="flex-grow max-w-3xl">
        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose prose-slate max-w-none"
        >
          <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
            {guide.content || ''}
          </ReactMarkdown>
        </motion.article>
      </div>
    </div>
  );
};

export default GuideContent;
