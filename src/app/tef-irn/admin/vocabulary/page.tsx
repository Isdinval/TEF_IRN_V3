"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Loader2, Plus, Pencil, Trash2, Volume2, RotateCcw } from "lucide-react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminGuardScreen } from "@/components/shared/AdminGuardScreen";

interface VocabRow {
  id: string;
  word: string;
  definition: string;
  example: string | null;
  level: string | null;
  category: string;
  audio_url: string | null;
}

const LEVELS = ["A1", "A2", "B1", "B2"];
const CATEGORIES = ["Administration", "Logement", "Santé", "Travail", "Vie Sociale"];

const EMPTY_FORM = {
  word: "",
  definition: "",
  example: "",
  level: LEVELS[0],
  category: CATEGORIES[0],
};

export default function VocabularyAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const authState = useAdminGuard();
  const [items, setItems] = useState<VocabRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [levelFilter, setLevelFilter] = useState("Tous");
  const [categoryFilter, setCategoryFilter] = useState("Toutes");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("vocabulary").select("*").order("word", { ascending: true });
    if (levelFilter !== "Tous") query = query.eq("level", levelFilter);
    if (categoryFilter !== "Toutes") query = query.eq("category", categoryFilter);
    if (search.trim()) query = query.ilike("word", `%${search.trim()}%`);
    const { data, error } = await query.limit(300);
    if (!error) setItems((data as VocabRow[]) || []);
    setLoading(false);
  }, [supabase, levelFilter, categoryFilter, search]);

  useEffect(() => {
    if (authState === "granted") fetchItems();
  }, [authState, fetchItems]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const openEditDialog = (v: VocabRow) => {
    setEditingId(v.id);
    setForm({
      word: v.word,
      definition: v.definition,
      example: v.example || "",
      level: v.level || LEVELS[0],
      category: v.category,
    });
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const validate = (): string | null => {
    if (!form.word.trim()) return "Le mot est obligatoire.";
    if (!form.definition.trim()) return "La définition est obligatoire.";
    return null;
  };

  const handleSave = async () => {
    setErrorMsg(null);
    const validationError = validate();
    if (validationError) { setErrorMsg(validationError); return; }

    setSaving(true);
    try {
      const payload = {
        word: form.word.trim(),
        definition: form.definition.trim(),
        example: form.example.trim() || null,
        level: form.level,
        category: form.category,
      };
      const { error } = editingId
        ? await supabase.from("vocabulary").update(payload).eq("id", editingId)
        : await supabase.from("vocabulary").insert(payload);
      if (error) throw error;
      setDialogOpen(false);
      fetchItems();
    } catch (err: any) {
      console.error("Error saving vocabulary:", err);
      setErrorMsg(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer définitivement ce mot ?")) return;
    const { error } = await supabase.from("vocabulary").delete().eq("id", id);
    if (!error) fetchItems();
  };

  // La génération audio se fait hors-ligne (script Python TTS Gemini, jamais
  // en runtime). Cette action efface audio_url : le mot sera repris au
  // prochain lancement du script (qui ne traite que les mots sans audio_url).
  const handleClearAudio = async (id: string) => {
    if (!window.confirm("Marquer ce mot pour régénération audio ? Le son actuel sera retiré jusqu'au prochain lancement du script TTS.")) return;
    const { error } = await supabase.from("vocabulary").update({ audio_url: null }).eq("id", id);
    if (!error) fetchItems();
  };

  if (authState !== "granted") {
    return <AdminGuardScreen state={authState} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 pt-12">
      <header className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <Badge className="bg-slate-900 mb-2">ZONE ADMIN</Badge>
          <h1 className="text-3xl font-black tracking-tight">Vocabulaire</h1>
          <p className="text-muted-foreground">
            {items.length} mot{items.length > 1 ? "s" : ""} affiché{items.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreateDialog} className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black shadow-xl shadow-indigo-100">
          <Plus className="mr-2" size={18} /> Ajouter un mot
        </Button>
      </header>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="Tous">Tous les niveaux</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="Toutes">Toutes les catégories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <Input placeholder="Rechercher un mot..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 max-w-xs" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50">
          {items.length === 0 && (
            <p className="p-8 text-center text-zinc-400 font-bold text-sm">Aucun mot ne correspond à ces filtres.</p>
          )}
          {items.map((v) => (
            <div key={v.id} className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {v.level && <Badge variant="outline" className="text-[10px] font-black uppercase">{v.level}</Badge>}
                  <Badge className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-500 border-none">{v.category}</Badge>
                </div>
                <p className="text-sm font-bold text-zinc-800 truncate">{v.word}</p>
                <p className="text-xs text-zinc-400 truncate">{v.definition}</p>
                <div className="flex items-center gap-2 pt-1">
                  {v.audio_url ? (
                    <>
                      <Badge variant="outline" className="text-[9px] font-black uppercase gap-1 text-emerald-600 border-emerald-100">
                        <Volume2 size={10} /> Audio prêt
                      </Badge>
                      <audio controls src={v.audio_url} className="h-7" style={{ maxWidth: 180 }} />
                    </>
                  ) : (
                    <Badge variant="outline" className="text-[9px] font-black uppercase text-zinc-400 border-zinc-200">
                      Pas d'audio
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {v.audio_url && (
                  <button onClick={() => handleClearAudio(v.id)} title="Marquer pour régénération audio" className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-amber-600">
                    <RotateCcw size={15} />
                  </button>
                )}
                <button onClick={() => openEditDialog(v)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-indigo-600">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(v.id)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-rose-600">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le mot" : "Nouveau mot"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {errorMsg && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">{errorMsg}</div>}

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Mot</Label>
              <Input value={form.word} onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))} className="mt-1" />
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Définition</Label>
              <Textarea value={form.definition} onChange={(e) => setForm((f) => ({ ...f, definition: e.target.value }))} className="mt-1" />
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Exemple (optionnel)</Label>
              <Textarea value={form.example} onChange={(e) => setForm((f) => ({ ...f, example: e.target.value }))} className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
