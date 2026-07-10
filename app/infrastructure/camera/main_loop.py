"""
Holds reference to the main asyncio event loop, set at app startup.
Camera worker threads use this to schedule async DB calls safely
via asyncio.run_coroutine_threadsafe (threads have no event loop of their own).
"""
import asyncio
from typing import Optional

_main_loop: Optional[asyncio.AbstractEventLoop] = None


def set_main_loop(loop: asyncio.AbstractEventLoop) -> None:
    global _main_loop
    _main_loop = loop


def get_main_loop() -> Optional[asyncio.AbstractEventLoop]:
    return _main_loop
