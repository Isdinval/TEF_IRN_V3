#!/usr/bin/env python3
"""CLI du pipeline vidéo LlamaKusi.

  python cli.py fetch-assets                 # polices + mascotte (une fois)
  python cli.py lint [--publish] [ids…]      # GATE 1 : contrôle des scripts
  python cli.py approve                      # GATE 1 : approuve les drafts déjà propres en lint --publish
  python cli.py approve short-01 --force     # force un id précis malgré des erreurs restantes (relecture manuelle d'abord)
  python cli.py build short-03 --dry         # rendu complet SANS API (voix muette, timings estimés)
  python cli.py build short-03               # TTS → ASR → alignement → rendu
  python cli.py studio --all                 # studio.txt (titre, description, tags) pour YouTube Studio
  python cli.py week                         # TOUTES les vidéos de la semaine (scripts `approved` pas encore générés)
  python cli.py preview short-03             # planche contact des blocs
  python cli.py fetch-question contravention # cherche de vraies questions civiques
  python cli.py subs short-03 [--langs ar,en] # .srt (fr + traductions Gemini) depuis build/<id>/words.json
  python cli.py publish short-03 --dry       # aperçu des textes ; puis --confirm-public = publication PUBLIQUE (YouTube, Facebook, Instagram)
  python cli.py publish-auth youtube         # une fois : autorisation OAuth YouTube
  python cli.py list                         # état de tous les scripts
  python cli.py new short-06 --pillar D      # crée un squelette de script à remplir
Documentation complète : DOCUMENTATION.md
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from dataclasses import asdict
from datetime import date, timedelta
from pathlib import Path

from pipeline import (align, assemble, assets, audio, background, config, lint, schema, subtitles,
                      supabase_source, timeline, tts, voice as voice_mod)
from pipeline import chapters as chapters_mod
from pipeline import thumbnail as thumbnail_mod
from pipeline import publish as publish_mod

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


def _write_status(script_id: str, status: str) -> bool:
    """Édite `status:` dans scripts/<id>.yaml en place (seule la valeur change, commentaires/mise en page gardés)."""
    path = config.SCRIPTS_DIR / f"{script_id}.yaml"
    text = path.read_text(encoding="utf-8")
    new_text = re.sub(r"(?m)^status:\s*\S+", f"status: {status}", text, count=1)
    if new_text == text:
        return False
    path.write_text(new_text, encoding="utf-8")
    return True


def cmd_approve(args) -> int:
    """GATE 1 : passe des scripts `draft` en `status: approved`. Reste une validation humaine, pas une formalité —
    par défaut (sans ids), seuls les drafts qui ne lèvent plus AUCUNE erreur `lint --publish` (hors le statut
    lui-même) sont approuvés : ça ne couvre que la relecture déjà automatisable (claims sourcées, cartes non
    `draft`…), pas le visionnage réel. Des ids explicites + --force forcent l'approbation malgré des erreurs
    restantes — à ne faire qu'après avoir vraiment relu/regardé le script, jamais pour « gagner du temps »."""
    scripts = schema.load_all(config.SCRIPTS_DIR)
    if args.ids:
        unknown = set(args.ids) - {s.id for s in scripts}
        if unknown:
            print(f"✗ id(s) introuvable(s) : {', '.join(sorted(unknown))}")
            return 1
        targets = [s for s in scripts if s.id in args.ids]
    else:
        targets = [s for s in scripts if s.status == "draft"]
    already = [s.id for s in targets if s.status == "approved"]
    targets = [s for s in targets if s.status != "approved"]
    if not targets:
        print("✗ aucun script draft à approuver" if not already else "· déjà tous approved")
        return 1 if not already else 0

    issues_by_id: dict[str, list] = {}
    for issue in lint.lint_all(targets, publish=True):
        issues_by_id.setdefault(issue.script_id, []).append(issue)

    approved, skipped = [], []
    for s in targets:
        blocking = [i for i in issues_by_id.get(s.id, [])
                    if i.level == "error" and "status !=" not in i.message]
        if blocking and not args.force:
            skipped.append((s.id, blocking))
            continue
        if _write_status(s.id, "approved"):
            approved.append(s.id)
        else:
            skipped.append((s.id, [lint.Issue("error", s.id, "champ `status:` introuvable dans le fichier")]))

    for sid in approved:
        print(f"✓ {sid} → approved")
    for sid in already:
        print(f"· {sid} déjà approved")
    for sid, issues in skipped:
        detail = " ; ".join(i.message for i in issues[:2]) + ("…" if len(issues) > 2 else "")
        print(f"✗ {sid} ignoré ({len(issues)} erreur(s) restante(s)) : {detail}")
    if skipped and not args.force:
        print("  (python cli.py approve <id> --force pour forcer malgré ces erreurs — après relecture manuelle réelle, pas avant)")
    return 0 if approved or (already and not skipped) else 1


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
    config.use_profile(script.format)          # 1080×1920 (short) ou 1920×1080 (long)
    for i in lint.lint_script(script, publish=False):
        if i.level == "error":
            print(f"✗ lint : {i.message}")
            return 1
    bdir = config.build_dir(script)
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
    elif script.format == "long":
        # Vidéo longue : TTS + ASR PAR SEGMENT (cache par segment), voix concaténée, timings déjà alignés.
        _, dur, report, _segs = voice_mod.build_voice(
            script, words, bdir, use_asr=not args.proportional and until >= STAGES.index("asr"), force=args.force)
        print(f"[voix] durée totale : {dur:.2f}s")
        if until < STAGES.index("align"):
            return 0
        if not args.proportional:
            (bdir / "align_report.json").write_text(
                json.dumps(asdict(report), ensure_ascii=False, indent=1), encoding="utf-8")
            print(f"[align] couverture {report.coverage:.0%} · interpolés : {len(report.interpolated) or '-'} "
                  f"· faibles : {len(report.weak) or '-'}")
            if not report.ok:
                print("✗ alignement insuffisant (<90 %) : voir build/<id>/voice_segments.json puis écouter le segment fautif")
                return 2
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
    chs = chapters_mod.extract(script, tl["blocks"], tl["duration"])
    if chs:
        (bdir / "chapters.txt").write_text(chapters_mod.to_text(chs), encoding="utf-8")
        print(f"[chapitres] {len(chs)} → {bdir / 'chapters.txt'} (à coller dans la description YouTube)")
        for msg in chapters_mod.problems(chs, script.blocks[0].id):
            print(f"  ⚠ {msg}")
    if until < STAGES.index("render"):
        return 0

    music = config.find_music()
    print(f"[music] {music if music else 'aucune'}")
    bg, bg_loop, bg_period = None, False, None
    custom = args.background or script.background
    if args.no_bg:
        pass
    elif custom:
        src = config.resolve_background(custom)
        print(f"[fond] vidéo personnalisée : {src}")
        bg, bg_loop = background.from_file(src, bdir, tl["duration"])
    elif (default := config.resolve_default_background(script.format, script.id)):
        print(f"[fond] boucle par défaut ({script.format}) : {default.name}")
        bg, bg_dur = background.prepare_loop(default)
        bg_loop = True
        bg_period = bg_dur if script.format == "short" else None   # Short : raccord exact fin → début
    else:
        print("  [fond] généré : constellation géométrique (BG_USE_LOOPS=1 : boucles de assets/backgrounds/ ; BG_STYLE=halo : anciens halos)")
        print("[fond] génération du fond animé (~2 min la première fois, puis en cache)…")
        bg = background.generate(bdir, script.accent, tl["duration"], seed=script.id, voice=bdir / "voice.wav",
                                 scenes=[b["start"] for b in tl["blocks"]])
        bg_loop = background.is_loop(tl["duration"])
    out = bdir / ("out.dry.mp4" if args.dry else "out.mp4")
    assemble.render(bdir, tl, out, music,
                    preset="veryfast" if args.dry else "medium", background=bg,
                    loop_background=bg_loop, bg_period=bg_period)
    print(f"✓ {out}")
    print(f"✓ {thumbnail_mod.save(script, bdir)} (miniature)")
    print(f"✓ {publish_mod.studio_file(script, bdir, publish_slot=getattr(args, 'publish_slot', None))} "
          f"(titre, description, tags pour YouTube Studio)")
    if not args.no_preview:
        _social_previews(out, script.format, bdir, tl["duration"])
    print("  Garde-fou : regarder la vidéo EN ENTIER sur téléphone avant d'en générer une autre.")
    return 0


