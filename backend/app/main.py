"""Main FastAPI application for AtlasRAG backend."""

from app.api.routes_chat import router as chat_router
from app.api.routes_docs import router as docs_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AtlasRAG Backend",
    version="0.0.0",
    description="Backend API for AtlasRAG multi-document research assistant.",
)

# CORS enabled for all origins (safe during development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict:
    """Return simple health status."""
    return {"status": "ok"}


# Include routers
app.include_router(chat_router, prefix="/chat")
app.include_router(docs_router, prefix="/docs")
