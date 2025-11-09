"""
Prompt builder for daily post generation using xAI.

THIS IS WHERE THE MAGIC HAPPENS! ✨

Uses ALL brand data from brand_agent table to generate
high-quality, on-brand daily posts.
"""


def build_post_generation_prompt(brand_data: dict) -> tuple[str, str]:
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
        
    Returns:
        (system_prompt, user_prompt) tuple
    """
    
    # Extract brand info
    brand_name = brand_data.get("brand_name") or brand_data.get("name", "Our Brand")
    description = brand_data.get("description", "")
    personality = brand_data.get("personality", "professional")
    
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
    
    # Add posting guidelines
    system_prompt += """=== POST GUIDELINES ===
- Keep posts under 280 characters (Twitter limit)
- Be authentic and provide value
- Match our brand voice and personality
- Focus on our content pillars
- Highlight what makes us unique (when relevant)
- Engage our target audience
- Be helpful, not salesy
- Use emojis sparingly (1-2 max)
- End with a subtle call-to-action when appropriate

IMPORTANT: Generate ONLY the tweet text, nothing else.
"""
    
    # Build user prompt
    user_prompt = """Generate a high-quality daily tweet for our brand.

Consider:
- What value can we provide today?
- What insights can we share?
- What question can we ask our audience?
- What behind-the-scenes content could engage?

Focus on one of our content pillars and create something our target audience will find valuable.

Tweet text (under 280 characters):"""
    
    return system_prompt, user_prompt


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

