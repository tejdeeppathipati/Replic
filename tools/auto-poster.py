#!/usr/bin/env python3
"""
Auto-Poster - Automatic tweet reply pipeline (no approval needed).

Flow:
1. Fetch tweets (X Fetcher)
2. Generate replies (LLM Generator)
3. Post automatically (X Poster)

Usage:
    python tools/auto-poster.py --brand-id YOUR_BRAND_UUID
    
    # Or run continuously
    python tools/auto-poster.py --brand-id YOUR_BRAND_UUID --loop --interval 300
"""

import asyncio
import httpx
import argparse
import time
from datetime import datetime


# Service URLs
X_FETCHER_URL = "http://localhost:8200"
LLM_GENERATOR_URL = "http://localhost:8300"
X_POSTER_URL = "http://localhost:8400"


async def fetch_tweets(brand_id: str) -> list:
    """Fetch tweet candidates from X Fetcher."""
    print(f"📥 Fetching tweets for brand: {brand_id}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(f"{X_FETCHER_URL}/fetch/{brand_id}")
            response.raise_for_status()
            result = response.json()
            
            candidates = result.get("candidates", [])
            print(f"✅ Found {len(candidates)} candidates")
            return candidates
            
        except Exception as e:
            print(f"❌ Failed to fetch tweets: {e}")
            return []


async def generate_reply(candidate: dict, brand_id: str, persona: str = "normal") -> dict:
    """Generate reply using LLM Generator."""
    print(f"🤖 Generating reply for tweet: {candidate['tweet_id']}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{LLM_GENERATOR_URL}/generate",
                json={
                    "tweet_text": candidate["text"],
                    "tweet_id": candidate["tweet_id"],
                    "author_username": candidate.get("author_username"),
                    "brand_id": brand_id,
                    "persona": persona,
                    "context_url": candidate["url"]
                }
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("is_valid"):
                print(f"✅ Generated: {result['proposed_text']}")
                return result
            else:
                print(f"⚠️  Invalid reply: {result.get('validation_error')}")
                return None
                
        except Exception as e:
            print(f"❌ Failed to generate reply: {e}")
            return None


async def post_tweet(brand_id: str, text: str, reply_to_tweet_id: str) -> dict:
    """Post tweet via X Poster."""
    print(f"📤 Posting tweet...")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{X_POSTER_URL}/post",
                json={
                    "brand_id": brand_id,
                    "text": text,
                    "reply_to_tweet_id": reply_to_tweet_id
                }
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("success"):
                print(f"✅ Posted! {result.get('tweet_url')}")
                return result
            else:
                print(f"❌ Post failed: {result.get('error')}")
                return None
                
        except Exception as e:
            print(f"❌ Failed to post tweet: {e}")
            return None


async def run_pipeline(brand_id: str, persona: str = "normal", max_posts: int = 5):
    """
    Run the complete auto-post pipeline.
    
    Args:
        brand_id: Brand UUID
        persona: Reply persona (normal/smart/technical/unhinged)
        max_posts: Maximum number of posts per run
    """
    print("=" * 70)
    print(f"🚀 Auto-Poster Pipeline Started")
    print(f"   Brand ID: {brand_id}")
    print(f"   Persona: {persona}")
    print(f"   Max Posts: {max_posts}")
    print(f"   Time: {datetime.now().isoformat()}")
    print("=" * 70)
    print()
    
    # 1. Fetch tweets
    candidates = await fetch_tweets(brand_id)
    
    if not candidates:
        print("No candidates found. Exiting.")
        return
    
    # Limit to max_posts
    candidates = candidates[:max_posts]
    
    # 2. For each candidate: generate reply and post
    posted_count = 0
    failed_count = 0
    
    for i, candidate in enumerate(candidates, 1):
        print(f"\n--- Candidate {i}/{len(candidates)} ---")
        print(f"Tweet: {candidate['text'][:80]}...")
        print(f"Author: @{candidate.get('author_username', 'unknown')}")
        print()
        
        # Generate reply
        reply = await generate_reply(candidate, brand_id, persona)
        
        if not reply:
            failed_count += 1
            continue
        
        # Post tweet
        result = await post_tweet(
            brand_id=brand_id,
            text=reply["proposed_text"],
            reply_to_tweet_id=candidate["tweet_id"]
        )
        
        if result:
            posted_count += 1
        else:
            failed_count += 1
        
        # Rate limit: wait between posts
        if i < len(candidates):
            print("⏳ Waiting 5 seconds before next post...")
            await asyncio.sleep(5)
    
    # Summary
    print()
    print("=" * 70)
    print(f"✅ Pipeline Complete!")
    print(f"   Posted: {posted_count}")
    print(f"   Failed: {failed_count}")
    print(f"   Total: {len(candidates)}")
    print("=" * 70)


async def run_loop(brand_id: str, persona: str, max_posts: int, interval: int):
    """Run pipeline in a loop."""
    print(f"🔄 Running in loop mode (every {interval} seconds)")
    print("Press Ctrl+C to stop")
    print()
    
    try:
        while True:
            await run_pipeline(brand_id, persona, max_posts)
            print(f"\n⏳ Waiting {interval} seconds until next run...")
            print(f"   Next run at: {datetime.fromtimestamp(time.time() + interval).isoformat()}")
            print()
            await asyncio.sleep(interval)
    except KeyboardInterrupt:
        print("\n\n🛑 Stopped by user")


def main():
    parser = argparse.ArgumentParser(
        description="Auto-Poster - Automatic tweet reply pipeline"
    )
    parser.add_argument(
        "--brand-id",
        required=True,
        help="Brand UUID from Supabase"
    )
    parser.add_argument(
        "--persona",
        default="normal",
        choices=["normal", "smart", "technical", "unhinged"],
        help="Reply persona (default: normal)"
    )
    parser.add_argument(
        "--max-posts",
        type=int,
        default=5,
        help="Maximum posts per run (default: 5)"
    )
    parser.add_argument(
        "--loop",
        action="store_true",
        help="Run continuously in a loop"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=300,
        help="Loop interval in seconds (default: 300 = 5 minutes)"
    )
    
    args = parser.parse_args()
    
    # Run pipeline
    if args.loop:
        asyncio.run(run_loop(
            brand_id=args.brand_id,
            persona=args.persona,
            max_posts=args.max_posts,
            interval=args.interval
        ))
    else:
        asyncio.run(run_pipeline(
            brand_id=args.brand_id,
            persona=args.persona,
            max_posts=args.max_posts
        ))


if __name__ == "__main__":
    main()
