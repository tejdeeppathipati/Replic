"""
Relevance Scoring System
Calculates relevance scores for monitored tweets using:
- Sentiment analysis (AI-powered)
- Engagement metrics
- Content matching
"""

from typing import Dict, Optional
from decimal import Decimal
from datetime import datetime

from app.config import settings
from app.models import MonitoredTweet, BrandConfig, RelevanceScore


class XAIClient:
    """Client for xAI (Grok) API for sentiment analysis"""
    
    def __init__(self):
        self.api_key = settings.xai_api_key
        self.base_url = settings.xai_base_url or "https://api.x.ai/v1"
        self.model = settings.xai_model
    
    async def analyze_sentiment(self, tweet_text: str) -> Dict:
        """
        Analyze sentiment of a tweet using xAI/Grok
        Returns: {"sentiment": "positive|neutral|negative|mixed", "score": 0.0-1.0}
        """
        if not self.api_key:
            # Fallback to neutral if no API key
            return {"sentiment": "neutral", "score": 0.5, "confidence": 0.5}
        
        try:
            import httpx
            
            prompt = f"""Analyze the sentiment of this tweet and respond with ONLY a JSON object in this exact format:
{{
  "sentiment": "positive" or "neutral" or "negative" or "mixed",
  "score": 0.0 to 1.0 (where 1.0 is most positive, 0.0 is most negative, 0.5 is neutral),
  "confidence": 0.0 to 1.0 (how confident you are in this analysis)
}}

Tweet: "{tweet_text}"

Respond with ONLY the JSON, no other text."""

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": "You are a sentiment analysis expert. Always respond with valid JSON only."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 150,
                        "stream": False,
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    
                    # Parse JSON from response
                    import json
                    import re
                    
                    # Extract JSON from response (in case there's extra text)
                    json_match = re.search(r'\{[^}]+\}', content)
                    if json_match:
                        result = json.loads(json_match.group())
                        return {
                            "sentiment": result.get("sentiment", "neutral"),
                            "score": float(result.get("score", 0.5)),
                            "confidence": float(result.get("confidence", 0.5)),
                        }
                
                # Fallback
                return {"sentiment": "neutral", "score": 0.5, "confidence": 0.5}
                
        except Exception as e:
            print(f"⚠️  Error in sentiment analysis: {e}")
            return {"sentiment": "neutral", "score": 0.5, "confidence": 0.5}


def calculate_engagement_score(tweet: MonitoredTweet) -> Decimal:
    """
    Calculate engagement score based on likes, retweets, and replies
    Returns: 0.0 to 1.0
    """
    likes = tweet.likes_count
    retweets = tweet.retweets_count
    replies = tweet.replies_count
    
    # Weighted engagement calculation
    # Likes are most valuable, then retweets, then replies
    total_engagement = (likes * 1.0) + (retweets * 1.5) + (replies * 0.8)
    
    # Normalize to 0-1 scale using thresholds
    if total_engagement >= settings.high_engagement_threshold:
        # High engagement: 0.8 to 1.0
        normalized = min(1.0, 0.8 + (total_engagement - settings.high_engagement_threshold) / 500)
    elif total_engagement >= settings.medium_engagement_threshold:
        # Medium engagement: 0.4 to 0.8
        normalized = 0.4 + ((total_engagement - settings.medium_engagement_threshold) / 
                           (settings.high_engagement_threshold - settings.medium_engagement_threshold)) * 0.4
    else:
        # Low engagement: 0.0 to 0.4
        normalized = min(0.4, total_engagement / settings.medium_engagement_threshold * 0.4)
    
    return Decimal(str(round(normalized, 2)))


