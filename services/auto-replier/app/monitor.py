"""
Tweet Monitoring System
Fetches tweets from X (Twitter) for auto-reply system
"""

import httpx
from typing import List, Dict, Optional
from datetime import datetime
from decimal import Decimal

from app.config import settings
from app.models import MonitoredTweet, BrandConfig
from app.database import save_monitored_tweet, get_supabase


# X API Base URL
X_API_BASE = "https://api.twitter.com/2"
MAX_RESULTS = 50  # Max tweets per request


class ComposioTokenManager:
    """Get X/Twitter tokens from Composio using SDK"""
    
    def __init__(self):
        try:
            from composio import Composio
            self.composio = Composio(api_key=settings.composio_api_key)
        except ImportError:
            print("⚠️  Composio SDK not installed. Install with: pip install composio")
            self.composio = None
    
    async def get_x_token(self, brand_id: str) -> Optional[str]:
        """
        Get X access token for a brand from Composio
        """
        if not self.composio:
            return None
        
        try:
            entity = self.composio.get_entity(id=brand_id)
            connection = entity.get_connection(app="twitter")
            
            if not connection:
                print(f"⚠️  No Twitter connection for brand {brand_id}")
                return None
            
            return connection.access_token
            
        except Exception as e:
            print(f"❌ Error getting X token: {e}")
            return None
    
    async def get_user_id(self, brand_id: str) -> Optional[str]:
        """
        Get X user ID for a brand
        """
        if not self.composio:
            return None
        
        try:
            # First try to get from connection metadata
            entity = self.composio.get_entity(id=brand_id)
            connection = entity.get_connection(app="twitter")
            
            if connection and hasattr(connection, 'metadata'):
                user_id = connection.metadata.get("user_id")
                if user_id:
                    return user_id
            
            # If not in metadata, fetch from X API
            access_token = await self.get_x_token(brand_id)
            if not access_token:
                return None
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {"Authorization": f"Bearer {access_token}"}
                response = await client.get(f"{X_API_BASE}/users/me", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("data", {}).get("id")
            
            return None
            
        except Exception as e:
            print(f"❌ Error getting user ID: {e}")
            return None


class XAPIClient:
    """Client for X API v2 calls"""
    
    async def get_mentions(
        self,
        access_token: str,
        user_id: str,
        since_id: Optional[str] = None
    ) -> Dict:
        """
        Fetch mentions for a user
        GET /2/users/:id/mentions
        """
        url = f"{X_API_BASE}/users/{user_id}/mentions"
        
        params = {
            "max_results": MAX_RESULTS,
            "expansions": "author_id",
            "tweet.fields": "created_at,lang,public_metrics,conversation_id,author_id,text",
            "user.fields": "username,name,verified"
        }
        
        if since_id:
            params["since_id"] = since_id
        
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params, headers=headers)
                
                if response.status_code == 429:
                    print("⚠️  Rate limit hit for mentions")
                    return {"data": [], "meta": {"result_count": 0}}
                
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            print(f"❌ Error fetching mentions: {e}")
            return {"data": [], "meta": {"result_count": 0}}
    
    async def search_recent(
        self,
        access_token: str,
        query: str,
        since_id: Optional[str] = None
    ) -> Dict:
        """
        Search recent tweets
        GET /2/tweets/search/recent
        """
        url = f"{X_API_BASE}/tweets/search/recent"
        
        params = {
            "query": query,
            "max_results": MAX_RESULTS,
            "expansions": "author_id",
            "tweet.fields": "created_at,lang,public_metrics,conversation_id,author_id,text",
            "user.fields": "username,name,verified"
        }
        
        if since_id:
            params["since_id"] = since_id
        
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params, headers=headers)
                
                if response.status_code == 429:
                    print("⚠️  Rate limit hit for search")
                    return {"data": [], "meta": {"result_count": 0}}
                
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            print(f"❌ Error searching tweets: {e}")
            return {"data": [], "meta": {"result_count": 0}}
    
    def build_keyword_query(self, keywords: List[str], exclude_retweets: bool = True) -> str:
        """Build search query from keywords"""
        keyword_part = " OR ".join([f'"{k}"' if " " in k else k for k in keywords])
        query = f"({keyword_part}) lang:en"
        
        if exclude_retweets:
            query += " -is:retweet"
        
        return query
    
    def build_hashtag_query(self, hashtags: List[str], exclude_retweets: bool = True) -> str:
        """Build search query from hashtags"""
        hashtag_part = " OR ".join([h if h.startswith("#") else f"#{h}" for h in hashtags])
        query = f"({hashtag_part}) lang:en"
        
        if exclude_retweets:
            query += " -is:retweet"
        
        return query


