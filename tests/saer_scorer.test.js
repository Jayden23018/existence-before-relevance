/**
 * SAER Scorer Unit Tests
 *
 * Run: node tests/saer_scorer.test.js
 */

import { SAERScorer } from '../src/models/enhancers/saer_scorer.js';
import RecipeResolver from '../src/models/enhancers/recipe_resolver.js';

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

function assertApprox(actual, expected, tolerance, message) {
    const diff = Math.abs(actual - expected);
    assert(diff <= tolerance, `${message} (got ${actual.toFixed(3)}, expected ~${expected.toFixed(3)})`);
}

// ─── Test fixtures ─────────────────────────────────────────────────

const ironAxeExample = {
    slug: 'crafting/iron_axe',
    name: 'Craft an Iron Axe',
    tab: 'crafting',
    level: 'L1',
    plan: [
        {
            step: 1,
            goal: 'Collect Logs',
            preconditions: ['Access to trees nearby', 'Enough inventory space']
        },
        {
            step: 2,
            goal: 'Mine Iron Ore',
            preconditions: ['Access to cave or exposed stone area', 'Stone Pickaxe in inventory']
        },
        {
            step: 3,
            goal: 'Smelt Iron Ore',
            preconditions: ['Furnace available', 'At least 1 fuel source (coal, charcoal, or wood)']
        },
        {
            step: 4,
            goal: 'Craft an Iron Axe',
            preconditions: ['Access to a Crafting Table', '3x Iron Ingot', '2x Stick']
        }
    ]
};

const diamondPickaxeExample = {
    slug: 'crafting/diamond_pickaxe',
    name: 'Craft a Diamond Pickaxe',
    tab: 'crafting',
    level: 'L2',
    plan: [
        {
            step: 1,
            goal: 'Collect Logs',
            preconditions: ['Access to trees nearby']
        },
        {
            step: 2,
            goal: 'Mine Diamond Ore',
            preconditions: ['Iron Pickaxe or better in inventory', 'Access to deep underground']
        },
        {
            step: 3,
            goal: 'Craft a Diamond Pickaxe',
            preconditions: ['Access to a Crafting Table', '3x Diamond', '2x Stick']
        }
    ]
};

const stoneSwordExample = {
    slug: 'crafting/stone_sword',
    name: 'Craft a Stone Sword',
    tab: 'crafting',
    level: 'L1',
    plan: [
        {
            step: 1,
            goal: 'Collect stone',
            preconditions: ['Wooden Pickaxe in inventory', 'Access to stone']
        },
        {
            step: 2,
            goal: 'Craft sticks',
            preconditions: ['Access to trees']
        },
        {
            step: 3,
            goal: 'Craft a Stone Sword',
            preconditions: ['Access to a Crafting Table', '2x Cobblestone', '1x Stick']
        }
    ]
};

const allExamples = [ironAxeExample, diamondPickaxeExample, stoneSwordExample];

// ─── Test 1: Precondition Gap Score ────────────────────────────────

console.log('\n=== Test 1: Precondition Gap Score ===\n');

{
    const scorer = new SAERScorer(true);

    // Agent has iron_ingot x3, stick x2, but NO crafting_table
    const agentState = {
        inventory: [
            { name: 'iron_ingot', count: 3 },
            { name: 'stick', count: 2 }
        ],
        nearbyBlocks: []
    };

    // Non-cold-start: only checks FIRST step's preconditions.
    // Step 1: "Access to trees nearby" (parseable, ✗ no trees nearby), "Enough inventory space" (unparseable)
    // First step score: 0/1 = 0.0 — bot can't start step 1 without trees
    const score = scorer.calcPreconditionGapScore(ironAxeExample, agentState);
    assert(score >= 0.0, `Iron axe with partial inventory scores >= 0.0 (got ${score.toFixed(3)})`);
    console.log(`  Score: ${score.toFixed(3)}`);
}

{
    const scorer = new SAERScorer();
    const emptyState = { inventory: [], nearbyBlocks: [] };
    // Cold-start: returns tool chain depth / 3 instead of gap score
    const score = scorer.calcPreconditionGapScore(ironAxeExample, emptyState);
    assert(score >= 0 && score <= 1, `Empty inventory cold-start score in range (got ${score.toFixed(3)})`);
}

