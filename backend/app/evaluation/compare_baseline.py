"""Compare Vector Search vs Hybrid Graph-RAG."""

from app.evaluation.metrics import coverage, diversity, recall_at_k
from app.evaluation.test_queries import TEST_QUERIES
from app.evaluation.utils import extract_pages
from app.retrieval.retrieve import hybrid_graph_search
from app.retrieval.vector_store import vector_search


def _print_block(
    *,
    name: str,
    pages: list[int],
    expected: set[int],
) -> None:
    print(name)
    print(f"Pages: {pages}")
    print(f"Recall@5: {recall_at_k(pages, expected):.2f}")
    print(f"Coverage: {coverage(pages)}")
    print(f"Diversity: {diversity(pages):.2f}")
    print()


def run_comparison() -> None:
    """Run retrieval comparison."""
    print("\n=== AtlasRAG Retrieval Comparison ===\n")

    for item in TEST_QUERIES:
        query = item["query"]
        expected = item["expected_pages"]
        qtype = item["type"]

        print("-" * 70)
        print(f"Query ({qtype}): {query}")
        print(f"Expected pages: {sorted(expected)}\n")

        vector_results = vector_search(query, top_k=5)
        vector_pages = extract_pages(vector_results)

        graph_results = hybrid_graph_search(query, top_k=5)
        graph_pages = extract_pages(graph_results)

        _print_block(
            name="VECTOR SEARCH",
            pages=vector_pages,
            expected=expected,
        )

        _print_block(
            name="HYBRID GRAPH-RAG",
            pages=graph_pages,
            expected=expected,
        )

    print("Comparison complete.\n")


if __name__ == "__main__":
    run_comparison()
