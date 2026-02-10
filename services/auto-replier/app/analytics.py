"""
Analytics Tracking System
Tracks reply performance and engagement metrics
"""

from typing import Dict, Optional, List
from datetime import datetime, timedelta

from app.config import settings
from app.models import BrandConfig, PostedReply
from app.database import get_supabase, get_posted_replies


async def update_reply_engagement(reply_tweet_id: str, brand_id: str) -> Dict:
    """
    Update engagement metrics for a posted reply by fetching from X API
    """
    try:
        from app.monitor import ComposioTokenManager
        import httpx
        
        token_manager = ComposioTokenManager()
        access_token = await token_manager.get_x_token(brand_id)
        
        if not access_token:
            return {"success": False, "error": "No access token"}
        
        # Fetch tweet metrics from X API
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"Authorization": f"Bearer {access_token}"}
            response = await client.get(
                f"https://api.twitter.com/2/tweets/{reply_tweet_id}",
                headers=headers,
                params={
                    "tweet.fields": "public_metrics,created_at",
                }
            )
            
            if response.status_code != 200:
                return {"success": False, "error": f"API error: {response.status_code}"}
            
            data = response.json()
            tweet_data = data.get("data", {})
            metrics = tweet_data.get("public_metrics", {})
            
            # Update in database
            supabase = get_supabase()
            supabase.table("posted_replies")\
                .update({
                    "likes_count": metrics.get("like_count", 0),
                    "retweets_count": metrics.get("retweet_count", 0),
                    "replies_count": metrics.get("reply_count", 0),
                    "views_count": metrics.get("impression_count", 0),
                    "last_metrics_update": datetime.now().isoformat(),
                })\
                .eq("reply_tweet_id", reply_tweet_id)\
                .execute()
            
            return {
                "success": True,
                "metrics": {
                    "likes": metrics.get("like_count", 0),
                    "retweets": metrics.get("retweet_count", 0),
                    "replies": metrics.get("reply_count", 0),
                    "views": metrics.get("impression_count", 0),
                }
            }
    
    except Exception as e:
        return {"success": False, "error": str(e)}


async def update_all_replies_engagement(brand: BrandConfig, limit: int = 50) -> Dict:
    """
    Update engagement metrics for all posted replies for a brand
    """
    print(f"\n{'='*60}")
    print(f"📊 Updating engagement metrics for: {brand.brand_name}")
    print(f"{'='*60}")
    
    # Get posted replies that need updating (older than 1 hour or never updated)
    supabase = get_supabase()
    one_hour_ago = (datetime.now() - timedelta(hours=1)).isoformat()
    
    response = supabase.table("posted_replies")\
        .select("*")\
        .eq("brand_id", brand.brand_id)\
        .or_(f"last_metrics_update.is.null,last_metrics_update.lt.{one_hour_ago}")\
        .order("posted_at", desc=True)\
        .limit(limit)\
        .execute()
    
    replies = response.data
    
    if not replies:
        print("   No replies need updating")
        return {
            "brand_id": brand.brand_id,
            "updated": 0,
            "failed": 0,
        }
    
    print(f"   Found {len(replies)} replies to update")
    
    updated = 0
    failed = 0
    
    for reply in replies:
        try:
            result = await update_reply_engagement(
                reply["reply_tweet_id"],
                brand.brand_id
            )
            
            if result["success"]:
                updated += 1
                print(f"   ✅ Updated: {reply['reply_tweet_id'][:10]}...")
            else:
                failed += 1
                print(f"   ❌ Failed: {result.get('error', 'Unknown error')}")
            
            # Small delay to avoid rate limits
            import asyncio
            await asyncio.sleep(2)
            
        except Exception as e:
            print(f"   ❌ Error updating {reply.get('reply_tweet_id', 'unknown')}: {e}")
            failed += 1
    
    print(f"\n✅ Engagement update complete:")
    print(f"   - Updated: {updated}")
    print(f"   - Failed: {failed}")
    print(f"{'='*60}\n")
    
    return {
        "brand_id": brand.brand_id,
        "updated": updated,
        "failed": failed,
    }


async def get_reply_analytics(brand: BrandConfig, days: int = 7) -> Dict:
    """
    Get analytics for replies over the last N days
    """
    supabase = get_supabase()
    start_date = (datetime.now() - timedelta(days=days)).isoformat()
    
    # Get all posted replies in date range
    response = supabase.table("posted_replies")\
        .select("*")\
        .eq("brand_id", brand.brand_id)\
        .gte("posted_at", start_date)\
        .order("posted_at", desc=True)\
        .execute()
    
    replies = response.data
    
    if not replies:
        return {
            "total_replies": 0,
            "total_engagement": {
                "likes": 0,
                "retweets": 0,
                "replies": 0,
                "views": 0,
            },
            "average_engagement": {
                "likes": 0,
                "retweets": 0,
                "replies": 0,
                "views": 0,
            },
            "top_replies": [],
        }
    
    # Calculate totals
    total_engagement = {
        "likes": sum(r.get("likes_count", 0) or 0 for r in replies),
        "retweets": sum(r.get("retweets_count", 0) or 0 for r in replies),
        "replies": sum(r.get("replies_count", 0) or 0 for r in replies),
        "views": sum(r.get("views_count", 0) or 0 for r in replies),
    }
    
    # Calculate averages
    count = len(replies)
    average_engagement = {
        "likes": total_engagement["likes"] // count if count > 0 else 0,
        "retweets": total_engagement["retweets"] // count if count > 0 else 0,
        "replies": total_engagement["replies"] // count if count > 0 else 0,
        "views": total_engagement["views"] // count if count > 0 else 0,
    }
    
    # Get top replies by engagement
    top_replies = sorted(
        replies,
        key=lambda r: (r.get("likes_count", 0) or 0) + (r.get("retweets_count", 0) or 0) * 2,
        reverse=True
    )[:10]
    
    return {
        "total_replies": count,
        "total_engagement": total_engagement,
        "average_engagement": average_engagement,
        "top_replies": [
            {
                "id": r["id"],
                "reply_text": r["reply_text"][:100] + "..." if len(r["reply_text"]) > 100 else r["reply_text"],
                "likes": r.get("likes_count", 0) or 0,
                "retweets": r.get("retweets_count", 0) or 0,
                "replies": r.get("replies_count", 0) or 0,
                "views": r.get("views_count", 0) or 0,
                "posted_at": r["posted_at"],
            }
            for r in top_replies
        ],
    }


async def update_all_brands_engagement(limit_per_brand: int = 50) -> Dict:
    """
    Update engagement metrics for all brands
    """
    from app.database import get_brands_with_auto_reply_enabled
    
    brands = await get_brands_with_auto_reply_enabled()
    
    if not brands:
        return {"brands_processed": 0, "total_updated": 0}
    
    results = []
    total_updated = 0
    total_failed = 0
    
    for brand in brands:
        try:
            result = await update_all_replies_engagement(brand, limit=limit_per_brand)
            results.append(result)
            total_updated += result.get("updated", 0)
            total_failed += result.get("failed", 0)
        except Exception as e:
            print(f"❌ Error updating engagement for {brand.brand_name}: {e}")
    
    return {
        "brands_processed": len(results),
        "total_updated": total_updated,
        "total_failed": total_failed,
        "results": results,
    }

