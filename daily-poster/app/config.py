"""
Configuration for Daily Poster service.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Server
    port: int = 8500
    host: str = "0.0.0.0"
    
    # xAI (for generating posts)
    xai_api_key: str
    xai_api_base: str = "https://api.x.ai/v1"
    xai_model: str = "grok-3"  # grok-beta deprecated on 2025-09-15
    
    # Supabase (for brand data)
    supabase_url: str
    supabase_service_role_key: str
    
    # Composio (for posting to X)
    composio_api_key: str
    
    # Generation settings
    max_tokens: int = 100
    temperature: float = 0.8  # More creative for original content
    
    # Scheduling
    post_time_utc: str = "09:00"  # When to post daily (UTC)
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()

