"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { InfoTooltip } from "./InfoTooltip";

interface ExamCountdownCardProps {
  targetExamDate: string | null;
  onUpdated: () => void;
}

function daysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function ExamCountdownCard({ targetExamDate, onUpdated }: ExamCountdownCardProps) {
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [dateInput, setDateInput] = useState(targetExamDate || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!dateInput) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ target_exam_date: dateInput }).eq('id', user.id);
      onUpdated();
    }
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <Card className="overflow-hidden border border-zinc-100 bg-white shadow-sm rounded-3xl">
        <CardContent className="p-6 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Date de l'examen</p>
          <Input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="h-10 rounded-2xl text-sm"
          />
          <Button
            onClick={handleSave}
            disabled={saving || !dateInput}
            className="w-full h-11 rounded-2xl text-sm font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? "Enregistrement..." : "Valider"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!targetExamDate) {
    return (
      <Card className="overflow-hidden border border-zinc-100 bg-white shadow-sm rounded-3xl">
        <CardContent className="p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-2">
            <CalendarClock size={20} />
          </div>
          <p className="text-sm font-bold text-zinc-500 leading-snug">Aucune date d'examen définie.</p>
          <Button
            onClick={() => setEditing(true)}
            variant="outline"
            className="w-full h-11 rounded-2xl text-xs font-black uppercase tracking-widest"
          >
            Définir ma date
          </Button>
        </CardContent>
      </Card>
    );
  }

  const remaining = daysUntil(targetExamDate);

  return (
    <Card className="overflow-hidden border border-zinc-100 bg-white shadow-sm rounded-3xl transition-all hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <CalendarClock size={20} />
          </div>
          <InfoTooltip text="Nombre de jours restants avant la date d'examen que vous avez renseignée. Modifiable à tout moment." />
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-black text-zinc-900">
            {remaining >= 0 ? `J-${remaining}` : "Passé"}
          </p>
          <div className="flex flex-col">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Avant l'examen</p>
            <button
              onClick={() => { setDateInput(targetExamDate); setEditing(true); }}
              className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-0.5 hover:text-indigo-600 text-left"
            >
              Modifier la date
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