def _social_previews(video: Path, fmt: str, bdir: Path, duration: float) -> None:
    """UNE image d'aperçu (pas de vidéo en plus) : une image de la vidéo à ~40 % avec la maquette de chaque réseau
    (short : YouTube, TikTok, Instagram ; long : YouTube). L'ouvre sous Windows."""
    import ui_preview
    plats = ui_preview.PLATFORMS if fmt == "short" else ("youtube",)
    frame, out = bdir / "preview_frame.png", bdir / "preview_reseaux.png"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{duration * 0.4:.2f}", "-i", str(video),
                    "-frames:v", "1", str(frame)], check=True)
    ui_preview.contact_sheet(frame, plats, out, height=960 if fmt == "short" else 540)
    print(f"✓ {out}")
    if hasattr(os, "startfile"):
        os.startfile(out)


_JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
_WEEKEND_HOUR = "11h00"   # créneau unique week-end : best practice 2026, pic plutôt en matinée/début d'après-midi
                          # le week-end (audience qui se lève plus tard), pas le soir comme en semaine


def _lot_order(scripts: list) -> list:
    """Ordre de publication voulu : les Shorts dans leur ordre existant, puis le(s) Long en dernier — PAS l'ordre
    alphabétique des fichiers (`long-*` passerait sinon toujours avant `short-*`)."""
    return [s for s in scripts if s.format != "long"] + [s for s in scripts if s.format == "long"]


