"""
Tests for the isolated live-webcam demo (app/demo/*).

Everything here uses mocked frames/camera/window/pipeline: no webcam, display,
database, or model weights are needed. These are UNIT tests of the demo's own
logic (overlay colours, cooldown, safe file writing, failure handling, cleanup,
isolation). They do NOT prove the detection models are accurate in the real
world; that needs the manual smoke test described in docs/live_webcam_demo.md.

Run: ./venv/bin/python -m pytest tests/test_demo_live_webcam.py -q
"""
import ast
import json
import os
import re
import subprocess
import sys
import threading
import time
import types
import uuid
from argparse import Namespace
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import MagicMock

import cv2
import numpy as np
import pytest

from app.core.constants import ActivityType
from app.demo import cooldown, evidence, live_webcam, overlay
from app.demo.cooldown import ScreenshotCooldown
from app.demo.evidence import DEFAULT_EVIDENCE_DIR, REPO_ROOT, DemoEvidenceWriter, safe_label
from app.demo.live_webcam import (
    EXIT_CAMERA, EXIT_GUI, EXIT_INTERRUPTED, EXIT_OK, EXIT_SETUP,
    AnalysisWorker, CameraUnavailableError, Pipeline, open_camera, parse_args, parse_camera_index, run,
)
from app.demo.overlay import (
    GREEN, RED, EMPTY_VIEW, Hud, build_view, draw_boxes, hud_height, render_evidence, render_preview,
)

DEMO_DIR = REPO_ROOT / "app" / "demo"
BLACK_640 = np.zeros((480, 640, 3), dtype=np.uint8)

PHONE_EVENT = {
    "activity_type": ActivityType.MOBILE_PHONE_USAGE,
    "confidence_score": 0.62,
    "bounding_box": {"x": 300, "y": 200, "w": 80, "h": 120},
    "description": "Mobile phone detected in frame",
}
PERSON = {"box": [20, 20, 200, 400], "confidence": 0.87}


