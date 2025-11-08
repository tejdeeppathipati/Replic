"""
Token bucket rate limiting using Redis.
"""

import time
import redis.asyncio as redis
from typing import Optional


class TokenBucket:
    """
    Token bucket rate limiter backed by Redis.
    
    Uses a simple algorithm:
    - Tokens are stored in Redis with a timestamp
    - Tokens refill over time based on refill_rate
    - Taking a token succeeds if bucket has >= 1 token
    """

    def __init__(
        self,
        redis_client: redis.Redis,
        name: str,
        capacity: int,
        refill_per_second: float
    ):
        """
        Initialize a token bucket.
        
        Args:
            redis_client: Redis client instance
            name: Unique name for this bucket
            capacity: Maximum tokens the bucket can hold
            refill_per_second: Rate at which tokens refill
        """
        self.redis = redis_client
        self.name = name
        self.capacity = capacity
        self.refill_per_second = refill_per_second
        self.key = f"bucket:{name}"

    async def _get_state(self) -> tuple[float, float]:
        """
        Get current bucket state (tokens, last_update).
        
        Returns:
            Tuple of (current_tokens, last_update_timestamp)
        """
        data = await self.redis.hmget(self.key, "tokens", "last_update")
        
        if data[0] is None or data[1] is None:
            # Initialize bucket
            now = time.time()
            await self.redis.hset(self.key, mapping={
                "tokens": str(self.capacity),
                "last_update": str(now)
            })
            await self.redis.expire(self.key, 86400)  # 24h TTL
            return float(self.capacity), now
        
        return float(data[0]), float(data[1])

    async def _set_state(self, tokens: float, last_update: float) -> None:
        """Save bucket state to Redis."""
        await self.redis.hset(self.key, mapping={
            "tokens": str(tokens),
            "last_update": str(last_update)
        })
        await self.redis.expire(self.key, 86400)

    async def _refill(self) -> tuple[float, float]:
        """
        Refill tokens based on elapsed time.
        
        Returns:
            Tuple of (current_tokens, current_timestamp)
        """
        tokens, last_update = await self._get_state()
        now = time.time()
        elapsed = now - last_update
        
        # Add refilled tokens
        new_tokens = min(
            self.capacity,
            tokens + (elapsed * self.refill_per_second)
        )
        
        await self._set_state(new_tokens, now)
        return new_tokens, now

    async def take(self, count: int = 1) -> bool:
        """
        Attempt to take tokens from the bucket.
        
        Args:
            count: Number of tokens to take
            
        Returns:
            True if tokens were available and taken, False otherwise
        """
        tokens, now = await self._refill()
        
        if tokens >= count:
            new_tokens = tokens - count
            await self._set_state(new_tokens, now)
            return True
        
        return False

    async def peek(self) -> float:
        """
        Check current token count without taking.
        
        Returns:
            Current number of tokens available
        """
        tokens, _ = await self._refill()
        return tokens

    async def reset(self) -> None:
        """Reset bucket to full capacity."""
        now = time.time()
        await self._set_state(self.capacity, now)


class RateLimiter:
    """
    Manages multiple token buckets for rate limiting.
    """

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.buckets: dict[str, TokenBucket] = {}

    def get_bucket(
        self,
        name: str,
        capacity: int,
        refill_per_second: float
    ) -> TokenBucket:
        """
        Get or create a token bucket.
        
        Args:
            name: Unique bucket name
            capacity: Maximum tokens
            refill_per_second: Refill rate
            
        Returns:
            TokenBucket instance
        """
        if name not in self.buckets:
            self.buckets[name] = TokenBucket(
                self.redis,
                name,
                capacity,
                refill_per_second
            )
        return self.buckets[name]

    async def can_send_wa_prompt(self, brand_id: str, capacity: int = 5, refill_per_min: int = 1) -> bool:
        """
        Check if we can send a WhatsApp prompt for this brand.
        
        Args:
            brand_id: Brand identifier
            capacity: Bucket capacity
            refill_per_min: Refill rate per minute
            
        Returns:
            True if rate limit allows sending
        """
        bucket = self.get_bucket(
            f"wa:prompt:{brand_id}",
            capacity,
            refill_per_min / 60.0  # Convert to per-second
        )
        return await bucket.take()

    async def can_send_imsg_prompt(self, brand_id: str, capacity: int = 5, refill_per_min: int = 1) -> bool:
        """
        Check if we can send an iMessage prompt for this brand.
        
        Args:
            brand_id: Brand identifier
            capacity: Bucket capacity
            refill_per_min: Refill rate per minute
            
        Returns:
            True if rate limit allows sending
        """
        bucket = self.get_bucket(
            f"imsg:prompt:{brand_id}",
            capacity,
            refill_per_min / 60.0
        )
        return await bucket.take()

    async def enforce_spacing(self, key: str, min_spacing_sec: int) -> bool:
        """
        Enforce minimum spacing between events.
        
        Args:
            key: Redis key for tracking last event time
            min_spacing_sec: Minimum seconds between events
            
        Returns:
            True if spacing requirement is met, False if too soon
        """
        last_time = await self.redis.get(f"spacing:{key}")
        now = time.time()
        
        if last_time:
            elapsed = now - float(last_time)
            if elapsed < min_spacing_sec:
                return False
        
        # Update last event time
        await self.redis.setex(f"spacing:{key}", min_spacing_sec * 2, str(now))
        return True


# Global instance
rate_limiter: Optional[RateLimiter] = None


def get_rate_limiter() -> RateLimiter:
    """Get the global rate limiter instance."""
    if rate_limiter is None:
        raise RuntimeError("Rate limiter not initialized")
    return rate_limiter


def init_rate_limiter(redis_client: redis.Redis) -> RateLimiter:
    """Initialize the global rate limiter."""
    global rate_limiter
    rate_limiter = RateLimiter(redis_client)
    return rate_limiter

