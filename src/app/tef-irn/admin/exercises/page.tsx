"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminGuardScreen } from "@/components/shared/AdminGuardScreen";

type ExerciseType = "trous" | "qcm" | "ecrit";

interface ExerciseRow {
  id: string;
  type: string | null;
  level: string | null;
  category: string | null;
  difficulty: string | null;
  instructions: string;
  content: any;
  is_ai_generated: boolean | null;
  tags: string[] | null;
}

const TYPES: { value: ExerciseType; label: string }[] = [
  { value: "trous", label: "Texte à trous" },
  { value: "qcm", label: "QCM" },
  { value: "ecrit", label: "Expression écrite" },
];

const LEVELS = ["A1", "A2", "B1", "B2"];
const CATEGORIES = ["Grammaire", "Conjugaison", "Orthographe", "Syntaxe"];
const DIFFICULTIES = ["facile", "moyen", "difficile"];

interface QcmItem {
  question: string;
  options: string[];
  correctIndex: number;
}

const EMPTY_QCM_ITEM = (): QcmItem => ({ question: "", options: ["", "", "", ""], correctIndex: 0 });

const EMPTY_FORM = {
  type: "trous" as ExerciseType,
  level: LEVELS[0],
  category: CATEGORIES[0],
  difficulty: "facile",
  instructions: "",
  tags: "",
  // trous
  sentence: "",
  errorFragment: "",
  correctAnswer: "",
  explanation: "",
  // ecrit
  prompt: "",
  // qcm / qcm_centre_entrainement
  qcmItems: [EMPTY_QCM_ITEM()] as QcmItem[],
};

