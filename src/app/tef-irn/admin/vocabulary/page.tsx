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
import { Loader2, Plus, Pencil, Trash2, Volume2, RotateCcw, Flag, Download } from "lucide-react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminGuardScreen } from "@/components/shared/AdminGuardScreen";
import { VOCAB_CATEGORIES } from "@/lib/vocab/categories";

interface VocabRow {
  id: string;
  word: string;
  definition: string;
  example: string | null;
  level: string | null;
  category: string;
  audio_url: string | null;
  audio_flagged_bad: boolean;
}

interface VocabKpi {
  total: number;
  withoutAudio: number;
  flaggedBad: number;
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
}

const LEVELS = ["A1", "A2", "B1", "B2"];
const CATEGORIES: string[] = [...VOCAB_CATEGORIES];
const PAGE_SIZE = 50;

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
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [levelFilter, setLevelFilter] = useState("Tous");
  const [categoryFilter, setCategoryFilter] = useState("Toutes");
  const [search, setSearch] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [kpi, setKpi] = useState<VocabKpi | null>(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Vue d'ensemble globale (total, par niveau, par catégorie) : une seule
  // requête légère au chargement, indépendante des filtres de la liste
  // ci-dessous (reste bon marché même quand le catalogue grossit).
  const fetchKpi = useCallback(async () => {
    setKpiLoading(true);
    const { data, error } = await supabase.from("vocabulary").select("level, category, audio_url, audio_flagged_bad");
    if (!error && data) {
      const byLevel: Record<string, number> = {};
      const byCategory: Record<string, number> = {};
      let withoutAudio = 0;
      let flaggedBad = 0;
      for (const row of data as { level: string | null; category: string; audio_url: string | null; audio_flagged_bad: boolean }[]) {
        if (row.level) byLevel[row.level] = (byLevel[row.level] || 0) + 1;
        byCategory[row.category] = (byCategory[row.category] || 0) + 1;
        if (!row.audio_url) withoutAudio += 1;
        if (row.audio_flagged_bad) flaggedBad += 1;
      }
      setKpi({ total: data.length, withoutAudio, flaggedBad, byLevel, byCategory });
    }
    setKpiLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (authState === "granted") fetchKpi();
  }, [authState, fetchKpi]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("vocabulary").select("*", { count: "exact" }).order("word", { ascending: true });
    if (levelFilter !== "Tous") query = query.eq("level", levelFilter);
    if (categoryFilter !== "Toutes") query = query.eq("category", categoryFilter);
    if (search.trim()) query = query.ilike("word", `%${search.trim()}%`);
    if (flaggedOnly) query = query.eq("audio_flagged_bad", true);
    const from = (page - 1) * PAGE_SIZE;
    const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
    if (!error) {
      setItems((data as VocabRow[]) || []);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }, [supabase, levelFilter, categoryFilter, search, flaggedOnly, page]);

  useEffect(() => {
    if (authState === "granted") fetchItems();
  }, [authState, fetchItems]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const updateLevelFilter = (v: string) => { setLevelFilter(v); setPage(1); };
  const updateCategoryFilter = (v: string) => { setCategoryFilter(v); setPage(1); };
  const updateSearch = (v: string) => { setSearch(v); setPage(1); };
  const updateFlaggedOnly = (v: boolean) => { setFlaggedOnly(v); setPage(1); };

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

  // Signalement manuel de qualité audio (revue humaine). Ne modifie ni ne
  // supprime rien d'autre : le nettoyage groupé (vidage audio_url + fichier
  // Storage pour tous les mots signalés) est une action séparée à venir.
  const handleToggleFlag = async (v: VocabRow) => {
    const { error } = await supabase.from("vocabulary").update({ audio_flagged_bad: !v.audio_flagged_bad }).eq("id", v.id);
    if (!error) {
      fetchItems();
      fetchKpi();
    }
  };

  // Nettoyage groupé des mots signalés : porte sur TOUS les mots signalés
  // en base (pas seulement ceux affichés/filtrés à l'écran).
  // 1) télécharge un CSV de la liste (trace pour audit / le script TTS) ;
  // 2) supprime les fichiers correspondants du bucket Storage vocab-audio ;
  // 3) vide audio_url + retire le signalement en base — ces mots seront
  //    repris au prochain lancement du script TTS local (jamais déclenché
  //    depuis l'app).
  const handleExportAndClean = async () => {
    if (!kpi || kpi.flaggedBad === 0) return;
    const confirmed = window.confirm(
      `Exporter et nettoyer ${kpi.flaggedBad} mot(s) signalé(s) ? Leur audio sera supprimé (base + fichier Storage) et ils seront repris au prochain lancement du script TTS.`
    );
    if (!confirmed) return;

    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("vocabulary")
        .select("id, word, level, category, audio_url")
        .eq("audio_flagged_bad", true);
      if (error) throw error;
      const flagged = (data as Pick<VocabRow, "id" | "word" | "level" | "category" | "audio_url">[]) || [];
      if (flagged.length === 0) {
        window.alert("Aucun mot signalé à nettoyer.");
        return;
      }

      // 1) Export CSV
      const header = "word,level,category,id\n";
      const rows = flagged
        .map((v) => `"${v.word.replace(/"/g, '""')}",${v.level ?? ""},"${v.category.replace(/"/g, '""')}",${v.id}`)
        .join("\n");
      const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vocab-audios-signales-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      // 2) Suppression des fichiers Storage (bucket public vocab-audio)
      const paths = flagged
        .map((v) => v.audio_url?.split("/public/vocab-audio/")[1])
        .filter((p): p is string => Boolean(p));
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from("vocab-audio").remove(paths);
        if (storageError) console.error("Erreur suppression Storage:", storageError);
      }

      // 3) Nettoyage en base — restreint aux IDs exportés ci-dessus
      const { error: updateError } = await supabase
        .from("vocabulary")
        .update({ audio_url: null, audio_flagged_bad: false })
        .in("id", flagged.map((v) => v.id));
      if (updateError) throw updateError;

      fetchItems();
      fetchKpi();
    } catch (err: any) {
      console.error("Error exporting/cleaning flagged audio:", err);
      window.alert(err?.message || "Erreur lors de l'export/nettoyage.");
    } finally {
      setExporting(false);
    }
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
            {totalCount} mot{totalCount > 1 ? "s" : ""} au total
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleExportAndClean}
            disabled={exporting || !kpi || kpi.flaggedBad === 0}
            variant="secondary"
            className="h-12 px-6 rounded-2xl font-black border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Download className="mr-2" size={18} />}
            Exporter + nettoyer ({kpi?.flaggedBad ?? 0})
          </Button>
          <Button onClick={openCreateDialog} className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black shadow-xl shadow-indigo-100">
            <Plus className="mr-2" size={18} /> Ajouter un mot
          </Button>
        </div>
      </header>

      {kpiLoading && !kpi && (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-indigo-600" size={20} /></div>
      )}

      {kpi && (
        <div className="mb-8 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
              <p className="text-[10px] font-black uppercase text-zinc-400">Total mots</p>
              <p className="text-2xl font-black text-zinc-800">{kpi.total}</p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
              <p className="text-[10px] font-black uppercase text-zinc-400">Sans audio</p>
              <p className="text-2xl font-black text-zinc-800">{kpi.withoutAudio}</p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
              <p className="text-[10px] font-black uppercase text-zinc-400">Audios signalés</p>
              <p className="text-2xl font-black text-rose-600">{kpi.flaggedBad}</p>
            </div>
            {LEVELS.map((l) => (
              <div key={l} className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
                <p className="text-[10px] font-black uppercase text-zinc-400">Niveau {l}</p>
                <p className="text-2xl font-black text-zinc-800">{kpi.byLevel[l] || 0}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CATEGORIES.map((c) => (
              <div key={c} className="bg-white rounded-2xl border border-zinc-100 shadow-sm px-4 py-3 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-zinc-500 truncate">{c}</span>
                <span className="text-sm font-black text-zinc-800 shrink-0">{kpi.byCategory[c] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={levelFilter} onChange={(e) => updateLevelFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="Tous">Tous les niveaux</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => updateCategoryFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="Toutes">Toutes les catégories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <Input placeholder="Rechercher un mot..." value={search} onChange={(e) => updateSearch(e.target.value)} className="h-10 max-w-xs" />
        <label className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => updateFlaggedOnly(e.target.checked)} />
          Audios signalés uniquement
        </label>
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
                  {v.audio_flagged_bad && (
                    <Badge variant="outline" className="text-[9px] font-black uppercase gap-1 text-rose-600 border-rose-200 bg-rose-50">
                      <Flag size={10} /> Audio signalé
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleToggleFlag(v)}
                  title={v.audio_flagged_bad ? "Retirer le signalement" : "Signaler cet audio comme mauvais"}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${v.audio_flagged_bad ? "bg-rose-50 text-rose-600" : "bg-zinc-50 text-zinc-400 hover:text-rose-600"}`}
                >
                  <Flag size={15} />
                </button>
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

      {!loading && totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() => {
              setPage((p) => p - 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="rounded-xl font-black text-sm"
          >
            Précédent
          </Button>
          <span className="text-sm text-zinc-400 font-bold">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => {
              setPage((p) => p + 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="rounded-xl font-black text-sm"
          >
            Suivant
          </Button>
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
