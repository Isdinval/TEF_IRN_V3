"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
import { Loader2, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminGuardScreen } from "@/components/shared/AdminGuardScreen";

interface LessonRow {
  id: string;
  slug: string;
  title: string;
  content: string;
  level: string | null;
  category: string | null;
  order_index: number;
  objective: string | null;
  duration: number | null;
  difficulty: string | null;
  tags: string[] | null;
}

const LEVELS = ["A1", "A2", "B1", "B2"];
const CATEGORIES = ["grammaire", "vocabulaire", "conjugaison", "syntaxe", "orthographe"];
const DIFFICULTIES = ["facile", "moyen", "difficile"];
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://llamakusi.com";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EMPTY_FORM = {
  title: "",
  slug: "",
  slugTouched: false,
  content: "",
  level: LEVELS[0],
  category: CATEGORIES[0],
  orderIndex: "0",
  objective: "",
  duration: "15",
  difficulty: "facile",
  tags: "",
};

export default function LessonsAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const authState = useAdminGuard();
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [levelFilter, setLevelFilter] = useState("Tous");
  const [categoryFilter, setCategoryFilter] = useState("Toutes");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("lessons").select("*").order("level").order("category").order("order_index");
    if (levelFilter !== "Tous") query = query.eq("level", levelFilter);
    if (categoryFilter !== "Toutes") query = query.eq("category", categoryFilter);
    if (search.trim()) query = query.or(`title.ilike.%${search.trim()}%,slug.ilike.%${search.trim()}%`);
    const { data, error } = await query.limit(300);
    if (!error) setLessons((data as LessonRow[]) || []);
    setLoading(false);
  }, [supabase, levelFilter, categoryFilter, search]);

  useEffect(() => {
    if (authState === "granted") fetchLessons();
  }, [authState, fetchLessons]);

  const computeNextOrderIndex = useCallback(async (level: string, category: string) => {
    const { data } = await supabase
      .from("lessons")
      .select("order_index")
      .eq("level", level)
      .eq("category", category)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data?.order_index ?? -1) + 1;
  }, [supabase]);

  const openCreateDialog = async () => {
    setEditingId(null);
    setErrorMsg(null);
    const nextIndex = await computeNextOrderIndex(LEVELS[0], CATEGORIES[0]);
    setForm({ ...EMPTY_FORM, orderIndex: String(nextIndex) });
    setDialogOpen(true);
  };

  const openEditDialog = (lesson: LessonRow) => {
    setEditingId(lesson.id);
    setErrorMsg(null);
    setForm({
      title: lesson.title || "",
      slug: lesson.slug || "",
      slugTouched: true,
      content: lesson.content || "",
      level: lesson.level || LEVELS[0],
      category: lesson.category || CATEGORIES[0],
      orderIndex: String(lesson.order_index ?? 0),
      objective: lesson.objective || "",
      duration: String(lesson.duration ?? 15),
      difficulty: lesson.difficulty || "facile",
      tags: (lesson.tags || []).join(", "),
    });
    setDialogOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, slug: f.slugTouched ? f.slug : slugify(title) }));
  };

  // Sur création uniquement : recalcule l'order_index suggéré quand niveau/catégorie changent,
  // sauf si l'admin l'a déjà modifié à la main (même logique de "touched" que pour le slug).
  const handleLevelOrCategoryChange = async (patch: { level?: string; category?: string }) => {
    setForm((f) => {
      const next = { ...f, ...patch };
      return next;
    });
    if (!editingId) {
      const level = patch.level ?? form.level;
      const category = patch.category ?? form.category;
      const nextIndex = await computeNextOrderIndex(level, category);
      setForm((f) => ({ ...f, orderIndex: String(nextIndex) }));
    }
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return "Le titre est obligatoire.";
    if (!form.slug.trim()) return "Le slug est obligatoire.";
    if (!form.content.trim()) return "Le contenu est obligatoire.";
    if (Number.isNaN(Number(form.orderIndex))) return "L'ordre doit être un nombre.";
    return null;
  };

  const handleSave = async () => {
    setErrorMsg(null);
    const validationError = validate();
    if (validationError) { setErrorMsg(validationError); return; }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        content: form.content,
        level: form.level,
        category: form.category,
        order_index: Number(form.orderIndex),
        objective: form.objective.trim() || null,
        duration: Number(form.duration) || null,
        difficulty: form.difficulty,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      const { error } = editingId
        ? await supabase.from("lessons").update(payload).eq("id", editingId)
        : await supabase.from("lessons").insert(payload);
      if (error) throw error;
      setDialogOpen(false);
      fetchLessons();
    } catch (err: any) {
      console.error("Error saving lesson:", err);
      setErrorMsg(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lesson: LessonRow) => {
    if (!window.confirm(`Supprimer définitivement la leçon "${lesson.title}" ? Les exercices qui y sont liés seront détachés (non supprimés).`)) return;
    const { error } = await supabase.from("lessons").delete().eq("id", lesson.id);
    if (!error) fetchLessons();
  };

  if (authState !== "granted") {
    return <AdminGuardScreen state={authState} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 pt-12">
      <header className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <Badge className="bg-slate-900 mb-2">ZONE ADMIN</Badge>
          <h1 className="text-3xl font-black tracking-tight">Leçons</h1>
          <p className="text-muted-foreground">
            {lessons.length} leçon{lessons.length > 1 ? "s" : ""} affichée{lessons.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreateDialog} className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black shadow-xl shadow-indigo-100">
          <Plus className="mr-2" size={18} /> Ajouter une leçon
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
        <Input placeholder="Rechercher par titre ou slug..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 max-w-xs" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50">
          {lessons.length === 0 && (
            <p className="p-8 text-center text-zinc-400 font-bold text-sm">Aucune leçon ne correspond à ces filtres.</p>
          )}
          {lessons.map((lesson) => (
            <div key={lesson.id} className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-500 border-none">{lesson.level}</Badge>
                  {lesson.category && <Badge className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-500 border-none">{lesson.category}</Badge>}
                  <Badge variant="outline" className="text-[10px] font-black">#{lesson.order_index}</Badge>
                  <span className="text-[10px] font-mono text-zinc-400 truncate">{lesson.slug}</span>
                </div>
                <p className="text-sm font-bold text-zinc-800 truncate">{lesson.title}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href={`${SITE_URL}/tef-irn/lessons/${lesson.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-emerald-600"
                >
                  <ExternalLink size={15} />
                </a>
                <button onClick={() => openEditDialog(lesson)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-indigo-600">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(lesson)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-rose-600">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>{editingId ? "Modifier la leçon" : "Nouvelle leçon"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
            {errorMsg && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">{errorMsg}</div>}

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Titre</Label>
              <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className="mt-1" />
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value), slugTouched: true }))}
                className="mt-1 font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Niveau</Label>
                <select value={form.level} onChange={(e) => handleLevelOrCategoryChange({ level: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Catégorie</Label>
                <select value={form.category} onChange={(e) => handleLevelOrCategoryChange({ category: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">
                  Ordre {!editingId && <span className="normal-case font-normal text-zinc-300">(auto)</span>}
                </Label>
                <Input
                  type="number"
                  value={form.orderIndex}
                  onChange={(e) => setForm((f) => ({ ...f, orderIndex: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Difficulté</Label>
                <select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Durée estimée (minutes)</Label>
                <Input type="number" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Objectif pédagogique</Label>
              <Textarea value={form.objective} onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))} className="mt-1" placeholder="Ce que l'apprenant doit savoir faire à la fin de la leçon" />
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Contenu (markdown)</Label>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  className="h-96 font-mono text-xs"
                  placeholder={"## Introduction\n\nVotre contenu markdown ici..."}
                />
                <div className="h-96 overflow-y-auto p-4 rounded-xl border border-zinc-200 bg-zinc-50">
                  <div className="prose prose-sm prose-slate max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content || "*Aperçu du rendu markdown*"}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Tags (séparés par des virgules)</Label>
              <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} className="mt-1" placeholder="subjonctif, passé composé..." />
            </div>
          </div>

          <DialogFooter className="shrink-0">
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
