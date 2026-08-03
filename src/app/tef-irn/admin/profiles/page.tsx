"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, ShieldCheck, ShieldOff, RotateCcw, Eye, FlaskConical } from "lucide-react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminGuardScreen } from "@/components/shared/AdminGuardScreen";

interface ProfileRow {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  current_level: string | null;
  subscription_tier: string | null;
  is_admin: boolean;
  created_at: string;
  total_xp: number;
  last_activity_at: string;
  is_test_account: boolean;
}

type StatusFilter = "all" | "admin" | "normal";
type SortBy = "last_activity" | "created_at" | "xp";
type TestFilter = "all" | "hide_test" | "test_only";

// Formatage relatif simple (fr) pour repérer vite un compte inactif.
function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
}

interface LogEntry {
  id: string;
  admin_email: string;
  action: "promote_admin" | "demote_admin" | "reset_progress";
  target_email: string;
  details: { deletedCount?: number } | null;
  created_at: string;
}

const ACTION_LABELS: Record<LogEntry["action"], string> = {
  promote_admin: "a promu admin",
  demote_admin: "a rétrogradé",
  reset_progress: "a réinitialisé",
};

interface CategoryStat {
  count: number;
  avg_score: number | null;
}

interface UserStats {
  exercise_attempts: CategoryStat;
  writing_scenario_attempts: CategoryStat;
  oral_session_results: CategoryStat;
  civic_exam_attempts: CategoryStat;
  lesson_progress_count: number;
  user_parcours_progress_count: number;
  user_errors_count: number;
  last_sign_in_at: string | null;
}

const CONFIRM_PHRASE = "RETROGRADER";
const RESET_CONFIRM_PHRASE = "RESET";

