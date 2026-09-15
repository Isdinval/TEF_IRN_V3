// Positionnement hierarchique simple pour l'onglet graphe (hub -> piliers -> satellites),
// a partir du rattachement voulu (parent_guide_id / GuideGraphNode.parentGuideId), pas des
// liens reels. Volontairement fait main plutot que d'ajouter dagre : la structure est un
// arbre a 3 niveaux fixes, un algorithme generique de layout de graphe serait une abstraction
// non necessaire ici.

import type { GuideGraphNode } from "@/lib/guides-link-graph";

export interface LayoutPosition {
  id: string;
  x: number;
  y: number;
}

const NODE_WIDTH = 190;
const NODE_GAP = 32;
const LEVEL_HEIGHT = 160;
const ORPHAN_ROW_GAP = 220;

function slotWidth(childCount: number): number {
  return Math.max(NODE_WIDTH, childCount * (NODE_WIDTH + NODE_GAP) - NODE_GAP);
}

/**
 * Calcule x/y pour chaque noeud. Les hubs sont au niveau 0, leurs piliers (parentGuideId ===
 * hub.id) au niveau 1, les satellites de chaque pilier au niveau 2. Tout noeud sans parent
 * valide dans la liste (orphelin, ou pilier/hub isole) est place dans une rangee a part sous
 * le reste, pour rester visible sans casser la hierarchie principale.
 */
export function computeGuideGraphLayout(nodes: GuideGraphNode[]): LayoutPosition[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childrenOf = new Map<string, GuideGraphNode[]>();
  for (const n of nodes) {
    if (n.parentGuideId && byId.has(n.parentGuideId)) {
      const bucket = childrenOf.get(n.parentGuideId) ?? [];
      bucket.push(n);
      childrenOf.set(n.parentGuideId, bucket);
    }
  }

  const hubs = nodes.filter((n) => n.siloRole === "hub");
  const positions: LayoutPosition[] = [];

  let cursorX = 0;
  for (const hub of hubs) {
    const piliers = (childrenOf.get(hub.id) ?? []).filter((n) => n.siloRole === "pilier");
    const pilierSlotWidths = piliers.map((p) => slotWidth((childrenOf.get(p.id) ?? []).length));
    const hubWidth = pilierSlotWidths.reduce((a, b) => a + b, 0) + Math.max(0, piliers.length - 1) * NODE_GAP;
    const hubStartX = cursorX;

    positions.push({ id: hub.id, x: hubStartX + hubWidth / 2, y: 0 });

    let pilierX = hubStartX;
    piliers.forEach((pilier, i) => {
      const width = pilierSlotWidths[i];
      positions.push({ id: pilier.id, x: pilierX + width / 2, y: LEVEL_HEIGHT });

      const satellites = (childrenOf.get(pilier.id) ?? []).filter((n) => n.siloRole === "satellite");
      let satX = pilierX;
      for (const sat of satellites) {
        positions.push({ id: sat.id, x: satX + NODE_WIDTH / 2, y: LEVEL_HEIGHT * 2 });
        satX += NODE_WIDTH + NODE_GAP;
      }

      pilierX += width + NODE_GAP;
    });

    cursorX = hubStartX + Math.max(hubWidth, NODE_WIDTH) + NODE_GAP * 3;
  }

  // Tout ce qui n'a pas ete positionne (orphelin publie, pilier sans hub valide, hub sans
  // enfant traite ci-dessus) va dans une rangee dediee, pour rester visible sans fausser la
  // hierarchie principale ci-dessus.
  const positioned = new Set(positions.map((p) => p.id));
  const leftovers = nodes.filter((n) => !positioned.has(n.id));
  const orphanY = LEVEL_HEIGHT * 2 + ORPHAN_ROW_GAP;
  let orphanX = 0;
  for (const n of leftovers) {
    positions.push({ id: n.id, x: orphanX + NODE_WIDTH / 2, y: orphanY });
    orphanX += NODE_WIDTH + NODE_GAP;
  }

  return positions;
}
