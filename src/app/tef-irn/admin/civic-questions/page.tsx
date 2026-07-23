"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminGuardScreen } from "@/components/shared/AdminGuardScreen";

interface CivicQuestionRow {
  id: string;
  theme: string;
  mentions: string[];
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  source_ref: string | null;
  source_url: string | null;
  reviewed: boolean;
}

const THEMES = [
  { value: "vivre_societe", label: "Vivre en société" },
  { value: "principes_valeurs", label: "Principes & valeurs" },
  { value: "systeme_politique", label: "Système politique" },
  { value: "droits_devoirs", label: "Droits & devoirs" },
  { value: "histoire_geo_culture", label: "Histoire, géo & culture" },
];

const MENTIONS = ["csp", "cr", "naturalisation"];

const EMPTY_FORM = {
  theme: THEMES[0].value,
  mentions: [] as string[],
  question: "",
  options: ["", "", "", ""] as string[],
  correct_answer: "",
  explanation: "",
  source_ref: "",
  source_url: "",
  reviewed: false,
};

export default function CivicQuestionsAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const authState = useAdminGuard();
  const [questions, setQuestions] = useState<CivicQuestionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [themeFilter, setThemeFilter] = useState("Toutes");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("civic_questions").select("*").order("theme").order("question");
    if (themeFilter !== "Toutes") query = query.eq("theme", themeFilter);
    if (search.trim()) query = query.ilike("question", `%${search.trim()}%`);
    const { data, error } = await query.limit(200);
    if (!error) setQuestions((data as CivicQuestionRow[]) || []);
    setLoading(false);
  }, [supabase, themeFilter, search]);

  useEffect(() => {
    if (authState === "granted") fetchQuestions();
  }, [authState, fetchQuestions]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const openEditDialog = (q: CivicQuestionRow) => {
    setEditingId(q.id);
    setForm({
      theme: q.theme,
      mentions: q.mentions,
      question: q.question,
      options: [...q.options],
      correct_answer: q.correct_answer,
      explanation: q.explanation || "",
      source_ref: q.source_ref || "",
      source_url: q.source_url || "",
      reviewed: q.reviewed,
    });
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const toggleMention = (m: string) => {
    setForm((f) => ({
      ...f,
      mentions: f.mentions.includes(m) ? f.mentions.filter((x) => x !== m) : [...f.mentions, m],
    }));
  };

  const updateOption = (i: number, value: string) => {
    setForm((f) => {
      const options = [...f.options];
      options[i] = value;
      return { ...f, options };
    });
  };

  const handleSave = async () => {
    setErrorMsg(null);
    if (!form.question.trim() || form.options.some((o) => !o.trim()) || !form.correct_answer.trim()) {
      setErrorMsg("La question, les 4 options et la réponse correcte sont obligatoires.");
      return;
    }
    if (!form.options.includes(form.correct_answer)) {
      setErrorMsg("La réponse correcte doit être exactement l'une des 4 options.");
      return;
    }
    if (form.mentions.length === 0) {
      setErrorMsg("Sélectionnez au moins une mention (CSP, CR, naturalisation).");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        theme: form.theme,
        mentions: form.mentions,
        question: form.question.trim(),
        options: form.options.map((o) => o.trim()),
        correct_answer: form.correct_answer.trim(),
        explanation: form.explanation.trim() || null,
        source_ref: form.source_ref.trim() || null,
        source_url: form.source_url.trim() || null,
        reviewed: form.reviewed,
      };
      const { error } = editingId
        ? await supabase.from("civic_questions").update(payload).eq("id", editingId)
        : await supabase.from("civic_questions").insert(payload);
      if (error) throw error;
      setDialogOpen(false);
      fetchQuestions();
    } catch (err: any) {
      console.error("Error saving civic question:", err);
      setErrorMsg(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cette question ?")) return;
    const { error } = await supabase.from("civic_questions").delete().eq("id", id);
    if (!error) fetchQuestions();
  };

  const handleToggleReviewed = async (q: CivicQuestionRow) => {
    const { error } = await supabase.from("civic_questions").update({ reviewed: !q.reviewed }).eq("id", q.id);
    if (!error) fetchQuestions();
  };

  if (authState !== "granted") {
    return <AdminGuardScreen state={authState} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 pt-12">
      <header className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <Badge className="bg-slate-900 mb-2">ZONE ADMIN</Badge>
          <h1 className="text-3xl font-black tracking-tight">Questions — Examen Civique</h1>
          <p className="text-muted-foreground">
            {questions.length} question{questions.length > 1 ? "s" : ""} affichée{questions.length > 1 ? "s" : ""} —{" "}
            <Link href="/tef-irn/admin/generator" className="text-indigo-600 hover:underline font-bold">
              Générateur TEF
            </Link>
          </p>
        </div>
        <Button onClick={openCreateDialog} className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black shadow-xl shadow-indigo-100">
          <Plus className="mr-2" size={18} /> Ajouter une question
        </Button>
      </header>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={themeFilter}
          onChange={(e) => setThemeFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold"
        >
          <option value="Toutes">Toutes les thématiques</option>
          {THEMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <Input
          placeholder="Rechercher dans le texte des questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 max-w-xs"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50">
          {questions.length === 0 && (
            <p className="p-8 text-center text-zinc-400 font-bold text-sm">Aucune question ne correspond à ces filtres.</p>
          )}
          {questions.map((q) => (
            <div key={q.id} className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] font-black uppercase">
                    {THEMES.find((t) => t.value === q.theme)?.label || q.theme}
                  </Badge>
                  {q.mentions.map((m) => (
                    <Badge key={m} className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-500 border-none">{m}</Badge>
                  ))}
                  <button
                    onClick={() => handleToggleReviewed(q)}
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${q.reviewed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}
                  >
                    {q.reviewed ? "Publiée" : "Brouillon"}
                  </button>
                </div>
                <p className="text-sm font-bold text-zinc-800 truncate">{q.question}</p>
                <p className="text-xs text-zinc-400 truncate">Réponse : {q.correct_answer}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEditDialog(q)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-indigo-600">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(q.id)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-rose-600">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier la question" : "Nouvelle question"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {errorMsg && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">{errorMsg}</div>}

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Thématique</Label>
              <select
                value={form.theme}
                onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))}
                className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold"
              >
                {THEMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Mentions concernées</Label>
              <div className="flex gap-2 mt-1">
                {MENTIONS.map((m) => (
                  <button
                    key={m}
                    onClick={() => toggleMention(m)}
                    className={`px-4 h-9 rounded-xl text-xs font-black uppercase transition-all ${form.mentions.includes(m) ? 'bg-indigo-600 text-white' : 'bg-zinc-50 text-zinc-400'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Question</Label>
              <Textarea value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} className="mt-1" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-zinc-400">4 options (cochez la bonne réponse)</Label>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct_answer"
                    checked={form.correct_answer === opt && opt.trim() !== ""}
                    onChange={() => setForm((f) => ({ ...f, correct_answer: opt }))}
                    className="shrink-0"
                  />
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const wasCorrect = form.correct_answer === form.options[i];
                      updateOption(i, e.target.value);
                      if (wasCorrect) setForm((f) => ({ ...f, correct_answer: e.target.value }));
                    }}
                    placeholder={`Option ${i + 1}`}
                  />
                </div>
              ))}
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Explication</Label>
              <Textarea value={form.explanation} onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))} className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Source (libellé)</Label>
                <Input value={form.source_ref} onChange={(e) => setForm((f) => ({ ...f, source_ref: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Source (URL)</Label>
                <Input value={form.source_url} onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))} className="mt-1" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
              <div>
                <p className="text-sm font-black text-zinc-900">Publiée (visible des utilisateurs)</p>
                <p className="text-xs text-zinc-400">Une question non publiée reste invisible côté révision/examen.</p>
              </div>
              <Switch checked={form.reviewed} onCheckedChange={(v) => setForm((f) => ({ ...f, reviewed: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)} className="rounded-2xl font-black text-sm">
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 text-white rounded-2xl font-black text-sm">
              {saving ? <Loader2 className="animate-spin" size={16} /> : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
