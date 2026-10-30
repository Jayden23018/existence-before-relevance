/**
 * ImplicitEnhancer deterministic-recovery unit tests.
 *
 * Verifies the live-eval path (deterministicRecovery=true):
 *   - _routeRecovery routes to _deterministicRecovery (no LLM)
 *   - MISSING_TOOL: tool in inventory → equip-retry (no giveUp); tool absent → giveUp
 *   - MISSING_ITEM: fungible variant → variant-retry; real shortfall → giveUp
 *   - SEMANTIC: target gained → success; nothing gained → giveUp
 *   - ZERO model.sendRequest / judgeAndPlan / executeFreeformStep calls in deterministic mode
 *
 * Uses Object.create to bypass the heavy constructor (which wires file-system deps).
 * Run: node tests/implicit_enhancer_deterministic.test.js
 */

import { TOOL_TIER_ORDER } from '../src/models/enhancers/recipe_resolver.js';

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

// ── Minimal enhancer stub: only the methods _deterministicRecovery/_routeRecovery touch ──
// _deterministicRecovery lives on the class prototype, so Object.create(prototype)
// gives us the real method bound to a stub `this` we control.
import { ImplicitEnhancer } from '../src/models/enhancers/implicit_enhancer_v2.js';

function makeStub({ inventory = [], requiredTool = null, target = null, fungible = null, variant = null, snapshotPre = null, snapshotPost = null } = {}) {
    let llmCalls = 0;
    let freeformCalls = 0;
    let judgeCalls = 0;
    let equipCalls = [];

    const stub = Object.create(ImplicitEnhancer.prototype);
    stub.deterministicRecovery = true;
    stub.agent = { bot: { inventory: { items: () => inventory.map(i => ({ name: i.name, count: i.count, type: i.name })) } } };
    stub.agent.bot.equip = (item, slot) => { equipCalls.push({ name: item?.name, slot }); };

    stub.recipeResolver = {
        bot: stub.agent.bot,
        getRequiredTool: () => requiredTool
    };
    stub.getAgentState = () => ({ inventory, nearbyBlocks: [] });
    stub._findGainedFungible = () => fungible;
    stub._resolveCraftVariant = (cmd) => variant || cmd;
    stub._extractTargetItem = () => target;
    stub._snapshotInventory = () => null;
    stub.logDebug = () => {};

    // LLM-bearing methods that MUST NOT be reached in deterministic mode.
    stub.model = { sendRequest: async () => { llmCalls++; return ''; } };
    stub.judgeAndPlan = async () => { judgeCalls++; return { success: false, reason: 'should not be called', subtask: null }; };
    stub.executeFreeformStep = async () => { freeformCalls++; return { success: false, reason: '', commands: [], responses: [] }; };

    return { stub, counts: () => ({ llmCalls, freeformCalls, judgeCalls }), equipCalls };
}

const execResult = (pre, post) => ({ responses: [], preSnapshot: pre, postSnapshot: post });

console.log('\n=== _deterministicRecovery ===\n');

// 1. TRANSIENT → retry, no giveUp, no LLM
{
    const { stub, counts } = makeStub();
    const r = stub._deterministicRecovery({ type: 'TRANSIENT', detail: {} }, { goal: 'g' }, execResult());
    assert(r.success === false && !r.giveUp, 'TRANSIENT → retry (no giveUp)');
    assert(counts().llmCalls === 0, 'TRANSIENT: zero LLM calls');
}

// 2. MISSING_TOOL, tool NOT in inventory → plan-gap giveUp, no LLM
{
    const { stub, counts } = makeStub({ requiredTool: 'stone_pickaxe', inventory: [] });
    const r = stub._deterministicRecovery({ type: 'MISSING_TOOL', detail: { blockName: 'iron_ore' } }, { goal: 'g' }, execResult());
    assert(r.success === false && r.giveUp === true, 'MISSING_TOOL absent → giveUp (plan-gap)');
    assert(/missing tool stone_pickaxe/.test(r.reason), 'reason names the tool');
    assert(counts().llmCalls === 0 && counts().freeformCalls === 0, 'MISSING_TOOL absent: zero LLM/freeform');
}

