"""
Screenshot cooldown for the live webcam demo.

A violation can stay active across many consecutive analysis cycles, so saving
a screenshot every cycle would flood the disk. This decides, per violation type,
when a *new* screenshot is justified. It uses a monotonic clock, so wall-clock
changes (NTP, DST, manual edits) cannot cause bursts or long silences.

Rule, per violation type (key):
  * First time it is seen              -> capture.
  * Continuously active                -> capture again only once `cooldown_seconds`
                                          have passed since the last capture.
  * Absent for >= `clear_seconds`,
    then seen again                    -> treated as a genuinely new event and captured
                                          immediately (bypasses the cooldown).
  * Absent for < `clear_seconds`       -> treated as detector flicker; the cooldown applies.

Limitation: the existing pipeline has no per-person tracking IDs, so two people
triggering the same violation type share one key and one cooldown.

This is demo-only and does not change the production cooldown in ActivityService.
"""
import time
from dataclasses import dataclass
from typing import Callable, Dict, Iterable, List

DEFAULT_COOLDOWN_SECONDS = 10.0
DEFAULT_CLEAR_SECONDS = 3.0


@dataclass
class _KeyState:
    last_capture: float
    last_seen: float


class ScreenshotCooldown:
    def __init__(
        self,
        cooldown_seconds: float = DEFAULT_COOLDOWN_SECONDS,
        clear_seconds: float = DEFAULT_CLEAR_SECONDS,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        if cooldown_seconds < 0 or clear_seconds < 0:
            raise ValueError("cooldown_seconds and clear_seconds must be >= 0")
        self.cooldown_seconds = cooldown_seconds
        self.clear_seconds = clear_seconds
        self._clock = clock
        self._state: Dict[str, _KeyState] = {}

    def update(self, active_keys: Iterable[str]) -> List[str]:
        """
        Call once per analysis result with the violation types currently active.
        Returns the (sorted) keys that should be captured now.
        """
        now = self._clock()
        to_capture: List[str] = []
        for key in sorted(set(active_keys)):
            state = self._state.get(key)
            if state is None:
                capture = True
            else:
                reappeared = (now - state.last_seen) >= self.clear_seconds
                cooled_down = (now - state.last_capture) >= self.cooldown_seconds
                capture = reappeared or cooled_down

            if state is None:
                self._state[key] = _KeyState(last_capture=now, last_seen=now)
            else:
                state.last_seen = now
                if capture:
                    state.last_capture = now

            if capture:
                to_capture.append(key)
        return to_capture
