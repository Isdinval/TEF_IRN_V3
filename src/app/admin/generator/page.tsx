"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Plus, BookOpen, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ContentGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExercises, setGeneratedExercises] = useState<any[]>([]);

  const generateContent = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/generate-exercise', {
        method: 'POST',
        body: JSON.stringify({ level: 'B1', category: 'grammaire' })
      });
      const data = await res.json();
      if (data.exercise) {
        setGeneratedExercises([data.exercise, ...generatedExercises]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 pt-12">
      <header className="flex justify-between items-end mb-12">
        <div>
          <Badge className="bg-slate-900 mb-2">ZONE ADMIN</Badge>
          <h1 className="text-4xl font-black tracking-tight">Générateur de Contenu IA</h1>
          <p className="text-muted-foreground text-lg">Enrichissez la bibliothèque d'exercices en un clic.</p>
        </div>
        <Button
          size="lg"
          onClick={generateContent}
          disabled={isGenerating}
          className="h-16 px-8 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100"
        >
          {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
          Générer 10 exercices (B1)
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-12 text-center group cursor-pointer hover:border-indigo-300 transition-all">
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
             <Plus className="text-slate-400 group-hover:text-indigo-600" />
           </div>
           <p className="font-bold text-slate-400 group-hover:text-indigo-600">Créer manuellement</p>
        </Card>

        {generatedExercises.map((ex, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="h-full overflow-hidden border-2 border-slate-100 shadow-none hover:border-indigo-100 transition-all">
              <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className="text-indigo-600 border-indigo-100">B1 • Grammaire</Badge>
                  <div className="flex gap-2">
                    <button className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
                <CardTitle className="text-lg font-bold leading-tight line-clamp-2">
                  {ex.instructions}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                 <div className="p-4 bg-slate-50 rounded-xl text-sm italic text-slate-600 border border-slate-100 mb-4">
                    {ex.content.sentence || "Contenu de l'exercice..."}
                 </div>
                 <Button variant="outline" className="w-full justify-between font-bold text-xs">
                    VOIR LE DÉTAIL <BookOpen size={14} />
                 </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
