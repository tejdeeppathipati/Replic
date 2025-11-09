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


async def get_brand_for_posting(brand_id: str) -> Optional[dict]:
    """
    Fetch brand data for post generation.
    
    Gets ALL brand info from brand_agent table to generate
    high-quality, on-brand posts.
    
    Args:
        brand_id: Brand UUID
        
    Returns:
        Brand data dict or None
    """
    try:
        supabase = get_supabase()
        
        result = supabase.table("brand_agent") \
            .select("*") \
            .eq("id", brand_id) \
            .eq("is_active", True) \
            .eq("auto_post", True) \
            .limit(1) \
            .execute()
        
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

