"use client";

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Guide } from '@/types/guides';

interface GuideContentProps {
  guide: Guide;
}

const GuideContent: React.FC<GuideContentProps> = ({ guide }) => {
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);

  useEffect(() => {
    // Basic TOC extraction from markdown
    if (guide.content) {
      const headingLines = guide.content.split('\n').filter(line => line.startsWith('#'));
      const extractedHeadings = headingLines.map(line => {
        const level = line.match(/^#+/)?.[0].length || 0;
        const text = line.replace(/^#+\/s*/, '').trim();
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        return { id, text, level };
      }).filter(h => h.level > 1 && h.level < 4);
      setHeadings(extractedHeadings);
    }
  }, [guide.content]);

  // Custom components for ReactMarkdown to handle interactive elements or styling
  const components = {
    h2: ({ children, ...props }: any) => {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      return <h2 id={id} {...props} className="text-3xl font-black mt-12 mb-6 tracking-tight text-zinc-900">{children}</h2>;
    },
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
    ul: ({ children }: any) => <ul className="list-disc pl-6 space-y-2 my-4 text-slate-600">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-6 space-y-2 my-4 text-slate-600">{children}</ol>,
    li: ({ children }: any) => <li className="text-lg leading-relaxed">{children}</li>,
    p: ({ children }: any) => <p className="text-lg leading-relaxed text-slate-600 my-4">{children}</p>,
    strong: ({ children }: any) => <strong className="font-bold text-zinc-900">{children}</strong>,
  };

  return (
    <div className="flex flex-col lg:flex-row gap-12">
      {/* Table of Contents - Desktop */}
      {headings.length > 0 && (
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Sommaire</h4>
            <nav className="space-y-2">
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className={`block text-sm font-medium transition-colors hover:text-blue-600 ${
                    heading.level === 3 ? 'pl-4 text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}

      {/* Main Content */}
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
