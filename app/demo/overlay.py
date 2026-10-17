"""
Overlay logic for the live webcam demo: pure functions, no camera, no models.

It only *presents* what the existing detection pipeline reports:
  * green box  = a person was detected and no violation covers that person
  * red box    = the existing pipeline reported a qualifying violation

Nothing here invents detections or confidence values. Two kinds of numbers appear:
  * "conf"       - a real YOLO model confidence (persons, phones, restricted zones)
  * "Rule score" - a fixed value the existing rule assigns (sleeping, long inactivity).
                   It is NOT a calibrated probability and is labelled accordingly.

A "phone" violation only means a phone is visible in the frame; the existing
pipeline does not check who is holding it, so the red box is drawn on the phone.
"""
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import cv2
import numpy as np

# BGR colours
GREEN = (0, 200, 0)
RED = (0, 0, 255)
LIGHT_RED = (80, 80, 255)  # readable on the dark evidence banner
GREY = (160, 160, 160)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

FONT = cv2.FONT_HERSHEY_SIMPLEX

# Existing activity types whose reported confidence is a real YOLO confidence.
# Every other type uses a fixed rule score and is labelled "Rule score".
_MODEL_CONFIDENCE_TYPES = {"MOBILE_PHONE_USAGE", "RESTRICTED_AREA_VIOLATION"}
_LABELS = {
    "MOBILE_PHONE_USAGE": "Phone detected",
    "SLEEPING": "Sleeping",
    "LONG_INACTIVITY": "Long inactivity",
    "RESTRICTED_AREA_VIOLATION": "Restricted area",
}

# A violation box this close to a person box means "this is that person's violation".
_PERSON_COVER_IOU = 0.8


@dataclass(frozen=True)
class OverlayBox:
    x1: int
    y1: int
    x2: int
    y2: int
    label: str
    state: str  # "normal" | "violation"


@dataclass(frozen=True)
class Violation:
    key: str          # ActivityType name, e.g. "SLEEPING"
    label: str        # human label, e.g. "Sleeping"
    score_text: str   # "conf 0.62" or "Rule score 0.75"
    detail: str       # the pipeline's own description


@dataclass(frozen=True)
class DetectionView:
    boxes: Tuple[OverlayBox, ...] = ()
    violations: Tuple[Violation, ...] = ()
    persons: int = 0
    # Signals the existing pipeline produced but the demo's display policy chose not to show
    # (see app/demo/policy.py). Reported in the status strip so nothing is silently dropped.
    hidden: Tuple[str, ...] = ()

    @property
    def state(self) -> str:
        if self.violations:
            return "violation"
        return "normal" if self.persons else "idle"


EMPTY_VIEW = DetectionView()


@dataclass(frozen=True)
class Hud:
    state: str                      # "normal" | "violation" | "idle" | "starting" | "stalled" | "check"
    status_text: str
    persons: int = 0
    events: int = 0
    screenshots: int = 0
    analysis_fps: Optional[float] = None
    analysis_age: Optional[float] = None
    saved_notice: Optional[str] = None
    hidden_note: Optional[str] = None


# --------------------------------------------------------------------------- #
#  Building the view from the existing pipeline's outputs
# --------------------------------------------------------------------------- #
def _ascii(text: str) -> str:
    """cv2's Hershey fonts only render ASCII."""
    return str(text).encode("ascii", "replace").decode("ascii")


def _iou(a: Sequence[float], b: Sequence[float]) -> float:
    ix1, iy1 = max(a[0], b[0]), max(a[1], b[1])
    ix2, iy2 = min(a[2], b[2]), min(a[3], b[3])
    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    area_a = max(0.0, a[2] - a[0]) * max(0.0, a[3] - a[1])
    area_b = max(0.0, b[2] - b[0]) * max(0.0, b[3] - b[1])
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


def _event_key(event: Dict[str, Any]) -> str:
    activity = event.get("activity_type")
    return str(getattr(activity, "name", activity))


def _describe(event: Dict[str, Any]) -> Violation:
    key = _event_key(event)
    label = _LABELS.get(key, key.replace("_", " ").capitalize())
    score = float(event.get("confidence_score", 0.0))
    kind = "conf" if key in _MODEL_CONFIDENCE_TYPES else "Rule score"
    return Violation(
        key=key,
        label=label,
        score_text=f"{kind} {score:.2f}",
        detail=_ascii(event.get("description") or ""),
    )


def _event_box(event: Dict[str, Any]) -> Optional[Tuple[int, int, int, int]]:
    bbox = event.get("bounding_box")
    if not bbox:
        return None
    x, y, w, h = bbox["x"], bbox["y"], bbox["w"], bbox["h"]
    return int(round(x)), int(round(y)), int(round(x + w)), int(round(y + h))


