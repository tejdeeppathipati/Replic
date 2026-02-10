"""
Reply Generation System
Generates context-aware, brand-voice replies using AI
"""

from typing import Dict, Optional, List
from decimal import Decimal
from datetime import datetime

from app.config import settings
from app.models import (
    MonitoredTweet,
    BrandConfig,
    GeneratedReply,
    ReplyQueue,
)


class XAIClient:
    """Client for xAI (Grok) API for reply generation"""
    
    def __init__(self):
        self.api_key = settings.xai_api_key
        self.base_url = settings.xai_base_url or "https://api.x.ai/v1"
        self.model = settings.xai_model
    
    async def generate_reply(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 150,
        temperature: float = 0.7
    ) -> str:
        """
        Generate a reply using xAI/Grok
        
        Args:
            system_prompt: System instructions with brand context
            user_prompt: Specific reply request
            max_tokens: Max length of reply (default: 150 for tweets)
            temperature: Creativity (0.0-1.0, default: 0.7)
            
        Returns:
            Generated reply text
        """
        if not self.api_key:
            raise ValueError("XAI_API_KEY not configured")
        
        try:
            import httpx
            
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
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "stream": False,
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    return content.strip()
                else:
                    raise Exception(f"xAI API error: {response.status_code} - {response.text}")
                    
        except Exception as e:
            raise Exception(f"Failed to generate reply: {str(e)}")


def detect_context(tweet_text: str) -> Dict:
    """
    Detect the context/type of tweet to determine reply strategy
    
    Returns:
        {
            "type": "question|complaint|praise|discussion|promotion",
            "needs_help": bool,
            "is_positive": bool,
            "is_negative": bool,
        }
    """
    text_lower = tweet_text.lower()
    
    # Question indicators
    question_words = ["?", "how", "what", "why", "when", "where", "who", "can", "should", "would", "could"]
    is_question = any(word in text_lower for word in question_words) or "?" in tweet_text
    
    # Complaint indicators
    complaint_words = ["bad", "terrible", "awful", "hate", "disappointed", "frustrated", "problem", "issue", "broken", "doesn't work", "not working"]
    is_complaint = any(word in text_lower for word in complaint_words)
    
    # Praise indicators
    praise_words = ["love", "amazing", "great", "awesome", "fantastic", "brilliant", "excellent", "perfect", "best", "thank"]
    is_praise = any(word in text_lower for word in praise_words)
    
    # Promotion/discussion indicators
    is_discussion = not is_question and not is_complaint and not is_praise
    
    # Determine type
    if is_question:
        tweet_type = "question"
    elif is_complaint:
        tweet_type = "complaint"
    elif is_praise:
        tweet_type = "praise"
    elif any(word in text_lower for word in ["buy", "purchase", "deal", "sale", "discount", "offer"]):
        tweet_type = "promotion"
    else:
        tweet_type = "discussion"
    
    return {
        "type": tweet_type,
        "needs_help": is_question or is_complaint,
        "is_positive": is_praise,
        "is_negative": is_complaint,
    }


def select_reply_tone(context: Dict, brand_preference: str) -> str:
    """
    Select appropriate reply tone based on context and brand preference
    
    Returns:
        "helpful", "conversational", "promotional", "supportive"
    """
    tweet_type = context.get("type", "discussion")
    
    # Override with brand preference if set to specific tone
    if brand_preference != "mix":
        return brand_preference
    
    # Context-based tone selection
    if context.get("needs_help"):
        return "helpful"  # Answer questions, solve problems
    elif context.get("is_positive"):
        return "conversational"  # Engage with praise
    elif context.get("is_negative"):
        return "supportive"  # Address complaints
    elif tweet_type == "promotion":
        return "promotional"  # Subtle promotion
    else:
        return "conversational"  # General discussion


def build_reply_system_prompt(brand: BrandConfig) -> str:
    """
    Build system prompt with brand voice and personality
    """
    brand_name = brand.brand_name
    description = brand.description or "a brand"
    personality = brand.personality or "professional and friendly"
    communication_style = brand.communication_style or "clear and engaging"
    target_market = brand.target_market or "users"
    brand_values = brand.brand_values or ""
    
    prompt = f"""You are the social media voice for {brand_name}, {description}.

BRAND PERSONALITY: {personality}
COMMUNICATION STYLE: {communication_style}
TARGET AUDIENCE: {target_market}
"""
    
    if brand_values:
        prompt += f"BRAND VALUES: {brand_values}\n"
    
    prompt += """
GUIDELINES FOR REPLIES:
1. Keep replies SHORT (50-150 characters) - Twitter/X character limit
2. Match the brand's personality and communication style
3. Be authentic and genuine
4. Add value - don't just promote
5. Use emojis sparingly (0-1 per reply)
6. Be conversational, not robotic
7. If answering a question, be helpful and clear
8. If addressing a complaint, be empathetic and solution-focused
9. If responding to praise, be grateful and engaging
10. Never be pushy or overly salesy

IMPORTANT:
- Your reply will be posted as-is, so make it perfect
- No hashtags unless specifically relevant
- No URLs unless specifically relevant
- Focus on the conversation, not promotion
"""
    
    return prompt