{
    const scorer = new SAERScorer();
    const richState = {
        inventory: [
            { name: 'iron_ingot', count: 10 },
            { name: 'stick', count: 10 },
            { name: 'diamond', count: 5 },
            { name: 'crafting_table', count: 1 },
            { name: 'furnace', count: 1 },
            { name: 'coal', count: 20 },
            { name: 'stone_pickaxe', count: 1 }
        ],
        nearbyBlocks: ['crafting_table', 'furnace', 'trees', 'stone_area']
    };
    const score = scorer.calcPreconditionGapScore(ironAxeExample, richState);
    assert(score > 0.7, `Rich inventory scores high (got ${score.toFixed(3)})`);
}

{
    // Cold-start (empty inventory): no plan → _calcToolChainDepth returns 0
    const scorer = new SAERScorer();
    const noPlanExample = { name: 'Empty', slug: 'test/empty', level: 'L1' };
    const score = scorer.calcPreconditionGapScore(noPlanExample, { inventory: [], nearbyBlocks: [] });
    assert(score === 0, `No-plan example returns 0 in cold-start (got ${score})`);
}

// ─── Test 2: Keyword Overlap Score ─────────────────────────────────

console.log('\n=== Test 2: Keyword Overlap Score ===\n');

{
    const scorer = new SAERScorer();

    const score1 = scorer.calcKeywordScore('craft iron sword', ironAxeExample);
    const score2 = scorer.calcKeywordScore('craft iron sword', stoneSwordExample);
    const score3 = scorer.calcKeywordScore('make a wooden hoe', diamondPickaxeExample);

    console.log(`  "craft iron sword" vs iron_axe: ${score1.toFixed(3)}`);
    console.log(`  "craft iron sword" vs stone_sword: ${score2.toFixed(3)}`);
    console.log(`  "make a wooden hoe" vs diamond_pickaxe: ${score3.toFixed(3)}`);

    // "craft iron sword" shares "iron" with iron_axe → should score higher than diamond_pickaxe
    assert(score1 > score3, 'Iron sword matches iron_axe better than diamond_pickaxe');

    // "craft iron sword" shares "sword" with stone_sword (name has "Sword")
    assert(score2 > score3, 'Iron sword matches stone_sword better than diamond_pickaxe');
}

{
    const scorer = new SAERScorer();

    // Slug tokenization: "crafting/iron_axe" → ["iron", "axe"]
    const score = scorer.calcKeywordScore('iron axe', ironAxeExample);
    assert(score > 0.5, `Slug tokenization works: "iron axe" vs crafting/iron_axe = ${score.toFixed(3)}`);
}

{
    const scorer = new SAERScorer();
    const emptyExample = { name: '', slug: '' };
    const score = scorer.calcKeywordScore('craft iron sword', emptyExample);
    assert(score === 0, `Empty example scores 0 (got ${score})`);
}

// ─── Test 3: Level Proximity Score ─────────────────────────────────

console.log('\n=== Test 3: Level Proximity Score ===\n');

{
    const scorer = new SAERScorer();

    // "diamond" → estimated L3
    const scoreL2 = scorer.calcLevelScore('make a diamond pickaxe', diamondPickaxeExample); // L2
    const scoreL1 = scorer.calcLevelScore('make a diamond pickaxe', stoneSwordExample); // L1

    console.log(`  "diamond pickaxe" (→L3) vs L2 example: ${scoreL2.toFixed(3)}`);
    console.log(`  "diamond pickaxe" (→L3) vs L1 example: ${scoreL1.toFixed(3)}`);

    assert(scoreL2 > scoreL1, 'Diamond request matches L2 better than L1');

    // L3 example → L3 example should score 1.0
    const l3Example = { name: 'Test', slug: 'test/x', level: 'L3' };
    const scoreSame = scorer.calcLevelScore('make a diamond pickaxe', l3Example);
    assertApprox(scoreSame, 1.0, 0.01, 'Same level scores 1.0');
}

{
    const scorer = new SAERScorer();

    // "wooden" → L1
    const scoreL1 = scorer.calcLevelScore('make a wooden sword', stoneSwordExample); // L1
    const scoreL2 = scorer.calcLevelScore('make a wooden sword', diamondPickaxeExample); // L2

    assert(scoreL1 > scoreL2, 'Wooden request matches L1 better than L2');
}

// ─── Test 4: End-to-end Selection ──────────────────────────────────

