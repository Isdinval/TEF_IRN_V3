"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminGuardScreen } from "@/components/shared/AdminGuardScreen";

type Section = "CO" | "CE" | "EE" | "EO";

const SECTIONS: Section[] = ["CO", "CE", "EE", "EO"];
const SECTION_TYPE: Record<Section, string> = { CO: "audio", CE: "text", EE: "writing", EO: "speaking" };
const SECTION_LABEL: Record<Section, string> = {
  CO: "Compréhension orale",
  CE: "Compréhension écrite",
  EE: "Expression écrite",
  EO: "Expression orale",
};
const LETTERS = ["A", "B", "C", "D"];

interface ExamQuestionRow {
  id: string;
  exam_id: string;
  section: Section;
  order_index: number;
  type: string;
  question: string | null;
  options: string[] | null;
  correct_answer: string | null;
  audio_url: string | null;
  max_plays: number | null;
  transcription: string | null;
  texte: string | null;
  prompt: string | null;
  min_words: number | null;
  max_time: number | null;
  prep_time: number | null;
  speak_time: number | null;
  instructions: string | null;
  oral_scenario_id: string | null;
}

interface OralScenarioOption {
  id: string;
  title: string;
  section: string;
  level: string;
}

const EMPTY_FORM = {
  section: "CO" as Section,
  orderIndex: 1,
  instructions: "",
  // CO / CE (QCM)
  question: "",
  qcmOptions: ["", "", "", ""],
  correctIndex: 0,
  // CO only
  audioUrl: "",
  maxPlays: 2,
  transcription: "",
  // CE only
  texte: "",
  // EE only
  prompt: "",
  minWords: 40,
  maxTime: 10,
  // EO only
  prepTime: 1,
  speakTime: 5,
  oralScenarioId: "",
};

