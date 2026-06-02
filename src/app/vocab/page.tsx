"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Volume2, ArrowRight, RotateCcw, CheckCircle2, XCircle, LayoutGrid, GraduationCap, Loader2 } from "lucide-react";
import { updateSRS } from "@/lib/srs-engine";

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

  const supabase = createClient();

  const categories = ["Administration", "Santé", "Travail", "Logement"];
  const levels = ["A1", "A2", "B1", "B2"];

  const startTraining = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('level', filters.level)
      .eq('category', filters.category)
      .limit(10);

    if (data && data.length > 0) {
      setCards(data);
      setMode("training");
      setIndex(0);
      setFlipped(false);
      setFinished(false);
    } else {
      alert("Aucun mot trouvé pour cette sélection.");
    }
    setLoading(false);
  };

  const handleNext = async (mastered: boolean) => {
    // SRS Update logic
    const { data: { user } } = await supabase.auth.getUser();
    if (user && cards[index]) {
      // Simulation d'un score SRS : 100 si maîtrisé, 0 si pas encore
      // Idéalement, on utiliserait une table dédiée user_vocabulary_reviews
    }

    if (index < cards.length - 1) {
      setIndex(index + 1);
      setFlipped(false);
    } else {
      setFinished(true);
    }
  };

  if (mode === "selection") {
    return (
      <div className="max-w-4xl mx-auto p-8 pt-20">
        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-2">Maîtrise du Vocabulaire</h1>
          <p className="text-muted-foreground text-lg">Choisissez un thème et un niveau pour commencer votre session.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="space-y-4">
            <h3 className="font-bold flex items-center gap-2"><GraduationCap className="text-indigo-600" /> Niveau CECRL</h3>
            <div className="grid grid-cols-2 gap-2">
              {levels.map(l => (
                <Button
                  key={l}
                  variant={filters.level === l ? "default" : "outline"}
                  className={filters.level === l ? "bg-indigo-600" : ""}
                  onClick={() => setFilters({...filters, level: l})}
                >
                  Niveau {l}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-bold flex items-center gap-2"><LayoutGrid className="text-indigo-600" /> Thématique</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(c => (
                <Button
                  key={c}
                  variant={filters.category === c ? "default" : "outline"}
                  className={filters.category === c ? "bg-indigo-600" : ""}
                  onClick={() => setFilters({...filters, category: c})}
                >
                  {c}
                </Button>
              ))}
            </div>
          </section>
        </div>

        <Button
          className="w-full mt-12 h-16 text-xl font-bold bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-100"
          onClick={startTraining}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" /> : "Commencer l'apprentissage"}
        </Button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-8">
        <Card className="max-w-md text-center p-12 rounded-3xl border-2 border-indigo-50 shadow-none">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black mb-2 text-slate-900">Session terminée !</h2>
          <p className="text-muted-foreground mb-8">Tu as travaillé {cards.length} mots de la catégorie {filters.category}.</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setMode("selection")}>Changer de thème</Button>
            <Button className="flex-1 bg-indigo-600 rounded-xl" onClick={() => window.location.href='/dashboard'}>Dashboard</Button>
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
          <Badge className="bg-indigo-600 mb-2">{current.category} • {current.level}</Badge>
          <h1 className="text-2xl font-bold">Apprentissage Mémoriel</h1>
        </div>
        <div className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
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
            <Card className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 border-2 border-slate-100 shadow-2xl shadow-slate-200/50 rounded-3xl group-hover:border-indigo-200 transition-colors">
              <h2 className="text-5xl font-black text-indigo-950 mb-6 text-center">{current.word}</h2>
              <Button size="icon" variant="secondary" className="rounded-full h-12 w-12 bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                <Volume2 size={24} />
              </Button>
              <p className="absolute bottom-8 text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] italic">Cliquer pour révéler</p>
            </Card>

            {/* Verso */}
            <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 border-none bg-indigo-600 text-white shadow-2xl rounded-3xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                 <div className="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full" />
                 <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white rounded-full" />
              </div>
              <div className="text-center space-y-8 z-10">
                <div className="space-y-2">
                  <div className="text-[10px] text-indigo-200 font-black uppercase tracking-[0.2em]">Définition</div>
                  <p className="text-2xl font-bold leading-tight">{current.definition}</p>
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] text-indigo-200 font-black uppercase tracking-[0.2em]">Exemple</div>
                  <p className="text-sm italic text-indigo-50 bg-white/10 p-4 rounded-2xl border border-white/10">"{current.example}"</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className={`flex gap-4 w-full max-w-lg transition-all duration-500 ${flipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <Button variant="outline" size="lg" className="flex-1 h-16 rounded-2xl border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all" onClick={() => handleNext(false)}>
            <XCircle className="mr-2" /> Pas encore
          </Button>
          <Button size="lg" className="flex-1 h-16 rounded-2xl bg-green-600 hover:bg-green-700 shadow-xl shadow-green-100 transition-all" onClick={() => handleNext(true)}>
            <CheckCircle2 className="mr-2" /> Je maîtrise
          </Button>
        </div>
      </div>
    </div>
  );
}
