# AtlasRAG – Multi-Document Research & Reasoning Engine

*A production-style RAG system powered by Hybrid Retrieval, Graph-RAG, Cross-Encoder Reranking, and structured citations.*

---

## 🚀 Overview

AtlasRAG is an advanced Retrieval-Augmented Generation (RAG) engine designed to answer questions across multiple PDFs with high accuracy and page-level citations. It integrates modern retrieval techniques used by AI search products (Perplexity, Vectara, LlamaIndex) and exposes a clean API + minimal frontend interface.

This README will expand into full documentation once the project is completed.

---

## ✨ Planned Feature Set

### 🔍 Retrieval Engine

* Hierarchical section-aware chunking
* Hybrid retrieval (BM25 + dense vectors)
* Cross-encoder reranking
* Query rewriting for conversational context
* Graph-RAG reasoning (entity graph traversal)
* Multi-document support
* Structured citations (doc, pages, snippet)

### 📊 Evaluation

* Synthetic QA generation
* RAG metrics (context precision, answer relevance, faithfulness)
* Benchmark variants:

  * vector only
  * hybrid
  * graph-rag
  * reranker enabled

### ⚙️ Architecture

* FastAPI backend
* Next.js frontend
* Qdrant vector database or Chroma
* NetworkX knowledge graph
* LLM backend abstraction
* Full modular structure for research + production use

---

## 📂 Project Structure (Initial)

```
backend/
  app/
    main.py                # FastAPI entrypoint
    config.py              # Settings / env
    core/                  # LLM abstraction, prompts
    models/                # Pydantic schemas
    ingestion/             # PDF → text → chunks → entities → index
    retrieval/             # Vector / BM25 / hybrid / graph-rag / reranker
    evaluation/            # Ragas / DeepEval evaluation pipeline
    api/                   # HTTP routes
    utils/                 # Helpers, logging
frontend/
  pages/                   # Upload dashboard, chat UI
  components/
  public/
docs/
  ARCHITECTURE.md          # Detailed system design
  EVALUATION.md            # Benchmark results
  diagrams/
requirements.txt
LICENSE
README.md
```

---

## 🧠 High-Level Architecture (Text Diagram)

```
User → Next.js UI → FastAPI backend → Retrieval Engine
                                     ↓
                           Qdrant / Chroma Vector DB
                                     ↓
                            BM25 Keyword Index
                                     ↓
                         Knowledge Graph (NetworkX)
                                     ↓
                                   LLM
```

---

## 🏁 Getting Started (Development)

### 1. Create Python environment

```
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Install frontend deps (later)

```
cd frontend
npm install
```

### 3. Run backend

```
uvicorn app.main:app --reload
```

### 4. Run frontend

```
npm run dev
```

---

## 📘 License

[MIT License](LICENSE)