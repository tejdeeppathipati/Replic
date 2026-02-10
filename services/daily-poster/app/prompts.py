"""
Prompt builder for daily post generation using xAI.

THIS IS WHERE THE MAGIC HAPPENS! ✨

Uses ALL brand data from brand_agent table to generate
high-quality, on-brand daily posts.
"""


def build_post_generation_prompt(
    brand_data: dict,
    user_input: str = None,
    tone: str = "engaging"
) -> tuple[str, str, str]:
    """
    Build system and user prompts for daily post generation.
    
    Uses ALL fields from brand_agent table:
    - Brand identity (name, description, values)
    - Products and unique value  
    - Target market and communication style
    - Content pillars and differentiation
    - Personality and tone
    - And more!
    
    Args:
        brand_data: Complete brand_agent row from Supabase
        user_input: User's specific post idea/topic (optional)
        tone: Desired tone for the post (engaging, professional, casual, inspiring, humorous)
        
    Returns:
        (system_prompt, user_prompt, url_suffix) tuple
    """
    
    # Extract brand info
    brand_name = brand_data.get("brand_name") or brand_data.get("name", "Our Brand")
    description = brand_data.get("description", "")
    personality = brand_data.get("personality", "professional")
    website = brand_data.get("website", "")
    
    # Build comprehensive system prompt
    system_prompt = f"""You are the social media voice for {brand_name}.

=== BRAND IDENTITY ===
Brand: {brand_name}
"""
    
    # Add description
    if description:
        system_prompt += f"About us: {description}\n"
    
    # Add products/services
    products = brand_data.get("products")
    if products:
        system_prompt += f"Products/Services: {products}\n"
    
    # Add unique value proposition
    unique_value = brand_data.get("unique_value")
    if unique_value:
        system_prompt += f"What makes us unique: {unique_value}\n"
    
    # Add brand values
    brand_values = brand_data.get("brand_values")
    if brand_values:
        system_prompt += f"Our values: {brand_values}\n"
    
    system_prompt += "\n"
    
    # Add communication style
    communication_style = brand_data.get("communication_style")
    if communication_style:
        system_prompt += f"=== COMMUNICATION STYLE ===\n{communication_style}\n\n"
    
    # Add personality
    if personality:
        system_prompt += f"Personality: {personality}\n\n"
    
    # Add target market
    target_market = brand_data.get("target_market")
    if target_market:
        system_prompt += f"=== TARGET AUDIENCE ===\n{target_market}\n\n"
    
    # Add content pillars (IMPORTANT!)
    content_pillars = brand_data.get("content_pillars")
    if content_pillars:
        system_prompt += f"=== CONTENT FOCUS (What to post about) ===\n{content_pillars}\n\n"
    
    # Add differentiation
    differentiation = brand_data.get("differentiation")
    if differentiation:
        system_prompt += f"=== HOW WE STAND OUT ===\n{differentiation}\n\n"
    
    # Add business type context
    business_type = brand_data.get("business_type")
    if business_type:
        system_prompt += f"Business Type: {business_type}\n\n"
    
    # Add scraped insights (if available)
    insights = brand_data.get("scraped_insights")
    if insights:
        system_prompt += f"=== KEY INSIGHTS ===\n{insights[:500]}\n\n"
    
    # Add success metrics (what we care about)
    success_metrics = brand_data.get("success_metrics")
    if success_metrics:
        system_prompt += f"=== SUCCESS METRICS ===\n{success_metrics}\n\n"
    
    # Add additional info
    additional_info = brand_data.get("additional_info")
    if additional_info:
        system_prompt += f"=== ADDITIONAL CONTEXT ===\n{additional_info}\n\n"
    
    # Add question responses (JSONB)
    question_responses = brand_data.get("question_responses")
    if question_responses and isinstance(question_responses, dict):
        system_prompt += "=== USER RESPONSES ===\n"
        for key, value in list(question_responses.items())[:5]:
            if value:
                system_prompt += f"- {key}: {value}\n"
        system_prompt += "\n"
    
    # Add tone-specific instructions
    tone_instructions = {
        "engaging": """
=== TONE: ENGAGING ===
- Hook readers immediately with curiosity or intrigue
- Use pattern interrupts (surprising facts, bold statements)
- Ask thought-provoking questions that make people stop scrolling
- Create a sense of urgency or FOMO when appropriate
- Use power words that grab attention
- Make it conversational and relatable""",
        
        "professional": """
=== TONE: PROFESSIONAL ===
- Use clear, authoritative language
- Focus on facts, data, and expertise
- Be concise and to-the-point
- Maintain credibility and trust
- Avoid casual slang or excessive emojis
- Position as an industry leader""",
        
        "casual": """
=== TONE: CASUAL ===
- Write like you're talking to a friend
- Use contractions and relaxed language
- Be warm, approachable, and friendly
- Share authentic moments and insights
- Use emojis naturally (2-3 is fine)
- Keep it light and conversational""",
        
        "inspiring": """
=== TONE: INSPIRING ===
- Uplift and motivate your audience
- Share powerful insights and lessons
- Use aspirational language
- Connect to bigger purpose and meaning
- Encourage action and growth
- Be authentic and heartfelt""",
        
        "humorous": """
=== TONE: HUMOROUS ===
- Be witty and clever (not forced)
- Use wordplay or unexpected twists when appropriate
- Keep it light and fun
- Relate humor to the topic at hand
- Avoid controversial or offensive jokes
- Make it shareable and memorable"""
    }
    
    system_prompt += tone_instructions.get(tone, tone_instructions["engaging"])
    
    # Calculate space needed for URL if we have one
    url_suffix = ""
    char_limit = 280
    if website:
        # Reserve space for URL suffix: "\n\nTry it: [URL]"
        # Format: "\n\nTry it: website.com" (shortest form)
        url_suffix = f"\n\nTry it: {website}"
        chars_needed = len(url_suffix)
        char_limit = 280 - chars_needed
        system_prompt += f"\n\n=== CALL-TO-ACTION ===\nYour tweet will automatically include our website link at the end.\nReserved space: {chars_needed} characters for URL\n"
    
    # Add posting guidelines
    system_prompt += f"""

=== POST GUIDELINES ===
- Keep posts under {char_limit} characters (to leave room for URL)
- Be authentic and provide value
- Match our brand voice and personality
- Focus on our content pillars
- Highlight what makes us unique (when relevant)
- Engage our target audience
- Be helpful, not salesy
- Make every word count
- Create posts that stand out and get engagement

IMPORTANT: Generate ONLY the tweet text, nothing else. No quotes, no labels, just the tweet.
"""
    
    # Build dynamic user prompt based on user input
    if user_input:
        # User provided specific input - build prompt around it
        user_prompt = f"""Create a compelling tweet about the following:

{user_input}

Requirements:
- Incorporate this idea/topic into the tweet
- Stay true to our brand voice and values
- Make it {tone} in tone
- Keep it under {char_limit} characters
- Make it valuable and engaging for our target audience
- Don't just repeat the input - transform it into an engaging tweet

Tweet text:"""
    else:
        # No user input - generate varied content
        import random
        
        approaches = [
            "Share a valuable insight related to our content pillars that our audience will find helpful",
            "Ask a thought-provoking question that sparks discussion among our target audience",
            "Share a behind-the-scenes moment that humanizes our brand",
            "Provide a quick tip or hack related to what we do",
            "Share a surprising fact or statistic relevant to our industry",
            "Tell a micro-story that illustrates our brand values",
            "Challenge a common misconception in our space",
            "Share what we're working on or excited about",
            "Provide perspective on a trend in our industry",
            "Share a lesson we've learned that others can benefit from"
        ]
        
        selected_approach = random.choice(approaches)
        
        user_prompt = f"""Generate a high-quality tweet for our brand.

Approach: {selected_approach}

Requirements:
- Make it {tone} in tone
- Focus on our content pillars and target audience
- Under {char_limit} characters
- Provide real value
- Make it unique and memorable

Tweet text:"""
    
    return system_prompt, user_prompt, url_suffix


