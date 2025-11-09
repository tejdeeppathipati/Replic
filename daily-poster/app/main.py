"""
Daily Poster Service - Generate and post original content daily.

Flow:
1. Fetch brand data from Supabase (brand_agent table)
2. Build comprehensive prompt using ALL brand fields
3. Generate post with xAI (Grok)
4. Post to X via Composio
5. Log to Supabase (daily_content table)
6. Show in Activity Feed

NO brand_id needed in request - automatically posts for all brands with auto_post=true!
"""

from contextlib import asynccontextmanager
from datetime import datetime, time
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import httpx

from app.config import settings
from app.database import get_brand_for_posting, get_all_brands_for_posting, log_post
from app.xai_client import xai_client
from app.prompts import build_post_generation_prompt, build_themed_post_prompt


# Scheduler for daily posts
scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    print("🚀 Starting Daily Poster Service...")
    
    # Parse post time
    hour, minute = map(int, settings.post_time_utc.split(":"))
    post_time = time(hour=hour, minute=minute)
    
    # Schedule daily posts
    scheduler.add_job(
        post_for_all_brands,
        trigger="cron",
        hour=post_time.hour,
        minute=post_time.minute,
        id="daily_post",
        replace_existing=True
    )
    scheduler.start()
    
    print(f"✅ Scheduled daily posts at {settings.post_time_utc} UTC")
    print(f"   Server ready on port {settings.port}")
    
    yield
    
    # Cleanup
    scheduler.shutdown()
    print("Goodbye!")


app = FastAPI(
    title="Daily Poster Service",
    description="Generate and post original content daily",
    version="0.1.0",
    lifespan=lifespan
)

# Add CORS middleware to allow frontend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GeneratePostRequest(BaseModel):
    """Request to generate a post for a brand."""
    brand_id: str = Field(..., description="Brand UUID")
    theme: Optional[str] = Field(None, description="Post theme (optional)")
    auto_post: bool = Field(False, description="Automatically post to X")


class PostResponse(BaseModel):
    """Response with generated/posted content."""
    brand_id: str
    post_text: str
    character_count: int
    posted: bool = False
    tweet_id: Optional[str] = None
    tweet_url: Optional[str] = None
    error: Optional[str] = None


@app.get("/")
async def root():
    """Health check."""
    return {
        "service": "daily-poster",
        "status": "ok",
        "version": "0.1.0",
        "scheduled_post_time": settings.post_time_utc
    }