// 3. MISSING_TOOL, tool IS in inventory (equip/sync race) → equip + retry, NO giveUp
{
    const { stub, counts, equipCalls } = makeStub({
        requiredTool: 'stone_pickaxe',
        inventory: [{ name: 'stone_pickaxe', count: 1 }]
    });
    const r = stub._deterministicRecovery({ type: 'MISSING_TOOL', detail: { blockName: 'iron_ore' } }, { goal: 'g' }, execResult());
    assert(r.success === false && !r.giveUp, 'MISSING_TOOL present → retry (no giveUp)');
    assert(equipCalls.length === 1 && equipCalls[0].name === 'stone_pickaxe', 'MISSING_TOOL present → equipped the tool');
    assert(counts().llmCalls === 0, 'MISSING_TOOL present: zero LLM calls');
}

// 3b. MISSING_TOOL, higher-tier tool in inventory (iron_pickaxe satisfies stone_pickaxe need)
{
    const { stub } = makeStub({
        requiredTool: 'stone_pickaxe',
        inventory: [{ name: 'iron_pickaxe', count: 1 }]
    });
    const r = stub._deterministicRecovery({ type: 'MISSING_TOOL', detail: { blockName: 'iron_ore' } }, { goal: 'g' }, execResult());
    assert(r.success === false && !r.giveUp, 'iron_pickaxe satisfies stone_pickaxe need → retry');
}

// 4. MISSING_ITEM, real shortfall → giveUp, no LLM, no subtask
{
    const { stub, counts } = makeStub({ inventory: [{ name: 'cobblestone', count: 1 }] });
    const r = stub._deterministicRecovery(
        { type: 'MISSING_ITEM', detail: { itemName: 'furnace' } },
        { goal: 'Build furnace', action_cmd: ['!craftRecipe("furnace", 1)'] },
        execResult()
    );
    assert(r.success === false && r.giveUp === true, 'MISSING_ITEM real shortfall → giveUp');
    assert(r.subtask === null, 'MISSING_ITEM: no subtask injected');
    assert(counts().llmCalls === 0, 'MISSING_ITEM: zero LLM calls');
}

// 5. MISSING_ITEM, fungible variant resolves → variant-retry (no giveUp)
{
    const { stub, counts } = makeStub({
        variant: '!craftRecipe("birch_planks", 4)'
    });
    const step = { goal: 'Craft planks', action_cmd: ['!craftRecipe("oak_planks", 4)'] };
    const orig = step.action_cmd[0];
    const r = stub._deterministicRecovery({ type: 'MISSING_ITEM', detail: { itemName: 'oak_planks' } }, step, execResult());
    assert(r.success === false && !r.giveUp, 'MISSING_ITEM variant → retry (no giveUp)');
    assert(step.action_cmd[0] === '!craftRecipe("birch_planks", 4)', 'variant rewritten into step command');
    assert(step.action_cmd[0] !== orig, 'step command changed');
    assert(counts().llmCalls === 0, 'MISSING_ITEM variant: zero LLM calls');
}

// 6. SEMANTIC, fungible gain → success
{
    const { stub, counts } = makeStub({ fungible: { wanted: 'oak_log', gained: 'acacia_log' } });
    const r = stub._deterministicRecovery({ type: 'SEMANTIC', detail: {} }, { goal: 'Collect logs' }, execResult());
    assert(r.success === true, 'SEMANTIC fungible gain → success');
    assert(counts().judgeCalls === 0, 'SEMANTIC: no LLM judge');
}