def calculate_content_score(tweet: MonitoredTweet, brand: BrandConfig) -> Decimal:
    """
    Calculate content match score based on keyword matching
    Returns: 0.0 to 1.0
    """
    tweet_text_lower = tweet.tweet_text.lower()
    
    # Check matched keywords
    matched_keywords = tweet.matched_keywords or []
    
    # Check brand keywords
    brand_keywords = brand.reply_keywords or []
    
    # Count matches
    keyword_matches = 0
    for keyword in brand_keywords:
        if keyword.lower() in tweet_text_lower:
            keyword_matches += 1
    
    # Check hashtags
    hashtag_matches = 0
    brand_hashtags = brand.monitored_hashtags or []
    for hashtag in brand_hashtags:
        hashtag_clean = hashtag.lower().replace("#", "")
        if hashtag_clean in tweet_text_lower:
            hashtag_matches += 1
    
    # Calculate score
    total_possible = len(brand_keywords) + len(brand_hashtags)
    if total_possible == 0:
        # If no keywords/hashtags configured, give neutral score
        return Decimal("0.5")
    
    matches = len(matched_keywords) + keyword_matches + hashtag_matches
    score = min(1.0, matches / total_possible)
    
    # Boost score if it's a mention
    if tweet.trigger_type == "mention":
        score = min(1.0, score * 1.2)  # 20% boost for mentions
    
    return Decimal(str(round(score, 2)))


def calculate_sentiment_score(sentiment: str, sentiment_ai_score: float) -> Decimal:
    """
    Convert sentiment analysis to a score (0.0 to 1.0)
    Positive tweets get higher scores, negative get lower
    """
    if sentiment == "positive":
        # Use AI score directly (should be 0.6-1.0 for positive)
        return Decimal(str(round(max(0.6, sentiment_ai_score), 2)))
    elif sentiment == "negative":
        # Negative tweets get low score (0.0-0.4)
        return Decimal(str(round(min(0.4, sentiment_ai_score), 2)))
    elif sentiment == "mixed":
        # Mixed sentiment gets medium score (0.4-0.6)
        return Decimal(str(round(0.4 + (sentiment_ai_score - 0.5) * 0.4, 2)))
    else:  # neutral
        # Neutral gets medium score (0.4-0.6)
        return Decimal(str(round(0.4 + (sentiment_ai_score - 0.5) * 0.4, 2)))


async def score_tweet_relevance(tweet: MonitoredTweet, brand: BrandConfig) -> RelevanceScore:
    """
    Calculate complete relevance score for a tweet
    
    Returns RelevanceScore with:
    - sentiment_score (0.0-1.0)
    - engagement_score (0.0-1.0)
    - content_score (0.0-1.0)
    - total_score (weighted combination)
    - sentiment (positive/neutral/negative/mixed)
    - should_reply (bool)
    """
    xai_client = XAIClient()
    
    # 1. Sentiment Analysis (AI-powered)
    print(f"   📊 Analyzing sentiment for tweet {tweet.tweet_id[:10]}...")
    sentiment_result = await xai_client.analyze_sentiment(tweet.tweet_text)
    sentiment = sentiment_result.get("sentiment", "neutral")
    sentiment_ai_score = sentiment_result.get("score", 0.5)
    sentiment_score = calculate_sentiment_score(sentiment, sentiment_ai_score)
    
    # 2. Engagement Score
    engagement_score = calculate_engagement_score(tweet)
    
    # 3. Content Match Score
    content_score = calculate_content_score(tweet, brand)
    
    # 4. Combined Score (weighted)
    total_score = (
        sentiment_score * Decimal(str(settings.sentiment_weight)) +
        engagement_score * Decimal(str(settings.engagement_weight)) +
        content_score * Decimal(str(settings.content_weight))
    )
    
    # Round to 2 decimal places
    total_score = Decimal(str(round(float(total_score), 2)))
    
    # 5. Should we reply?
    min_score = brand.min_relevance_score
    should_reply = total_score >= min_score
    
    print(f"   ✅ Scores: Sentiment={sentiment_score} ({sentiment}), "
          f"Engagement={engagement_score}, Content={content_score}, "
          f"Total={total_score}, Should reply: {should_reply}")
    
    return RelevanceScore(
        tweet_id=tweet.tweet_id,
        sentiment_score=sentiment_score,
        engagement_score=engagement_score,
        content_score=content_score,
        total_score=total_score,
        sentiment=sentiment,
        should_reply=should_reply,
    )


