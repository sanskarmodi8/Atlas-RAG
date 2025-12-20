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

AtlasRAG is a production-ready **document summarization and question-answering system** that combines **vector search**, **graph-based reasoning**, and **LLM-based generation** to enable grounded, citation-aware responses over uploaded documents.

The system is designed to go beyond naive vector similarity by incorporating **concept co-occurrence graphs**, enabling improved contextual coverage for complex, multi-section queries.

![AtlasRAG Web Interface](https://drive.google.com/uc?id=1BIfz53BOlS5W9LmHc66sBGyZLO9tg83j)
[Live App](https://atlas-rag.vercel.app/)

---

## ✨ Features

* 📄 **PDF Upload & Ingestion**
* 🧠 **Hybrid Retrieval**

  * Dense vector similarity
  * BM25 keyword search
  * Concept co-occurrence graph expansion
* 💬 **Unified Chat Interface**

  * Question Answering
  * Full-document Summarization
* 📚 **Citation-Aware Responses**
* 🧩 **Conversation Memory (short-term)**
* ✏️ **Query Rewriting using chat history**
* 🔍 **Evaluation Framework for Retrieval Quality**
* 🧪 **Ablation & Baseline Comparisons**

---

## 🧱 System Architecture

```
PDF → Chunking → Embeddings → Vector Index
                     ↓
               Concept Graph
                     ↓
        Hybrid Graph-RAG Retrieval
                     ↓
            Prompt Construction
                     ↓
                 LLM
                     ↓
           Answer + Citations
```

---

## 🔍 Retrieval Strategy

AtlasRAG uses a **hybrid retrieval pipeline**:

1. **Vector Search**
   Dense embeddings using sentence transformers.

2. **Lexical Search**
   BM25 for keyword anchoring.

3. **Graph Expansion**

   * Nodes: extracted concepts
   * Edges: co-occurrence within document chunks
   * Purpose: expand retrieval to conceptually related sections

The graph is used to **augment**, not replace, vector retrieval.

---

## 📊 Evaluation

### Evaluation Document

All evaluations were conducted using the research paper:

**“Attention Is All You Need” — Vaswani et al.**

**Why this paper?**

* Dense conceptual structure
* Cross-section dependencies
* Well-defined technical terminology
* Suitable for testing multi-hop and comparative retrieval

This avoids toy datasets and reflects **real academic document QA**.

---

### Query Types Evaluated

The evaluation queries were manually designed and mapped to expected pages:

* **Localized queries**
  (e.g. *“What is scaled dot-product attention?”*)

* **Distributed queries**
  (e.g. *“How does self-attention replace recurrence and convolution?”*)

* **Comparative queries**
  (e.g. *“Compare encoder, decoder, and encoder-decoder architectures”*)

---

### Metrics Used

* **Recall@5** – Was at least one expected page retrieved?
* **Coverage** – Number of unique relevant pages retrieved
* **Diversity** – Fraction of unique pages in retrieved set

> Precision was intentionally not emphasized due to small K and document-level evaluation.

---

## 📈 Baseline Comparison Results

### Vector Search vs Hybrid Graph-RAG

**Key Observations:**

* **Recall@5 = 1.00** across all evaluated queries
  → Both methods reliably retrieve relevant information.

* **Coverage & Diversity**

  * Comparable between vector-only and hybrid retrieval
  * Hybrid Graph-RAG occasionally retrieves **conceptually adjacent sections**
  * No degradation introduced by graph expansion

**Interpretation**:
The graph component does **not harm retrieval quality**, and provides a structural foundation for future improvements on more fragmented or larger corpora.

---

## 🧪 Ablation Study

An ablation study was conducted to isolate the effect of graph reasoning:

* **Vector Only**
* **Vector + Graph Expansion**

### Result

* Recall, coverage, and diversity remained **stable**
* Confirms that graph augmentation:

  * Does not introduce noise
  * Does not degrade retrieval
  * Is safe to enable in production

This validates the **architectural correctness** of the hybrid approach.

---

## 🧠 Conversation Memory & Query Rewriting

* Short-term memory maintains recent user–assistant turns
* Follow-up queries are rewritten using chat history
* Enables contextual continuity across turns without polluting retrieval

---

## 🛠️ Tech Stack

### Backend

* **FastAPI**
* **LangChain (optional integration)**
* **Qdrant / Vector Store**
* **NetworkX (Graph reasoning)**
* **Sentence Transformers**
* **Groq / OpenAI-compatible LLM APIs**

### Frontend

* **Next.js**
* **Modern chat-style UI**
* **PDF upload + chat interface**

### Tooling

* **Ruff**
* **Pre-commit hooks**
* **Docker**
* **Hugging Face Spaces**
* **Vercel**

---

## Development

### Local Setup

```bash
git clone https://github.com/your-username/Atlas-RAG
cd Atlas-RAG
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at:

```
http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:3000
```

---

## Code Quality & Tooling

This project enforces strict consistency and maintainability.

### Pre-commit Hooks

```bash
pre-commit install
```

### Formatting & Linting

```bash
ruff check .
ruff format .
```

All backend code is compliant with:

* `ruff`
* `black`-style formatting
* pre-commit hooks

---

## Deployment

### Frontend

* Deployed on **Vercel**
* Live URL:
  👉 [https://atlas-rag.vercel.app/](https://atlas-rag.vercel.app/)

### Backend

* Deployed on **Hugging Face Spaces**
* Live API:
  👉 [https://sanskarmodi-atlasrag-backend.hf.space/](https://sanskarmodi-atlasrag-backend.hf.space/)

Binary document files are excluded from Git history and handled at runtime.

---

## License

This project is licensed under the **MIT License**.
See the [`LICENSE`](LICENSE) file for details.

---

## Author

**Sanskar Modi**
GitHub: [https://github.com/sanskarmodi8](https://github.com/sanskarmodi8)