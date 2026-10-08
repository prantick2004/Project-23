"""
Shared slowapi Limiter. Defined here (not in main.py) so routers can apply
stricter per-route limits with @limiter.limit(...) while main.py installs the
middleware and default limits. Keyed by client IP.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