// 7. SEMANTIC, target gained via snapshot delta → success
{
    const pre = new Map([['iron_ingot', 0]]);
    const post = new Map([['iron_ingot', 3]]);
    const { stub } = makeStub({ target: 'iron_ingot', snapshotPre: pre, snapshotPost: post });
    // override _snapshotInventory isn't used here; inject directly into execResult
    const r = stub._deterministicRecovery({ type: 'SEMANTIC', detail: {} }, { goal: 'Smelt iron' }, execResult(pre, post));
    assert(r.success === true, 'SEMANTIC target delta>0 → success');
}

// 8. SEMANTIC, nothing gained → giveUp (no LLM judge)
{
    const pre = new Map([['iron_ingot', 0]]);
    const post = new Map([['iron_ingot', 0]]);
    const { stub, counts } = makeStub({ target: 'iron_ingot' });
    const r = stub._deterministicRecovery({ type: 'SEMANTIC', detail: {} }, { goal: 'Smelt iron' }, execResult(pre, post));
    assert(r.success === false && r.giveUp === true, 'SEMANTIC nothing gained → giveUp');
    assert(counts().judgeCalls === 0, 'SEMANTIC nothing gained: no LLM judge');
}

// 8b. SEMANTIC collect "stone" but mined cobblestone (peer) → SUCCESS (regression:
//     earlier the goal text "craft stone pickaxe" made target=stone_pickaxe → false fail)
{
    const pre = new Map([['cobblestone', 0]]);
    const post = new Map([['cobblestone', 3]]);
    const { stub } = makeStub({});
    const r = stub._deterministicRecovery(
        { type: 'SEMANTIC', detail: {} },
        { goal: 'Mine stone to craft stone pickaxe', action_cmd: ['!collectBlocks("stone", 3)'] },
        execResult(pre, post)
    );
    assert(r.success === true, 'collect "stone" mined cobblestone (peer) → success');
}

// 8c. SEMANTIC collect "stone", asked-as-name cobblestone gained → success
{
    const pre = new Map([['cobblestone', 0]]);
    const post = new Map([['cobblestone', 3]]);
    const { stub } = makeStub({});
    const r = stub._deterministicRecovery(
        { type: 'SEMANTIC', detail: {} },
        { goal: 'Collect cobblestone', action_cmd: ['!collectBlocks("cobblestone", 3)'] },
        execResult(pre, post)
    );
    assert(r.success === true, 'collect "cobblestone" gained cobblestone → success');
}

// 8d. SEMANTIC craft furnace, furnace gained → success (command target path)
{
    const pre = new Map([['furnace', 0]]);
    const post = new Map([['furnace', 1]]);
    const { stub } = makeStub({});
    const r = stub._deterministicRecovery(
        { type: 'SEMANTIC', detail: {} },
        { goal: 'Build a furnace', action_cmd: ['!craftRecipe("furnace", 1)'] },
        execResult(pre, post)
    );
    assert(r.success === true, 'craft furnace gained → success (cmd target)');
}

// 8e. SEMANTIC collect iron_ore but mined raw_iron (ore drop peer) → SUCCESS
//     (regression: 1.20.4 ore→raw_ore drop was judged "no target gained")
{
    const pre = new Map([['raw_iron', 0]]);
    const post = new Map([['raw_iron', 7]]);
    const { stub } = makeStub({});
    const r = stub._deterministicRecovery(
        { type: 'SEMANTIC', detail: {} },
        { goal: 'Collect iron ore', action_cmd: ['!collectBlocks("iron_ore", 7)'] },
        execResult(pre, post)
    );
    assert(r.success === true, 'collect iron_ore mined raw_iron (peer) → success');
}

// 8f. SEMANTIC collect diamond_ore but mined diamond → success
{
    const pre = new Map([['diamond', 0]]);
    const post = new Map([['diamond', 3]]);
    const { stub } = makeStub({});
    const r = stub._deterministicRecovery(
        { type: 'SEMANTIC', detail: {} },
        { goal: 'Mine diamonds', action_cmd: ['!collectBlocks("diamond_ore", 3)'] },
        execResult(pre, post)
    );
    assert(r.success === true, 'collect diamond_ore mined diamond (peer) → success');
}

