"""Routes related to chat and LLM testing."""

from app.core.llm import get_default_model, llm_chat
from app.models.schemas import ChatRequest, ChatResponse
from fastapi import APIRouter

router = APIRouter()


@router.post("/test-llm", response_model=ChatResponse)
def test_llm(req: ChatRequest) -> ChatResponse:
    """Test endpoint for verifying LLM integration."""
    reply = llm_chat(
        model=get_default_model(),
        messages=[{"role": "user", "content": req.message}],
    )
    return ChatResponse(reply=reply)
