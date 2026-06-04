"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Volume2, ArrowRight, RotateCcw, CheckCircle2, XCircle, LayoutGrid, GraduationCap, Loader2, Calendar } from "lucide-react";
import { updateVocabularySRS } from "@/lib/srs-engine";

interface Flashcard {
  id: string;
  word: string;
  definition: string;
  example: string;
  level: string;
  category: string;
}

export default function VocabCoach() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"selection" | "training">("selection");
  const [filters, setFilters] = useState({ level: "A2", category: "Administration" });
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [sessionMasteredCount, setSessionMasteredCount] = useState(0);

  const supabase = createClient();

  const categories = ["Administration", "Santé", "Travail", "Logement"];
  const levels = ["A1", "A2", "B1", "B2"];

  const startTraining = async (review: boolean = false) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase.from('vocabulary').select('*');

    if (review && user) {
      const { data: reviews } = await supabase
        .from('user_vocabulary_reviews')
        .select('vocab_id')
        .eq('user_id', user.id)
        .lte('next_review_at', new Date().toISOString());

      const ids = reviews?.map((r: any) => r.vocab_id) || [];
      if (ids.length === 0) {
        alert("Bravo ! Vous n'avez aucune révision urgente pour le moment.");
        setLoading(false);
        return;
      }
      query = query.in('id', ids);
      setIsReviewMode(true);
    } else {
      query = query.eq('level', filters.level).eq('category', filters.category);
      setIsReviewMode(false);
    }

    const { data } = await query.limit(10);

    if (data && data.length > 0) {
      setCards(data);
      setMode("training");
      setIndex(0);
      setFlipped(false);
      setFinished(false);
      setSessionMasteredCount(0);
    } else {
      alert("Aucun mot trouvé pour cette sélection.");
    }
    setLoading(false);
  };

  const handleNext = async (mastered: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && cards[index]) {
      await updateVocabularySRS(user.id, cards[index].id, mastered);
      if (mastered) setSessionMasteredCount(prev => prev + 1);
    }

    if (index < cards.length - 1) {
      setIndex(index + 1);
      setFlipped(false);
    } else {
      // Fin de session : Créditer l'XP global (ex: 5 XP par mot maîtrisé)
      const totalXp = (sessionMasteredCount + (mastered ? 1 : 0)) * 5;
      await fetch('/api/exercise-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: cards[index].id, // On utilise l'ID du dernier mot comme réf
          score: totalXp,
          answers: { type: 'vocab', mastered: sessionMasteredCount + (mastered ? 1 : 0) }
        })
      });
      setFinished(true);
    }
  };

  if (mode === "selection") {
    return (
      <div className="max-w-4xl mx-auto p-8 pt-20">
        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-2">Maîtrise du Vocabulaire</h1>
          <p className="text-muted-foreground text-lg italic">Progressez mot après mot vers la fluidité.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="space-y-4">
            <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-2">
               <GraduationCap size={16} className="text-indigo-600" /> Niveau CECRL
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {levels.map(l => (
                <Button
                  key={l}
                  variant={filters.level === l ? "default" : "outline"}
                  className={filters.level === l ? "bg-zinc-900 text-white" : "border-zinc-200"}
                  onClick={() => setFilters({...filters, level: l})}
                >
                  Niveau {l}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <LayoutGrid size={16} className="text-indigo-600" /> Thématique
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(c => (
                <Button
                  key={c}
                  variant={filters.category === c ? "default" : "outline"}
                  className={filters.category === c ? "bg-zinc-900 text-white" : "border-zinc-200"}
                  onClick={() => setFilters({...filters, category: c})}
                >
                  {c}
                </Button>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-12 space-y-4">
          <Button
            className="w-full h-16 text-xl font-black bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
            onClick={() => startTraining(false)}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : "Découvrir de nouveaux mots"}
          </Button>

          <Button
            variant="outline"
            className="w-full h-16 text-xl font-black border-zinc-200 text-zinc-900 hover:bg-zinc-50 rounded-2xl transition-all"
            onClick={() => startTraining(true)}
            disabled={loading}
          >
            <Calendar className="mr-2" /> Réviser mon SRS
          </Button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-8">
        <Card className="max-w-md w-full text-center p-12 rounded-[2.5rem] border-none shadow-2xl shadow-indigo-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black mb-2 text-zinc-900">Session terminée !</h2>
          <p className="text-muted-foreground mb-8 font-medium italic">
            Vous avez maîtrisé {sessionMasteredCount} nouveaux mots aujourd'hui.
          </p>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-14 bg-zinc-900 text-white font-bold rounded-2xl" onClick={() => window.location.href='/dashboard'}>
              Retour au Dashboard
            </Button>
            <Button variant="ghost" className="text-zinc-500 font-bold" onClick={() => setMode("selection")}>
              Changer de thème
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const current = cards[index];

  return (
    <div className="max-w-3xl mx-auto p-8 pt-16 h-screen flex flex-col">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <Badge className="bg-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2 px-3 py-1">{current.category} • {current.level}</Badge>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Apprentissage Mémoriel</h1>
        </div>
        <div className="text-xs font-black text-zinc-400 bg-zinc-100 px-4 py-2 rounded-full uppercase tracking-widest">
          {index + 1} / {cards.length}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-12 min-h-0">
        <div
          className="relative w-full max-w-lg aspect-[4/3] cursor-pointer perspective-1000 group"
          onClick={() => setFlipped(!flipped)}
        >
          <div className={`
            relative w-full h-full transition-transform duration-700 transform-style-3d
            ${flipped ? 'rotate-y-180' : ''}
          `}>
            {/* Recto */}
            <Card className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-12 border-none shadow-2xl shadow-zinc-200 rounded-[3rem] group-hover:shadow-indigo-100 transition-all duration-500">
              <h2 className="text-6xl font-black text-zinc-900 mb-8 text-center tracking-tighter">{current.word}</h2>
              <Button size="icon" variant="secondary" className="rounded-full h-14 w-14 bg-zinc-100 text-zinc-900 hover:bg-indigo-600 hover:text-white transition-colors">
                <Volume2 size={28} />
              </Button>
              <p className="absolute bottom-10 text-[10px] text-zinc-300 uppercase font-black tracking-[0.3em] italic">Cliquer pour révéler</p>
            </Card>

            {/* Verso */}
            <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-12 border-none bg-zinc-900 text-white shadow-2xl rounded-[3rem] overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                 <div className="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full blur-3xl" />
                 <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500 rounded-full blur-3xl" />
              </div>
              <div className="text-center space-y-10 z-10">
                <div className="space-y-3">
                  <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Définition</div>
                  <p className="text-3xl font-bold leading-tight tracking-tight">{current.definition}</p>
                </div>
                <div className="space-y-3">
                  <div className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em]">Exemple d'usage</div>
                  <p className="text-lg italic text-zinc-300 bg-white/5 p-6 rounded-[2rem] border border-white/10 leading-relaxed font-medium">
                    "{current.example}"
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className={`flex gap-4 w-full max-w-lg transition-all duration-500 ${flipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <Button variant="outline" size="lg" className="flex-1 h-16 rounded-2xl border-zinc-200 text-zinc-400 font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all" onClick={() => handleNext(false)}>
            <XCircle className="mr-2" /> Pas encore
          </Button>
          <Button size="lg" className="flex-1 h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xl shadow-emerald-100 transition-all" onClick={() => handleNext(true)}>
            <CheckCircle2 className="mr-2" /> Je maîtrise
          </Button>
        </div>
      </div>
    </div>
  );
}