def build_reply_user_prompt(
    tweet_text: str,
    author_username: str,
    context: Dict,
    tone: str,
    brand: BrandConfig
) -> str:
    """
    Build user prompt for specific reply generation
    """
    tweet_type = context.get("type", "discussion")
    author_mention = f"@{author_username}" if author_username else "the user"
    
    if tone == "helpful":
        prompt = f"""The user {author_mention} tweeted: "{tweet_text}"

This appears to be a {tweet_type}. Generate a helpful, informative reply that:
- Directly addresses their question or concern
- Provides value or useful information
- Stays true to {brand.brand_name}'s voice
- Is concise (50-150 characters)

Reply:"""
    
    elif tone == "supportive":
        prompt = f"""The user {author_mention} tweeted: "{tweet_text}"

This appears to be a complaint or concern. Generate a supportive, empathetic reply that:
- Acknowledges their concern
- Shows you care
- Offers to help or provides a solution
- Maintains {brand.brand_name}'s professional yet caring voice
- Is concise (50-150 characters)

Reply:"""
    
    elif tone == "conversational":
        prompt = f"""The user {author_mention} tweeted: "{tweet_text}"

This appears to be {tweet_type}. Generate an engaging, conversational reply that:
- Responds naturally to what they said
- Builds a connection
- Adds value to the conversation
- Matches {brand.brand_name}'s personality
- Is concise (50-150 characters)

Reply:"""
    
    else:  # promotional
        prompt = f"""The user {author_mention} tweeted: "{tweet_text}"

Generate a reply that:
- Subtly mentions how {brand.brand_name} can help
- Doesn't feel like a hard sell
- Adds value to the conversation
- Is natural and engaging
- Is concise (50-150 characters)

Reply:"""
    
    return prompt


async def generate_reply_for_tweet(
    tweet: MonitoredTweet,
    brand: BrandConfig
) -> GeneratedReply:
    """
    Generate a reply for a specific tweet
    
    Returns GeneratedReply with:
    - reply_text
    - reply_tone
    - reply_type
    - confidence_score
    - safety_passed
    """
    xai_client = XAIClient()
    
    # 1. Detect context
    context = detect_context(tweet.tweet_text)
    print(f"   🎯 Context: {context.get('type')} (needs_help: {context.get('needs_help')})")
    
    # 2. Select tone
    tone = select_reply_tone(context, brand.reply_tone_preference)
    print(f"   🎨 Tone: {tone}")
    
    # 3. Build prompts
    system_prompt = build_reply_system_prompt(brand)
    user_prompt = build_reply_user_prompt(
        tweet.tweet_text,
        tweet.author_username or "user",
        context,
        tone,
        brand
    )
    
    # 4. Generate reply
    print(f"   🤖 Generating reply...")
    try:
        reply_text = await xai_client.generate_reply(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=150,
            temperature=0.7
        )
        
        # Clean up reply (remove quotes, extra whitespace)
        reply_text = reply_text.strip()
        if reply_text.startswith('"') and reply_text.endswith('"'):
            reply_text = reply_text[1:-1]
        if reply_text.startswith("'") and reply_text.endswith("'"):
            reply_text = reply_text[1:-1]
        
        # Enhanced safety check
        from app.safety_checks import check_reply_before_posting
        
        safety_result = await check_reply_before_posting(reply_text, tweet)
        safety_passed = safety_result["safe_to_post"]
        safety_flags = safety_result.get("flags", [])
        
        # Truncate if too long
        if len(reply_text) > 250:
            reply_text = reply_text[:247] + "..."
            if "too_long" not in safety_flags:
                safety_flags.append("too_long")
        
        # Confidence score (simple heuristic for now)
        confidence = Decimal("0.8")  # Default confidence
        if len(reply_text) < 20:
            confidence = Decimal("0.5")  # Too short
        elif len(reply_text) > 200:
            confidence = Decimal("0.6")  # Too long
        
        reply_type = context.get("type", "engage")
        
        print(f"   ✅ Generated: {reply_text[:50]}...")
        
        return GeneratedReply(
            reply_text=reply_text,
            reply_tone=tone,
            reply_type=reply_type,
            confidence_score=confidence,
            generation_prompt=user_prompt,
            model_used=xai_client.model,
            safety_passed=safety_passed,
            safety_flags=safety_flags if safety_flags else None,
        )
        
    except Exception as e:
        print(f"   ❌ Error generating reply: {e}")
        raise


