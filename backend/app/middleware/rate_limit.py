"""
Rate Limiting Middleware for GeoHIS

Implements request rate limiting to prevent API abuse and DDoS attacks.
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import Request
from decouple import config

# Default limits
DEFAULT_RATE_LIMIT = config("RATE_LIMIT_REQUESTS", default="100/minute")
UPLOAD_RATE_LIMIT = config("RATE_LIMIT_UPLOAD", default="10/minute")
AUTH_RATE_LIMIT = config("RATE_LIMIT_AUTH", default="5/minute")


def get_real_client_ip(request: Request) -> str:
    """
    Get the real client IP, handling proxies.
    
    Checks X-Forwarded-For header for proxied requests.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Take the first IP in the chain (original client)
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


# Create the limiter instance
limiter = Limiter(
    key_func=get_real_client_ip,
    default_limits=[DEFAULT_RATE_LIMIT],
    storage_uri=config("REDIS_URL", default="memory://"),
    strategy="fixed-window"
)


class RateLimitMiddleware(SlowAPIMiddleware):
    """
    Rate limiting middleware using SlowAPI.
    
    Applies different rate limits based on endpoint type:
    - Default: 100 requests/minute
    - Upload: 10 requests/minute
    - Auth: 5 requests/minute
    """
    pass


def setup_rate_limiting(app):
    """
    Setup rate limiting for the FastAPI application.
    
    Args:
        app: FastAPI application instance
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)


# Decorators for different rate limits
def rate_limit_default(func):
    """Apply default rate limit to an endpoint."""
    return limiter.limit(DEFAULT_RATE_LIMIT)(func)


def rate_limit_upload(func):
    """Apply upload rate limit to an endpoint."""
    return limiter.limit(UPLOAD_RATE_LIMIT)(func)


def rate_limit_auth(func):
    """Apply auth rate limit to an endpoint."""
    return limiter.limit(AUTH_RATE_LIMIT)(func)
