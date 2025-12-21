"""Configuration settings for AtlasRAG backend."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Settings for backend."""

    groq_api_key: str = ""
    default_model: str = "openai/gpt-oss-120b"
    qdrant_path: str = "/tmp/qdrant"
    docs_path: str = "/tmp/docs"
    max_summary_tokens: int = 6000  # Conservative limit for model openai/gpt-oss-120b

    class Config:
        """Pydantic Settings configuration."""

        env_file = ".env"
        extra = "ignore"


settings = Settings()
