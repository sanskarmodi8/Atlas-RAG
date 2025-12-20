"""Configuration settings for AtlasRAG backend."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Settings for backend."""

    groq_api_key: str = ""
    default_model: str = "openai/gpt-oss-120b"
    qdrant_path: str = "./data/qdrant"
    docs_path: str = "./data/docs"

    class Config:
        """Pydantic Settings configuration."""

        env_file = ".env"
        extra = "ignore"


settings = Settings()
