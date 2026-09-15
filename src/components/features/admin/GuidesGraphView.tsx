"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import {
  buildGuideLinkGraph,
  type GuideForGraph,
} from "@/lib/guides-link-graph";
import { computeGuideGraphLayout } from "@/lib/guides-graph-layout";
import type { GuideProduct, GuideSiloRole } from "@/types/guides";

// Onglet "Graphe" de l'admin des guides : visualise la structure hub -> piliers -> satellites
// a partir du rattachement voulu (parent_guide_id), et signale les ecarts avec le maillage
// REEL (liens presents dans `content`), calcules par buildGuideLinkGraph (src/lib/guides-link-graph.ts).
// Aucune nouvelle table : tout est recalcule a la volee a partir de `guides`.

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

interface GuideNodeData {
  title: string;
  slug: string;
  siloRole: GuideSiloRole;
  isPublished: boolean;
  externalCount: number;
  issueTypes: string[];
  [key: string]: unknown;
}

function GuideFlowNode({ data }: { data: GuideNodeData }) {
  const roleClass =
    data.siloRole === "hub"
      ? "bg-indigo-600 text-white border-indigo-700"
      : data.siloRole === "pilier"
        ? "bg-blue-50 text-blue-900 border-blue-300"
        : "bg-white text-zinc-700 border-zinc-200";
  const hasIssue = data.issueTypes.length > 0;
  return (
    <div
      className={`relative px-3 py-2 rounded-xl border-2 shadow-sm text-xs w-[170px] ${roleClass} ${
        hasIssue ? "ring-2 ring-red-400" : ""
      } ${!data.isPublished ? "opacity-60 border-dashed" : ""}`}
      title={data.issueTypes.map((t) => ISSUE_LABELS[t] || t).join("\n")}
    >
      <Handle type="target" position={Position.Top} />
      <p className="font-black truncate">{data.title}</p>
      <p className="truncate opacity-70">{data.slug}</p>
      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
        {data.externalCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
            {data.externalCount} ext.
          </span>
        )}
        {!data.isPublished && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">brouillon</span>
        )}
        {hasIssue && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-bold">
            {data.issueTypes.length} écart{data.issueTypes.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
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

  const positions = useMemo(() => computeGuideGraphLayout(graph.nodes), [graph.nodes]);
  const positionById = useMemo(() => new Map(positions.map((p) => [p.id, p])), [positions]);
  const rowById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  const issuesByGuideKey = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const issue of graph.issues) {
      const key = `${issue.product}/${issue.slug}`;
      const bucket = map.get(key) ?? [];
      bucket.push(issue.type);
      map.set(key, bucket);
    }
    return map;
  }, [graph.issues]);

  const flowNodes: Node[] = useMemo(
    () =>
      graph.nodes.map((n) => {
        const row = rowById.get(n.id);
        const pos = positionById.get(n.id) ?? { x: 0, y: 0 };
        const issueTypes = issuesByGuideKey.get(`${n.product}/${n.slug}`) ?? [];
        return {
          id: n.id,
          type: "guideNode",
          position: { x: pos.x, y: pos.y },
          data: {
            title: row?.title ?? n.slug,
            slug: n.slug,
            siloRole: n.siloRole,
            isPublished: row?.is_published ?? true,
            externalCount: n.externalLinks.length,
            issueTypes,
          } as GuideNodeData,
        };
      }),
    [graph.nodes, rowById, positionById, issuesByGuideKey]
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      graph.nodes
        .filter((n) => n.parentGuideId)
        .map((n) => {
          const mismatched = (issuesByGuideKey.get(`${n.product}/${n.slug}`) ?? []).includes(
            "declared_parent_not_linked"
          );
          return {
            id: `${n.parentGuideId}->${n.id}`,
            source: n.parentGuideId as string,
            target: n.id,
            style: mismatched
              ? { stroke: "#dc2626", strokeDasharray: "4 4" }
              : { stroke: "#a1a1aa" },
          };
        }),
    [graph.nodes, issuesByGuideKey]
  );

  const issueCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const issue of graph.issues) counts[issue.type] = (counts[issue.type] ?? 0) + 1;
    return counts;
  }, [graph.issues]);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Object.keys(issueCounts).length === 0 ? (
          <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
            Aucun écart détecté
          </span>
        ) : (
          Object.entries(issueCounts).map(([type, count]) => (
            <span key={type} className="text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-700 font-bold">
              {count} · {ISSUE_LABELS[type] || type}
            </span>
          ))
        )}
      </div>
      <div className="h-[70vh] rounded-2xl border border-zinc-200 overflow-hidden">
        <ReactFlow nodes={flowNodes} edges={flowEdges} nodeTypes={nodeTypes} fitView>
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      <p className="text-xs text-zinc-400">
        Trait pointillé rouge = rattaché en base mais aucun lien réel trouvé dans le contenu. Bordure en
        pointillés = guide non publié. Passer la souris sur un nœud avec écart(s) affiche le détail.
      </p>
    </div>
  );
}