def _parse_start(text: str) -> date:
    """`--start` : JJ/MM, JJ/MM/AAAA ou AAAA-MM-JJ. Sans année, l'année en cours (suivante si la date est passée)."""
    t = text.strip()
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", t):
        return date.fromisoformat(t)
    m = re.fullmatch(r"(\d{1,2})/(\d{1,2})(?:/(\d{4}))?", t)
    if not m:
        raise argparse.ArgumentTypeError(f"date « {text} » invalide : attendu JJ/MM, JJ/MM/AAAA ou AAAA-MM-JJ")
    day, month, year = int(m[1]), int(m[2]), m[3]
    today = date.today()
    try:
        d = date(int(year) if year else today.year, month, day)
        if not year and d < today:
            d = date(today.year + 1, month, day)
    except ValueError:
        raise argparse.ArgumentTypeError(f"date « {text} » invalide")
    return d


def _publish_slot(position: int, start: date | None = None) -> str:
    """Date + heure de publication prévue pour le n-ième script du lot (1-based) : `start` + (n-1) jours si
    `--start` est donné, sinon aujourd'hui + n jours ; 12h30/19h30 en semaine selon la parité de n, créneau
    week-end fixe le samedi/dimanche."""
    d = start + timedelta(days=position - 1) if start else date.today() + timedelta(days=position)
    weekday = d.weekday()   # 0 = lundi … 5 = samedi, 6 = dimanche
    heure = _WEEKEND_HOUR if weekday >= 5 else ("19h30" if position % 2 else "12h30")
    return f"{d.strftime('%d/%m/%Y')} ({_JOURS[weekday]}) à {heure}"


def week_selection(scripts, ids, force=False) -> list:
    """Ids donnés → ces scripts ; sinon les scripts `approved` sans out.mp4 (tous les `approved` avec --force)."""
    if ids:
        return [s for s in scripts if s.id in ids]
    return [s for s in scripts if s.status == "approved"
            and (force or not (config.build_dir(s) / "out.mp4").exists())]


def cmd_week(args) -> int:
    """UNE commande pour le lot hebdo : lint de tout le lot (avant tout appel payant), puis build de chaque vidéo."""
    scripts = _lot_order(week_selection(schema.load_all(config.SCRIPTS_DIR), args.ids, args.force))
    if not scripts:
        print("✗ aucun script `approved` à générer (donner des ids, ou passer les scripts validés en `status: approved`)")
        return 1
    ids = [s.id for s in scripts]
    print(f"Lot (Shorts puis Long en dernier) : {' · '.join(ids)}")
    if lint.has_errors(lint.lint_all(scripts, publish=False)):
        print("✗ lint en erreur : corriger d'abord (python cli.py lint " + " ".join(ids) + ")")
        return 1
    failed = []
    for n, sid in enumerate(ids, 1):
        slot = _publish_slot(n, args.start)
        print(f"\n=== [{n}/{len(ids)}] {sid} — publication prévue {slot} ===")
        ns = argparse.Namespace(id=sid, until="render", dry=args.dry, proportional=False, force=args.force,
                                no_bg=False, background=None, placeholder_mascots=False, no_preview=True,
                                publish_slot=slot)
        try:
            rc = cmd_build(ns)
        except Exception as exc:                 # un échec n'arrête pas le reste du lot
            print(f"✗ {exc}")
            rc = 1
        if rc:
            failed.append(sid)
    print(f"\n{len(ids) - len(failed)}/{len(ids)} vidéo(s) générée(s)" + (f" · échec : {', '.join(failed)}" if failed else ""))
    return 1 if failed else 0