// 8g. SEMANTIC smelt raw_iron → iron_ingot produced (input consumed, output gained)
//     (regression: smeltItem target=raw_iron is the INPUT; checking its delta sees a
//      decrease and falsely judged "no target gained", blocking iron_helmet at smelt)
{
    // raw_iron consumed (5→0), iron_ingot produced (0→5)
    const pre = new Map([['raw_iron', 5], ['iron_ingot', 0]]);
    const post = new Map([['raw_iron', 0], ['iron_ingot', 5]]);
    const { stub } = makeStub({});
    const r = stub._deterministicRecovery(
        { type: 'SEMANTIC', detail: {} },
        { goal: 'Smelt raw iron into ingots', action_cmd: ['!smeltItem("raw_iron", 5)'] },
        execResult(pre, post)
    );
    assert(r.success === true, 'smelt raw_iron produced iron_ingot → success');
}

// 8h. SEMANTIC smelt cobblestone → stone produced (stone_bricks chain)
{
    const pre = new Map([['cobblestone', 4], ['stone', 0]]);
    const post = new Map([['cobblestone', 0], ['stone', 4]]);
    const { stub } = makeStub({});
    const r = stub._deterministicRecovery(
        { type: 'SEMANTIC', detail: {} },
        { goal: 'Smelt cobblestone into stone', action_cmd: ['!smeltItem("cobblestone", 4)'] },
        execResult(pre, post)
    );
    assert(r.success === true, 'smelt cobblestone produced stone → success');
}

// 8i. SEMANTIC craftRecipe furnace but item not in inventory (mineflayer #3906 transient)
//     → should NOT giveUp, allowing run() MAX_STEP_RETRIES to retry
{
    const pre = new Map([['furnace', 0]]);
    const post = new Map([['furnace', 0]]);  // item not delivered (window lag)
    const { stub } = makeStub({});
    const r = stub._deterministicRecovery(
        { type: 'SEMANTIC', detail: {} },
        { goal: 'Craft a furnace', action_cmd: ['!craftRecipe("furnace", 1)'] },
        execResult(pre, post)
    );
    assert(r.success === false, 'craftRecipe no item: success=false');
    assert(!r.giveUp, 'craftRecipe no item: no giveUp (transient, allow retry)');
}

// 8j. SEMANTIC smeltItem but output not gained (rare timing lag)
//     → should NOT giveUp, allowing run() to retry
{
    const pre = new Map([['raw_iron', 5], ['iron_ingot', 0]]);
    const post = new Map([['raw_iron', 5], ['iron_ingot', 0]]);  // nothing changed
    const { stub } = makeStub({});
    const r = stub._deterministicRecovery(
        { type: 'SEMANTIC', detail: {} },
        { goal: 'Smelt raw iron', action_cmd: ['!smeltItem("raw_iron", 5)'] },
        execResult(pre, post)
    );
    assert(r.success === false, 'smeltItem no output: success=false');
    assert(!r.giveUp, 'smeltItem no output: no giveUp (transient, allow retry)');
}

// 8k. SEMANTIC collectBlocks but block not found → giveUp (terminal, not transient)
{
    const pre = new Map([['gold_ore', 0]]);
    const post = new Map([['gold_ore', 0]]);
    const { stub } = makeStub({});
    const r = stub._deterministicRecovery(
        { type: 'SEMANTIC', detail: {} },
        { goal: 'Mine gold ore', action_cmd: ['!collectBlocks("gold_ore", 4)'] },
        execResult(pre, post)
    );
    assert(r.success === false, 'collectBlocks no gain: success=false');
    assert(r.giveUp === true, 'collectBlocks no gain: giveUp=true (terminal plan gap)');
}

console.log('\n=== _routeRecovery routes by flag ===\n');

