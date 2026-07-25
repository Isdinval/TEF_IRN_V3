import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase-server";

export const runtime = "edge";
export const alt = "Centres d'examen civique agréés en France | LlamaKusi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("centres_examen_civique")
    .select("*", { count: "exact", head: true })
    .eq("actif", true);

  const centresCount = count ?? 248; // fallback si la requête échoue au build

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
            fontSize: 120,
            fontWeight: 900,
            color: "white",
            lineHeight: 1,
          }}
        >
          {centresCount}
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "white",
            marginTop: 8,
          }}
        >
          centres d&apos;examen civique agréés
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 500,
            color: "rgba(255,255,255,0.8)",
            marginTop: 20,
          }}
        >
          Naturalisation · Carte de résident · Carte de séjour pluriannuelle
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "white",
            marginTop: 40,
            letterSpacing: "-0.02em",
          }}
        >
          LlamaKusi
        </div>
      </div>
    ),
    { ...size }
  );
}