def cmd_studio(args) -> int:
    scripts = schema.load_all(config.SCRIPTS_DIR)
    if not args.all:
        scripts = _lot_order([s for s in scripts if s.id in args.ids])
    if not scripts:
        print("✗ aucun script : donner des ids ou --all")
        return 1
    for n, sc in enumerate(scripts, 1):
        bdir = config.build_dir(sc)
        bdir.mkdir(parents=True, exist_ok=True)
        slot = _publish_slot(n, args.start) if (args.start or not args.all) else None
        print(f"✓ {publish_mod.studio_file(sc, bdir, publish_slot=slot)}")
    return 0


def cmd_thumbnail(args) -> int:
    scripts = schema.load_all(config.SCRIPTS_DIR)
    if not args.all:
        scripts = [s for s in scripts if s.id in args.ids]
    if not scripts:
        print("✗ aucun script : donner des ids ou --all")
        return 1
    for sc in scripts:
        print(f"✓ {thumbnail_mod.save(sc, config.build_dir(sc))}")
    return 0


def cmd_subs(args) -> int:
    script = schema.find_script(config.SCRIPTS_DIR, args.id)
    if args.langs is not None:
        langs = [x.strip() for x in args.langs.split(",") if x.strip()]
    else:
        langs = config.SUB_LANGS_LONG if script.format == "long" else config.SUB_LANGS_SHORT
    bdir = config.build_dir(script)
    if not langs:
        print(f"· {script.format} : aucune traduction par défaut (français seul). Forcer avec --langs ar,en,es,zh-Hans")
    paths = subtitles.generate(bdir, langs, dry=args.dry, force=args.force)
    for p in paths:
        print(f"✓ {p}")
    print("  Studio → Sous-titres → Ajouter une langue → Importer un fichier → « Avec minutage ».")
    return 0


def cmd_publish(args) -> int:
    script = schema.find_script(config.SCRIPTS_DIR, args.id)
    platforms = [x.strip() for x in args.platforms.split(",") if x.strip()]
    bdir = config.build_dir(script)
    if not args.dry:
        publish_mod.check_publishable(script, platforms, args.confirm_public)
        if lint.has_errors(lint.lint_all([script], publish=True)):
            print(f"✗ lint --publish en erreur : corriger d'abord (python cli.py lint --publish {script.id})")
            return 1
    results = publish_mod.publish(script, bdir, platforms, dry=args.dry, force=args.force)
    for name, result in results.items():
        print(f"  {name} : {result}")
    return 1 if any(r.startswith("✗") for r in results.values()) else 0


def cmd_pack(args) -> int:
    """Envoi MANUEL (YouTube Studio) : écrit build/<id>/studio.txt (titre, description + chapitres, tags) et liste les fichiers."""
    script = schema.find_script(config.SCRIPTS_DIR, args.id)
    bdir = config.build_dir(script)
    t = publish_mod.texts(script, bdir, "youtube")
    bdir.mkdir(parents=True, exist_ok=True)
    publish_mod.studio_file(script, bdir)                       # même fichier que `build` / `studio` (titre, description, tags)
    thumb = thumbnail_mod.thumbnail_path(bdir)
    if script.format == "long" and not thumb.exists():
        thumb = thumbnail_mod.save(script, bdir)
    print(f"Titre : {t['title']}\n\n{t['text']}\n")
    for label, path in (("Vidéo", bdir / "out.mp4"), ("Miniature", thumb if script.format == "long" else None),
                        ("Textes", bdir / "studio.txt")):
        if path:
            print(f"  {label:<9}: {path}{'' if path.exists() else '  ✗ ABSENT (python cli.py build ' + script.id + ')'}")
    if script.format == "short":
        print("  (Short : pas de miniature personnalisée dans Studio ; choisir l'image de couverture dans la vidéo)")
    return 0


def cmd_publish_auth(args) -> int:
    publish_mod.youtube_authorize()
    return 0


def cmd_list(args) -> int:
    scripts = schema.load_all(config.SCRIPTS_DIR)
    print(f"{'id':<10} {'statut':<9} {'pilier':<6} {'hook':<14} {'~durée':>7}  {'claims ok':<9} build")
    for sc in scripts:
        secs = lint.estimate_seconds(sc)
        ok = sum(1 for c in sc.claims if c.source_guide)
        bd = config.build_dir(sc)
        out = bd / "out.mp4"
        built = "out.mp4 ✓" if out.exists() else ("dry seulement" if (bd / "out.dry.mp4").exists() else "-")
        print(f"{sc.id:<10} {sc.status:<9} {sc.pillar:<6} {(sc.hook_formula or '-'):<14} "
              f"{secs:>6.0f}s  {ok}/{len(sc.claims):<7} {built:<14} {sc.title[:40]}")
    return 0


