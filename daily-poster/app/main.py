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
from app.database import get_brand_for_posting, get_all_brands_for_posting, log_post, get_next_pending_action, get_all_pending_actions, mark_action_completed
from app.xai_client import xai_client
from app.prompts import build_post_generation_prompt, build_themed_post_prompt, build_action_post_prompt


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
    
    # Schedule hourly action posting
    scheduler.add_job(
        post_pending_actions,
        trigger="interval",
        hours=1,
        id="hourly_actions",
        replace_existing=True
    )
    
    scheduler.start()
    
    print(f"✅ Scheduled daily posts at {settings.post_time_utc} UTC")
    print(f"✅ Scheduled hourly action posting")
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
# In production, allow all origins (Vercel uses dynamic domains)
# In development, only allow localhost
import os
is_production = os.getenv("ENVIRONMENT") == "production" or os.getenv("RENDER") == "true"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if is_production else ["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GeneratePostRequest(BaseModel):
    """Request to generate a post for a brand."""
    brand_id: str = Field(..., description="Brand UUID")
    theme: Optional[str] = Field(None, description="Post theme (optional)")
    auto_post: bool = Field(False, description="Automatically post to X")
    user_input: Optional[str] = Field(None, description="User's post idea/topic")
    tone: Optional[str] = Field("engaging", description="Tone of the post")


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
async def generate_post(request: GeneratePostRequest, require_auto_post: bool = True):
    """
    Generate a post for a brand (and optionally post it).
    
    THIS IS WHERE THE MAGIC HAPPENS! ✨
    
    1. Fetches ALL brand data from brand_agent table
    2. Builds comprehensive prompt with 20+ fields
    3. Generates post with xAI (Grok)
    4. Optionally posts via Composio
    """
    # 1. Fetch brand data
    brand_data = await get_brand_for_posting(request.brand_id, require_auto_post=require_auto_post)
    
    if not brand_data:
        error_msg = f"Brand not found or inactive: {request.brand_id}"
        if require_auto_post:
            error_msg = f"Brand not found, inactive, or auto_post disabled: {request.brand_id}"
        raise HTTPException(
            status_code=404,
            detail=error_msg
        )
    
    brand_name = brand_data.get("brand_name") or brand_data.get("name")
    print(f"🎨 Generating post for: {brand_name}")
    
    try:
        # 2. Build prompt with ALL brand context
        url_suffix = ""
        if request.theme:
            system_prompt, user_prompt = build_themed_post_prompt(brand_data, request.theme)
            print(f"   Theme: {request.theme}")
        else:
            system_prompt, user_prompt, url_suffix = build_post_generation_prompt(
                brand_data, 
                user_input=request.user_input,
                tone=request.tone
            )
            if request.user_input:
                print(f"   User Input: {request.user_input}")
            print(f"   Tone: {request.tone}")
            if url_suffix:
                print(f"   Will append URL: {url_suffix.strip()}")
        
        # 3. Generate post with xAI
        print(f"   Calling xAI (Grok)...")
        post_text = await xai_client.generate_post(system_prompt, user_prompt)
        
        # 4. Append URL suffix if we have one
        if url_suffix:
            post_text = post_text + url_suffix
        
        # Ensure under 280 chars (should already be due to our calculations, but double-check)
        if len(post_text) > 280:
            print(f"   Warning: Post is {len(post_text)} chars, truncating...")
            post_text = post_text[:277] + "..."
        
        print(f"✅ Generated ({len(post_text)} chars): {post_text}")
        
        # 5. Post via Composio (if auto_post enabled)
        tweet_id = None
        tweet_url = None
        error_msg = None
        
        if request.auto_post:
            try:
                print(f"📤 Posting to X via TypeScript API endpoint...")

                # Get the user ID from brand data
                user_id = brand_data.get("user_id")
                if not user_id:
                    raise Exception("User ID not found in brand data")

                # Call the working TypeScript API endpoint
                api_url = f"{settings.api_base_url}/api/composio/post-tweet"
                async with httpx.AsyncClient() as client:
                    api_response = await client.post(
                        api_url,
                        json={
                            "userId": user_id,
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


class PostNowRequest(BaseModel):
    """Request body for post-now endpoint."""
    user_input: Optional[str] = Field(None, description="User's post idea/topic")
    tone: Optional[str] = Field("engaging", description="Tone of the post")
    theme: Optional[str] = Field(None, description="Post theme (optional)")


@app.post("/post-now/{brand_id}")
async def post_now(brand_id: str, body: Optional[PostNowRequest] = None):
    """
    Generate and post immediately for a brand.
    
    Shortcut endpoint - just pass brand_id!
    This is for MANUAL posting (from activity feed), so we don't require auto_post to be enabled.
    """
    user_input = body.user_input if body else None
    tone = body.tone if body else "engaging"
    theme = body.theme if body else None
    
    request = GeneratePostRequest(
        brand_id=brand_id,
        theme=theme,
        auto_post=True,
        user_input=user_input,
        tone=tone
    )
    
    # Manual post - don't require auto_post flag
    return await generate_post(request, require_auto_post=False)


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
    actions_job = scheduler.get_job("hourly_actions")
    
    if job and job.next_run_time:
        return {
            "next_daily_post": job.next_run_time.isoformat(),
            "next_action_post": actions_job.next_run_time.isoformat() if actions_job else None,
            "configured_time": settings.post_time_utc
        }
    else:
        return {
            "next_daily_post": None,
            "next_action_post": actions_job.next_run_time.isoformat() if actions_job else None,
            "configured_time": settings.post_time_utc
        }


class PostActionRequest(BaseModel):
    """Request to post an action."""
    action_id: str = Field(..., description="Action UUID")
    brand_id: str = Field(..., description="Brand UUID")
    action_type: str = Field(..., description="Action type")
    title: str = Field(..., description="Action title/goal")
    description: Optional[str] = Field(None, description="Action description")
    context: Optional[str] = Field(None, description="Additional context")
    tone: Optional[str] = Field("engaging", description="Tone")
    auth_token: Optional[str] = Field(None, description="Auth token for API calls")


@app.post("/post-action")
async def post_action(request: PostActionRequest):
    """
    Generate and post content for a specific action.
    
    This is called by the frontend's manual trigger or by the hourly scheduler.
    """
    print(f"\n🎯 [POST ACTION] Processing action: {request.action_id}")
    print(f"   Type: {request.action_type}")
    print(f"   Goal: {request.title}")
    print(f"   Auth token provided: {'Yes' if request.auth_token else 'No'}")
    if request.auth_token:
        print(f"   Auth token length: {len(request.auth_token)}")
        print(f"   Auth token preview: {request.auth_token[:20]}...")
    
    try:
        # 1. Fetch brand data
        brand_data = await get_brand_for_posting(request.brand_id, require_auto_post=False)
        
        if not brand_data:
            raise HTTPException(
                status_code=404,
                detail=f"Brand not found or inactive: {request.brand_id}"
            )
        
        brand_name = brand_data.get("brand_name") or brand_data.get("name")
        print(f"🎨 Generating action post for: {brand_name}")
        
        # 2. Build action-specific prompt
        action_data = {
            "action_type": request.action_type,
            "title": request.title,
            "description": request.description,
            "context": request.context,
            "tone": request.tone
        }
        
        system_prompt, user_prompt, url_suffix = build_action_post_prompt(brand_data, action_data)
        
        # 3. Generate post with xAI
        print(f"   Calling xAI (Grok)...")
        post_text = await xai_client.generate_post(system_prompt, user_prompt)
        
        # 4. Append URL suffix if we have one
        if url_suffix:
            post_text = post_text + url_suffix
        
        # Ensure under 280 chars
        if len(post_text) > 280:
            print(f"   Warning: Post is {len(post_text)} chars, truncating...")
            post_text = post_text[:277] + "..."
        
        print(f"✅ Generated ({len(post_text)} chars): {post_text}")
        
        # 5. Post to X automatically
        tweet_id = None
        tweet_url = None
        error_msg = None
        
        try:
            print(f"📤 Posting to X via TypeScript API endpoint...")

            # Get the user ID from brand data
            user_id = brand_data.get("user_id")
            if not user_id:
                raise Exception("User ID not found in brand data")

            api_url = f"{settings.api_base_url}/api/composio/post-tweet"
            
            # Prepare headers with auth token if provided
            headers = {"Content-Type": "application/json"}
            if request.auth_token:
                headers["Authorization"] = f"Bearer {request.auth_token}"
                print(f"🔑 [POST ACTION] Using auth token (length: {len(request.auth_token)})")
                print(f"🔑 [POST ACTION] Token preview: {request.auth_token[:30]}...")
            else:
                print(f"⚠️  [POST ACTION] No auth token provided - API call may fail")
            
            print(f"📡 [POST ACTION] Calling {api_url}")
            print(f"📡 [POST ACTION] Headers: {list(headers.keys())}")
            
            async with httpx.AsyncClient() as client:
                api_response = await client.post(
                    api_url,
                    json={
                        "userId": user_id,
                        "text": post_text
                    },
                    headers=headers,
                    timeout=30.0,
                    follow_redirects=False  # Don't follow redirects so we can see the actual response
                )

                print(f"📥 [POST ACTION] Response status: {api_response.status_code}")
                print(f"📥 [POST ACTION] Response headers: {dict(api_response.headers)}")

                if api_response.status_code == 307 or api_response.status_code == 302:
                    # Redirect means authentication failed
                    redirect_location = api_response.headers.get("Location", "unknown")
                    print(f"❌ [POST ACTION] Authentication failed - redirected to: {redirect_location}")
                    raise Exception(f"Authentication failed: API redirected to {redirect_location}. Auth token may be missing or invalid.")
                
                if api_response.status_code != 200:
                    error_text = api_response.text[:500] if api_response.text else "No error message"
                    print(f"❌ [POST ACTION] API error: {error_text}")
                    raise Exception(f"API returned {api_response.status_code}: {error_text}")
                
                response = api_response.json()
                
                if not response.get("success"):
                    error_msg = response.get("error") or response.get("message") or "Unknown error from API"
                    raise Exception(f"API call failed: {error_msg}")
                
                # Extract tweet details
                tweet_id = response.get("tweetId")
                tweet_url = response.get("url")
                
                if not tweet_id and "fullResult" in response:
                    full_result = response.get("fullResult", {})
                    data = full_result.get("data", {})
                    tweet_id = data.get("id") or data.get("tweet_id") or data.get("id_str")
                
                if not tweet_url and tweet_id:
                    tweet_url = f"https://x.com/i/status/{tweet_id}"
                
                if response.get("success"):
                    print(f"✅ Tweet posted successfully!")
                    if tweet_id:
                        print(f"   Tweet ID: {tweet_id}")
                    if tweet_url:
                        print(f"   URL: {tweet_url}")
                    
                    # Mark action as completed
                    await mark_action_completed(request.action_id, tweet_id, tweet_url, post_text)
                    
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Failed to post: {error_msg}")
        
        return {
            "success": tweet_id is not None,
            "action_id": request.action_id,
            "post_text": post_text,
            "character_count": len(post_text),
            "tweet_id": tweet_id,
            "tweet_url": tweet_url,
            "error": error_msg
        }
        
    except Exception as e:
        print(f"❌ [POST ACTION] Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to post action: {str(e)}"
        )


async def post_pending_actions():
    """
    Post pending actions for all brands (called hourly by scheduler).
    
    For now, we just post the oldest pending action.
    In the future, we can implement priority logic here.
    """
    print(f"\n⏰ Hourly action job triggered: {datetime.now().isoformat()}")
    
    # Get all pending actions
    actions = await get_all_pending_actions()
    print(f"   Found {len(actions)} pending action(s)")
    
    if not actions:
        print("   No pending actions to post")
        return
    
    # For now, just post the first one (oldest)
    action = actions[0]
    action_id = action["id"]
    brand_id = action["brand_id"]
    
    print(f"\n📝 Posting action: {action['title']}")
    print(f"   Type: {action['action_type']}")
    print(f"   Brand: {brand_id}")
    
    try:
        request = PostActionRequest(
            action_id=action_id,
            brand_id=brand_id,
            action_type=action["action_type"],
            title=action["title"],
            description=action.get("description"),
            context=action.get("context"),
            tone=action.get("tone", "engaging")
        )
        
        result = await post_action(request)
        
        if result["success"]:
            print(f"✅ Action posted successfully!")
        else:
            print(f"❌ Action post failed: {result.get('error')}")
            
    except Exception as e:
        print(f"❌ Failed to post action: {e}")
    
    print(f"\n⏰ Hourly action job complete")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)