async def score_pending_tweets(brand: BrandConfig, limit: int = 20) -> Dict:
    """
    Score all pending tweets for a brand
    Returns summary of scoring results
    """
    from app.database import get_pending_monitored_tweets, update_monitored_tweet_status
    
    print(f"\n{'='*60}")
    print(f"📊 Scoring tweets for: {brand.brand_name}")
    print(f"{'='*60}")
    
    # Get pending tweets
    pending_tweets = await get_pending_monitored_tweets(brand.brand_id, limit=limit)
    
    if not pending_tweets:
        print("   No pending tweets to score")
        return {
            "brand_id": brand.brand_id,
            "tweets_scored": 0,
            "tweets_relevant": 0,
            "tweets_skipped": 0,
        }
    
    print(f"   Found {len(pending_tweets)} pending tweets")
    
    scored_count = 0
    relevant_count = 0
    skipped_count = 0
    
    for tweet in pending_tweets:
        try:
            # Score the tweet
            score_result = await score_tweet_relevance(tweet, brand)
            
            # Update tweet in database with scores
            from app.database import get_supabase
            supabase = get_supabase()
            
            # Find the tweet by brand_id and tweet_id (since we might not have the DB id)
            update_data = {
                "relevance_score": float(score_result.total_score),
                "sentiment": score_result.sentiment,
                "engagement_score": float(score_result.engagement_score),
                "content_score": float(score_result.content_score),
                "status": "replied" if score_result.should_reply else "skipped",
            }
            
            # Try to update by id first, then by tweet_id
            if tweet.id:
                supabase.table("monitored_tweets")\
                    .update(update_data)\
                    .eq("id", tweet.id)\
                    .execute()
            else:
                supabase.table("monitored_tweets")\
                    .update(update_data)\
                    .eq("brand_id", brand.brand_id)\
                    .eq("tweet_id", tweet.tweet_id)\
                    .execute()
            
            scored_count += 1
            
            if score_result.should_reply:
                relevant_count += 1
            else:
                skipped_count += 1
            
            # Small delay to avoid rate limits
            import asyncio
            await asyncio.sleep(0.5)
            
        except Exception as e:
            print(f"   ⚠️  Error scoring tweet {tweet.tweet_id}: {e}")
            skipped_count += 1
    
    print(f"\n✅ Scoring complete:")
    print(f"   - Scored: {scored_count}")
    print(f"   - Relevant (should reply): {relevant_count}")
    print(f"   - Skipped (low score): {skipped_count}")
    print(f"{'='*60}\n")
    
    return {
        "brand_id": brand.brand_id,
        "tweets_scored": scored_count,
        "tweets_relevant": relevant_count,
        "tweets_skipped": skipped_count,
    }


async def score_all_pending_tweets(limit_per_brand: int = 20) -> Dict:
    """
    Score pending tweets for all brands with auto-reply enabled
    """
    from app.database import get_brands_with_auto_reply_enabled
    
    brands = await get_brands_with_auto_reply_enabled()
    
    if not brands:
        print("⚠️  No brands with auto-reply enabled")
        return {"brands_scored": 0, "total_scored": 0, "total_relevant": 0}
    
    results = []
    total_scored = 0
    total_relevant = 0
    
    for brand in brands:
        try:
            result = await score_pending_tweets(brand, limit=limit_per_brand)
            results.append(result)
            total_scored += result.get("tweets_scored", 0)
            total_relevant += result.get("tweets_relevant", 0)
        except Exception as e:
            print(f"❌ Error scoring tweets for {brand.brand_name}: {e}")
    
    return {
        "brands_scored": len(results),
        "total_scored": total_scored,
        "total_relevant": total_relevant,
        "results": results,
    }

