"""
Configuration management for auto-replier service
Loads settings from environment variables
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from multiple locations
# Try .env.local first (Next.js convention), then .env
load_dotenv(dotenv_path="../.env.local")
load_dotenv(dotenv_path="../.env")
load_dotenv()  # Also try current directory


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Service info
    service_name: str = "auto-replier"
    version: str = "0.1.0"
    port: int = 8600
    host: str = "0.0.0.0"
    
    # Supabase
    supabase_url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "") or os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or os.getenv("SUPABASE_KEY", "")
    
    # xAI (Grok) - for AI generation
    xai_api_key: str = os.getenv("XAI_API_KEY", "")
    xai_base_url: str = "https://api.x.ai/v1"
    xai_model: str = "grok-beta"
    
    # Composio - for X/Twitter integration
    composio_api_key: str = os.getenv("COMPOSIO_API_KEY", "")
    
    # Monitoring settings
    monitor_interval_minutes: int = 10  # Check every 10 minutes
    max_tweets_per_fetch: int = 50
    
    # Rate limiting defaults (can be overridden per brand)
    default_max_replies_per_hour: int = 5
    default_max_replies_per_day: int = 20
    default_user_cooldown_hours: int = 24
    default_min_relevance_score: float = 0.50
    
    # Relevance scoring weights
    sentiment_weight: float = 0.3
    engagement_weight: float = 0.3
    content_weight: float = 0.4
    
    # Engagement thresholds
    high_engagement_threshold: int = 100  # 100+ likes = high engagement
    medium_engagement_threshold: int = 10  # 10-100 likes = medium engagement
    
    # Safety settings
    enable_safety_checks: bool = True
    min_account_age_days: int = 30  # Don't reply to accounts < 30 days old
    min_account_followers: int = 10  # Don't reply to accounts with < 10 followers
    
    # Test mode
    test_mode: bool = os.getenv("AUTO_REPLY_TEST_MODE", "false").lower() == "true"
    # If test_mode=True:
    #   - Monitors tweets normally (saves to DB)
    #   - Scores tweets normally (saves to DB)
    #   - Generates replies normally (saves to queue)
    #   - Does NOT post replies to X (simulates posting)
    #   - Does NOT increment rate limits
    #   - Does NOT record user interactions
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Singleton settings instance
settings = Settings()


def validate_config():
    """
    Validate that all required configuration is present
    Warns if any required config is missing (doesn't fail startup)
    """
    required_vars = {
        "SUPABASE_URL": settings.supabase_url,
        "SUPABASE_SERVICE_ROLE_KEY": settings.supabase_key,
        "XAI_API_KEY": settings.xai_api_key,
        "COMPOSIO_API_KEY": settings.composio_api_key,
    }
    
    missing = [key for key, value in required_vars.items() if not value]
    
    if missing:
        print(f"⚠️  Warning: Missing environment variables: {', '.join(missing)}")
        print(f"   Service will start but some features may not work.")
        print(f"   Please set them in your .env file")
        return False
    
    print("✅ Configuration validated successfully")
    return True


if __name__ == "__main__":
    # Test configuration
    print(f"Service: {settings.service_name} v{settings.version}")
    print(f"Port: {settings.port}")
    print(f"Test mode: {settings.test_mode}")
    print(f"Monitor interval: {settings.monitor_interval_minutes} minutes")
    print(f"Max replies/hour: {settings.default_max_replies_per_hour}")
    print(f"Max replies/day: {settings.default_max_replies_per_day}")
    
    try:
        validate_config()
    except ValueError as e:
        print(f"❌ Configuration error: {e}")