export default function ExamQuestionsAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const authState = useAdminGuard();
  const params = useParams();
  const examId = params?.examId as string;

  const [examLabel, setExamLabel] = useState<string>("");
  const [questions, setQuestions] = useState<ExamQuestionRow[]>([]);
  const [oralScenarios, setOralScenarios] = useState<OralScenarioOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<Section | "Toutes">("Toutes");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchExamLabel = useCallback(async () => {
    const { data } = await supabase.from("exams").select("label").eq("id", examId).maybeSingle();
    if (data) setExamLabel(data.label);
  }, [supabase, examId]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("exam_questions").select("*").eq("exam_id", examId).order("section", { ascending: true }).order("order_index", { ascending: true });
    if (sectionFilter !== "Toutes") query = query.eq("section", sectionFilter);
    const { data, error } = await query.limit(200);
    if (!error) setQuestions((data as ExamQuestionRow[]) || []);
    setLoading(false);
  }, [supabase, examId, sectionFilter]);

  const fetchOralScenarios = useCallback(async () => {
    const { data } = await supabase.from("oral_exam_scenarios").select("id, title, section, level").order("title", { ascending: true });
    setOralScenarios((data as OralScenarioOption[]) || []);
  }, [supabase]);

  useEffect(() => {
    if (authState === "granted" && examId) {
      fetchExamLabel();
      fetchQuestions();
      fetchOralScenarios();
    }
  }, [authState, examId, fetchExamLabel, fetchQuestions, fetchOralScenarios]);

  const nextOrderIndex = (section: Section) => {
    const inSection = questions.filter((q) => q.section === section);
    if (inSection.length === 0) return 1;
    return Math.max(...inSection.map((q) => q.order_index)) + 1;
  };

  const openCreateDialog = (section: Section) => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, section, orderIndex: nextOrderIndex(section) });
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const openEditDialog = (q: ExamQuestionRow) => {
    setEditingId(q.id);
    const options = Array.isArray(q.options) ? q.options : [];
    const qcmOptions = LETTERS.map((_, i) => (options[i] || "").replace(/^[A-D]\)\s*/, ""));
    const correctIndex = Math.max(0, LETTERS.indexOf(q.correct_answer || "A"));
    setForm({
      section: q.section,
      orderIndex: q.order_index,
      instructions: q.instructions || "",
      question: q.question || "",
      qcmOptions,
      correctIndex,
      audioUrl: q.audio_url || "",
      maxPlays: q.max_plays || 2,
      transcription: q.transcription || "",
      texte: q.texte || "",
      prompt: q.prompt || "",
      minWords: q.min_words || 40,
      maxTime: q.max_time || 10,
      prepTime: q.prep_time || 1,
      speakTime: q.speak_time || 5,
      oralScenarioId: q.oral_scenario_id || "",
    });
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const validate = (): string | null => {
    if (!form.instructions.trim()) return "Les consignes sont obligatoires.";
    if (form.section === "CO" || form.section === "CE") {
      if (!form.question.trim()) return "L'énoncé de la question est obligatoire.";
      if (form.qcmOptions.some((o) => !o.trim())) return "Les 4 options doivent être remplies.";
      if (form.section === "CE" && !form.texte.trim()) return "Le texte de lecture est obligatoire pour la CE.";
    } else if (form.section === "EE") {
      if (!form.prompt.trim()) return "Le sujet est obligatoire.";
      if (form.minWords <= 0) return "Le nombre de mots minimum doit être positif.";
    } else {
      if (!form.prompt.trim()) return "Le sujet est obligatoire.";
      if (!form.oralScenarioId) return "Sélectionnez un scénario oral associé.";
    }
    return null;
  };

  const buildPayload = () => {
    const base = {
      exam_id: examId,
      section: form.section,
      type: SECTION_TYPE[form.section],
      order_index: form.orderIndex,
      instructions: form.instructions.trim(),
    };
    if (form.section === "CO" || form.section === "CE") {
      const options = form.qcmOptions.map((o, i) => `${LETTERS[i]}) ${o.trim()}`);
      return {
        ...base,
        question: form.question.trim(),
        options,
        correct_answer: LETTERS[form.correctIndex],
        audio_url: form.section === "CO" ? form.audioUrl.trim() || null : null,
        max_plays: form.section === "CO" ? form.maxPlays : null,
        transcription: form.section === "CO" ? form.transcription.trim() || null : null,
        texte: form.section === "CE" ? form.texte.trim() : null,
      };
    }
    if (form.section === "EE") {
      return {
        ...base,
        prompt: form.prompt.trim(),
        min_words: form.minWords,
        max_time: form.maxTime,
      };
    }
    return {
      ...base,
      prompt: form.prompt.trim(),
      prep_time: form.prepTime,
      speak_time: form.speakTime,
      oral_scenario_id: form.oralScenarioId,
    };
  };

  const handleSave = async () => {
    setErrorMsg(null);
    const validationError = validate();
    if (validationError) { setErrorMsg(validationError); return; }

    setSaving(true);
    try {
      const payload = buildPayload();
      const { error } = editingId
        ? await supabase.from("exam_questions").update(payload).eq("id", editingId)
        : await supabase.from("exam_questions").insert(payload);
      if (error) throw error;
      setDialogOpen(false);
      fetchQuestions();
    } catch (err: any) {
      console.error("Error saving exam question:", err);
      setErrorMsg(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cette question ?")) return;
    const { error } = await supabase.from("exam_questions").delete().eq("id", id);
    if (!error) fetchQuestions();
  };

  if (authState !== "granted") {
    return <AdminGuardScreen state={authState} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 pt-12">
      <Link href="/tef-irn/admin/exams" className="inline-flex items-center gap-1.5 text-xs font-black text-zinc-400 hover:text-indigo-600 mb-4">
        <ArrowLeft size={14} /> Retour aux examens
      </Link>
      <header className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <Badge className="bg-slate-900 mb-2">ZONE ADMIN</Badge>
          <h1 className="text-3xl font-black tracking-tight">Questions — {examLabel || "..."}</h1>
          <p className="text-muted-foreground">
            {questions.length} question{questions.length > 1 ? "s" : ""} affichée{questions.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {SECTIONS.map((s) => (
            <Button key={s} variant="secondary" onClick={() => openCreateDialog(s)} className="h-10 px-4 rounded-2xl font-black text-xs">
              <Plus className="mr-1.5" size={14} /> {s}
            </Button>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value as Section | "Toutes")} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="Toutes">Toutes les sections</option>
          {SECTIONS.map((s) => <option key={s} value={s}>{s} — {SECTION_LABEL[s]}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50">
          {questions.length === 0 && (
            <p className="p-8 text-center text-zinc-400 font-bold text-sm">Aucune question ne correspond à ce filtre.</p>
          )}
          {questions.map((q) => (
            <div key={q.id} className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] font-black uppercase">{q.section} #{q.order_index}</Badge>
                  <Badge className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-500 border-none">{q.type}</Badge>
                </div>
                <p className="text-sm font-bold text-zinc-800 truncate">
                  {q.question || q.prompt || "(sans énoncé)"}
                </p>
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
            <DialogTitle>{editingId ? "Modifier la question" : `Nouvelle question ${form.section}`}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {errorMsg && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">{errorMsg}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Section</Label>
                <select
                  value={form.section}
                  disabled={!!editingId}
                  onChange={(e) => setForm((f) => ({ ...f, section: e.target.value as Section }))}
                  className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold disabled:opacity-50"
                >
                  {SECTIONS.map((s) => <option key={s} value={s}>{s} — {SECTION_LABEL[s]}</option>)}
                </select>
                {editingId && <p className="text-[10px] text-zinc-400 mt-1">La section ne peut pas être changée après création.</p>}
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Ordre dans la section</Label>
                <Input type="number" value={form.orderIndex} onChange={(e) => setForm((f) => ({ ...f, orderIndex: parseInt(e.target.value, 10) || 1 }))} className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Consignes</Label>
              <Textarea value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} className="mt-1" placeholder="Consigne affichée au candidat" />
            </div>

            {(form.section === "CO" || form.section === "CE") && (
              <div className="space-y-3 p-4 bg-zinc-50 rounded-2xl">
                <div>
                  <Label className="text-xs font-black uppercase text-zinc-400">Question</Label>
                  <Input value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} className="mt-1 bg-white" />
                </div>
                {form.section === "CE" && (
                  <div>
                    <Label className="text-xs font-black uppercase text-zinc-400">Texte de lecture</Label>
                    <Textarea value={form.texte} onChange={(e) => setForm((f) => ({ ...f, texte: e.target.value }))} className="mt-1 bg-white" rows={4} />
                  </div>
                )}
                {form.section === "CO" && (
                  <>
                    <div>
                      <Label className="text-xs font-black uppercase text-zinc-400">URL audio</Label>
                      <Input value={form.audioUrl} onChange={(e) => setForm((f) => ({ ...f, audioUrl: e.target.value }))} className="mt-1 bg-white" placeholder="/audio/exam-1/co-01.mp3" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-black uppercase text-zinc-400">Écoutes max</Label>
                        <Input type="number" value={form.maxPlays} onChange={(e) => setForm((f) => ({ ...f, maxPlays: parseInt(e.target.value, 10) || 1 }))} className="mt-1 bg-white" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-black uppercase text-zinc-400">Transcription (optionnel, usage interne)</Label>
                      <Textarea value={form.transcription} onChange={(e) => setForm((f) => ({ ...f, transcription: e.target.value }))} className="mt-1 bg-white" rows={3} />
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <Label className="text-xs font-black uppercase text-zinc-400">Options (la sélection radio indique la bonne réponse)</Label>
                  {form.qcmOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct-option"
                        checked={form.correctIndex === i}
                        onChange={() => setForm((f) => ({ ...f, correctIndex: i }))}
                      />
                      <span className="text-xs font-black text-zinc-400 w-4">{LETTERS[i]}</span>
                      <Input
                        value={opt}
                        onChange={(e) => setForm((f) => ({ ...f, qcmOptions: f.qcmOptions.map((o, idx) => (idx === i ? e.target.value : o)) }))}
                        placeholder={`Option ${LETTERS[i]}`}
                        className="bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {form.section === "EE" && (
              <div className="space-y-3 p-4 bg-zinc-50 rounded-2xl">
                <div>
                  <Label className="text-xs font-black uppercase text-zinc-400">Sujet</Label>
                  <Textarea value={form.prompt} onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))} className="mt-1 bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-black uppercase text-zinc-400">Mots minimum</Label>
                    <Input type="number" value={form.minWords} onChange={(e) => setForm((f) => ({ ...f, minWords: parseInt(e.target.value, 10) || 0 }))} className="mt-1 bg-white" />
                  </div>
                  <div>
                    <Label className="text-xs font-black uppercase text-zinc-400">Durée (minutes)</Label>
                    <Input type="number" value={form.maxTime} onChange={(e) => setForm((f) => ({ ...f, maxTime: parseInt(e.target.value, 10) || 0 }))} className="mt-1 bg-white" />
                  </div>
                </div>
              </div>
            )}

            {form.section === "EO" && (
              <div className="space-y-3 p-4 bg-zinc-50 rounded-2xl">
                <div>
                  <Label className="text-xs font-black uppercase text-zinc-400">Sujet / mise en situation</Label>
                  <Textarea value={form.prompt} onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))} className="mt-1 bg-white" />
                </div>
                <div>
                  <Label className="text-xs font-black uppercase text-zinc-400">Scénario oral associé</Label>
                  <select
                    value={form.oralScenarioId}
                    onChange={(e) => setForm((f) => ({ ...f, oralScenarioId: e.target.value }))}
                    className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold bg-white"
                  >
                    <option value="">— Sélectionner —</option>
                    {oralScenarios.map((s) => (
                      <option key={s.id} value={s.id}>{s.title} (Section {s.section}, {s.level})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Gérés sur <Link href="/tef-irn/admin/oral-scenarios" className="underline">/tef-irn/admin/oral-scenarios</Link>.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-black uppercase text-zinc-400">Préparation (minutes)</Label>
                    <Input type="number" value={form.prepTime} onChange={(e) => setForm((f) => ({ ...f, prepTime: parseInt(e.target.value, 10) || 0 }))} className="mt-1 bg-white" />
                  </div>
                  <div>
                    <Label className="text-xs font-black uppercase text-zinc-400">Prise de parole (minutes)</Label>
                    <Input type="number" value={form.speakTime} onChange={(e) => setForm((f) => ({ ...f, speakTime: parseInt(e.target.value, 10) || 0 }))} className="mt-1 bg-white" />
                  </div>
                </div>
              </div>
            )}
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
