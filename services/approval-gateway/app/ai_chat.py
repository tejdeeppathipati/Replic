"""
AI Chat via iMessage - Talk to AI to generate posts.
"""

import httpx


async def chat_with_ai(
    user_message: str, brand_info: dict, xai_api_key: str, xai_model: str = "grok-3"
) -> str:
    """
    Chat with AI to generate posts or answer questions.

    Args:
        user_message: What the user said via iMessage
        brand_info: Brand context
        xai_api_key: xAI API key
        xai_model: Model to use

    Returns:
        AI response text
    """

    # Check if this is a "generate and post" request
    is_generate_post = "generate" in user_message.lower() and "post" in user_message.lower()

    if is_generate_post:
        # For posting, generate ONLY the tweet text, no explanations
        system_prompt = f"""You are a social media content generator for {brand_info.get('brand_name', 'the brand')}.

BRAND INFO:
- Name: {brand_info.get('brand_name')}
- Description: {brand_info.get('description', '')}
- Products: {brand_info.get('products', '')}
- Communication Style: {brand_info.get('communication_style', 'Professional and helpful')}

IMPORTANT: When asked to generate a post, respond with ONLY the tweet text. No explanations, no "Here's a post:", no extra text. Just the tweet itself, under 280 characters, on-brand.
"""
    else:
        # For general chat, be conversational
        system_prompt = f"""You are a social media assistant for {brand_info.get('brand_name', 'the brand')}.

BRAND INFO:
- Name: {brand_info.get('brand_name')}
- Description: {brand_info.get('description', '')}
- Products: {brand_info.get('products', '')}
- Communication Style: {brand_info.get('communication_style', 'Professional and helpful')}

The user is chatting with you via iMessage to:
1. Generate posts for social media
2. Get content ideas
3. Edit/improve posts
4. Ask questions about posting

Respond naturally and helpfully. If they ask for a post, generate one that's under 280 characters and on-brand.
"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.x.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {xai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": xai_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    "temperature": 0.7,
                    "max_tokens": 300,
                },
                timeout=30.0,
            )

            if response.status_code != 200:
                return f"Error: xAI API returned {response.status_code}"

            result = response.json()
            ai_response = result["choices"][0]["message"]["content"]

            # If this is a generate post request, extract just the tweet text
            if is_generate_post:
                # Remove any explanatory text, quotes, etc.
                # Look for text in quotes first
                import re

                quoted_text = re.search(r'"([^"]+)"', ai_response)
                if quoted_text:
                    ai_response = quoted_text.group(1)
                else:
                    # Remove common prefixes
                    prefixes = [
                        "Here's a post:",
                        "Here's a social media post:",
                        "Here's your post:",
                        "Post:",
                        "Tweet:",
                    ]
                    for prefix in prefixes:
                        if ai_response.startswith(prefix):
                            ai_response = ai_response[len(prefix) :].strip()

                    # Take first line if multiple lines
                    ai_response = ai_response.split("\n")[0].strip()

                # Ensure under 280 characters
                if len(ai_response) > 280:
                    ai_response = ai_response[:277] + "..."

            return ai_response

    except Exception as e:
        return f"Error talking to AI: {str(e)}"


def is_ai_chat_request(message_text: str) -> bool:
    """
    Check if message is a request to chat with AI.

    Triggers:
    - "generate post about..."
    - "create post about..."
    - "write post about..."
    - "generate and post..."
    - "help me with..."
    - "what should I post about..."
    """
    message_lower = message_text.lower().strip()

    # If it's just "test" or very short, don't treat as AI chat
    if len(message_lower) < 5:
        return False

    triggers = [
        "generate post",
        "create post",
        "write post",
        "generate and post",
        "create and post",
        "help me",
        "what should i post",
        "give me ideas",
        "suggest a post",
        "post about",
        "tweet about",
    ]

    return any(trigger in message_lower for trigger in triggers)


def extract_topic(message_text: str) -> str:
    """
    Extract topic from a generation request.

    "generate post about productivity" → "productivity"
    "help me write something about AI" → "AI"
    """
    message_lower = message_text.lower()

    # Try different patterns
    patterns = ["about ", "on ", "regarding ", "for "]

    for pattern in patterns:
        if pattern in message_lower:
            # Get everything after the pattern
            parts = message_lower.split(pattern, 1)
            if len(parts) > 1:
                return parts[1].strip()

    # If no pattern matched, return the whole message (after command)
    for trigger in ["generate post", "create post", "write post"]:
        if trigger in message_lower:
            return message_lower.replace(trigger, "").strip()

    return message_text


def is_post_command(message_text: str) -> bool:
    """
    Check if message is a command to post the last generated post.

    Triggers:
    - "post this"
    - "tweet this"
    - "post it"
    - "tweet it"
    - "yes post"
    """
    triggers = ["post this", "tweet this", "post it", "tweet it", "yes post", "post", "tweet"]

    message_lower = message_text.lower().strip()

    # Exact matches for short commands
    if message_lower in ["post", "tweet", "yes"]:
        return True

    # Contains trigger
    return any(trigger in message_lower for trigger in triggers)


def is_generate_and_post(message_text: str) -> bool:
    """
    Check if message requests both generation and posting.

    "generate and post about X"
    "create and tweet about Y"
    """
    message_lower = message_text.lower()
    return (
        ("generate" in message_lower and "post" in message_lower)
        or ("create" in message_lower and "post" in message_lower)
        or ("generate" in message_lower and "tweet" in message_lower)
        or ("create" in message_lower and "tweet" in message_lower)
    )
