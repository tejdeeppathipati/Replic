"""
Database utilities for fetching brand context from Supabase.
"""

from typing import Optional
from supabase import create_client, Client
from app.config import settings


def get_supabase() -> Client:
    """Get Supabase client."""
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key
    )


async def get_brand_context(brand_id: str) -> Optional[dict]:
    """
    Fetch brand agent data from Supabase.
    
    This fetches ALL the context the user provided about their brand:
    - Brand description, values, personality
    - Products, unique value proposition
    - Target market, communication style
    - Content pillars, competitors
    - Keywords, watched accounts
    - And more!
    
    Args:
        brand_id: Brand identifier (UUID)
        
    Returns:
        Brand context dict or None if not found
    """
    try:
        supabase = get_supabase()
        
        # Fetch brand agent with all fields
        result = supabase.table("brand_agent") \
            .select("*") \
            .eq("id", brand_id) \
            .eq("is_active", True) \
            .limit(1) \
            .execute()
        
        if not result.data:
            return None
        
        brand = result.data[0]
        
        # Build comprehensive context
        context = {
            # Basic info
            "id": brand.get("id"),
            "name": brand.get("name"),
            "brand_name": brand.get("brand_name"),
            "description": brand.get("description"),
            
            # Website & scraped data
            "website": brand.get("website"),
            "scraped_summary": brand.get("scraped_summary"),
            "scraped_insights": brand.get("scraped_insights"),
            
            # Business details
            "business_type": brand.get("business_type"),
            "products": brand.get("products"),
            "unique_value": brand.get("unique_value"),
            "brand_values": brand.get("brand_values"),
            
            # Target & communication
            "target_market": brand.get("target_market"),
            "communication_style": brand.get("communication_style"),
            "content_pillars": brand.get("content_pillars"),
            "personality": brand.get("personality"),
            
            # Competitive positioning
            "competitors": brand.get("competitors"),
            "differentiation": brand.get("differentiation"),
            
            # Strategy
            "keywords": brand.get("keywords"),
            "watched_accounts": brand.get("watched_accounts"),
            "success_metrics": brand.get("success_metrics"),
            
            # Additional context
            "additional_info": brand.get("additional_info"),
            "question_responses": brand.get("question_responses"),  # JSONB field
        }
        
        return context
        
    except Exception as e:
        print(f"Failed to fetch brand context: {e}")
        return None

