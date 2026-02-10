"""
Reply Posting System
Posts queued replies to X (Twitter) via Composio
Includes rate limiting and safety checks
"""

from typing import Dict, Optional, List
from datetime import datetime

from app.config import settings
from app.models import BrandConfig, ReplyQueue
from app.database import (
    get_queued_replies,
    update_reply_queue_status,
    save_posted_reply,
    get_brand_config,
)
from app.rate_limiter import can_post_reply, record_reply_posted
from app.monitor import ComposioTokenManager


class ReplyPoster:
    """Posts replies to X via Composio"""
    
    def __init__(self):
        self.token_manager = ComposioTokenManager()
    
    async def post_reply(
        self,
        reply: ReplyQueue,
        brand: BrandConfig
    ) -> Dict:
        """
        Post a single reply to X
        
        Returns:
            {
                "success": bool,
                "tweet_id": Optional[str],
                "tweet_url": Optional[str],
                "error": Optional[str]
            }
        """
        # Check rate limits (skip in test mode)
        if not settings.test_mode:
            rate_limit_check = await can_post_reply(
                brand,
                reply.original_author,  # Use username as user_id for cooldown
                reply.original_author
            )
            
            if not rate_limit_check["can_post"]:
                return {
                    "success": False,
                    "tweet_id": None,
                    "tweet_url": None,
                    "error": rate_limit_check["reason"],
                }
        
        # Get Composio connection
        try:
            # Get Twitter connection via Composio (similar to monitor.py)
            from composio import Composio
            composio = Composio(api_key=settings.composio_api_key)
            
            # Get entity (brand)
            entity = composio.get_entity(id=brand.brand_id)
            if not entity:
                return {
                    "success": False,
                    "tweet_id": None,
                    "tweet_url": None,
                    "error": "Entity not found in Composio",
                }
            
            # Get Twitter connection (same as monitor.py)
            connection = entity.get_connection(app="twitter")
            if not connection:
                return {
                    "success": False,
                    "tweet_id": None,
                    "tweet_url": None,
                    "error": "Twitter not connected via Composio",
                }
            
            # Build reply text (mention original author if we have username)
            reply_text = reply.reply_text
            if reply.original_author and not reply_text.startswith("@"):
                # Prepend @mention if not already there
                reply_text = f"@{reply.original_author} {reply_text}"
                # Truncate if too long (280 char limit, minus @mention)
                if len(reply_text) > 280:
                    reply_text = reply_text[:277] + "..."
            
            # Post reply via Composio
            # Use POST_TWEET with in_reply_to_tweet_id for proper threading
            from composio import Action
            
            # Prepare params - include reply context if we have original tweet ID
            params = {"text": reply_text}
            if reply.original_tweet_id:
                # Use in_reply_to_tweet_id to make it a proper reply thread
                params["in_reply_to_tweet_id"] = reply.original_tweet_id
            
            result = await entity.execute(
                action=Action.TWITTER_POST_TWEET,
                params=params,
            )
            
            # Extract tweet ID from result
            tweet_id = None
            tweet_url = None
            
            if result:
                # Handle different result formats
                if hasattr(result, "data"):
                    tweet_id = result.data.get("id") or result.data.get("tweet_id")
                elif isinstance(result, dict):
                    tweet_id = result.get("id") or result.get("tweet_id") or result.get("data", {}).get("id")
                elif hasattr(result, "id"):
                    tweet_id = result.id
            
            if tweet_id:
                tweet_url = f"https://x.com/i/web/status/{tweet_id}"
            
            # Record the post (increment rate limits) - skip in test mode
            if not settings.test_mode:
                await record_reply_posted(
                    brand,
                    reply.original_author,  # Use username as user_id
                    reply.original_author
                )
            
            return {
                "success": True,
                "tweet_id": tweet_id,
                "tweet_url": tweet_url,
                "error": None,
            }
            
        except Exception as e:
            return {
                "success": False,
                "tweet_id": None,
                "tweet_url": None,
                "error": str(e),
            }
    
    async def post_queued_replies_for_brand(
        self,
        brand: BrandConfig,
        limit: int = 5
    ) -> Dict:
        """
        Post queued replies for a brand (respecting rate limits)
        """
        from app.config import settings
        
        test_mode_indicator = " 🧪 TEST MODE" if settings.test_mode else ""
        print(f"\n{'='*60}")
        print(f"📤 Posting replies for: {brand.brand_name}{test_mode_indicator}")
        print(f"{'='*60}")
        
        # Get queued replies
        queued_replies = await get_queued_replies(brand.brand_id, limit=limit)
        
        if not queued_replies:
            print("   No queued replies to post")
            return {
                "brand_id": brand.brand_id,
                "replies_processed": 0,
                "replies_posted": 0,
                "replies_failed": 0,
                "rate_limited": 0,
            }
        
        print(f"   Found {len(queued_replies)} queued replies")
        
        posted_count = 0
        failed_count = 0
        rate_limited_count = 0
        
        for reply in queued_replies:
            try:
                # Check if test mode
                if settings.test_mode:
                    print(f"   🧪 TEST MODE: Would post: {reply.reply_text[:50]}...")
                    print(f"      Original: {reply.original_tweet_text[:50]}...")
                    print(f"      To: @{reply.original_author or 'unknown'}")
                    # Update status to "posted" in test mode (but don't actually post)
                    # Don't increment rate limits or record user interactions in test mode
                    await update_reply_queue_status(reply.id, "posted")
                    posted_count += 1
                    continue
                
                # Update status to "posting"
                await update_reply_queue_status(reply.id, "posting")
                
                # Post the reply
                result = await self.post_reply(reply, brand)
                
                if result["success"]:
                    # Update queue status
                    await update_reply_queue_status(reply.id, "posted")
                    
                    # Save to posted_replies table
                    from app.models import PostedReply
                    posted_reply = PostedReply(
                        brand_id=brand.brand_id,
                        reply_tweet_id=result["tweet_id"] or "unknown",
                        original_tweet_id=reply.original_tweet_id,
                        reply_text=reply.reply_text,
                        original_tweet_text=reply.original_tweet_text,
                        original_author=reply.original_author,
                        reply_tone=reply.reply_tone,
                        reply_type=reply.reply_type,
                        trigger_type=None,  # Could get from monitored_tweet
                        posted_at=datetime.now(),
                    )
                    
                    await save_posted_reply(posted_reply)
                    
                    print(f"   ✅ Posted: {reply.reply_text[:50]}...")
                    print(f"      URL: {result.get('tweet_url', 'N/A')}")
                    
                    posted_count += 1
                else:
                    # Check if rate limited
                    if "limit" in result["error"].lower() or "cooldown" in result["error"].lower():
                        rate_limited_count += 1
                        print(f"   ⏸️  Rate limited: {result['error']}")
                        # Keep status as "queued" so it can be retried later
                        await update_reply_queue_status(reply.id, "queued", error_message=result["error"])
                    else:
                        failed_count += 1
                        print(f"   ❌ Failed: {result['error']}")
                        await update_reply_queue_status(reply.id, "failed", error_message=result["error"])
                
                # Small delay between posts
                import asyncio
                await asyncio.sleep(2)
                
            except Exception as e:
                print(f"   ❌ Error posting reply {reply.id}: {e}")
                failed_count += 1
                await update_reply_queue_status(reply.id, "failed", error_message=str(e))
        
        print(f"\n✅ Posting complete:")
        print(f"   - Processed: {len(queued_replies)}")
        print(f"   - Posted: {posted_count}")
        print(f"   - Failed: {failed_count}")
        print(f"   - Rate limited: {rate_limited_count}")
        print(f"{'='*60}\n")
        
        return {
            "brand_id": brand.brand_id,
            "replies_processed": len(queued_replies),
            "replies_posted": posted_count,
            "replies_failed": failed_count,
            "rate_limited": rate_limited_count,
        }
    
    async def post_queued_replies_for_all_brands(limit_per_brand: int = 5) -> Dict:
        """
        Post queued replies for all brands
        """
        from app.database import get_brands_with_auto_reply_enabled
        
        brands = await get_brands_with_auto_reply_enabled()
        
        if not brands:
            print("⚠️  No brands with auto-reply enabled")
            return {"brands_processed": 0, "total_posted": 0}
        
        results = []
        total_posted = 0
        total_failed = 0
        total_rate_limited = 0
        
        for brand in brands:
            try:
                result = await self.post_queued_replies_for_brand(brand, limit=limit_per_brand)
                results.append(result)
                total_posted += result.get("replies_posted", 0)
                total_failed += result.get("replies_failed", 0)
                total_rate_limited += result.get("rate_limited", 0)
            except Exception as e:
                print(f"❌ Error posting replies for {brand.brand_name}: {e}")
        
        return {
            "brands_processed": len(results),
            "total_posted": total_posted,
            "total_failed": total_failed,
            "total_rate_limited": total_rate_limited,
            "results": results,
        }


# Global instance
reply_poster = ReplyPoster()

