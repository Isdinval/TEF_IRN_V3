"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, TrendingUp, RotateCcw, MessageSquareText } from "lucide-react";
import { ORAL_CRITERIA_LABELS, OralAnalysis, OralTurn } from "@/lib/oral-criteria";

export function OralAnalysisView({
  analysis,
  transcript,
  onRestart,
}: {
  analysis: OralAnalysis;
  transcript: OralTurn[];
  onRestart: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-none bg-slate-950 shadow-2xl shadow-indigo-100">
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <Badge className="rounded-full border-none bg-indigo-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest">
            Niveau estimé
          </Badge>
          <h2 className="text-6xl font-black tracking-tighter text-white">{analysis.estimated_level}</h2>
          <p className="text-sm font-medium text-slate-400">
            Score global : <span className="font-black text-white">{analysis.overall_score}/100</span>
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-xl shadow-zinc-200/50">
        <CardHeader className="border-b border-zinc-100 bg-zinc-50 px-6 py-4">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Détail par critère (grille officielle TEF IRN)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-6">
          {(Object.keys(ORAL_CRITERIA_LABELS) as (keyof typeof ORAL_CRITERIA_LABELS)[]).map((key) => (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-zinc-700">{ORAL_CRITERIA_LABELS[key]}</span>
                <span className="font-black text-indigo-600">{analysis.scores?.[key] ?? "—"}/100</span>
              </div>
              <Progress value={analysis.scores?.[key] ?? 0} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-xl shadow-zinc-200/50">
          <CardHeader className="border-b border-zinc-100 bg-emerald-50 px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">
              <CheckCircle2 size={14} /> Points forts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="flex flex-col gap-2 text-sm font-medium leading-relaxed text-zinc-600">
              {analysis.strengths?.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-xl shadow-zinc-200/50">
          <CardHeader className="border-b border-zinc-100 bg-amber-50 px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-700">
              <TrendingUp size={14} /> À travailler
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="flex flex-col gap-2 text-sm font-medium leading-relaxed text-zinc-600">
              {analysis.improvements?.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-xl shadow-zinc-200/50">
        <CardHeader className="border-b border-zinc-100 bg-zinc-50 px-6 py-4">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Commentaire du coach
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-sm font-medium leading-relaxed text-zinc-600">
          {analysis.general_comment}
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-xl shadow-zinc-200/50">
        <CardHeader className="border-b border-zinc-100 bg-zinc-50 px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <MessageSquareText size={14} /> Transcription complète
          </CardTitle>
        </CardHeader>
        <CardContent className="flex max-h-[300px] flex-col gap-3 overflow-auto p-6">
          {transcript.map((t, i) => (
            <p key={i} className="text-sm leading-relaxed">
              <span className={`font-black ${t.role === "candidat" ? "text-indigo-600" : "text-zinc-500"}`}>
                {t.role === "candidat" ? "Vous : " : "Coach : "}
              </span>
              <span className="text-zinc-600">{t.text}</span>
            </p>
          ))}
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="h-14 w-fit self-center rounded-2xl bg-indigo-600 px-8 font-black shadow-xl shadow-indigo-900/20 hover:bg-indigo-700"
        onClick={onRestart}
      >
        <RotateCcw className="mr-2" size={18} /> Choisir un nouvel exercice
      </Button>
    </div>
  );
}
