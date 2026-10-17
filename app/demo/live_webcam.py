"""
Live webcam detection demo (LOCAL ONLY).

Run from the repository root, on the host (not in Docker):

    ./venv/bin/python -m app.demo.live_webcam            # camera index 0
    ./venv/bin/python -m app.demo.live_webcam --camera 1
    ./venv/bin/python -m app.demo.live_webcam --window-check   # GUI check, no camera

It opens a laptop/USB webcam and runs the project's EXISTING detection code
(ActivityAnalyzer, PostureAnalyzer's person detector, FaceDetector, and the
shared ModelRegistry) on the live frames, drawing green/red boxes. It does NOT
use the production camera manager, database, Redis, attendance, alerts, or the
production evidence store, and it never opens RTSP/IP streams. Screenshots go to
<repo>/demo_evidence/ only.

See docs/live_webcam_demo.md.
"""
from __future__ import annotations

import argparse
import logging
import os
import re
import sys
import threading
import time
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Deque, List, Optional, Tuple

import cv2
import numpy as np

# Light, DB-free modules only. (Never import stream_manager, camera_factory,
# media_handler, evidence/activity/attendance services, or app.core.config here.)
from app.infrastructure.camera.usb_camera import USBCameraStream
from app.demo.cooldown import DEFAULT_COOLDOWN_SECONDS, ScreenshotCooldown
from app.demo.evidence import DemoEvidenceWriter
from app.demo.policy import apply_display_policy
from app.demo.overlay import (
    EMPTY_VIEW,
    DetectionView,
    Hud,
    build_view,
    hidden_note,
    render_evidence,
    render_preview,
)

logger = logging.getLogger("live_webcam_demo")

DEMO_CAMERA_ID = "demo-webcam"          # used for the analyzers' per-camera state only
WINDOW_TITLE = "Live Webcam Detection Demo (local)"
REQUEST_WIDTH, REQUEST_HEIGHT = 640, 480  # best-effort request; keeps face detection fast
MAX_CAMERA_INDEX = 31
WARMUP_READS = 30                        # webcams often return empty first frames
MAX_READ_FAILURES = 60
STALE_RESULT_SECONDS = 5.0
NOTICE_SECONDS = 2.5
MIN_FRAMES_BEFORE_CLOSE_CHECK = 10

EXIT_OK = 0
EXIT_CAMERA = 2
EXIT_SETUP = 3
EXIT_GUI = 4
EXIT_INTERRUPTED = 130


class CameraUnavailableError(RuntimeError):
    """The requested local camera could not be opened or produced no frames."""


# --------------------------------------------------------------------------- #
#  Command line
# --------------------------------------------------------------------------- #
_INDEX_RE = re.compile(r"[0-9]{1,2}")


def parse_camera_index(value: str) -> int:
    """Accept only a small whole number. URLs, device paths, and negatives are rejected."""
    text = str(value).strip()
    if not _INDEX_RE.fullmatch(text) or int(text) > MAX_CAMERA_INDEX:
        raise argparse.ArgumentTypeError(
            f"--camera must be a local camera index between 0 and {MAX_CAMERA_INDEX} (e.g. 0). "
            "URLs and device paths are not accepted."
        )
    return int(text)


def _bounded_float(low: float, high: float) -> Callable[[str], float]:
    def parse(value: str) -> float:
        try:
            number = float(value)
        except ValueError:
            raise argparse.ArgumentTypeError(f"{value!r} is not a number")
        if not (low <= number <= high):
            raise argparse.ArgumentTypeError(f"must be between {low:g} and {high:g}")
        return number
    return parse