export default function ExercisesAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const authState = useAdminGuard();
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("Toutes");
  const [levelFilter, setLevelFilter] = useState("Toutes");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("exercises").select("*").order("created_at", { ascending: false });
    if (typeFilter !== "Toutes") query = query.eq("type", typeFilter);
    if (levelFilter !== "Toutes") query = query.eq("level", levelFilter);
    if (search.trim()) query = query.ilike("instructions", `%${search.trim()}%`);
    const { data, error } = await query.limit(200);
    if (!error) setExercises((data as ExerciseRow[]) || []);
    setLoading(false);
  }, [supabase, typeFilter, levelFilter, search]);

  useEffect(() => {
    if (authState === "granted") fetchExercises();
  }, [authState, fetchExercises]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, qcmItems: [EMPTY_QCM_ITEM()] });
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const openEditDialog = (ex: ExerciseRow) => {
    setEditingId(ex.id);
    const type = (ex.type as ExerciseType) || "trous";
    const base = {
      ...EMPTY_FORM,
      type,
      level: ex.level || LEVELS[0],
      category: ex.category || CATEGORIES[0],
      difficulty: ex.difficulty || "facile",
      instructions: ex.instructions || "",
      tags: (ex.tags || []).join(", "),
    };
    if (type === "trous") {
      setForm({
        ...base,
        sentence: ex.content?.sentence || "",
        errorFragment: ex.content?.error_fragment || "",
        correctAnswer: ex.content?.correct_answer || "",
        explanation: ex.content?.explanation || "",
      });
    } else if (type === "ecrit") {
      setForm({ ...base, prompt: ex.content?.prompt || "" });
    } else {
      const questions: string[] = ex.content?.questions || [];
      const options: string[][] = ex.content?.options || [];
      const correctAnswers: number[] = ex.content?.correct_answers || [];
      const qcmItems: QcmItem[] = questions.length > 0
        ? questions.map((q, i) => ({ question: q, options: options[i] || ["", "", "", ""], correctIndex: correctAnswers[i] ?? 0 }))
        : [EMPTY_QCM_ITEM()];
      setForm({ ...base, qcmItems });
    }
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const addQcmItem = () => setForm((f) => ({ ...f, qcmItems: [...f.qcmItems, EMPTY_QCM_ITEM()] }));
  const removeQcmItem = (i: number) => setForm((f) => ({ ...f, qcmItems: f.qcmItems.filter((_, idx) => idx !== i) }));
  const updateQcmItem = (i: number, patch: Partial<QcmItem>) =>
    setForm((f) => ({ ...f, qcmItems: f.qcmItems.map((item, idx) => (idx === i ? { ...item, ...patch } : item)) }));
  const updateQcmOption = (i: number, optIdx: number, value: string) =>
    setForm((f) => ({
      ...f,
      qcmItems: f.qcmItems.map((item, idx) => {
        if (idx !== i) return item;
        const options = [...item.options];
        options[optIdx] = value;
        return { ...item, options };
      }),
    }));

  const buildContent = () => {
    if (form.type === "trous") {
      return { sentence: form.sentence.trim(), error_fragment: form.errorFragment.trim(), correct_answer: form.correctAnswer.trim(), explanation: form.explanation.trim() };
    }
    if (form.type === "ecrit") {
      return { prompt: form.prompt.trim() };
    }
    return {
      questions: form.qcmItems.map((i) => i.question.trim()),
      options: form.qcmItems.map((i) => i.options.map((o) => o.trim())),
      correct_answers: form.qcmItems.map((i) => i.correctIndex),
    };
  };

  const validate = (): string | null => {
    if (!form.instructions.trim()) return "Les consignes sont obligatoires.";
    if (form.type === "trous") {
      if (!form.sentence.trim() || !form.correctAnswer.trim()) return "La phrase et la réponse correcte sont obligatoires.";
    } else if (form.type === "ecrit") {
      if (!form.prompt.trim()) return "Le sujet de production écrite est obligatoire.";
    } else {
      if (form.qcmItems.length === 0) return "Ajoutez au moins une question.";
      for (const item of form.qcmItems) {
        if (!item.question.trim() || item.options.some((o) => !o.trim())) {
          return "Chaque question doit avoir un énoncé et ses 4 options remplies.";
        }
      }
    }
    return null;
  };

  const handleSave = async () => {
    setErrorMsg(null);
    const validationError = validate();
    if (validationError) { setErrorMsg(validationError); return; }

    setSaving(true);
    try {
      const payload = {
        type: form.type,
        level: form.level,
        category: form.category,
        difficulty: form.difficulty,
        instructions: form.instructions.trim(),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        content: buildContent(),
        is_ai_generated: false,
      };
      const { error } = editingId
        ? await supabase.from("exercises").update(payload).eq("id", editingId)
        : await supabase.from("exercises").insert(payload);
      if (error) throw error;
      setDialogOpen(false);
      fetchExercises();
    } catch (err: any) {
      console.error("Error saving exercise:", err);
      setErrorMsg(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cet exercice ?")) return;
    const { error } = await supabase.from("exercises").delete().eq("id", id);
    if (!error) fetchExercises();
  };

  if (authState !== "granted") {
    return <AdminGuardScreen state={authState} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 pt-12">
      <header className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <Badge className="bg-slate-900 mb-2">ZONE ADMIN</Badge>
          <h1 className="text-3xl font-black tracking-tight">Exercices TEF</h1>
          <p className="text-muted-foreground">
            {exercises.length} exercice{exercises.length > 1 ? "s" : ""} affiché{exercises.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreateDialog} className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black shadow-xl shadow-indigo-100">
          <Plus className="mr-2" size={18} /> Ajouter un exercice
        </Button>
      </header>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="Toutes">Tous les types</option>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="Toutes">Tous les niveaux</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <Input placeholder="Rechercher dans les consignes..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 max-w-xs" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50">
          {exercises.length === 0 && (
            <p className="p-8 text-center text-zinc-400 font-bold text-sm">Aucun exercice ne correspond à ces filtres.</p>
          )}
          {exercises.map((ex) => (
            <div key={ex.id} className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] font-black uppercase">
                    {TYPES.find((t) => t.value === ex.type)?.label || ex.type}
                  </Badge>
                  <Badge className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-500 border-none">{ex.level}</Badge>
                  {ex.category && <Badge className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-500 border-none">{ex.category}</Badge>}
                  {ex.is_ai_generated && <Badge className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 border-none">IA</Badge>}
                </div>
                <p className="text-sm font-bold text-zinc-800 truncate">{ex.instructions}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEditDialog(ex)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-indigo-600">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(ex.id)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-rose-600">
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
            <DialogTitle>{editingId ? "Modifier l'exercice" : "Nouvel exercice"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {errorMsg && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">{errorMsg}</div>}

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Type d'exercice</Label>
              <select
                value={form.type}
                disabled={!!editingId}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ExerciseType }))}
                className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold disabled:opacity-50"
              >
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {editingId && <p className="text-[10px] text-zinc-400 mt-1">Le type ne peut pas être changé après création.</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Niveau</Label>
                <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Catégorie</Label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Difficulté</Label>
                <select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Consignes</Label>
              <Textarea value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} className="mt-1" placeholder="Consigne affichée à l'utilisateur" />
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Tags (séparés par des virgules)</Label>
              <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} className="mt-1" placeholder="subjonctif, passé composé..." />
            </div>

            {form.type === "trous" && (
              <div className="space-y-3 p-4 bg-zinc-50 rounded-2xl">
                <div>
                  <Label className="text-xs font-black uppercase text-zinc-400">Phrase (mettez la réponse entre crochets, ex: [devriez])</Label>
                  <Textarea value={form.sentence} onChange={(e) => setForm((f) => ({ ...f, sentence: e.target.value }))} className="mt-1 bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-black uppercase text-zinc-400">Réponse correcte</Label>
                    <Input value={form.correctAnswer} onChange={(e) => setForm((f) => ({ ...f, correctAnswer: e.target.value }))} className="mt-1 bg-white" />
                  </div>
                  <div>
                    <Label className="text-xs font-black uppercase text-zinc-400">Fragment affiché (optionnel)</Label>
                    <Input value={form.errorFragment} onChange={(e) => setForm((f) => ({ ...f, errorFragment: e.target.value }))} className="mt-1 bg-white" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-black uppercase text-zinc-400">Explication</Label>
                  <Textarea value={form.explanation} onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))} className="mt-1 bg-white" />
                </div>
              </div>
            )}

            {form.type === "ecrit" && (
              <div className="p-4 bg-zinc-50 rounded-2xl">
                <Label className="text-xs font-black uppercase text-zinc-400">Sujet de production écrite</Label>
                <Textarea value={form.prompt} onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))} className="mt-1 bg-white" />
              </div>
            )}

            {form.type === "qcm" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase text-zinc-400">Questions ({form.qcmItems.length})</Label>
                  <Button variant="secondary" onClick={addQcmItem} className="h-8 px-3 rounded-xl text-xs font-black">
                    <Plus size={14} className="mr-1" /> Ajouter une question
                  </Button>
                </div>
                {form.qcmItems.map((item, i) => (
                  <div key={i} className="p-4 bg-zinc-50 rounded-2xl space-y-2 relative">
                    {form.qcmItems.length > 1 && (
                      <button onClick={() => removeQcmItem(i)} className="absolute top-3 right-3 text-zinc-300 hover:text-rose-500">
                        <X size={16} />
                      </button>
                    )}
                    <Input
                      value={item.question}
                      onChange={(e) => updateQcmItem(i, { question: e.target.value })}
                      placeholder={`Phrase à trou ${i + 1} (ex: Je ___ français.)`}
                      className="bg-white font-bold"
                    />
                    <div className="space-y-1">
                      {item.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${i}`}
                            checked={item.correctIndex === optIdx}
                            onChange={() => updateQcmItem(i, { correctIndex: optIdx })}
                          />
                          <Input value={opt} onChange={(e) => updateQcmOption(i, optIdx, e.target.value)} placeholder={`Option ${optIdx + 1}`} className="bg-white" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl opacity-60">
              <div>
                <p className="text-sm font-black text-zinc-900">Généré par IA</p>
                <p className="text-xs text-zinc-400">Toujours désactivé pour un exercice créé manuellement.</p>
              </div>
              <Switch checked={false} disabled />
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
