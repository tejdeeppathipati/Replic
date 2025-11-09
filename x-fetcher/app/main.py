"""
X Fetcher Service - Main application.

CORE FUNCTIONALITY:
1. Fetch tweets from X API (mentions + keyword search)
2. Get brand config from Supabase (keywords, filters)
3. Filter tweets for relevance
4. Send good candidates to LLM for reply generation

SIMPLIFIED: No Redis, no polling scheduler (for now)
Just expose endpoints to manually trigger fetching.
"""

from contextlib import asynccontextmanager
from typing import List, Dict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.composio_helper import token_manager
from app.x_api import x_api
from app.filters import tweet_filter
from app.database import brand_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    print("🚀 Starting X Fetcher Service...")
    
    # Initialize database connection
    await brand_db.connect()
    print("✅ Database connected")
    
    print(f"Server ready on port {settings.port}")
    
    yield
    
    # Cleanup
    print("Shutting down...")
    await brand_db.close()
    print("Goodbye!")


app = FastAPI(
    title="X Fetcher Service",
    description="Fetch and filter tweets from X API",
    version="0.1.0",
    lifespan=lifespan
)


class FetchRequest(BaseModel):
    """Request to fetch tweets for a brand."""
    brand_id: str


class FetchResponse(BaseModel):
    """Response with fetched and filtered tweets."""
    brand_id: str
    total_fetched: int
    passed_filter: int
    failed_filter: int
    candidates: List[Dict]


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "x-fetcher",
        "status": "ok",
        "version": "0.1.0"
    }


@app.post("/fetch/mentions", response_model=FetchResponse)
async def fetch_mentions(request: FetchRequest):
    """
    Fetch mentions for a brand and filter for relevance.
    
    Steps:
    1. Get brand config from database (keywords, filters)
    2. Get X token from Composio
    3. Fetch mentions via X API
    4. Filter tweets for relevance
    5. Return good candidates
    """
    brand_id = request.brand_id
    
    # 1. Get brand configuration
    brand_config = await brand_db.get_brand_config(brand_id)
    if not brand_config:
        raise HTTPException(
            status_code=404,
            detail=f"Brand {brand_id} not found or not active"
        )
    
    # 2. Get X access token from Composio
    access_token = await token_manager.get_x_token(brand_id)
    if not access_token:
        raise HTTPException(
            status_code=400,
            detail=f"No X account connected for brand {brand_id}. Connect via Composio first."
        )
    
    # Get user ID (needed for mentions endpoint)
    user_id = await token_manager.get_user_id(brand_id)
    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="Could not get X user ID for brand"
        )
    
    # 3. Fetch mentions from X API
    response = await x_api.get_mentions(
        access_token=access_token,
        user_id=user_id,
        since_id=None  # TODO: Track last_id later
    )
    
    tweets = response.get("data", [])
    print(f"📥 Fetched {len(tweets)} mentions for {brand_id}")
    
    # 4. Filter tweets
    candidates = []
    failed_count = 0
    
    keywords = brand_config.get("keywords", [])
    watched_accounts = brand_config.get("watched_accounts", [])
    
    for tweet in tweets:
        # Check if should respond
        should_respond, risk_flags, score = tweet_filter.should_respond(
            tweet=tweet,
            keywords=keywords,
            whitelisted_authors=watched_accounts,
            min_relevance_score=0.5
        )
        
        if should_respond:
            # Good candidate!
            candidates.append({
                "tweet_id": tweet.get("id"),
                "text": tweet.get("text"),
                "author_id": tweet.get("author_id"),
                "created_at": tweet.get("created_at"),
                "relevance_score": score,
                "url": f"https://x.com/user/status/{tweet.get('id')}"
            })
        else:
            failed_count += 1
            print(f"❌ Filtered out tweet: {risk_flags}, score: {score}")
    
    print(f"✅ {len(candidates)} candidates passed filter")
    print(f"❌ {failed_count} tweets filtered out")
    
    return FetchResponse(
        brand_id=brand_id,
        total_fetched=len(tweets),
        passed_filter=len(candidates),
        failed_filter=failed_count,
        candidates=candidates
    )


