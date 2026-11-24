# Images de partage (OG) — LlamaKusi

Chaque page du sitemap a une image 1200×630 (carte de marque : fond constellation, titre, pastilles produit/niveau, mascotte), dans l'esprit des miniatures YouTube. Les aquarelles des guides (`image_url`) restent dans la page et le sitemap d'images, **pas** dans l'OG.

## Fonctionnement
- `src/lib/og/card.tsx` : `renderOgCard(spec)` → ImageResponse puis recompression PNG palette via `sharp` (≈ 80–100 Ko, WhatsApp coupe l'aperçu au-delà de ~300 Ko). Repli sur le PNG brut si `sharp` est absent.
- 3 mises en page (classique / gros plan / mascotte à gauche) et 23 mascottes, choisies par hash du slug : stable pour une page, variées entre pages.
- `src/lib/og/pages.ts` : textes des pages statiques. `data.ts` + `map.ts` : guides, leçons, parcours, centres (Supabase anonyme, `revalidate = 86400`).
- Un fichier `opengraph-image.tsx` par route ; le plus proche dans l'arborescence l'emporte, `src/app/opengraph-image.tsx` est le repli global. Ne plus déclarer `images` à la main dans `generateMetadata`.

## Régénérer les assets (mascottes + police embarquées en base64)
```
cd llamakusi-video-pipeline && python cli.py fetch-assets && cd ..
python scripts/og/build_og_assets.py
```

## Vérifier en production
```
node scripts/og/check-og.mjs https://llamakusi.com
```
Puis Facebook Sharing Debugger / LinkedIn Post Inspector pour purger le cache d'un lien déjà partagé.
