"""
Database helper functions for auto-replier service
Handles all Supabase interactions
"""

from typing import Optional, List, Dict
from datetime import datetime, timedelta
from supabase import create_client, Client
from app.config import settings
from app.models import (
    MonitoredTweet,
    ReplyQueue,
    PostedReply,
    UserInteractionHistory,
    ReplyRateLimit,
    BrandConfig,
)


# Supabase client singleton
_supabase_client: Optional[Client] = None


def get_supabase() -> Client:
    """Get or create Supabase client"""
    global _supabase_client
    
    if not settings.supabase_url or not settings.supabase_key:
        raise ValueError("Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_key
        )
    
    return _supabase_client


# ============================================
# BRAND CONFIGURATION
# ============================================

async def get_brands_with_auto_reply_enabled() -> List[BrandConfig]:
    """
    Get all brands that have auto_reply_enabled = true
    Returns list of BrandConfig objects
    """
    supabase = get_supabase()
    
    response = supabase.table("brand_agent")\
        .select("*")\
        .eq("auto_reply_enabled", True)\
        .eq("is_active", True)\
        .execute()
    
    brands = []
    for row in response.data:
        brands.append(BrandConfig(
            brand_id=row["id"],
            brand_name=row["brand_name"],
            auto_reply_enabled=row.get("auto_reply_enabled", False),
            reply_keywords=row.get("reply_keywords", []),
            monitored_hashtags=row.get("monitored_hashtags", []),
            max_replies_per_hour=row.get("max_replies_per_hour", 5),
            max_replies_per_day=row.get("max_replies_per_day", 20),
            user_cooldown_hours=row.get("user_cooldown_hours", 24),
            min_relevance_score=row.get("min_relevance_score", 0.50),
            reply_tone_preference=row.get("reply_tone_preference", "mix"),
            description=row.get("description"),
            brand_values=row.get("brand_values"),
            communication_style=row.get("communication_style"),
            personality=row.get("personality"),
            target_market=row.get("target_market"),
        ))
    
    return brands


async def get_brand_config(brand_id: str) -> Optional[BrandConfig]:
    """Get configuration for a specific brand"""
    supabase = get_supabase()
    
    response = supabase.table("brand_agent")\
        .select("*")\
        .eq("id", brand_id)\
        .single()\
        .execute()
    
    if not response.data:
        return None
    
    row = response.data
    return BrandConfig(
        brand_id=row["id"],
        brand_name=row["brand_name"],
        auto_reply_enabled=row.get("auto_reply_enabled", False),
        reply_keywords=row.get("reply_keywords", []),
        monitored_hashtags=row.get("monitored_hashtags", []),
        max_replies_per_hour=row.get("max_replies_per_hour", 5),
        max_replies_per_day=row.get("max_replies_per_day", 20),
        user_cooldown_hours=row.get("user_cooldown_hours", 24),
        min_relevance_score=row.get("min_relevance_score", 0.50),
        reply_tone_preference=row.get("reply_tone_preference", "mix"),
        description=row.get("description"),
        brand_values=row.get("brand_values"),
        communication_style=row.get("communication_style"),
        personality=row.get("personality"),
        target_market=row.get("target_market"),
    )


# ============================================
# MONITORED TWEETS
# ============================================

async def save_monitored_tweet(tweet: MonitoredTweet) -> str:
    """
    Save a monitored tweet to database
    Returns the tweet ID
    """
    supabase = get_supabase()
    
    data = {
        "brand_id": tweet.brand_id,
        "tweet_id": tweet.tweet_id,
        "tweet_text": tweet.tweet_text,
        "author_username": tweet.author_username,
        "author_id": tweet.author_id,
        "trigger_type": tweet.trigger_type,
        "matched_keywords": tweet.matched_keywords,
        "likes_count": tweet.likes_count,
        "retweets_count": tweet.retweets_count,
        "replies_count": tweet.replies_count,
        "tweet_created_at": tweet.tweet_created_at.isoformat() if tweet.tweet_created_at else None,
        "relevance_score": float(tweet.relevance_score) if tweet.relevance_score else None,
        "sentiment": tweet.sentiment,
        "engagement_score": float(tweet.engagement_score) if tweet.engagement_score else None,
        "content_score": float(tweet.content_score) if tweet.content_score else None,
        "status": tweet.status,
    }
    
    # Use upsert to avoid duplicates
    response = supabase.table("monitored_tweets")\
        .upsert(data, on_conflict="brand_id,tweet_id")\
        .execute()
    
    return response.data[0]["id"]