def build_themed_post_prompt(brand_data: dict, theme: str) -> tuple[str, str]:
    """
    Build prompts for a themed post (e.g., Monday Motivation, Friday Tips).
    
    Args:
        brand_data: Brand info from database
        theme: Post theme (e.g., "monday_motivation", "friday_tips", "behind_the_scenes")
        
    Returns:
        (system_prompt, user_prompt) tuple
    """
    system_prompt, _ = build_post_generation_prompt(brand_data)
    
    # Theme-specific user prompts
    themes = {
        "monday_motivation": "Generate an inspiring Monday motivation tweet that aligns with our brand values and energizes our target audience to start the week strong.",
        
        "tuesday_tip": "Share a valuable, actionable tip related to our content pillars that our audience can implement today.",
        
        "wednesday_wisdom": "Share an insightful perspective or industry wisdom that showcases our expertise and helps our audience.",
        
        "thursday_thought": "Pose a thought-provoking question to our audience that sparks discussion around our content areas.",
        
        "friday_feature": "Highlight something interesting about our product, team, or process that shows what makes us unique.",
        
        "weekend_insight": "Share a weekend-appropriate insight or reflection that resonates with our audience while staying on-brand.",
        
        "product_highlight": "Showcase one of our products/services in an engaging, non-salesy way that highlights the value it provides.",
        
        "behind_the_scenes": "Give a behind-the-scenes look at our company that humanizes our brand and builds connection.",
        
        "customer_value": "Focus on a specific way we help our customers succeed, told through the lens of their needs.",
        
        "industry_insight": "Share a relevant industry trend or insight that demonstrates our expertise and adds value."
    }
    
    user_prompt = themes.get(theme, themes["tuesday_tip"])
    user_prompt += "\n\nTweet text (under 280 characters):"
    
    return system_prompt, user_prompt


