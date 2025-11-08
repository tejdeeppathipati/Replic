"""
Redis client and state management for candidates.
"""

import json
import os
from datetime import datetime, timezone
from typing import Optional
import redis.asyncio as redis
from app.models import Candidate, CandidateState, ActivityEntry


class RedisStore:
    """
    Manages candidate state, idempotency, and activity logs in Redis.
    """

    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.client: Optional[redis.Redis] = None

    async def connect(self):
        """Initialize Redis connection."""
        self.client = redis.from_url(
            self.redis_url,
            encoding="utf-8",
            decode_responses=True
        )

    async def close(self):
        """Close Redis connection."""
        if self.client:
            await self.client.close()

    def _state_key(self, candidate_id: str) -> str:
        """Generate Redis key for candidate state."""
        return f"cr:{candidate_id}:state"

    def _edit_key(self, candidate_id: str) -> str:
        """Generate Redis key for awaiting edit flag."""
        return f"cr:{candidate_id}:awaiting_edit"

    def _activity_key(self, brand_id: str) -> str:
        """Generate Redis key for activity log."""
        return f"activity:{brand_id}"

    async def get_candidate_state(self, candidate_id: str) -> Optional[CandidateState]:
        """Retrieve candidate state from Redis."""
        key = self._state_key(candidate_id)
        data = await self.client.get(key)
        
        if not data:
            return None
        
        return CandidateState.model_validate_json(data)

    async def save_candidate_state(self, state: CandidateState, ttl_sec: int = 86400) -> None:
        """
        Save candidate state to Redis with TTL.
        
        Args:
            state: Candidate state to save
            ttl_sec: Time to live in seconds (default 24 hours)
        """
        key = self._state_key(state.candidate.id)
        data = state.model_dump_json()
        await self.client.setex(key, ttl_sec, data)

    async def is_duplicate(self, candidate_id: str) -> bool:
        """Check if we've already seen this candidate."""
        state = await self.get_candidate_state(candidate_id)
        if not state:
            return False
        # Only allow reprocessing if state is 'new'
        return state.state != "new"

    async def set_awaiting_edit(self, candidate_id: str, awaiting: bool = True) -> None:
        """Mark a candidate as awaiting edit response."""
        if awaiting:
            await self.client.setex(self._edit_key(candidate_id), 1800, "1")  # 30 min TTL
        else:
            await self.client.delete(self._edit_key(candidate_id))

    async def is_awaiting_edit(self, candidate_id: str) -> bool:
        """Check if a candidate is awaiting an edit response."""
        return bool(await self.client.exists(self._edit_key(candidate_id)))

    async def update_state(
        self,
        candidate_id: str,
        new_state: str,
        decider: Optional[str] = None
    ) -> None:
        """
        Update candidate state.
        
        Args:
            candidate_id: Candidate ID
            new_state: New state value
            decider: Who made the decision (optional)
        """
        state = await self.get_candidate_state(candidate_id)
        if not state:
            return
        
        state.state = new_state
        if new_state in ["approved", "edited", "rejected", "expired"]:
            state.decided_at = datetime.now(timezone.utc)
            if decider:
                state.decider = decider
        elif new_state == "prompted":
            state.prompted_at = datetime.now(timezone.utc)
        
        await self.save_candidate_state(state)

    async def log_activity(self, brand_id: str, entry: ActivityEntry) -> None:
        """
        Add an entry to the activity log for a brand.
        
        Args:
            brand_id: Brand identifier
            entry: Activity entry to log
        """
        key = self._activity_key(brand_id)
        data = entry.model_dump_json()
        
        # Store as sorted set with timestamp as score for chronological ordering
        score = entry.created_at.timestamp()
        await self.client.zadd(key, {data: score})
        
        # Keep only last 1000 entries
        await self.client.zremrangebyrank(key, 0, -1001)

    async def get_activity(self, brand_id: str, limit: int = 50) -> list[ActivityEntry]:
        """
        Retrieve recent activity for a brand.
        
        Args:
            brand_id: Brand identifier
            limit: Maximum number of entries to return
            
        Returns:
            List of activity entries, newest first
        """
        key = self._activity_key(brand_id)
        
        # Get most recent entries
        entries = await self.client.zrevrange(key, 0, limit - 1)
        
        result = []
        for entry_json in entries:
            try:
                result.append(ActivityEntry.model_validate_json(entry_json))
            except Exception:
                continue
        
        return result

    async def get_expired_candidates(self) -> list[CandidateState]:
        """
        Scan for candidates that have exceeded their deadline.
        
        Note: This is a simplified scan. In production, you'd use
        Redis sorted sets with deadline timestamps for efficiency.
        """
        expired = []
        now = datetime.now(timezone.utc)
        
        # Scan for all candidate keys
        cursor = 0
        pattern = "cr:*:state"
        
        while True:
            cursor, keys = await self.client.scan(
                cursor=cursor,
                match=pattern,
                count=100
            )
            
            for key in keys:
                data = await self.client.get(key)
                if data:
                    try:
                        state = CandidateState.model_validate_json(data)
                        
                        # Check if expired and still in prompted state
                        if state.state == "prompted" and state.created_at:
                            elapsed = (now - state.created_at).total_seconds()
                            if elapsed >= state.candidate.deadline_sec:
                                expired.append(state)
                    except Exception:
                        continue
            
            if cursor == 0:
                break
        
        return expired


# Global instance
store: Optional[RedisStore] = None


def get_store() -> RedisStore:
    """Get the global Redis store instance."""
    if store is None:
        raise RuntimeError("Redis store not initialized")
    return store


async def init_store(redis_url: str) -> RedisStore:
    """Initialize the global Redis store."""
    global store
    store = RedisStore(redis_url)
    await store.connect()
    return store


async def close_store():
    """Close the global Redis store."""
    if store:
        await store.close()

