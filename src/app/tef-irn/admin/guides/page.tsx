"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
import Link from "next/link";
import { Loader2, Plus, Pencil, Trash2, UploadCloud, ExternalLink } from "lucide-react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminGuardScreen } from "@/components/shared/AdminGuardScreen";
import { GuideType } from "@/types/guides";
import { CIVIC_GUIDE_CATEGORIES } from "@/lib/civic-guide-categories";

// Un guide "TEF IRN" est simplement un guide dont category n'est pas une catégorie civique.
// /examen-civique/guides filtre .in("category", CIVIC_GUIDE_CATEGORIES) : sortir de cette liste
// pour un guide civique le rendrait invisible sur le site, d'où le select contraint ci-dessous.
type Product = "tef-irn" | "examen-civique";

const TYPES: { value: GuideType; label: string }[] = [
  { value: "complet", label: "Guide complet" },
  { value: "thematique", label: "Thématique" },
  { value: "astuces", label: "Astuces" },
  { value: "methodologie", label: "Méthodologie" },
];

interface GuideRow {
  id: string;
  slug: string;
  title: string;
  parcours_id: string | null;
  level: string | null;
  category: string | null;
  type: GuideType;
  description: string | null;
  content: string | null;
  reading_time: number | null;
  image_url: string | null;
  image_caption: string | null;
  icon: string | null;
  is_published: boolean;
  created_at: string;
  key_points: string[] | null;
}

interface ParcoursOption {
  id: string;
  nom_parcours: string;
}

// Forme du fichier <slug>.json produit par le skill de création de guide.
// Tous les champs sont optionnels côté import : un skill qui évolue ne doit pas casser l'import,
// les champs absents laissent simplement le formulaire vide sur ce point.
interface GuideImportMeta {
  slug?: string;
  title?: string;
  level?: string;
  category?: string;
  type?: GuideType;
  icon?: string;
  description?: string;
  reading_time?: number;
  is_published?: boolean;
  key_points?: string[];
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EMPTY_FORM = {
  product: "tef-irn" as Product,
  title: "",
  slug: "",
  slugTouched: false,
  category: "",
  level: "",
  type: "thematique" as GuideType,
  description: "",
  content: "",
  readingTime: "",
  imageUrl: "",
  imageCaption: "",
  icon: "",
  keyPoints: "",
  parcoursId: "",
  isPublished: false,
};

export default function GuidesAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const authState = useAdminGuard();
  const [guides, setGuides] = useState<GuideRow[]>([]);
  const [parcoursOptions, setParcoursOptions] = useState<ParcoursOption[]>([]);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [productFilter, setProductFilter] = useState<"Tous" | Product>("Tous");
  const [publishedFilter, setPublishedFilter] = useState<"Tous" | "true" | "false">("Tous");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isCivic = (category: string | null) =>
    !!category && (CIVIC_GUIDE_CATEGORIES as readonly string[]).includes(category);