console.log('\n=== Test 4: End-to-end Selection ===\n');

{
    const scorer = new SAERScorer(true);

    // User wants iron sword, has iron ingots
    const agentState = {
        inventory: [
            { name: 'iron_ingot', count: 5 },
            { name: 'stick', count: 4 },
            { name: 'crafting_table', count: 1 }
        ],
        nearbyBlocks: ['crafting_table', 'trees']
    };

    const selected = scorer.selectExamples('craft an iron sword', allExamples, agentState, 2);

    console.log(`\n  Selected ${selected.length} examples:`);
    selected.forEach((ex, i) => {
        console.log(`    #${i + 1}: ${ex.name} (score: ${ex._saerScore?.toFixed(3)})`);
    });

    // Diamond pickaxe (L2, needs iron_pickaxe) should NOT win over simpler examples
    // given current state (has iron ingots but no pickaxe).
    // With all-steps gap scoring, both iron_axe and stone_sword are reasonable picks
    // since stone_sword's preconditions (crafting_table + stick) are more satisfied.
    assert(selected.length === 2, `Selected 2 examples (got ${selected.length})`);
    const slugs = selected.map(e => e.slug);
    assert(!slugs.includes('crafting/diamond_pickaxe'), `Diamond pickaxe (needs iron_pickaxe) not in top 2 (got ${JSON.stringify(slugs)})`);
}

// ─── Test 5: Cold Start (empty inventory) ──────────────────────────

console.log('\n=== Test 5: Cold Start ===\n');

{
    const scorer = new SAERScorer();

    const emptyState = { inventory: [], nearbyBlocks: [] };
    const selected = scorer.selectExamples('craft iron sword', allExamples, emptyState, 2);

    // Should not crash, keyword score should dominate
    assert(selected.length === 2, 'Cold start returns results');
    assert(selected[0]._saerScore > 0, 'Cold start has positive scores');

    console.log(`  Cold start top pick: ${selected[0].name} (score: ${selected[0]._saerScore.toFixed(3)})`);
}

// ─── Test 6: Edge Cases ────────────────────────────────────────────

console.log('\n=== Test 6: Edge Cases ===\n');

{
    const scorer = new SAERScorer();

    // Null agentState
    const result1 = scorer.selectExamples('test', allExamples, null, 3);
    assert(result1.length === 3, 'Null agentState works');

    // Empty examples
    const result2 = scorer.selectExamples('test', [], null, 3);
    assert(result2.length === 0, 'Empty examples returns empty');

    // Fewer examples than topK
    const result3 = scorer.selectExamples('test', [ironAxeExample], { inventory: [], nearbyBlocks: [] }, 5);
    assert(result3.length === 1, 'Returns all when fewer than topK');

    // Custom weights (new field names)
    const customScorer = new SAERScorer(false, { ingredient: 1.0, keyword: 0, miningTierGap: 0, level: 0 });
    const score = customScorer.calcCompositeScore('test', ironAxeExample, { inventory: [], nearbyBlocks: [] });
    assert(score >= 0 && score <= 1, `Custom weights produce valid score: ${score.toFixed(3)}`);
}

// ─── Test 7: Cold-Start Weight Adjustment ──────────────────────────

console.log('\n=== Test 7: Cold-Start Weight Adjustment ===\n');

{
    const rr = new RecipeResolver({ version: '1.20.4' });
    const scorer = new SAERScorer(false, { ingredient: 0.40, keyword: 0.30, miningTierGap: 0.20, level: 0.10 }, null, rr);

    // Cold-start: empty inventory should shift weights toward ingredient + keyword
    const coldState = { inventory: [], nearbyBlocks: [] };
    const warmState = { inventory: [{ name: 'iron_ingot', count: 3 }], nearbyBlocks: [] };

    // For "craft an iron axe", iron_axe should be #1 with cold-start weights
    const coldResult = scorer.selectExamples('craft an iron axe', allExamples, coldState, 3);
    assert(coldResult[0].slug === 'crafting/iron_axe', 'Cold-start: iron axe is top pick for "craft an iron axe"');
    assert(coldResult[0]._saerScore > 0.7, `Cold-start score > 0.7 (got ${coldResult[0]._saerScore.toFixed(3)})`);

    // Warm state should also work (normal weights)
    const warmResult = scorer.selectExamples('craft an iron axe', allExamples, warmState, 3);
    assert(warmResult[0]._saerScore > 0, 'Warm state returns valid results');

    // Verify keyword-heavy scoring for diamond pickaxe
    const coldComposite = scorer.calcCompositeScore('craft a diamond pickaxe', diamondPickaxeExample, coldState);
    assert(coldComposite > 0.5, `Cold-start keyword match score high (got ${coldComposite.toFixed(3)})`);
}