def _bounded_int(low: int, high: int) -> Callable[[str], int]:
    def parse(value: str) -> int:
        try:
            number = int(value)
        except ValueError:
            raise argparse.ArgumentTypeError(f"{value!r} is not a whole number")
        if not (low <= number <= high):
            raise argparse.ArgumentTypeError(f"must be between {low} and {high}")
        return number
    return parse


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="python -m app.demo.live_webcam",
        description="Local live-webcam demo of the existing detection pipeline. "
        "Screenshots are saved only to demo_evidence/. Nothing is written to the database.",
    )
    parser.add_argument("--camera", type=parse_camera_index, default=0,
                        help="local camera index (default: 0)")
    parser.add_argument("--cooldown", type=_bounded_float(1, 600), default=DEFAULT_COOLDOWN_SECONDS,
                        help=f"seconds before the same ongoing violation is captured again (default: {DEFAULT_COOLDOWN_SECONDS:g})")
    parser.add_argument("--preview-width", type=_bounded_int(320, 1920), default=640,
                        help="width of the preview window in pixels (default: 640)")
    parser.add_argument("--show-posture-only-sleeping", action="store_true",
                        help="also display the existing posture-only 'Sleeping' signal (person box wider than tall, "
                             "fixed rule score 0.50). Hidden by default because it fires for normal head-and-shoulders "
                             "webcam framing; eye-closure sleeping events are always shown")
    parser.add_argument("--window-check", action="store_true",
                        help="open the window with a synthetic frame (no camera, no models) and exit")
    return parser.parse_args(argv)


# --------------------------------------------------------------------------- #
#  Camera (USB / local index only)
# --------------------------------------------------------------------------- #
def open_camera(index: int, *, stream_factory: Callable[..., Any] = USBCameraStream,
                sleep: Callable[[float], None] = time.sleep) -> Tuple[Any, np.ndarray]:
    """
    Open a LOCAL camera by integer index and return (stream, first_frame).
    Uses USBCameraStream directly (not CameraFactory), so there is no code path to
    an RTSP/IP URL, and no camera record is read or written.
    """
    stream = stream_factory(str(int(index)), DEMO_CAMERA_ID)
    if not stream.connect():
        stream.release()
        raise CameraUnavailableError(
            f"Could not open local camera index {index}. Make sure no other application "
            f"(including the production USB camera) is using it and that you can access "
            f"/dev/video{index}."
        )

    cap = getattr(stream, "cap", None)
    if cap is not None:
        try:  # best effort: the camera may ignore this
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, REQUEST_WIDTH)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, REQUEST_HEIGHT)
        except cv2.error:
            logger.debug("Camera ignored the resolution request")

    for _ in range(WARMUP_READS):
        frame = stream.read_frame()
        if frame is not None:
            return stream, frame
        sleep(0.1)

    stream.release()
    raise CameraUnavailableError(
        f"Camera index {index} opened but delivered no frames. It may be busy, blocked by "
        "privacy settings, or a metadata-only device node. Try a different --camera index."
    )


# --------------------------------------------------------------------------- #
#  Existing detection pipeline (reused, not re-implemented)
# --------------------------------------------------------------------------- #
@dataclass
class Pipeline:
    analyzer: Any            # ActivityAnalyzer
    face_detector: Any       # FaceDetector
    person_detector: Callable[[np.ndarray], list]  # PostureAnalyzer.detect_persons
    registry: Any            # ModelRegistry (loads YOLO + warms dlib)
    required_files: Tuple[str, ...] = ()
    # Demo display policy (app/demo/policy.py): False hides the posture-only sleeping fallback.
    show_posture_only_sleeping: bool = False
    _hidden_logged: bool = field(default=False, repr=False)

    def load(self) -> None:
        self.registry.load()

    def missing_files(self) -> List[str]:
        return [p for p in self.required_files if not Path(p).is_file()]

    def analyze(self, frame: np.ndarray) -> DetectionView:
        # Same call shape the production activity loop uses; zone_config=None because
        # no restricted zones are configured for the demo.
        faces = self.face_detector.detect(frame)
        events = self.analyzer.analyze_frame(
            camera_id=DEMO_CAMERA_ID, frame_bgr=frame, zone_config=None, face_boxes=faces
        )
        persons = self.person_detector(frame)

        shown, hidden = apply_display_policy(events, show_posture_only_sleeping=self.show_posture_only_sleeping)
        if hidden and not self._hidden_logged:
            self._hidden_logged = True
            logger.info(
                "Demo display policy: the pipeline reported a %s signal; it is hidden in the demo "
                "(shown as a grey note). Use --show-posture-only-sleeping to display it.",
                ", ".join(hidden),
            )
        return build_view(persons, shown, hidden)


