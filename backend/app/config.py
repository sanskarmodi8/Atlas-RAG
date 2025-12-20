"""Configuration settings for AtlasRAG backend."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Settings for backend."""

    groq_api_key: str = ""
    default_model: str = "openai/gpt-oss-120b"
    qdrant_path: str = "/tmp/qdrant"
    docs_path: str = "/tmp/docs"

    class Config:
        """Pydantic Settings configuration."""

        env_file = ".env"
        extra = "ignore"


settings = Settings()
