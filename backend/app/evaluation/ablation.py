"""Ablation study for AtlasRAG retrieval."""

from app.evaluation.metrics import coverage, diversity, recall_at_k
from app.evaluation.test_queries import TEST_QUERIES
from app.evaluation.utils import extract_pages
from app.retrieval.retrieve import hybrid_graph_search
from app.retrieval.vector_store import vector_search


def run_ablation() -> None:
    """Run ablation study."""
    print("\n=== AtlasRAG Ablation Study ===\n")

    for item in TEST_QUERIES:
        query = item["query"]
        expected = item["expected_pages"]

        print("-" * 70)
        print(f"Query: {query}\n")

        vector_pages = extract_pages(vector_search(query, top_k=5))
        hybrid_pages = extract_pages(hybrid_graph_search(query, top_k=5))

        print("VECTOR ONLY")
        print(f"Recall@5: {recall_at_k(vector_pages, expected):.2f}")
        print(f"Coverage: {coverage(vector_pages)}")
        print(f"Diversity: {diversity(vector_pages):.2f}\n")

        print("VECTOR + GRAPH")
        print(f"Recall@5: {recall_at_k(hybrid_pages, expected):.2f}")
        print(f"Coverage: {coverage(hybrid_pages)}")
        print(f"Diversity: {diversity(hybrid_pages):.2f}\n")

    print("Ablation complete.\n")


if __name__ == "__main__":
    run_ablation()