def build_pipeline() -> Pipeline:
    """Import the existing singletons lazily (heavy: torch, ultralytics, dlib). Loads nothing yet."""
    from app.infrastructure.ai.model_registry import model_registry
    from app.infrastructure.ai.activity_detection.activity_analyzer import activity_analyzer
    from app.infrastructure.ai.activity_detection.posture_analyzer import posture_analyzer
    from app.infrastructure.ai.activity_detection.yolo_detector import MODEL_PATH
    from app.infrastructure.ai.face_recognition.face_detector import face_detector

    return Pipeline(
        analyzer=activity_analyzer,
        face_detector=face_detector,
        person_detector=posture_analyzer.detect_persons,
        registry=model_registry,
        required_files=(MODEL_PATH,),
    )


# --------------------------------------------------------------------------- #
#  Background analysis thread (latest-frame-wins, no queue growth)
# --------------------------------------------------------------------------- #
@dataclass(frozen=True)
class AnalysisResult:
    seq: int
    frame: np.ndarray
    view: DetectionView
    finished_at: float
    duration: float
    failed: bool = False


class AnalysisWorker:
    """
    Runs the pipeline on the most recent submitted frame, on its own thread, so slow
    inference never freezes the live preview. Frames submitted while it is busy
    replace the pending one (older frames are dropped).
    """

    def __init__(self, analyze_fn: Callable[[np.ndarray], DetectionView],
                 clock: Callable[[], float] = time.monotonic) -> None:
        self._analyze = analyze_fn
        self._clock = clock
        self._cond = threading.Condition()
        self._pending: Optional[np.ndarray] = None
        self._result: Optional[AnalysisResult] = None
        self._seq = 0
        self._stop = False
        self._thread = threading.Thread(target=self._run, name="demo-analysis", daemon=True)

    def start(self) -> None:
        self._thread.start()

    def submit(self, frame: np.ndarray) -> None:
        with self._cond:
            self._pending = frame.copy()
            self._cond.notify()

    def latest(self) -> Optional[AnalysisResult]:
        with self._cond:
            return self._result

    def stop(self, timeout: float = 10.0) -> None:
        with self._cond:
            self._stop = True
            self._cond.notify_all()
        if self._thread.is_alive():
            self._thread.join(timeout)

    @property
    def is_alive(self) -> bool:
        return self._thread.is_alive()

    def _run(self) -> None:
        while True:
            with self._cond:
                while self._pending is None and not self._stop:
                    self._cond.wait(timeout=0.25)
                if self._stop:
                    return
                frame, self._pending = self._pending, None

            started = self._clock()
            failed = False
            try:
                view = self._analyze(frame)
            except Exception:  # noqa: BLE001 - a worker thread must survive one bad frame; logged below
                logger.exception("Analysis failed for one frame; continuing")
                view, failed = EMPTY_VIEW, True
            finished = self._clock()

            with self._cond:
                self._seq += 1
                self._result = AnalysisResult(self._seq, frame, view, finished, finished - started, failed)


# --------------------------------------------------------------------------- #
#  Desktop window
# --------------------------------------------------------------------------- #
class CvWindow:
    """Thin wrapper over OpenCV's window so the run loop can be tested without a display."""

    def __init__(self, title: str = WINDOW_TITLE) -> None:
        self.title = title
        cv2.namedWindow(title, cv2.WINDOW_AUTOSIZE)

    def show(self, image: np.ndarray) -> None:
        cv2.imshow(self.title, image)

    def poll_key(self) -> int:
        return cv2.waitKey(1) & 0xFF

    def is_closed(self) -> bool:
        try:
            return cv2.getWindowProperty(self.title, cv2.WND_PROP_VISIBLE) < 1
        except cv2.error:
            return True

    def close(self) -> None:
        try:
            cv2.destroyAllWindows()
            for _ in range(3):  # let the GUI event loop process the close
                cv2.waitKey(1)
        except cv2.error:
            pass