TEMPLATE = """# Script {id} — à compléter puis : python cli.py lint {id}
id: {id}
format: short
status: draft            # draft → approved (après VOTRE relecture, GATE 1)
pillar: {pillar}         # A produit TEF · B actu · C méthode · D civique · E FLE · F comparatif
product: {product}       # tef_irn | examen_civique | both | fle_bridge
hook_formula: {formula}  # stakes | contrarian | curiosity_gap | in_medias_res | direct_promise
accent: {accent}         # indigo (TEF) | blue (civique) | gold
title: "TITRE DE TRAVAIL"
cta_overlay: Lien en bio # texte discret, JAMAIS parlé
blocks:
  - id: hook             # 0-1,5 s : démarre en plein milieu, sans « salut »
    voice: "À REMPLACER"
    mascot: perplexe
    # overlay: "2026"    # gros badge doré (facultatif)
    # card: {{kind: question, data: {{question_id: null, question: "…", choices: ["…", "…", "…", "…"], correct: "C", draft: true}}}}
  - id: build            # une seule idée, zéro remplissage
    voice: "À REMPLACER"
    mascot: reflechit
    # card_from: hook      # réutilise la carte du hook
  - id: payoff           # la réponse, nette
    voice: "À REMPLACER"
    mascot: victorieux
    # card_from: hook
    # card_state: revealed # allume la bonne réponse
  - id: loop             # BOUCLE : phrase SUSPENDUE (finit par … : —) qui se raccorde au hook
    voice: "À REMPLACER…"
    mascot: heureux
    card_from: hook      # obligatoire : même carte que le hook
    # card_state: initial  # OBLIGATOIRE si la carte est progressive (terms, text_annotated)
claims:                  # chaque affirmation factuelle, avec sa source à vérifier
  - text: "AFFIRMATION À SOURCER"
    source_hint: "service-public.fr …"
"""


def cmd_new(args) -> int:
    path = config.SCRIPTS_DIR / f"{args.id}.yaml"
    if path.exists():
        print(f"✗ {path.name} existe déjà")
        return 1
    accent = {"A": "indigo", "C": "indigo", "D": "blue"}.get(args.pillar, "gold")
    product = args.product or {"A": "tef_irn", "C": "tef_irn", "D": "examen_civique", "E": "fle_bridge"}.get(args.pillar, "both")
    path.write_text(TEMPLATE.format(id=args.id, pillar=args.pillar, product=product,
                                    formula=args.formula, accent=accent), encoding="utf-8")
    print(f"✓ {path} — remplir les « À REMPLACER », puis : python cli.py lint {args.id}")
    return 0


