"""Utility helpers for the FastAPI app.

This file provides a small `_id()` generator used by detection routines
to emit short unique identifiers for alerts/cycles used in the demo.
"""
from __future__ import annotations

import uuid


def _id() -> str:
    """Return a short unique id string.

    Uses UUID4 hex truncated to 12 characters to keep IDs compact while
    still being highly unlikely to collide in demo/test runs.
    """
    return uuid.uuid4().hex[:12]
