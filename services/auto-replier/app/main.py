"""
Auto-Replier Service - Main FastAPI Application
Automatically monitors X and replies to relevant tweets
"""

from contextlib import asynccontextmanager
from typing import Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings, validate_config
from app.database import (
    get_brands_with_auto_reply_enabled,
    get_brand_config,
    get_reply_stats,
)
from app.monitor import monitor_all_brands, monitor_brand
from app.relevance_scoring import score_all_pending_tweets, score_pending_tweets
from app.reply_generator import generate_replies_for_all_brands, generate_replies_for_brand
from app.reply_poster import reply_poster
from app.rate_limiter import rate_limiter
from app.analytics import update_all_brands_engagement
from app.models import MonitorRequest, MonitorResponse, TestModeRequest, TestModeResponse
from apscheduler.schedulers.asyncio import AsyncIOScheduler


# Global scheduler instance
scheduler: Optional[AsyncIOScheduler] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global scheduler
    
    print("="*50)
    print(f"🚀 Auto-Replier Service v{settings.version}")
    print("="*50)
    
    try:
        # Validate configuration
        config_valid = validate_config()
        
        # Test mode check
        if settings.test_mode:
            print("⚠️  TEST MODE ENABLED - Replies will NOT be posted")
        
        # Get enabled brands (only if Supabase is configured)
        if config_valid and settings.supabase_url:
            try:
                brands = await get_brands_with_auto_reply_enabled()
                print(f"✅ Found {len(brands)} brands with auto-reply enabled:")
                for brand in brands:
                    print(f"   - {brand.brand_name}")
            except Exception as e:
                print(f"⚠️  Could not fetch brands: {e}")
        else:
            print("⚠️  Supabase not configured - brand fetching disabled")
        
        # Start monitoring scheduler
        if config_valid and settings.supabase_url:
            scheduler = AsyncIOScheduler()
            
            # Job 1: Monitor tweets (every 10 minutes)
            scheduler.add_job(
                monitor_all_brands,
                "interval",
                minutes=settings.monitor_interval_minutes,
                id="monitor_brands",
                replace_existing=True,
            )
            
            # Job 2: Score tweets (every 5 minutes)
            scheduler.add_job(
                score_all_pending_tweets,
                "interval",
                minutes=5,
                id="score_tweets",
                replace_existing=True,
            )
            
            # Job 3: Generate replies (every 10 minutes)
            scheduler.add_job(
                generate_replies_for_all_brands,
                "interval",
                minutes=10,
                id="generate_replies",
                replace_existing=True,
            )
            
            # Job 4: Post queued replies (every 5 minutes)
            scheduler.add_job(
                reply_poster.post_queued_replies_for_all_brands,
                "interval",
                minutes=5,
                id="post_replies",
                replace_existing=True,
            )
            
            # Job 5: Update engagement metrics (every hour)
            scheduler.add_job(
                update_all_brands_engagement,
                "interval",
                hours=1,
                id="update_engagement",
                replace_existing=True,
            )
            
            scheduler.start()
            print(f"✅ Scheduler started:")
            print(f"   - Monitoring every {settings.monitor_interval_minutes} minutes")
            print(f"   - Scoring every 5 minutes")
            print(f"   - Generating replies every 10 minutes")
            print(f"   - Posting replies every 5 minutes")
            print(f"   - Updating engagement every hour")
        else:
            scheduler = None
            print("⚠️  Scheduler not started - Supabase not configured")
        
        test_mode_status = " 🧪 TEST MODE ENABLED" if settings.test_mode else ""
        print(f"\n📡 Service running on http://{settings.host}:{settings.port}{test_mode_status}")
        if settings.test_mode:
            print(f"   ⚠️  Test mode is ON - replies will NOT be posted to X")
            print(f"   ⚠️  Monitoring, scoring, and generation will work normally")
            print(f"   ⚠️  Only posting is simulated")
        print("="*50 + "\n")
        
    except Exception as e:
        print(f"❌ Startup error: {e}")
        # Don't raise - allow service to start even with config issues
    
    yield
    
    # Shutdown
    if scheduler:
        scheduler.shutdown()
        print("✅ Scheduler stopped")


