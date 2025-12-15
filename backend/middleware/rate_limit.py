"""
Rate limiting middleware for FastAPI.
Protects endpoints from abuse and prevents LLM cost explosion.
"""
import time
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Tuple
import asyncio


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    IP-based rate limiting middleware.
    
    Default limits:
    - General endpoints: 100 requests per minute
    - LLM endpoints (/chat, /analyze, /insights): 20 requests per minute
    - Auth endpoints: 10 requests per minute
    """
    
    def __init__(
        self,
        app,
        general_limit: int = 100,
        general_window: int = 60,
        llm_limit: int = 20,
        llm_window: int = 60,
        auth_limit: int = 10,
        auth_window: int = 60,
    ):
        super().__init__(app)
        self.general_limit = general_limit
        self.general_window = general_window
        self.llm_limit = llm_limit
        self.llm_window = llm_window
        self.auth_limit = auth_limit
        self.auth_window = auth_window
        
        # Store: {ip: [(timestamp, endpoint_type), ...]}
        self.requests: Dict[str, list] = defaultdict(list)
        
        # LLM-heavy endpoints
        self.llm_endpoints = {
            "/chat", "/analyze", "/insights", "/morning-checkin",
            "/evening-review", "/life-decision", "/weekly-review"
        }
        
        # Auth endpoints
        self.auth_endpoints = {"/users/onboard", "/sign-in", "/sign-up"}
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, handling proxies."""
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
    
    def _get_endpoint_type(self, path: str) -> str:
        """Categorize endpoint for rate limiting."""
        for llm_path in self.llm_endpoints:
            if llm_path in path:
                return "llm"
        for auth_path in self.auth_endpoints:
            if auth_path in path:
                return "auth"
        return "general"
    
    def _clean_old_requests(self, ip: str, window: int):
        """Remove requests older than the window."""
        cutoff = time.time() - window
        self.requests[ip] = [
            (ts, endpoint_type) 
            for ts, endpoint_type in self.requests[ip] 
            if ts > cutoff
        ]
    
    def _count_requests(self, ip: str, endpoint_type: str, window: int) -> int:
        """Count requests of a specific type within window."""
        cutoff = time.time() - window
        return sum(
            1 for ts, et in self.requests[ip] 
            if ts > cutoff and et == endpoint_type
        )
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and static files
        path = request.url.path
        if path in ["/", "/health", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        client_ip = self._get_client_ip(request)
        endpoint_type = self._get_endpoint_type(path)
        
        # Clean old requests
        max_window = max(self.general_window, self.llm_window, self.auth_window)
        self._clean_old_requests(client_ip, max_window)
        
        # Check appropriate limit
        if endpoint_type == "llm":
            limit = self.llm_limit
            window = self.llm_window
        elif endpoint_type == "auth":
            limit = self.auth_limit
            window = self.auth_window
        else:
            limit = self.general_limit
            window = self.general_window
        
        current_count = self._count_requests(client_ip, endpoint_type, window)
        
        if current_count >= limit:
            # Calculate retry-after
            oldest_in_window = min(
                ts for ts, et in self.requests[client_ip] 
                if et == endpoint_type
            )
            retry_after = int(window - (time.time() - oldest_in_window)) + 1
            
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "limit": limit,
                    "window_seconds": window,
                    "retry_after": retry_after,
                    "endpoint_type": endpoint_type
                },
                headers={"Retry-After": str(retry_after)}
            )
        
        # Record this request
        self.requests[client_ip].append((time.time(), endpoint_type))
        
        # Add rate limit headers to response
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(limit - current_count - 1)
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + window)
        
        return response


# Simple in-memory rate limiter for specific functions
class FunctionRateLimiter:
    """Rate limiter for specific functions (e.g., email sending)."""
    
    def __init__(self, max_calls: int, window_seconds: int):
        self.max_calls = max_calls
        self.window = window_seconds
        self.calls: Dict[str, list] = defaultdict(list)
    
    def is_allowed(self, key: str) -> bool:
        """Check if a call is allowed for the given key."""
        now = time.time()
        cutoff = now - self.window
        
        # Clean old calls
        self.calls[key] = [t for t in self.calls[key] if t > cutoff]
        
        if len(self.calls[key]) >= self.max_calls:
            return False
        
        self.calls[key].append(now)
        return True
    
    def get_retry_after(self, key: str) -> int:
        """Get seconds until next call is allowed."""
        if not self.calls[key]:
            return 0
        oldest = min(self.calls[key])
        return max(0, int(self.window - (time.time() - oldest)))


# Global rate limiter for email sending (max 5 emails per user per hour)
email_rate_limiter = FunctionRateLimiter(max_calls=5, window_seconds=3600)
