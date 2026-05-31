"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Target, BookOpen, PenTool, CheckCircle2 } from "lucide-react";
import { GamificationStats } from "@/components/features/dashboard/GamificationStats";

export default function Dashboard() {
  const [streak] = useState(5);
  const [xp] = useState(1250);
  const [level] = useState("B1");

  return (
    <div className="flex flex-col gap-8 p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bonjour, Prêt pour le TEF ?</h1>
          <p className="text-muted-foreground">Voici ton état d'avancement pour aujourd'hui.</p>
        </div>
        <div className="flex gap-4">
          <Badge variant="outline" className="px-3 py-1 flex gap-2 items-center text-orange-600 border-orange-200 bg-orange-50">
            <Flame size={16} fill="currentColor" /> {streak} jours
          </Badge>
          <Badge variant="outline" className="px-3 py-1 flex gap-2 items-center text-indigo-600 border-indigo-200 bg-indigo-50">
            <Target size={16} /> Niveau {level}
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-500" /> Recommandation du Coach
            </CardTitle>
            <CardDescription>Basé sur tes dernières performances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-indigo-50/50 border-indigo-100">
              <h3 className="font-semibold text-indigo-900">Le subjonctif présent</h3>
              <p className="text-sm text-indigo-700 mt-1">
                Tu as fait quelques erreurs sur l'expression du souhait. Révise cette leçon pour solidifier ton niveau B2.
              </p>
              <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">Commencer la leçon</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progression XP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Niveau {level}</span>
                  <span>{xp} / 2000 XP</span>
                </div>
                <Progress value={(xp / 2000) * 100} className="h-2" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span>Compréhension Écrite : 85%</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span>Grammaire : 72%</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-200" />
                  <span>Expression Écrite : 40%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <GamificationStats />
        </div>
      </div>

      <section>
        <h2 className="text-xl font-bold mb-4">Activités Rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "QCM Express", icon: Target, desc: "5 min - Grammaire" },
            { title: "Entraînement Écrit", icon: PenTool, desc: "20 min - Section B" },
            { title: "Vocabulaire", icon: BookOpen, desc: "10 min - Administration" },
            { title: "Examen Blanc", icon: CheckCircle2, desc: "1h30 - Complet" },
          ].map((item, i) => (
            <Card key={i} className="hover:border-indigo-300 transition-colors cursor-pointer group">
              <CardContent className="pt-6">
                <item.icon className="mb-2 text-muted-foreground group-hover:text-indigo-600 transition-colors" size={24} />
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
