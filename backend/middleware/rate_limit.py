"""
Rate Limiting Middleware

Protects API endpoints from abuse.
Provides both middleware class and slowapi decorators.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import time
import os
from collections import defaultdict
from threading import Lock


# ==============================================================================
# Simple In-Memory Rate Limiter Middleware
# ==============================================================================

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple rate limiting middleware using in-memory storage.
    For production, use Redis-backed solution.
    """

    def __init__(
        self,
        app,
        general_limit: int = 100,  # requests per minute
        llm_limit: int = 20,       # LLM endpoints per minute
        auth_limit: int = 10       # Auth endpoints per minute
    ):
        super().__init__(app)
        self.general_limit = general_limit
        self.llm_limit = llm_limit
        self.auth_limit = auth_limit
        self.requests = defaultdict(list)
        self.lock = Lock()

    def _get_client_id(self, request: Request) -> str:
        """Get unique client identifier."""
        # Use forwarded IP if behind proxy
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _get_limit_for_path(self, path: str) -> int:
        """Get rate limit based on endpoint path."""
        if "/cos/" in path or "/chat/" in path or "/assist" in path:
            return self.llm_limit
        elif "/auth/" in path or "/sign" in path:
            return self.auth_limit
        return self.general_limit

    def _is_rate_limited(self, client_id: str, path: str) -> bool:
        """Check if client is rate limited."""
        limit = self._get_limit_for_path(path)
        now = time.time()
        window = 60  # 1 minute window

        with self.lock:
            # Clean old requests
            self.requests[client_id] = [
                ts for ts in self.requests[client_id]
                if now - ts < window
            ]

            # Check limit
            if len(self.requests[client_id]) >= limit:
                return True

            # Record request
            self.requests[client_id].append(now)
            return False

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip rate limiting for health checks
        if request.url.path in ["/", "/health", "/docs", "/openapi.json"]:
            return await call_next(request)

        client_id = self._get_client_id(request)

        if self._is_rate_limited(client_id, request.url.path):
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limit_exceeded",
                    "message": "Too many requests. Please slow down.",
                    "retry_after": 60
                }
            )

        return await call_next(request)


# ==============================================================================
# Slowapi-based Rate Limiter (for decorator usage)
# ==============================================================================

# Get rate limit tier from environment
FREE_TIER_LIMIT = os.getenv("FREE_TIER_RATE_LIMIT", "30/minute")
PAID_TIER_LIMIT = os.getenv("PAID_TIER_RATE_LIMIT", "200/minute")


def get_user_identifier(request: Request) -> str:
    """Get unique identifier for rate limiting."""
    if hasattr(request.state, 'user_email'):
        return request.state.user_email
    return get_remote_address(request)


# Create limiter instance
limiter = Limiter(
    key_func=get_user_identifier,
    default_limits=[FREE_TIER_LIMIT],
    storage_uri=os.getenv("REDIS_URL", "memory://")
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """Custom handler for rate limit exceeded."""
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": "Too many requests. Please slow down.",
            "retry_after": str(exc.detail)
        }
    )


# Decorator shortcuts
def free_tier_limit():
    return limiter.limit(FREE_TIER_LIMIT)


def paid_tier_limit():
    return limiter.limit(PAID_TIER_LIMIT)


def ai_endpoint_limit():
    return limiter.limit("10/minute")


def health_check_limit():
    return limiter.limit("60/minute")
