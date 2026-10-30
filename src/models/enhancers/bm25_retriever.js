/**
 * BM25Retriever — Okapi BM25 retrieval baseline for SAER comparison.
 *
 * Each training example is indexed as a document built from its name, slug,
 * rationale, actual description, and all step goal/action_nl fields.
 * The query is the raw user task description (e.g. "craft an iron axe").
 *
 * Standard Okapi BM25 parameters: k1=1.5, b=0.75.
 *
 * Usage:
 *   const retriever = new BM25Retriever(examples);
 *   const topK = retriever.search('craft an iron axe', 3);
 */

const BM25_K1 = 1.5;
const BM25_B = 0.75;

const STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'to', 'of', 'in', 'for', 'on',
    'with', 'is', 'are', 'was', 'be', 'at', 'by', 'from', 'as',
    'into', 'that', 'this', 'it', 'its', 'i', 'you', 'me', 'my',
    'how', 'can', 'do', 'get', 'need', 'want', 'please', 'make',
    'using', 'use', 'one', 'two', 'three'
]);

/**
 * Tokenize text to a list of lowercase content tokens.
 */
function tokenize(text) {
    if (!text) return [];
    return text
        .toLowerCase()
        .split(/[^a-z0-9]+/)          // split on underscores too — wooden_sword → ['wooden','sword']
        .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Build a single searchable text string from a training example.
 * Includes name, slug, description, and all step narrative fields.
 */
function buildDocumentText(example) {
    const parts = [];

    if (example.name) parts.push(example.name);
    if (example.slug) parts.push(example.slug.replace(/\//g, ' '));
    if (example.actual) parts.push(example.actual);
    if (example.rationale) parts.push(example.rationale);

    if (Array.isArray(example.plan)) {
        for (const step of example.plan) {
            if (step.goal) parts.push(step.goal);
            if (step.action_nl) parts.push(step.action_nl);
            if (step.expected) parts.push(step.expected);
        }
    }

    return parts.join(' ');
}

export class BM25Retriever {
    /**
     * @param {Array} examples - Training examples to index
     */
    constructor(examples) {
        this._examples = examples;
        this._index = this._buildIndex(examples);
    }

    _buildIndex(examples) {
        const N = examples.length;
        const docs = examples.map(ex => tokenize(buildDocumentText(ex)));
        const avgdl = docs.reduce((s, d) => s + d.length, 0) / Math.max(N, 1);

        // df[term] = number of documents containing term
        const df = new Map();
        for (const tokens of docs) {
            for (const t of new Set(tokens)) {
                df.set(t, (df.get(t) || 0) + 1);
            }
        }

        // tf[docIdx][term] = term frequency in document
        const tf = docs.map(tokens => {
            const freq = new Map();
            for (const t of tokens) {
                freq.set(t, (freq.get(t) || 0) + 1);
            }
            return freq;
        });

        return { N, docs, avgdl, df, tf };
    }

    /**
     * Compute IDF for a term using the Robertson-Sparck Jones formula.
     */
    _idf(term) {
        const { N, df } = this._index;
        const n = df.get(term) || 0;
        return Math.log((N - n + 0.5) / (n + 0.5) + 1);
    }

    /**
     * Score a single document against the query tokens.
     */
    _score(docIdx, queryTokens) {
        const { tf, docs, avgdl } = this._index;
        const dl = docs[docIdx].length;
        const docTf = tf[docIdx];

        let score = 0;
        for (const t of queryTokens) {
            const f = docTf.get(t) || 0;
            if (f === 0) continue;
            const idf = this._idf(t);
            const numerator = f * (BM25_K1 + 1);
            const denominator = f + BM25_K1 * (1 - BM25_B + BM25_B * dl / avgdl);
            score += idf * (numerator / denominator);
        }
        return score;
    }

    /**
     * Retrieve the top-k examples most relevant to the query.
     *
     * @param {string} query - Raw task description
     * @param {number} k - Number of examples to return (default 3)
     * @returns {Array} Top-k examples sorted by BM25 score descending,
     *                  each with a `_bm25Score` field attached.
     */
    search(query, k = 3) {
        const queryTokens = tokenize(query);

        const scored = this._examples.map((ex, i) => ({
            ...ex,
            _bm25Score: this._score(i, queryTokens)
        }));

        scored.sort((a, b) => b._bm25Score - a._bm25Score);

        // Tie-break: if top scores are all 0 (no overlap), fall back to
        // index order so behaviour is deterministic.
        return scored.slice(0, k);
    }
}
