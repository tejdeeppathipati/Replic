"""Tests for rate limiting."""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from app.rate_limit import TokenBucket, RateLimiter


@pytest.mark.asyncio
async def test_token_bucket_take_success():
    """Test successfully taking tokens from bucket."""
    redis_mock = AsyncMock()
    redis_mock.hmget.return_value = [None, None]  # Uninitialized
    redis_mock.hset = AsyncMock()
    redis_mock.expire = AsyncMock()
    
    bucket = TokenBucket(redis_mock, "test_bucket", capacity=5, refill_per_second=1.0)
    
    # Should succeed on first take (bucket full)
    result = await bucket.take(1)
    assert result is True


@pytest.mark.asyncio
async def test_token_bucket_refill():
    """Test that tokens refill over time."""
    redis_mock = AsyncMock()
    
    # Simulate bucket with 0 tokens, last updated 2 seconds ago
    import time
    now = time.time()
    redis_mock.hmget.return_value = ["0", str(now - 2)]
    redis_mock.hset = AsyncMock()
    redis_mock.expire = AsyncMock()
    
    # Bucket refills at 1 token/sec, so after 2 seconds should have 2 tokens
    bucket = TokenBucket(redis_mock, "test_bucket", capacity=5, refill_per_second=1.0)
    
    tokens = await bucket.peek()
    assert tokens >= 2.0  # Should have refilled


@pytest.mark.asyncio
async def test_rate_limiter_wa_prompt():
    """Test WhatsApp prompt rate limiting."""
    redis_mock = AsyncMock()
    redis_mock.hmget.return_value = [None, None]
    redis_mock.hset = AsyncMock()
    redis_mock.expire = AsyncMock()
    
    limiter = RateLimiter(redis_mock)
    
    # First call should succeed
    result = await limiter.can_send_wa_prompt("brand_123", capacity=2, refill_per_min=1)
    assert result is True


@pytest.mark.asyncio
async def test_spacing_enforcement():
    """Test minimum spacing between events."""
    redis_mock = AsyncMock()
    redis_mock.get.return_value = None  # No previous event
    redis_mock.setex = AsyncMock()
    
    limiter = RateLimiter(redis_mock)
    
    # First call should succeed
    result = await limiter.enforce_spacing("test_key", min_spacing_sec=20)
    assert result is True

