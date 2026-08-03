"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

interface CentreRow {
  id: string;
  tc_id: number;
  nom: string;
  adresse: string;
  code_postal: string | null;
  ville: string | null;
  latitude: number | null;
  longitude: number | null;
  produits: string[];
  email: string | null;
  telephone: string | null;
  url_contact: string;
  actif: boolean;
}

const PRODUITS = [
  { value: "csp", label: "CSP" },
  { value: "carte_resident", label: "Carte de Résident" },
  { value: "naturalisation", label: "Naturalisation" },
];

const EMPTY_FORM = {
  tc_id: "",
  nom: "",
  adresse: "",
  code_postal: "",
  ville: "",
  latitude: "",
  longitude: "",
  produits: [] as string[],
  email: "",
  telephone: "",
  url_contact: "",
  actif: true,
};

export default function CentresCiviquesAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const authState = useAdminGuard();
  const [items, setItems] = useState<CentreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [produitFilter, setProduitFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("centres_examen_civique").select("*").order("nom", { ascending: true });
    if (statusFilter === "actif") query = query.eq("actif", true);
    if (statusFilter === "inactif") query = query.eq("actif", false);
    if (produitFilter !== "Tous") query = query.contains("produits", [produitFilter]);
    if (search.trim()) query = query.or(`nom.ilike.%${search.trim()}%,ville.ilike.%${search.trim()}%`);
    const { data, error } = await query.limit(300);
    if (!error) setItems((data as CentreRow[]) || []);
    setLoading(false);
  }, [supabase, statusFilter, produitFilter, search]);

  useEffect(() => {
    if (authState === "granted") fetchItems();
  }, [authState, fetchItems]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const openEditDialog = (c: CentreRow) => {
    setEditingId(c.id);
    setForm({
      tc_id: String(c.tc_id),
      nom: c.nom,
      adresse: c.adresse,
      code_postal: c.code_postal || "",
      ville: c.ville || "",
      latitude: c.latitude !== null ? String(c.latitude) : "",
      longitude: c.longitude !== null ? String(c.longitude) : "",
      produits: c.produits || [],
      email: c.email || "",
      telephone: c.telephone || "",
      url_contact: c.url_contact,
      actif: c.actif,
    });
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const toggleProduit = (value: string) => {
    setForm((f) => ({
      ...f,
      produits: f.produits.includes(value) ? f.produits.filter((p) => p !== value) : [...f.produits, value],
    }));
  };

  const validate = (): string | null => {
    if (!form.tc_id.trim() || isNaN(Number(form.tc_id))) return "L'identifiant TC (tc_id) est obligatoire et doit être un nombre.";
    if (!form.nom.trim()) return "Le nom est obligatoire.";
    if (!form.adresse.trim()) return "L'adresse est obligatoire.";
    if (!form.url_contact.trim()) return "L'URL de contact est obligatoire.";
    if (form.produits.length === 0) return "Sélectionnez au moins un produit (CSP / Carte de Résident / Naturalisation).";
    return null;
  };

  const handleSave = async () => {
    setErrorMsg(null);
    const validationError = validate();
    if (validationError) { setErrorMsg(validationError); return; }

    setSaving(true);
    try {
      const payload = {
        tc_id: Number(form.tc_id),
        nom: form.nom.trim(),
        adresse: form.adresse.trim(),
        code_postal: form.code_postal.trim() || null,
        ville: form.ville.trim() || null,
        latitude: form.latitude.trim() ? Number(form.latitude) : null,
        longitude: form.longitude.trim() ? Number(form.longitude) : null,
        produits: form.produits,
        email: form.email.trim() || null,
        telephone: form.telephone.trim() || null,
        url_contact: form.url_contact.trim(),
        actif: form.actif,
      };
      const { error } = editingId
        ? await supabase.from("centres_examen_civique").update(payload).eq("id", editingId)
        : await supabase.from("centres_examen_civique").insert(payload);
      if (error) throw error;
      setDialogOpen(false);
      fetchItems();
    } catch (err: any) {
      console.error("Error saving centre:", err);
      setErrorMsg(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer définitivement ce centre ?")) return;
    const { error } = await supabase.from("centres_examen_civique").delete().eq("id", id);
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
          <h1 className="text-3xl font-black tracking-tight">Centres examen civique</h1>
          <p className="text-muted-foreground">
            {items.length} centre{items.length > 1 ? "s" : ""} affiché{items.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreateDialog} className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black shadow-xl shadow-indigo-100">
          <Plus className="mr-2" size={18} /> Ajouter un centre
        </Button>
      </header>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="Tous">Tous les statuts</option>
          <option value="actif">Actifs uniquement</option>
          <option value="inactif">Inactifs uniquement</option>
        </select>
        <select value={produitFilter} onChange={(e) => setProduitFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="Tous">Tous les produits</option>
          {PRODUITS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <Input placeholder="Rechercher par nom ou ville..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 max-w-xs" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50">
          {items.length === 0 && (
            <p className="p-8 text-center text-zinc-400 font-bold text-sm">Aucun centre ne correspond à ces filtres.</p>
          )}
          {items.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {c.ville && <Badge variant="outline" className="text-[10px] font-black uppercase">{c.ville}</Badge>}
                  {(c.produits || []).map((p) => (
                    <Badge key={p} className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-500 border-none">
                      {PRODUITS.find((x) => x.value === p)?.label || p}
                    </Badge>
                  ))}
                  {!c.actif && <Badge className="text-[10px] font-black uppercase bg-rose-50 text-rose-600 border-none">Inactif</Badge>}
                </div>
                <p className="text-sm font-bold text-zinc-800 truncate">{c.nom}</p>
                <p className="text-xs text-zinc-400 truncate">{c.adresse}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEditDialog(c)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-indigo-600">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(c.id)} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-rose-600">
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
            <DialogTitle>{editingId ? "Modifier le centre" : "Nouveau centre"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {errorMsg && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">{errorMsg}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Identifiant TC (tc_id)</Label>
                <Input type="number" value={form.tc_id} onChange={(e) => setForm((f) => ({ ...f, tc_id: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Nom</Label>
                <Input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Adresse</Label>
              <Input value={form.adresse} onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))} className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Code postal</Label>
                <Input value={form.code_postal} onChange={(e) => setForm((f) => ({ ...f, code_postal: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Ville</Label>
                <Input value={form.ville} onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Latitude (optionnel)</Label>
                <Input value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Longitude (optionnel)</Label>
                <Input value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Produits proposés</Label>
              <div className="flex gap-4 mt-2">
                {PRODUITS.map((p) => (
                  <label key={p.value} className="flex items-center gap-2 text-sm font-bold text-zinc-700">
                    <input type="checkbox" checked={form.produits.includes(p.value)} onChange={() => toggleProduit(p.value)} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Email (optionnel)</Label>
                <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-black uppercase text-zinc-400">Téléphone (optionnel)</Label>
                <Input value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">URL de contact / inscription</Label>
              <Input value={form.url_contact} onChange={(e) => setForm((f) => ({ ...f, url_contact: e.target.value }))} className="mt-1" />
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
              <div>
                <p className="text-sm font-black text-zinc-900">Actif</p>
                <p className="text-xs text-zinc-400">Un centre inactif n'apparaît plus dans la recherche publique.</p>
              </div>
              <Switch checked={form.actif} onCheckedChange={(v) => setForm((f) => ({ ...f, actif: v }))} />
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
