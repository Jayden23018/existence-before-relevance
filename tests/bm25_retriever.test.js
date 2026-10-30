/**
 * Tests for BM25Retriever
 * Run: node tests/bm25_retriever.test.js
 */

import { BM25Retriever } from '../src/models/enhancers/bm25_retriever.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let passed = 0;
let failed = 0;

function assert(condition, msg) {
    if (condition) {
        console.log(`  ✓ ${msg}`);
        passed++;
    } else {
        console.error(`  ✗ ${msg}`);
        failed++;
    }
}

// ─── Load real training examples ────────────────────────────────────────────

const craftingPath = join(__dirname, '../data/training/crafting_examples.json');
const craftingExamples = JSON.parse(readFileSync(craftingPath, 'utf8'));

const collectingPath = join(__dirname, '../data/training/collecting_examples.json');
const collectingExamples = JSON.parse(readFileSync(collectingPath, 'utf8'));

// ─── Basic construction ──────────────────────────────────────────────────────

console.log('\n--- Construction ---');
{
    const r = new BM25Retriever(craftingExamples);
    assert(r !== null, 'constructs successfully');
    assert(r._index.N === craftingExamples.length, `indexes all ${craftingExamples.length} examples`);
    assert(r._index.avgdl > 0, 'computes positive avgdl');
    assert(r._index.df.size > 0, 'builds non-empty term df map');
}

// ─── Top-K retrieval ────────────────────────────────────────────────────────

console.log('\n--- Top-K retrieval ---');
{
    const r = new BM25Retriever(craftingExamples);
    const results = r.search('craft an iron axe', 3);
    assert(results.length === 3, 'returns exactly 3 results');
    assert(results.every(ex => '_bm25Score' in ex), 'all results have _bm25Score');
    assert(results[0]._bm25Score >= results[1]._bm25Score, 'results sorted descending');
    assert(results[1]._bm25Score >= results[2]._bm25Score, 'results sorted descending (2-3)');
}

// ─── Iron tool retrieval should rank iron examples first ─────────────────────

console.log('\n--- Iron tool query ranking ---');
{
    const r = new BM25Retriever(craftingExamples);
    const results = r.search('craft an iron axe', 3);
    const topSlug = results[0].slug || '';
    const topName = (results[0].name || '').toLowerCase();
    const hasIron = topSlug.includes('iron') || topName.includes('iron');
    assert(hasIron, `top result for "craft an iron axe" is an iron example (got: ${results[0].slug})`);

    console.log(`  Top 3 slugs: ${results.map(e => e.slug).join(', ')}`);
    // BM25 ranks by lexical overlap — "axe" dominates, so other axe variants
    // may appear in top-3. Top-1 should be the iron variant.
    const top1IsIron = (results[0].slug || '').includes('iron');
    assert(top1IsIron, `top-1 for "craft an iron axe" is an iron example (got: ${results[0].slug})`);
}

// ─── Wooden sword retrieval ──────────────────────────────────────────────────

console.log('\n--- Wooden sword query ranking ---');
{
    const r = new BM25Retriever(craftingExamples);
    const results = r.search('make a wooden sword', 3);
    console.log(`  Top 3 slugs: ${results.map(e => e.slug).join(', ')}`);
    // BM25 limitation: "wooden" has higher df than "stone" in the corpus so IDF(wooden) < IDF(stone).
    // stone_sword can outscore wooden_sword even though the query says "wooden".
    // This demonstrates BM25's material-tier blindness — the key weakness vs SAER ingredient overlap.
    const allAreSwords = results.every(ex => (ex.slug || '').includes('sword'));
    assert(allAreSwords, `all top-3 for "wooden sword" are sword examples (got: ${results.map(e=>e.slug).join(', ')})`);
}

// ─── k < pool size ────────────────────────────────────────────────────────────

console.log('\n--- k edge cases ---');
{
    const r = new BM25Retriever(craftingExamples);
    assert(r.search('iron pickaxe', 1).length === 1, 'k=1 returns 1 result');
    assert(r.search('iron pickaxe', 5).length === 5, 'k=5 returns 5 results');

    // k >= pool size
    const small = new BM25Retriever(craftingExamples.slice(0, 2));
    assert(small.search('iron axe', 5).length === 2, 'k > pool returns all examples');
}

// ─── Zero-overlap query (all scores = 0) ─────────────────────────────────────

console.log('\n--- Zero-overlap query ---');
{
    const r = new BM25Retriever(craftingExamples);
    const results = r.search('xyzzy plugh twisty passages', 3);
    assert(results.length === 3, 'returns 3 results even when no term overlap');
    assert(results.every(ex => ex._bm25Score === 0), 'all scores are 0 for unknown query');
}

// ─── Collecting examples ─────────────────────────────────────────────────────

console.log('\n--- Collecting examples ---');
{
    const r = new BM25Retriever(collectingExamples);
    const results = r.search('collect gold ore', 3);
    console.log(`  Top 3 slugs: ${results.map(e => e.slug).join(', ')}`);
    assert(results.length === 3, 'returns 3 from collecting pool');
    const hasGold = results.some(ex =>
        (ex.slug || '').includes('gold') || (ex.name || '').toLowerCase().includes('gold')
    );
    assert(hasGold, 'gold ore query retrieves gold example');
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n=== ${passed + failed} tests: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
