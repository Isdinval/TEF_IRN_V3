// Positionnement en mindmap radial pour l'onglet graphe (hub au centre, piliers disposes en
// cercle autour, satellites disposes en arc autour de leur pilier), a partir du rattachement
// voulu (parent_guide_id / GuideGraphNode.parentGuideId), pas des liens reels. Fait main (pas
// de dependance de layout de graphe type dagre/elk) : c'est un arbre a 3 niveaux fixes avec une
// disposition radiale simple, un algorithme generique serait une abstraction non necessaire.
//
// computeGuideForceLayout (plus bas) est le layout alternatif "force-directed", lui base sur
// TOUS les liens reels (pas seulement parent_guide_id) via d3-force : utile pour reperer les
// liens transverses inattendus (un satellite qui linke un satellite d'un autre pilier) que la
// hierarchie stricte de la mindmap masque puisqu'elle ne dessine que les aretes parent->enfant.

import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
} from "d3-force";
import type { GuideGraphNode } from "@/lib/guides-link-graph";

export interface MindmapPosition {
  id: string;
  x: number;
  y: number;
}

const HUB_TO_PILIER_RADIUS = 420;
const BASE_SATELLITE_RADIUS = 700;
// Espacement angulaire cible entre deux satellites voisins, a la distance ou ils sont places
// (largeur de noeud + marge) - sert a calculer le rayon necessaire pour ne pas les superposer.
const NODE_ANGULAR_SPACING = 260;
const ORPHAN_RADIUS = 1150;

/**
 * Calcule x/y pour chaque noeud, en mindmap radial. Les hubs sont au centre (repartis sur une
 * grille si plusieurs, cas non observe aujourd'hui). Chaque pilier recoit une part de cercle
 * (en radians) proportionnelle a son nombre de satellites, pour eviter qu'un pilier a 20
 * satellites n'empiete sur son voisin a 2. Le rayon des satellites d'un pilier s'agrandit si
 * necessaire pour garder assez d'espace angulaire entre eux. Tout noeud sans parent valide dans
 * la liste (orphelin, pilier/hub isole) est place sur un cercle exterieur dedie.
 */
export function computeGuideMindmapLayout(nodes: GuideGraphNode[]): MindmapPosition[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childrenOf = new Map<string, GuideGraphNode[]>();
  for (const n of nodes) {
    if (n.parentGuideId && byId.has(n.parentGuideId)) {
      const bucket = childrenOf.get(n.parentGuideId) ?? [];
      bucket.push(n);
      childrenOf.set(n.parentGuideId, bucket);
    }
  }

  const positions: MindmapPosition[] = [];
  const hubs = nodes.filter((n) => n.siloRole === "hub");

  hubs.forEach((hub, hubIndex) => {
    // Plusieurs hubs (non observe aujourd'hui, un seul existe) : centres espaces sur une ligne
    // pour ne pas se superposer, chacun avec son propre eventail de piliers/satellites.
    const center = { x: hubIndex * 3000, y: 0 };
    positions.push({ id: hub.id, x: center.x, y: center.y });

    const piliers = (childrenOf.get(hub.id) ?? []).filter((n) => n.siloRole === "pilier");
    if (piliers.length === 0) return;

    const weights = piliers.map((p) => Math.max(1, (childrenOf.get(p.id) ?? []).length));
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    let angleCursor = -Math.PI / 2; // depart en haut, sens horaire
    piliers.forEach((pilier, i) => {
      const sliceAngle = (2 * Math.PI * weights[i]) / totalWeight;
      const pilierAngle = angleCursor + sliceAngle / 2;

      positions.push({
        id: pilier.id,
        x: center.x + HUB_TO_PILIER_RADIUS * Math.cos(pilierAngle),
        y: center.y + HUB_TO_PILIER_RADIUS * Math.sin(pilierAngle),
      });

      const satellites = (childrenOf.get(pilier.id) ?? []).filter((n) => n.siloRole === "satellite");
      if (satellites.length > 0) {
        const satArcAngle = sliceAngle * 0.85; // marge pour ne pas toucher le pilier voisin
        const radius = Math.max(
          BASE_SATELLITE_RADIUS,
          (satellites.length * NODE_ANGULAR_SPACING) / Math.max(satArcAngle, 0.15)
        );
        satellites.forEach((sat, j) => {
          const t = satellites.length === 1 ? 0.5 : j / (satellites.length - 1);
          const satAngle = pilierAngle - satArcAngle / 2 + t * satArcAngle;
          positions.push({
            id: sat.id,
            x: center.x + radius * Math.cos(satAngle),
            y: center.y + radius * Math.sin(satAngle),
          });
        });
      }

      angleCursor += sliceAngle;
    });
  });

  // Orphelins / guides sans parent valide : cercle exterieur dedie, pour rester visibles sans
  // fausser la disposition radiale principale.
  const positioned = new Set(positions.map((p) => p.id));
  const leftovers = nodes.filter((n) => !positioned.has(n.id));
  leftovers.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, leftovers.length);
    positions.push({ id: n.id, x: ORPHAN_RADIUS * Math.cos(angle), y: ORPHAN_RADIUS * Math.sin(angle) });
  });

  return positions;
}

const FORCE_TICKS = 300;
const FORCE_LINK_DISTANCE = 220;
const FORCE_CHARGE_STRENGTH = -350;
const FORCE_COLLIDE_RADIUS = 130;

/**
 * Layout force-directed a partir de TOUS les liens reels (pas seulement le rattachement voulu) :
 * chaque paire {source, target} d'ids de noeuds tire les deux noeuds l'un vers l'autre, une
 * repulsion generale les ecarte, une collision empeche le chevauchement. La simulation est
 * executee de facon synchrone (pas d'animation continue en React) pendant un nombre fixe de
 * ticks, suffisant pour converger sur les tailles de graphe actuelles (~150 noeuds) sans avoir a
 * gerer une boucle de rendu.
 */
interface ForceSimNode extends SimulationNodeDatum {
  id: string;
}

export function computeGuideForceLayout(
  nodes: GuideGraphNode[],
  edges: { source: string; target: string }[]
): MindmapPosition[] {
  const simNodes: ForceSimNode[] = nodes.map((n) => ({ id: n.id, x: 0, y: 0 }));

  forceSimulation(simNodes)
    .force("charge", forceManyBody().strength(FORCE_CHARGE_STRENGTH))
    .force(
      "link",
      forceLink<ForceSimNode, { source: string; target: string }>(edges)
        .id((d) => d.id)
        .distance(FORCE_LINK_DISTANCE)
    )
    .force("center", forceCenter(0, 0))
    .force("collide", forceCollide(FORCE_COLLIDE_RADIUS))
    .stop()
    .tick(FORCE_TICKS);

  return simNodes.map((n) => ({ id: n.id, x: n.x ?? 0, y: n.y ?? 0 }));
}
