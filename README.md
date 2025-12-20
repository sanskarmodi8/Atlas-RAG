---
title: AtlasRAG Backend
emoji: 📚
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# AtlasRAG — Hybrid Graph-Enhanced Retrieval-Augmented Generation System

AtlasRAG is a **document-centric Question Answering and Summarization system** that combines **vector search**, **symbolic graph reasoning**, and **LLM-based generation** to produce **grounded, citation-backed answers** from uploaded documents.

The project demonstrates **end-to-end RAG system engineering**, covering ingestion, retrieval design, reranking, citation grounding, evaluation, memory, and real-world deployment.

---

## 🌐 Live Deployment

AtlasRAG is fully deployed and publicly accessible:

* **Frontend (Vercel)**
  👉 [https://atlas-rag.vercel.app/](https://atlas-rag.vercel.app/)

* **Backend API (Hugging Face Spaces)**
  👉 [https://sanskarmodi-atlasrag-backend.hf.space/](https://sanskarmodi-atlasrag-backend.hf.space/)

The frontend communicates with the deployed backend over REST APIs.

---

## 🖥️ Application Preview

**Home Page (Document Upload & Chat Interface):**

![AtlasRAG Web App Screenshot](https://drive.google.com/uc?id=1BIfz53BOlS5W9LmHc66sBGyZLO9tg83j)

---

## ✨ Key Features

* **Document Upload & Parsing**

  * PDF ingestion
  * Page-aware chunking with metadata
* **Hybrid Retrieval (Core Contribution)**

  * Dense vector search (semantic similarity)
  * Sparse lexical search (BM25)
  * Concept co-occurrence graph
  * Hybrid Graph-RAG retrieval pipeline
* **Citation-Backed QA**

  * Answers grounded strictly in retrieved chunks
  * Page-level citations extracted post-generation
* **Document Summarization**

  * Full-document summarization using all indexed chunks
* **Conversation Memory**

  * Short-term session-based conversation history
* **Query Rewriting**

  * Follow-up questions rewritten into standalone queries
* **Evaluation & Analysis**

  * Baseline comparison (vector vs hybrid)
  * Ablation study (vector-only vs vector + graph)
* **Production-First Design**

  * Minimal runtime dependencies
  * Offline evaluation separated from deployment

---

## 🧠 System Architecture

```
User Query
   │
   ├── Conversation Memory
   │        └── Query Rewriting
   │
   ├── Hybrid Retrieval
   │     ├── Vector Search
   │     ├── Lexical Search
   │     └── Graph Expansion
   │
   ├── Reranking
   │
   ├── LLM Generation
   │
   └── Citation Filtering
           └── Page-level evidence
```

---

## 🔍 Retrieval Strategy

### Vector Search

* Sentence-transformer embeddings
* Semantic similarity search

### Lexical Search

* BM25 / keyword-based retrieval
* Improves recall for exact and technical terms

### Graph-Based Retrieval (AtlasRAG)

* Builds a **concept co-occurrence graph** during ingestion
* Expands retrieval via entity relationships
* Improves **coverage and diversity** without harming recall

This hybrid strategy balances:

* Semantic understanding
* Symbolic structure
* Explicit document grounding

---

## 📝 Question Answering

* Answers are generated **only from retrieved context**
* If information is missing, the system responds:

  > *“I don't know based on the provided documents.”*
* Citations are extracted **after generation**
* Citations include:

  * Page numbers
  * Supporting text snippets

---

## 📄 Document Summarization

* Uses **all indexed chunks**
* No top-k truncation
* Designed for long-form documents such as:

  * Research papers
  * Technical documentation
  * Academic PDFs

QA and summarization share the same backend pipeline.

---

## 🧠 Memory & Query Rewriting

### Conversation Memory

* Short-term, session-based
* Stores recent user and assistant turns

### Query Rewriting

* Converts follow-up questions into standalone queries
* Improves retrieval quality without polluting the retriever

Example:

```
User: What is self-attention?
User: Why is it better?
↓
Rewritten Query:
Why is self-attention better than recurrence and convolution?
```

---

## 📊 Evaluation Methodology

Evaluation focuses on **retrieval quality**, not subjective LLM scoring.

### Metrics Used

* **Recall@K** — Whether relevant pages were retrieved
* **Coverage** — Number of unique relevant pages retrieved
* **Diversity** — Distribution of retrieved pages

### Experiments

* **Baseline Comparison**

  * Vector Search vs Hybrid Graph-RAG
* **Ablation Study**

  * Vector-only vs Vector + Graph expansion

All evaluation runs **offline** and is excluded from production deployment.

---

## ⚙️ Tech Stack

### Backend

* Python
* FastAPI
* Sentence Transformers
* Qdrant (Vector Store)
* NetworkX (graph reasoning)
* LangChain (optional integration)
* Groq / OpenAI-compatible LLM interface

### Frontend

* Deployed on Vercel
* Document upload + chat interface

### Tooling

* Ruff (linting)
* Pre-commit hooks
* Docker

---

## 🚀 Deployment Notes

* Backend deployed on **Hugging Face Spaces**
* Frontend deployed on **Vercel**
* Vector database initialized at runtime
* Uploaded documents stored dynamically (not committed to git)

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── core/           # LLM & prompts
│   ├── ingestion/      # PDF parsing & chunking
│   ├── retrieval/      # Vector, graph, hybrid search
│   ├── memory/         # Conversation memory & rewriting
│   ├── evaluation/     # Baseline & ablation analysis
│   └── api/            # FastAPI routes
```

---

## 🎯 Design Rationale

* **Hybrid retrieval over pure vector search**
  → Better robustness and coverage
* **Citation filtering post-generation**
  → Prevents hallucinated references
* **Offline evaluation**
  → Clean production runtime
* **Query rewriting instead of raw chat context**
  → Improves retrieval precision
* **Minimal deployment dependencies**
  → Faster builds, fewer failures

---

## 📄 License

[MIT License](LICENSE)