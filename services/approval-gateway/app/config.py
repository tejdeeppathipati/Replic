"""
Configuration management using Pydantic settings.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Server
    port: int = 8000

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Core webhook
    core_decision_webhook: str = "http://localhost:9000/decisions"
    core_decision_webhook_signing_secret: str = ""

    # Frontend (Next.js) internal endpoints
    frontend_base_url: str = "http://localhost:3000"
    internal_service_secret: str = ""

    # Twilio WhatsApp
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_wa_number: str = ""
    owner_wa_number: str = ""  # Fallback default if candidate.owner_whatsapp not provided

    # Photon iMessage Kit
    photon_base_url: str = "http://localhost:5173"
    photon_to: str = ""  # Fallback default if candidate.owner_imessage not provided

    # xAI for AI Chat
    xai_api_key: str = ""
    xai_model: str = "grok-3"

    # Supabase for brand lookup
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # Security
    webhook_signing_secret: str = "change-me-in-production"

    # Rate limiting
    wa_bucket_capacity: int = 5
    wa_bucket_refill_per_min: int = 1
    imsg_bucket_capacity: int = 5
    imsg_bucket_refill_per_min: int = 1
    min_spacing_sec: int = 20

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
