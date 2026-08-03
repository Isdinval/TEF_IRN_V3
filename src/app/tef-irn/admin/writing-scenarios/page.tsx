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
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminGuardScreen } from "@/components/shared/AdminGuardScreen";

interface ScenarioRow {
  id: string;
  section: string;
  level: string;
  type_texte: string;
  title: string;
  sujet: string;
  min_words: number;
  duration_seconds: number;
  contraintes: string[] | null;
  is_active: boolean;
}

const SECTIONS = ["A", "B"];
const LEVELS = ["A1", "A2", "B1", "B2"];
const TYPES_TEXTE = [
  { value: "message_informatif", label: "Message informatif" },
  { value: "lettre_formelle", label: "Lettre formelle" },
  { value: "lettre_reclamation", label: "Lettre de réclamation" },
  { value: "texte_argumentatif", label: "Texte argumentatif" },
];

const EMPTY_FORM = {
  section: SECTIONS[0],
  level: LEVELS[0],
  type_texte: TYPES_TEXTE[0].value,
  title: "",
  sujet: "",
  min_words: 40,
  duration_seconds: 600,
  contraintes: "",
  is_active: true,
};

export default function WritingScenariosAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const authState = useAdminGuard();
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sectionFilter, setSectionFilter] = useState("Toutes");
  const [levelFilter, setLevelFilter] = useState("Toutes");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchScenarios = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("writing_exam_scenarios").select("*").order("section", { ascending: true }).order("level", { ascending: true });
    if (sectionFilter !== "Toutes") query = query.eq("section", sectionFilter);
    if (levelFilter !== "Toutes") query = query.eq("level", levelFilter);
    if (search.trim()) query = query.ilike("title", `%${search.trim()}%`);
    const { data, error } = await query.limit(200);
    if (!error) setScenarios((data as ScenarioRow[]) || []);
    setLoading(false);
  }, [supabase, sectionFilter, levelFilter, search]);

  useEffect(() => {
    if (authState === "granted") fetchScenarios();
  }, [authState, fetchScenarios]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const openEditDialog = (s: ScenarioRow) => {
    setEditingId(s.id);
    setForm({
      section: s.section,
      level: s.level,
      type_texte: s.type_texte,
      title: s.title,
      sujet: s.sujet,
      min_words: s.min_words,
      duration_seconds: s.duration_seconds,
      contraintes: (Array.isArray(s.contraintes) ? s.contraintes : []).join("\n"),
      is_active: s.is_active,
    });
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return "Le titre est obligatoire.";
    if (!form.sujet.trim()) return "Le sujet est obligatoire.";
    if (form.min_words <= 0) return "Le nombre de mots minimum doit être positif.";
    if (form.duration_seconds <= 0) return "La durée doit être positive.";
    return null;
  };

  const handleSave = async () => {
    setErrorMsg(null);
    const validationError = validate();
    if (validationError) { setErrorMsg(validationError); return; }

    setSaving(true);
    try {
      const contraintesList = form.contraintes.split("\n").map((c) => c.trim()).filter(Boolean);
      const payload = {
        section: form.section,
        level: form.level,
        type_texte: form.type_texte,
        title: form.title.trim(),
        sujet: form.sujet.trim(),
        min_words: form.min_words,
        duration_seconds: form.duration_seconds,
        contraintes: contraintesList.length > 0 ? contraintesList : null,
        is_active: form.is_active,
      };
      const { error } = editingId
        ? await supabase.from("writing_exam_scenarios").update(payload).eq("id", editingId)
        : await supabase.from("writing_exam_scenarios").insert(payload);
      if (error) throw error;
      setDialogOpen(false);
      fetchScenarios();
    } catch (err: any) {
      console.error("Error saving writing scenario:", err);
      setErrorMsg(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer définitivement ce scénario ?")) return;
    const { error } = await supabase.from("writing_exam_scenarios").delete().eq("id", id);
    if (!error) fetchScenarios();
  };

  if (authState !== "granted") {
    return <AdminGuardScreen state={authState} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 pt-12">
      <header className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <Badge className="bg-slate-900 mb-2">ZONE ADMIN</Badge>
          <h1 className="text-3xl font-black tracking-tight">Scénarios examen écrit (EE)</h1>
          <p className="text-muted-foreground">
            {scenarios.length} scénario{scenarios.length > 1 ? "s" : ""} affiché{scenarios.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreateDialog} className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black shadow-xl shadow-indigo-100">
          <Plus className="mr-2" size={18} /> Ajouter un scénario
        </Button>
      </header>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="Toutes">Toutes les sections</option>
          {SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
        </select>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="Toutes">Tous les niveaux</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <Input placeholder="Rechercher dans les titres..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 max-w-xs" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50">
          {scenarios.length === 0 && (
            <p className="p-8 text-center text-zinc-400 font-bold text-sm">Aucun scénario ne correspond à ces filtres.</p>
          )}
          {scenarios.map((s) => (
            <div key={s.id} className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] font-black uppercase">Section {s.section}</Badge>
                  <Badge className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-500 border-none">{s.level}</Badge>
                  <Badge className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-500 border-none">
                    {TYPES_TEXTE.find((t) => t.value === s.type_texte)?.label || s.type_texte}
                  </Badge>
                  {!s.is_active && <Badge className="text-[10px] font-black uppercase bg-rose-50 text-rose-600 border-none">Inactif</Badge>}
                </div>
                <p className="text-sm font-bold text-zinc-800 truncate">{s.title}</p>
                <p className="text-xs text-zinc-400">{s.min_words} mots min · {Math.round(s.duration_seconds / 60)} min</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEditDialog(s)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-indigo-600">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(s.id)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-rose-600">
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
            <DialogTitle>{editingId ? "Modifier le scénario" : "Nouveau scénario"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {errorMsg && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">{errorMsg}</div>}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Section</Label>
                <select value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
                  {SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Niveau</Label>
                <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Type de texte</Label>
                <select value={form.type_texte} onChange={(e) => setForm((f) => ({ ...f, type_texte: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
                  {TYPES_TEXTE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Titre</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="mt-1" placeholder="Ex: Changement d'horaires" />
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Sujet</Label>
              <Textarea value={form.sujet} onChange={(e) => setForm((f) => ({ ...f, sujet: e.target.value }))} className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Mots minimum</Label>
                <Input
                  type="number"
                  value={form.min_words}
                  onChange={(e) => setForm((f) => ({ ...f, min_words: parseInt(e.target.value, 10) || 0 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Durée (secondes)</Label>
                <Input
                  type="number"
                  value={form.duration_seconds}
                  onChange={(e) => setForm((f) => ({ ...f, duration_seconds: parseInt(e.target.value, 10) || 0 }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Contraintes (optionnel, une par ligne)</Label>
              <Textarea value={form.contraintes} onChange={(e) => setForm((f) => ({ ...f, contraintes: e.target.value }))} className="mt-1" rows={3} />
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
              <div>
                <p className="text-sm font-black text-zinc-900">Actif</p>
                <p className="text-xs text-zinc-400">Un scénario inactif n'apparaît plus dans la simulation d'examen.</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
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
