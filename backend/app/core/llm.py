"""LLM abstraction layer for Groq and optional OpenAI support."""

from typing import Dict, List

from groq import Groq

from backend.app.config import settings


def _get_groq_client() -> Groq:
    """Return a Groq API client instance."""
    if not settings.groq_api_key:
        msg = (
            "GROQ_API_KEY is not set. Please add it to your .env file "
            "to enable Llama 3 and GPT-OSS models."
        )
        raise ValueError(msg)

    return Groq(api_key=settings.groq_api_key)


def llm_chat(
    messages: List[Dict[str, str]],
    model: str = settings.default_model,
) -> str:
    """Generate a chat completion using Groq."""
    client = _get_groq_client()

    response = client.chat.completions.create(
        model=model,
        messages=messages,
    )

    return response.choices[0].message.content


def get_default_model() -> str:
    """Return the default LLM model name."""
    return settings.default_model
