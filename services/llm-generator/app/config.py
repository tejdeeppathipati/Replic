"""
Configuration for LLM Generator service.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Server
    port: int = 8300
    host: str = "0.0.0.0"
    
    # xAI API (Grok)
    xai_api_key: str
    xai_api_base: str = "https://api.x.ai/v1"
    xai_model: str = "grok-beta"  # or "grok-2" when available
    
    # Supabase (for fetching brand context)
    supabase_url: str
    supabase_service_role_key: str
    
    # Generation settings
    max_tokens: int = 100  # Keep replies short
    temperature: float = 0.7  # Balance creativity and coherence
    max_reply_length: int = 200  # Twitter limit is 280, leave room
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()

