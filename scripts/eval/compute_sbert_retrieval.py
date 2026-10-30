#!/usr/bin/env python3
"""
compute_sbert_retrieval.py
Pre-computes SBERT (all-MiniLM-L6-v2) retrieval results for all eval tasks.

For each eval task, encodes the query and all same-category training examples
using cosine similarity, then saves top-3 example slugs per task.

Usage:
    python3 scripts/eval/compute_sbert_retrieval.py

Output:
    scripts/eval/sbert_retrieval_map.json
"""

import json
import os
import sys
from pathlib import Path

try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
except ImportError:
    print("ERROR: sentence-transformers not installed. Run: pip install sentence-transformers")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).parent.parent.parent

TRAINING_FILES = {
    'CRAFT': PROJECT_ROOT / 'data/training/crafting_examples.json',
    'COLLECT': PROJECT_ROOT / 'data/training/collecting_examples.json',
    'BUILD': PROJECT_ROOT / 'data/training/build_examples.json',
    'COMBAT': PROJECT_ROOT / 'data/training/combat_examples.json',
    'COOK': None,  # cooking format is incompatible
    'EXPLORE': PROJECT_ROOT / 'data/training/collecting_examples.json',
    'DEFAULT': PROJECT_ROOT / 'data/training/crafting_examples.json',
}

EVAL_TASKS_FILE = PROJECT_ROOT / 'scripts/eval/eval_tasks.json'
OUTPUT_FILE = PROJECT_ROOT / 'scripts/eval/sbert_retrieval_map.json'


def build_document_text(example: dict) -> str:
    """
    Matches BM25Retriever.buildDocumentText() exactly:
    name + slug + actual + rationale + step goal/action_nl/expected fields.
    """
    parts = []
    if example.get('name'):
        parts.append(example['name'])
    if example.get('slug'):
        parts.append(example['slug'].replace('/', ' '))
    if example.get('actual'):
        parts.append(example['actual'])
    if example.get('rationale'):
        parts.append(example['rationale'])
    for step in example.get('plan', []):
        if step.get('goal'):
            parts.append(step['goal'])
        if step.get('action_nl'):
            parts.append(step['action_nl'])
        if step.get('expected'):
            parts.append(step['expected'])
    return ' '.join(parts)


def build_query_text(task: dict) -> str:
    """Build query text from eval task — use name + prompt."""
    parts = []
    if task.get('name'):
        parts.append(task['name'])
    if task.get('prompt'):
        parts.append(task['prompt'])
    return ' '.join(parts)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two 1D vectors."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def load_training_examples(category: str) -> list:
    """Load training examples for a given category. Returns [] for incompatible formats."""
    file_path = TRAINING_FILES.get(category, TRAINING_FILES['DEFAULT'])
    if file_path is None:
        return []
    if not file_path.exists():
        print(f"  WARNING: Training file not found: {file_path}")
        return []
    with open(file_path, 'r') as f:
        data = json.load(f)
    # Cooking format is incompatible (instruction/input/output schema)
    if data and isinstance(data[0], dict) and 'instruction' in data[0]:
        return []
    return data


def main():
    print("=== SBERT Retrieval Pre-computation ===")
    print(f"Model: all-MiniLM-L6-v2")
    print(f"Output: {OUTPUT_FILE}")
    print()

    # Load model
    print("Loading sentence-transformers model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("Model loaded.")
    print()

    # Load eval tasks
    with open(EVAL_TASKS_FILE, 'r') as f:
        eval_tasks = json.load(f)

    # Filter to non-combat tasks only (combat is a secondary experiment)
    # Include all 42 craft/collect tasks
    craft_collect_tasks = [t for t in eval_tasks if t.get('category') in ('CRAFT', 'COLLECT', 'EXPLORE', 'BUILD')]
    combat_tasks = [t for t in eval_tasks if t.get('category') == 'COMBAT']

    print(f"Eval tasks: {len(craft_collect_tasks)} craft/collect + {len(combat_tasks)} combat")
    print()

    retrieval_map = {}

    # Pre-cache encoded training pools to avoid redundant encoding
    encoded_pools = {}  # category -> (examples, embeddings)

    def get_pool(category: str):
        if category not in encoded_pools:
            examples = load_training_examples(category)
            if not examples:
                encoded_pools[category] = ([], None)
                return [], None
            doc_texts = [build_document_text(ex) for ex in examples]
            print(f"  Encoding {len(examples)} {category} training examples...")
            embeddings = model.encode(doc_texts, show_progress_bar=False)
            encoded_pools[category] = (examples, embeddings)
        return encoded_pools[category]

    # Process all tasks
    all_tasks = craft_collect_tasks + combat_tasks
    for task in all_tasks:
        slug = task['slug']
        category = task.get('category', 'CRAFT')
        query_text = build_query_text(task)

        examples, pool_embeddings = get_pool(category)
        if not examples:
            print(f"  [{slug}] No training pool for category {category}, skipping.")
            retrieval_map[slug] = []
            continue

        # Encode query
        query_embedding = model.encode([query_text], show_progress_bar=False)[0]

        # Compute cosine similarities
        similarities = []
        for i, ex_emb in enumerate(pool_embeddings):
            sim = cosine_similarity(query_embedding, ex_emb)
            similarities.append((sim, i, examples[i]['slug']))

        # Sort by similarity descending
        similarities.sort(key=lambda x: -x[0])

        # Top-3 slugs
        top3 = [s[2] for s in similarities[:3]]

        # Debug: print top result
        top_sim = similarities[0][0]
        print(f"  [{slug}] top1={similarities[0][2]} (sim={top_sim:.3f})")

        retrieval_map[slug] = top3

    # Save results
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(retrieval_map, f, indent=2)

    print()
    print(f"Saved retrieval map for {len(retrieval_map)} tasks → {OUTPUT_FILE}")

    # Print summary statistics
    total = len([v for v in retrieval_map.values() if v])
    print(f"Tasks with retrieval results: {total}/{len(retrieval_map)}")


if __name__ == '__main__':
    main()
