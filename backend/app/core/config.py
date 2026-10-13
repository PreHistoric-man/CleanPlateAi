from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "CleanPlate AI API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    ALLOWED_ORIGINS: str = "*"

    # Supabase credentials
    SUPABASE_URL: str = "https://placeholder.supabase.co"
    SUPABASE_ANON_KEY: str = "placeholder-anon-key"
    SUPABASE_SERVICE_ROLE_KEY: str = "placeholder-service-key"
    SUPABASE_JWT_SECRET: str = "placeholder-jwt-secret"

    # AI inference
    AI_VISION_ADAPTER: str = "demo"  # "demo" or "gemini"
    GEMINI_API_KEY: str = ""
    VISION_MODEL_NAME: str = "gemini-1.5-flash"

    # Disclaimers
    DISCLAIMER_TEXT: str = (
        "CleanPlate AI assessments evaluate visible kitchen cleanliness from photographs only. "
        "They do not establish microbiological sanitation, internal food temperatures, or official regulatory compliance (e.g. FSSAI)."
    )

    @property
    def cors_origins(self) -> List[str]:
        if self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