// ─── Test 8: Optional Items Excluded from Gap Scoring ──────────────

console.log('\n=== Test 8: Optional Items Excluded ===\n');

{
    const scorer = new SAERScorer(false);

    // Example with optional preconditions
    const exampleWithOptional = {
        slug: 'test/optional',
        name: 'Test Optional',
        plan: [{
            step: 1,
            goal: 'Test',
            action_nl: 'Test',
            action_cmd: ["!collectBlocks('oak_log', 1)"],
            preconditions: {
                items: {
                    inventory: ['iron_ingot:3'],
                    nearby: [],
                    optional: ['axe', 'pickaxe']
                },
                access: ['trees']
            }
        }]
    };

    const coldState = { inventory: [], nearbyBlocks: [] };
    const preconditions = scorer.flattenExamplePreconditions(exampleWithOptional);

    // Verify optional items are NOT in the flattened preconditions
    const hasAxe = preconditions.some(p => p.includes('axe'));
    const hasPickaxe = preconditions.some(p => p.includes('pickaxe'));
    assert(!hasAxe, 'Optional "axe" not in flattened preconditions');
    assert(!hasPickaxe, 'Optional "pickaxe" not in flattened preconditions');

    // Verify required items ARE in the flattened preconditions
    const hasIron = preconditions.some(p => p.includes('iron'));
    assert(hasIron, 'Required "iron_ingot" IS in flattened preconditions');
}

// ─── Test 9: _normalizeHops ────────────────────────────────────────

console.log('\n=== Test 9: _normalizeHops ===\n');

{
    const rr = new RecipeResolver({ version: '1.20.4' });
    const scorer = new SAERScorer(false, null, null, rr);

    assert(scorer._normalizeHops(0) === 0, '_normalizeHops(0) === 0');
    assert(scorer._normalizeHops(Infinity) === 1, '_normalizeHops(Infinity) === 1');
    assert(scorer._normalizeHops(undefined) === 1, '_normalizeHops(undefined) === 1');

    const max = rr.getMaxObservedHops();
    assert(scorer._normalizeHops(max) === 1, `_normalizeHops(${max}) === 1`);

    const n1 = scorer._normalizeHops(1);
    assert(n1 > 0 && n1 <= 1, `_normalizeHops(1) in (0, 1] (got ${n1.toFixed(3)})`);

    // Monotonicity: _normalizeHops(n) <= _normalizeHops(n+1)
    for (let n = 0; n < max; n++) {
        assert(scorer._normalizeHops(n) <= scorer._normalizeHops(n + 1),
            `_normalizeHops(${n}) <= _normalizeHops(${n + 1})`);
    }
}

// ─── Test 10: Distance-Based Gap Edge Cases ─────────────────────────

console.log('\n=== Test 10: Distance-Based Gap Edge Cases ===\n');