@app.post("/fetch/search", response_model=FetchResponse)
async def fetch_search(request: FetchRequest):
    """
    Search for tweets matching brand keywords and filter for relevance.
    
    Steps:
    1. Get brand config from database
    2. Build search query from keywords
    3. Get X token from Composio
    4. Search tweets via X API
    5. Filter for relevance
    6. Return candidates
    """
    brand_id = request.brand_id
    
    # 1. Get brand configuration
    brand_config = await brand_db.get_brand_config(brand_id)
    if not brand_config:
        raise HTTPException(
            status_code=404,
            detail=f"Brand {brand_id} not found or not active"
        )
    
    # 2. Build search query from keywords
    keywords = brand_config.get("keywords", [])
    if not keywords:
        raise HTTPException(
            status_code=400,
            detail=f"No keywords configured for brand {brand_id}"
        )
    
    # Get brand handle if available (from platform_handles)
    platform_handles = brand_config.get("platform_handles", {})
    brand_handle = platform_handles.get("x") or platform_handles.get("twitter")
    
    # Build optimized query
    query = x_api.build_search_query(
        keywords=keywords,
        brand_handle=brand_handle,
        exclude_retweets=True,
        exclude_replies=False,  # We want to see conversations
        language="en"
    )
    
    print(f"🔍 Search query: {query}")
    
    # 3. Get X access token from Composio
    access_token = await token_manager.get_x_token(brand_id)
    if not access_token:
        raise HTTPException(
            status_code=400,
            detail=f"No X account connected for brand {brand_id}"
        )
    
    # 4. Search tweets
    response = await x_api.search_recent(
        access_token=access_token,
        query=query,
        since_id=None  # TODO: Track last_id later
    )
    
    tweets = response.get("data", [])
    print(f"📥 Fetched {len(tweets)} tweets from search")
    
    # 5. Filter tweets
    candidates = []
    failed_count = 0
    
    watched_accounts = brand_config.get("watched_accounts", [])
    
    for tweet in tweets:
        # Check if spam
        if tweet_filter.is_spam(tweet):
            failed_count += 1
            continue
        
        # Check if should respond
        should_respond, risk_flags, score = tweet_filter.should_respond(
            tweet=tweet,
            keywords=keywords,
            whitelisted_authors=watched_accounts,
            min_relevance_score=0.5
        )
        
        if should_respond:
            candidates.append({
                "tweet_id": tweet.get("id"),
                "text": tweet.get("text"),
                "author_id": tweet.get("author_id"),
                "created_at": tweet.get("created_at"),
                "relevance_score": score,
                "url": f"https://x.com/user/status/{tweet.get('id')}"
            })
        else:
            failed_count += 1
    
    print(f"✅ {len(candidates)} candidates passed filter")
    print(f"❌ {failed_count} tweets filtered out")
    
    return FetchResponse(
        brand_id=brand_id,
        total_fetched=len(tweets),
        passed_filter=len(candidates),
        failed_filter=failed_count,
        candidates=candidates
    )


@app.get("/brands")
async def list_brands():
    """List all active brands."""
    brands = await brand_db.get_active_brands()
    return {
        "count": len(brands),
        "brands": [
            {
                "id": b["id"],
                "name": b["display_name"],
                "keywords": b["keywords"],
                "watched_accounts": b["watched_accounts"]
            }
            for b in brands
        ]
    }


@app.get("/brand/{brand_id}")
async def get_brand(brand_id: str):
    """Get configuration for a specific brand."""
    config = await brand_db.get_brand_config(brand_id)
    if not config:
        raise HTTPException(status_code=404, detail="Brand not found")
    return config


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)

