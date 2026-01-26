"""
Redis Cache Module for GeoHIS

Provides caching utilities for frequently accessed data.
"""

import json
from typing import Optional, Any
from functools import wraps
import logging
from decouple import config

logger = logging.getLogger(__name__)

# Redis configuration
REDIS_URL = config("REDIS_URL", default="redis://localhost:6379/0")
CACHE_ENABLED = config("CACHE_ENABLED", default=True, cast=bool)
CACHE_TTL = config("CACHE_TTL_SECONDS", default=300, cast=int)

# Redis client (lazy initialization)
_redis_client = None


def get_redis_client():
    """
    Get or create Redis client.
    
    Returns:
        Redis client or None if Redis is not available
    """
    global _redis_client
    
    if not CACHE_ENABLED:
        return None
    
    if _redis_client is None:
        try:
            import redis
            _redis_client = redis.from_url(
                REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5
            )
            # Test connection
            _redis_client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.warning(f"Redis not available: {e}. Caching disabled.")
            _redis_client = False  # Mark as failed, don't retry
    
    return _redis_client if _redis_client else None


def cache_get(key: str) -> Optional[Any]:
    """
    Get a value from cache.
    
    Args:
        key: Cache key
        
    Returns:
        Cached value or None if not found
    """
    client = get_redis_client()
    if not client:
        return None
    
    try:
        value = client.get(key)
        if value:
            return json.loads(value)
    except Exception as e:
        logger.warning(f"Cache get failed: {e}")
    
    return None


def cache_set(key: str, value: Any, ttl: int = None) -> bool:
    """
    Set a value in cache.
    
    Args:
        key: Cache key
        value: Value to cache (must be JSON serializable)
        ttl: Time to live in seconds (default: CACHE_TTL)
        
    Returns:
        True if successful, False otherwise
    """
    client = get_redis_client()
    if not client:
        return False
    
    try:
        serialized = json.dumps(value)
        client.setex(key, ttl or CACHE_TTL, serialized)
        return True
    except Exception as e:
        logger.warning(f"Cache set failed: {e}")
        return False


def cache_delete(key: str) -> bool:
    """
    Delete a value from cache.
    
    Args:
        key: Cache key
        
    Returns:
        True if successful, False otherwise
    """
    client = get_redis_client()
    if not client:
        return False
    
    try:
        client.delete(key)
        return True
    except Exception as e:
        logger.warning(f"Cache delete failed: {e}")
        return False


def cache_clear_pattern(pattern: str) -> int:
    """
    Clear all keys matching a pattern.
    
    Args:
        pattern: Pattern to match (e.g., "thesis:*")
        
    Returns:
        Number of keys deleted
    """
    client = get_redis_client()
    if not client:
        return 0
    
    try:
        keys = client.keys(pattern)
        if keys:
            return client.delete(*keys)
    except Exception as e:
        logger.warning(f"Cache clear pattern failed: {e}")
    
    return 0


def cached(key_prefix: str, ttl: int = None):
    """
    Decorator to cache function results.
    
    Args:
        key_prefix: Prefix for cache key
        ttl: Time to live in seconds
        
    Example:
        @cached("thesis_summary")
        async def get_summary():
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            key_parts = [key_prefix]
            if args:
                key_parts.extend(str(a) for a in args)
            if kwargs:
                key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
            cache_key = ":".join(key_parts)
            
            # Try to get from cache
            cached_value = cache_get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_value
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            cache_set(cache_key, result, ttl)
            logger.debug(f"Cache miss, stored: {cache_key}")
            
            return result
        return wrapper
    return decorator
