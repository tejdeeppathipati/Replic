"""
Safety Checks System
Enhanced safety checks for tweets and replies:
- Spam detection
- Account validation
- Content filtering
- Risk assessment
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from app.config import settings
from app.models import MonitoredTweet, BrandConfig


class SafetyChecker:
    """Comprehensive safety checking for tweets and replies"""
    
    def __init__(self):
        self.min_account_age_days = settings.min_account_age_days
        self.min_account_followers = settings.min_account_followers
    
    async def check_account_safety(
        self,
        author_id: Optional[str],
        author_username: Optional[str],
        tweet_created_at: Optional[datetime]
    ) -> Dict:
        """
        Check if account is safe to reply to
        
        Returns:
            {
                "safe": bool,
                "flags": List[str],
                "risk_level": "low|medium|high"
            }
        """
        flags = []
        risk_level = "low"
        
        # Check account age (if we have tweet creation date)
        if tweet_created_at:
            account_age_days = (datetime.now() - tweet_created_at.replace(tzinfo=None)).days
            if account_age_days < self.min_account_age_days:
                flags.append(f"account_too_new_{account_age_days}_days")
                risk_level = "medium"
        
        # Check for suspicious username patterns
        if author_username:
            username_lower = author_username.lower()
            
            # Suspicious patterns
            suspicious_patterns = [
                "bot", "spam", "fake", "test", "temp",
                len(username_lower) < 3,  # Too short
                username_lower.count("_") > 3,  # Too many underscores
                username_lower.count("0") > 3,  # Too many numbers
            ]
            
            if any(suspicious_patterns):
                flags.append("suspicious_username_pattern")
                risk_level = "high"
        
        # Note: We don't have follower count from X API in monitored_tweets
        # This would need to be fetched separately if needed
        
        return {
            "safe": len(flags) == 0,
            "flags": flags,
            "risk_level": risk_level,
        }
    
    def check_content_safety(self, tweet_text: str) -> Dict:
        """
        Check if tweet content is safe to reply to
        
        Returns:
            {
                "safe": bool,
                "flags": List[str],
                "risk_level": "low|medium|high"
            }
        """
        flags = []
        risk_level = "low"
        text_lower = tweet_text.lower()
        
        # Inappropriate language
        inappropriate_words = [
            "fuck", "shit", "damn", "asshole", "bitch",
            "kill", "die", "hate", "stupid", "idiot"
        ]
        if any(word in text_lower for word in inappropriate_words):
            flags.append("inappropriate_language")
            risk_level = "high"
        
        # Controversial topics (avoid)
        controversial_topics = [
            "politics", "religion", "covid", "vaccine",
            "conspiracy", "fake news", "scam"
        ]
        if any(topic in text_lower for topic in controversial_topics):
            flags.append("controversial_topic")
            risk_level = "high"
        
        # Spam patterns
        spam_patterns = [
            "click here", "free money", "make $", "guaranteed",
            "limited time", "act now", "buy now", "click link",
            text_lower.count("!") > 5,  # Too many exclamation marks
            text_lower.count("$") > 3,  # Too many dollar signs
        ]
        if any(spam_patterns):
            flags.append("spam_pattern")
            risk_level = "medium"
        
        # Check for excessive links/mentions
        if tweet_text.count("http") > 2:
            flags.append("too_many_links")
            risk_level = "medium"
        
        if tweet_text.count("@") > 5:
            flags.append("too_many_mentions")
            risk_level = "medium"
        
        # Check length (very short might be spam)
        if len(tweet_text) < 10:
            flags.append("too_short")
            risk_level = "medium"
        
        return {
            "safe": len(flags) == 0,
            "flags": flags,
            "risk_level": risk_level,
        }
    
    def check_reply_safety(self, reply_text: str) -> Dict:
        """
        Check if generated reply is safe to post
        
        Returns:
            {
                "safe": bool,
                "flags": List[str],
                "risk_level": "low|medium|high"
            }
        """
        flags = []
        risk_level = "low"
        text_lower = reply_text.lower()
        
        # Inappropriate language
        inappropriate_words = [
            "fuck", "shit", "damn", "asshole", "bitch",
            "kill", "die", "hate"
        ]
        if any(word in text_lower for word in inappropriate_words):
            flags.append("inappropriate_language")
            risk_level = "high"
        
        # Check length
        if len(reply_text) > 280:
            flags.append("too_long")
            risk_level = "high"
        elif len(reply_text) < 10:
            flags.append("too_short")
            risk_level = "medium"
        
        # Check for excessive emojis
        emoji_count = sum(1 for char in reply_text if ord(char) > 127)
        if emoji_count > 5:
            flags.append("too_many_emojis")
            risk_level = "medium"
        
        # Check for spam patterns
        spam_patterns = [
            "click here", "buy now", "limited time",
            reply_text.count("!") > 3,
            reply_text.count("$") > 2,
        ]
        if any(spam_patterns):
            flags.append("spam_pattern")
            risk_level = "high"
        
        # Check for URLs (should be minimal)
        if reply_text.count("http") > 1:
            flags.append("too_many_urls")
            risk_level = "medium"
        
        return {
            "safe": len(flags) == 0,
            "flags": flags,
            "risk_level": risk_level,
        }
    
    async def assess_tweet_risk(
        self,
        tweet: MonitoredTweet,
        brand: BrandConfig
    ) -> Dict:
        """
        Complete risk assessment for a tweet
        
        Returns:
            {
                "safe_to_reply": bool,
                "risk_level": "low|medium|high",
                "flags": List[str],
                "account_safe": bool,
                "content_safe": bool,
                "recommendation": "reply|skip|review"
            }
        """
        # 1. Check account safety
        account_check = await self.check_account_safety(
            tweet.author_id,
            tweet.author_username,
            tweet.tweet_created_at
        )
        
        # 2. Check content safety
        content_check = self.check_content_safety(tweet.tweet_text)
        
        # 3. Check sentiment (negative tweets need careful handling)
        sentiment_risk = "low"
        if tweet.sentiment == "negative":
            # Negative tweets are OK if they're questions/complaints we can help with
            if "?" in tweet.tweet_text or any(word in tweet.tweet_text.lower() for word in ["help", "problem", "issue"]):
                sentiment_risk = "low"  # We can help
            else:
                sentiment_risk = "medium"  # Might be just complaining
        
        # 4. Combine all checks
        all_flags = account_check["flags"] + content_check["flags"]
        risk_level = max(
            account_check["risk_level"],
            content_check["risk_level"],
            sentiment_risk
        )
        
        # Determine if safe to reply
        safe_to_reply = (
            account_check["safe"] and
            content_check["safe"] and
            risk_level != "high"
        )
        
        # Recommendation
        if safe_to_reply and risk_level == "low":
            recommendation = "reply"
        elif safe_to_reply and risk_level == "medium":
            recommendation = "review"  # Human should review
        else:
            recommendation = "skip"
        
        return {
            "safe_to_reply": safe_to_reply,
            "risk_level": risk_level,
            "flags": all_flags,
            "account_safe": account_check["safe"],
            "content_safe": content_check["safe"],
            "sentiment_risk": sentiment_risk,
            "recommendation": recommendation,
        }
    
    async def assess_reply_risk(
        self,
        reply_text: str,
        original_tweet: MonitoredTweet
    ) -> Dict:
        """
        Complete risk assessment for a generated reply
        
        Returns:
            {
                "safe_to_post": bool,
                "risk_level": "low|medium|high",
                "flags": List[str],
                "recommendation": "post|skip|review"
            }
        """
        # Check reply content
        reply_check = self.check_reply_safety(reply_text)
        
        # Check if reply makes sense for the original tweet
        context_match = "good"
        if len(reply_text) < 20:
            context_match = "poor"
        elif not any(word in reply_text.lower() for word in original_tweet.tweet_text.lower().split()[:5]):
            # Reply doesn't reference original tweet at all
            context_match = "poor"
        
        # Combine checks
        all_flags = reply_check["flags"]
        if context_match == "poor":
            all_flags.append("poor_context_match")
        
        risk_level = reply_check["risk_level"]
        if context_match == "poor":
            risk_level = "medium" if risk_level == "low" else risk_level
        
        # Determine if safe to post
        safe_to_post = (
            reply_check["safe"] and
            context_match != "poor" and
            risk_level != "high"
        )
        
        # Recommendation
        if safe_to_post and risk_level == "low":
            recommendation = "post"
        elif safe_to_post and risk_level == "medium":
            recommendation = "review"
        else:
            recommendation = "skip"
        
        return {
            "safe_to_post": safe_to_post,
            "risk_level": risk_level,
            "flags": all_flags,
            "context_match": context_match,
            "recommendation": recommendation,
        }


# Global instance
safety_checker = SafetyChecker()


async def check_tweet_before_reply(tweet: MonitoredTweet, brand: BrandConfig) -> Dict:
    """
    Main function to check if we should reply to a tweet
    """
    return await safety_checker.assess_tweet_risk(tweet, brand)


async def check_reply_before_posting(reply_text: str, original_tweet: MonitoredTweet) -> Dict:
    """
    Main function to check if we should post a generated reply
    """
    return await safety_checker.assess_reply_risk(reply_text, original_tweet)