def cmd_preview(args) -> int:
    from PIL import Image
    bdir = config.build_dir(schema.find_script(config.SCRIPTS_DIR, args.id))
    tl = json.loads((bdir / "timeline.json").read_text())
    video = bdir / ("out.dry.mp4" if (bdir / "out.dry.mp4").exists() and not (bdir / "out.mp4").exists() else "out.mp4")
    frames = []
    vertical = tl["size"][1] > tl["size"][0]
    cell = (360, 640) if vertical else (640, 360)
    for b in tl["blocks"]:
        t = min(tl["duration"] - 0.1, b["start"] + (b["end"] - b["start"]) * 0.6)
        png = bdir / f"prev_{b['id']}.png"
        audio.run(["ffmpeg", "-y", "-ss", f"{t:.3f}", "-i", str(video), "-frames:v", "1", str(png)])
        frames.append(Image.open(png).convert("RGB").resize(cell))
    cols = len(frames) if vertical else min(3, len(frames))              # long : grille de 3 colonnes
    rows = -(-len(frames) // cols)
    sheet = Image.new("RGB", (cell[0] * cols, cell[1] * rows))
    for i, f in enumerate(frames):
        sheet.paste(f, (cell[0] * (i % cols), cell[1] * (i // cols)))
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
    p.add_argument("--publish", action="store_true", help="règles de publication (claims reprises d'un guide publié, status approved)")
    p.add_argument("--quiet", action="store_true", help="masque les rappels")
    p.set_defaults(fn=cmd_lint)

    p = sub.add_parser("approve", help="GATE 1 : approuve les scripts draft sans erreur lint --publish restante "
                                       "(ids explicites + --force pour outrepasser)")
    p.add_argument("ids", nargs="*")
    p.add_argument("--force", action="store_true",
                   help="approuve même avec des erreurs restantes (claims non sourcées, etc.) — "
                        "à réserver à une relecture manuelle réelle")
    p.set_defaults(fn=cmd_approve)

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
    p.add_argument("--no-bg", action="store_true", help="fond noir uni (rendu plus rapide, pour tester)")
    p.add_argument("--background", help="vidéo de fond personnalisée (assets/backgrounds/<nom> ou chemin) ; "
                                        "répétée avant/arrière si trop courte. Prioritaire sur `background:` du script")
    p.add_argument("--placeholder-mascots", action="store_true", help="silhouettes de test si assets absents")
    p.add_argument("--no-preview", action="store_true", help="ne génère pas l'image d'aperçu avec l'interface des réseaux")
    p.set_defaults(fn=cmd_build)


    p = sub.add_parser("week", help="génère TOUTES les vidéos du lot (scripts `approved` sans out.mp4, ou ids donnés)")
    p.add_argument("ids", nargs="*")
    p.add_argument("--dry", action="store_true", help="aucun appel API : voix muette, timings estimés")
    p.add_argument("--force", action="store_true", help="regénère aussi les vidéos déjà faites (TTS/ASR payants)")
    p.add_argument("--start", type=_parse_start, help="date de la 1re publication (JJ/MM, JJ/MM/AAAA ou AAAA-MM-JJ) : les vidéos suivantes = un jour de plus chacune. Défaut : demain")
    p.set_defaults(fn=cmd_week)

    p = sub.add_parser("studio", help="build/<id>/studio.txt : titre, description, tags à copier dans YouTube Studio")
    p.add_argument("ids", nargs="*")
    p.add_argument("--all", action="store_true")
    p.add_argument("--start", type=_parse_start, help="date de la 1re publication (JJ/MM, JJ/MM/AAAA ou AAAA-MM-JJ) : les vidéos suivantes = un jour de plus chacune. Défaut : demain avec des ids ; avec --all seul, aucune date")
    p.set_defaults(fn=cmd_studio)

    p = sub.add_parser("thumbnail", help="miniature build/<id>/thumbnail.jpg (sans rendu vidéo ni API)")
    p.add_argument("ids", nargs="*")
    p.add_argument("--all", action="store_true")
    p.set_defaults(fn=cmd_thumbnail)

    p = sub.add_parser("subs")
    p.add_argument("id")
    p.add_argument("--langs", help="ex. ar,en,es,zh-Hans (défaut : long = SUB_LANGS_LONG, short = aucune)")
    p.add_argument("--dry", action="store_true", help="traduction factice « [ar] texte », aucun appel API")
    p.add_argument("--force", action="store_true", help="ignore le cache des traductions (payant)")
    p.set_defaults(fn=cmd_subs)

    p = sub.add_parser("publish")
    p.add_argument("id")
    p.add_argument("--platforms", default="youtube,facebook,instagram",
                   help="youtube,facebook,instagram (défaut : les trois ; instagram = Shorts seulement)")
    p.add_argument("--confirm-public", action="store_true",
                   help="obligatoire (hors --dry) : la publication est PUBLIQUE et immédiate, sans brouillon")
    p.add_argument("--dry", action="store_true", help="affiche les textes par plateforme, aucun appel réseau")
    p.add_argument("--force", action="store_true", help="republie même si déjà envoyé (crée un doublon)")
    p.set_defaults(fn=cmd_publish)

    p = sub.add_parser("pack", help="prépare l'envoi MANUEL dans YouTube Studio (titre, description, chapitres, fichiers)")
    p.add_argument("id")
    p.set_defaults(fn=cmd_pack)

    p = sub.add_parser("publish-auth")
    p.add_argument("platform", choices=["youtube"])
    p.set_defaults(fn=cmd_publish_auth)

    sub.add_parser("list").set_defaults(fn=cmd_list)

    p = sub.add_parser("new")
    p.add_argument("id")
    p.add_argument("--pillar", choices=list("ABCDEF"), required=True)
    p.add_argument("--product", choices=["tef_irn", "examen_civique", "both", "fle_bridge"])
    p.add_argument("--formula", default="stakes",
                   choices=["stakes", "contrarian", "curiosity_gap", "in_medias_res", "direct_promise"])
    p.set_defaults(fn=cmd_new)

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
