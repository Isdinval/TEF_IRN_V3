import { ImageResponse } from "next/og";

// Convention Next.js : ce fichier est auto-détecté et injecté dans les
// metadata `openGraph.images` / `twitter.images` de TOUTES les pages qui ne
// définissent pas explicitement leur propre `images`, ou qui n'ont pas leur
// propre fichier `opengraph-image.tsx` plus proche dans l'arborescence.
// Remplace le fichier statique `/og-image.png` qui n'existait pas.

export const runtime = "edge";
export const alt = "LlamaKusi — Coach IA TEF IRN & Examen civique";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "white",
            letterSpacing: "-0.02em",
          }}
        >
          LlamaKusi
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
            marginTop: 16,
          }}
        >
          Coach IA — TEF IRN & Examen civique
        </div>
      </div>
    ),
    { ...size }
  );
}
