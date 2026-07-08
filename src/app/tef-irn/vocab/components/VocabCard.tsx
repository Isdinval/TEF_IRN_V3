"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Book, ArrowRight } from "lucide-react";
import Link from "next/link";
import { completionCardStyles, CompletionBadge } from "@/components/ui/CompletionVisuals";

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

  return (
    <motion.div
      layout
      whileHover={{ y: -6, scale: 1.02 }}
      className="h-full"
    >
      <Card className={`group h-full border-none shadow-sm hover:shadow-2xl transition-all duration-300 rounded-[2rem] flex flex-col ${completionCardStyles(!!isCompleted)}`}>
        <CardContent className="p-8 flex flex-col h-full gap-5">
          <div className="flex justify-between items-start">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-lg ${isCompleted ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-emerald-200' : 'bg-zinc-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-emerald-200'}`}>
              <Book size={28} />
            </div>
            <div className="flex flex-col items-end gap-2">
               <Badge variant="outline" className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider border border-emerald-100 bg-emerald-50 text-emerald-600">
                {item.level}
              </Badge>
              {isCompleted && <CompletionBadge />}
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">
              Vocabulaire • {item.category}
            </span>
            <h4 className="text-xl font-black text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">
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

          <Link href={`/tef-irn/vocab/${item.id}`} className="w-full mt-auto">
            <Button className={`w-full h-14 rounded-2xl text-white font-black transition-all active:scale-95 shadow-xl ${isCompleted ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 group-hover:shadow-emerald-200' : 'bg-zinc-900 hover:bg-emerald-600 shadow-zinc-100 group-hover:shadow-emerald-100'}`}>
              {isCompleted ? 'REVOIR' : 'APPRENDRE'}
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