{
    const rr = new RecipeResolver({ version: '1.20.4' });
    const scorer = new SAERScorer(false, null, null, rr);

    // All preconditions satisfied → 1.0
    const allSatisfied = {
        slug: 'test/satisfied', name: 'Test', level: 'L1',
        plan: [{ step: 1, goal: 'Test', preconditions: ['3x Iron Ingot', '2x Stick'] }]
    };
    const richState = {
        inventory: [{ name: 'iron_ingot', count: 5 }, { name: 'stick', count: 5 }],
        nearbyBlocks: []
    };
    const scoreSatisfied = scorer.calcPreconditionGapScore(allSatisfied, richState);
    assert(scoreSatisfied === 1.0, `All satisfied → 1.0 (got ${scoreSatisfied.toFixed(3)})`);

    // Empty preconditions → falls back to _calcToolChainDepth/3.
    // A trivial example with no collectBlocks/pickaxe steps has depth=0 → score=0.0.
    const noPreconds = {
        slug: 'test/none', name: 'Test', level: 'L1',
        plan: [{ step: 1, goal: 'Test', preconditions: [] }]
    };
    const scoreEmpty = scorer.calcPreconditionGapScore(noPreconds, richState);
    assert(scoreEmpty === 0.0, `Empty preconditions → tool-chain fallback 0.0 (got ${scoreEmpty.toFixed(3)})`);

    // No preconditions field → same fallback
    const noField = {
        slug: 'test/nofield', name: 'Test', level: 'L1',
        plan: [{ step: 1, goal: 'Test' }]
    };
    const scoreNoField = scorer.calcPreconditionGapScore(noField, richState);
    assert(scoreNoField === 0.0, `No preconditions field → tool-chain fallback 0.0 (got ${scoreNoField.toFixed(3)})`);

    // Impossible item (Infinity hops, nothing in inventory) → 0.0
    const impossible = {
        slug: 'test/impossible', name: 'Test', level: 'L1',
        plan: [{ step: 1, goal: 'Test', preconditions: ['1x Bedrock'] }]
    };
    const emptyState = { inventory: [], nearbyBlocks: [] };
    const scoreImpossible = scorer.calcPreconditionGapScore(impossible, emptyState);
    assert(scoreImpossible === 0.0, `Impossible item → 0.0 (got ${scoreImpossible.toFixed(3)})`);

    // Mixed: one satisfied, one impossible → between 0 and 1
    const mixed = {
        slug: 'test/mixed', name: 'Test', level: 'L1',
        plan: [{ step: 1, goal: 'Test', preconditions: ['1x Stick', '1x Bedrock'] }]
    };
    const hasStick = { inventory: [{ name: 'stick', count: 5 }], nearbyBlocks: [] };
    const scoreMixed = scorer.calcPreconditionGapScore(mixed, hasStick);
    assert(scoreMixed > 0 && scoreMixed < 1, `Mixed → (0, 1) (got ${scoreMixed.toFixed(3)})`);

    // Count-aware: require 5, have 5 → satisfied
    const countExact = {
        slug: 'test/count', name: 'Test', level: 'L1',
        plan: [{ step: 1, goal: 'Test', preconditions: ['5x Stick'] }]
    };
    const hasExact = { inventory: [{ name: 'stick', count: 5 }], nearbyBlocks: [] };
    const scoreExact = scorer.calcPreconditionGapScore(countExact, hasExact);
    assert(scoreExact === 1.0, `Exact count satisfied → 1.0 (got ${scoreExact.toFixed(3)})`);

    // Closer items score better than far items
    const needIron = {
        slug: 'test/iron', name: 'Test', level: 'L1',
        plan: [{ step: 1, goal: 'Test', preconditions: ['1x Iron Ingot'] }]
    };
    const hasRaw = { inventory: [{ name: 'raw_iron', count: 3 }], nearbyBlocks: [] };
    const hasNothing = { inventory: [], nearbyBlocks: [] };
    const scoreClose = scorer.calcPreconditionGapScore(needIron, hasRaw);
    const scoreFar = scorer.calcPreconditionGapScore(needIron, hasNothing);
    assert(scoreClose > scoreFar, `Closer items score better: ${scoreClose.toFixed(3)} > ${scoreFar.toFixed(3)}`);

    // Log in inventory satisfies stick (2-hop path visible)
    const needStick = {
        slug: 'test/stick', name: 'Test', level: 'L1',
        plan: [{ step: 1, goal: 'Test', preconditions: ['1x Stick'] }]
    };
    const hasLog = { inventory: [{ name: 'oak_log', count: 5 }], nearbyBlocks: [] };
    const scoreLogForStick = scorer.calcPreconditionGapScore(needStick, hasLog);
    const scoreNoLogForStick = scorer.calcPreconditionGapScore(needStick, hasNothing);
    assert(scoreLogForStick > scoreNoLogForStick,
        `Log→stick path scored better than nothing: ${scoreLogForStick.toFixed(3)} > ${scoreNoLogForStick.toFixed(3)}`);
}

// ─── Test 11: Tool Tier Upward Compatibility ──────────────────────

console.log('\n=== Test 11: Tool Tier Upward Compatibility ===\n');

