# Live Webcam Detection Demo

A **local-only** tool for checking, with your laptop's webcam, what the project's existing
detection pipeline reports before you connect a real CCTV camera. It opens a small desktop
window with the live video, draws green/red boxes from the existing detectors, and saves a
screenshot when the pipeline reports a violation.

It is **not** part of the monitoring system. It never touches the database, Redis, Celery,
attendance, alerts, production cameras, or production evidence (see [Isolation](#isolation)).

## Requirements

Everything is already in the project's `venv`; nothing needs installing.

| Needed | Where it comes from |
|---|---|
| OpenCV with a desktop-window backend | `opencv-python` (built with Qt5) |
| YOLO / dlib models | `ultralytics`, `torch` (CPU), `face_recognition` (already installed) |
| YOLO weights | `models/yolo/yolov8n.pt` (must exist; **nothing is downloaded**) |
| A desktop session | X11, or Wayland with XWayland (`$DISPLAY` must be set) |
| A local webcam | e.g. the built-in "Integrated Camera" |

Run it **on the host, not in Docker**: the container has no display.

## Run it

From the repository root:

```bash
./venv/bin/python -m app.demo.live_webcam
```

Options:

| Option | Meaning | Default |
|---|---|---|
| `--camera N` | Local camera index (a whole number 0–31). URLs, `rtsp://…` and device paths are **rejected**. | `0` |
| `--cooldown S` | Seconds before the *same ongoing* violation is captured again (1–600). | `10` |
| `--preview-width PX` | Preview width in pixels (320–1920). | `640` |
| `--show-posture-only-sleeping` | Also display the existing posture-only "Sleeping" signal (see [below](#the-posture-only-sleeping-signal-hidden-by-default)). | off (hidden) |
| `--window-check` | Open the window with a synthetic frame and exit. No camera, no models. | off |

Choosing a camera: most laptops expose two device nodes per camera (`/dev/video0` is the video
stream, `/dev/video1` is usually metadata only). Start with `0`. If it fails with "delivered no
frames", try `--camera 1` or another index.

## Quit safely

Press **`q`** or **`Esc`** in the window (or close the window, or press `Ctrl+C` in the terminal).
The analysis thread is stopped, the camera is released, and the window is closed.

Exit codes: `0` normal · `2` camera unavailable / stopped delivering frames · `3` models or
dependencies failed to load · `4` window/display problem · `130` Ctrl+C.

## Reading the window

A status strip above the video shows the current state, counters and analysis speed. Boxes
are drawn on the video:

* **Green box** – a person was detected and no violation covers that person. Label: `Person 0.87`
  (real YOLO confidence).
* **Red box** – the existing pipeline reported a violation. The label is the pipeline's own event
  name plus its score.
* Status dot: green = normal, red = violation, grey = no person / warming up / stalled.
* **Events** counts violations that qualified for a screenshot (see cooldown below);
  **Screenshots** counts files actually written.
* Boxes come from the most recent analysis, which runs a few times per second, so they can
  trail a moving subject slightly. "age" is how old that result is.

### Two kinds of numbers

| Label | Meaning |
|---|---|
| `conf 0.62` | A real YOLO model confidence (phones, restricted zones). |
| `Rule score 0.75` | A **fixed value assigned by an existing rule** (sleeping, long inactivity). It is **not** a probability and is not calibrated. |

## What the existing pipeline can and cannot detect

| Detection | How it works in the existing code | Box | Shown in the demo? |
|---|---|---|---|
| Person | YOLOv8n "person", threshold 0.5 | every person | Yes (green) |
| Phone | YOLOv8n "cell phone", threshold 0.45. Means **a phone is visible in the frame**; it does **not** check who is holding it or using it. | on the phone | Yes (red, on the phone) |
| Sleeping (eye closure) | Rule: eyes closed for ≥ 2 s (dlib eye-aspect-ratio < 0.21, **first detected face only**, needs a detected, reasonably frontal face). Rule scores 0.9 (with a wide box) / 0.75. | the top person box | Yes (red) |
| Sleeping (posture-only) | Fallback: the top person box is ≥ 1.3× wider than tall. **No eye evidence needed.** Fixed rule score 0.50. | the top person box | **Hidden by default** (see below) |
| Long inactivity | Person hasn't moved for 30 minutes. | person | Cannot be demonstrated in a short session |
| Restricted area | Needs polygons from a camera's `zone_config`. | person | **Skipped**: the demo has no zone configuration |

There is no separate "drowsiness" signal (no yawning or head-nod detection), and the pipeline has no
person tracking, so boxes carry no tracking IDs.

## The posture-only "Sleeping" signal (hidden by default)

**What went wrong in the first smoke test:** the demo showed `Sleeping` for someone sitting normally.
Every screenshot's banner read `Sleeping - Rule score 0.50 ... Person posture suggests lying down / sleeping`,
i.e. the **posture-only fallback**, not the eye-closure rule. A person sitting at a laptop shows head,
shoulders and arms, so the person box is about as wide as it is tall; on the captured frames its
width/height ratio ranged from about 1.0 to 1.5 and crossed the rule's 1.3 threshold. The existing
code needs nothing else to emit the event: its branch is `if eyes closed >= 2 s ... elif box wide`, so
even eyes measured **open** do not stop it (its "(no eye data)" wording is not always accurate; that
is existing production behaviour and was not changed).

**What the demo does about it (demo-only display policy, `app/demo/policy.py`):**

* The posture-only event is **not displayed and no screenshot is taken for it**. It is recognised by its
  existing description text ("Person posture suggests lying down / sleeping...").
* It is **not denied**: the status strip shows a grey `[hidden: posture-only sleeping]` note whenever the
  pipeline produced it, and the terminal logs it once per run.
* Real eye-closure sleeping events, phone events and person boxes are shown **exactly as before**.
* Run with `--show-posture-only-sleeping` to display the raw posture-only event (red box, "Rule score 0.50").
* Production detection code, thresholds and behaviour are unchanged; this affects only what the demo draws
  and screenshots. Contract tests run the real `ActivityAnalyzer` and fail loudly if its wording ever changes;
  an unrecognised sleeping event is shown rather than hidden.

This is **not** a claim that sleeping can be reliably determined from a webcam. The remaining eye-closure rule
is a fixed-threshold heuristic that needs a detected face (the first one only) and 2 s of continuous closure.
It has not been validated here; for example, looking down at a keyboard may lower the measured eye openness and
could trigger it (untested). The demo shows whatever it reports.

## Screenshots

* Saved to **`demo_evidence/`** in the repository root (created on first use, owner-only
  permissions where the umask allows). There is no option to change the location.
* Names look like `demo_20261017T123005Z_mobile_phone_usage_a1b2c3d4.jpg`: UTC time, sanitised
  violation type, random suffix. Files are created exclusively; an existing file is never overwritten.
* Each image is the **full-resolution analysed frame** with the boxes, labels, a violation label,
  its score, and a UTC timestamp on a bottom banner. A very long pipeline description is shortened with `...`.
* `demo_evidence/` is git-ignored. The images can contain your face: delete them when finished.
* The demo never writes database records, alerts, or anything to `media/`.

### Duplicate suppression

A violation can stay active for many analysis cycles, so screenshots are rate-limited **per
violation type** using a monotonic clock:

1. First time a type is seen: **capture**.
2. Still continuously active: capture again only after `--cooldown` seconds (default 10).
3. Absent for ≥ 3 seconds and then seen again: treated as a **new event**, captured immediately.
4. Absent for < 3 seconds: treated as detector flicker; the cooldown still applies.

Limitations: with no person IDs, two people triggering the same type share one cooldown. If
analysis stalls for ≥ 3 seconds, a still-active violation counts as a new event. This rule is
independent of (and does not change) the production cooldown in `ActivityService`.

## Performance

Measured on the development machine (CPU only), synthetic 640×480 frames, one analysis cycle =
face detection + `analyze_frame` + the extra person pass for green boxes:

| Step | Median |
|---|---|
| Face detection (HOG) | ~160 ms |
| One YOLO pass | ~135 ms |
| `analyze_frame` (2 YOLO passes, as production runs it) | ~290 ms |
| Whole cycle | ~640 ms → about **1.6 analyses per second** |

The video itself keeps running at camera speed (analysis is on a separate thread). At 1280×720,
face detection is about 3× slower, so the demo asks the camera for 640×480 (a best-effort camera
setting; it does not change detection logic or thresholds). Real frames with faces will add some
time for eye landmarks.

## Troubleshooting

| Symptom | What to try |
|---|---|
| `Could not open local camera index N` | Another program is using the camera (browser tab, video call, or the production USB camera stream). Close it and retry. Check access with `ls -l /dev/video0`. |
| `opened but delivered no frames` | Wrong device node (e.g. a metadata node), privacy shutter, or busy device. Try another `--camera` index. |
| `No display found ($DISPLAY is not set)` | Run from a terminal inside your desktop session. |
| Window does not open / Qt error | Run `./venv/bin/python -m app.demo.live_webcam --window-check`. If it fails, try `QT_QPA_PLATFORM=xcb`. The line "Ignoring XDG_SESSION_TYPE=wayland" is a harmless notice. |
| `Model file not found: models/yolo/yolov8n.pt` | Run from the repository root. The demo will not download weights. |
| Slow boxes / low analysis rate | Expected on CPU (see Performance). Lower `--preview-width` only affects drawing, not analysis. |

## Limitations

* This checks that the **existing pipeline runs and reports events**; it does not prove the models
  are accurate. YOLOv8n is a small model and may miss phones or people at some distances or angles.
* The sleeping **posture fallback** (wide person box) was tuned for CCTV views and fires for normal
  laptop-webcam framing, so the demo hides it by default (see above). Use `--show-posture-only-sleeping`
  to see it.
* Eye-closure detection needs a clear, frontal, detected face (the first one only), uses fixed thresholds,
  and has not been validated against false positives such as looking down.
* Restricted-zone and 30-minute inactivity detection are not exercised by this demo.

## Isolation

The demo is a separate process that reuses only the *pure detection* code
(`ActivityAnalyzer`, `PostureAnalyzer.detect_persons`, `FaceDetector`, `ModelRegistry`) and
`USBCameraStream`. It does **not** import the production stream manager, camera factory,
evidence handler, any service/repository, the database layer, or settings. It opens a numeric
local camera index only, so there is no path to RTSP/IP streams. Automated tests enforce this
(static import checks plus a fresh-interpreter check that no database or production module is loaded).

## Tests

```bash
./venv/bin/python -m pytest tests/test_demo_live_webcam.py -q
```

These are unit tests with mocked frames, camera, window and pipeline: they need no webcam or
display. They verify the demo's own logic, not real-world detection quality.

### Manual webcam smoke test (needs you)

1. `./venv/bin/python -m app.demo.live_webcam --window-check` → a window flashes, exit code 0.
2. `./venv/bin/python -m app.demo.live_webcam` → the live video appears; you get a green `Person` box.
3. Hold a phone in view → a red `Phone detected` box and a screenshot in `demo_evidence/`.
4. Sit normally → green `Person` box and a grey `[hidden: posture-only sleeping]` note (no red box, no screenshot).
   Then face the camera with your eyes closed for ~3 seconds → a red `Sleeping` box with `Rule score 0.75/0.90`
   (this needs your face to be detected; if it is not, no eye-closure event is possible).
5. Press `q`; confirm the camera light turns off.
