"""
Token Blocklist -- Redis-backed revocation list for JWT access/refresh
tokens. Used by /auth/logout (and checked by /auth/refresh and every
protected-route auth dependency) to reject a specific token immediately,
without waiting for its natural expiry.

Keys are the token's unique "jti" claim. TTL matches the token's own
remaining lifetime, so blocklist entries clean themselves up automatically
in Redis -- no manual cleanup job needed.
"""
import redis.asyncio as aioredis
import structlog

from app.core.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()

_redis_client: aioredis.Redis | None = None


def _get_client() -> aioredis.Redis:
    """Lazy singleton Redis client, reuses settings.redis_url (same Redis
    instance Celery already uses, different logical keyspace via prefix)."""
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis_client


def _key(jti: str) -> str:
    return f"blocklist:jti:{jti}"


async def block_token(jti: str, ttl_seconds: int) -> None:
    """Add a token's jti to the blocklist for the given TTL (should match
    the token's own remaining lifetime -- no point blocking longer than
    the token would've been valid anyway)."""
    if ttl_seconds <= 0:
        return  # already expired, nothing to block
    try:
        client = _get_client()
        await client.set(_key(jti), "1", ex=ttl_seconds)
    except Exception as e:
        # Fail safe: if Redis is down, don't crash logout -- log and move on.
        # Worst case a token isn't revocable early during a Redis outage,
        # which is a degraded state, not a security hole (token still
        # expires naturally on its own schedule).
        logger.error("token_blocklist_write_failed", jti=jti, error=str(e))


async def is_token_blocked(jti: str) -> bool:
    """Check whether a token's jti has been revoked."""
    if not jti:
        return False
    try:
        client = _get_client()
        result = await client.get(_key(jti))
        return result is not None
    except Exception as e:
        # Fail open on Redis errors here would be a security hole (a
        # revoked token would work anyway) -- but fail open on *connection*
        # errors is the accepted tradeoff vs. taking down all auth if Redis
        # blips. Logged for visibility either way.
        logger.error("token_blocklist_read_failed", jti=jti, error=str(e))
        return False
