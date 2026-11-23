from datetime import UTC, datetime

from yt_snapshot import build_events, duration_seconds

NOW = datetime(2026, 11, 23, 4, 15, tzinfo=UTC)
CHANNEL = {
    "id": "UC1",
    "statistics": {"subscriberCount": "7", "viewCount": "508", "videoCount": "5"},
}


def video(vid, duration, published="2026-11-21T11:30:40Z"):
    return {
        "id": vid,
        "snippet": {"title": f"t-{vid}", "publishedAt": published},
        "contentDetails": {"duration": duration},
        "statistics": {"viewCount": "292", "likeCount": "2", "commentCount": "1"},
    }


def test_duration_seconds():
    assert duration_seconds("PT23S") == 23
    assert duration_seconds("PT1M30S") == 90
    assert duration_seconds("PT1H2M3S") == 3723
    assert duration_seconds("") == 0


def test_build_events_formats_and_counts():
    events = build_events(CHANNEL, [video("a", "PT36S"), video("b", "PT8M20S")], NOW)
    assert [e["event"] for e in events] == [
        "yt_channel_snapshot",
        "yt_video_snapshot",
        "yt_video_snapshot",
    ]
    assert events[0]["properties"]["subscribers"] == 7
    assert events[1]["properties"]["format"] == "short"
    assert events[2]["properties"]["format"] == "long"
    assert events[1]["properties"]["age_days"] == 1
    assert events[1]["properties"]["views"] == 292


def test_uuid_is_stable_within_a_day_and_changes_next_day():
    a = build_events(CHANNEL, [video("a", "PT36S")], NOW)
    b = build_events(CHANNEL, [video("a", "PT36S")], NOW.replace(hour=20))
    c = build_events(CHANNEL, [video("a", "PT36S")], NOW.replace(day=24))
    assert a[1]["uuid"] == b[1]["uuid"]
    assert a[1]["uuid"] != c[1]["uuid"]
