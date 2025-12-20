"""Main FastAPI application for AtlasRAG backend."""

import os
import sys

from app.api.routes_chat import router as chat_router
from app.api.routes_chat_langchain import router as chat_langchain_router
from app.api.routes_docs import router as docs_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# for HF spaces
sys.path.append(os.path.abspath("app"))

app = FastAPI(
    title="AtlasRAG Backend",
    version="0.0.0",
    description="Backend API for AtlasRAG multi-document research assistant.",
)

# CORS enabled for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router, prefix="/chat")
app.include_router(docs_router, prefix="/docs")
app.include_router(chat_langchain_router, prefix="/chat")
