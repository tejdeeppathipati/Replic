"""
Persona prompts for different reply styles.
"""

PERSONAS = {
    "normal": """You are a helpful and friendly brand representative. 
Your goal is to engage authentically, provide value, and build relationships.
Be conversational, genuine, and helpful without being overly salesy.""",
    
    "smart": """You are a knowledgeable expert in your field.
Share insights, data, and helpful perspectives.
Be informative and thoughtful while staying approachable.
Reference relevant trends and best practices.""",
    
    "technical": """You are a technical specialist with deep product knowledge.
Provide specific, actionable technical information.
Be precise, clear, and solution-oriented.
Don't oversimplify, but also don't overwhelm.""",
    
    "unhinged": """You are witty, bold, and have a unique voice.
Be memorable and authentic, but still professional.
Use humor appropriately and stand out from corporate speak.
Push boundaries while staying respectful."""
}


def build_system_prompt(persona: str, brand_context: dict) -> str:
    """
    Build the system prompt for the LLM using FULL brand context.
    
    Args:
        persona: Persona type (normal/smart/technical/unhinged)
        brand_context: Complete brand context from brand_agent table
        
    Returns:
        System prompt string
    """
    persona_desc = PERSONAS.get(persona, PERSONAS["normal"])
    
    # Extract key brand info
    brand_name = brand_context.get("brand_name") or brand_context.get("name", "Our brand")
    description = brand_context.get("description", "")
    
    # Build comprehensive prompt
    prompt = f"""{persona_desc}

=== BRAND IDENTITY ===
Brand: {brand_name}
"""
    
    # Add description
    if description:
        prompt += f"About us: {description}\n"
    
    # Add products/services
    products = brand_context.get("products")
    if products:
        prompt += f"Products/Services: {products}\n"
    
    # Add unique value proposition
    unique_value = brand_context.get("unique_value")
    if unique_value:
        prompt += f"What makes us unique: {unique_value}\n"
    
    # Add brand values
    brand_values = brand_context.get("brand_values")
    if brand_values:
        prompt += f"Our values: {brand_values}\n"
    
    prompt += "\n"
    
    # Add communication style
    communication_style = brand_context.get("communication_style")
    if communication_style:
        prompt += f"=== COMMUNICATION STYLE ===\n{communication_style}\n\n"
    
    # Add personality
    personality = brand_context.get("personality")
    if personality:
        prompt += f"Personality: {personality}\n\n"
    
    # Add target market context
    target_market = brand_context.get("target_market")
    if target_market:
        prompt += f"=== TARGET AUDIENCE ===\n{target_market}\n\n"
    
    # Add content pillars (what topics to focus on)
    content_pillars = brand_context.get("content_pillars")
    if content_pillars:
        prompt += f"=== CONTENT FOCUS ===\n{content_pillars}\n\n"
    
    # Add differentiation
    differentiation = brand_context.get("differentiation")
    if differentiation:
        prompt += f"=== HOW WE STAND OUT ===\n{differentiation}\n\n"
    
    # Add scraped insights (if available)
    insights = brand_context.get("scraped_insights")
    if insights:
        prompt += f"=== KEY INSIGHTS ===\n{insights[:500]}\n\n"  # Limit length
    
    # Add any question responses (JSONB field)
    question_responses = brand_context.get("question_responses")
    if question_responses and isinstance(question_responses, dict):
        prompt += "=== ADDITIONAL CONTEXT ===\n"
        for key, value in list(question_responses.items())[:5]:  # Limit to 5
            if value:
                prompt += f"- {key}: {value}\n"
        prompt += "\n"
    
    # Add important rules
    prompt += """=== REPLY GUIDELINES ===
- Keep replies under 200 characters
- Be authentic and add value to the conversation
- Use the brand voice and personality described above
- Don't be overly promotional or salesy
- Match the tone of the original tweet
- Reference our products/values ONLY when genuinely relevant
- If you can't add value, say "SKIP" (we won't send generic replies)
"""
    
    return prompt


def build_user_prompt(tweet_text: str, author_context: str = None) -> str:
    """
    Build the user prompt for reply generation.
    
    Args:
        tweet_text: The tweet we're replying to
        author_context: Optional context about the author
        
    Returns:
        User prompt string
    """
    prompt = f"""Generate a reply to this tweet:

"{tweet_text}"
"""
    
    if author_context:
        prompt += f"\n\nContext about the author: {author_context}"
    
    prompt += """

Your reply (under 200 characters):"""
    
    return prompt


def validate_reply(reply: str, max_length: int = 200) -> tuple[bool, str]:
    """
    Validate generated reply meets requirements.
    
    Args:
        reply: Generated reply text
        max_length: Maximum allowed length
        
    Returns:
        (is_valid, error_message)
    """
    reply = reply.strip()
    
    # Check length
    if len(reply) == 0:
        return False, "Empty reply"
    
    if len(reply) > max_length:
        return False, f"Reply too long ({len(reply)} > {max_length})"
    
    # Check for generic/low-value replies
    generic_phrases = [
        "thank you for sharing",
        "interesting post",
        "great point",
        "i agree"
    ]
    
    if any(phrase in reply.lower() for phrase in generic_phrases) and len(reply) < 50:
        return False, "Reply too generic"
    
    return True, ""

