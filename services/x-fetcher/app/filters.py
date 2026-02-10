"""
Tweet filtering and scoring engine.

Applies guardrails before sending to LLM:
- Language check
- Risk flags (politics, tragedy, sensitive topics)
- Relevance scoring
"""

import re
from typing import List, Tuple, Dict


class TweetFilter:
    """Filter and score tweets based on guardrails."""
    
    # Risk patterns to detect sensitive topics
    RISK_PATTERNS = {
        "politics": r"\b(trump|biden|politics|election|democrat|republican|congress)\b",
        "tragedy": r"\b(death|died|tragedy|shooting|attack|terror|suicide)\b",
        "offensive": r"\b(racist|sexist|hate|offensive|harassment)\b",
        "crisis": r"\b(war|conflict|crisis|disaster|emergency)\b",
    }
    
    def __init__(self):
        self.risk_regex = {
            name: re.compile(pattern, re.IGNORECASE)
            for name, pattern in self.RISK_PATTERNS.items()
        }
    
    def check_language(self, tweet: Dict) -> bool:
        """
        Check if tweet is in English.
        
        Args:
            tweet: Tweet object from X API
            
        Returns:
            True if English
        """
        return tweet.get("lang") == "en"
    
    def check_risk_flags(self, tweet: Dict) -> List[str]:
        """
        Detect risk flags in tweet text.
        
        Args:
            tweet: Tweet object
            
        Returns:
            List of detected risk flags
        """
        text = tweet.get("text", "")
        flags = []
        
        for risk_name, pattern in self.risk_regex.items():
            if pattern.search(text):
                flags.append(risk_name)
        
        return flags
    
    def calculate_relevance_score(
        self,
        tweet: Dict,
        keywords: List[str],
        whitelisted_authors: List[str] = None
    ) -> float:
        """
        Calculate relevance score (0.0 to 1.0).
        
        Score components:
        - Keyword match: 0.4
        - Author whitelist: 0.3
        - Engagement: 0.3
        
        Args:
            tweet: Tweet object
            keywords: Brand keywords to match
            whitelisted_authors: List of trusted author IDs
            
        Returns:
            Score from 0.0 to 1.0
        """
        score = 0.0
        text = tweet.get("text", "").lower()
        
        # Keyword match (0.4)
        keyword_matches = sum(1 for kw in keywords if kw.lower() in text)
        if keyword_matches > 0:
            score += 0.4
        
        # Author whitelist (0.3)
        if whitelisted_authors:
            author_id = tweet.get("author_id")
            if author_id in whitelisted_authors:
                score += 0.3
        
        # Engagement (0.3)
        metrics = tweet.get("public_metrics", {})
        likes = metrics.get("like_count", 0)
        replies = metrics.get("reply_count", 0)
        engagement = likes + replies
        
        if engagement >= 50:
            score += 0.3
        elif engagement >= 10:
            score += 0.2
        elif engagement >= 5:
            score += 0.1
        
        return min(score, 1.0)
    
    def should_respond(
        self,
        tweet: Dict,
        keywords: List[str],
        whitelisted_authors: List[str] = None,
        min_relevance_score: float = 0.5
    ) -> Tuple[bool, List[str], float]:
        """
        Determine if we should respond to this tweet.
        
        Args:
            tweet: Tweet object
            keywords: Brand keywords
            whitelisted_authors: Trusted authors
            min_relevance_score: Minimum score to respond
            
        Returns:
            (should_respond, risk_flags, relevance_score)
        """
        # Check language
        if not self.check_language(tweet):
            return False, ["non_english"], 0.0
        
        # Check risk flags
        risk_flags = self.check_risk_flags(tweet)
        if risk_flags:
            return False, risk_flags, 0.0
        
        # Calculate relevance
        score = self.calculate_relevance_score(
            tweet,
            keywords,
            whitelisted_authors
        )
        
        if score < min_relevance_score:
            return False, ["low_relevance"], score
        
        return True, [], score
    
    def is_duplicate_conversation(
        self,
        tweet: Dict,
        recent_conversations: set
    ) -> bool:
        """
        Check if we've already responded to this conversation.
        
        Args:
            tweet: Tweet object
            recent_conversations: Set of conversation IDs we've seen
            
        Returns:
            True if duplicate
        """
        conversation_id = tweet.get("conversation_id")
        return conversation_id in recent_conversations
    
    def is_spam(self, tweet: Dict) -> bool:
        """
        Detect potential spam tweets.
        
        Args:
            tweet: Tweet object
            
        Returns:
            True if likely spam
        """
        text = tweet.get("text", "")
        
        # Too many URLs
        url_count = text.count("http://") + text.count("https://")
        if url_count > 3:
            return True
        
        # Too many hashtags
        hashtag_count = text.count("#")
        if hashtag_count > 5:
            return True
        
        # Too many mentions
        mention_count = text.count("@")
        if mention_count > 5:
            return True
        
        # All caps (except for short tweets)
        if len(text) > 20 and text.isupper():
            return True
        
        return False


# Global instance
tweet_filter = TweetFilter()