// 9. flag=true → _routeRecovery uses _deterministicRecovery (no LLM)
{
    const { stub, counts } = makeStub({ requiredTool: 'stone_pickaxe', inventory: [] });
    const r = await stub._routeRecovery({ type: 'MISSING_TOOL', detail: { blockName: 'iron_ore' } }, { goal: 'g' }, execResult());
    assert(r.giveUp === true, 'flag=true: _routeRecovery → deterministic giveUp');
    assert(counts().llmCalls === 0, 'flag=true: zero LLM via _routeRecovery');
}

// 10. flag=false → _routeRecovery does NOT route to _deterministicRecovery (reaches freeform/judge)
{
    const { stub, counts } = makeStub({ requiredTool: 'stone_pickaxe', inventory: [] });
    stub.deterministicRecovery = false;
    // MISSING_TOOL ≤2 hops in legacy path calls executeFreeformStep (LLM). Our stub counts it.
    // calcStaticHops needs recipeResolver — add a minimal stub returning 1 hop.
    stub.recipeResolver.calcStaticHops = () => 1;
    stub.recipeResolver.resolveDependencyChain = () => [];  // empty → legacy falls back to LLM judge
    await stub._routeRecovery({ type: 'MISSING_TOOL', detail: { blockName: 'iron_ore' } }, { goal: 'g' }, execResult());
    assert(counts().freeformCalls > 0 || counts().judgeCalls > 0, 'flag=false: legacy path reaches LLM (freeform or judge, preserved)');
}

console.log('\n=== _splitBundledCraftSteps (bundled-step false-success fix) ===\n');

function makeSplitStub() {
    const stub = Object.create(ImplicitEnhancer.prototype);
    stub.logDebug = () => {};
    return stub;
}

// S1. Bundled step with 4 craftRecipe → one craft/collect per sub-step
{
    const stub = makeSplitStub();
    const plan = { target: 'wooden_pickaxe', steps: [{
        step: 1,
        goal: 'Collect logs and craft basic tools',
        command: '!collectBlocks("oak_log", 3)',
        action_cmd: [
            '!collectBlocks("oak_log", 3)',
            '!craftRecipe("oak_planks", 12)',
            '!craftRecipe("crafting_table", 1)',
            '!craftRecipe("stick", 4)',
            '!craftRecipe("wooden_pickaxe", 1)'
        ],
        preconditions: [{ type: 'access', name: 'trees' }],
        produces: { type: 'item', name: 'wooden_pickaxe', count: 1 }
    }] };
    const out = stub._splitBundledCraftSteps(plan);
    assert(out.steps.length === 5, 'bundled 4-craft step → 5 sub-steps (1 collect + 4 craft)');
    assert(out.steps.every(s => s.action_cmd.length === 1), 'each sub-step has exactly 1 command');
    assert(out.steps.map(s => s.step).join(',') === '1,2,3,4,5', 'sub-steps renumbered sequentially');
}

// S2. The previously-silent LAST craft becomes its own verify point (the actual bug fix)
{
    const stub = makeSplitStub();
    const plan = { steps: [{
        step: 1, goal: 'Collect logs and craft basic tools',
        action_cmd: ['!collectBlocks("oak_log", 3)', '!craftRecipe("oak_planks", 12)', '!craftRecipe("wooden_pickaxe", 1)'],
        produces: null
    }] };
    const out = stub._splitBundledCraftSteps(plan);
    const last = out.steps[out.steps.length - 1];
    assert(last.command === '!craftRecipe("wooden_pickaxe", 1)', 'last sub-step command = the previously-masked wooden_pickaxe craft');
    assert(last.produces && last.produces.name === 'wooden_pickaxe', 'last sub-step produces wooden_pickaxe (own verify target)');
}

// S3. Single-craft step → unchanged (no behavior change for the working path)
{
    const stub = makeSplitStub();
    const plan = { steps: [{ step: 1, goal: 'Craft a furnace', command: '!craftRecipe("furnace", 1)', action_cmd: ['!craftRecipe("furnace", 1)'], produces: { type: 'item', name: 'furnace', count: 1 } }] };
    const out = stub._splitBundledCraftSteps(plan);
    assert(out.steps.length === 1, 'single-craft step → 1 step (unchanged)');
    assert(out.steps[0].action_cmd[0] === '!craftRecipe("furnace", 1)', 'single-craft command preserved');
}