def hidden_note(view: DetectionView) -> Optional[str]:
    """Short grey status note naming signals hidden by the demo display policy, or None."""
    return "[hidden: " + ", ".join(view.hidden) + "]" if view.hidden else None


def build_view(
    persons: Iterable[Dict[str, Any]],
    events: Iterable[Dict[str, Any]],
    hidden: Iterable[str] = (),
) -> DetectionView:
    """
    persons: dicts from the existing person detector: {"box": [x1,y1,x2,y2], "confidence": float}
    events:  dicts from ActivityAnalyzer.analyze_frame (activity_type, confidence_score,
             bounding_box {x,y,w,h}, description) that the demo chose to DISPLAY
    hidden:  labels of signals produced by the pipeline but not displayed (demo policy)
    """
    persons = list(persons)
    violations: List[Violation] = []
    red_boxes: List[OverlayBox] = []
    for event in events:
        violation = _describe(event)
        violations.append(violation)
        box = _event_box(event)
        if box is not None:
            red_boxes.append(
                OverlayBox(*box, label=f"{violation.label} ({violation.score_text})", state="violation")
            )

    green_boxes: List[OverlayBox] = []
    for person in persons:
        x1, y1, x2, y2 = (int(round(v)) for v in person["box"])
        # If a violation box is (nearly) this person's box, the red box replaces the green one.
        if any(_iou((x1, y1, x2, y2), (r.x1, r.y1, r.x2, r.y2)) >= _PERSON_COVER_IOU for r in red_boxes):
            continue
        green_boxes.append(
            OverlayBox(x1, y1, x2, y2, label=f"Person {float(person['confidence']):.2f}", state="normal")
        )

    # Green first so red is drawn on top.
    return DetectionView(
        boxes=tuple(green_boxes + red_boxes),
        violations=tuple(violations),
        persons=len(persons),
        hidden=tuple(hidden),
    )


# --------------------------------------------------------------------------- #
#  Drawing
# --------------------------------------------------------------------------- #
def _font_scale(frame_width: int) -> float:
    return max(0.45, min(0.9, frame_width / 1280 * 0.8))


def _draw_label(img: np.ndarray, text: str, anchor: Tuple[int, int], color: Tuple[int, int, int], font_scale: float) -> None:
    text = _ascii(text)
    (tw, th), baseline = cv2.getTextSize(text, FONT, font_scale, 1)
    pad = 3
    img_h, img_w = img.shape[:2]
    x = max(0, min(anchor[0], img_w - tw - 2 * pad))
    top = anchor[1] - th - baseline - 2 * pad
    if top < 0:  # no room above the box: place the label just inside it
        top = anchor[1] + 1
    cv2.rectangle(img, (x, top), (x + tw + 2 * pad, top + th + baseline + 2 * pad), color, cv2.FILLED)
    cv2.putText(img, text, (x + pad, top + th + pad), FONT, font_scale, WHITE, 1, cv2.LINE_AA)


def draw_boxes(img: np.ndarray, view: DetectionView, scale: float = 1.0) -> None:
    """Draw the view's boxes onto `img` in place (the caller passes a copy)."""
    fs = _font_scale(img.shape[1])
    for box in view.boxes:
        color = RED if box.state == "violation" else GREEN
        p1 = (int(box.x1 * scale), int(box.y1 * scale))
        p2 = (int(box.x2 * scale), int(box.y2 * scale))
        cv2.rectangle(img, p1, p2, color, 3 if box.state == "violation" else 2)
        _draw_label(img, box.label, p1, color, fs)


def _fit_text(text: str, max_width: int, font_scale: float) -> str:
    """Trim `text` (with an ellipsis) until it fits `max_width` pixels."""
    text = _ascii(text)
    if cv2.getTextSize(text, FONT, font_scale, 1)[0][0] <= max_width:
        return text
    while len(text) > 1 and cv2.getTextSize(text + "...", FONT, font_scale, 1)[0][0] > max_width:
        text = text[:-1]
    return text.rstrip() + "..."


def _translucent_rect(img: np.ndarray, top_left: Tuple[int, int], bottom_right: Tuple[int, int], alpha: float = 0.55) -> None:
    x1, y1 = top_left
    x2, y2 = bottom_right
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(img.shape[1], x2), min(img.shape[0], y2)
    if x2 <= x1 or y2 <= y1:
        return
    roi = img[y1:y2, x1:x2]
    img[y1:y2, x1:x2] = cv2.addWeighted(roi, 1 - alpha, np.zeros_like(roi), alpha, 0)


_STATE_COLOURS = {
    "normal": GREEN,
    "violation": RED,
    "idle": GREY,
    "starting": GREY,
    "stalled": GREY,
    "check": GREY,
}


_HUD_LINES = 3


