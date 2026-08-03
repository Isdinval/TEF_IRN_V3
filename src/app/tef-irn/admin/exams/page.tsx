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
import { Loader2, Plus, Pencil, Trash2, ListChecks } from "lucide-react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminGuardScreen } from "@/components/shared/AdminGuardScreen";

interface ExamRow {
  id: string;
  label: string;
  slug: string;
  description: string | null;
  level: string | null;
  is_active: boolean;
  duration_co: number;
  duration_ce: number;
  duration_ee: number;
  duration_eo: number;
}

const EMPTY_FORM = {
  label: "",
  slug: "",
  description: "",
  level: "",
  is_active: true,
  duration_co: 20,
  duration_ce: 30,
  duration_ee: 30,
  duration_eo: 10,
};

export default function ExamsAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const authState = useAdminGuard();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("exams").select("*").order("slug", { ascending: true });
    if (!error) setExams((data as ExamRow[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (authState === "granted") fetchExams();
  }, [authState, fetchExams]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const openEditDialog = (ex: ExamRow) => {
    setEditingId(ex.id);
    setForm({
      label: ex.label,
      slug: ex.slug,
      description: ex.description || "",
      level: ex.level || "",
      is_active: ex.is_active,
      duration_co: ex.duration_co,
      duration_ce: ex.duration_ce,
      duration_ee: ex.duration_ee,
      duration_eo: ex.duration_eo,
    });
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const validate = (): string | null => {
    if (!form.label.trim()) return "Le libellé est obligatoire.";
    if (!form.slug.trim()) return "Le slug est obligatoire.";
    if (!/^[a-z0-9-]+$/.test(form.slug.trim())) return "Le slug ne doit contenir que des lettres minuscules, chiffres et tirets.";
    return null;
  };

  const handleSave = async () => {
    setErrorMsg(null);
    const validationError = validate();
    if (validationError) { setErrorMsg(validationError); return; }

    setSaving(true);
    try {
      const payload = {
        label: form.label.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        level: form.level.trim() || null,
        is_active: form.is_active,
        duration_co: form.duration_co,
        duration_ce: form.duration_ce,
        duration_ee: form.duration_ee,
        duration_eo: form.duration_eo,
      };
      const { error } = editingId
        ? await supabase.from("exams").update(payload).eq("id", editingId)
        : await supabase.from("exams").insert(payload);
      if (error) throw error;
      setDialogOpen(false);
      fetchExams();
    } catch (err: any) {
      console.error("Error saving exam:", err);
      setErrorMsg(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ex: ExamRow) => {
    if (!window.confirm(`Supprimer définitivement "${ex.label}" ? Les 44 questions associées seront supprimées avec (cascade).`)) return;
    const { error } = await supabase.from("exams").delete().eq("id", ex.id);
    if (!error) fetchExams();
  };

  if (authState !== "granted") {
    return <AdminGuardScreen state={authState} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 pt-12">
      <header className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <Badge className="bg-slate-900 mb-2">ZONE ADMIN</Badge>
          <h1 className="text-3xl font-black tracking-tight">Examens blancs</h1>
          <p className="text-muted-foreground">
            {exams.length} examen{exams.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreateDialog} className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black shadow-xl shadow-indigo-100">
          <Plus className="mr-2" size={18} /> Ajouter un examen
        </Button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50">
          {exams.length === 0 && (
            <p className="p-8 text-center text-zinc-400 font-bold text-sm">Aucun examen créé pour l'instant.</p>
          )}
          {exams.map((ex) => (
            <div key={ex.id} className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] font-black uppercase">{ex.slug}</Badge>
                  {ex.level && <Badge className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-500 border-none">{ex.level}</Badge>}
                  {!ex.is_active && <Badge className="text-[10px] font-black uppercase bg-rose-50 text-rose-600 border-none">Inactif</Badge>}
                </div>
                <p className="text-sm font-bold text-zinc-800 truncate">{ex.label}</p>
                {ex.description && <p className="text-xs text-zinc-400 truncate">{ex.description}</p>}
                <p className="text-[11px] text-zinc-400">
                  CO {ex.duration_co}min · CE {ex.duration_ce}min · EE {ex.duration_ee}min · EO {ex.duration_eo}min
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href={`/tef-irn/admin/exams/${ex.id}/questions`}
                  className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-indigo-600"
                  title="Gérer les questions"
                >
                  <ListChecks size={15} />
                </a>
                <button onClick={() => openEditDialog(ex)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-indigo-600">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(ex)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-rose-600">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier l'examen" : "Nouvel examen"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {errorMsg && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">{errorMsg}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Libellé</Label>
                <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} className="mt-1" placeholder="Examen Blanc 4" />
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="mt-1" placeholder="exam-4" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1" placeholder="Thématique de l'examen" />
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Niveau (libre, ex: A2-B1)</Label>
              <Input value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className="mt-1" placeholder="A2-B1" />
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Durées (minutes)</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                <div>
                  <Label className="text-[10px] text-zinc-400">CO</Label>
                  <Input type="number" value={form.duration_co} onChange={(e) => setForm((f) => ({ ...f, duration_co: parseInt(e.target.value, 10) || 0 }))} />
                </div>
                <div>
                  <Label className="text-[10px] text-zinc-400">CE</Label>
                  <Input type="number" value={form.duration_ce} onChange={(e) => setForm((f) => ({ ...f, duration_ce: parseInt(e.target.value, 10) || 0 }))} />
                </div>
                <div>
                  <Label className="text-[10px] text-zinc-400">EE</Label>
                  <Input type="number" value={form.duration_ee} onChange={(e) => setForm((f) => ({ ...f, duration_ee: parseInt(e.target.value, 10) || 0 }))} />
                </div>
                <div>
                  <Label className="text-[10px] text-zinc-400">EO</Label>
                  <Input type="number" value={form.duration_eo} onChange={(e) => setForm((f) => ({ ...f, duration_eo: parseInt(e.target.value, 10) || 0 }))} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
              <div>
                <p className="text-sm font-black text-zinc-900">Actif</p>
                <p className="text-xs text-zinc-400">Détermine l'examen proposé par défaut aux candidats.</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            </div>

            {!editingId && (
              <p className="text-[11px] text-zinc-400">
                Un nouvel examen est créé sans questions. Utilisez "Gérer les questions" après création pour en ajouter.
              </p>
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