// S4. Pure collect step (0 craft) → unchanged
{
    const stub = makeSplitStub();
    const out = stub._splitBundledCraftSteps({ steps: [{ step: 1, goal: 'Collect cobblestone', action_cmd: ['!collectBlocks("cobblestone", 8)'], produces: { type: 'item', name: 'cobblestone', count: 8 } }] });
    assert(out.steps.length === 1, 'pure collect step → 1 step (unchanged)');
}

// S5. freeformGoal step → never split
{
    const stub = makeSplitStub();
    const out = stub._splitBundledCraftSteps({ steps: [{ step: 1, goal: 'Collect any log', freeformGoal: 'collect 3 logs of any type', action_cmd: [] }] });
    assert(out.steps.length === 1 && out.steps[0].freeformGoal === 'collect 3 logs of any type', 'freeformGoal step passthrough');
}

// S6. smelt+craft bundle → smelt sub-step produces OUTPUT; preconditions only on first
{
    const stub = makeSplitStub();
    const plan = { steps: [{
        step: 1, goal: 'Smelt iron and craft bucket',
        action_cmd: ['!smeltItem("raw_iron", 3)', '!craftRecipe("bucket", 1)'],
        preconditions: [{ type: 'item', name: 'raw_iron', count: 3 }],
        produces: null
    }] };
    const out = stub._splitBundledCraftSteps(plan);
    assert(out.steps.length === 2, 'smelt+craft bundle → 2 sub-steps');
    assert(out.steps[0].produces.name === 'iron_ingot', 'smelt sub-step produces iron_ingot (output, not raw_iron input)');
    assert(out.steps[0].preconditions.length === 1, 'first sub-step keeps original preconditions');
    assert(out.steps[1].preconditions.length === 0, 'later sub-step has empty preconditions');
}

// S7. Mixed plan (single + bundle + single) renumbered across the whole plan
{
    const stub = makeSplitStub();
    const plan = { steps: [
        { step: 1, goal: 'gather', action_cmd: ['!collectBlocks("oak_log", 3)'], produces: { type: 'item', name: 'oak_log', count: 3 } },
        { step: 2, goal: 'craft tools', action_cmd: ['!craftRecipe("oak_planks", 8)', '!craftRecipe("stick", 4)', '!craftRecipe("wooden_pickaxe", 1)'], produces: null },
        { step: 3, goal: 'mine', action_cmd: ['!collectBlocks("stone", 3)'], produces: { type: 'item', name: 'stone', count: 3 } }
    ] };
    const out = stub._splitBundledCraftSteps(plan);
    assert(out.steps.length === 5, 'plan 1 + 3-bundle + 1 → 5 steps');
    assert(out.steps.map(s => s.step).join(',') === '1,2,3,4,5', 'whole plan renumbered sequentially');
}

// S8. collect+craft (exactly 1 of each) → now split into 2 sub-steps (was passthrough before)
{
    const stub = makeSplitStub();
    const plan = { steps: [{
        step: 1, goal: 'Collect cobblestone and craft stone pickaxe',
        action_cmd: ['!collectBlocks("cobblestone", 3)', '!craftRecipe("stone_pickaxe", 1)'],
        preconditions: [{ type: 'item', name: 'stick', count: 2 }],
        produces: null
    }] };
    const out = stub._splitBundledCraftSteps(plan);
    assert(out.steps.length === 2, 'S8: collect+craft bundle (1+1) → 2 sub-steps');
    assert(out.steps[0].action_cmd[0] === '!collectBlocks("cobblestone", 3)', 'S8: first sub-step = collect cobblestone');
    assert(out.steps[1].action_cmd[0] === '!craftRecipe("stone_pickaxe", 1)', 'S8: second sub-step = craft stone_pickaxe');
    assert(out.steps[1].produces?.name === 'stone_pickaxe', 'S8: craft sub-step produces stone_pickaxe');
    assert(out.steps[0].preconditions.length === 1, 'S8: preconditions on first sub-step only');
    assert(out.steps[1].preconditions.length === 0, 'S8: second sub-step has empty preconditions');
}