# Global instances
token_manager = ComposioTokenManager()
x_api = XAPIClient()


async def fetch_mentions(brand: BrandConfig) -> List[MonitoredTweet]:
    """
    Fetch mentions (@brand) for a brand
    """
    print(f"📥 Fetching mentions for {brand.brand_name}...")
    
    # Get tokens
    access_token = await token_manager.get_x_token(brand.brand_id)
    if not access_token:
        print(f"⚠️  No X token for {brand.brand_name}")
        return []
    
    user_id = await token_manager.get_user_id(brand.brand_id)
    if not user_id:
        print(f"⚠️  No user ID for {brand.brand_name}")
        return []
    
    # Fetch mentions
    response = await x_api.get_mentions(access_token, user_id)
    tweets = response.get("data", [])
    users = {u["id"]: u for u in response.get("includes", {}).get("users", [])}
    
    monitored = []
    for tweet in tweets:
        author_id = tweet.get("author_id")
        author = users.get(author_id, {})
        
        monitored_tweet = MonitoredTweet(
            brand_id=brand.brand_id,
            tweet_id=tweet.get("id"),
            tweet_text=tweet.get("text", ""),
            author_username=author.get("username"),
            author_id=author_id,
            trigger_type="mention",
            matched_keywords=["@mention"],
            likes_count=tweet.get("public_metrics", {}).get("like_count", 0),
            retweets_count=tweet.get("public_metrics", {}).get("retweet_count", 0),
            replies_count=tweet.get("public_metrics", {}).get("reply_count", 0),
            tweet_created_at=datetime.fromisoformat(tweet.get("created_at").replace("Z", "+00:00")) if tweet.get("created_at") else None,
            status="pending",
        )
        
        monitored.append(monitored_tweet)
    
    print(f"✅ Found {len(monitored)} mentions")
    return monitored


async def fetch_keyword_tweets(brand: BrandConfig) -> List[MonitoredTweet]:
    """
    Fetch tweets matching brand keywords
    """
    if not brand.reply_keywords:
        return []
    
    print(f"🔍 Searching keywords for {brand.brand_name}: {brand.reply_keywords}")
    
    # Get token
    access_token = await token_manager.get_x_token(brand.brand_id)
    if not access_token:
        return []
    
    # Build query
    query = x_api.build_keyword_query(brand.reply_keywords)
    print(f"   Query: {query}")
    
    # Search
    response = await x_api.search_recent(access_token, query)
    tweets = response.get("data", [])
    users = {u["id"]: u for u in response.get("includes", {}).get("users", [])}
    
    monitored = []
    for tweet in tweets:
        author_id = tweet.get("author_id")
        author = users.get(author_id, {})
        
        # Find which keywords matched
        matched = [kw for kw in brand.reply_keywords if kw.lower() in tweet.get("text", "").lower()]
        
        monitored_tweet = MonitoredTweet(
            brand_id=brand.brand_id,
            tweet_id=tweet.get("id"),
            tweet_text=tweet.get("text", ""),
            author_username=author.get("username"),
            author_id=author_id,
            trigger_type="keyword",
            matched_keywords=matched,
            likes_count=tweet.get("public_metrics", {}).get("like_count", 0),
            retweets_count=tweet.get("public_metrics", {}).get("retweet_count", 0),
            replies_count=tweet.get("public_metrics", {}).get("reply_count", 0),
            tweet_created_at=datetime.fromisoformat(tweet.get("created_at").replace("Z", "+00:00")) if tweet.get("created_at") else None,
            status="pending",
        )
        
        monitored.append(monitored_tweet)
    
    print(f"✅ Found {len(monitored)} keyword matches")
    return monitored


async def fetch_hashtag_tweets(brand: BrandConfig) -> List[MonitoredTweet]:
    """
    Fetch tweets matching monitored hashtags
    """
    if not brand.monitored_hashtags:
        return []
    
    print(f"🏷️  Searching hashtags for {brand.brand_name}: {brand.monitored_hashtags}")
    
    # Get token
    access_token = await token_manager.get_x_token(brand.brand_id)
    if not access_token:
        return []
    
    # Build query
    query = x_api.build_hashtag_query(brand.monitored_hashtags)
    print(f"   Query: {query}")
    
    # Search
    response = await x_api.search_recent(access_token, query)
    tweets = response.get("data", [])
    users = {u["id"]: u for u in response.get("includes", {}).get("users", [])}
    
    monitored = []
    for tweet in tweets:
        author_id = tweet.get("author_id")
        author = users.get(author_id, {})
        
        # Find which hashtags matched
        tweet_text_lower = tweet.get("text", "").lower()
        matched = [ht for ht in brand.monitored_hashtags if ht.lower().replace("#", "") in tweet_text_lower]
        
        monitored_tweet = MonitoredTweet(
            brand_id=brand.brand_id,
            tweet_id=tweet.get("id"),
            tweet_text=tweet.get("text", ""),
            author_username=author.get("username"),
            author_id=author_id,
            trigger_type="hashtag",
            matched_keywords=matched,
            likes_count=tweet.get("public_metrics", {}).get("like_count", 0),
            retweets_count=tweet.get("public_metrics", {}).get("retweet_count", 0),
            replies_count=tweet.get("public_metrics", {}).get("reply_count", 0),
            tweet_created_at=datetime.fromisoformat(tweet.get("created_at").replace("Z", "+00:00")) if tweet.get("created_at") else None,
            status="pending",
        )
        
        monitored.append(monitored_tweet)
    
    print(f"✅ Found {len(monitored)} hashtag matches")
    return monitored


