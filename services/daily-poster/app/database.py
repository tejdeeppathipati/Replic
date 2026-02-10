"""
Database utilities for fetching brand data from Supabase.
"""

from typing import Optional, List
from supabase import create_client, Client
from app.config import settings


def get_supabase() -> Client:
    """Get Supabase client."""
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key
    )


async def get_brand_for_posting(brand_id: str, require_auto_post: bool = True) -> Optional[dict]:
    """
    Fetch brand data for post generation.
    
    Gets ALL brand info from brand_agent table to generate
    high-quality, on-brand posts.
    
    Args:
        brand_id: Brand UUID
        require_auto_post: If True, only return brands with auto_post enabled (for scheduled posts)
                          If False, return any active brand (for manual posts)
        
    Returns:
        Brand data dict or None
    """
    try:
        supabase = get_supabase()
        
        query = supabase.table("brand_agent") \
            .select("*") \
            .eq("id", brand_id) \
            .eq("is_active", True)
        
        # Only check auto_post for scheduled/automatic posting
        if require_auto_post:
            query = query.eq("auto_post", True)
        
        result = query.limit(1).execute()
        
        if not result.data:
            return None
        
        return result.data[0]
        
    except Exception as e:
        print(f"Failed to fetch brand: {e}")
        return None


async def get_all_brands_for_posting() -> List[dict]:
    """
    Get all brands that have auto_post enabled.
    
    Returns:
        List of brand dicts
    """
    try:
        supabase = get_supabase()
        
        result = supabase.table("brand_agent") \
            .select("*") \
            .eq("is_active", True) \
            .eq("auto_post", True) \
            .execute()
        
        return result.data or []
        
    except Exception as e:
        print(f"Failed to fetch brands: {e}")
        return []


async def log_post(brand_id: str, post_text: str, tweet_id: str = None, success: bool = True, error: str = None):
    """
    Log a generated post to daily_content table.
    
    NOTE: This is optional logging. If the table doesn't exist, 
    the post will still be successful on X!
    
    Args:
        brand_id: Brand UUID
        post_text: Generated post text
        tweet_id: Posted tweet ID (if successful)
        success: Whether post was successful
        error: Error message (if failed)
    """
    try:
        supabase = get_supabase()
        
        result = supabase.table("daily_content").insert({
            "brand_id": brand_id,
            "content": post_text,
            "platform": "x",
            "tweet_id": tweet_id,
            "status": "posted" if success else "failed",
            "error_message": error
        }).execute()
        
        print(f"✅ Logged post to database")
        
    except Exception as e:
        # This is OK! The post still went to X successfully
        print(f"⚠️  Could not log to database (this is OK, tweet still posted): {e}")
        print(f"   To fix: Create daily_content table in Supabase")


async def get_next_pending_action(brand_id: str) -> Optional[dict]:
    """
    Get the next pending action for a brand.
    
    Args:
        brand_id: Brand UUID
        
    Returns:
        Next pending action or None
    """
    try:
        supabase = get_supabase()
        
        result = supabase.table("content_actions") \
            .select("*") \
            .eq("brand_id", brand_id) \
            .eq("status", "pending") \
            .order("created_at", desc=False) \
            .limit(1) \
            .execute()
        
        if not result.data:
            return None
        
        return result.data[0]
        
    except Exception as e:
        print(f"Failed to fetch next action: {e}")
        return None


async def get_all_pending_actions() -> List[dict]:
    """
    Get all pending actions across all brands.
    
    Returns:
        List of pending actions
    """
    try:
        supabase = get_supabase()
        
        result = supabase.table("content_actions") \
            .select("*") \
            .eq("status", "pending") \
            .order("created_at", desc=False) \
            .execute()
        
        return result.data or []
        
    except Exception as e:
        print(f"Failed to fetch pending actions: {e}")
        return []


async def mark_action_completed(action_id: str, tweet_id: str = None, tweet_url: str = None, post_text: str = None):
    """
    Mark an action as completed.
    
    Args:
        action_id: Action UUID
        tweet_id: Posted tweet ID
        tweet_url: Posted tweet URL
        post_text: Generated post text
    """
    try:
        supabase = get_supabase()
        
        from datetime import datetime
        
        supabase.table("content_actions").update({
            "status": "completed",
            "posted_at": datetime.utcnow().isoformat(),
            "tweet_id": tweet_id,
            "tweet_url": tweet_url,
            "post_text": post_text
        }).eq("id", action_id).execute()
        
        print(f"✅ Marked action {action_id} as completed")
        
    except Exception as e:
        print(f"Failed to mark action as completed: {e}")

