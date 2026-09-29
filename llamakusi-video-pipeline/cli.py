#!/usr/bin/env python3
"""CLI du pipeline vidéo LlamaKusi.

  python cli.py fetch-assets                 # polices + mascotte (une fois)
  python cli.py lint [--publish] [ids…]      # GATE 1 : contrôle des scripts
  python cli.py build short-03 --dry         # rendu complet SANS API (voix muette, timings estimés)
  python cli.py build short-03               # TTS → ASR → alignement → rendu
  python cli.py preview short-03             # planche contact des blocs
  python cli.py fetch-question contravention # cherche de vraies questions civiques
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from dataclasses import asdict
from pathlib import Path

from pipeline import align, assemble, assets, audio, config, lint, schema, supabase_source, timeline, tts

STAGES = ["tts", "asr", "align", "timeline", "render"]


def _sha(*parts: str) -> str:
    return hashlib.sha1("\x1f".join(parts).encode("utf-8")).hexdigest()


def cmd_fetch_assets(args) -> int:
    assets.fetch_assets()
    return 0


def cmd_lint(args) -> int:
    scripts = schema.load_all(config.SCRIPTS_DIR)
    if args.ids:
        scripts = [s for s in scripts if s.id in args.ids]
    issues = lint.lint_all(scripts, publish=args.publish)
    icons = {"error": "✗", "warn": "!", "todo": "·"}
    for i in issues:
        if args.quiet and i.level == "todo":
            continue
        print(f"  {icons[i.level]} [{i.script_id}] {i.message}")
    errors = sum(1 for i in issues if i.level == "error")
    print(f"\n{len(scripts)} script(s) · {errors} erreur(s) · "
          f"{sum(1 for i in issues if i.level == 'warn')} avertissement(s)")
    return 1 if errors else 0


def cmd_fetch_question(args) -> int:
    rows = supabase_source.fetch_questions(search=args.search, limit=args.limit)
    for r in rows:
        try:
            data = supabase_source.to_card_data(r)
            print(f"- {r['id']}  [{r['theme']}]\n    {data['question']}")
            for letter, c in zip("ABCD", data["choices"]):
                print(f"      {'→' if letter == data['correct'] else ' '} {letter}. {c}")
        except ValueError as exc:
            print(f"- {r['id']} : {exc}")
    print(f"\n{len(rows)} résultat(s). Copier l'id dans scripts/<id>.yaml → card.data.question_id")
    return 0


def cmd_build(args) -> int:
    script = schema.find_script(config.SCRIPTS_DIR, args.id)
    for i in lint.lint_script(script, publish=False):
        if i.level == "error":
            print(f"✗ lint : {i.message}")
            return 1
    bdir = config.BUILD_DIR / script.id
    bdir.mkdir(parents=True, exist_ok=True)
    until = STAGES.index(args.until)

    if args.placeholder_mascots:
        assets.make_placeholder_mascots()
    if not args.dry:
        supabase_source.resolve_cards(script)

    words = align.flatten_script(script)
    voice = bdir / "voice.wav"

    if args.dry:
        dur = align.estimate_duration(words)
        audio.make_silence(voice, dur)
        words = align.proportional_timings(words, dur)
        print(f"[dry] voix muette de {dur:.1f}s, timings proportionnels")
    else:
        text = tts.spoken_text(script)
        meta_path = bdir / "voice.meta.json"
        meta = {"sha": _sha(text, config.TTS_MODEL, config.TTS_VOICE, config.TTS_STYLE)}
        raw = bdir / "voice_raw.wav"
        cached = meta_path.exists() and json.loads(meta_path.read_text()) == meta and raw.exists()
        if args.force or not cached:
            print(f"[tts] {config.TTS_MODEL} / {config.TTS_VOICE} — {len(text.split())} mots")
            tts.synthesize(text, raw)
            meta_path.write_text(json.dumps(meta))
            (bdir / "words_asr.json").unlink(missing_ok=True)
            voice.unlink(missing_ok=True)
        if not voice.exists():
            audio.trim_silence(raw, voice)
        dur = audio.probe_duration(voice)
        print(f"[tts] durée voix : {dur:.2f}s")
        if until < STAGES.index("asr"):
            return 0

        if args.proportional:
            words = align.proportional_timings(words, dur)
            print("[asr] ignoré (--proportional) : timings estimés")
        else:
            asr_path = bdir / "words_asr.json"
            if args.force or not asr_path.exists():
                from pipeline import asr
                asr_path.write_text(json.dumps(asr.transcribe_words(voice), ensure_ascii=False, indent=1))
            asr_words = json.loads(asr_path.read_text())
            if until < STAGES.index("align"):
                return 0
            words, report = align.align_words(words, asr_words, dur)
            (bdir / "align_report.json").write_text(
                json.dumps(asdict(report), ensure_ascii=False, indent=1), encoding="utf-8")
            print(f"[align] couverture {report.coverage:.0%} · interpolés : {report.interpolated or '-'} "
                  f"· faibles : {report.weak or '-'}")
            if not report.ok:
                print("✗ alignement insuffisant (<90 %) : écouter voice.wav, ou relancer avec --proportional")
                return 2

    (bdir / "words.json").write_text(
        json.dumps([w.to_dict() for w in words], ensure_ascii=False, indent=1), encoding="utf-8")
    if until < STAGES.index("timeline"):
        return 0

    tl = timeline.build_timeline(script, words, dur, bdir)
    print(f"[timeline] {tl['duration']:.2f}s · " + " · ".join(
        f"{k}:{len(v)}" for k, v in tl["tracks"].items()))
    if until < STAGES.index("render"):
        return 0

    music = config.find_music()
    print(f"[music] {music if music else 'aucune'}")
    out = bdir / ("out.dry.mp4" if args.dry else "out.mp4")
    assemble.render(bdir, tl, out, music,
                    preset="veryfast" if args.dry else "medium")
    print(f"✓ {out}")
    print("  Garde-fou : regarder la vidéo EN ENTIER sur téléphone avant d'en générer une autre.")
    return 0


def cmd_preview(args) -> int:
    from PIL import Image
    bdir = config.BUILD_DIR / args.id
    tl = json.loads((bdir / "timeline.json").read_text())
    video = bdir / ("out.dry.mp4" if (bdir / "out.dry.mp4").exists() and not (bdir / "out.mp4").exists() else "out.mp4")
    frames = []
    for b in tl["blocks"]:
        t = min(tl["duration"] - 0.1, b["start"] + (b["end"] - b["start"]) * 0.6)
        png = bdir / f"prev_{b['id']}.png"
        audio.run(["ffmpeg", "-y", "-ss", f"{t:.3f}", "-i", str(video), "-frames:v", "1", str(png)])
        frames.append(Image.open(png).convert("RGB").resize((360, 640)))
    sheet = Image.new("RGB", (360 * len(frames), 640))
    for i, f in enumerate(frames):
        sheet.paste(f, (360 * i, 0))
    dst = bdir / "preview.jpg"
    sheet.save(dst, quality=88)
    print(f"✓ {dst}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("fetch-assets").set_defaults(fn=cmd_fetch_assets)

    p = sub.add_parser("lint")
    p.add_argument("ids", nargs="*")
    p.add_argument("--publish", action="store_true", help="règles de publication (claims vérifiées, status approved)")
    p.add_argument("--quiet", action="store_true", help="masque les rappels")
    p.set_defaults(fn=cmd_lint)

    p = sub.add_parser("fetch-question")
    p.add_argument("search")
    p.add_argument("--limit", type=int, default=10)
    p.set_defaults(fn=cmd_fetch_question)

    p = sub.add_parser("build")
    p.add_argument("id")
    p.add_argument("--until", choices=STAGES, default="render")
    p.add_argument("--dry", action="store_true", help="aucun appel API : voix muette + timings estimés")
    p.add_argument("--proportional", action="store_true", help="TTS réel mais timings estimés (sans ASR)")
    p.add_argument("--force", action="store_true", help="ignore le cache TTS/ASR")
    p.add_argument("--placeholder-mascots", action="store_true", help="silhouettes de test si assets absents")
    p.set_defaults(fn=cmd_build)

    p = sub.add_parser("preview")
    p.add_argument("id")
    p.set_defaults(fn=cmd_preview)

    args = ap.parse_args()
    try:
        return args.fn(args)
    except (FileNotFoundError, RuntimeError, subprocess.CalledProcessError) as exc:
        print(f"✗ {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
