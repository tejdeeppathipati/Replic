"""
Rate Limiting System
Enforces rate limits before posting replies:
- Hourly limit (max replies per hour)
- Daily limit (max replies per day)
- User cooldown (don't reply to same user within X hours)
"""

from typing import Dict, Optional
from datetime import datetime, timedelta

from app.config import settings
from app.models import BrandConfig
from app.database import (
    check_rate_limit,
    increment_rate_limit,
    check_user_cooldown,
    record_user_interaction,
)


class RateLimiter:
    """Rate limiting manager"""
    
    async def check_all_limits(
        self,
        brand: BrandConfig,
        user_id: Optional[str],
        user_username: Optional[str] = None
    ) -> Dict:
        """
        Check all rate limits before posting a reply
        
        Returns:
            {
                "can_post": bool,
                "hourly_ok": bool,
                "daily_ok": bool,
                "user_cooldown_ok": bool,
                "reason": str (if can_post=False)
            }
        """
        # 1. Check hourly limit
        hourly_ok = await check_rate_limit(
            brand.brand_id,
            "hourly",
            brand.max_replies_per_hour
        )
        
        if not hourly_ok:
            return {
                "can_post": False,
                "hourly_ok": False,
                "daily_ok": True,  # Don't check if hourly failed
                "user_cooldown_ok": True,
                "reason": f"Hourly limit reached ({brand.max_replies_per_hour} replies/hour)",
            }
        
        # 2. Check daily limit
        daily_ok = await check_rate_limit(
            brand.brand_id,
            "daily",
            brand.max_replies_per_day
        )
        
        if not daily_ok:
            return {
                "can_post": False,
                "hourly_ok": True,
                "daily_ok": False,
                "user_cooldown_ok": True,
                "reason": f"Daily limit reached ({brand.max_replies_per_day} replies/day)",
            }
        
        # 3. Check user cooldown (if user_id provided)
        user_cooldown_ok = True
        if user_id:
            user_cooldown_ok = await check_user_cooldown(
                brand.brand_id,
                user_id,
                brand.user_cooldown_hours
            )
            
            if not user_cooldown_ok:
                return {
                    "can_post": False,
                    "hourly_ok": True,
                    "daily_ok": True,
                    "user_cooldown_ok": False,
                    "reason": f"User cooldown active (wait {brand.user_cooldown_hours} hours between replies to same user)",
                }
        
        # All checks passed
        return {
            "can_post": True,
            "hourly_ok": True,
            "daily_ok": True,
            "user_cooldown_ok": True,
            "reason": "All rate limits OK",
        }
    
    async def record_post(
        self,
        brand: BrandConfig,
        user_id: Optional[str],
        user_username: Optional[str] = None
    ):
        """
        Record that a reply was posted (increment counters)
        """
        # Increment hourly limit
        await increment_rate_limit(brand.brand_id, "hourly")
        
        # Increment daily limit
        await increment_rate_limit(brand.brand_id, "daily")
        
        # Record user interaction (for cooldown)
        if user_id:
            await record_user_interaction(
                brand.brand_id,
                user_id,
                user_username
            )
    
    async def get_rate_limit_status(self, brand: BrandConfig) -> Dict:
        """
        Get current rate limit status for a brand
        """
        from app.database import get_supabase
        from datetime import datetime
        
        supabase = get_supabase()
        now = datetime.now()
        
        # Get hourly limit
        hourly_start = now.replace(minute=0, second=0, microsecond=0)
        hourly_response = supabase.table("reply_rate_limits")\
            .select("*")\
            .eq("brand_id", brand.brand_id)\
            .eq("time_window", "hourly")\
            .eq("window_start", hourly_start.isoformat())\
            .execute()
        
        hourly_count = hourly_response.data[0]["replies_count"] if hourly_response.data else 0
        hourly_remaining = max(0, brand.max_replies_per_hour - hourly_count)
        
        # Get daily limit
        daily_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        daily_response = supabase.table("reply_rate_limits")\
            .select("*")\
            .eq("brand_id", brand.brand_id)\
            .eq("time_window", "daily")\
            .eq("window_start", daily_start.isoformat())\
            .execute()
        
        daily_count = daily_response.data[0]["replies_count"] if daily_response.data else 0
        daily_remaining = max(0, brand.max_replies_per_day - daily_count)
        
        return {
            "hourly": {
                "used": hourly_count,
                "limit": brand.max_replies_per_hour,
                "remaining": hourly_remaining,
            },
            "daily": {
                "used": daily_count,
                "limit": brand.max_replies_per_day,
                "remaining": daily_remaining,
            },
        }


# Global instance
rate_limiter = RateLimiter()


async def can_post_reply(
    brand: BrandConfig,
    user_id: Optional[str],
    user_username: Optional[str] = None
) -> Dict:
    """
    Main function to check if we can post a reply
    """
    return await rate_limiter.check_all_limits(brand, user_id, user_username)


async def record_reply_posted(
    brand: BrandConfig,
    user_id: Optional[str],
    user_username: Optional[str] = None
):
    """
    Main function to record that a reply was posted
    """
    await rate_limiter.record_post(brand, user_id, user_username)

