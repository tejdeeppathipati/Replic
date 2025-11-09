"""
Configuration management for X Fetcher service.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Server
    port: int = 8200
    host: str = "0.0.0.0"
    
    # Composio (for OAuth token management)
    composio_api_key: str
    
    # X API
    x_api_base: str = "https://api.x.com/2"
    
    # Redis (for state management)
    redis_url: str = "redis://localhost:6379/0"
    
    # Polling configuration
    poll_interval_seconds: int = 60
    max_results_per_poll: int = 25
    
    # Rate limiting
    mentions_rate_limit: int = 450  # per 15 min
    search_rate_limit: int = 180    # per 15 min
    
    # Supabase (for brand configuration)
    supabase_url: str
    supabase_service_key: str
    
    # LLM Generator endpoint
    llm_generator_url: str = "http://localhost:8300"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()