async def generate_replies_for_brand(brand: BrandConfig, limit: int = 10) -> Dict:
    """
    Generate replies for all relevant tweets (status="replied") for a brand
    Includes safety checks before generating
    """
    from app.database import get_supabase
    from app.safety_checks import check_tweet_before_reply
    
    from app.config import settings
    
    test_mode_indicator = " 🧪 TEST MODE" if settings.test_mode else ""
    print(f"\n{'='*60}")
    print(f"💬 Generating replies for: {brand.brand_name}{test_mode_indicator}")
    print(f"{'='*60}")
    
    # Get tweets that need replies (status="replied" means they passed relevance scoring)
    supabase = get_supabase()
    response = supabase.table("monitored_tweets")\
        .select("*")\
        .eq("brand_id", brand.brand_id)\
        .eq("status", "replied")\
        .order("relevance_score", desc=True)\
        .limit(limit)\
        .execute()
    
    tweets = [MonitoredTweet(**row) for row in response.data]
    
    if not tweets:
        print("   No relevant tweets to reply to")
        return {
            "brand_id": brand.brand_id,
            "tweets_processed": 0,
            "replies_generated": 0,
            "replies_queued": 0,
            "tweets_skipped_safety": 0,
        }
    
    print(f"   Found {len(tweets)} relevant tweets")
    
    generated_count = 0
    queued_count = 0
    skipped_safety = 0
    
    for tweet in tweets:
        try:
            # Safety check before generating
            safety_result = await check_tweet_before_reply(tweet, brand)
            
            if not safety_result["safe_to_reply"]:
                print(f"   ⚠️  Skipping tweet {tweet.tweet_id[:10]}... (safety: {safety_result['risk_level']})")
                skipped_safety += 1
                
                # Update tweet status to reflect safety check
                supabase.table("monitored_tweets")\
                    .update({
                        "status": "skipped",
                    })\
                    .eq("id", tweet.id)\
                    .execute()
                continue
            
            # Generate reply
            generated_reply = await generate_reply_for_tweet(tweet, brand)
            
            # Only queue if safety passed
            if not generated_reply.safety_passed:
                print(f"   ⚠️  Generated reply failed safety check: {generated_reply.safety_flags}")
                skipped_safety += 1
                continue
            
            # Add to reply queue
            from app.database import add_to_reply_queue
            
            reply_queue_item = ReplyQueue(
                brand_id=brand.brand_id,
                monitored_tweet_id=tweet.id,
                original_tweet_id=tweet.tweet_id,
                original_tweet_text=tweet.tweet_text,
                original_author=tweet.author_username,
                reply_text=generated_reply.reply_text,
                reply_tone=generated_reply.reply_tone,
                reply_type=generated_reply.reply_type,
                generation_model=generated_reply.model_used,
                generation_prompt=generated_reply.generation_prompt,
                confidence_score=generated_reply.confidence_score,
                status="queued",
                safety_passed=generated_reply.safety_passed,
                safety_flags=generated_reply.safety_flags,
            )
            
            await add_to_reply_queue(reply_queue_item)
            
            generated_count += 1
            queued_count += 1
            
            # Small delay to avoid rate limits
            import asyncio
            await asyncio.sleep(1)
            
        except Exception as e:
            print(f"   ⚠️  Error generating reply for tweet {tweet.tweet_id}: {e}")
            skipped_safety += 1
    
    print(f"\n✅ Reply generation complete:")
    print(f"   - Tweets processed: {len(tweets)}")
    print(f"   - Replies generated: {generated_count}")
    print(f"   - Replies queued: {queued_count}")
    print(f"   - Skipped (safety): {skipped_safety}")
    print(f"{'='*60}\n")
    
    return {
        "brand_id": brand.brand_id,
        "tweets_processed": len(tweets),
        "replies_generated": generated_count,
        "replies_queued": queued_count,
        "tweets_skipped_safety": skipped_safety,
    }


async def generate_replies_for_all_brands(limit_per_brand: int = 10) -> Dict:
    """
    Generate replies for all brands with auto-reply enabled
    """
    from app.database import get_brands_with_auto_reply_enabled
    
    brands = await get_brands_with_auto_reply_enabled()
    
    if not brands:
        print("⚠️  No brands with auto-reply enabled")
        return {"brands_processed": 0, "total_replies_generated": 0}
    
    results = []
    total_generated = 0
    total_queued = 0
    
    for brand in brands:
        try:
            result = await generate_replies_for_brand(brand, limit=limit_per_brand)
            results.append(result)
            total_generated += result.get("replies_generated", 0)
            total_queued += result.get("replies_queued", 0)
        except Exception as e:
            print(f"❌ Error generating replies for {brand.brand_name}: {e}")
    
    return {
        "brands_processed": len(results),
        "total_replies_generated": total_generated,
        "total_replies_queued": total_queued,
        "results": results,
    }

