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

# AtlasRAG

**Hybrid Graph-Augmented Retrieval-Augmented Generation System**

AtlasRAG is a production-ready document summarization and question-answering system that combines vector search, graph-based reasoning, and LLM-based generation to enable grounded, citation-aware responses over uploaded documents.

The system goes beyond naive vector similarity by incorporating concept co-occurrence graphs, enabling improved contextual coverage for complex, multi-section queries.

![AtlasRAG Web Interface](https://drive.google.com/uc?id=1BIfz53BOlS5W9LmHc66sBGyZLO9tg83j)

**[Live Demo →](https://atlas-rag.vercel.app/)**

---

## ✨ Features

- 📄 **PDF Upload & Ingestion** – Seamless document processing
- 🧠 **Hybrid Retrieval Pipeline**
  - Dense vector similarity search
  - BM25 keyword search
  - Concept co-occurrence graph expansion
- 💬 **Unified Chat Interface** – Question answering and full-document summarization
- 📚 **Citation-Aware Responses** – Grounded answers with source attribution
- 🧩 **Conversation Memory** – Short-term context retention across turns
- ✏️ **Query Rewriting** – Context-aware reformulation using chat history
- ⚡ **Token Limit Protection** – Automatic document size validation to prevent API errors
- 🔍 **Evaluation Framework** – Built-in retrieval quality assessment
- 🧪 **Ablation Studies** – Baseline comparisons and performance validation

---

## 🏗️ System Architecture

```
PDF Document
    ↓
Chunking & Parsing
    ↓
Embeddings Generation → Vector Index
    ↓
Concept Extraction → Co-occurrence Graph
    ↓
Hybrid Graph-RAG Retrieval
    ↓
Context Assembly & Prompt Construction
    ↓
LLM Generation
    ↓
Answer + Citations
```

---

## 🔍 Retrieval Strategy

AtlasRAG employs a three-stage hybrid retrieval pipeline:

### 1. Vector Search
Dense embeddings using sentence transformers for semantic similarity.

### 2. Lexical Search
BM25 scoring for keyword-based anchoring and exact term matching.

### 3. Graph Expansion
- **Nodes:** Extracted concepts from document chunks
- **Edges:** Co-occurrence relationships within the corpus
- **Purpose:** Expand retrieval to conceptually related sections

The graph augments (rather than replaces) traditional vector retrieval, providing structural context for multi-hop queries.

---

## 📊 Evaluation

### Evaluation Corpus

All evaluations were conducted using:

**"Attention Is All You Need"** by Vaswani et al.

**Rationale:**
- Dense conceptual structure with cross-section dependencies
- Well-defined technical terminology
- Requires multi-hop reasoning for comprehensive answers
- Reflects real-world academic document QA scenarios

### Query Types

The evaluation suite includes manually designed queries mapped to expected document pages:

- **Localized queries** – Single-concept retrieval  
  *Example: "What is scaled dot-product attention?"*

- **Distributed queries** – Multi-section synthesis  
  *Example: "How does self-attention replace recurrence and convolution?"*

- **Comparative queries** – Cross-concept analysis  
  *Example: "Compare encoder, decoder, and encoder-decoder architectures"*

### Metrics

- **Recall@5** – Percentage of queries with at least one relevant page retrieved
- **Coverage** – Number of unique relevant pages retrieved
- **Diversity** – Fraction of unique pages in the retrieved set

*Note: Precision was intentionally de-emphasized due to small K values and page-level evaluation granularity.*

---

## 📈 Results

### Baseline Comparison: Vector Search vs. Hybrid Graph-RAG

**Key Findings:**

- **Recall@5 = 1.00** across all evaluated queries for both methods
  - Both approaches reliably retrieve relevant information

- **Coverage & Diversity**
  - Comparable performance between vector-only and hybrid retrieval
  - Hybrid Graph-RAG occasionally surfaces conceptually adjacent sections
  - No degradation introduced by graph expansion

**Interpretation:**  
The graph component does not harm retrieval quality and provides a structural foundation for improvements on larger, more fragmented corpora.

### Ablation Study

Isolated evaluation of graph reasoning impact:

- **Vector Only**
- **Vector + Graph Expansion**

**Results:**
- Recall, coverage, and diversity remained stable across configurations
- Graph augmentation introduces no noise or degradation
- Validates the architectural safety of hybrid approach for production use

---

## 🧠 Conversation Memory & Query Rewriting

- **Short-term memory** maintains recent conversation turns
- **Context-aware rewriting** reformulates follow-up queries using chat history
- Enables natural conversational flow without polluting the retrieval pipeline

---

## 🛠️ Tech Stack

### Backend
- FastAPI
- LangChain (optional integration)
- Qdrant / Vector Store
- NetworkX (graph reasoning)
- Sentence Transformers
- Groq / OpenAI-compatible LLM APIs

### Frontend
- Next.js
- Modern chat-style UI
- PDF upload interface

### Development & Deployment
- Ruff (formatting & linting)
- Pre-commit hooks
- Docker
- Hugging Face Spaces (backend)
- Vercel (frontend)

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- Git

### Clone Repository

```bash
git clone https://github.com/sanskarmodi8/Atlas-RAG
cd Atlas-RAG
```

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at: **http://127.0.0.1:8000**

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## 🧹 Code Quality

This project enforces strict code quality standards.

### Install Pre-commit Hooks

```bash
pre-commit install
```

### Format & Lint

```bash
ruff check .
ruff format .
```

All code complies with:
- Ruff linting rules
- Black-style formatting
- Pre-commit validation

---

## 🌐 Deployment

### Production Instances

- **Frontend:** [https://atlas-rag.vercel.app/](https://atlas-rag.vercel.app/)  
  *Deployed on Vercel*

- **Backend API:** [https://sanskarmodi-atlasrag-backend.hf.space/](https://sanskarmodi-atlasrag-backend.hf.space/)  
  *Deployed on Hugging Face Spaces*

Binary document files are excluded from version control and handled at runtime.

---

## 📄 License

This project is licensed under the **MIT License**.  
See the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Sanskar Modi**  
GitHub: [@sanskarmodi8](https://github.com/sanskarmodi8)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Contact

For questions or feedback, please open an issue on GitHub.