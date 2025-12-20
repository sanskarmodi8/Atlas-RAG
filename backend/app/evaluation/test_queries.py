"""Evaluation queries for AtlasRAG."""

TEST_QUERIES = [
    {
        "query": "What is scaled dot-product attention?",
        "expected_pages": {3, 4},
        "type": "localized",
    },
    {
        "query": "How does self-attention replace recurrence and convolution?",
        "expected_pages": {1, 2, 5},
        "type": "distributed",
    },
    {
        "query": "Compare encoder, decoder, and encoder-decoder architectures",
        "expected_pages": {2, 3},
        "type": "comparative",
    },
    {
        "query": "What role does positional encoding play in the Transformer model?",
        "expected_pages": {2, 6},
        "type": "distributed",
    },
]
