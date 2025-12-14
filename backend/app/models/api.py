"""Pydantic models for API request and response bodies."""

from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Schema for chat input message sent by the user."""

    query: str
    top_k: int = 5


class Citation(BaseModel):
    """Schema for citations in LLM's response."""

    page_start: int
    page_end: int
    snippet: str


class ChatResponse(BaseModel):
    """Schema for LLM-generated assistant response."""

    answer: str
    citations: list[Citation]
