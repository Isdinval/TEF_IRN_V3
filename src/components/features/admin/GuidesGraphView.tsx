"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2, ChevronLeft, ChevronRight, Waypoints, Share2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import {
  buildGuideLinkGraph,
  type GuideForGraph,
  type GuideGraphIssue,
} from "@/lib/guides-link-graph";
import { computeGuideMindmapLayout, computeGuideForceLayout } from "@/lib/guides-graph-layout";
import type { GuideProduct, GuideSiloRole } from "@/types/guides";

// Onglet "Graphe" de l'admin des guides : mindmap radiale (hub au centre, piliers autour,
// satellites autour de leur pilier), a partir du rattachement voulu (parent_guide_id). Chaque
// cellule affiche le titre complet, les badges (role/produit/brouillon) et la liste en clair des
// ecarts detectes par buildGuideLinkGraph (src/lib/guides-link-graph.ts) - pas juste un compteur.
// Un navigateur Precedent/Suivant fait defiler les guides en ecart et centre/zoome le mindmap
// dessus. Aucune nouvelle table : tout est recalcule a la volee a partir de `guides`.

interface GuideRowForGraph {
  id: string;
  slug: string;
  title: string;
  product: GuideProduct;
  silo_role: GuideSiloRole;
  parent_guide_id: string | null;
  content: string | null;
  is_published: boolean;
}

const ISSUE_LABELS: Record<string, string> = {
  orphan: "Orphelin (aucun lien entrant)",
  satellite_without_pilier_link: "Aucun lien depuis un pilier/hub",
  pilier_without_hub_link: "Pas de lien avec le hub",
  pilier_without_satellites: "Aucun satellite en aval",
  hub_without_piliers: "Aucun pilier en aval",
  broken_internal_link: "Lien interne mort",
  declared_parent_not_linked: "Rattaché en base mais pas linké dans le contenu",
};

function formatIssue(issue: GuideGraphIssue): string {
  const base = ISSUE_LABELS[issue.type] || issue.type;
  return issue.detail ? `${base} → ${issue.detail}` : base;
}

interface GuideNodeData {
  title: string;
  slug: string;
  product: GuideProduct;
  siloRole: GuideSiloRole;
  isPublished: boolean;
  externalCount: number;
  issueLabels: string[];
  focused: boolean;
  [key: string]: unknown;
}

