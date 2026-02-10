"""
Direct X API calls for fetching tweets.

We use direct API calls (not Composio SDK) for more control over:
- Rate limiting
- Query optimization
- Response handling
- Following hackathon spec exactly
"""

import httpx
from typing import List, Dict, Optional
from datetime import datetime

from app.config import settings


class XAPIClient:
    """Client for direct X API v2 calls."""
    
    def __init__(self):
        self.base_url = settings.x_api_base
        self.max_results = settings.max_results_per_poll
    
    async def get_mentions(
        self,
        access_token: str,
        user_id: str,
        since_id: Optional[str] = None
    ) -> Dict:
        """
        Fetch mentions for a user.
        
        GET /2/users/:id/mentions
        Rate limit: 450 requests per 15 min window
        
        Args:
            access_token: OAuth token from Composio
            user_id: X user ID
            since_id: Only return tweets after this ID
            
        Returns:
            API response dict with tweets
        """
        url = f"{self.base_url}/users/{user_id}/mentions"
        
        params = {
            "max_results": self.max_results,
            "expansions": "author_id,referenced_tweets.id",
            "tweet.fields": "created_at,lang,public_metrics,conversation_id,author_id",
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
                
                # Check rate limit headers
                self._log_rate_limit(response.headers, "mentions")
                
                response.raise_for_status()
                return response.json()
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                print(f"⚠️  Rate limit hit for mentions. Wait and retry.")
                return {"data": [], "meta": {"result_count": 0}}
            raise
        except Exception as e:
            print(f"Error fetching mentions: {e}")
            return {"data": [], "meta": {"result_count": 0}}
    
    async def search_recent(
        self,
        access_token: str,
        query: str,
        since_id: Optional[str] = None
    ) -> Dict:
        """
        Search recent tweets matching a query.
        
        GET /2/tweets/search/recent
        Rate limit: 180 requests per 15 min window
        
        Args:
            access_token: OAuth token from Composio
            query: Search query (e.g., "(brand OR keyword) lang:en -is:retweet")
            since_id: Only return tweets after this ID
            
        Returns:
            API response dict with tweets
        """
        url = f"{self.base_url}/tweets/search/recent"
        
        params = {
            "query": query,
            "max_results": self.max_results,
            "expansions": "author_id,referenced_tweets.id",
            "tweet.fields": "created_at,lang,public_metrics,conversation_id,author_id",
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
                
                # Check rate limit headers
                self._log_rate_limit(response.headers, "search")
                
                response.raise_for_status()
                return response.json()
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                print(f"⚠️  Rate limit hit for search. Wait and retry.")
                return {"data": [], "meta": {"result_count": 0}}
            raise
        except Exception as e:
            print(f"Error searching tweets: {e}")
            return {"data": [], "meta": {"result_count": 0}}
    
    async def get_tweet(
        self,
        access_token: str,
        tweet_id: str
    ) -> Optional[Dict]:
        """
        Get a single tweet by ID.
        
        Args:
            access_token: OAuth token
            tweet_id: Tweet ID
            
        Returns:
            Tweet data or None
        """
        url = f"{self.base_url}/tweets/{tweet_id}"
        
        params = {
            "expansions": "author_id",
            "tweet.fields": "created_at,lang,public_metrics,conversation_id",
            "user.fields": "username,name,verified"
        }
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params, headers=headers)
                response.raise_for_status()
                return response.json().get("data")
        except Exception as e:
            print(f"Error fetching tweet {tweet_id}: {e}")
            return None
    
    def _log_rate_limit(self, headers: httpx.Headers, endpoint: str):
        """Log rate limit information from response headers."""
        remaining = headers.get("x-rate-limit-remaining")
        reset = headers.get("x-rate-limit-reset")
        
        if remaining and reset:
            reset_time = datetime.fromtimestamp(int(reset))
            print(f"📊 Rate limit [{endpoint}]: {remaining} remaining, resets at {reset_time}")
            
            # Warn if running low
            if int(remaining) < 10:
                print(f"⚠️  Low rate limit for {endpoint}! Only {remaining} requests left.")
    
    def build_search_query(
        self,
        keywords: List[str],
        brand_handle: Optional[str] = None,
        exclude_retweets: bool = True,
        exclude_replies: bool = True,
        language: str = "en"
    ) -> str:
        """
        Build optimized search query.
        
        Args:
            keywords: List of keywords/phrases
            brand_handle: Twitter handle (without @)
            exclude_retweets: Exclude retweets
            exclude_replies: Exclude replies
            language: Language code
            
        Returns:
            Query string for X API
        """
        # Combine keywords with OR
        keyword_part = " OR ".join([f'"{k}"' if " " in k else k for k in keywords])
        
        # Add brand handle if provided
        if brand_handle:
            keyword_part = f"({keyword_part} OR @{brand_handle})"
        else:
            keyword_part = f"({keyword_part})"
        
        # Add filters
        filters = [f"lang:{language}"]
        
        if exclude_retweets:
            filters.append("-is:retweet")
        
        if exclude_replies:
            filters.append("-is:reply")
        
        # Combine
        query = f"{keyword_part} {' '.join(filters)}"
        
        return query.strip()


# Global instance
x_api = XAPIClient()