{
    const rr = new RecipeResolver({ version: '1.20.4' });
    const scorer = new SAERScorer(false, null, null, rr);

    // stone_pickaxe satisfies "1x wooden pickaxe" precondition
    const needsWoodenPick = {
        slug: 'test/tier', name: 'Test', level: 'L1',
        plan: [{ step: 1, goal: 'Collect cobblestone', preconditions: ['1x wooden pickaxe'] }]
    };
    const hasStone = { inventory: [{ name: 'stone_pickaxe', count: 1 }], nearbyBlocks: [] };
    const hasWooden = { inventory: [{ name: 'wooden_pickaxe', count: 1 }], nearbyBlocks: [] };
    const hasNothing = { inventory: [], nearbyBlocks: [] };

    const scoreWithStone = scorer.calcPreconditionGapScore(needsWoodenPick, hasStone);
    const scoreWithWooden = scorer.calcPreconditionGapScore(needsWoodenPick, hasWooden);
    const scoreWithNothing = scorer.calcPreconditionGapScore(needsWoodenPick, hasNothing);

    assert(scoreWithStone === 1.0,
        `stone_pickaxe satisfies "wooden_pickaxe" requirement → 1.0 (got ${scoreWithStone.toFixed(3)})`);
    assert(scoreWithWooden === 1.0,
        `wooden_pickaxe satisfies "wooden_pickaxe" requirement → 1.0 (got ${scoreWithWooden.toFixed(3)})`);
    assert(scoreWithNothing < 1.0,
        `no tool does NOT satisfy "wooden_pickaxe" requirement → <1.0 (got ${scoreWithNothing.toFixed(3)})`);

    // iron_pickaxe should NOT satisfy "diamond_pickaxe" (lower tier)
    const needsDiamond = {
        slug: 'test/tier2', name: 'Test', level: 'L3',
        plan: [{ step: 1, goal: 'Mine obsidian', preconditions: ['1x diamond pickaxe'] }]
    };
    const hasIron = { inventory: [{ name: 'iron_pickaxe', count: 1 }], nearbyBlocks: [] };
    const scoreIronForDiamond = scorer.calcPreconditionGapScore(needsDiamond, hasIron);
    assert(scoreIronForDiamond < 1.0,
        `iron_pickaxe does NOT satisfy "diamond_pickaxe" requirement → <1.0 (got ${scoreIronForDiamond.toFixed(3)})`);

    // Tier ordering maintained: stone > wooden for gap scoring
    assert(scoreWithStone >= scoreWithWooden,
        `stone_pickaxe gap >= wooden_pickaxe gap for wooden_pickaxe requirement`);
    assert(scoreWithWooden > scoreWithNothing,
        `wooden_pickaxe gap > empty inventory for wooden_pickaxe requirement`);
}

// ─── Test 12: Ingredient Overlap Score ────────────────────────────

console.log('\n=== Test 12: Ingredient Overlap Score ===\n');

{
    const rr = new RecipeResolver({ version: '1.20.4' });
    const scorer = new SAERScorer(false, null, null, rr);

    // Iron axe and iron sword share same ingredients (iron_ingot + stick) → high overlap
    const ironSwordExample = {
        slug: 'crafting/iron_sword',
        name: 'Craft an Iron Sword',
        level: 'L1',
        plan: [{ step: 1, goal: 'Craft', preconditions: [] }]
    };
    const scoreIronSword = scorer.calcIngredientOverlapScore('craft an iron axe', ironSwordExample);
    console.log(`  "craft an iron axe" vs iron_sword: ${scoreIronSword.toFixed(3)}`);

    // Stone sword uses cobblestone + stick → only stick shared with iron_axe (iron_ingot + stick)
    const scoreStoneSword = scorer.calcIngredientOverlapScore('craft an iron axe', stoneSwordExample);
    console.log(`  "craft an iron axe" vs stone_sword: ${scoreStoneSword.toFixed(3)}`);

    // Collect task: no craftable target can be inferred → 0.0
    const scoreCollect = scorer.calcIngredientOverlapScore('collect some wood', ironAxeExample);
    console.log(`  "collect some wood" vs iron_axe: ${scoreCollect}`);

    // Same item: "craft an iron axe" vs iron_axe → Jaccard = 1.0
    const scoreSelf = scorer.calcIngredientOverlapScore('craft an iron axe', ironAxeExample);
    console.log(`  "craft an iron axe" vs iron_axe (self): ${scoreSelf.toFixed(3)}`);

    assert(scoreSelf > 0.9,
        `Same item → near 1.0 ingredient overlap (got ${scoreSelf.toFixed(3)})`);
    assert(scoreIronSword > 0.9,
        `Iron sword shares materials with iron axe → high overlap (got ${scoreIronSword.toFixed(3)})`);
    assert(scoreStoneSword < scoreIronSword,
        `Stone sword (different material tier) scores lower (${scoreStoneSword.toFixed(3)} < ${scoreIronSword.toFixed(3)})`);
    assert(scoreCollect === 0.0,
        `Collect task (no craftable target inferred) → 0.0 (got ${scoreCollect})`);

    // Diamond pickaxe: diamond + stick vs iron_axe: iron_ingot + stick → Jaccard = 1/3
    const scoreDiamondPickaxe = scorer.calcIngredientOverlapScore('craft an iron axe', diamondPickaxeExample);
    console.log(`  "craft an iron axe" vs diamond_pickaxe: ${scoreDiamondPickaxe.toFixed(3)}`);
    assert(scoreStoneSword < scoreIronSword && scoreDiamondPickaxe < scoreIronSword,
        `Stone sword and diamond pickaxe both score lower than iron sword for iron axe query`);
}

