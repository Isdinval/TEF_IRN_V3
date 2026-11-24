import { ImageResponse } from "next/og";
import { OG_MASCOTS } from "./mascots";
import fontData from "./assets/font-montserrat-black";

/**
 * Carte de partage (OG image) 1200×630 — même univers que les miniatures YouTube de la chaîne
 * (fond sombre « constellation », mascotte qui change selon la page, titre en gras avec mot-clé doré, cadre or → rose).
 * 3 mises en page (classique / gros plan / mascotte à gauche) choisies par une empreinte du slug : stable, mais variée d'une page à l'autre.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";
export const OG_ALT = "LlamaKusi — Coach IA TEF IRN & Examen civique";

export type OgSpec = {
  title: string;
  kicker: string;                      // pastille produit : « TEF IRN · GUIDE »…
  badge?: string | null;               // pastille dorée : niveau (B1, A2-B1…)
  keyword?: string | null;             // mot-clé principal → mots dorés dans le titre
  seed: string;                        // slug (ou chemin) : fixe mascotte, mise en page et fond
  civic?: boolean;                     // point du logo vert (Examen civique) au lieu de rose
};

const GOLD = "#E0B955", GOLD_SOFT = "#E8CE8A", PINK = "#E08AA8", WHITE = "#F7F3E6", BG = "#0A0D0B";
const W = OG_SIZE.width, H = OG_SIZE.height;
const SAFE = 40;                       // marge mini mascotte ↔ bord (cadre compris)

export function hash(s: string): number {   // FNV-1a 32 bits
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

function rng(seed: number) {                // mulberry32
  let a = seed;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

/** Fond constellation vectoriel (noir chaud, une pointe de violet, polygones fins, points lumineux), unique par seed. */
function backgroundUri(seed: number, glowX: number): string {
  const r = rng(seed);
  const pts = Array.from({ length: 26 }, () => [r() * W, r() * H] as const);
  let lines = "", dots = "", polys = "";
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
      if (d < 190) lines += `<line x1="${pts[i][0].toFixed(0)}" y1="${pts[i][1].toFixed(0)}" x2="${pts[j][0].toFixed(0)}" y2="${pts[j][1].toFixed(0)}" stroke="#E8CE8A" stroke-opacity="${(0.22 * (1 - d / 190)).toFixed(2)}" stroke-width="1.2"/>`;
    }
    dots += `<circle cx="${pts[i][0].toFixed(0)}" cy="${pts[i][1].toFixed(0)}" r="${(1.2 + r() * 2.2).toFixed(1)}" fill="#F7F3E6" fill-opacity="${(0.35 + r() * 0.5).toFixed(2)}"/>`;
  }
  for (let k = 0; k < 7; k++) {
    const cx = r() * W, cy = r() * H, s = 70 + r() * 150, n = 3 + Math.floor(r() * 3), rot = r() * 6.28;
    const p = Array.from({ length: n }, (_, i) => `${(cx + s * Math.cos(rot + (i * 6.28) / n)).toFixed(0)},${(cy + s * Math.sin(rot + (i * 6.28) / n)).toFixed(0)}`).join(" ");
    polys += `<polygon points="${p}" fill="none" stroke="${k % 2 ? "#E08AA8" : "#E8CE8A"}" stroke-opacity="0.16" stroke-width="1.5"/>`;
  }
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>
<radialGradient id="g" cx="${glowX / W}" cy="0.62" r="0.55"><stop offset="0" stop-color="#E0B955" stop-opacity="0.20"/><stop offset="0.5" stop-color="#8E5A9E" stop-opacity="0.10"/><stop offset="1" stop-color="#0A0D0B" stop-opacity="0"/></radialGradient></defs>
<rect width="${W}" height="${H}" fill="${BG}"/><rect width="${W}" height="${H}" fill="url(#g)"/>${polys}${lines}${dots}</svg>`);
}

const FRAME_URI = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="f" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${GOLD_SOFT}"/><stop offset="1" stop-color="${PINK}"/></linearGradient></defs><rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="28" fill="none" stroke="url(#f)" stroke-width="7"/></svg>`);
const BAR_URI = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="170" height="9"><defs><linearGradient id="b" x1="0" x2="1"><stop offset="0" stop-color="${GOLD_SOFT}"/><stop offset="1" stop-color="${PINK}"/></linearGradient></defs><rect width="170" height="9" rx="4" fill="url(#b)"/></svg>`);

/** Titre court pour l'image : sans suffixe de marque, ≤ 60 caractères (coupé au mot), en majuscules. */
export function cleanTitle(raw: string): string {
  let t = raw.replace(/\s*[|–—-]\s*LlamaKusi.*$/i, "").replace(/\s+/g, " ").trim();
  if (t.length > 60) {
    // « Sujet : sous-titre » → on garde le sujet ; « Parcours A1 · Vrai titre » → on saute le préfixe court.
    const parts = t.split(/\s[:·]\s/);
    if (parts.length > 1) t = parts[0].length < 18 ? parts[1] : parts[0];
    if (t.length > 60) t = t.slice(0, 60).replace(/\s+\S*$/, "") + "…";
  }
  return t.toLocaleUpperCase("fr-FR");
}

function fontSize(t: string, textW: number): number {
  const n = t.length;
  const base = n <= 24 ? 92 : n <= 36 ? 80 : n <= 48 ? 70 : 62;
  return Math.round(base * Math.min(1, textW / 700));
}

/** Mots dorés : le mot-clé principal s'il figure dans le titre (3 mots max), sinon le premier chiffre/niveau. */
export function goldIndexes(words: string[], keyword?: string | null): Set<number> {
  const norm = (s: string) => s.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  const key = new Set((keyword || "").split(/\s+/).map(norm).filter((k) => k.length >= 4 || /\d/.test(k)));
  const out = new Set<number>();
  words.forEach((w, i) => { if (out.size < 3 && key.has(norm(w)) && (out.size === 0 || out.has(i - 1))) out.add(i); });
  if (!out.size) { const i = words.findIndex((w) => /^(A1|A2|B1|B2|C1|C2|\d)/i.test(w.replace(/[^\p{L}\p{N}]/gu, ""))); if (i >= 0) out.add(i); }
  return out;
}

const STYLES = [
  { name: "classique", textX: 76, textW: 700, mx: 965, mh: 450, bottom: 596 },
  { name: "gros plan", textX: 76, textW: 650, mx: 985, mh: 540, bottom: 600 },
  { name: "mascotte à gauche", textX: 470, textW: 660, mx: 235, mh: 470, bottom: 596 },
];

export async function renderOgCard(spec: OgSpec): Promise<Response> {
  const h = hash(spec.seed);
  const st = STYLES[h % STYLES.length];
  const m = OG_MASCOTS[Math.floor(h / 3) % OG_MASCOTS.length];
  // poses larges (coffre, drapeau…) : largeur plafonnée à 36 % de l'image, et toujours à SAFE px du bord
  const half = Math.min(st.mx - SAFE, W - SAFE - st.mx);
  const vh = Math.min(st.mh, st.bottom - SAFE, Math.round((m.h * 0.36 * W) / m.w), Math.round((m.h * 2 * half) / m.w));
  const k = vh / m.h, tw = Math.round(m.tw * k), th = Math.round(m.th * k), pad = m.pad * k;
  const mascot = await m.load();

  const title = cleanTitle(spec.title);
  const words = title.split(" ");
  const gold = goldIndexes(words, spec.keyword);
  const fs = fontSize(title, st.textW);

  const pill = { display: "flex", alignItems: "center", fontSize: 22, fontWeight: 900, letterSpacing: 3, padding: "9px 22px", borderRadius: 999 } as const;

  const raw = new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", background: BG, fontFamily: "Montserrat" }}>
        {/* eslint-disable @next/next/no-img-element */}
        <img src={backgroundUri(hash(spec.seed + "bg"), st.mx)} width={W} height={H} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
        <img src={mascot} width={tw} height={th} alt="" style={{ position: "absolute", left: Math.round(st.mx - tw / 2), top: Math.round(st.bottom - th + pad) }} />
        <div style={{ position: "absolute", left: st.textX, top: 0, width: st.textW, height: H, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 26 }}>
            <div style={{ ...pill, color: WHITE, border: `2.5px solid ${GOLD}`, background: "rgba(0,0,0,0.4)" }}>{spec.kicker}</div>
            {spec.badge ? <div style={{ ...pill, color: BG, background: GOLD, marginLeft: 14 }}>{spec.badge}</div> : null}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", color: WHITE, fontSize: fs, lineHeight: 1.08, fontWeight: 900, textShadow: "0 4px 16px rgba(0,0,0,0.85)" }}>
            {words.map((w, i) => (
              <span key={i} style={{ color: gold.has(i) ? GOLD : WHITE, marginRight: Math.round(fs * 0.26) }}>{w}</span>
            ))}
          </div>
          <img src={BAR_URI} width={170} height={9} alt="" style={{ marginTop: 28 }} />
        </div>
        <div style={{ position: "absolute", left: 64, top: 46, display: "flex", alignItems: "center", color: WHITE, fontSize: 26, fontWeight: 900, letterSpacing: 4 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: spec.civic ? "#5BD68A" : PINK, marginRight: 12 }} />
          LLAMAKUSI
        </div>
        <img src={FRAME_URI} width={W} height={H} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: "Montserrat", data: await (await fetch(fontData)).arrayBuffer(), weight: 900, style: "normal" }] }
  );
  return compress(raw);
}

/** PNG 32 bits ≈ 350–430 Ko → PNG palette ≈ 60–90 Ko (WhatsApp ignore l'aperçu au-delà de ~300 Ko). Repli : PNG brut si sharp est absent. */
async function compress(raw: Response): Promise<Response> {
  const headers = new Headers(raw.headers);
  try {
    const sharp = (await import("sharp")).default;
    const out = await sharp(Buffer.from(await raw.clone().arrayBuffer())).png({ palette: true, quality: 85, effort: 7 }).toBuffer();
    headers.set("content-length", String(out.length));
    return new Response(new Uint8Array(out), { headers });
  } catch {
    return raw;
  }
}

