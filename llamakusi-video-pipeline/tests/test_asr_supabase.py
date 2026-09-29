from pipeline import asr, supabase_source as sb


def test_parse_word_info_annotations_like_google_docs_rest_example():
    interaction = {"steps": [{"type": "model_output", "content": [{"type": "text", "text": "Hello world",
        "annotations": [
            {"type": "word_info", "text": "Hello", "start_offset": "0.100s", "end_offset": "0.450s"},
            {"type": "word_info", "text": "world", "start_offset": "0.500s", "end_offset": "0.850s"}]}]}]}
    assert asr.extract_words(interaction) == [
        {"text": "Hello", "start": 0.1, "end": 0.45}, {"text": "world", "start": 0.5, "end": 0.85}]


def test_question_row_to_card_letter_or_text_answer():
    row = {"id": "u1", "question": "Q ?", "options": ["A) sept", "B) quinze", "C) 45", "D) 90"],
           "correct_answer": "C"}
    assert sb.to_card_data(row)["correct"] == "C"
    row["correct_answer"] = "45"
    d = sb.to_card_data(row)
    assert d["correct"] == "C" and d["choices"][0] == "sept"


def test_supabase_env_names_and_key_handling(monkeypatch):
    for k in ("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY"):
        monkeypatch.delenv(k, raising=False)
    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co/")
    assert sb._base_url() == "https://x.supabase.co"
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_abc")           # nouvelle clé : pas un JWT
    assert sb._headers() == {"apikey": "sb_secret_abc"}
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "aaa.bbb.ccc")             # JWT historique
    assert sb._headers()["Authorization"] == "Bearer aaa.bbb.ccc"


def test_fetch_questions_always_filters_reviewed(monkeypatch):
    seen = {}

    class R:
        def raise_for_status(self): pass
        def json(self): return []

    def fake_get(url, headers, params, timeout):
        seen.update(url=url, params=params)
        return R()

    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_abc")
    monkeypatch.setattr(sb.requests, "get", fake_get)
    sb.fetch_questions(search="contravention")
    assert seen["params"]["reviewed"] == "eq.true" and seen["url"].endswith("/rest/v1/civic_questions")