# Create FastAPI app
app = FastAPI(
    title="Auto-Replier Service",
    description="Automatically monitor X and reply to relevant tweets",
    version=settings.version,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# HEALTH & STATUS
# ============================================

@app.get("/")
async def root():
    """Service information"""
    try:
        brands = await get_brands_with_auto_reply_enabled()
        return {
            "service": settings.service_name,
            "version": settings.version,
            "status": "running",
            "test_mode": settings.test_mode,
            "brands_enabled": len(brands),
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        return {
            "service": settings.service_name,
            "version": settings.version,
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }


@app.get("/health")
async def health():
    """Health check endpoint"""
    try:
        brands = await get_brands_with_auto_reply_enabled()
        return {
            "status": "healthy",
            "service": settings.service_name,
            "version": settings.version,
            "test_mode": settings.test_mode,
            "brands_enabled": len(brands),
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        return {
            "status": "degraded",
            "service": settings.service_name,
            "version": settings.version,
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }


@app.get("/config")
async def get_config():
    """Get current service configuration"""
    return {
        "service": settings.service_name,
        "version": settings.version,
        "test_mode": settings.test_mode,
        "monitor_interval_minutes": settings.monitor_interval_minutes,
        "max_replies_per_hour": settings.default_max_replies_per_hour,
        "max_replies_per_day": settings.default_max_replies_per_day,
        "user_cooldown_hours": settings.default_user_cooldown_hours,
        "min_relevance_score": settings.default_min_relevance_score,
        "relevance_weights": {
            "sentiment": settings.sentiment_weight,
            "engagement": settings.engagement_weight,
            "content": settings.content_weight,
        },
    }


# ============================================
# BRAND MANAGEMENT
# ============================================

@app.get("/brands")
async def list_enabled_brands():
    """List all brands with auto-reply enabled"""
    try:
        brands = await get_brands_with_auto_reply_enabled()
        return {
            "success": True,
            "count": len(brands),
            "brands": [
                {
                    "brand_id": brand.brand_id,
                    "brand_name": brand.brand_name,
                    "max_replies_per_hour": brand.max_replies_per_hour,
                    "max_replies_per_day": brand.max_replies_per_day,
                    "min_relevance_score": float(brand.min_relevance_score),
                    "reply_tone_preference": brand.reply_tone_preference,
                    "keywords": brand.reply_keywords,
                    "hashtags": brand.monitored_hashtags,
                }
                for brand in brands
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/brands/{brand_id}")
async def get_brand(brand_id: str):
    """Get configuration for a specific brand"""
    try:
        brand = await get_brand_config(brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        return {
            "success": True,
            "brand": {
                "brand_id": brand.brand_id,
                "brand_name": brand.brand_name,
                "auto_reply_enabled": brand.auto_reply_enabled,
                "max_replies_per_hour": brand.max_replies_per_hour,
                "max_replies_per_day": brand.max_replies_per_day,
                "user_cooldown_hours": brand.user_cooldown_hours,
                "min_relevance_score": float(brand.min_relevance_score),
                "reply_tone_preference": brand.reply_tone_preference,
                "keywords": brand.reply_keywords,
                "hashtags": brand.monitored_hashtags,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/brands/{brand_id}/stats")
async def get_brand_stats(brand_id: str):
    """Get reply statistics for a brand"""
    try:
        stats = await get_reply_stats(brand_id)
        return {
            "success": True,
            "brand_id": brand_id,
            "stats": stats,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# MONITORING
# ============================================

@app.post("/monitor", response_model=MonitorResponse)
async def trigger_monitor(request: MonitorRequest):
    """
    Manually trigger monitoring for a brand
    """
    try:
        brand = await get_brand_config(request.brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        if not brand.auto_reply_enabled:
            raise HTTPException(
                status_code=400,
                detail="Auto-reply not enabled for this brand"
            )
        
        # Run monitoring
        result = await monitor_brand(brand)
        
        return MonitorResponse(
            success=True,
            brand_id=request.brand_id,
            tweets_fetched=result.get("total_fetched", 0),
            tweets_relevant=result.get("total_saved", 0),
            replies_generated=0,
            replies_posted=0,
            message=f"Monitoring complete: {result.get('total_saved', 0)} tweets saved",
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/monitor/all")
async def trigger_monitor_all():
    """
    Manually trigger monitoring for all brands
    """
    try:
        result = await monitor_all_brands()
        
        return {
            "success": True,
            **result,
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/monitor/{brand_id}")
async def trigger_monitor_brand(brand_id: str):
    """
    Manually trigger monitoring for a specific brand
    """
    try:
        # Check if Supabase is configured
        if not settings.supabase_url or not settings.supabase_key:
            raise HTTPException(
                status_code=503,
                detail="Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
            )
        
        brand = await get_brand_config(brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail=f"Brand not found: {brand_id}")
        
        if not brand.auto_reply_enabled:
            raise HTTPException(
                status_code=400,
                detail=f"Auto-reply is not enabled for brand: {brand.brand_name}"
            )
        
        result = await monitor_brand(brand)
        
        return {
            "success": True,
            "brand_id": brand_id,
            "tweets_found": result.get("total_fetched", 0),
            "tweets_saved": result.get("total_saved", 0),
            **result,
        }
    
    except HTTPException:
        raise
    except ValueError as e:
        # Supabase configuration error
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


# ============================================
# SCORING
# ============================================

@app.post("/score")
async def trigger_scoring():
    """
    Manually trigger scoring for all brands
    """
    try:
        result = await score_all_pending_tweets()
        
        return {
            "success": True,
            **result,
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/score/{brand_id}")
async def trigger_scoring_for_brand(brand_id: str):
    """
    Manually trigger scoring for a specific brand
    """
    try:
        # Check if Supabase is configured
        if not settings.supabase_url or not settings.supabase_key:
            raise HTTPException(
                status_code=503,
                detail="Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
            )
        
        brand = await get_brand_config(brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail=f"Brand not found: {brand_id}")
        
        result = await score_pending_tweets(brand)
        
        return {
            "success": True,
            "brand_id": brand_id,
            "tweets_scored": result.get("tweets_scored", 0),
            **result,
        }
    
    except HTTPException:
        raise
    except ValueError as e:
        # Supabase configuration error
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


# ============================================
# REPLY GENERATION
# ============================================

@app.post("/generate-replies")
async def trigger_reply_generation():
    """
    Manually trigger reply generation for all brands
    """
    try:
        result = await generate_replies_for_all_brands()
        
        return {
            "success": True,
            **result,
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-replies/{brand_id}")
async def trigger_reply_generation_for_brand(brand_id: str):
    """
    Manually trigger reply generation for a specific brand
    """
    try:
        brand = await get_brand_config(brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        result = await generate_replies_for_brand(brand)
        
        return {
            "success": True,
            "brand_id": brand_id,
            **result,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# REPLY POSTING
# ============================================

@app.post("/post-replies")
async def trigger_post_replies():
    """
    Manually trigger posting of queued replies
    """
    try:
        result = await reply_poster.post_queued_replies_for_all_brands()
        
        return {
            "success": True,
            **result,
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/post-replies/{brand_id}")
async def trigger_post_replies_for_brand(brand_id: str):
    """
    Manually trigger posting of queued replies for a specific brand
    """
    try:
        brand = await get_brand_config(brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        result = await reply_poster.post_queued_replies_for_brand(brand)
        
        return {
            "success": True,
            **result,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# RATE LIMITS
# ============================================

@app.get("/rate-limits/{brand_id}")
async def get_rate_limits(brand_id: str):
    """
    Get current rate limit status for a brand
    """
    try:
        brand = await get_brand_config(brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        status = await rate_limiter.get_rate_limit_status(brand)
        
        return {
            "success": True,
            "brand_id": brand_id,
            "limits": status,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ANALYTICS
# ============================================

@app.post("/analytics/update-engagement")
async def trigger_update_engagement():
    """
    Manually trigger engagement metrics update for all brands
    """
    try:
        result = await update_all_brands_engagement()
        
        return {
            "success": True,
            **result,
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analytics/update-engagement/{brand_id}")
async def trigger_update_engagement_for_brand(brand_id: str):
    """
    Manually trigger engagement metrics update for a specific brand
    """
    try:
        brand = await get_brand_config(brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        from app.analytics import update_all_replies_engagement
        result = await update_all_replies_engagement(brand)
        
        return {
            "success": True,
            **result,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/{brand_id}")
async def get_analytics(brand_id: str):
    """
    Get analytics for a brand
    """
    try:
        from app.analytics import get_reply_analytics
        
        brand = await get_brand_config(brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        analytics = await get_reply_analytics(brand, days=7)
        
        return {
            "success": True,
            "brand_id": brand_id,
            "analytics": analytics,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# TEST MODE
# ============================================

@app.get("/test-mode")
async def get_test_mode():
    """
    Get current test mode status
    """
    return {
        "test_mode": settings.test_mode,
        "description": "Test mode prevents actual posting to X. Monitoring, scoring, and generation work normally.",
    }


@app.post("/test-mode/toggle")
async def toggle_test_mode():
    """
    Toggle test mode on/off (runtime toggle)
    Note: This only affects the current session. Restart service to persist.
    """
    settings.test_mode = not settings.test_mode
    return {
        "success": True,
        "test_mode": settings.test_mode,
        "message": f"Test mode {'ENABLED' if settings.test_mode else 'DISABLED'}",
        "note": "This change is temporary. Restart service to persist.",
    }


# ============================================
# FIND & REPLY ENDPOINTS
# ============================================

@app.get("/best-tweet/{brand_id}")
async def get_best_tweet(brand_id: str):
    """
    Get the best tweet to reply to (highest relevance score)
    """
    try:
        from app.database import get_supabase
        
        brand = await get_brand_config(brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        supabase = get_supabase()
        response = supabase.table("monitored_tweets")\
            .select("*")\
            .eq("brand_id", brand_id)\
            .eq("status", "replied")\
            .order("relevance_score", desc=True)\
            .limit(1)\
            .execute()
        
        if not response.data:
            return {
                "success": False,
                "message": "No suitable tweets found",
            }
        
        tweet = response.data[0]
        
        return {
            "success": True,
            "tweet": {
                "id": tweet["tweet_id"],
                "text": tweet["tweet_text"],
                "author": tweet["author_username"],
                "author_id": tweet["author_id"],
                "score": float(tweet["relevance_score"]) if tweet["relevance_score"] else 0,
                "trigger": tweet["trigger_type"],
                "sentiment": tweet["sentiment"],
            },
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/post-reply")
async def post_single_reply(request: Request):
    """
    Post a reply to a specific tweet
    """
    try:
        from app.reply_poster import reply_poster
        from app.models import ReplyQueue
        
        body = await request.json()
        brand_id = body.get("brand_id")
        tweet_id = body.get("tweet_id")
        reply_text = body.get("reply_text")
        original_author = body.get("original_author")
        
        if not brand_id or not tweet_id or not reply_text:
            raise HTTPException(status_code=400, detail="brand_id, tweet_id, and reply_text required")
        
        brand = await get_brand_config(brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        # Create a reply queue item
        reply = ReplyQueue(
            brand_id=brand_id,
            monitored_tweet_id=None,
            original_tweet_id=tweet_id,
            original_tweet_text=body.get("original_tweet_text", ""),
            original_author=original_author,
            reply_text=reply_text,
            reply_tone=body.get("reply_tone", "conversational"),
            reply_type=body.get("reply_type", "engage"),
            status="queued",
            safety_passed=True,
        )
        
        # Post it
        result = await reply_poster.post_reply(reply, brand)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to post"))
        
        return {
            "success": True,
            "tweet_id": result["tweet_id"],
            "tweet_url": result["tweet_url"],
            "message": "Reply posted successfully",
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-reply")
async def generate_single_reply(request: Request):
    """
    Generate a reply for a specific tweet
    """
    try:
        from app.reply_generator import generate_reply_for_tweet
        from app.models import MonitoredTweet
        
        body = await request.json()
        brand_id = body.get("brand_id")
        tweet_id = body.get("tweet_id")
        tweet_text = body.get("tweet_text")
        author_username = body.get("author_username")
        
        if not brand_id or not tweet_text:
            raise HTTPException(status_code=400, detail="brand_id and tweet_text required")
        
        brand = await get_brand_config(brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        # Create a monitored tweet object
        tweet = MonitoredTweet(
            brand_id=brand_id,
            tweet_id=tweet_id or "temp",
            tweet_text=tweet_text,
            author_username=author_username,
            trigger_type="manual",
            status="replied",
        )
        
        # Generate reply
        generated_reply = await generate_reply_for_tweet(tweet, brand)
        
        return {
            "success": True,
            "generated_reply": {
                "reply_text": generated_reply.reply_text,
                "reply_tone": generated_reply.reply_tone,
                "reply_type": generated_reply.reply_type,
                "confidence_score": float(generated_reply.confidence_score),
                "safety_passed": generated_reply.safety_passed,
            },
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# TEST REPLY GENERATION
# ============================================

@app.post("/test-reply", response_model=TestModeResponse)
async def test_reply_generation(request: TestModeRequest):
    """
    Test reply generation for a specific tweet without posting
    This endpoint always runs in test mode (doesn't post)
    """
    try:
        from app.reply_generator import generate_reply_for_tweet
        from app.models import MonitoredTweet
        
        brand = await get_brand_config(request.brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        # Create a test monitored tweet
        test_tweet = MonitoredTweet(
            brand_id=request.brand_id,
            tweet_id=request.tweet_id,
            tweet_text=request.tweet_text,
            author_username=request.author_username,
            trigger_type="test",
            status="pending",
        )
        
        # Generate reply
        generated_reply = await generate_reply_for_tweet(test_tweet, brand)
        
        # Check if it would pass relevance (simplified check)
        would_post = generated_reply.safety_passed and len(generated_reply.reply_text) > 20
        
        return TestModeResponse(
            success=True,
            generated_reply=generated_reply,
            would_post=would_post,
            reason="Reply generated successfully" if would_post else "Reply failed safety checks or too short",
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# DEVELOPMENT ENDPOINTS
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)
