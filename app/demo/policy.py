"""
Demo-only DISPLAY policy for sleeping events.

Why this exists
---------------
The existing ActivityAnalyzer emits a SLEEPING event from two different rules:

  1. Eye-closure rule   - eyes closed for >= 2 s (needs a detected face).
                          Description starts "Eyes closed for ...", score 0.75 or 0.9.
  2. Posture fallback   - the top person box is >= 1.3x wider than tall. No eye
                          evidence is required. Description starts "Person posture
                          suggests lying down / sleeping (no eye data)", fixed score 0.50.

A person sitting normally in front of a laptop webcam (head, shoulders and arms
visible) produces a box near that 1.3 ratio, so the posture fallback fires
continuously and the demo showed "Sleeping" for someone who was just sitting.
(Note the production fallback also fires when eyes are measured OPEN; its
"(no eye data)" wording is not always accurate. That is production behaviour and
is intentionally NOT changed here.)

What this does
--------------
By default the demo does NOT display the posture-only fallback. Everything else,
including real eye-closure sleeping events, phones and persons, is shown exactly as
the pipeline reports it. The hidden signal is never denied: the demo reports it in
the status strip ("[hidden: posture-only sleeping]") and logs it once. Pass
--show-posture-only-sleeping to display the raw posture-only event as well.

This changes only what the DEMO draws and screenshots. The detector, its
thresholds, and production behaviour are untouched.

The policy recognises the fallback by its description text, so a contract test
(tests/test_demo_live_webcam.py) runs the real ActivityAnalyzer and fails loudly if
that wording ever changes. Unrecognised SLEEPING events are shown (fail open).
"""
from typing import Any, Dict, Iterable, List, Tuple

# Exact prefixes of the existing analyzer's descriptions (see activity_analyzer.py).
EYE_CLOSURE_PREFIX = "Eyes closed for"
POSTURE_ONLY_PREFIX = "Person posture suggests lying down / sleeping"

POSTURE_ONLY_LABEL = "posture-only sleeping"


def _is_sleeping(event: Dict[str, Any]) -> bool:
    activity = event.get("activity_type")
    return str(getattr(activity, "name", activity)) == "SLEEPING"


def is_posture_only_sleeping(event: Dict[str, Any]) -> bool:
    """True for the box-shape fallback (no eye-closure evidence)."""
    return _is_sleeping(event) and str(event.get("description") or "").startswith(POSTURE_ONLY_PREFIX)


def has_eye_closure_evidence(event: Dict[str, Any]) -> bool:
    """True for a SLEEPING event produced by the eye-closure rule."""
    return _is_sleeping(event) and str(event.get("description") or "").startswith(EYE_CLOSURE_PREFIX)


def apply_display_policy(
    events: Iterable[Dict[str, Any]], *, show_posture_only_sleeping: bool = False
) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Returns (events_to_display, hidden_labels).
    `hidden_labels` names every kind of signal the pipeline produced but the demo chose not to show.
    """
    shown: List[Dict[str, Any]] = []
    hidden: List[str] = []
    for event in events:
        if not show_posture_only_sleeping and is_posture_only_sleeping(event):
            if POSTURE_ONLY_LABEL not in hidden:
                hidden.append(POSTURE_ONLY_LABEL)
            continue
        shown.append(event)
    return shown, hidden
