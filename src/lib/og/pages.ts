import type { OgSpec } from "./card";

/** Pages statiques du sitemap : texte court écrit pour l'image (pas le titre SEO, trop long). Pages légales : carte générique de la section. */
export const OG_PAGES = {
  home: { title: "Réussis ton TEF IRN avec ton coach IA", kicker: "TEF IRN · COACH IA", badge: "A2 → B2", keyword: "TEF IRN", seed: "tef-irn" },
  civique: { title: "Prépare l'examen civique : 40 questions", kicker: "EXAMEN CIVIQUE", keyword: "civique", seed: "examen-civique", civic: true },
  eligibilite: { title: "Examen civique : suis-je concerné ?", kicker: "EXAMEN CIVIQUE · TEST", keyword: "concerné", seed: "examen-civique/eligibilite", civic: true },
  livret: { title: "Livret du citoyen : les thèmes à réviser", kicker: "EXAMEN CIVIQUE · LIVRET", keyword: "Livret", seed: "examen-civique/livret", civic: true },
  parcourir: { title: "Parcourir toutes les questions du civique", kicker: "EXAMEN CIVIQUE · QUESTIONS", keyword: "questions", seed: "examen-civique/parcourir", civic: true },
  guidesCivique: { title: "Guides de l'examen civique", kicker: "EXAMEN CIVIQUE · GUIDES", keyword: "Guides", seed: "examen-civique/guides", civic: true },
  centres: { title: "Centres d'examen civique agréés en France", kicker: "EXAMEN CIVIQUE · CENTRES", keyword: "Centres", seed: "examen-civique/centres", civic: true },
  lessons: { title: "Leçons de français pour le TEF IRN", kicker: "TEF IRN · LEÇONS", badge: "A2 → B2", keyword: "Leçons", seed: "tef-irn/lessons" },
  guides: { title: "Guides TEF IRN : tout comprendre", kicker: "TEF IRN · GUIDES", keyword: "Guides", seed: "tef-irn/guides" },
  parcours: { title: "Parcours guidés pour progresser vite", kicker: "TEF IRN · PARCOURS", keyword: "Parcours", seed: "tef-irn/parcours" },
  histoire: { title: "Notre histoire : pourquoi LlamaKusi", kicker: "LLAMAKUSI", keyword: "histoire", seed: "tef-irn/notre-histoire" },
} satisfies Record<string, OgSpec>;
