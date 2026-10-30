/**
 * RecipeResolver tests — data-driven, using real minecraft-data('1.20.4')
 */

import RecipeResolver, { SMELTING_OUTPUTS } from '../src/models/enhancers/recipe_resolver.js';
import { FUEL_ITEMS } from '../src/models/enhancers/precondition_parser.js';
import minecraftData from 'minecraft-data';

const mcData = minecraftData('1.20.4');
const mockBot = { version: '1.20.4' };

let passed = 0;
let failed = 0;
let errors = [];

function assert(condition, message) {
    if (condition) {
        passed++;
    } else {
        failed++;
        errors.push(message);
        console.log(`  ❌ FAIL: ${message}`);
    }
}

function assertEqual(actual, expected, message) {
    if (actual === expected) {
        passed++;
    } else {
        failed++;
        errors.push(`${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        console.log(`  ❌ FAIL: ${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

// ─── Group 1: smeltOutputFor ────────────────────────────────────
console.log('\n=== Group 1: smeltOutputFor ===');
{
    const rr = new RecipeResolver(mockBot);

    // Data-driven: verify every entry in SMELTING_OUTPUTS
    for (const [input, output] of Object.entries(SMELTING_OUTPUTS)) {
        assertEqual(rr.smeltOutputFor(input), output, `smeltOutputFor('${input}') === '${output}'`);
    }

    // _log suffix pattern: any *_log name → 'charcoal'
    const logVariant = mcData.itemsByName['acacia_log'] ? 'acacia_log' : 'oak_log';
    assertEqual(rr.smeltOutputFor(logVariant), 'charcoal', `_log suffix: ${logVariant} → charcoal`);

    // Future-proof: a log name not in the explicit table
    assertEqual(rr.smeltOutputFor('test_wood_log'), 'charcoal', 'unknown *_log variant → charcoal');

    // Non-smeltable item → null
    assertEqual(rr.smeltOutputFor('dirt'), null, 'dirt → null');
    assertEqual(rr.smeltOutputFor('oak_planks'), null, 'oak_planks → null');
}

// ─── Group 2: smeltInputsFor ────────────────────────────────────
console.log('\n=== Group 2: smeltInputsFor ===');
{
    const rr = new RecipeResolver(mockBot);

    // Derive expected inputs from SMELTING_OUTPUTS
    const inverted = new Map();
    for (const [input, output] of Object.entries(SMELTING_OUTPUTS)) {
        if (!inverted.has(output)) inverted.set(output, new Set());
        inverted.get(output).add(input);
    }

    // Verify a few key outputs
    const ironInputs = rr.smeltInputsFor('iron_ingot');
    assert(ironInputs.has('raw_iron'), 'iron_ingot inputs include raw_iron');
    assert(ironInputs.has('iron_ore'), 'iron_ingot inputs include iron_ore');

    const goldInputs = rr.smeltInputsFor('gold_ingot');
    assert(goldInputs.has('raw_gold'), 'gold_ingot inputs include raw_gold');
    assert(goldInputs.has('gold_ore'), 'gold_ingot inputs include gold_ore');

    // Nonexistent output → empty Set
    const none = rr.smeltInputsFor('nonexistent_xyz');
    assertEqual(none.size, 0, 'nonexistent output → empty Set');
    assert(none instanceof Set, 'return type is Set');
}

// ─── Group 3: craftingProducedBy ─────────────────────────────────
console.log('\n=== Group 3: craftingProducedBy ===');
{
    const rr = new RecipeResolver(mockBot);

    // Find any item in mcData.recipes with at least one recipe
    const firstRecipeKey = Object.keys(mcData.recipes)[0];
    const firstRecipeItem = mcData.items[firstRecipeKey]?.name;
    if (firstRecipeItem) {
        const recipes = rr.craftingProducedBy(firstRecipeItem);
        assert(recipes !== null, `${firstRecipeItem} has crafting recipes`);
        assert(Array.isArray(recipes), 'returns an array');
        assert(recipes.length > 0, 'array is non-empty');
        assert(recipes[0] instanceof Set, 'each recipe is a Set');
    }

    // Stick has multiple recipes (one per plank type)
    const stickRecipes = rr.craftingProducedBy('stick');
    assert(stickRecipes !== null, 'stick has crafting recipes');
    assert(stickRecipes.length >= 10, 'stick has >=10 recipes (one per plank type)');

    // Nonexistent item → null
    assertEqual(rr.craftingProducedBy('nonexistent_xyz_item'), null, 'nonexistent → null');
}

// ─── Group 4: canHarvestWith ─────────────────────────────────────
console.log('\n=== Group 4: canHarvestWith ===');
{
    const rr = new RecipeResolver(mockBot);

    // Data-driven: find a block with harvestTools, verify a valid tool works
    const ironOre = mcData.blocksByName['iron_ore'];
    if (ironOre?.harvestTools) {
        const toolIds = Object.keys(ironOre.harvestTools);
        const validToolName = mcData.items[toolIds[0]]?.name;
        if (validToolName) {
            assert(rr.canHarvestWith(validToolName, 'iron_ore'), `${validToolName} can harvest iron_ore`);
        }
        // wooden_pickaxe should NOT harvest iron_ore
        assert(!rr.canHarvestWith('wooden_pickaxe', 'iron_ore'), 'wooden_pickaxe cannot harvest iron_ore');
    }

    // stone: wooden_pickaxe can harvest
    assert(rr.canHarvestWith('wooden_pickaxe', 'stone'), 'wooden_pickaxe can harvest stone');

    // Block without harvestTools (dirt) → any tool works
    assert(rr.canHarvestWith('wooden_pickaxe', 'dirt'), 'any tool works on dirt');
    assert(rr.canHarvestWith('shears', 'dirt'), 'shears work on dirt');

    // Totally unknown block → also true (no tool required by default)
    assert(rr.canHarvestWith('wooden_pickaxe', 'unknown_block_xyz'), 'unknown block → true');
}

// ─── Group 4b: getRequiredTool ───────────────────────────────────
console.log('\n=== Group 4b: getRequiredTool ===');
{
    const rr = new RecipeResolver(mockBot);

    // stone requires wooden_pickaxe (lowest tier)
    const stoneTool = rr.getRequiredTool('stone');
    assert(stoneTool === 'wooden_pickaxe', `stone → wooden_pickaxe, got: ${stoneTool}`);

    // iron_ore requires stone_pickaxe (lowest tier)
    const ironOreTool = rr.getRequiredTool('iron_ore');
    assert(ironOreTool === 'stone_pickaxe', `iron_ore → stone_pickaxe, got: ${ironOreTool}`);

    // diamond_ore requires iron_pickaxe (lowest tier)
    const diamondOreTool = rr.getRequiredTool('diamond_ore');
    assert(diamondOreTool === 'iron_pickaxe', `diamond_ore → iron_pickaxe, got: ${diamondOreTool}`);

    // dirt requires no tool
    const dirtTool = rr.getRequiredTool('dirt');
    assert(dirtTool === null, `dirt → null (no tool needed), got: ${dirtTool}`);

    // unknown block → null
    const unknownTool = rr.getRequiredTool('unknown_block_xyz');
    assert(unknownTool === null, `unknown → null, got: ${unknownTool}`);

    // obsidian requires diamond_pickaxe
    const obsidianTool = rr.getRequiredTool('obsidian');
    assert(obsidianTool === 'diamond_pickaxe', `obsidian → diamond_pickaxe, got: ${obsidianTool}`);
}
console.log('\n=== Group 5: resolveInventoryAlias ===');
{
    const rr = new RecipeResolver(mockBot);

    // Single log type in inventory → resolve 'log' to that type
    // Use any log name that exists in mcData
    const logNames = Object.keys(mcData.itemsByName).filter(n => n.endsWith('_log'));
    if (logNames.length > 0) {
        const testLog = logNames[0];
        assertEqual(
            rr.resolveInventoryAlias('log', new Map([[testLog, 5]])),
            testLog,
            `'log' resolves to ${testLog} when it's the only log in inventory`
        );

        // Multiple log types: higher count wins
        if (logNames.length >= 2) {
            const logA = logNames[0];
            const logB = logNames[1];
            const result = rr.resolveInventoryAlias('log', new Map([[logA, 2], [logB, 8]]));
            assertEqual(result, logB, `'log' resolves to higher-count ${logB} (8) over ${logA} (2)`);

            const result2 = rr.resolveInventoryAlias('log', new Map([[logA, 10], [logB, 3]]));
            assertEqual(result2, logA, `'log' resolves to higher-count ${logA} (10) over ${logB} (3)`);
        }
    }

    // Empty inventory → return unchanged (or a valid mcData name)
    const emptyResult = rr.resolveInventoryAlias('log', new Map());
    assert(typeof emptyResult === 'string', 'empty inventory returns a string');

    // Exact match in inventory → return as-is
    assertEqual(
        rr.resolveInventoryAlias('oak_planks', new Map([['oak_planks', 5]])),
        'oak_planks',
        'exact match returns unchanged'
    );

    // No bot → no mcData → return unchanged
    const rrNoBot = new RecipeResolver(null);
    assertEqual(rrNoBot.resolveInventoryAlias('log', new Map()), 'log', 'no bot → return unchanged');
}

// ─── Group 6: calcStaticHops ─────────────────────────────────────
console.log('\n=== Group 6: calcStaticHops ===');
{
    const rr = new RecipeResolver(mockBot);

    // Item in inventory → 0
    assertEqual(rr.calcStaticHops('oak_planks', new Map([['oak_planks', 5]])), 0, 'item in inventory → 0');

    // Smelting 1-hop: derive X→Y from SMELTING_OUTPUTS
    const [smeltInput, smeltOutput] = Object.entries(SMELTING_OUTPUTS)[0];
    assertEqual(
        rr.calcStaticHops(smeltOutput, new Map([[smeltInput, 3]])),
        1,
        `${smeltOutput} from ${smeltInput} (1 smelt hop)`
    );

    // Crafting 1-hop: find a simple recipe (1 ingredient type)
    for (const [resultIdStr, recipes] of Object.entries(mcData.recipes)) {
        const resultName = mcData.items[resultIdStr]?.name;
        if (!resultName) continue;
        for (const recipe of recipes) {
            const ingredientIds = new Set();
            if (recipe.ingredients) {
                for (const id of recipe.ingredients) {
                    if (id != null && id > 0) ingredientIds.add(id);
                }
            }
            if (ingredientIds.size === 1) {
                const ingName = mcData.items[ingredientIds.values().next().value]?.name;
                if (ingName) {
                    const hops = rr.calcStaticHops(resultName, new Map([[ingName, 10]]));
                    assertEqual(hops, 1, `${resultName} from ${ingName} (1 craft hop)`);
                }
                break;
            }
        }
        if (passed > 0) break;  // only need one
    }

    // 2-hop chain: oak_log → oak_planks (1) → stick (2)
    assertEqual(
        rr.calcStaticHops('stick', new Map([['oak_log', 5]])),
        2,
        'stick from oak_log = 2 hops (log→planks→stick)'
    );

    // 3-hop chain: oak_log → planks → stick → wooden_pickaxe
    assertEqual(
        rr.calcStaticHops('wooden_pickaxe', new Map([['oak_log', 5]])),
        3,
        'wooden_pickaxe from oak_log = 3 hops'
    );

    // Works with acacia too (no oak bias)
    assertEqual(
        rr.calcStaticHops('wooden_pickaxe', new Map([['acacia_log', 5]])),
        3,
        'wooden_pickaxe from acacia_log = 3 hops'
    );

    // No recipe, not in inventory → Infinity
    assertEqual(
        rr.calcStaticHops('bedrock', new Map()),
        Infinity,
        'bedrock (unobtainable) → Infinity'
    );

    // Cycle safety: verify it returns without hanging
    const start = Date.now();
    const cycleResult = rr.calcStaticHops('iron_ingot', new Map());
    const elapsed = Date.now() - start;
    assert(elapsed < 2000, `calcStaticHops completes in <2s (took ${elapsed}ms)`);
    assert(cycleResult === Infinity || typeof cycleResult === 'number', 'cycle test returns a number');
}

// ─── Group 7: isFuel ─────────────────────────────────────────────
console.log('\n=== Group 7: isFuel ===');
{
    const rr = new RecipeResolver(mockBot);

    // Data-driven: verify all FUEL_ITEMS are recognized
    let fuelChecked = 0;
    for (const fuelItem of FUEL_ITEMS) {
        assert(rr.isFuel(fuelItem), `${fuelItem} is fuel`);
        fuelChecked++;
        if (fuelChecked >= 5) break;  // spot-check 5 items
    }

    // Non-fuel items
    assert(!rr.isFuel('diamond'), 'diamond is not fuel');
    assert(!rr.isFuel('iron_ingot'), 'iron_ingot is not fuel');
    assert(!rr.isFuel('stone'), 'stone is not fuel');
    assert(!rr.isFuel('dirt'), 'dirt is not fuel');
}

// ─── craftingRecipesFor ──────────────────────────────────────────
console.log('\n=== Test Group: craftingRecipesFor ===');
{
    const rr = new RecipeResolver(mockBot);

    // crafting_table has a recipe: 4 planks in 2x2 grid
    const ctRecipes = rr.craftingRecipesFor('crafting_table');
    assert(ctRecipes !== null, 'crafting_table has recipes');
    assert(ctRecipes.length > 0, 'crafting_table has at least one recipe variant');
    const oakVariant = ctRecipes.find(r => r.ingredients.some(i => i.name === 'oak_planks'));
    assert(oakVariant, 'crafting_table has oak_planks variant');
    assert(oakVariant.ingredients.length === 1, 'crafting_table recipe has 1 ingredient type');
    assert(oakVariant.ingredients[0].count === 4, 'crafting_table needs 4 planks');
    assert(!oakVariant.requiresTable, 'crafting_table does not require crafting table');

    // wooden_pickaxe: 3 planks + 2 sticks, requires table
    const wpRecipes = rr.craftingRecipesFor('wooden_pickaxe');
    assert(wpRecipes !== null, 'wooden_pickaxe has recipes');
    const wpRecipe = wpRecipes.find(r => r.ingredients.some(i => i.name === 'oak_planks'));
    assert(wpRecipe, 'wooden_pickaxe has oak_planks variant');
    assert(wpRecipe.requiresTable, 'wooden_pickaxe requires crafting table');
    const plankIng = wpRecipe.ingredients.find(i => i.name === 'oak_planks');
    const stickIng = wpRecipe.ingredients.find(i => i.name === 'stick');
    assert(plankIng?.count === 3, 'wooden_pickaxe needs 3 planks');
    assert(stickIng?.count === 2, 'wooden_pickaxe needs 2 sticks');

    // stick: 2 planks, no table
    const stickRecipes = rr.craftingRecipesFor('stick');
    assert(stickRecipes !== null, 'stick has recipes');
    assert(stickRecipes[0].outputCount === 4, 'stick recipe produces 4 per craft');
    assert(!stickRecipes[0].requiresTable, 'stick does not require crafting table');

    // Non-craftable item returns null
    assert(rr.craftingRecipesFor('dirt') === null, 'dirt has no crafting recipe');
    assert(rr.craftingRecipesFor('acacia_log') === null, 'acacia_log has no crafting recipe');

    // No mcData → null
    const rrNull = new RecipeResolver(null);
    assert(rrNull.craftingRecipesFor('stick') === null, 'null bot returns null');
}

// ─── resolveDependencyChain ──────────────────────────────────────
console.log('\n=== Test Group: resolveDependencyChain ===');
{
    const rr = new RecipeResolver(mockBot);

    // 1. wooden_pickaxe from empty inventory → includes crafting_table, table before pickaxe
    const chain1 = rr.resolveDependencyChain('wooden_pickaxe', new Map());
    const names1 = chain1.map(s => s.acquire);
    assert(names1.includes('crafting_table'), 'wooden_pickaxe chain includes crafting_table');
    assert(names1.indexOf('crafting_table') < names1.indexOf('wooden_pickaxe'),
        'crafting_table before wooden_pickaxe');
    assert(names1.includes('wooden_pickaxe'), 'chain ends with wooden_pickaxe');

    // 2. Already have crafting_table + materials → no table step
    const chain2 = rr.resolveDependencyChain('wooden_pickaxe',
        new Map([['crafting_table', 1], ['oak_planks', 10], ['stick', 10]]));
    const tableSteps2 = chain2.filter(s => s.acquire === 'crafting_table');
    assert(tableSteps2.length === 0, 'no crafting_table step when already have one');
    assert(chain2.length === 1, 'only wooden_pickaxe step when have all materials');
    assert(chain2[0].via === 'craft', 'via craft');

    // 3. iron_ingot from empty → includes furnace, furnace before iron_ingot
    const chain3 = rr.resolveDependencyChain('iron_ingot', new Map());
    const names3 = chain3.map(s => s.acquire);
    assert(names3.includes('furnace'), 'iron_ingot chain includes furnace');
    assert(names3.indexOf('furnace') < names3.indexOf('iron_ingot'), 'furnace before iron_ingot');
    const smeltStep = chain3.find(s => s.acquire === 'iron_ingot');
    assert(smeltStep?.via === 'smelt', 'iron_ingot via smelt');
    assert(smeltStep?.station === 'furnace', 'iron_ingot station is furnace');

    // 4. Already have item → empty chain
    const chain4 = rr.resolveDependencyChain('stick', new Map([['stick', 10]]));
    assert(chain4.length === 0, 'already have item → empty chain');

    // 5. Fungible item (_log) → single collect_freeform step (any log variant)
    const chain5 = rr.resolveDependencyChain('acacia_log', new Map());
    assert(chain5.length === 1, 'fungible _log item → 1 step');
    assert(chain5[0].via === 'collect_freeform', 'fungible _log item → via collect_freeform');
    assert(chain5[0].acquire === 'acacia_log', 'acquire matches target');

    // 6. No infinite loop
    const chain6 = rr.resolveDependencyChain('stone_pickaxe', new Map());
    assert(chain6.length > 0, 'stone_pickaxe has a chain');
    assert(chain6.length < 20, `no infinite loop (length=${chain6.length})`);

    // 7. Smelt with raw_iron in inventory
    const chain7 = rr.resolveDependencyChain('iron_ingot', new Map([['raw_iron', 5]]));
    const rawStep = chain7.find(s => s.acquire === 'raw_iron');
    assert(!rawStep, 'no raw_iron step when already have some');
    const smelt7 = chain7.find(s => s.acquire === 'iron_ingot');
    assert(smelt7?.via === 'smelt', 'iron_ingot via smelt with raw_iron available');

    // 8. Plank count sufficient for wooden_pickaxe
    const chain8 = rr.resolveDependencyChain('wooden_pickaxe', new Map());
    const plankStep = chain8.find(s => s.acquire.endsWith('_planks'));
    assert(plankStep && plankStep.count >= 3, `planks count >= 3 (got ${plankStep?.count})`);

    // 9. station field correct
    for (const s of chain1) {
        if (s.via === 'smelt') {
            assert(s.station === 'furnace', `smelt step has station=furnace (got ${s.station})`);
        }
    }

    // 10. stone_pickaxe includes cobblestone collect
    const names6 = chain6.map(s => s.acquire);
    assert(names6.includes('cobblestone') || names6.some(n => n.includes('cobblestone')),
        'stone_pickaxe chain includes cobblestone');

    // 11. neededCount 参数:已有 cobblestone:2 但需要 8 → 补 6(回归 stone_button furnace bug)
    const chain11 = rr.resolveDependencyChain('cobblestone', new Map([['cobblestone', 2]]), 8);
    const cobbleStep = chain11.find(s => s.acquire === 'cobblestone');
    assert(cobbleStep !== undefined, 'neededCount=8 with 2 in stock → emits cobblestone step');
    assert(cobbleStep.count === 6, `cobblestone step count = 8-2 = 6 (got ${cobbleStep?.count})`);

    // 12. neededCount 默认值=1,向后兼容:已有 2,默认需要 1 → 空 chain(旧行为不变)
    const chain12 = rr.resolveDependencyChain('cobblestone', new Map([['cobblestone', 2]]));
    assert(chain12.length === 0, 'default neededCount=1 with 2 in stock → empty chain (backward compat)');

    // 13. neededCount 充足时不产生 step
    const chain13 = rr.resolveDependencyChain('cobblestone', new Map([['cobblestone', 10]]), 8);
    const cobble13 = chain13.find(s => s.acquire === 'cobblestone');
    assert(!cobble13, 'neededCount=8 with 10 in stock → no cobblestone step');
}

// ─── Group 6b: calcStaticHops fungible awareness ─────────────────
console.log('\n=== Group 6b: calcStaticHops fungible awareness ===');
{
    const rr = new RecipeResolver(mockBot);

    // acacia_planks satisfies oak_planks need → 0 hops
    assertEqual(
        rr.calcStaticHops('oak_planks', new Map([['acacia_planks', 5]])),
        0,
        'acacia_planks in inventory → oak_planks = 0 hops'
    );

    // birch_log satisfies oak_log need → 0 hops
    assertEqual(
        rr.calcStaticHops('oak_log', new Map([['birch_log', 3]])),
        0,
        'birch_log in inventory → oak_log = 0 hops'
    );

    // wooden_pickaxe with acacia_planks → finite hops (not Infinity)
    const pickaxeHops = rr.calcStaticHops('wooden_pickaxe', new Map([['acacia_planks', 16], ['crafting_table', 1]]));
    assert(pickaxeHops !== Infinity, `wooden_pickaxe with acacia_planks → finite hops (got ${pickaxeHops})`);
    assert(pickaxeHops <= 3, `wooden_pickaxe with acacia_planks → hops <= 3 (got ${pickaxeHops})`);

    // No fungible variant → still Infinity from empty inventory
    assertEqual(
        rr.calcStaticHops('oak_planks', new Map()),
        Infinity,
        'no planks in inventory → Infinity'
    );
}

// ─── Group 10: collect_freeform for fungible items ───────────────
console.log('\n=== Group 10: collect_freeform (fungible _log/_planks) ===');
{
    const rr = new RecipeResolver(mockBot);

    // 1. Any _log → collect_freeform (not collect)
    const chainLog = rr.resolveDependencyChain('oak_log', new Map());
    assert(chainLog.length === 1, 'oak_log from empty → 1 step');
    assert(chainLog[0].via === 'collect_freeform', 'oak_log → via collect_freeform');
    assert(chainLog[0].acquire === 'oak_log', 'oak_log → acquire is oak_log');

    // 2. Any _planks → collect_freeform for log + craft for planks (planks have recipes)
    const chainPlanks = rr.resolveDependencyChain('oak_planks', new Map());
    assert(chainPlanks.length === 2, `oak_planks from empty → 2 steps (got ${chainPlanks.length})`);
    assert(chainPlanks[0].via === 'collect_freeform', 'oak_planks → first step collect_freeform (for log)');
    assert(chainPlanks[1].via === 'craft', 'oak_planks → second step craft');

    // 3. Having a different _log variant satisfies the log requirement (inventory check)
    const chainLogAlt = rr.resolveDependencyChain('oak_log', new Map([['acacia_log', 5]]));
    assert(chainLogAlt.length === 0, 'acacia_log in inventory satisfies oak_log need');

    // 4. Having a different _planks variant satisfies the planks requirement
    const chainPlanksAlt = rr.resolveDependencyChain('oak_planks', new Map([['acacia_planks', 5]]));
    assert(chainPlanksAlt.length === 0, 'acacia_planks in inventory satisfies oak_planks need');

    // 5. Exact match also satisfies
    const chainExact = rr.resolveDependencyChain('oak_log', new Map([['oak_log', 3]]));
    assert(chainExact.length === 0, 'exact oak_log in inventory satisfies oak_log need');

    // 6. wooden_pickaxe chain uses craft for planks (planks have crafting recipes)
    const chainPick = rr.resolveDependencyChain('wooden_pickaxe', new Map());
    const plankStep = chainPick.find(s => s.acquire.endsWith('_planks'));
    assert(plankStep?.via === 'craft',
        `wooden_pickaxe chain planks step via=craft (got ${plankStep?.via})`);

    // 7. Having acacia_planks satisfies stick crafting dependency
    const chainStick = rr.resolveDependencyChain('stick', new Map([['acacia_planks', 4]]));
    const planksStepStick = chainStick.find(s => s.acquire.endsWith('_planks'));
    assert(!planksStepStick, 'acacia_planks in inventory satisfies stick planks dependency');

    // 8. Partial quantity: need planks for stick crafting, have only 1 acacia_plank (need 2)
    // → still emits collect_freeform for the remainder
    const chainPartial = rr.resolveDependencyChain('stick', new Map([['acacia_planks', 1]]));
    const partialFreeform = chainPartial.find(s => s.via === 'collect_freeform');
    assert(partialFreeform !== undefined, 'partial fungible stock still emits collect_freeform for remainder');
    assert(partialFreeform?.count > 0, 'partial freeform step has positive count');
}

// ─── Results ─────────────────────────────────────────────────────
console.log('\n==================================================');
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('==================================================');

if (errors.length > 0) {
    console.log('\nFailed tests:');
    for (const e of errors) console.log(`  - ${e}`);
}

process.exit(failed > 0 ? 1 : 0);
