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
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminGuardScreen } from "@/components/shared/AdminGuardScreen";

interface ParcoursRow {
  id: string;
  slug: string;
  nom_parcours: string | null;
  level: string;
  category: string;
  objective: string | null;
  justification_reference_au_referentiel: string | null;
}

const LEVELS = ["A1", "A2", "B1", "B2"];
const CATEGORIES = ["conjugaison", "grammaire", "syntaxe", "vocabulaire"];

const EMPTY_FORM = {
  slug: "",
  nom_parcours: "",
  level: LEVELS[0],
  category: CATEGORIES[0],
  objective: "",
  justification: "",
};

export default function ParcoursAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const authState = useAdminGuard();
  const [items, setItems] = useState<ParcoursRow[]>([]);
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
    let query = supabase.from("parcours").select("*").order("level", { ascending: true }).order("category", { ascending: true });
    if (levelFilter !== "Tous") query = query.eq("level", levelFilter);
    if (categoryFilter !== "Toutes") query = query.eq("category", categoryFilter);
    if (search.trim()) query = query.ilike("nom_parcours", `%${search.trim()}%`);
    const { data, error } = await query.limit(200);
    if (!error) setItems((data as ParcoursRow[]) || []);
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

  const openEditDialog = (p: ParcoursRow) => {
    setEditingId(p.id);
    setForm({
      slug: p.slug,
      nom_parcours: p.nom_parcours || "",
      level: p.level,
      category: p.category,
      objective: p.objective || "",
      justification: p.justification_reference_au_referentiel || "",
    });
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const validate = (): string | null => {
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
        slug: form.slug.trim(),
        nom_parcours: form.nom_parcours.trim() || null,
        level: form.level,
        category: form.category,
        objective: form.objective.trim() || null,
        justification_reference_au_referentiel: form.justification.trim() || null,
      };
      const { error } = editingId
        ? await supabase.from("parcours").update(payload).eq("id", editingId)
        : await supabase.from("parcours").insert(payload);
      if (error) throw error;
      setDialogOpen(false);
      fetchItems();
    } catch (err: any) {
      console.error("Error saving parcours:", err);
      setErrorMsg(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: ParcoursRow) => {
    if (!window.confirm(`Supprimer définitivement "${p.nom_parcours || p.slug}" ? La progression des utilisateurs sur ce parcours sera supprimée avec (cascade). Les guides liés perdront juste leur lien.`)) return;
    const { error } = await supabase.from("parcours").delete().eq("id", p.id);
    if (error) {
      window.alert(`Suppression impossible : ${error.message}`);
      return;
    }
    fetchItems();
  };

  if (authState !== "granted") {
    return <AdminGuardScreen state={authState} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 pt-12">
      <header className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <Badge className="bg-slate-900 mb-2">ZONE ADMIN</Badge>
          <h1 className="text-3xl font-black tracking-tight">Parcours</h1>
          <p className="text-muted-foreground">
            {items.length} parcours affiché{items.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreateDialog} className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black shadow-xl shadow-indigo-100">
          <Plus className="mr-2" size={18} /> Ajouter un parcours
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
        <Input placeholder="Rechercher un parcours..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 max-w-xs" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50">
          {items.length === 0 && (
            <p className="p-8 text-center text-zinc-400 font-bold text-sm">Aucun parcours ne correspond à ces filtres.</p>
          )}
          {items.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] font-black uppercase">{p.level}</Badge>
                  <Badge className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-500 border-none">{p.category}</Badge>
                  <span className="text-[10px] text-zinc-300 font-mono">{p.slug}</span>
                </div>
                <p className="text-sm font-bold text-zinc-800 truncate">{p.nom_parcours || "(sans nom)"}</p>
                {p.objective && <p className="text-xs text-zinc-400 truncate">{p.objective}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEditDialog(p)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-indigo-600">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(p)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-rose-600">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le parcours" : "Nouveau parcours"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {errorMsg && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">{errorMsg}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="mt-1" placeholder="relier-idees-syn-a2" />
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Niveau</Label>
                <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Nom du parcours</Label>
              <Input value={form.nom_parcours} onChange={(e) => setForm((f) => ({ ...f, nom_parcours: e.target.value }))} className="mt-1" placeholder="Relier ses idées pour se faire comprendre" />
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Catégorie</Label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Objectif</Label>
              <Textarea value={form.objective} onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))} className="mt-1" />
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Justification / référence au référentiel</Label>
              <Textarea value={form.justification} onChange={(e) => setForm((f) => ({ ...f, justification: e.target.value }))} className="mt-1" rows={3} />
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