function GuideFlowNode({ data }: { data: GuideNodeData }) {
  const roleClass =
    data.siloRole === "hub"
      ? "bg-indigo-600 text-white border-indigo-700"
      : data.siloRole === "pilier"
        ? "bg-blue-50 text-blue-900 border-blue-300"
        : "bg-white text-zinc-700 border-zinc-200";
  const sizeClass = data.siloRole === "hub" ? "w-[260px]" : data.siloRole === "pilier" ? "w-[230px]" : "w-[210px]";
  const hasIssue = data.issueLabels.length > 0;
  return (
    <div
      className={`relative px-3 py-2.5 rounded-2xl border-2 shadow-sm text-xs transition-all ${sizeClass} ${roleClass} ${
        hasIssue ? "ring-2 ring-red-400" : ""
      } ${!data.isPublished ? "opacity-70 border-dashed" : ""} ${
        data.focused ? "ring-4 ring-yellow-400 shadow-2xl scale-105 z-10" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} />
      <p className="font-black leading-snug">{data.title}</p>
      <p className="opacity-60 mt-0.5 break-all">{data.slug}</p>
      <div className="flex gap-1 mt-1.5 flex-wrap">
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10">{data.product}</span>
        {!data.isPublished && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800">brouillon</span>
        )}
        {data.externalCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10">{data.externalCount} ext.</span>
        )}
      </div>
      {hasIssue && (
        <ul className="mt-1.5 space-y-0.5 border-t border-black/10 pt-1.5">
          {data.issueLabels.map((label, i) => (
            <li key={i} className="text-red-600 font-bold text-[10px] leading-snug">
              ⚠ {label}
            </li>
          ))}
        </ul>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = { guideNode: GuideFlowNode };

export default function GuidesGraphView() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<GuideRowForGraph[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [issueNavIndex, setIssueNavIndex] = useState(0);
  const [layoutMode, setLayoutMode] = useState<"mindmap" | "force">("mindmap");
  const [productFilter, setProductFilter] = useState<"tous" | GuideProduct>("tous");
  const [hideHealthy, setHideHealthy] = useState(false);
  const [hideDrafts, setHideDrafts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from("guides")
      .select("id, slug, title, product, silo_role, parent_guide_id, content, is_published")
      .then(({ data, error }: { data: GuideRowForGraph[] | null; error: { message: string } | null }) => {
        if (!active) return;
        if (error) setErrorMsg(error.message);
        else setRows(data || []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [supabase]);

  const graph = useMemo(() => {
    const forGraph: GuideForGraph[] = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      product: r.product,
      silo_role: r.silo_role,
      content: r.content,
      parent_guide_id: r.parent_guide_id,
    }));
    return buildGuideLinkGraph(forGraph);
  }, [rows]);

  // Tous les liens reels (pas seulement le rattachement voulu) - source pour le layout et les
  // aretes en mode force-directed, pour reperer les liens transverses inattendus.
  const realLinkEdges = useMemo(() => {
    const idByKey = new Map(graph.nodes.map((n) => [`${n.product}/${n.slug}`, n.id]));
    const edges: { source: string; target: string }[] = [];
    for (const n of graph.nodes) {
      for (const link of n.outboundGuideLinks) {
        if (!link.exists) continue;
        const targetId = idByKey.get(`${link.product}/${link.slug}`);
        if (targetId) edges.push({ source: n.id, target: targetId });
      }
    }
    return edges;
  }, [graph.nodes]);

  const positions = useMemo(
    () =>
      layoutMode === "mindmap"
        ? computeGuideMindmapLayout(graph.nodes)
        : computeGuideForceLayout(graph.nodes, realLinkEdges),
    [layoutMode, graph.nodes, realLinkEdges]
  );
  const positionById = useMemo(() => new Map(positions.map((p) => [p.id, { x: p.x, y: p.y }])), [positions]);
  const rowById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  const issueLabelsByKey = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const issue of graph.issues) {
      const key = `${issue.product}/${issue.slug}`;
      const bucket = map.get(key) ?? [];
      bucket.push(formatIssue(issue));
      map.set(key, bucket);
    }
    return map;
  }, [graph.issues]);

  // Visibilite des noeuds selon les filtres (produit, brouillons, "sans ecart") - le graphe et
  // les positions restent calcules sur TOUS les guides (coherence des calculs), seul l'affichage
  // est filtre, pour que les positions ne bougent pas quand on change un filtre.
  const visibleIds = useMemo(() => {
    const ids = new Set<string>();
    for (const n of graph.nodes) {
      if (n.siloRole !== "hub" && productFilter !== "tous" && n.product !== productFilter) continue;
      const row = rowById.get(n.id);
      if (hideDrafts && row && !row.is_published) continue;
      const labels = issueLabelsByKey.get(`${n.product}/${n.slug}`) ?? [];
      if (hideHealthy && labels.length === 0) continue;
      ids.add(n.id);
    }
    return ids;
  }, [graph.nodes, productFilter, hideDrafts, hideHealthy, rowById, issueLabelsByKey]);

  // Liste ordonnee (pire en premier) des guides en ecart VISIBLES, pour le navigateur Precedent/Suivant.
  const nodesWithIssues = useMemo(() => {
    return graph.nodes
      .filter((n) => visibleIds.has(n.id))
      .map((n) => ({ node: n, labels: issueLabelsByKey.get(`${n.product}/${n.slug}`) ?? [] }))
      .filter((x) => x.labels.length > 0)
      .sort((a, b) => b.labels.length - a.labels.length);
  }, [graph.nodes, issueLabelsByKey, visibleIds]);

  useEffect(() => {
    // Si la liste change (chargement, edition ailleurs, filtre) et que l'index pointe hors bornes.
    if (issueNavIndex >= nodesWithIssues.length) setIssueNavIndex(0);
  }, [nodesWithIssues.length, issueNavIndex]);

  const focusOnNode = useCallback(
    (id: string) => {
      setFocusedId(id);
      const pos = positionById.get(id);
      if (pos && rfInstance) {
        rfInstance.setCenter(pos.x + 100, pos.y + 40, { zoom: 1.1, duration: 600 });
      }
    },
    [positionById, rfInstance]
  );

  const goToIssue = useCallback(
    (index: number) => {
      if (nodesWithIssues.length === 0) return;
      const clamped = ((index % nodesWithIssues.length) + nodesWithIssues.length) % nodesWithIssues.length;
      setIssueNavIndex(clamped);
      focusOnNode(nodesWithIssues[clamped].node.id);
    },
    [nodesWithIssues, focusOnNode]
  );

  const searchMatches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return graph.nodes.filter(
      (n) =>
        visibleIds.has(n.id) &&
        ((rowById.get(n.id)?.title ?? "").toLowerCase().includes(term) || n.slug.toLowerCase().includes(term))
    );
  }, [searchTerm, graph.nodes, visibleIds, rowById]);

  const handleSearchSubmit = () => {
    if (searchMatches.length > 0) focusOnNode(searchMatches[0].id);
  };

  const flowNodes: Node[] = useMemo(
    () =>
      graph.nodes
        .filter((n) => visibleIds.has(n.id))
        .map((n) => {
          const row = rowById.get(n.id);
          const pos = positionById.get(n.id) ?? { x: 0, y: 0 };
          return {
            id: n.id,
            type: "guideNode",
            position: pos,
            data: {
              title: row?.title ?? n.slug,
              slug: n.slug,
              product: n.product,
              siloRole: n.siloRole,
              isPublished: row?.is_published ?? true,
              externalCount: n.externalLinks.length,
              issueLabels: issueLabelsByKey.get(`${n.product}/${n.slug}`) ?? [],
              focused: n.id === focusedId,
            } as GuideNodeData,
          };
        }),
    [graph.nodes, rowById, positionById, issueLabelsByKey, focusedId, visibleIds]
  );

  const flowEdges: Edge[] = useMemo(() => {
    if (layoutMode === "mindmap") {
      return graph.nodes
        .filter((n) => n.parentGuideId && visibleIds.has(n.id) && visibleIds.has(n.parentGuideId))
        .map((n) => {
          const mismatched = (issueLabelsByKey.get(`${n.product}/${n.slug}`) ?? []).some((l) =>
            l.startsWith(ISSUE_LABELS.declared_parent_not_linked)
          );
          return {
            id: `${n.parentGuideId}->${n.id}`,
            source: n.parentGuideId as string,
            target: n.id,
            style: mismatched ? { stroke: "#dc2626", strokeDasharray: "4 4" } : { stroke: "#a1a1aa" },
          };
        });
    }
    // Mode force-directed : TOUS les liens reels, colores selon qu'ils correspondent ou non au
    // rattachement voulu - c'est le point de ce mode, reperer les liens transverses inattendus.
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));
    return realLinkEdges
      .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
      .map((e, i) => {
        const source = byId.get(e.source);
        const target = byId.get(e.target);
        const matchesHierarchy = target?.parentGuideId === e.source || source?.parentGuideId === e.target;
        return {
          id: `force-${e.source}->${e.target}-${i}`,
          source: e.source,
          target: e.target,
          style: matchesHierarchy ? { stroke: "#a1a1aa" } : { stroke: "#2563eb", strokeWidth: 1.5 },
        };
    });
  }, [layoutMode, graph.nodes, issueLabelsByKey, realLinkEdges, visibleIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-400">
        <Loader2 className="animate-spin mr-2" size={20} /> Calcul du graphe...
      </div>
    );
  }
  if (errorMsg) {
    return <p className="text-red-600 text-sm p-6">{errorMsg}</p>;
  }

  const current = nodesWithIssues[issueNavIndex];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl border border-zinc-200 p-3">
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value as "tous" | GuideProduct)}
          className="h-9 px-3 rounded-xl border border-zinc-200 text-xs font-bold"
        >
          <option value="tous">Tous les produits</option>
          <option value="tef-irn">TEF IRN</option>
          <option value="examen-civique">Examen civique</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
          <input type="checkbox" checked={hideHealthy} onChange={(e) => setHideHealthy(e.target.checked)} />
          Masquer les guides sans écart
        </label>
        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
          <input type="checkbox" checked={hideDrafts} onChange={(e) => setHideDrafts(e.target.checked)} />
          Masquer les brouillons
        </label>
        <div className="flex items-center gap-1.5 ml-auto">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            placeholder="Chercher un guide (titre ou slug)..."
            className="h-9 w-64 text-xs"
          />
          <button
            onClick={handleSearchSubmit}
            disabled={searchMatches.length === 0}
            className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-indigo-600 disabled:opacity-30"
          >
            <Search size={15} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white rounded-2xl border border-zinc-200 p-3">
        <button
          onClick={() => goToIssue(issueNavIndex - 1)}
          disabled={nodesWithIssues.length === 0}
          className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-indigo-600 disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          {nodesWithIssues.length === 0 ? (
            <p className="text-sm font-black text-emerald-600">Aucun écart détecté 🎉</p>
          ) : (
            <>
              <p className="text-xs text-zinc-400 font-bold">
                Écart {issueNavIndex + 1}/{nodesWithIssues.length} — {current.labels.length} problème
                {current.labels.length > 1 ? "s" : ""} sur ce guide
              </p>
              <p className="text-sm font-black truncate">{current.node.slug}</p>
            </>
          )}
        </div>
        <button
          onClick={() => goToIssue(issueNavIndex + 1)}
          disabled={nodesWithIssues.length === 0}
          className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-indigo-600 disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
        <div className="w-px h-8 bg-zinc-100" />
        <button
          onClick={() => setLayoutMode("mindmap")}
          className={`h-9 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 ${
            layoutMode === "mindmap" ? "bg-indigo-600 text-white" : "bg-zinc-50 text-zinc-500"
          }`}
        >
          <Share2 size={14} /> Mindmap
        </button>
        <button
          onClick={() => setLayoutMode("force")}
          className={`h-9 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 ${
            layoutMode === "force" ? "bg-indigo-600 text-white" : "bg-zinc-50 text-zinc-500"
          }`}
        >
          <Waypoints size={14} /> Force-directed
        </button>
      </div>

      <div className="h-[75vh] rounded-2xl border border-zinc-200 overflow-hidden">
        <ReactFlow nodes={flowNodes} edges={flowEdges} nodeTypes={nodeTypes} onInit={setRfInstance} fitView>
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      <p className="text-xs text-zinc-400">
        {layoutMode === "mindmap" ? (
          <>
            Trait pointillé rouge = rattaché en base mais aucun lien réel trouvé dans le contenu. Bordure en
            pointillés = guide non publié. Passez en mode Force-directed pour voir tous les liens réels, y
            compris les liens transversaux inattendus (traits bleus).
          </>
        ) : (
          <>
            Tous les liens réels entre guides. Trait gris = correspond au rattachement déclaré en base. Trait
            bleu = lien réel qui ne correspond à aucun rattachement déclaré (transversal ou inattendu).
          </>
        )}
      </p>
    </div>
  );
}