  const fetchGuides = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("guides").select("*").order("created_at", { ascending: false });
    if (publishedFilter !== "Tous") query = query.eq("is_published", publishedFilter === "true");
    if (search.trim()) {
      const term = search.trim().replace(/[%,]/g, "");
      query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);
    }
    const { data, error } = await query.limit(300);
    if (!error) {
      let rows = (data as GuideRow[]) || [];
      if (productFilter !== "Tous") {
        rows = rows.filter((g) => (productFilter === "examen-civique" ? isCivic(g.category) : !isCivic(g.category)));
      }
      setGuides(rows);
      setExistingCategories(
        Array.from(new Set((data as GuideRow[] || []).map((g) => g.category).filter((c): c is string => !!c && !isCivic(c))))
      );
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, productFilter, publishedFilter, search]);

  useEffect(() => {
    if (authState === "granted") fetchGuides();
  }, [authState, fetchGuides]);

  useEffect(() => {
    if (authState !== "granted") return;
    supabase
      .from("parcours")
      .select("id, nom_parcours")
      .order("nom_parcours")
      .then(({ data }: { data: ParcoursOption[] | null }) => setParcoursOptions(data || []));
  }, [authState, supabase]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const openEditDialog = (g: GuideRow) => {
    setEditingId(g.id);
    setForm({
      product: isCivic(g.category) ? "examen-civique" : "tef-irn",
      title: g.title,
      slug: g.slug,
      slugTouched: true,
      category: g.category || "",
      level: g.level || "",
      type: g.type || "thematique",
      description: g.description || "",
      content: g.content || "",
      readingTime: g.reading_time ? String(g.reading_time) : "",
      imageUrl: g.image_url || "",
      imageCaption: g.image_caption || "",
      icon: g.icon || "",
      keyPoints: (g.key_points || []).join("\n"),
      parcoursId: g.parcours_id || "",
      isPublished: g.is_published,
    });
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, slug: f.slugTouched ? f.slug : slugify(title) }));
  };

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });

  const handleImportJson = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de réimporter le même fichier après une correction
    if (!file) return;
    setErrorMsg(null);
    try {
      const meta = JSON.parse(await readFileAsText(file)) as GuideImportMeta;
      setForm((f) => ({
        ...f,
        product: isCivic(meta.category || null) ? "examen-civique" : "tef-irn",
        title: meta.title ?? f.title,
        slug: meta.slug ?? f.slug,
        slugTouched: true,
        category: meta.category ?? f.category,
        level: meta.level ?? f.level,
        type: meta.type ?? f.type,
        description: meta.description ?? f.description,
        readingTime: meta.reading_time != null ? String(meta.reading_time) : f.readingTime,
        icon: meta.icon ?? f.icon,
        keyPoints: meta.key_points ? meta.key_points.join("\n") : f.keyPoints,
        isPublished: meta.is_published ?? f.isPublished,
      }));
    } catch (err: any) {
      setErrorMsg("Fichier JSON invalide : " + (err?.message || "erreur de parsing."));
    }
  };

  const handleImportMd = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await readFileAsText(file);
    setForm((f) => ({ ...f, content: text }));
  };

  const handleProductChange = (product: Product) => {
    // On repart d'une catégorie vide : les deux listes ne se recoupent pas, mieux vaut
    // forcer un nouveau choix explicite que de laisser une catégorie civique sur un guide TEF IRN.
    setForm((f) => ({ ...f, product, category: "" }));
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return "Le titre est obligatoire.";
    if (!form.slug.trim()) return "Le slug est obligatoire.";
    if (!form.category.trim()) return "La catégorie est obligatoire.";
    if (!form.content.trim()) return "Le contenu (markdown) est obligatoire.";
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
        category: form.category.trim(),
        level: form.level.trim() || null,
        type: form.type,
        description: form.description.trim() || null,
        content: form.content,
        reading_time: form.readingTime ? Number(form.readingTime) : null,
        image_url: form.imageUrl.trim() || null,
        image_caption: form.imageCaption.trim() || null,
        icon: form.icon.trim() || null,
        key_points: form.keyPoints.split("\n").map((p) => p.trim()).filter(Boolean),
        parcours_id: form.parcoursId || null,
        is_published: form.isPublished,
      };
      const { error } = editingId
        ? await supabase.from("guides").update(payload).eq("id", editingId)
        : await supabase.from("guides").insert(payload);
      if (error) throw error;
      setDialogOpen(false);
      fetchGuides();
    } catch (err: any) {
      console.error("Error saving guide:", err);
      setErrorMsg(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer définitivement ce guide ?")) return;
    const { error } = await supabase.from("guides").delete().eq("id", id);
    if (!error) fetchGuides();
  };

  if (authState !== "granted") {
    return <AdminGuardScreen state={authState} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 pt-12">
      <header className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <Badge className="bg-slate-900 mb-2">ZONE ADMIN</Badge>
          <h1 className="text-3xl font-black tracking-tight">Guides</h1>
          <p className="text-muted-foreground">
            {guides.length} guide{guides.length > 1 ? "s" : ""} affiché{guides.length > 1 ? "s" : ""} —{" "}
            <Link href="/tef-irn/guides" className="text-indigo-600 hover:underline font-bold">
              Voir /tef-irn/guides
            </Link>{" "}
            ·{" "}
            <Link href="/examen-civique/guides" className="text-indigo-600 hover:underline font-bold">
              Voir /examen-civique/guides
            </Link>
          </p>
        </div>
        <Button onClick={openCreateDialog} className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black shadow-xl shadow-indigo-100">
          <Plus className="mr-2" size={18} /> Ajouter un guide
        </Button>
      </header>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value as any)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="Tous">Tous les produits</option>
          <option value="tef-irn">TEF IRN</option>
          <option value="examen-civique">Examen civique</option>
        </select>
        <select value={publishedFilter} onChange={(e) => setPublishedFilter(e.target.value as any)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="Tous">Publiés + brouillons</option>
          <option value="true">Publiés</option>
          <option value="false">Brouillons</option>
        </select>
        <Input placeholder="Rechercher un titre ou un slug..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 max-w-xs" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50">
          {guides.length === 0 && (
            <p className="p-8 text-center text-zinc-400 font-bold text-sm">Aucun guide ne correspond à ces filtres.</p>
          )}
          {guides.map((g) => (
            <div key={g.id} className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] font-black uppercase">
                    {isCivic(g.category) ? "Examen civique" : "TEF IRN"}
                  </Badge>
                  {g.category && <Badge className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-500 border-none">{g.category}</Badge>}
                  {g.level && <Badge className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-500 border-none">{g.level}</Badge>}
                  <Badge className={`text-[10px] font-black uppercase border-none ${g.is_published ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                    {g.is_published ? "Publié" : "Brouillon"}
                  </Badge>
                </div>
                <p className="text-sm font-bold text-zinc-800 truncate">{g.title}</p>
                <p className="text-xs text-zinc-400 truncate">/{g.slug}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {g.is_published ? (
                  <Link
                    href={`/${isCivic(g.category) ? "examen-civique" : "tef-irn"}/guides/${g.slug}`}
                    target="_blank"
                    className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-indigo-600"
                    title="Voir sur le site"
                  >
                    <ExternalLink size={15} />
                  </Link>
                ) : (
                  <span
                    className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-200 cursor-not-allowed"
                    title="Brouillon non publié : pas encore visible sur le site"
                  >
                    <ExternalLink size={15} />
                  </span>
                )}
                <button onClick={() => openEditDialog(g)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-indigo-600">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(g.id)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-rose-600">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le guide" : "Nouveau guide"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {errorMsg && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">{errorMsg}</div>}

            <div className="p-4 bg-indigo-50 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <UploadCloud size={16} className="text-indigo-600" />
                <p className="text-sm font-black text-zinc-900">Importer depuis le skill (JSON + MD)</p>
              </div>
              <p className="text-xs text-zinc-500">
                Sélectionnez le <code>*.json</code> (métadonnées) et le <code>*-content.md</code> (contenu) générés par le skill —
                chaque fichier pré-remplit sa partie du formulaire, à vérifier avant d'enregistrer.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] font-black uppercase text-zinc-400">Métadonnées (.json)</Label>
                  <input type="file" accept=".json,application/json" onChange={handleImportJson} className="mt-1 w-full text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase text-zinc-400">Contenu (.md)</Label>
                  <input type="file" accept=".md,.markdown,text/markdown" onChange={handleImportMd} className="mt-1 w-full text-xs" />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Produit</Label>
              <select
                value={form.product}
                onChange={(e) => handleProductChange(e.target.value as Product)}
                className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold"
              >
                <option value="tef-irn">TEF IRN</option>
                <option value="examen-civique">Examen civique</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Titre</Label>
                <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value), slugTouched: true }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Catégorie</Label>
                {form.product === "examen-civique" ? (
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold"
                  >
                    <option value="">— Choisir —</option>
                    {CIVIC_GUIDE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <>
                    <Input
                      list="tef-irn-categories"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="mt-1"
                      placeholder="ex: grammaire"
                    />
                    <datalist id="tef-irn-categories">
                      {existingCategories.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </>
                )}
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Niveau</Label>
                <Input value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className="mt-1" placeholder="ex: A2-B1" />
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Type</Label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as GuideType }))} className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Description (résumé court)</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1" />
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">
                Contenu (markdown) — sections spéciales optionnelles : <code>## Comment LlamaKusi vous aide</code>, <code>## FAQ</code>
              </Label>
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
              <Label className="text-xs font-black uppercase text-zinc-400">Points clés (un par ligne, affichés en liste à puces)</Label>
              <Textarea
                value={form.keyPoints}
                onChange={(e) => setForm((f) => ({ ...f, keyPoints: e.target.value }))}
                className="mt-1"
                placeholder={"Comprendre le format de l'épreuve\nS'entraîner avec des sujets types\n..."}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Temps de lecture (min)</Label>
                <Input type="number" value={form.readingTime} onChange={(e) => setForm((f) => ({ ...f, readingTime: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Icône (nom lucide-react, optionnel)</Label>
                <Input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} className="mt-1" placeholder="ex: BookOpen" />
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Parcours lié (optionnel)</Label>
                <select value={form.parcoursId} onChange={(e) => setForm((f) => ({ ...f, parcoursId: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
                  <option value="">— Aucun —</option>
                  {parcoursOptions.map((p) => <option key={p.id} value={p.id}>{p.nom_parcours}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">URL image (optionnel)</Label>
                <Input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} className="mt-1" placeholder="https://..." />
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Légende image (optionnel)</Label>
                <Input value={form.imageCaption} onChange={(e) => setForm((f) => ({ ...f, imageCaption: e.target.value }))} className="mt-1" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
              <div>
                <p className="text-sm font-black text-zinc-900">Publié</p>
                <p className="text-xs text-zinc-400">Visible sur le site si activé, sinon brouillon interne.</p>
              </div>
              <Switch checked={form.isPublished} onCheckedChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} />
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
