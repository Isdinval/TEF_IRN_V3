import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest


@pytest.fixture(autouse=True)
def _reset_layout_profile():
    """Le profil de mise en page est un état global : toujours repartir du Short."""
    from pipeline import config
    config.use_profile("short")
    yield
    config.use_profile("short")
