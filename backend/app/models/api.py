"""Pydantic models for API request and response bodies."""

from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Schema for chat input message sent by the user."""

    message: str


class ChatResponse(BaseModel):
    """Schema for LLM-generated assistant response."""

    reply: str