def gui_environment_problem() -> Optional[str]:
    """OpenCV's bundled Qt needs an X11/XWayland display; without one Qt aborts the process."""
    if sys.platform.startswith("linux") and not os.environ.get("DISPLAY"):
        return ("No display found ($DISPLAY is not set). Run this from a terminal inside your "
                "desktop session. On Wayland, XWayland must be available; if the window still "
                "fails to open, try: QT_QPA_PLATFORM=xcb")
    return None


def window_check(window_factory: Callable[[str], Any] = CvWindow, duration: float = 1.5,
                 clock: Callable[[], float] = time.monotonic) -> int:
    """Open the window with a synthetic frame (no camera, no models) and close it again."""
    problem = gui_environment_problem()
    if problem:
        logger.error(problem)
        return EXIT_GUI

    gradient = np.tile(np.linspace(30, 90, REQUEST_WIDTH, dtype=np.uint8), (REQUEST_HEIGHT, 1))
    frame = cv2.merge([gradient, gradient // 2, gradient // 3])
    sample = build_view(
        persons=[{"box": [70, 70, 300, 440], "confidence": 0.91}],
        events=[{"activity_type": "MOBILE_PHONE_USAGE", "confidence_score": 0.62,
                 "bounding_box": {"x": 360, "y": 220, "w": 90, "h": 150}, "description": "sample"}],
    )
    hud = Hud(state="check", status_text="WINDOW CHECK - sample boxes, no camera")

    window = None
    try:
        window = window_factory(WINDOW_TITLE)
        end = clock() + duration
        shown = 0
        while clock() < end:
            window.show(render_preview(frame, sample, hud, REQUEST_WIDTH))
            window.poll_key()
            shown += 1
            if shown > MIN_FRAMES_BEFORE_CLOSE_CHECK and window.is_closed():
                logger.error("The window reported itself closed while it should be open")
                return EXIT_GUI
        logger.info("Window check OK: displayed %d frame(s) and closed cleanly.", shown)
        return EXIT_OK
    except Exception as exc:  # noqa: BLE001 - report any GUI failure with a helpful hint
        logger.error("Could not open a desktop window: %s. Try: QT_QPA_PLATFORM=xcb", exc)
        return EXIT_GUI
    finally:
        if window is not None:
            window.close()


# --------------------------------------------------------------------------- #
#  Main run loop
# --------------------------------------------------------------------------- #
def _status_for(result: Optional[AnalysisResult], age: Optional[float]) -> Tuple[str, str, DetectionView]:
    if result is None:
        return "starting", "Warming up...", EMPTY_VIEW
    if age is not None and age > STALE_RESULT_SECONDS:
        return "stalled", "Analysis stalled", EMPTY_VIEW
    if result.failed:
        return "stalled", "Analysis error (see terminal)", EMPTY_VIEW
    view = result.view
    if view.violations:
        return "violation", "VIOLATION: " + ", ".join(v.label for v in view.violations), view
    if view.persons:
        return "normal", "Normal - person detected", view
    return "idle", "No person detected", view


def run(
    args: argparse.Namespace,
    *,
    open_camera_fn: Callable[[int], Tuple[Any, np.ndarray]] = open_camera,
    pipeline_factory: Callable[[], Pipeline] = build_pipeline,
    window_factory: Callable[[str], Any] = CvWindow,
    evidence_writer: Optional[DemoEvidenceWriter] = None,
    clock: Callable[[], float] = time.monotonic,
    now_fn: Callable[[], datetime] = lambda: datetime.now(timezone.utc),
) -> int:
    writer = evidence_writer or DemoEvidenceWriter()
    cooldown = ScreenshotCooldown(cooldown_seconds=args.cooldown, clock=clock)

    stream = worker = window = None
    exit_code = EXIT_OK
    try:
        try:
            stream, frame = open_camera_fn(args.camera)
        except CameraUnavailableError as exc:
            logger.error("%s", exc)
            return EXIT_CAMERA

        logger.info("Loading detection models (the first start can take several seconds)...")
        try:
            pipeline = pipeline_factory()
            pipeline.show_posture_only_sleeping = bool(getattr(args, "show_posture_only_sleeping", False))
            missing = pipeline.missing_files()
            if missing:
                logger.error(
                    "Model file not found: %s. Run the demo from the repository root so the "
                    "relative model path resolves. (Nothing will be downloaded.)", ", ".join(missing))
                return EXIT_SETUP
            pipeline.load()
        except Exception as exc:  # noqa: BLE001 - report any model/dependency failure clearly
            logger.error("Could not load the detection models: %s", exc)
            return EXIT_SETUP

        window = window_factory(WINDOW_TITLE)
        worker = AnalysisWorker(pipeline.analyze, clock=clock)
        worker.start()

        logger.info("Demo running on camera %s. Press q or Esc in the window to quit.", args.camera)
        failures = shown = events = shots = last_seq = 0
        notice: Optional[str] = None
        notice_until = 0.0
        finish_times: Deque[float] = deque(maxlen=6)

        while True:
            if frame is None:
                failures += 1
                if failures >= MAX_READ_FAILURES:
                    logger.error("The camera stopped delivering frames (unplugged or taken by another app).")
                    exit_code = EXIT_CAMERA
                    break
                time.sleep(0.03)
                frame = stream.read_frame()
                continue
            failures = 0

            worker.submit(frame)
            result = worker.latest()

            if result is not None and result.seq != last_seq:
                last_seq = result.seq
                finish_times.append(result.finished_at)
                if not result.failed:
                    active = {v.key: v for v in result.view.violations}
                    for key in cooldown.update(active):
                        events += 1
                        evidence = render_evidence(result.frame, result.view, active[key], now_fn())
                        path = writer.save(evidence, key, now_fn())
                        if path is not None:
                            shots += 1
                            notice, notice_until = path.name, clock() + NOTICE_SECONDS
                            logger.info("Violation (%s): screenshot saved to %s", key, path)
                        else:
                            logger.warning("Violation (%s): screenshot could not be saved", key)

            age = None if result is None else clock() - result.finished_at
            state, text, view = _status_for(result, age)
            fps = None
            if len(finish_times) >= 2 and finish_times[-1] > finish_times[0]:
                fps = (len(finish_times) - 1) / (finish_times[-1] - finish_times[0])
            hud = Hud(
                state=state, status_text=text, persons=view.persons, events=events, screenshots=shots,
                analysis_fps=fps, analysis_age=age,
                saved_notice=notice if clock() < notice_until else None,
                hidden_note=hidden_note(view),
            )

            window.show(render_preview(frame, view, hud, args.preview_width))
            shown += 1
            key = window.poll_key()
            if key in (ord("q"), ord("Q"), 27):
                break
            if shown > MIN_FRAMES_BEFORE_CLOSE_CHECK and window.is_closed():
                break
            frame = stream.read_frame()

    except KeyboardInterrupt:
        logger.info("Interrupted (Ctrl+C). Shutting down...")
        exit_code = EXIT_INTERRUPTED
    finally:
        if worker is not None:
            worker.stop()
        if stream is not None:
            stream.release()
        if window is not None:
            window.close()
        logger.info("Camera released and window closed.")
    return exit_code


def main(argv: Optional[List[str]] = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    args = parse_args(argv)

    if args.window_check:
        return window_check()

    problem = gui_environment_problem()
    if problem:
        logger.error(problem)
        return EXIT_GUI
    return run(args)


if __name__ == "__main__":
    sys.exit(main())
