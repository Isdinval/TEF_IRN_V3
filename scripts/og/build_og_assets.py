"""Génère les ressources des images de partage (OG) à partir des assets de la pipeline vidéo :
mascottes (halo inclus, PNG palette) et police Montserrat Black (sous-ensemble latin), en modules TS base64
(src/lib/og/assets/*.ts) + registre src/lib/og/mascots.ts. À relancer seulement si les mascottes ou la police changent.

    cd llamakusi-video-pipeline && python cli.py fetch-assets && cd .. && python scripts/og/build_og_assets.py
"""
import base64, io, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PIPE = ROOT / "llamakusi-video-pipeline"
sys.path.insert(0, str(PIPE))
from PIL import Image                     # noqa: E402
from pipeline import config, thumbnail    # noqa: E402

OUT = ROOT / "src" / "lib" / "og" / "assets"
H = 480                                   # hauteur visible de la mascotte avant halo (réduite/agrandie en CSS)


def b64_module(name: str, mime: str, data: bytes) -> None:
    (OUT / f"{name}.ts").write_text(f'// Généré par scripts/og/build_og_assets.py — ne pas éditer.\nconst data = "data:{mime};base64,{base64.b64encode(data).decode()}";\nexport default data;\n', encoding="utf-8")


def mascots() -> list[dict]:
    entries = []
    for mood, count in config.MASCOT_COUNTS.items():
        for pose in range(1, count + 1):
            src = Image.open(config.MASCOT_DIR / f"{mood}_{pose}_transparent.webp").convert("RGBA")
            src = src.crop(src.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox())
            w = round(src.width * H / src.height)
            src = src.resize((w, H), Image.LANCZOS)
            tile, pad = thumbnail._mascot_fx(src)
            buf = io.BytesIO()
            tile.quantize(256, method=Image.Quantize.FASTOCTREE).save(buf, "PNG", optimize=True)
            b64_module(f"mascot-{mood}-{pose}", "image/png", buf.getvalue())
            entries.append({"mood": mood, "pose": pose, "w": w, "h": H, "tw": tile.width, "th": tile.height, "pad": pad, "kb": len(buf.getvalue()) // 1024})
    return entries


def font() -> None:
    from fontTools import subset
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
    f = instancer.instantiateVariableFont(TTFont(PIPE / "assets" / "fonts" / "Montserrat.ttf"), {"wght": 900})
    opts = subset.Options(); opts.layout_features = ["kern", "liga"]
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026, 0x2192, 0x00B7, 0x2022])
    sub.subset(f)
    buf = io.BytesIO(); f.save(buf)
    b64_module("font-montserrat-black", "font/ttf", buf.getvalue())


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    font()
    es = mascots()
    lines = ["// Généré par scripts/og/build_og_assets.py — ne pas éditer.", "export type OgMascot = { mood: string; pose: number; w: number; h: number; tw: number; th: number; pad: number; load: () => Promise<string> };",
             "// Ordre entrelacé (deux voisines n'ont jamais la même humeur), comme la rotation des miniatures de la pipeline vidéo.",
             "export const OG_MASCOTS: OgMascot[] = ["]
    pool = sorted(es, key=lambda e: (e["pose"], list(config.MASCOT_COUNTS).index(e["mood"])))
    for e in pool:
        lines.append(f'  {{ mood: "{e["mood"]}", pose: {e["pose"]}, w: {e["w"]}, h: {e["h"]}, tw: {e["tw"]}, th: {e["th"]}, pad: {e["pad"]}, load: () => import("./assets/mascot-{e["mood"]}-{e["pose"]}").then((m) => m.default) }},')
    lines.append("];")
    (ROOT / "src" / "lib" / "og" / "mascots.ts").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(len(es), "mascottes,", sum(e["kb"] for e in es), "Ko PNG au total, max", max(e["kb"] for e in es), "Ko")
