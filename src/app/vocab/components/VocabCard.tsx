"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Book, ChevronRight } from "lucide-react";
import Link from "next/link";
import { completionCardStyles, CompletionBadge } from "@/components/ui/CompletionVisuals";

function getCategoryColor(category: string): { border: string; bg: string; text: string; icon: string } {
  // For vocab, always return amber as requested
  return {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: 'bg-amber-50 text-amber-600'
  };
}

interface VocabCardProps {
  item: {
    id: string;
    word: string;
    definition: string;
    example?: string;
    level: string;
    category: string;
    is_completed?: boolean;
  };
}

export default function VocabCard({ item }: VocabCardProps) {
  const isCompleted = item.is_completed;
  const colors = getCategoryColor(item.category);

  return (
    <motion.div
      layout
      whileHover={{ y: -3 }}
      className="h-full"
    >
      <Card className={`group h-full border-none border-l-4 border-l-amber-400 shadow-sm hover:shadow-2xl transition-all duration-300 rounded-2xl flex flex-col ${completionCardStyles(!!isCompleted)}`}>
        <CardContent className="p-5 flex flex-col h-full gap-5">
          <div className="flex justify-between items-start">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-lg ${colors.icon}`}>
              <Book size={20} />
            </div>
            <div className="flex flex-col items-end gap-2">
               <Badge variant="outline" className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider border border-amber-100 bg-amber-50 text-amber-600">
                {item.level}
              </Badge>
              {isCompleted && <CompletionBadge />}
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/70">
              Vocabulaire • {item.category}
            </span>
            <h4 className="text-xl font-black text-slate-900 leading-tight group-hover:text-amber-700 transition-colors">
              {item.word}
            </h4>
            <p className="text-sm text-slate-500 font-medium line-clamp-2">
              {item.definition}
            </p>
          </div>

          {item.example && (
            <div className="pt-4 border-t border-slate-50">
               <p className="text-xs italic text-slate-400 line-clamp-2 font-medium">
                "{item.example}"
              </p>
            </div>
          )}

          <Link href={`/vocab/${item.id}`} className="w-full mt-auto">
            <div className="flex items-center justify-between text-sm font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
              <span>{isCompleted ? 'Revoir' : 'Apprendre'}</span>
              <ChevronRight size={16} />
            </div>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
