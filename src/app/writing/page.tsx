"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, CheckCircle, AlertCircle, Sparkles, PenTool } from "lucide-react";

interface FeedbackAnnotation {
  text: string;
  correction?: string;
  explanation: string;
  type: "error" | "improvement";
}

export default function WritingCoach() {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<{
    score: number;
    level: string;
    comment: string;
    annotations: FeedbackAnnotation[];
    improved: string;
  } | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({
          text,
          subject: "Écrivez un mail pour postuler à une offre d'emploi (min 100 mots)",
          targetLevel: "B2"
        }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      setFeedback(data);
    } catch (error) {
      console.error("Analyse error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-8 max-w-5xl mx-auto h-[calc(100vh-2rem)]">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Coach d'Expression Écrite</h1>
        <p className="text-muted-foreground">Sujet : Écrivez un mail pour postuler à une offre d'emploi (min 100 mots).</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Votre Rédaction</CardTitle>
            <span className={`text-xs ${wordCount < 100 ? 'text-orange-500' : 'text-green-600'}`}>
              {wordCount} mots
            </span>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <Textarea
              placeholder="Commencez à rédiger ici..."
              className="w-full h-full border-0 focus-visible:ring-0 resize-none p-6 text-lg leading-relaxed"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </CardContent>
          <CardFooter className="border-t p-4 flex justify-between">
            <p className="text-xs text-muted-foreground">Appuyez sur Analyser pour recevoir le feedback de l'IA.</p>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || wordCount < 10}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyse...</> : <><Send className="mr-2 h-4 w-4" /> Analyser</>}
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" /> Analyse du Coach IA
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            {feedback ? (
              <ScrollArea className="h-full p-6">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-1 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <div className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Score Estimé</div>
                      <div className="text-3xl font-bold text-indigo-900">{feedback.score}/100</div>
                    </div>
                    <div className="flex-1 p-4 bg-green-50 border border-green-100 rounded-lg">
                      <div className="text-xs text-green-600 font-bold uppercase tracking-wider">Niveau</div>
                      <div className="text-3xl font-bold text-green-900">{feedback.level}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Commentaire Global</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feedback.comment}</p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">Corrections Détaillées</h3>
                    {feedback.annotations.map((ann, i) => (
                      <div key={i} className="p-3 border rounded-lg text-sm bg-white shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          {ann.type === "error" ? <AlertCircle size={14} className="text-red-500" /> : <Sparkles size={14} className="text-amber-500" />}
                          <span className="font-medium line-through text-muted-foreground">{ann.text}</span>
                          <span className="text-green-600 font-bold">→ {ann.correction}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 italic">{ann.explanation}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-600" /> Version Améliorée (B2)
                    </h3>
                    <p className="text-sm italic text-muted-foreground leading-relaxed">
                      "{feedback.improved}"
                    </p>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  <PenTool className="text-muted-foreground" />
                </div>
                <h3 className="font-medium">Aucune analyse disponible</h3>
                <p className="text-xs mt-1">Rédigez un texte et lancez l'analyse pour voir les conseils du coach.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
