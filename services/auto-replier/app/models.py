"""
Pydantic models for auto-replier service
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from decimal import Decimal


class MonitoredTweet(BaseModel):
    """Tweet we're monitoring for potential reply"""
    id: Optional[str] = None
    brand_id: str
    tweet_id: str
    tweet_text: str
    author_username: Optional[str] = None
    author_id: Optional[str] = None
    trigger_type: str  # 'mention', 'keyword', 'hashtag', 'reply_to_brand'
    matched_keywords: Optional[List[str]] = None
    likes_count: int = 0
    retweets_count: int = 0
    replies_count: int = 0
    tweet_created_at: Optional[datetime] = None
    relevance_score: Optional[Decimal] = None
    sentiment: Optional[str] = None
    engagement_score: Optional[Decimal] = None
    content_score: Optional[Decimal] = None
    status: str = "pending"  # 'pending', 'replied', 'skipped', 'failed'


class ReplyQueue(BaseModel):
    """Generated reply ready to be posted"""
    id: Optional[str] = None
    brand_id: str
    monitored_tweet_id: Optional[str] = None
    original_tweet_id: str
    original_tweet_text: str
    original_author: Optional[str] = None
    reply_text: str
    reply_tone: Optional[str] = None  # 'helpful', 'conversational', 'promotional', 'supportive'
    reply_type: Optional[str] = None  # 'answer', 'engage', 'promote', 'support'
    generation_model: Optional[str] = None
    generation_prompt: Optional[str] = None
    confidence_score: Optional[Decimal] = None
    status: str = "queued"  # 'queued', 'posting', 'posted', 'failed', 'cancelled'
    safety_passed: bool = True
    safety_flags: Optional[List[str]] = None


class PostedReply(BaseModel):
    """Successfully posted reply"""
    id: Optional[str] = None
    brand_id: str
    reply_tweet_id: str  # Our reply's tweet ID
    original_tweet_id: str
    reply_text: str
    original_tweet_text: str
    original_author: Optional[str] = None
    reply_tone: Optional[str] = None
    reply_type: Optional[str] = None
    trigger_type: Optional[str] = None
    likes_count: int = 0
    retweets_count: int = 0
    replies_count: int = 0
    views_count: int = 0
    engagement_rate: Optional[Decimal] = None
    relevance_score: Optional[Decimal] = None
    sentiment: Optional[str] = None
    posted_at: Optional[datetime] = None


class UserInteractionHistory(BaseModel):
    """Track replies to specific users"""
    id: Optional[str] = None
    brand_id: str
    user_id: str
    username: Optional[str] = None
    last_reply_at: datetime
    total_replies: int = 1


class ReplyRateLimit(BaseModel):
    """Track rate limiting"""
    id: Optional[str] = None
    brand_id: str
    time_window: str  # 'hourly' or 'daily'
    window_start: datetime
    window_end: datetime
    replies_count: int = 0
    max_replies: int


class BrandConfig(BaseModel):
    """Brand configuration for auto-replies"""
    brand_id: str
    brand_name: str
    auto_reply_enabled: bool = False
    reply_keywords: Optional[List[str]] = None
    monitored_hashtags: Optional[List[str]] = None
    max_replies_per_hour: int = 5
    max_replies_per_day: int = 20
    user_cooldown_hours: int = 24
    min_relevance_score: Decimal = Decimal("0.50")
    reply_tone_preference: str = "mix"  # 'helpful', 'conversational', 'promotional', 'mix'
    
    # Brand voice data (for AI generation)
    description: Optional[str] = None
    brand_values: Optional[str] = None
    communication_style: Optional[str] = None
    personality: Optional[str] = None
    target_market: Optional[str] = None


class RelevanceScore(BaseModel):
    """Calculated relevance score for a tweet"""
    tweet_id: str
    sentiment_score: Decimal
    engagement_score: Decimal
    content_score: Decimal
    total_score: Decimal
    sentiment: str  # 'positive', 'neutral', 'negative', 'mixed'
    should_reply: bool


class GeneratedReply(BaseModel):
    """AI-generated reply"""
    reply_text: str
    reply_tone: str
    reply_type: str
    confidence_score: Decimal
    generation_prompt: str
    model_used: str
    safety_passed: bool
    safety_flags: Optional[List[str]] = None


# API Request/Response models
class MonitorRequest(BaseModel):
    """Request to manually trigger monitoring for a brand"""
    brand_id: str
    force_fetch: bool = False


class MonitorResponse(BaseModel):
    """Response from monitoring"""
    success: bool
    brand_id: str
    tweets_fetched: int
    tweets_relevant: int
    replies_generated: int
    replies_posted: int
    message: str


class TestModeRequest(BaseModel):
    """Request to test reply generation without posting"""
    brand_id: str
    tweet_id: str
    tweet_text: str
    author_username: str


class TestModeResponse(BaseModel):
    """Response from test mode"""
    success: bool
    relevance_score: Optional[RelevanceScore] = None
    generated_reply: Optional[GeneratedReply] = None
    would_post: bool
    reason: Optional[str] = None
    
    class Config:
        # Allow extra fields for flexibility
        extra = "allow"

