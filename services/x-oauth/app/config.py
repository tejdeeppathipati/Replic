"""
Configuration management for X OAuth service.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Server
    port: int = 8100
    host: str = "0.0.0.0"
    
    # X API Credentials
    x_client_id: str
    x_client_secret: str = ""  # Optional for PKCE
    x_redirect_uri: str = "http://localhost:8100/x/callback"
    
    # X API URLs
    x_oauth_url: str = "https://twitter.com/i/oauth2/authorize"
    x_token_url: str = "https://api.x.com/2/oauth2/token"
    x_revoke_url: str = "https://api.x.com/2/oauth2/revoke"
    
    # OAuth Scopes
    x_scopes: str = "tweet.read tweet.write users.read offline.access"
    
    # Supabase
    supabase_url: str
    supabase_service_key: str
    
    # Security
    secret_key: str = "change-me-in-production"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()

