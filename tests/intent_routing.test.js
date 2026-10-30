/**
 * Intent-routing invariant tests.
 *
 * Regression guard for the COMBAT routing gap (2026-07-30): the classifier
 * prompt folded combat into EXPLORE, and a hardcoded validTypes whitelist
 * omitted COMBAT, so "attack a zombie" routed to collecting_examples.json
 * (via EXPLORE) or to crafting_examples.json (via the GENERAL fallback) and
 * combat_examples.json was unreachable in deployment.
 *
 * The invariant: every label the classifier can emit must be enumerated in
 * the classification prompt, accepted by parseIntentResponse, and mapped to
 * a training file. Uses Object.create to bypass the heavy constructor.
 *
 * Run: node tests/intent_routing.test.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ImplicitEnhancer, INTENT_TO_TRAINING_FILE, isDemonstration } from '../src/models/enhancers/implicit_enhancer_v2.js';

const TRAINING_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'training');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passed++;
    } else {
        console.log(`  ❌ FAIL: ${message}`);
        failed++;
    }
}

function makeStub(reply) {
    const stub = Object.create(ImplicitEnhancer.prototype);
    stub.lastPrompt = null;
    stub.logDebug = () => {};
    stub.model = {
        sendRequest: (turns) => {
            stub.lastPrompt = turns[0].content;
            return Promise.resolve(reply);
        }
    };
    return stub;
}

const LABELS = Object.keys(INTENT_TO_TRAINING_FILE).filter(k => k !== 'DEFAULT');

console.log('\n=== Intent Routing ===\n');

console.log('Test 1: every mapped label is enumerated in the classification prompt');
{
    const stub = makeStub('{"type":"CRAFT"}');
    await stub.determineIntentType('craft an iron sword');
    for (const label of LABELS) {
        assert(
            stub.lastPrompt.includes(`**${label}**`),
            `${label} appears as a category in the prompt`
        );
    }
    assert(
        LABELS.every(l => stub.lastPrompt.includes(l)),
        'output-format enum covers every mapped label'
    );
}

console.log('\nTest 2: every mapped label survives parseIntentResponse');
{
    const stub = makeStub('');
    for (const label of LABELS) {
        const parsed = stub.parseIntentResponse(`{"type":"${label}"}`);
        assert(parsed && parsed.type === label, `${label} is not coerced to GENERAL`);
    }
}

console.log('\nTest 3: COMBAT routes to combat demonstrations, not collecting/crafting');
{
    assert(
        INTENT_TO_TRAINING_FILE.COMBAT === 'combat_examples.json',
        'COMBAT maps to combat_examples.json'
    );
    const stub = makeStub('');
    const parsed = stub.parseIntentResponse('{"type":"COMBAT","subtype":"mob"}');
    assert(parsed.type === 'COMBAT', 'a COMBAT verdict is preserved end to end');
    assert(
        INTENT_TO_TRAINING_FILE[parsed.type] !== INTENT_TO_TRAINING_FILE.DEFAULT,
        'COMBAT does not fall through to the crafting default'
    );
    assert(
        INTENT_TO_TRAINING_FILE.EXPLORE !== INTENT_TO_TRAINING_FILE.COMBAT,
        'EXPLORE and COMBAT are distinct routes (combat is no longer folded into EXPLORE)'
    );
}

console.log('\nTest 4: unknown labels still degrade to GENERAL');
{
    const stub = makeStub('');
    assert(stub.parseIntentResponse('{"type":"TELEPORT"}').type === 'GENERAL', 'unmapped label → GENERAL');
    assert(stub.parseIntentResponse('{"type":"combat"}').type === 'COMBAT', 'lowercase label is normalised');
    assert(stub.parseIntentResponse('{"subtype":"x"}') === null, 'missing type field → null');
}

console.log('\nTest 5: every routed training file yields usable demonstrations');
{
    // The COOK regression: cooking_examples.json is a {instruction,input,output}
    // dialogue corpus, so 0/3975 entries satisfy the demonstration schema. Routing
    // COOK there made SAER score every entry identically and then crashed
    // formatExample on example.name. This assertion is what was missing.
    for (const [label, file] of Object.entries(INTENT_TO_TRAINING_FILE)) {
        const entries = JSON.parse(readFileSync(join(TRAINING_DIR, file), 'utf8'));
        const usable = entries.filter(isDemonstration);
        assert(usable.length > 0, `${label} → ${file} yields ${usable.length} usable demonstrations`);
    }
}

console.log('\nTest 6: isDemonstration rejects the dialogue-corpus schema');
{
    assert(!isDemonstration({ instruction: 'x', input: 'y', output: 'z' }), 'rejects {instruction,input,output}');
    assert(!isDemonstration({ name: 'Craft X' }), 'rejects entry with no plan');
    assert(!isDemonstration({ name: 'Craft X', plan: [] }), 'rejects entry with empty plan');
    assert(!isDemonstration(null), 'rejects null');
    assert(isDemonstration({ name: 'Craft X', plan: [{ step: 1 }] }), 'accepts name + non-empty plan');

    // cooking_examples.json is excluded from the code-and-data release, so only
    // assert on it when it is present (i.e. in the development tree).
    let corpus = null;
    try { corpus = JSON.parse(readFileSync(join(TRAINING_DIR, 'cooking_examples.json'), 'utf8')); } catch { /* excluded from release */ }
    if (corpus) {
        assert(corpus.filter(isDemonstration).length === 0, 'cooking_examples.json is confirmed non-demonstration data');
    } else {
        console.log('  ⏭  SKIP: cooking_examples.json not present (excluded from release archive)');
    }
    assert(
        !Object.values(INTENT_TO_TRAINING_FILE).includes('cooking_examples.json'),
        'no intent routes to the dialogue corpus'
    );
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
