import subprocess

from PIL import Image

import ui_preview


def test_overlay_sizes_and_zones():
    for p in ui_preview.PLATFORMS:
        ov = ui_preview.overlay_for((1080, 1920), p)
        assert ov.size == (1080, 1920) and ov.getchannel("A").getbbox()
    assert ui_preview.overlay_for((1920, 1080), "youtube", zones=True).size == (1920, 1080)
    assert ui_preview.overlay_for((540, 960), "tiktok").size == (540, 960)          # redimensionné


def test_image_and_video_paths(tmp_path):
    src = tmp_path / "f.png"
    Image.new("RGB", (270, 480), (10, 40, 30)).save(src)
    out = ui_preview.render(src, "instagram", True, tmp_path / "o.png")
    assert Image.open(out).size == (270, 480) and Image.open(out).getpixel((135, 10)) != (10, 40, 30)
    clip = tmp_path / "c.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=black:s=270x480:r=10:d=0.5",
                    "-pix_fmt", "yuv420p", str(clip)], check=True)
    assert ui_preview.render(clip, "youtube", False, tmp_path / "o.mp4").stat().st_size > 0


def test_render_video_with_reduced_width(tmp_path):
    import subprocess

    src = tmp_path / "in.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=black:s=216x384:d=0.4:r=10",
                    "-pix_fmt", "yuv420p", str(src)], check=True)
    out = ui_preview.render(src, "tiktok", False, tmp_path / "o.mp4", width=108)
    assert ui_preview._video_size(out) == (108, 192)



def test_contact_sheet(tmp_path):
    from PIL import Image

    f = tmp_path / "f.png"
    Image.new("RGB", (108, 192), (30, 30, 30)).save(f)
    out = ui_preview.contact_sheet(f, ui_preview.PLATFORMS, tmp_path / "s.png", height=192)
    assert Image.open(out).width > 3 * 108
