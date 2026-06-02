"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Volume2, ArrowRight, RotateCcw, CheckCircle2, XCircle } from "lucide-react";

interface Flashcard {
  id: string;
  word: string;
  definition: string;
  example: string;
}

const mockCards: Flashcard[] = [
  { id: "1", word: "Démarche", definition: "Manière de conduire une action, procédure.", example: "Quelle est la démarche pour le titre de séjour ?" },
  { id: "2", word: "Formulaire", definition: "Document avec des espaces vides à remplir.", example: "Veuillez remplir ce formulaire à la mairie." },
  { id: "3", word: "Allocations", definition: "Prestations d'argent versées par un organisme.", example: "Il reçoit des allocations familiales." },
];

export default function VocabCoach() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = mockCards[index];

  const handleNext = () => {
    if (index < mockCards.length - 1) {
      setIndex(index + 1);
      setFlipped(false);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-8">
        <Card className="max-w-md text-center p-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Session terminée !</h2>
          <p className="text-muted-foreground mb-8">Tu as appris {mockCards.length} nouveaux mots aujourd'hui.</p>
          <Button className="w-full bg-indigo-600" onClick={() => window.location.href='/dashboard'}>
            Retour au Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8 pt-16 h-screen flex flex-col">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <Badge className="bg-indigo-600 mb-2">Vocabulaire • A2</Badge>
          <h1 className="text-2xl font-bold">Apprentissage Mémoriel</h1>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          {index + 1} / {mockCards.length}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-12 min-h-0">
        <div
          className="relative w-full max-w-lg aspect-[4/3] cursor-pointer perspective-1000 group"
          onClick={() => setFlipped(!flipped)}
        >
          <div className={`
            relative w-full h-full transition-transform duration-500 transform-style-3d
            ${flipped ? 'rotate-y-180' : ''}
          `}>
            {/* Recto */}
            <Card className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 border-2 shadow-xl hover:border-indigo-400 transition-colors">
              <h2 className="text-5xl font-black text-indigo-900 mb-6">{current.word}</h2>
              <div className="flex gap-2">
                <Button size="icon" variant="secondary" className="rounded-full">
                  <Volume2 size={20} />
                </Button>
              </div>
              <p className="absolute bottom-6 text-xs text-muted-foreground uppercase font-bold tracking-widest italic">Cliquer pour voir la définition</p>
            </Card>

            {/* Verso */}
            <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 border-2 border-indigo-600 bg-indigo-50 shadow-xl">
              <div className="text-center space-y-6">
                <div>
                  <div className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-2">Définition</div>
                  <p className="text-xl font-medium text-indigo-950 leading-relaxed">{current.definition}</p>
                </div>
                <div>
                  <div className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-2">Exemple</div>
                  <p className="text-sm italic text-indigo-800 bg-white/50 p-4 rounded-lg">"{current.example}"</p>
                </div>
              </div>
              <p className="absolute bottom-6 text-xs text-indigo-400 uppercase font-bold tracking-widest italic">Cliquer pour revenir au mot</p>
            </Card>
          </div>
        </div>

        <div className={`flex gap-4 transition-opacity duration-300 ${flipped ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
          <Button variant="outline" size="lg" className="h-16 px-8 rounded-2xl border-red-200 text-red-600 hover:bg-red-50" onClick={handleNext}>
            <XCircle className="mr-2" /> Pas encore
          </Button>
          <Button size="lg" className="h-16 px-8 rounded-2xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200" onClick={handleNext}>
            <CheckCircle2 className="mr-2" /> Je maîtrise
          </Button>
        </div>
      </div>
    </div>
  );
}