def sleeping_event(box=(20, 20, 200, 400), score=0.75):
    x1, y1, x2, y2 = box
    return {
        "activity_type": ActivityType.SLEEPING,
        "confidence_score": score,
        "bounding_box": {"x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1},
        "description": "Eyes closed for 2.4s",
    }


# =========================================================================== #
#  Cooldown (monotonic, per violation type)
# =========================================================================== #
class FakeClock:
    def __init__(self, t=0.0):
        self.t = t

    def __call__(self):
        return self.t


def test_cooldown_captures_first_appearance():
    clock = FakeClock()
    cd = ScreenshotCooldown(cooldown_seconds=10, clear_seconds=3, clock=clock)
    assert cd.update({"SLEEPING"}) == ["SLEEPING"]


def test_cooldown_continuous_violation_is_not_captured_every_cycle():
    clock = FakeClock()
    cd = ScreenshotCooldown(cooldown_seconds=10, clear_seconds=3, clock=clock)
    captures = 0
    for i in range(16):  # 15 s of cycles, 1 s apart, violation always active
        clock.t = float(i)
        captures += len(cd.update({"SLEEPING"}))
    assert captures == 2  # t=0 (first) and t=10 (cooldown elapsed) — not 16


def test_cooldown_allows_new_capture_after_cooldown():
    clock = FakeClock()
    cd = ScreenshotCooldown(cooldown_seconds=10, clear_seconds=3, clock=clock)
    assert cd.update({"A"}) == ["A"]
    for t in (1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 9.9):   # one analysis result per second
        clock.t = t
        assert cd.update({"A"}) == [], f"must not capture again at t={t}"
    clock.t = 10.0
    assert cd.update({"A"}) == ["A"]


def test_cooldown_treats_a_long_analysis_stall_as_a_gap():
    """Documented limitation: if no result arrives for >= clear_seconds, a still-active violation counts as new."""
    clock = FakeClock()
    cd = ScreenshotCooldown(cooldown_seconds=10, clear_seconds=3, clock=clock)
    assert cd.update({"A"}) == ["A"]
    clock.t = 4.0
    assert cd.update({"A"}) == ["A"]


def test_cooldown_flicker_within_cooldown_is_suppressed():
    clock = FakeClock()
    cd = ScreenshotCooldown(cooldown_seconds=10, clear_seconds=3, clock=clock)
    assert cd.update({"PHONE"}) == ["PHONE"]
    clock.t = 1.0
    assert cd.update(set()) == []          # detector dropped out
    clock.t = 2.0
    assert cd.update({"PHONE"}) == []      # back after only 2 s: same event, still cooling down


def test_cooldown_reappearance_after_clear_is_a_new_event():
    clock = FakeClock()
    cd = ScreenshotCooldown(cooldown_seconds=10, clear_seconds=3, clock=clock)
    assert cd.update({"PHONE"}) == ["PHONE"]
    clock.t = 1.0
    cd.update(set())
    clock.t = 4.0                          # absent >= 3 s, but cooldown (10 s) not over
    assert cd.update({"PHONE"}) == ["PHONE"]


def test_cooldown_keys_are_independent():
    clock = FakeClock()
    cd = ScreenshotCooldown(cooldown_seconds=10, clear_seconds=3, clock=clock)
    assert cd.update({"PHONE"}) == ["PHONE"]
    clock.t = 1.0
    assert cd.update({"PHONE", "SLEEPING"}) == ["SLEEPING"]


def test_cooldown_uses_monotonic_clock_by_default():
    assert ScreenshotCooldown()._clock is time.monotonic


def test_cooldown_rejects_negative_values():
    with pytest.raises(ValueError):
        ScreenshotCooldown(cooldown_seconds=-1)


# =========================================================================== #
#  Safe evidence writing
# =========================================================================== #
NAME_RE = re.compile(r"^demo_\d{8}T\d{6}Z_[a-z0-9_]+_[0-9a-f]{8}\.jpg$")


def test_evidence_filename_is_safe_and_file_is_in_target_dir(tmp_path):
    writer = DemoEvidenceWriter(tmp_path / "demo_evidence")
    path = writer.save(BLACK_640, "MOBILE_PHONE_USAGE", datetime(2026, 10, 17, 12, 30, 5, tzinfo=timezone.utc))
    assert path is not None and NAME_RE.match(path.name)
    assert "20261017T123005Z" in path.name and "mobile_phone_usage" in path.name
    assert path.parent == (tmp_path / "demo_evidence").resolve()
    assert cv2.imread(str(path)).shape == BLACK_640.shape


def test_hostile_labels_cannot_escape_the_directory(tmp_path):
    assert safe_label("../../etc/passwd") == "etc_passwd"
    assert safe_label("..\\..\\win.ini") == "win_ini"
    assert safe_label("") == "event" and safe_label("////") == "event"
    assert len(safe_label("x" * 500)) <= 40
    writer = DemoEvidenceWriter(tmp_path / "demo_evidence")
    path = writer.save(BLACK_640, "../../../../tmp/evil")
    assert path is not None
    assert path.parent == (tmp_path / "demo_evidence").resolve()
    assert "/" not in path.name and ".." not in path.name
    assert [p for p in tmp_path.rglob("*") if p.is_file()] == [path]  # nothing written anywhere else


def test_evidence_filenames_are_unique(tmp_path):
    writer = DemoEvidenceWriter(tmp_path)
    paths = {writer.save(BLACK_640, "sleeping") for _ in range(40)}
    assert None not in paths and len(paths) == 40


def test_evidence_never_overwrites_an_existing_file(tmp_path, monkeypatch):
    monkeypatch.setattr(evidence.uuid, "uuid4", lambda: uuid.UUID(int=1))  # force identical names
    writer = DemoEvidenceWriter(tmp_path)
    when = datetime(2026, 1, 1, tzinfo=timezone.utc)
    first = writer.save(BLACK_640, "sleeping", when)
    assert first is not None
    original = first.read_bytes()
    second = writer.save(np.full((480, 640, 3), 255, np.uint8), "sleeping", when)
    assert second is None                      # refused rather than overwrite
    assert first.read_bytes() == original


def test_evidence_write_failure_returns_none(tmp_path):
    not_a_directory = tmp_path / "file"
    not_a_directory.write_text("x")
    assert DemoEvidenceWriter(not_a_directory).save(BLACK_640, "sleeping") is None


def test_default_evidence_dir_is_isolated_from_production_evidence():
    assert DEFAULT_EVIDENCE_DIR == REPO_ROOT / "demo_evidence"
    assert "media" not in DEFAULT_EVIDENCE_DIR.relative_to(REPO_ROOT).parts
    assert not str(DEFAULT_EVIDENCE_DIR).endswith(os.path.join("evidence", "screenshots"))


# =========================================================================== #
#  Overlay: green = normal, red = violation
# =========================================================================== #
def test_person_only_is_green_and_normal():
    view = build_view([PERSON], [])
    assert view.state == "normal" and view.persons == 1 and not view.violations
    assert [b.state for b in view.boxes] == ["normal"]
    assert view.boxes[0].label == "Person 0.87"


def test_no_person_is_idle():
    assert build_view([], []).state == "idle"


def test_phone_violation_is_red_on_the_phone_and_person_stays_green():
    view = build_view([PERSON], [PHONE_EVENT])
    assert view.state == "violation"
    red = [b for b in view.boxes if b.state == "violation"]
    green = [b for b in view.boxes if b.state == "normal"]
    assert len(red) == 1 and len(green) == 1
    assert (red[0].x1, red[0].y1, red[0].x2, red[0].y2) == (300, 200, 380, 320)
    assert red[0].label == "Phone detected (conf 0.62)"       # real model confidence
    assert view.violations[0].score_text == "conf 0.62"


def test_sleeping_score_is_labelled_rule_score_not_confidence():
    view = build_view([PERSON], [sleeping_event()])
    assert view.violations[0].score_text == "Rule score 0.75"
    assert "Rule score" in view.boxes[0].label and "conf" not in view.boxes[0].label
    assert len(view.boxes) == 1 and view.boxes[0].state == "violation"   # red replaces that person's green box
    assert view.persons == 1


def test_unrelated_person_stays_green_when_someone_else_violates():
    other = {"box": [400, 20, 620, 400], "confidence": 0.7}
    view = build_view([PERSON, other], [sleeping_event()])
    states = sorted(b.state for b in view.boxes)
    assert states == ["normal", "violation"] and view.persons == 2


def test_violation_without_a_box_still_counts_but_draws_no_box():
    event = {"activity_type": ActivityType.LONG_INACTIVITY, "confidence_score": 0.6, "bounding_box": None, "description": ""}
    view = build_view([], [event])
    assert view.state == "violation" and view.boxes == ()


def test_unicode_description_does_not_break_labels():
    event = dict(PHONE_EVENT, description="Téléphone détecté")
    assert build_view([], [event]).violations[0].detail.isascii()


def test_boxes_are_drawn_green_and_red():
    img = np.zeros((200, 200, 3), np.uint8)
    view = overlay.DetectionView(
        boxes=(
            overlay.OverlayBox(20, 30, 100, 100, "p", "normal"),
            overlay.OverlayBox(120, 120, 180, 180, "v", "violation"),
        )
    )
    draw_boxes(img, view)
    assert tuple(img[65, 20]) == GREEN       # left edge, mid-height of the green box
    assert tuple(img[150, 120]) == RED       # left edge, mid-height of the red box


def test_preview_downscales_without_mutating_the_input():
    frame = np.zeros((720, 1280, 3), np.uint8)
    before = frame.copy()
    out = render_preview(frame, EMPTY_VIEW, Hud(state="idle", status_text="No person detected"), 640)
    assert out.shape == (360 + hud_height(640), 640, 3)   # video (downscaled) + status strip above it
    assert np.array_equal(frame, before)


def test_status_strip_never_covers_the_video_or_its_labels():
    """A person near the top-left must keep a fully visible label: the status text lives in its own strip."""
    frame = np.full((480, 640, 3), 90, np.uint8)
    view = build_view([{"box": [10, 30, 200, 400], "confidence": 0.9}], [])
    hud = Hud(state="violation", status_text="VIOLATION: Sleeping", persons=1, events=3, screenshots=3,
              analysis_fps=1.6, analysis_age=0.4)
    out = render_preview(frame, view, hud, 640)
    strip_h = hud_height(640)

    expected_video = frame.copy()
    draw_boxes(expected_video, view, 1.0)
    assert np.array_equal(out[strip_h:], expected_video)   # video region is exactly boxes-on-video, nothing else
    assert out[:strip_h].any() and not np.array_equal(out[:strip_h], np.zeros_like(out[:strip_h]))


def test_saved_notice_is_shown_over_the_video_bottom_only():
    frame = np.full((480, 640, 3), 90, np.uint8)
    hud = Hud(state="normal", status_text="x", saved_notice="demo_x.jpg")
    out = render_preview(frame, EMPTY_VIEW, hud, 640)
    strip_h = hud_height(640)
    assert np.array_equal(out[strip_h:strip_h + 300], frame[:300])   # top of the video untouched
    assert not np.array_equal(out[-60:], frame[-60:])                # notice drawn near the bottom


def test_evidence_keeps_full_size_and_contains_label_score_and_timestamp(monkeypatch):
    texts = []
    real_put_text = cv2.putText

    def spy(img, text, *a, **k):
        texts.append(text)
        return real_put_text(img, text, *a, **k)

    monkeypatch.setattr(overlay.cv2, "putText", spy)
    view = build_view([PERSON], [PHONE_EVENT])
    when = datetime(2026, 10, 17, 9, 42, 18, tzinfo=timezone.utc)
    frame = np.zeros((720, 1280, 3), np.uint8)
    out = render_evidence(frame, view, view.violations[0], when)

    assert out.shape == frame.shape and not np.array_equal(out, frame)
    joined = " | ".join(texts)
    assert "Phone detected" in joined and "conf 0.62" in joined
    assert "2026-10-17 09:42:18 UTC" in joined
    assert not frame.any()                    # original frame untouched


def test_status_text_per_state():
    ok = live_webcam.AnalysisResult(1, BLACK_640, build_view([PERSON], []), 0.0, 0.1)
    bad = live_webcam.AnalysisResult(2, BLACK_640, build_view([PERSON], [PHONE_EVENT]), 0.0, 0.1)
    assert live_webcam._status_for(None, None)[0] == "starting"
    assert live_webcam._status_for(ok, 0.2)[0] == "normal"
    state, text, _ = live_webcam._status_for(bad, 0.2)
    assert state == "violation" and "Phone detected" in text
    assert live_webcam._status_for(ok, 99.0)[0] == "stalled"
    failed = live_webcam.AnalysisResult(3, BLACK_640, EMPTY_VIEW, 0.0, 0.1, failed=True)
    assert live_webcam._status_for(failed, 0.1)[0] == "stalled"


# =========================================================================== #
#  Camera index validation / local-only camera access
# =========================================================================== #
@pytest.mark.parametrize("value", ["0", "1", "3", "12", "31", " 2 "])
def test_valid_camera_indexes(value):
    assert parse_camera_index(value) == int(value)


@pytest.mark.parametrize("value", [
    "rtsp://192.0.2.10/stream", "http://camera.local/video", "/dev/video0", "-1",
    "abc", "0.5", "", " ", "32", "100", "1;ls", "0 1",
])
def test_invalid_camera_inputs_are_rejected(value):
    with pytest.raises(Exception) as exc:
        parse_camera_index(value)
    assert "camera" in str(exc.value).lower()


def test_cli_rejects_a_stream_url_for_camera(capsys):
    with pytest.raises(SystemExit) as exc:
        parse_args(["--camera", "rtsp://192.0.2.10/stream"])
    assert exc.value.code == 2
    assert "local camera index" in capsys.readouterr().err


def test_cli_defaults():
    args = parse_args([])
    assert args.camera == 0 and args.cooldown == 10.0 and args.preview_width == 640 and not args.window_check
    assert args.show_posture_only_sleeping is False       # posture-only sleeping is hidden unless asked for
    assert parse_args(["--show-posture-only-sleeping"]).show_posture_only_sleeping is True


class FakeStream:
    instances = []

    def __init__(self, connection_string, camera_code, connect_ok=True, frames=None):
        self.connection_string, self.camera_code = connection_string, camera_code
        self.connect_ok = connect_ok
        self.frames = list(frames) if frames is not None else [BLACK_640]
        self.released = 0
        FakeStream.instances.append(self)

    def connect(self):
        return self.connect_ok

    def read_frame(self):
        return self.frames.pop(0) if self.frames else None

    def release(self):
        self.released += 1


def test_open_camera_uses_only_the_integer_index_string():
    FakeStream.instances.clear()
    stream, frame = open_camera(2, stream_factory=FakeStream, sleep=lambda s: None)
    assert FakeStream.instances[0].connection_string == "2" and frame is not None
    assert live_webcam.open_camera.__kwdefaults__["stream_factory"] is live_webcam.USBCameraStream


def test_open_camera_failure_gives_clear_error_and_releases():
    def factory(conn, code):
        return FakeStream(conn, code, connect_ok=False)

    FakeStream.instances.clear()
    with pytest.raises(CameraUnavailableError) as exc:
        open_camera(5, stream_factory=factory, sleep=lambda s: None)
    assert "index 5" in str(exc.value)
    assert FakeStream.instances[0].released == 1


def test_open_camera_with_no_frames_fails_clearly_and_releases():
    def factory(conn, code):
        return FakeStream(conn, code, frames=[])

    FakeStream.instances.clear()
    with pytest.raises(CameraUnavailableError) as exc:
        open_camera(1, stream_factory=factory, sleep=lambda s: None)
    assert "no frames" in str(exc.value)
    assert FakeStream.instances[0].released == 1


# =========================================================================== #
#  Fakes for the run loop
# =========================================================================== #
class FakeCamera:
    """Yields `n_frames` black frames (optionally slowly), then None (disconnect)."""

    def __init__(self, n_frames=1000, delay=0.0):
        self.remaining, self.delay, self.released = n_frames, delay, 0

    def read_frame(self):
        if self.delay:
            time.sleep(self.delay)
        if self.remaining <= 0:
            return None
        self.remaining -= 1
        return BLACK_640.copy()

    def release(self):
        self.released += 1


class FakeWindow:
    def __init__(self, quit_after=None, interrupt_at=None):
        self.quit_after, self.interrupt_at = quit_after, interrupt_at
        self.shown, self.closed_calls, self.last = 0, 0, None

    def show(self, image):
        self.shown += 1
        self.last = image
        if self.interrupt_at and self.shown >= self.interrupt_at:
            raise KeyboardInterrupt

    def poll_key(self):
        return ord("q") if self.quit_after and self.shown >= self.quit_after else 255

    def is_closed(self):
        return False

    def close(self):
        self.closed_calls += 1


class FakePipeline:
    def __init__(self, view=EMPTY_VIEW, missing=(), load_error=None):
        self.view, self.missing, self.load_error = view, list(missing), load_error
        self.loaded = self.calls = 0

    def missing_files(self):
        return list(self.missing)

    def load(self):
        self.loaded += 1
        if self.load_error:
            raise self.load_error

    def analyze(self, frame):
        self.calls += 1
        return self.view


def args(**overrides):
    base = dict(camera=0, cooldown=10.0, preview_width=640, window_check=False, show_posture_only_sleeping=False)
    base.update(overrides)
    return Namespace(**base)


def run_with(camera, pipeline, window, writer, **kw):
    return run(
        args(**kw.pop("arg_overrides", {})),
        open_camera_fn=lambda idx: (camera, camera.read_frame()),
        pipeline_factory=lambda: pipeline,
        window_factory=lambda title: window,
        evidence_writer=writer,
        **kw,
    )


def analysis_threads():
    return [t for t in threading.enumerate() if t.name == "demo-analysis"]


# =========================================================================== #
#  Run loop: screenshots, failures, cleanup
# =========================================================================== #
def test_violation_saves_one_screenshot_not_one_per_frame(tmp_path):
    camera = FakeCamera(n_frames=400, delay=0.004)
    window = FakeWindow(quit_after=200)
    pipeline = FakePipeline(build_view([PERSON], [PHONE_EVENT]))
    writer = DemoEvidenceWriter(tmp_path / "demo_evidence")

    code = run_with(camera, pipeline, window, writer)

    files = sorted((tmp_path / "demo_evidence").glob("*.jpg"))
    assert code == EXIT_OK
    assert pipeline.calls > 5, "analysis must have run many times (loop was exercised)"
    assert len(files) == 1, "one ongoing violation must produce a single screenshot within the cooldown"
    assert "mobile_phone_usage" in files[0].name
    saved = cv2.imread(str(files[0]))
    assert saved.shape == BLACK_640.shape and saved.any()      # full size, annotated


def test_a_new_event_is_captured_after_the_cooldown_passes(tmp_path):
    class StepClock:
        def __init__(self):
            self.t, self.lock = 0.0, threading.Lock()

        def __call__(self):
            with self.lock:
                self.t += 100.0   # every reading is >> the cooldown apart
                return self.t

    camera = FakeCamera(n_frames=400, delay=0.004)
    window = FakeWindow(quit_after=150)
    writer = DemoEvidenceWriter(tmp_path / "demo_evidence")
    run_with(camera, FakePipeline(build_view([PERSON], [PHONE_EVENT])), window, writer,
             clock=StepClock(), arg_overrides={"cooldown": 5.0})
    assert len(list((tmp_path / "demo_evidence").glob("*.jpg"))) >= 2


def test_normal_detection_saves_no_screenshots(tmp_path):
    camera = FakeCamera(n_frames=400, delay=0.004)
    window = FakeWindow(quit_after=120)
    writer = DemoEvidenceWriter(tmp_path / "demo_evidence")
    run_with(camera, FakePipeline(build_view([PERSON], [])), window, writer)
    assert not (tmp_path / "demo_evidence").exists() or not list((tmp_path / "demo_evidence").iterdir())


def test_cleanup_releases_camera_closes_window_and_stops_thread(tmp_path):
    camera, window = FakeCamera(n_frames=400, delay=0.002), FakeWindow(quit_after=60)
    code = run_with(camera, FakePipeline(), window, DemoEvidenceWriter(tmp_path))
    assert code == EXIT_OK
    assert camera.released == 1 and window.closed_calls == 1
    assert analysis_threads() == []


def test_ctrl_c_exits_cleanly(tmp_path):
    camera, window = FakeCamera(n_frames=400, delay=0.002), FakeWindow(interrupt_at=5)
    code = run_with(camera, FakePipeline(), window, DemoEvidenceWriter(tmp_path))
    assert code == EXIT_INTERRUPTED
    assert camera.released == 1 and window.closed_calls == 1 and analysis_threads() == []


def test_camera_failure_at_start_is_clean_and_loads_nothing(tmp_path):
    def broken_camera(idx):
        raise CameraUnavailableError("Could not open local camera index 0.")

    def must_not_be_called(*_a, **_k):
        raise AssertionError("must not run after a camera failure")

    code = run(
        args(), open_camera_fn=broken_camera, pipeline_factory=must_not_be_called,
        window_factory=must_not_be_called, evidence_writer=DemoEvidenceWriter(tmp_path / "e"),
    )
    assert code == EXIT_CAMERA
    assert not (tmp_path / "e").exists() and analysis_threads() == []


def test_camera_disconnect_mid_run_exits_with_error_and_cleans_up(tmp_path, monkeypatch):
    monkeypatch.setattr(live_webcam, "MAX_READ_FAILURES", 3)
    monkeypatch.setattr(live_webcam.time, "sleep", lambda s: None)
    camera, window = FakeCamera(n_frames=3), FakeWindow()
    code = run_with(camera, FakePipeline(), window, DemoEvidenceWriter(tmp_path))
    assert code == EXIT_CAMERA
    assert camera.released == 1 and window.closed_calls == 1 and analysis_threads() == []


def test_missing_model_file_is_a_clear_error_and_releases_camera(tmp_path):
    camera, window = FakeCamera(), FakeWindow()
    pipeline = FakePipeline(missing=["models/yolo/yolov8n.pt"])
    code = run_with(camera, pipeline, window, DemoEvidenceWriter(tmp_path))
    assert code == EXIT_SETUP
    assert pipeline.loaded == 0 and camera.released == 1 and window.shown == 0


def test_model_load_failure_is_a_clear_error_and_releases_camera(tmp_path):
    camera = FakeCamera()
    code = run_with(camera, FakePipeline(load_error=RuntimeError("boom")), FakeWindow(), DemoEvidenceWriter(tmp_path))
    assert code == EXIT_SETUP and camera.released == 1


def test_pipeline_reports_missing_files(tmp_path):
    present = tmp_path / "w.pt"
    present.write_text("x")
    pipeline = Pipeline(analyzer=None, face_detector=None, person_detector=lambda f: [], registry=None,
                        required_files=(str(present), str(tmp_path / "nope.pt")))
    assert pipeline.missing_files() == [str(tmp_path / "nope.pt")]


# =========================================================================== #
#  Analysis worker
# =========================================================================== #
def wait_for(predicate, timeout=5.0):
    end = time.monotonic() + timeout
    while time.monotonic() < end:
        if predicate():
            return True
        time.sleep(0.005)
    return False


def test_worker_produces_results_and_stops_cleanly():
    worker = AnalysisWorker(lambda frame: EMPTY_VIEW)
    worker.start()
    worker.submit(BLACK_640)
    assert wait_for(lambda: worker.latest() is not None)
    worker.stop()
    worker.stop()  # idempotent
    assert not worker.is_alive


def test_worker_survives_an_analysis_exception():
    calls = []

    def flaky(frame):
        calls.append(1)
        if len(calls) == 1:
            raise RuntimeError("bad frame")
        return EMPTY_VIEW

    worker = AnalysisWorker(flaky)
    worker.start()
    try:
        worker.submit(BLACK_640)
        assert wait_for(lambda: worker.latest() is not None and worker.latest().seq == 1)
        assert worker.latest().failed is True
        worker.submit(BLACK_640)
        assert wait_for(lambda: worker.latest().seq == 2)
        assert worker.latest().failed is False
    finally:
        worker.stop()


def test_worker_drops_stale_frames_and_analyses_the_latest():
    started, gate, seen = threading.Event(), threading.Event(), []

    def slow(frame):
        seen.append(int(frame[0, 0, 0]))
        started.set()
        gate.wait(5)
        return EMPTY_VIEW

    worker = AnalysisWorker(slow)
    worker.start()
    try:
        worker.submit(np.full((4, 4, 3), 0, np.uint8))
        assert started.wait(5)
        for i in range(1, 5):                       # arrive while the worker is busy
            worker.submit(np.full((4, 4, 3), i, np.uint8))
        gate.set()
        assert wait_for(lambda: len(seen) == 2 and worker.latest().seq == 2)
        assert seen == [0, 4]                       # frames 1-3 were dropped, 4 was analysed
    finally:
        gate.set()
        worker.stop()


# =========================================================================== #
#  Window check / entry point
# =========================================================================== #
class CheckWindow(FakeWindow):
    def __init__(self, closed_after=None):
        super().__init__()
        self.closed_after = closed_after

    def is_closed(self):
        return bool(self.closed_after and self.shown >= self.closed_after)


def test_window_check_opens_shows_and_closes(monkeypatch):
    monkeypatch.setenv("DISPLAY", ":0")
    window = CheckWindow()
    assert live_webcam.window_check(window_factory=lambda t: window, duration=0.1) == EXIT_OK
    assert window.shown > 0 and window.closed_calls == 1


def test_window_check_without_display_fails_before_creating_a_window(monkeypatch):
    monkeypatch.setattr(live_webcam.sys, "platform", "linux")
    monkeypatch.delenv("DISPLAY", raising=False)

    def factory(title):
        raise AssertionError("must not create a window without a display")

    assert live_webcam.window_check(window_factory=factory) == EXIT_GUI


def test_window_check_reports_a_window_that_closes_by_itself(monkeypatch):
    monkeypatch.setenv("DISPLAY", ":0")
    window = CheckWindow(closed_after=20)
    assert live_webcam.window_check(window_factory=lambda t: window, duration=2.0) == EXIT_GUI
    assert window.closed_calls == 1


def test_window_check_survives_window_creation_errors(monkeypatch):
    monkeypatch.setenv("DISPLAY", ":0")

    def factory(title):
        raise cv2.error("no GUI backend")

    assert live_webcam.window_check(window_factory=factory) == EXIT_GUI


def test_main_window_check_needs_no_camera_or_models(monkeypatch):
    monkeypatch.setattr(live_webcam, "window_check", lambda: 0)
    monkeypatch.setattr(live_webcam, "run", lambda a: pytest.fail("run() must not be called"))
    assert live_webcam.main(["--window-check"]) == 0


def test_main_rejects_bad_camera_before_doing_anything():
    with pytest.raises(SystemExit) as exc:
        live_webcam.main(["--camera", "rtsp://x"])
    assert exc.value.code == 2


# =========================================================================== #
#  Isolation: the demo must not reach the database, production cameras or evidence
# =========================================================================== #
FORBIDDEN_PREFIXES = (
    "app.core.config", "app.infrastructure.database", "app.services", "app.repositories",
    "app.infrastructure.camera.stream_manager", "app.infrastructure.camera.camera_factory",
    "app.infrastructure.camera.rtsp_camera", "app.infrastructure.camera.ip_camera",
    "app.infrastructure.storage", "app.api", "app.workers",
    "sqlalchemy", "redis", "celery", "asyncpg", "psycopg2", "alembic",
)


def _imported_modules(path):
    tree = ast.parse(path.read_text())
    found = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            found.update(a.name for a in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            found.add(node.module)
    return found


@pytest.mark.parametrize("path", sorted(DEMO_DIR.glob("*.py")), ids=lambda p: p.name)
def test_demo_source_never_imports_db_services_or_production_camera_code(path):
    bad = [m for m in _imported_modules(path) if m.startswith(FORBIDDEN_PREFIXES)]
    assert bad == []


def test_demo_does_not_ship_its_own_detector():
    for path in DEMO_DIR.glob("*.py"):
        mods = _imported_modules(path)
        assert "ultralytics" not in mods and "face_recognition" not in mods, path.name
        assert "YOLO(" not in path.read_text(), path.name


def test_importing_and_building_the_pipeline_pulls_in_no_db_or_prod_modules(tmp_path):
    """Fresh interpreter, DB/secret env vars removed, empty cwd: nothing forbidden is imported and nothing is written."""
    code = (
        "import sys, json\n"
        "import app.demo.live_webcam as lw\n"
        "p = lw.build_pipeline()\n"
        "bad = sorted(m for m in sys.modules if m.startswith(%r))\n"
        "print(json.dumps({'bad': bad, 'loaded': p.registry.is_loaded}))\n"
    ) % (FORBIDDEN_PREFIXES,)
    env = {k: v for k, v in os.environ.items()
           if not k.upper().startswith(("DATABASE", "POSTGRES", "REDIS", "SECRET", "CELERY"))}
    env["PYTHONPATH"] = str(REPO_ROOT)
    out = subprocess.run([sys.executable, "-c", code], cwd=tmp_path, env=env,
                         capture_output=True, text=True, timeout=180)
    assert out.returncode == 0, out.stderr[-1500:]
    result = json.loads(out.stdout.strip().splitlines()[-1])
    assert result["bad"] == []
    assert result["loaded"] is False                                   # building the pipeline loads no models
    assert not (tmp_path / "media").exists() and not (tmp_path / "demo_evidence").exists()


# =========================================================================== #
#  The demo reuses the EXISTING detection code instead of duplicating it
# =========================================================================== #
def test_pipeline_reuses_existing_detectors(monkeypatch):
    from app.infrastructure.ai.activity_detection.activity_analyzer import activity_analyzer
    from app.infrastructure.ai.activity_detection.posture_analyzer import posture_analyzer
    from app.infrastructure.ai.face_recognition.face_detector import face_detector
    from app.infrastructure.ai.model_registry import model_registry

    face_boxes = [(10, 120, 90, 40)]
    monkeypatch.setattr(face_detector, "detect", lambda frame: face_boxes)
    monkeypatch.setattr(posture_analyzer, "detect_persons", lambda frame: [PERSON])
    analyze_frame = MagicMock(return_value=[PHONE_EVENT])
    monkeypatch.setattr(activity_analyzer, "analyze_frame", analyze_frame)

    pipeline = live_webcam.build_pipeline()
    assert pipeline.analyzer is activity_analyzer
    assert pipeline.face_detector is face_detector
    assert pipeline.registry is model_registry
    assert pipeline.required_files == ("models/yolo/yolov8n.pt",)

    view = pipeline.analyze(BLACK_640)
    analyze_frame.assert_called_once()
    kwargs = analyze_frame.call_args.kwargs
    assert kwargs["camera_id"] == "demo-webcam"
    assert kwargs["zone_config"] is None                    # restricted zones intentionally skipped
    assert kwargs["face_boxes"] == face_boxes               # same face boxes the production loop feeds the eye tracker
    assert view.state == "violation" and view.persons == 1


# =========================================================================== #
#  Demo display policy: the posture-only "Sleeping" fallback is hidden by default,
#  real eye-closure events are not. (Production detector logic is NOT changed.)
# =========================================================================== #
import logging

from app.demo import policy
from app.demo.overlay import hidden_note

POSTURE_ONLY_EVENT = {
    "activity_type": ActivityType.SLEEPING,
    "confidence_score": 0.5,
    "bounding_box": {"x": 40, "y": 60, "w": 550, "h": 380},      # 550 x 380 -> w/h = 1.45 (head-and-shoulders)
    "description": "Person posture suggests lying down / sleeping (no eye data)",
}
EYE_EVENT = dict(POSTURE_ONLY_EVENT, confidence_score=0.75, description="Eyes closed for 2.4s")
EYE_AND_POSTURE_EVENT = dict(POSTURE_ONLY_EVENT, confidence_score=0.9,
                             description="Eyes closed for 2.4s and posture suggests lying down")


def test_policy_hides_posture_only_sleeping_by_default_and_reports_it():
    shown, hidden = policy.apply_display_policy([POSTURE_ONLY_EVENT, PHONE_EVENT])
    assert shown == [PHONE_EVENT]
    assert hidden == ["posture-only sleeping"]            # reported, not silently dropped


def test_policy_can_show_the_raw_posture_only_event():
    shown, hidden = policy.apply_display_policy([POSTURE_ONLY_EVENT], show_posture_only_sleeping=True)
    assert shown == [POSTURE_ONLY_EVENT] and hidden == []


@pytest.mark.parametrize("event", [EYE_EVENT, EYE_AND_POSTURE_EVENT])
def test_policy_always_shows_eye_closure_sleeping(event):
    shown, hidden = policy.apply_display_policy([event])
    assert shown == [event] and hidden == []
    assert policy.has_eye_closure_evidence(event) and not policy.is_posture_only_sleeping(event)


def test_policy_leaves_other_event_types_alone():
    inactivity = {"activity_type": ActivityType.LONG_INACTIVITY, "confidence_score": 0.6,
                  "bounding_box": None, "description": "No movement detected for 1800s"}
    shown, hidden = policy.apply_display_policy([PHONE_EVENT, inactivity])
    assert shown == [PHONE_EVENT, inactivity] and hidden == []


def test_policy_fails_open_for_unrecognised_sleeping_wording():
    odd = dict(POSTURE_ONLY_EVENT, description="Something the analyzer says in a future version")
    shown, hidden = policy.apply_display_policy([odd])
    assert shown == [odd] and hidden == []


# ---- contract tests: the REAL ActivityAnalyzer + the demo policy ------------
EYES_OPEN = {"avg_ear": 0.32, "eyes_closed": False, "sustained_closed": False, "closed_duration_seconds": 0.0}
EYES_CLOSED_2S = {"avg_ear": 0.15, "eyes_closed": True, "sustained_closed": True, "closed_duration_seconds": 2.4}
WIDE_PERSON = {"box": [40, 60, 590, 440], "confidence": 0.87}


def real_pipeline(monkeypatch, *, wide_box, faces, eye_result, phone=None, show_posture_only=False):
    """Real analyze_frame + real Pipeline; only the lowest-level detector outputs are controlled."""
    from app.infrastructure.ai.activity_detection.phone_detector import phone_detector
    from app.infrastructure.ai.activity_detection.posture_analyzer import posture_analyzer
    from app.infrastructure.ai.activity_detection.eye_tracker import eye_tracker
    from app.infrastructure.ai.face_recognition.face_detector import face_detector

    monkeypatch.setattr(posture_analyzer, "analyze", lambda cam, frame: {
        "is_sleeping": wide_box, "is_inactive": False, "inactive_duration_seconds": 0,
        "person_box": WIDE_PERSON["box"]})
    monkeypatch.setattr(posture_analyzer, "detect_persons", lambda frame: [WIDE_PERSON])
    monkeypatch.setattr(eye_tracker, "analyze", lambda cam, frame, box: eye_result)
    monkeypatch.setattr(phone_detector, "is_phone_present", lambda frame: phone)
    monkeypatch.setattr(face_detector, "detect", lambda frame: faces)

    pipeline = live_webcam.build_pipeline()
    pipeline.show_posture_only_sleeping = show_posture_only
    raw = pipeline.analyzer.analyze_frame(camera_id="probe", frame_bgr=BLACK_640, zone_config=None, face_boxes=faces)
    return pipeline, raw


FACE = [(60, 300, 200, 160)]
PHONE_RAW = {"box": [300, 200, 380, 320], "confidence": 0.62, "class_name": "cell phone"}


def test_contract_normal_sitting_is_not_shown_as_sleeping(monkeypatch):
    for faces, eyes in (([], None), (FACE, EYES_OPEN)):           # no face found / eyes measured open
        pipeline, raw = real_pipeline(monkeypatch, wide_box=True, faces=faces, eye_result=eyes)
        # the underlying detector DOES produce the posture-only event ...
        assert [e["description"] for e in raw] == [POSTURE_ONLY_EVENT["description"]]
        assert raw[0]["confidence_score"] == 0.5
        assert policy.is_posture_only_sleeping(raw[0])
        # ... and the demo hides it, says so, and keeps the person green exactly as before
        view = pipeline.analyze(BLACK_640)
        assert view.state == "normal" and view.violations == ()
        assert view.hidden == ("posture-only sleeping",)
        assert view.boxes == build_view([WIDE_PERSON], []).boxes        # person overlay unchanged


def test_contract_eye_closure_is_still_shown(monkeypatch):
    pipeline, raw = real_pipeline(monkeypatch, wide_box=True, faces=FACE, eye_result=EYES_CLOSED_2S)
    assert raw[0]["description"].startswith(policy.EYE_CLOSURE_PREFIX) and raw[0]["confidence_score"] == 0.9
    view = pipeline.analyze(BLACK_640)
    assert view.state == "violation" and view.hidden == ()
    assert view.violations[0].key == "SLEEPING" and view.violations[0].score_text == "Rule score 0.90"
    assert [b.state for b in view.boxes] == ["violation"]          # red replaces the person's green box


def test_contract_eye_closure_with_upright_posture_is_still_shown(monkeypatch):
    pipeline, raw = real_pipeline(monkeypatch, wide_box=False, faces=FACE, eye_result=EYES_CLOSED_2S)
    assert raw[0]["confidence_score"] == 0.75 and raw[0]["description"].startswith(policy.EYE_CLOSURE_PREFIX)
    view = pipeline.analyze(BLACK_640)
    assert view.violations[0].score_text == "Rule score 0.75" and view.hidden == ()


def test_contract_phone_overlay_is_unchanged_while_sleeping_signal_is_hidden(monkeypatch):
    pipeline, _ = real_pipeline(monkeypatch, wide_box=True, faces=FACE, eye_result=EYES_OPEN, phone=PHONE_RAW)
    view = pipeline.analyze(BLACK_640)
    expected = build_view([WIDE_PERSON], [PHONE_EVENT])             # what a phone-only frame looks like
    assert [v.key for v in view.violations] == ["MOBILE_PHONE_USAGE"]
    assert view.boxes == expected.boxes                             # same green person + same red phone box
    assert view.hidden == ("posture-only sleeping",)


def test_contract_flag_restores_the_raw_posture_only_event(monkeypatch):
    pipeline, _ = real_pipeline(monkeypatch, wide_box=True, faces=[], eye_result=None, show_posture_only=True)
    view = pipeline.analyze(BLACK_640)
    assert view.state == "violation" and view.hidden == ()
    assert view.violations[0].score_text == "Rule score 0.50"       # shown as a rule score, never a probability


# ---- status strip + evidence banner ----------------------------------------
def test_hidden_signal_is_named_in_the_status_strip(monkeypatch):
    view = build_view([PERSON], [], hidden=["posture-only sleeping"])
    assert hidden_note(view) == "[hidden: posture-only sleeping]"
    assert hidden_note(build_view([PERSON], [])) is None

    texts = []
    real_put_text = cv2.putText
    monkeypatch.setattr(overlay.cv2, "putText",
                        lambda img, text, *a, **k: (texts.append(text), real_put_text(img, text, *a, **k))[1])
    render_preview(BLACK_640, view, Hud(state="normal", status_text="Normal - person detected",
                                        hidden_note=hidden_note(view)), 640)
    assert "[hidden: posture-only sleeping]" in texts
    texts.clear()
    render_preview(BLACK_640, view, Hud(state="normal", status_text="Normal - person detected"), 640)
    assert not any("hidden" in t for t in texts)


def test_evidence_banner_shows_the_whole_description_when_it_fits_and_ellipsises_when_not(monkeypatch):
    texts = []
    real_put_text = cv2.putText
    monkeypatch.setattr(overlay.cv2, "putText",
                        lambda img, text, *a, **k: (texts.append(text), real_put_text(img, text, *a, **k))[1])
    when = datetime(2026, 10, 17, 9, 0, 0, tzinfo=timezone.utc)

    view = build_view([], [POSTURE_ONLY_EVENT])
    render_evidence(BLACK_640, view, view.violations[0], when)
    assert any(t.endswith("(no eye data)") for t in texts), texts          # previously cut off at "(no eye"

    texts.clear()
    long_view = build_view([], [dict(EYE_EVENT, description="Eyes closed for 2.4s " + "x" * 300)])
    render_evidence(BLACK_640, long_view, long_view.violations[0], when)
    line2 = next(t for t in texts if "UTC" in t)
    assert line2.endswith("...")
    fs = overlay._font_scale(640) * 0.8
    assert cv2.getTextSize(line2, overlay.FONT, fs, 1)[0][0] <= 640 - 24


# ---- run loop with the REAL Pipeline class (fake detectors underneath) ------
class FakeAnalyzer:
    def __init__(self, events):
        self.events = events

    def analyze_frame(self, **kwargs):
        return list(self.events)


class FakeFaces:
    def detect(self, frame):
        return []


class FakeRegistry:
    def load(self):
        pass


def policy_pipeline(events):
    return Pipeline(analyzer=FakeAnalyzer(events), face_detector=FakeFaces(),
                    person_detector=lambda frame: [PERSON], registry=FakeRegistry())


def evidence_names(directory):
    return sorted(p.name for p in directory.glob("*.jpg")) if directory.exists() else []


def test_run_posture_only_sleeping_saves_no_screenshot_and_logs_once(tmp_path, caplog):
    caplog.set_level(logging.INFO, logger="live_webcam_demo")
    camera, window = FakeCamera(n_frames=400, delay=0.004), FakeWindow(quit_after=150)
    code = run_with(camera, policy_pipeline([POSTURE_ONLY_EVENT]), window, DemoEvidenceWriter(tmp_path / "ev"))
    assert code == EXIT_OK
    assert evidence_names(tmp_path / "ev") == []
    notes = [r for r in caplog.records if "display policy" in r.getMessage()]
    assert len(notes) == 1                                           # said once, not every cycle


def test_run_with_flag_saves_the_posture_only_screenshot(tmp_path):
    camera, window = FakeCamera(n_frames=400, delay=0.004), FakeWindow(quit_after=150)
    run_with(camera, policy_pipeline([POSTURE_ONLY_EVENT]), window, DemoEvidenceWriter(tmp_path / "ev"),
             arg_overrides={"show_posture_only_sleeping": True})
    names = evidence_names(tmp_path / "ev")
    assert len(names) == 1 and "sleeping" in names[0]


def test_run_eye_closure_sleeping_still_saves_one_screenshot(tmp_path):
    camera, window = FakeCamera(n_frames=400, delay=0.004), FakeWindow(quit_after=150)
    run_with(camera, policy_pipeline([EYE_EVENT]), window, DemoEvidenceWriter(tmp_path / "ev"))
    names = evidence_names(tmp_path / "ev")
    assert len(names) == 1 and "sleeping" in names[0]
    assert cv2.imread(str(tmp_path / "ev" / names[0])).shape == BLACK_640.shape


def test_run_phone_is_captured_while_posture_only_sleeping_is_not(tmp_path):
    camera, window = FakeCamera(n_frames=400, delay=0.004), FakeWindow(quit_after=150)
    run_with(camera, policy_pipeline([POSTURE_ONLY_EVENT, PHONE_EVENT]), window, DemoEvidenceWriter(tmp_path / "ev"))
    names = evidence_names(tmp_path / "ev")
    assert len(names) == 1 and "mobile_phone_usage" in names[0]
    assert analysis_threads() == [] and camera.released == 1 and window.closed_calls == 1