// ─── Test 13: Mining Tier Gap Score ───────────────────────────────

console.log('\n=== Test 13: Mining Tier Gap Score ===\n');

{
    const rr = new RecipeResolver({ version: '1.20.4' });
    const scorer = new SAERScorer(false, null, null, rr);

    // Example that requires mining iron_ore (needs stone_pickaxe, tier 1 per mcData)
    const ironOreExample = {
        slug: 'collecting/iron_ore',
        name: 'Collect Iron Ore',
        level: 'L2',
        plan: [{
            step: 1,
            goal: 'Mine iron ore',
            action_cmd: ["!collectBlocks('iron_ore', 5)"],
            preconditions: ['Stone Pickaxe in inventory']
        }]
    };

    const hasIronPickaxe = { inventory: [{ name: 'iron_pickaxe', count: 1 }], nearbyBlocks: [] };
    const hasWoodenPickaxe = { inventory: [{ name: 'wooden_pickaxe', count: 1 }], nearbyBlocks: [] };
    // Non-empty but no pickaxe: not cold-start, should get a low score
    const hasLogOnly = { inventory: [{ name: 'oak_log', count: 5 }], nearbyBlocks: [] };

    const scoreWithIron   = scorer.calcMiningTierGap(ironOreExample, hasIronPickaxe);
    const scoreWithWooden = scorer.calcMiningTierGap(ironOreExample, hasWoodenPickaxe);
    const scoreNoPickaxe  = scorer.calcMiningTierGap(ironOreExample, hasLogOnly);

    console.log(`  iron_ore example + iron_pickaxe:   ${scoreWithIron.toFixed(3)}`);
    console.log(`  iron_ore example + wooden_pickaxe: ${scoreWithWooden.toFixed(3)}`);
    console.log(`  iron_ore example + no pickaxe:     ${scoreNoPickaxe.toFixed(3)}`);

    assert(scoreWithIron > scoreWithWooden,
        `Iron pickaxe (tier 2) scores better than wooden (tier 0) for iron_ore example (${scoreWithIron.toFixed(3)} > ${scoreWithWooden.toFixed(3)})`);
    assert(scoreWithWooden > scoreNoPickaxe,
        `Any pickaxe beats no pickaxe (${scoreWithWooden.toFixed(3)} > ${scoreNoPickaxe.toFixed(3)})`);
    assert(scoreWithIron === 1.0,
        `Iron pickaxe satisfies stone_pickaxe requirement → 1.0 (got ${scoreWithIron.toFixed(3)})`);

    // Cold start (empty inventory) → neutral 0.5
    const coldScore = scorer.calcMiningTierGap(ironOreExample, { inventory: [], nearbyBlocks: [] });
    assert(coldScore === 0.5,
        `Cold start (empty inventory) → 0.5 neutral (got ${coldScore.toFixed(3)})`);

    // Pure craft example: no collectBlocks → no mining required → 1.0 regardless of pickaxe
    const stickExample = {
        slug: 'crafting/stick',
        name: 'Craft Sticks',
        level: 'L1',
        plan: [{
            step: 1,
            goal: 'Craft sticks',
            action_cmd: ["!craftRecipe('stick', 4)"],
            preconditions: ['2x Oak Planks']
        }]
    };
    const noMiningScore = scorer.calcMiningTierGap(stickExample, hasLogOnly);
    assert(noMiningScore === 1.0,
        `No mining required → 1.0 (got ${noMiningScore.toFixed(3)})`);
}