export default function ProfilesAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const authState = useAdminGuard();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Confirmation renforcée, uniquement quand un admin retire son propre statut.
  const [selfDemoteTarget, setSelfDemoteTarget] = useState<ProfileRow | null>(null);
  const [confirmText, setConfirmText] = useState("");
  // Réinitialisation d'un compte : vide toute la progression (tentatives,
  // examens, SRS, chat coach...) mais conserve l'identité et le statut admin.
  const [resetTarget, setResetTarget] = useState<ProfileRow | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetPendingId, setResetPendingId] = useState<string | null>(null);
  const [resetResultMsg, setResetResultMsg] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [testFilter, setTestFilter] = useState<TestFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("last_activity");
  const [actionsLog, setActionsLog] = useState<LogEntry[]>([]);
  const [logExpanded, setLogExpanded] = useState(false);
  const [testTogglingId, setTestTogglingId] = useState<string | null>(null);
  // Vue détail : stats agrégées d'un compte (nb tentatives, score moyen, dernière connexion).
  const [detailTarget, setDetailTarget] = useState<ProfileRow | null>(null);
  const [detailStats, setDetailStats] = useState<UserStats | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);
    })();
  }, [supabase]);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/profiles?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur de chargement.");
      setProfiles(json.profiles || []);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchActionsLog = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/profiles/actions-log");
      const json = await res.json();
      if (res.ok) setActionsLog(json.entries || []);
    } catch {
      // Historique non bloquant : on n'affiche pas d'erreur si ça échoue.
    }
  }, []);

  useEffect(() => {
    if (authState === "granted") {
      fetchProfiles();
      fetchActionsLog();
    }
  }, [authState, fetchProfiles, fetchActionsLog]);

  const myProfile = useMemo(
    () => profiles.find((p) => p.id === currentUserId) ?? null,
    [profiles, currentUserId]
  );

  const displayedProfiles = useMemo(() => {
    let list = profiles.filter((p) => p.id !== currentUserId);
    if (statusFilter === "admin") list = list.filter((p) => p.is_admin);
    if (statusFilter === "normal") list = list.filter((p) => !p.is_admin);
    if (testFilter === "hide_test") list = list.filter((p) => !p.is_test_account);
    if (testFilter === "test_only") list = list.filter((p) => p.is_test_account);

    const sorted = [...list];
    if (sortBy === "last_activity") {
      sorted.sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime());
    } else if (sortBy === "created_at") {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      sorted.sort((a, b) => b.total_xp - a.total_xp);
    }
    return sorted;
  }, [profiles, currentUserId, statusFilter, testFilter, sortBy]);

  const toggleAdmin = async (profile: ProfileRow, nextIsAdmin: boolean) => {
    setPendingId(profile.id);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/profiles/toggle-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id, isAdmin: nextIsAdmin }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de la mise à jour.");
      await fetchProfiles();
      await fetchActionsLog();
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors de la mise à jour.");
    } finally {
      setPendingId(null);
    }
  };

  const handleToggleClick = (profile: ProfileRow) => {
    const nextIsAdmin = !profile.is_admin;
    const isSelf = profile.id === currentUserId;

    if (isSelf && !nextIsAdmin) {
      // Auto-rétrogradation : confirmation forte (saisie à taper), pas un simple confirm().
      setConfirmText("");
      setSelfDemoteTarget(profile);
      return;
    }

    const verb = nextIsAdmin ? "promouvoir" : "rétrograder";
    if (!window.confirm(`Confirmer : ${verb} "${profile.email}" ${nextIsAdmin ? "en admin" : "en compte normal"} ?`)) return;
    toggleAdmin(profile, nextIsAdmin);
  };

  const confirmSelfDemote = async () => {
    if (!selfDemoteTarget) return;
    await toggleAdmin(selfDemoteTarget, false);
    setSelfDemoteTarget(null);
  };

  const confirmReset = async () => {
    if (!resetTarget) return;
    setResetPendingId(resetTarget.id);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/profiles/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: resetTarget.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de la réinitialisation.");
      setResetTarget(null);
      setResetResultMsg(`Compte "${resetTarget.email}" réinitialisé (${json.deletedCount} enregistrements supprimés).`);
      await fetchProfiles();
      await fetchActionsLog();
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors de la réinitialisation.");
    } finally {
      setResetPendingId(null);
    }
  };

  const toggleTestAccount = async (profile: ProfileRow) => {
    const nextValue = !profile.is_test_account;
    setTestTogglingId(profile.id);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/profiles/toggle-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id, isTestAccount: nextValue }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de la mise à jour.");
      await fetchProfiles();
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors de la mise à jour.");
    } finally {
      setTestTogglingId(null);
    }
  };

  const openDetail = async (profile: ProfileRow) => {
    setDetailTarget(profile);
    setDetailStats(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/profiles/stats?userId=${profile.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors du chargement des statistiques.");
      setDetailStats(json.stats);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors du chargement des statistiques.");
    } finally {
      setDetailLoading(false);
    }
  };

  if (authState !== "granted") {
    return <AdminGuardScreen state={authState} />;
  }

  const renderProfileCard = (profile: ProfileRow, pinned = false) => (
    <div key={profile.id} className={`flex items-start justify-between gap-4 p-5 ${pinned ? "bg-indigo-50/40" : ""}`}>
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {profile.is_admin ? (
            <Badge className="text-[10px] font-black uppercase bg-amber-50 text-amber-700 border-none">Admin</Badge>
          ) : (
            <Badge className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-500 border-none">Compte normal</Badge>
          )}
          {profile.subscription_tier && <Badge variant="outline" className="text-[10px] font-black uppercase">{profile.subscription_tier}</Badge>}
          {profile.current_level && <Badge variant="outline" className="text-[10px] font-black uppercase">{profile.current_level}</Badge>}
          <button
            type="button"
            disabled={testTogglingId === profile.id}
            onClick={() => toggleTestAccount(profile)}
            title="Marquer/démarquer comme compte de test"
          >
            <Badge
              className={`text-[10px] font-black uppercase border-none cursor-pointer ${
                profile.is_test_account ? "bg-violet-100 text-violet-700" : "bg-zinc-50 text-zinc-300 hover:text-zinc-400"
              }`}
            >
              <FlaskConical size={10} className="mr-1" /> Test
            </Badge>
          </button>
          {pinned && <span className="text-[10px] font-black text-indigo-500 uppercase">(vous)</span>}
        </div>
        <p className="text-sm font-bold text-zinc-800 truncate">{profile.email}</p>
        {(profile.full_name || profile.username) && (
          <p className="text-xs text-zinc-400 truncate">{profile.full_name || profile.username}</p>
        )}
        <p className="text-[11px] text-zinc-400">
          {profile.total_xp} XP · actif {formatRelative(profile.last_activity_at)} · créé le{" "}
          {new Date(profile.created_at).toLocaleDateString("fr-FR")}
        </p>
      </div>
      <div className="shrink-0 flex gap-2">
        <Button
          variant="outline"
          onClick={() => openDetail(profile)}
          className="rounded-2xl font-black text-xs h-10 px-4 text-zinc-500 border-zinc-200 hover:bg-zinc-50"
        >
          <Eye size={14} className="mr-1.5" /> Détails
        </Button>
        <Button
          variant="outline"
          disabled={resetPendingId === profile.id}
          onClick={() => { setResetConfirmText(""); setResetTarget(profile); }}
          className="rounded-2xl font-black text-xs h-10 px-4 text-rose-600 border-rose-200 hover:bg-rose-50"
        >
          {resetPendingId === profile.id ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <><RotateCcw size={14} className="mr-1.5" /> Réinitialiser</>
          )}
        </Button>
        <Button
          variant={profile.is_admin ? "secondary" : "default"}
          disabled={pendingId === profile.id}
          onClick={() => handleToggleClick(profile)}
          className={`rounded-2xl font-black text-xs h-10 px-4 ${profile.is_admin ? "" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
        >
          {pendingId === profile.id ? (
            <Loader2 className="animate-spin" size={14} />
          ) : profile.is_admin ? (
            <><ShieldOff size={14} className="mr-1.5" /> Rétrograder</>
          ) : (
            <><ShieldCheck size={14} className="mr-1.5" /> Promouvoir admin</>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-8 pt-12">
      <header className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <Badge className="bg-slate-900 mb-2">ZONE ADMIN</Badge>
          <h1 className="text-3xl font-black tracking-tight">Profils</h1>
          <p className="text-muted-foreground">
            {profiles.length} compte{profiles.length > 1 ? "s" : ""} au total
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input placeholder="Rechercher par email, username ou nom..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 max-w-xs" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="all">Tous les statuts</option>
          <option value="admin">Admins uniquement</option>
          <option value="normal">Comptes normaux uniquement</option>
        </select>
        <select value={testFilter} onChange={(e) => setTestFilter(e.target.value as TestFilter)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="all">Comptes de test inclus</option>
          <option value="hide_test">Masquer les comptes de test</option>
          <option value="test_only">Comptes de test uniquement</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold">
          <option value="last_activity">Trier : dernière activité</option>
          <option value="created_at">Trier : date de création</option>
          <option value="xp">Trier : XP</option>
        </select>
      </div>

      {errorMsg && <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">{errorMsg}</div>}
      {resetResultMsg && <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold">{resetResultMsg}</div>}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : (
        <>
          {myProfile && (
            <div className="mb-6 rounded-[2rem] border-2 border-indigo-100 shadow-sm overflow-hidden">
              <p className="px-5 pt-4 text-[10px] font-black uppercase text-indigo-400">Mon compte</p>
              {renderProfileCard(myProfile, true)}
            </div>
          )}

          <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50">
            {displayedProfiles.length === 0 && (
              <p className="p-8 text-center text-zinc-400 font-bold text-sm">Aucun compte ne correspond à cette recherche.</p>
            )}
            {displayedProfiles.map((profile) => renderProfileCard(profile))}
          </div>

          <div className="mt-6 bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setLogExpanded((v) => !v)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <span className="text-sm font-black text-zinc-700">Historique des actions admin</span>
              <span className="text-xs font-bold text-zinc-400">{logExpanded ? "Masquer" : "Afficher"}</span>
            </button>
            {logExpanded && (
              <div className="divide-y divide-zinc-50 border-t border-zinc-50">
                {actionsLog.length === 0 && (
                  <p className="p-5 text-center text-zinc-400 font-bold text-sm">Aucune action enregistrée.</p>
                )}
                {actionsLog.map((entry) => (
                  <div key={entry.id} className="p-4 text-xs text-zinc-600">
                    <span className="font-bold text-zinc-800">{entry.admin_email}</span>{" "}
                    {ACTION_LABELS[entry.action]}{" "}
                    <span className="font-bold text-zinc-800">{entry.target_email}</span>
                    {entry.action === "reset_progress" && entry.details?.deletedCount !== undefined && (
                      <span className="text-zinc-400"> ({entry.details.deletedCount} enregistrements supprimés)</span>
                    )}
                    <span className="text-zinc-400"> · {formatRelative(entry.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={!!selfDemoteTarget} onOpenChange={(open) => !open && setSelfDemoteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Retirer votre propre statut admin ?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-zinc-600">
              Vous êtes sur le point de retirer <strong>votre propre</strong> accès admin. Vous perdrez immédiatement
              l'accès à cette zone. Pour confirmer, tapez <strong>{CONFIRM_PHRASE}</strong> ci-dessous.
            </p>
            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Confirmation</Label>
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="mt-1" placeholder={CONFIRM_PHRASE} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSelfDemoteTarget(null)} className="rounded-2xl font-black text-sm">
              Annuler
            </Button>
            <Button
              onClick={confirmSelfDemote}
              disabled={confirmText !== CONFIRM_PHRASE || pendingId === selfDemoteTarget?.id}
              className="bg-rose-600 text-white hover:bg-rose-700 rounded-2xl font-black text-sm"
            >
              {pendingId === selfDemoteTarget?.id ? <Loader2 className="animate-spin" size={16} /> : "Confirmer la rétrogradation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser ce compte ?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-zinc-600">
              Toute la progression de <strong>{resetTarget?.email}</strong> sera définitivement supprimée
              (tentatives, examens blancs, SRS, historique du chat coach...). Le statut admin, l'abonnement,
              les crédits IA et les paramètres d'onboarding (niveau, objectif, date d'examen) sont conservés.
              Cette action est irréversible. Pour confirmer, tapez <strong>{RESET_CONFIRM_PHRASE}</strong> ci-dessous.
            </p>
            <div>
              <Label className="text-xs font-black uppercase text-zinc-400">Confirmation</Label>
              <Input value={resetConfirmText} onChange={(e) => setResetConfirmText(e.target.value)} className="mt-1" placeholder={RESET_CONFIRM_PHRASE} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setResetTarget(null)} className="rounded-2xl font-black text-sm">
              Annuler
            </Button>
            <Button
              onClick={confirmReset}
              disabled={resetConfirmText !== RESET_CONFIRM_PHRASE || resetPendingId === resetTarget?.id}
              className="bg-rose-600 text-white hover:bg-rose-700 rounded-2xl font-black text-sm"
            >
              {resetPendingId === resetTarget?.id ? <Loader2 className="animate-spin" size={16} /> : "Confirmer la réinitialisation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails — {detailTarget?.email}</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-600" size={24} /></div>
          ) : detailStats ? (
            <div className="space-y-2 text-sm text-zinc-700">
              <div className="flex justify-between border-b border-zinc-50 pb-2">
                <span>Exercices (pratique)</span>
                <span className="font-bold">
                  {detailStats.exercise_attempts.count}
                  {detailStats.exercise_attempts.avg_score !== null && ` · moy. ${detailStats.exercise_attempts.avg_score}`}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-50 pb-2">
                <span>Examens blancs EE</span>
                <span className="font-bold">
                  {detailStats.writing_scenario_attempts.count}
                  {detailStats.writing_scenario_attempts.avg_score !== null && ` · moy. ${detailStats.writing_scenario_attempts.avg_score}`}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-50 pb-2">
                <span>Sessions EO</span>
                <span className="font-bold">
                  {detailStats.oral_session_results.count}
                  {detailStats.oral_session_results.avg_score !== null && ` · moy. ${detailStats.oral_session_results.avg_score}`}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-50 pb-2">
                <span>Examen civique blanc</span>
                <span className="font-bold">
                  {detailStats.civic_exam_attempts.count}
                  {detailStats.civic_exam_attempts.avg_score !== null && ` · moy. ${detailStats.civic_exam_attempts.avg_score}`}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-50 pb-2">
                <span>Leçons terminées</span>
                <span className="font-bold">{detailStats.lesson_progress_count}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-50 pb-2">
                <span>Parcours suivis</span>
                <span className="font-bold">{detailStats.user_parcours_progress_count}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-50 pb-2">
                <span>Erreurs trackées</span>
                <span className="font-bold">{detailStats.user_errors_count}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Dernière connexion</span>
                <span className="font-bold">
                  {detailStats.last_sign_in_at ? formatRelative(detailStats.last_sign_in_at) : "jamais"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">Aucune donnée disponible.</p>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDetailTarget(null)} className="rounded-2xl font-black text-sm">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