async def fetch_replies_to_brand(brand: BrandConfig) -> List[MonitoredTweet]:
    """
    Fetch replies to brand's tweets
    TODO: This requires getting brand's recent tweets first, then fetching replies
    For now, we'll skip this and implement in a future update
    """
    print(f"💬 Fetching replies to {brand.brand_name} tweets...")
    # TODO: Implement replies fetching
    return []


async def monitor_brand(brand: BrandConfig, score_immediately: bool = False) -> Dict:
    """
    Main monitoring function - fetches all types of tweets for a brand
    Optionally scores tweets immediately after fetching
    In test mode: Still fetches and saves tweets, but logs test mode status
    
    Returns summary of what was found
    """
    from app.config import settings
    
    test_mode_indicator = " 🧪 TEST MODE" if settings.test_mode else ""
    print(f"\n{'='*60}")
    print(f"🔍 Monitoring: {brand.brand_name}{test_mode_indicator}")
    print(f"{'='*60}")
    
    all_tweets = []
    
    # 1. Fetch mentions
    mentions = await fetch_mentions(brand)
    all_tweets.extend(mentions)
    
    # 2. Fetch keyword matches
    keyword_tweets = await fetch_keyword_tweets(brand)
    all_tweets.extend(keyword_tweets)
    
    # 3. Fetch hashtag matches
    hashtag_tweets = await fetch_hashtag_tweets(brand)
    all_tweets.extend(hashtag_tweets)
    
    # 4. Fetch replies (TODO)
    # replies = await fetch_replies_to_brand(brand)
    # all_tweets.extend(replies)
    
    # Save to database
    saved_count = 0
    for tweet in all_tweets:
        try:
            await save_monitored_tweet(tweet)
            saved_count += 1
        except Exception as e:
            print(f"⚠️  Failed to save tweet {tweet.tweet_id}: {e}")
    
    print(f"\n✅ Monitoring complete for {brand.brand_name}:")
    print(f"   - Mentions: {len(mentions)}")
    print(f"   - Keywords: {len(keyword_tweets)}")
    print(f"   - Hashtags: {len(hashtag_tweets)}")
    print(f"   - Total saved: {saved_count}/{len(all_tweets)}")
    
    # Score tweets if requested
    relevant_count = 0
    if score_immediately and saved_count > 0:
        print(f"\n📊 Scoring tweets...")
        from app.relevance_scoring import score_pending_tweets
        score_result = await score_pending_tweets(brand, limit=saved_count)
        relevant_count = score_result.get("tweets_relevant", 0)
        print(f"   - Relevant tweets: {relevant_count}")
    
    print(f"{'='*60}\n")
    
    return {
        "brand_id": brand.brand_id,
        "brand_name": brand.brand_name,
        "mentions": len(mentions),
        "keywords": len(keyword_tweets),
        "hashtags": len(hashtag_tweets),
        "total_fetched": len(all_tweets),
        "total_saved": saved_count,
        "relevant_tweets": relevant_count,
    }


async def monitor_all_brands():
    """
    Monitor all brands with auto-reply enabled
    """
    from app.database import get_brands_with_auto_reply_enabled
    
    try:
        brands = await get_brands_with_auto_reply_enabled()
        
        if not brands:
            print("⚠️  No brands with auto-reply enabled")
            return []
        
        results = []
        for brand in brands:
            try:
                result = await monitor_brand(brand)
                results.append(result)
            except Exception as e:
                print(f"❌ Error monitoring {brand.brand_name}: {e}")
                results.append({
                    "brand_id": brand.brand_id,
                    "brand_name": brand.brand_name,
                    "error": str(e),
                })
        
        return results
        
    except Exception as e:
        print(f"❌ Error in monitor_all_brands: {e}")
        return []

