"""Response caching layer for Reflog API"""
from functools import lru_cache, wraps
from datetime import datetime, timedelta
from typing import Any, Callable, Optional
import hashlib
import json

# Simple in-memory cache (for MVP - replace with Redis for production)
_cache = {}
_cache_timestamps = {}

def cache_key(*args, **kwargs) -> str:
    """Generate cache key from function arguments"""
    key_str = json.dumps({
        'args': [str(a) for a in args],
        'kwargs': {k: str(v) for k, v in sorted(kwargs.items())}
    }, sort_keys=True)
    return hashlib.md5(key_str.encode()).hexdigest()

def cached(ttl_seconds: int = 3600):
    """Cache decorator with TTL
    
    Args:
        ttl_seconds: Time to live in seconds (default 1 hour)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            key = f"{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Check if cached and not expired
            if key in _cache:
                timestamp = _cache_timestamps.get(key)
                if timestamp and (datetime.now() - timestamp).total_seconds() < ttl_seconds:
                    return _cache[key]
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache result
            _cache[key] = result
            _cache_timestamps[key] = datetime.now()
            
            return result
        
        # Add cache invalidation method
        wrapper.invalidate = lambda *args, **kwargs: _cache.pop(
            f"{func.__name__}:{cache_key(*args, **kwargs)}", 
            None
        )
        
        return wrapper
    return decorator

def invalidate_user_cache(user_id: int):
    """Clear all cache entries for a specific user"""
    keys_to_delete = [
        key for key in _cache.keys() 
        if f'user_id={user_id}' in key or f':{user_id}:' in key
    ]
    for key in keys_to_delete:
        _cache.pop(key, None)
        _cache_timestamps.pop(key, None)

def clear_cache():
    """Clear entire cache"""
    _cache.clear()
    _cache_timestamps.clear()

# Pre-configured cache decorators
cache_1min = cached(ttl_seconds=60)
cache_5min = cached(ttl_seconds=300)
cache_1hour = cached(ttl_seconds=3600)
cache_1day = cached(ttl_seconds=86400)