def build_action_post_prompt(brand_data: dict, action_data: dict) -> tuple[str, str, str]:
    """
    Build prompts for an action-based post.
    
    Args:
        brand_data: Brand info from database
        action_data: Action details (type, title, description, context, tone)
        
    Returns:
        (system_prompt, user_prompt, url_suffix) tuple
    """
    action_type = action_data.get("action_type", "announcement")
    title = action_data.get("title", "")
    description = action_data.get("description", "")
    context = action_data.get("context", "")
    tone = action_data.get("tone", "engaging")
    
    # Action type specific prompt styles
    action_prompts = {
        "announcement": "Create an exciting announcement tweet that grabs attention and clearly communicates the news. Make it newsworthy and shareable.",
        
        "engagement": "Create a tweet that encourages replies and interaction. Ask a thought-provoking question or start a discussion that your audience will want to engage with.",
        
        "excitement": "Build hype and excitement! Create anticipation with a teaser or behind-the-scenes content that makes people curious and eager to learn more.",
        
        "promotion": "Promote this offering in a compelling way that drives action. Highlight the value and benefits without being too salesy. Create urgency if appropriate.",
        
        "education": "Share valuable knowledge in a clear, helpful way. Teach something useful that your audience can apply. Be the expert they trust.",
        
        "community": "Celebrate community wins, share customer stories, or highlight your audience. Build connection and make people feel part of something bigger.",
        
        "metrics": "Share this achievement or milestone in a way that's impressive yet authentic. Make it relatable and show the journey, not just the destination."
    }
    
    prompt_style = action_prompts.get(action_type, action_prompts["announcement"])
    
    # Build comprehensive system prompt with action context
    system_prompt, _, url_suffix = build_post_generation_prompt(brand_data, tone=tone)
    
    # Build user prompt with action details
    user_prompt = f"""Generate a tweet for this content action:

ACTION TYPE: {action_type.upper()}
GOAL: {title}

{f"DESCRIPTION: {description}" if description else ""}

{f"ADDITIONAL CONTEXT: {context}" if context else ""}

STYLE: {prompt_style}

Requirements:
- Make it {tone} in tone
- Stay true to our brand voice and values
- Create content that achieves the action's goal
- Be authentic and provide value
- Make it memorable and shareable

Tweet text:"""
    
    return system_prompt, user_prompt, url_suffix