@app.post("/generate", response_model=PostResponse)
async def generate_post(request: GeneratePostRequest):
    """
    Generate a post for a brand (and optionally post it).
    
    THIS IS WHERE THE MAGIC HAPPENS! ✨
    
    1. Fetches ALL brand data from brand_agent table
    2. Builds comprehensive prompt with 20+ fields
    3. Generates post with xAI (Grok)
    4. Optionally posts via Composio
    """
    # 1. Fetch brand data
    brand_data = await get_brand_for_posting(request.brand_id)
    
    if not brand_data:
        raise HTTPException(
            status_code=404,
            detail=f"Brand not found, inactive, or auto_post disabled: {request.brand_id}"
        )
    
    brand_name = brand_data.get("brand_name") or brand_data.get("name")
    print(f"🎨 Generating post for: {brand_name}")
    
    try:
        # 2. Build prompt with ALL brand context
        if request.theme:
            system_prompt, user_prompt = build_themed_post_prompt(brand_data, request.theme)
            print(f"   Theme: {request.theme}")
        else:
            system_prompt, user_prompt = build_post_generation_prompt(brand_data)
        
        # 3. Generate post with xAI
        print(f"   Calling xAI (Grok)...")
        post_text = await xai_client.generate_post(system_prompt, user_prompt)
        
        # Ensure under 280 chars
        if len(post_text) > 280:
            post_text = post_text[:277] + "..."
        
        print(f"✅ Generated ({len(post_text)} chars): {post_text}")
        
        # 4. Post via Composio (if auto_post enabled)
        tweet_id = None
        tweet_url = None
        error_msg = None
        
        if request.auto_post:
            try:
                print(f"📤 Posting to X via TypeScript API endpoint...")
                
                # Call the working TypeScript API endpoint
                async with httpx.AsyncClient() as client:
                    api_response = await client.post(
                        "http://localhost:3000/api/composio/post-tweet",
                        json={
                            "userId": request.brand_id,
                            "text": post_text
                        },
                        timeout=30.0
                    )
                    
                    if api_response.status_code != 200:
                        raise Exception(f"API returned {api_response.status_code}: {api_response.text}")
                    
                    response = api_response.json()
                    print(f"✅ API Response received")
                    print(f"   Full response: {response}")
                    print(f"   Status: {response.get('success')}")
                    print(f"   Message: {response.get('message')}")
                
                # Check if the API call was successful
                if not response.get("success"):
                    error_msg = response.get("error") or response.get("message") or "Unknown error from API"
                    raise Exception(f"API call failed: {error_msg}")
                
                # Extract tweet details from the API response
                tweet_id = response.get("tweetId")
                tweet_url = response.get("url")
                
                # Check fullResult.data for the tweet ID (this is where it actually is!)
                if not tweet_id and "fullResult" in response:
                    full_result = response.get("fullResult", {})
                    # The data is nested: fullResult.data.id
                    data = full_result.get("data", {})
                    tweet_id = data.get("id") or data.get("tweet_id") or data.get("id_str")
                    
                    # Also try top-level fullResult if data doesn't exist
                    if not tweet_id:
                        tweet_id = full_result.get("id") or full_result.get("tweet_id")
                
                print(f"   Tweet ID: {tweet_id}")
                print(f"   Tweet URL: {tweet_url}")
                
                if not tweet_url and tweet_id:
                    tweet_url = f"https://x.com/i/status/{tweet_id}"
                
                # If we have success=true from API, consider it posted
                if response.get("success"):
                    if tweet_id:
                        print(f"✅ Tweet posted successfully!")
                        print(f"   Tweet ID: {tweet_id}")
                        if tweet_url:
                            print(f"   URL: {tweet_url}")
                    else:
                        print(f"✅ Tweet posted successfully (via API)")
                        print(f"   ⚠️  No tweet ID extracted, but API confirms success")
                    
                    # Log to database
                    await log_post(
                        brand_id=request.brand_id,
                        post_text=post_text,
                        tweet_id=tweet_id if tweet_id != "unknown" else None,
                        success=True
                    )
                else:
                    error_msg = "API returned success=false"
                    print(f"⚠️  Post failed: {error_msg}")
                    
            except Exception as e:
                error_msg = str(e)
                print(f"❌ Failed to post: {error_msg}")
                await log_post(
                    brand_id=request.brand_id,
                    post_text=post_text,
                    success=False,
                    error=error_msg
                )
        
        return PostResponse(
            brand_id=request.brand_id,
            post_text=post_text,
            character_count=len(post_text),
            posted=request.auto_post and tweet_id is not None,
            tweet_id=tweet_id,
            tweet_url=tweet_url,
            error=error_msg
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate post: {str(e)}"
        )


@app.post("/post-now/{brand_id}")
async def post_now(brand_id: str, theme: Optional[str] = None):
    """
    Generate and post immediately for a brand.
    
    Shortcut endpoint - just pass brand_id!
    """
    request = GeneratePostRequest(
        brand_id=brand_id,
        theme=theme,
        auto_post=True
    )
    
    return await generate_post(request)


async def post_for_all_brands():
    """
    Generate and post for all brands with auto_post=true.
    
    This is called by the scheduler daily.
    """
    print(f"\n⏰ Daily post job triggered: {datetime.now().isoformat()}")
    
    brands = await get_all_brands_for_posting()
    print(f"   Found {len(brands)} brands with auto_post enabled")
    
    if not brands:
        print("   No brands to post for")
        return
    
    # Determine theme based on day of week
    day_themes = {
        0: "monday_motivation",
        1: "tuesday_tip",
        2: "wednesday_wisdom",
        3: "thursday_thought",
        4: "friday_feature",
        5: "weekend_insight",
        6: "weekend_insight"
    }
    theme = day_themes.get(datetime.now().weekday())
    
    # Post for each brand
    success_count = 0
    for brand in brands:
        brand_id = brand["id"]
        brand_name = brand.get("brand_name") or brand.get("name")
        
        try:
            print(f"\n📝 Posting for: {brand_name}")
            
            request = GeneratePostRequest(
                brand_id=brand_id,
                theme=theme,
                auto_post=True
            )
            
            result = await generate_post(request)
            
            if result.posted:
                success_count += 1
            
        except Exception as e:
            print(f" Failed for {brand_name}: {e}")
            continue
    
    print(f"\n Daily post job complete: {success_count}/{len(brands)} posted")


@app.post("/trigger-daily-job")
async def trigger_daily_job(background_tasks: BackgroundTasks):
    """
    Manually trigger the daily post job.
    
    Useful for testing!
    """
    background_tasks.add_task(post_for_all_brands)
    
    return {
        "status": "triggered",
        "message": "Daily post job started in background"
    }


@app.get("/next-post-time")
async def next_post_time():
    """Get info about next scheduled post."""
    job = scheduler.get_job("daily_post")
    
    if job and job.next_run_time:
        return {
            "next_run": job.next_run_time.isoformat(),
            "configured_time": settings.post_time_utc
        }
    else:
        return {
            "next_run": None,
            "configured_time": settings.post_time_utc
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)

