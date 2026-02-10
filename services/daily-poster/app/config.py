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
    
    # API Base URL (for calling Next.js API endpoints)
    api_base_url: str = "http://localhost:3000"  # Default for local dev

    # Internal auth for calling protected Next.js endpoints from services
    internal_service_secret: str = ""
    
    # Approval mode (iMessage) - Optional
    require_approval: bool = False  # Set to true to send for iMessage approval
    approval_gateway_url: str = "http://localhost:8000"  # URL of approval-gateway service
    owner_imessage: str = ""  # Your iMessage (Apple ID or phone number)
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