async def get_pending_monitored_tweets(brand_id: str, limit: int = 10) -> List[MonitoredTweet]:
    """Get pending monitored tweets for a brand"""
    supabase = get_supabase()
    
    response = supabase.table("monitored_tweets")\
        .select("*")\
        .eq("brand_id", brand_id)\
        .eq("status", "pending")\
        .order("relevance_score", desc=True)\
        .limit(limit)\
        .execute()
    
    return [MonitoredTweet(**row) for row in response.data]


async def update_monitored_tweet_status(tweet_id: str, status: str):
    """Update the status of a monitored tweet"""
    supabase = get_supabase()
    
    supabase.table("monitored_tweets")\
        .update({"status": status})\
        .eq("id", tweet_id)\
        .execute()


# ============================================
# REPLY QUEUE
# ============================================

async def add_to_reply_queue(reply: ReplyQueue) -> str:
    """
    Add a generated reply to the queue
    Returns the queue item ID
    """
    supabase = get_supabase()
    
    data = {
        "brand_id": reply.brand_id,
        "monitored_tweet_id": reply.monitored_tweet_id,
        "original_tweet_id": reply.original_tweet_id,
        "original_tweet_text": reply.original_tweet_text,
        "original_author": reply.original_author,
        "reply_text": reply.reply_text,
        "reply_tone": reply.reply_tone,
        "reply_type": reply.reply_type,
        "generation_model": reply.generation_model,
        "generation_prompt": reply.generation_prompt,
        "confidence_score": float(reply.confidence_score) if reply.confidence_score else None,
        "status": reply.status,
        "safety_passed": reply.safety_passed,
        "safety_flags": reply.safety_flags,
    }
    
    response = supabase.table("reply_queue")\
        .insert(data)\
        .execute()
    
    return response.data[0]["id"]


async def get_queued_replies(brand_id: str, limit: int = 10) -> List[ReplyQueue]:
    """Get queued replies ready to be posted"""
    supabase = get_supabase()
    
    response = supabase.table("reply_queue")\
        .select("*")\
        .eq("brand_id", brand_id)\
        .eq("status", "queued")\
        .eq("safety_passed", True)\
        .order("created_at", desc=False)\
        .limit(limit)\
        .execute()
    
    return [ReplyQueue(**row) for row in response.data]


async def update_reply_queue_status(queue_id: str, status: str, error_message: Optional[str] = None):
    """Update the status of a queued reply"""
    supabase = get_supabase()
    
    data = {"status": status}
    if error_message:
        data["error_message"] = error_message
    if status == "posted":
        data["posted_at"] = datetime.now().isoformat()
    
    supabase.table("reply_queue")\
        .update(data)\
        .eq("id", queue_id)\
        .execute()


# ============================================
# POSTED REPLIES
# ============================================

async def save_posted_reply(reply: PostedReply) -> str:
    """
    Save a successfully posted reply
    Returns the posted reply ID
    """
    supabase = get_supabase()
    
    data = {
        "brand_id": reply.brand_id,
        "reply_tweet_id": reply.reply_tweet_id,
        "original_tweet_id": reply.original_tweet_id,
        "reply_text": reply.reply_text,
        "original_tweet_text": reply.original_tweet_text,
        "original_author": reply.original_author,
        "reply_tone": reply.reply_tone,
        "reply_type": reply.reply_type,
        "trigger_type": reply.trigger_type,
        "likes_count": reply.likes_count,
        "retweets_count": reply.retweets_count,
        "replies_count": reply.replies_count,
        "views_count": reply.views_count,
        "engagement_rate": float(reply.engagement_rate) if reply.engagement_rate else None,
        "relevance_score": float(reply.relevance_score) if reply.relevance_score else None,
        "sentiment": reply.sentiment,
        "posted_at": reply.posted_at.isoformat() if reply.posted_at else datetime.now().isoformat(),
    }
    
    response = supabase.table("posted_replies")\
        .insert(data)\
        .execute()
    
    return response.data[0]["id"]


async def get_posted_replies(brand_id: str, limit: int = 50) -> List[PostedReply]:
    """Get posted replies for a brand"""
    supabase = get_supabase()
    
    response = supabase.table("posted_replies")\
        .select("*")\
        .eq("brand_id", brand_id)\
        .order("posted_at", desc=True)\
        .limit(limit)\
        .execute()
    
    return [PostedReply(**row) for row in response.data]


# ============================================
# USER INTERACTION HISTORY
# ============================================

