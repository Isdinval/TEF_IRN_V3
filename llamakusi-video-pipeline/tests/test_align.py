from pipeline import align
from pipeline.align import Word


def W(text, block=0):
    from pipeline.textutil import normalize
    return Word(text, normalize(text), block)


def asr(*items):
    return [{"text": t, "start": s, "end": e} for t, s, e in items]


def test_perfect_match_uses_script_text_and_asr_timing():
    words = [W("Tu"), W("reçois"), W("une"), W("contravention.")]
    a = asr(("tu", 0.0, 0.2), ("recois", 0.25, 0.7), ("une", 0.75, 0.9), ("contravention", 0.95, 1.6))
    out, rep = align.align_words(words, a, 1.7)
    assert [w.text for w in out] == ["Tu", "reçois", "une", "contravention."]
    assert out[1].start == 0.25 and out[3].end == 1.6
    assert rep.coverage == 1.0 and rep.ok


def test_split_token_extends_previous_word():
    # « B1 » dit/transcrit « B 1 » : le mot script couvre les deux mots ASR
    words = [W("en"), W("B1"), W("suffisait")]
    a = asr(("en", 0.0, 0.2), ("B", 0.25, 0.4), ("1", 0.4, 0.6), ("suffisait", 0.7, 1.2))
    out, _ = align.align_words(words, a, 1.3)
    assert out[1].start == 0.25 and out[1].end == 0.6
    assert out[2].start == 0.7


def test_missing_asr_word_is_interpolated_and_monotonic():
    words = [W("un"), W("deux"), W("trois"), W("quatre")]
    a = asr(("un", 0.0, 0.3), ("trois", 0.9, 1.2), ("quatre", 1.3, 1.7))
    out, rep = align.align_words(words, a, 1.8)
    assert 0.3 <= out[1].start < out[1].end <= 0.9 + 1e-9
    assert rep.interpolated == ["deux"]
    starts = [w.start for w in out]
    assert starts == sorted(starts)


def test_asr_typo_still_aligned_positionally():
    words = [W("récépissé"), W("provisoire")]
    a = asr(("recepisse", 0.0, 0.6), ("provisoire", 0.7, 1.3))
    out, rep = align.align_words(words, a, 1.4)
    assert out[0].start == 0.0 and rep.coverage == 1.0


def test_block_spans_split_in_the_middle_of_pauses():
    words = [W("a", 0), W("b", 0), W("c", 1), W("d", 1)]
    for w, (s, e) in zip(words, [(0, .4), (.5, .9), (1.3, 1.6), (1.7, 2.0)]):
        w.start, w.end = s, e
    spans = align.block_spans(words, 2, 2.1)
    assert spans[0][0] == 0.0 and spans[-1][1] == align.snap(2.1)
    assert abs(spans[0][1] - 1.1) < 1 / 30 + 1e-6      # milieu de [0.9, 1.3]
    assert spans[0][1] == spans[1][0]


def test_groups_respect_blocks_and_sentence_ends():
    words = [W("Tu", 0), W("reçois", 0), W("une", 0), W("amende.", 0), W("C'est", 1), W("vrai", 1)]
    groups = align.group_words(words, max_words=3, max_chars=40)
    assert groups == [[0, 1, 2], [3], [4, 5]]


def test_proportional_timings_cover_duration():
    words = [W("un"), W("deux"), W("trois")]
    out = align.proportional_timings(words, 3.0)
    assert out[0].start == 0.0 and out[-1].end <= 3.0
    assert all(a.end <= b.start + 1e-9 for a, b in zip(out, out[1:]))


def test_realistic_asr_noise_on_a_full_short():
    """ASR simulé : accents perdus, « B1 » scindé, un mot manquant, une faute → couverture ≥ 90 %."""
    from pipeline import config, schema
    from pipeline.textutil import normalize
    script = schema.find_script(config.SCRIPTS_DIR, "short-01")
    words = align.flatten_script(script)
    truth = align.proportional_timings(align.flatten_script(script), 30.0)
    fake = []
    for k, w in enumerate(truth):
        if k == 7:
            continue                                    # mot manquant
        text = normalize(w.text)
        if w.norm == "b1":
            fake += [{"text": "B", "start": w.start, "end": (w.start + w.end) / 2},
                     {"text": "1", "start": (w.start + w.end) / 2, "end": w.end}]
            continue
        if k == 12:
            text = text[:-1] + "x"                      # faute
        fake.append({"text": text, "start": w.start, "end": w.end})
    out, rep = align.align_words(words, fake, 30.0)
    assert rep.coverage >= 0.9, rep
    starts = [w.start for w in out]
    assert starts == sorted(starts)
    assert max(abs(a.start - b.start) for a, b in zip(out, truth)) < 0.35
