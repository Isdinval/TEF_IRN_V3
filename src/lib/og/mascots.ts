// Généré par scripts/og/build_og_assets.py — ne pas éditer.
export type OgMascot = { mood: string; pose: number; w: number; h: number; tw: number; th: number; pad: number; load: () => Promise<string> };
// Ordre entrelacé (deux voisines n'ont jamais la même humeur), comme la rotation des miniatures de la pipeline vidéo.
export const OG_MASCOTS: OgMascot[] = [
  { mood: "perplexe", pose: 1, w: 293, h: 480, tw: 567, th: 754, pad: 137, load: () => import("./assets/mascot-perplexe-1").then((m) => m.default) },
  { mood: "reflechit", pose: 1, w: 287, h: 480, tw: 561, th: 754, pad: 137, load: () => import("./assets/mascot-reflechit-1").then((m) => m.default) },
  { mood: "victorieux", pose: 1, w: 308, h: 480, tw: 582, th: 754, pad: 137, load: () => import("./assets/mascot-victorieux-1").then((m) => m.default) },
  { mood: "neutre", pose: 1, w: 352, h: 480, tw: 626, th: 754, pad: 137, load: () => import("./assets/mascot-neutre-1").then((m) => m.default) },
  { mood: "perplexe", pose: 2, w: 251, h: 480, tw: 525, th: 754, pad: 137, load: () => import("./assets/mascot-perplexe-2").then((m) => m.default) },
  { mood: "reflechit", pose: 2, w: 280, h: 480, tw: 554, th: 754, pad: 137, load: () => import("./assets/mascot-reflechit-2").then((m) => m.default) },
  { mood: "victorieux", pose: 2, w: 370, h: 480, tw: 644, th: 754, pad: 137, load: () => import("./assets/mascot-victorieux-2").then((m) => m.default) },
  { mood: "neutre", pose: 2, w: 332, h: 480, tw: 606, th: 754, pad: 137, load: () => import("./assets/mascot-neutre-2").then((m) => m.default) },
  { mood: "perplexe", pose: 3, w: 285, h: 480, tw: 559, th: 754, pad: 137, load: () => import("./assets/mascot-perplexe-3").then((m) => m.default) },
  { mood: "reflechit", pose: 3, w: 343, h: 480, tw: 617, th: 754, pad: 137, load: () => import("./assets/mascot-reflechit-3").then((m) => m.default) },
  { mood: "victorieux", pose: 3, w: 310, h: 480, tw: 584, th: 754, pad: 137, load: () => import("./assets/mascot-victorieux-3").then((m) => m.default) },
  { mood: "neutre", pose: 3, w: 375, h: 480, tw: 649, th: 754, pad: 137, load: () => import("./assets/mascot-neutre-3").then((m) => m.default) },
  { mood: "perplexe", pose: 4, w: 345, h: 480, tw: 619, th: 754, pad: 137, load: () => import("./assets/mascot-perplexe-4").then((m) => m.default) },
  { mood: "reflechit", pose: 4, w: 374, h: 480, tw: 648, th: 754, pad: 137, load: () => import("./assets/mascot-reflechit-4").then((m) => m.default) },
  { mood: "victorieux", pose: 4, w: 371, h: 480, tw: 645, th: 754, pad: 137, load: () => import("./assets/mascot-victorieux-4").then((m) => m.default) },
  { mood: "neutre", pose: 4, w: 319, h: 480, tw: 593, th: 754, pad: 137, load: () => import("./assets/mascot-neutre-4").then((m) => m.default) },
  { mood: "perplexe", pose: 5, w: 356, h: 480, tw: 630, th: 754, pad: 137, load: () => import("./assets/mascot-perplexe-5").then((m) => m.default) },
  { mood: "reflechit", pose: 5, w: 344, h: 480, tw: 618, th: 754, pad: 137, load: () => import("./assets/mascot-reflechit-5").then((m) => m.default) },
  { mood: "victorieux", pose: 5, w: 327, h: 480, tw: 601, th: 754, pad: 137, load: () => import("./assets/mascot-victorieux-5").then((m) => m.default) },
  { mood: "neutre", pose: 5, w: 290, h: 480, tw: 564, th: 754, pad: 137, load: () => import("./assets/mascot-neutre-5").then((m) => m.default) },
  { mood: "perplexe", pose: 6, w: 235, h: 480, tw: 509, th: 754, pad: 137, load: () => import("./assets/mascot-perplexe-6").then((m) => m.default) },
  { mood: "reflechit", pose: 6, w: 288, h: 480, tw: 562, th: 754, pad: 137, load: () => import("./assets/mascot-reflechit-6").then((m) => m.default) },
  { mood: "victorieux", pose: 6, w: 333, h: 480, tw: 607, th: 754, pad: 137, load: () => import("./assets/mascot-victorieux-6").then((m) => m.default) },
];