async def check_user_cooldown(brand_id: str, user_id: str, cooldown_hours: int = 24) -> bool:
    """
    Check if we can reply to a user (cooldown period)
    Returns True if we can reply, False if still in cooldown
    """
    supabase = get_supabase()
    
    response = supabase.table("user_interaction_history")\
        .select("last_reply_at")\
        .eq("brand_id", brand_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if not response.data:
        return True  # No previous interaction, can reply
    
    last_reply = datetime.fromisoformat(response.data[0]["last_reply_at"].replace("Z", "+00:00"))
    cooldown_end = last_reply + timedelta(hours=cooldown_hours)
    
    return datetime.now(last_reply.tzinfo) >= cooldown_end


async def record_user_interaction(brand_id: str, user_id: str, username: Optional[str] = None):
    """Record that we replied to a user"""
    supabase = get_supabase()
    
    # Check if interaction already exists
    existing = supabase.table("user_interaction_history")\
        .select("*")\
        .eq("brand_id", brand_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if existing.data:
        # Update existing
        supabase.table("user_interaction_history")\
            .update({
                "last_reply_at": datetime.now().isoformat(),
                "total_replies": existing.data[0]["total_replies"] + 1,
            })\
            .eq("brand_id", brand_id)\
            .eq("user_id", user_id)\
            .execute()
    else:
        # Create new
        supabase.table("user_interaction_history")\
            .insert({
                "brand_id": brand_id,
                "user_id": user_id,
                "username": username,
                "last_reply_at": datetime.now().isoformat(),
                "total_replies": 1,
            })\
            .execute()


# ============================================
# RATE LIMITING
# ============================================

async def check_rate_limit(brand_id: str, time_window: str, max_replies: int) -> bool:
    """
    Check if we've hit rate limit for hourly or daily window
    Returns True if we can still post, False if limit reached
    """
    supabase = get_supabase()
    
    now = datetime.now()
    
    if time_window == "hourly":
        window_start = now.replace(minute=0, second=0, microsecond=0)
        window_end = window_start + timedelta(hours=1)
    else:  # daily
        window_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        window_end = window_start + timedelta(days=1)
    
    # Get or create rate limit record
    response = supabase.table("reply_rate_limits")\
        .select("*")\
        .eq("brand_id", brand_id)\
        .eq("time_window", time_window)\
        .eq("window_start", window_start.isoformat())\
        .execute()
    
    if not response.data:
        # Create new record
        supabase.table("reply_rate_limits")\
            .insert({
                "brand_id": brand_id,
                "time_window": time_window,
                "window_start": window_start.isoformat(),
                "window_end": window_end.isoformat(),
                "replies_count": 0,
                "max_replies": max_replies,
            })\
            .execute()
        return True
    
    record = response.data[0]
    return record["replies_count"] < max_replies


async def increment_rate_limit(brand_id: str, time_window: str):
    """Increment the rate limit counter after posting a reply"""
    supabase = get_supabase()
    
    now = datetime.now()
    
    if time_window == "hourly":
        window_start = now.replace(minute=0, second=0, microsecond=0)
    else:  # daily
        window_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    response = supabase.table("reply_rate_limits")\
        .select("*")\
        .eq("brand_id", brand_id)\
        .eq("time_window", time_window)\
        .eq("window_start", window_start.isoformat())\
        .execute()
    
    if response.data:
        supabase.table("reply_rate_limits")\
            .update({
                "replies_count": response.data[0]["replies_count"] + 1,
            })\
            .eq("id", response.data[0]["id"])\
            .execute()


# ============================================
# STATS & ANALYTICS
# ============================================

async def get_reply_stats(brand_id: str) -> Dict:
    """Get reply statistics for a brand"""
    supabase = get_supabase()
    
    # Count monitored tweets
    monitored = supabase.table("monitored_tweets")\
        .select("*", count="exact")\
        .eq("brand_id", brand_id)\
        .execute()
    
    # Count queued replies
    queued = supabase.table("reply_queue")\
        .select("*", count="exact")\
        .eq("brand_id", brand_id)\
        .eq("status", "queued")\
        .execute()
    
    # Count posted replies
    posted = supabase.table("posted_replies")\
        .select("*", count="exact")\
        .eq("brand_id", brand_id)\
        .execute()
    
    return {
        "monitored_tweets": monitored.count,
        "queued_replies": queued.count,
        "posted_replies": posted.count,
    }


if __name__ == "__main__":
    # Test database connection
    import asyncio
    
    async def test():
        print("Testing database connection...")
        brands = await get_brands_with_auto_reply_enabled()
        print(f"Found {len(brands)} brands with auto-reply enabled")
        for brand in brands:
            print(f"  - {brand.brand_name} (ID: {brand.brand_id})")
    
    asyncio.run(test())