def _hud_font_scale(width: int) -> float:
    return max(0.42, _font_scale(width) * 0.75)


def hud_height(width: int) -> int:
    """Height in pixels of the status strip for a preview of the given width."""
    return int(_HUD_LINES * 26 * _hud_font_scale(width) / 0.5) + 14


def draw_hud_strip(width: int, hud: Hud) -> np.ndarray:
    """
    Status strip drawn on its OWN canvas (stacked above the video), so it can never
    cover a detection box or label.
    """
    fs = _hud_font_scale(width)
    line_h = int(26 * fs / 0.5)
    strip = np.full((hud_height(width), width, 3), (28, 24, 22), np.uint8)
    colour = _STATE_COLOURS.get(hud.state, GREY)

    # line 1: title (left) + quit hint (right)
    y1 = line_h
    cv2.putText(strip, "Live webcam demo (local only)", (12, y1), FONT, fs, WHITE, 1, cv2.LINE_AA)
    hint = "q / Esc: quit"
    (tw, _), _ = cv2.getTextSize(hint, FONT, fs, 1)
    cv2.putText(strip, hint, (width - tw - 12, y1), FONT, fs, GREY, 1, cv2.LINE_AA)

    # line 2: coloured status dot + current detection state
    y2 = line_h * 2
    cv2.circle(strip, (18, y2 - int(fs * 8)), 6, colour, cv2.FILLED)
    cv2.putText(strip, _ascii(hud.status_text), (32, y2), FONT, fs, colour, 1, cv2.LINE_AA)
    if hud.hidden_note:
        status_w = cv2.getTextSize(_ascii(hud.status_text), FONT, fs, 1)[0][0]
        cv2.putText(strip, _ascii(hud.hidden_note), (32 + status_w + 14, y2), FONT, fs, GREY, 1, cv2.LINE_AA)

    # line 3: counters + analysis speed
    speed = "warming up" if hud.analysis_fps is None else f"{hud.analysis_fps:.1f}/s (age {hud.analysis_age or 0.0:.1f}s)"
    counters = f"Persons {hud.persons}   Events {hud.events}   Screenshots {hud.screenshots}   Analysis {speed}"
    cv2.putText(strip, _ascii(counters), (12, line_h * 3), FONT, fs, WHITE, 1, cv2.LINE_AA)
    return strip


def _draw_saved_notice(img: np.ndarray, text: str) -> None:
    """Short-lived 'screenshot saved' banner over the bottom-left of the video."""
    fs = _hud_font_scale(img.shape[1])
    h = img.shape[0]
    text = _ascii(f"Screenshot saved: {text}")
    (tw, th), baseline = cv2.getTextSize(text, FONT, fs, 1)
    cv2.rectangle(img, (6, h - th - baseline - 22), (tw + 22, h - 8), (0, 120, 0), cv2.FILLED)
    cv2.putText(img, text, (14, h - baseline - 14), FONT, fs, WHITE, 1, cv2.LINE_AA)


def render_preview(frame_bgr: np.ndarray, view: DetectionView, hud: Hud, preview_width: int) -> np.ndarray:
    """
    Downscale the video (if needed), draw boxes on it, and stack the status strip above it.
    Output height = video height + hud_height(width). Never mutates `frame_bgr`.
    """
    h, w = frame_bgr.shape[:2]
    scale = min(1.0, preview_width / float(w))
    if scale < 1.0:
        img = cv2.resize(frame_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    else:
        img = frame_bgr.copy()
    draw_boxes(img, view, scale)
    if hud.saved_notice:
        _draw_saved_notice(img, hud.saved_notice)
    return np.vstack([draw_hud_strip(img.shape[1], hud), img])


def render_evidence(frame_bgr: np.ndarray, view: DetectionView, violation: Violation, captured_at: datetime) -> np.ndarray:
    """
    Full-resolution annotated copy of the analysed frame: boxes + labels, plus a
    translucent banner with the violation label, score, and a UTC timestamp.
    Output dimensions equal the input's.
    """
    img = frame_bgr.copy()
    draw_boxes(img, view, 1.0)

    h, w = img.shape[:2]
    fs = _font_scale(w)
    stamp = captured_at.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    line1 = f"{violation.label} - {violation.score_text}"
    line2 = f"{stamp}   {violation.detail}".strip()
    line_h = int(30 * fs / 0.5)
    _translucent_rect(img, (0, h - 2 * line_h - 14), (w, h), alpha=0.6)
    cv2.putText(img, _ascii(line1), (12, h - line_h - 10), FONT, fs, LIGHT_RED, 2, cv2.LINE_AA)
    cv2.putText(img, _fit_text(line2, w - 24, fs * 0.8), (12, h - 12), FONT, fs * 0.8, WHITE, 1, cv2.LINE_AA)
    return img