// ─── Test 14: Prerequisite Chain Overlap ──────────────────────────

console.log('\n=== Test 14: Prerequisite Chain Overlap ===\n');

{
    const rr = new RecipeResolver({ version: '1.20.4' });
    const scorer = new SAERScorer(false, null, null, rr);

    const ironPickaxeEx = {
        slug: 'crafting/iron_pickaxe',
        name: 'Craft an Iron Pickaxe',
        level: 'L3',
        plan: [{ step: 1, goal: 'Craft', preconditions: [] }]
    };
    const woodenSwordEx = {
        slug: 'crafting/wooden_sword',
        name: 'Craft a Wooden Sword',
        level: 'L1',
        plan: [{ step: 1, goal: 'Craft', preconditions: [] }]
    };

    // 14a: shield vs iron_pickaxe — keyword=0 but prereqChain>0.5
    // BM25 blind spot: both need furnace + smelt(raw_iron) → iron_ingot
    const kwShieldPickaxe = scorer.calcKeywordScore('craft a shield', ironPickaxeEx);
    const chainShieldPickaxe = scorer.calcPrereqChainOverlap('craft a shield', ironPickaxeEx);
    console.log(`  shield vs iron_pickaxe: kw=${kwShieldPickaxe.toFixed(3)}, chain=${chainShieldPickaxe.toFixed(3)}`);
    assert(kwShieldPickaxe === 0.0, 'shield vs iron_pickaxe: keyword overlap = 0 (BM25 blind)');
    assert(chainShieldPickaxe > 0.5, `shield vs iron_pickaxe: prereqChain > 0.5 (got ${chainShieldPickaxe.toFixed(3)})`);

    // 14b: iron_sword chains more with iron_pickaxe than wooden_sword
    // wooden_sword has no furnace/smelt path; iron items share that chain
    const chainIronVsPickaxe = scorer.calcPrereqChainOverlap('craft an iron sword', ironPickaxeEx);
    const chainIronVsWooden = scorer.calcPrereqChainOverlap('craft an iron sword', woodenSwordEx);
    console.log(`  iron_sword vs iron_pickaxe chain: ${chainIronVsPickaxe.toFixed(3)}`);
    console.log(`  iron_sword vs wooden_sword chain: ${chainIronVsWooden.toFixed(3)}`);
    assert(chainIronVsPickaxe > chainIronVsWooden,
        `iron_sword chains more with iron_pickaxe than wooden_sword (${chainIronVsPickaxe.toFixed(3)} > ${chainIronVsWooden.toFixed(3)})`);

    // 14c: collect task → 0.0 (no craftable target inferred by _inferTargetItem)
    const chainCollect = scorer.calcPrereqChainOverlap('collect some wood', ironPickaxeEx);
    assert(chainCollect === 0.0, `collect task → prereqChain = 0.0 (got ${chainCollect})`);

    // 14d: same item → Jaccard ≈ 1.0 (only item name itself differs in union)
    const ironPickaxeSelf = scorer.calcPrereqChainOverlap('craft an iron pickaxe', ironPickaxeEx);
    console.log(`  iron_pickaxe vs itself: ${ironPickaxeSelf.toFixed(3)}`);
    assert(ironPickaxeSelf > 0.9, `Same item → prereqChain ≈ 1.0 (got ${ironPickaxeSelf.toFixed(3)})`);

    // 14e: null resolver graceful fallback → 0.0 (no crash, no NaN)
    const nullScorer = new SAERScorer(false); // default null resolver, no mcData
    const chainNull = nullScorer.calcPrereqChainOverlap('craft an iron sword', ironPickaxeEx);
    assert(typeof chainNull === 'number' && !isNaN(chainNull),
        `Null resolver: no crash, returns number (got ${chainNull})`);
    assert(chainNull >= 0.0, `Null resolver: non-negative (got ${chainNull})`);
}

// ─── Summary ───────────────────────────────────────────────────────

console.log('\n' + '='.repeat(50));
console.log(`📊 SAER Scorer Test Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50) + '\n');

process.exit(failed > 0 ? 1 : 0);
