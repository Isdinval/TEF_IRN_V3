"use client";

import { motion } from "framer-motion";
import { BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

interface VocabThemeCardProps {
  lessonId: string;
  theme: string;
  level: string;
}

/**
 * Carte de renvoi vers /vocab pour une thématique lexicale liée à la leçon
 * Vocabulaire en cours sur /parcours/[slug] (lessons.vocab_theme_categories).
 *
 * Volontairement un élément UI séparé, jamais fusionné dans la grille
 * ExerciseCard/resolveNextExercises : /vocab est un système SRS distinct
 * (table vocabulary/user_vocabulary_reviews), sans lien structurel avec la
 * table exercises -- voir docs/vocabulaire-particularites-recommandation.md.
 *
 * Réutilise le mécanisme d'auto-démarrage déjà existant sur /vocab
 * (?lessonId=...&topic=...&level=...), aucun nouveau paramètre créé.
 */
export default function VocabThemeCard({ lessonId, theme, level }: VocabThemeCardProps) {
  const href = `/tef-irn/vocab?lessonId=${encodeURIComponent(lessonId)}&topic=${encodeURIComponent(theme)}&level=${encodeURIComponent(level)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link href={href} target="_blank" rel="noopener noreferrer" className="group block">
        <div className="bg-white rounded-[2rem] p-6 border-2 border-amber-100 hover:border-amber-500 shadow-lg shadow-amber-100/40 transition-all hover:scale-[1.01] flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 group-hover:bg-amber-600 flex items-center justify-center text-amber-600 group-hover:text-white transition-all shrink-0">
            <BookOpen size={26} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">
              Réviser le vocabulaire de ce thème
            </p>
            <h4 className="text-base font-black text-slate-900 truncate">{theme}</h4>
          </div>
          <ArrowRight size={20} className="text-amber-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}