// S9. Two collect commands with no craft → NOT split (pure collect bundle)
{
    const stub = makeSplitStub();
    const plan = { steps: [{ step: 1, goal: 'Collect logs and stone', action_cmd: ['!collectBlocks("oak_log", 3)', '!collectBlocks("stone", 3)'], produces: null }] };
    const out = stub._splitBundledCraftSteps(plan);
    assert(out.steps.length === 1, 'S9: 2-collect step with no craft → 1 step (unchanged)');
}

// S10. _createStep smelt: uses c.consumes key (INPUT) not c.acquire (OUTPUT) as smeltItem arg
{
    const stub = makeSplitStub();
    // gap repair calls _createStep with smelt chain items from resolveDependencyChain:
    //   { acquire: 'stone', via: 'smelt', count: 3, consumes: { cobblestone: 3 } }
    const stoneStep = stub._createStep({ acquire: 'stone', via: 'smelt', count: 3, consumes: { cobblestone: 3 } });
    assert(stoneStep.action_cmd[0] === '!smeltItem("cobblestone", 3)', 'S10a: smelt stone → smeltItem uses INPUT cobblestone, not OUTPUT stone');
    assert(stoneStep.produces.name === 'stone', 'S10a: smelt stone produces stone');

    const ironStep = stub._createStep({ acquire: 'iron_ingot', via: 'smelt', count: 3, consumes: { raw_iron: 3 } });
    assert(ironStep.action_cmd[0] === '!smeltItem("raw_iron", 3)', 'S10b: smelt iron_ingot → smeltItem uses INPUT raw_iron');
}

// S11. Profile retrievalMode toggle: constructor reads config.enhancer.{retrievalMode,saerEnabled}
// so `node main.js --profiles <profile>` can switch SAER / no_retrieval without the eval harness.
// Uses ollama api (no network) to instantiate the real constructor path.
{
    const makeEnhancer = (retrievalMode, saerEnabled) => {
        const enhancerBlock = {
            name: 'mc_ai-enhancer',
            model: { api: 'ollama', model: 'stub', url: 'http://localhost:0' },
        };
        if (retrievalMode !== undefined) enhancerBlock.retrievalMode = retrievalMode;
        if (saerEnabled !== undefined) enhancerBlock.saerEnabled = saerEnabled;
        // Replicate prompter.js:62+145: new ImplicitEnhancer({...topEnhancerBlock, agent})
        const config = { name: 'implicit_enhancer', enhancer: enhancerBlock, agent: { bot: { version: '1.20.4' } } };
        return new ImplicitEnhancer(config);
    };

    const eDefault = makeEnhancer(undefined, undefined);
    assert(eDefault.fewShotLearning.retrievalMode === 'saer', 'S11a: default profile → retrievalMode=saer');
    assert(eDefault.fewShotLearning.saerEnabled === true, 'S11a: default profile → saerEnabled=true');

    const eNoRet = makeEnhancer('none', false);
    assert(eNoRet.fewShotLearning.retrievalMode === 'none', 'S11b: no_retrieval profile → retrievalMode=none');
    assert(eNoRet.fewShotLearning.saerEnabled === false, 'S11b: no_retrieval profile → saerEnabled=false');

    const eSaer = makeEnhancer('saer', true);
    assert(eSaer.fewShotLearning.retrievalMode === 'saer', 'S11c: saer profile → retrievalMode=saer');
}

console.log(`\n${'═'.repeat(50)}`);
console.log(` Deterministic recovery: ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(50)}\n`);

if (failed > 0) process.exit(1);
