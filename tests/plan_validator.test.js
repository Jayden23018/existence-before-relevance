/**
 * PlanValidator Unit Tests (Structured Preconditions)
 *
 * Run: node tests/plan_validator.test.js
 */

import { PlanValidator } from '../src/models/enhancers/plan_validator.js';

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

const pv = new PlanValidator(true);

// ─── validate() ─────────────────────────────────────────────────────

console.log('\n=== validate() ===\n');

// Test 1: null plan
{
    const result = pv.validate(null, []);
    assert(result.valid === true, 'null plan → valid');
    assert(result.gaps.length === 0, 'null plan → 0 gaps');
}

// Test 2: empty steps
{
    const result = pv.validate({ steps: [] }, []);
    assert(result.valid === true, 'empty steps → valid');
}

// Test 3: no preconditions
{
    const plan = {
        steps: [
            { step: 1, goal: 'Collect logs', command: '!collectBlocks("log", 3)', preconditions: [] }
        ]
    };
    const result = pv.validate(plan, []);
    assert(result.valid === true, 'no preconditions → valid');
}

// Test 4: preconditions satisfied by inventory
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Craft iron sword',
                command: '!craftRecipe("iron_sword", 1)',
                preconditions: [
                    { type: 'item', name: 'iron_ingot', count: 2 },
                    { type: 'item', name: 'stick', count: 1 }
                ]
            }
        ]
    };
    const inventory = [
        { name: 'iron_ingot', count: 2 },
        { name: 'stick', count: 1 },
        { name: 'crafting_table', count: 1 }  // implicit station precondition
    ];
    const result = pv.validate(plan, inventory);
    assert(result.valid === true, 'preconditions in inventory → valid');
}

// Test 5: preconditions satisfied by earlier step produces
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Craft sticks',
                command: '!craftRecipe("stick", 2)',
                preconditions: [],
                produces: { type: 'item', name: 'stick', count: 2 }
            },
            {
                step: 2, goal: 'Craft iron sword',
                command: '!craftRecipe("iron_sword", 1)',
                preconditions: [{ type: 'item', name: 'stick', count: 1 }],
                produces: { type: 'item', name: 'iron_sword', count: 1 }
            }
        ]
    };
    const result = pv.validate(plan, []);
    // Step 1: craftRecipe("stick") → implicit station:crafting_table (not in inventory → gap)
    // Step 2: craftRecipe("iron_sword") → implicit station:crafting_table (already declared by step 1 implicit)
    // BUT: step 1 has NO preconditions → no crafting_table in inventory → gap for crafting_table
    // Steps still validate the item chain: stick produced by step 1 satisfies step 2
    assert(result.valid === false, 'crafting_table missing → invalid');
    // Check that stick chain works: only crafting_table gap, no stick gap
    const stickGap = result.gaps.find(g => g.missingPrecondition.name === 'stick');
    assert(!stickGap, 'stick satisfied by step 1 produces (no stick gap)');
}

// Test 6: gap when item not in inventory or produced
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Smelt iron',
                command: '!smeltItem("iron_ore", 2)',
                preconditions: [{ type: 'item', name: 'iron_ore', count: 2 }],
                produces: { type: 'item', name: 'iron_ingot', count: 2 }
            },
            {
                step: 2, goal: 'Craft iron sword',
                command: '!craftRecipe("iron_sword", 1)',
                preconditions: [
                    { type: 'item', name: 'iron_ingot', count: 2 },
                    { type: 'item', name: 'stick', count: 1 }
                ]
            }
        ]
    };
    const inventory = [{ name: 'furnace', count: 1 }, { name: 'crafting_table', count: 1 }];
    const result = pv.validate(plan, inventory);
    assert(result.valid === false, 'iron_ore and stick not available → invalid');
    assert(result.gaps.length === 2, '2 gaps (iron_ore from step 1, stick from step 2)');
    // Stations provided in inventory so no station gaps
}

// Test 7: station precondition not in inventory → gap
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Smelt iron ore',
                command: '!smeltItem("iron_ore", 2)',
                preconditions: [{ type: 'station', name: 'furnace' }]
            }
        ]
    };
    const result = pv.validate(plan, []);
    assert(result.valid === false, 'furnace not in inventory → gap');
    assert(result.gaps[0].missingPrecondition.name === 'furnace', 'gap is furnace');
}

// Test 8: station in inventory → valid
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Smelt iron ore',
                command: '!smeltItem("iron_ore", 2)',
                preconditions: [{ type: 'station', name: 'furnace' }]
            }
        ]
    };
    const inventory = [{ name: 'furnace', count: 1 }];
    const result = pv.validate(plan, inventory);
    assert(result.valid === true, 'furnace in inventory → valid');
}

// Test 9: access type always satisfied
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Collect dirt',
                command: '!collectBlocks("dirt", 3)',
                preconditions: [{ type: 'access', name: 'underground' }]
            }
        ]
    };
    const result = pv.validate(plan, []);
    assert(result.valid === true, 'access type → always satisfied');
}

// Test 10: produces via inferProduces when no explicit produces field (MC 1.17+ corrected)
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Mine iron ore',
                command: '!collectBlocks("iron_ore", 3)',
                preconditions: []
                // No produces → inferProduces gives raw_iron (MC 1.17+ drop)
            },
            {
                step: 2, goal: 'Smelt raw iron',
                command: '!smeltItem("raw_iron", 3)',
                preconditions: [{ type: 'item', name: 'raw_iron', count: 3 }]
            }
        ]
    };
    const result = pv.validate(plan, [{ name: 'furnace', count: 1 }, { name: 'stone_pickaxe', count: 1 }]);
    assert(result.valid === true, 'raw_iron produced by step 1 (inferred) satisfies step 2');
}

// Test 11: smeltItem produces correct output (iron_ingot, not iron_ore)
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Smelt iron ore',
                command: '!smeltItem("iron_ore", 3)',
                preconditions: [{ type: 'item', name: 'iron_ore', count: 3 }],
                produces: { type: 'item', name: 'iron_ingot', count: 3 }
            },
            {
                step: 2, goal: 'Craft iron pickaxe',
                command: '!craftRecipe("iron_pickaxe", 1)',
                preconditions: [{ type: 'item', name: 'iron_ingot', count: 3 }]
            }
        ]
    };
    const result = pv.validate(plan, [{ name: 'furnace', count: 1 }, { name: 'crafting_table', count: 1 }]);
    // step 1 needs iron_ore (gap), step 2 needs iron_ingot (satisfied by step 1 produces)
    assert(result.valid === false, 'plan invalid because iron_ore is missing');
    assert(result.gaps.length === 1, 'only 1 gap (iron_ore for step 1)');
    assert(result.gaps[0].missingPrecondition.name === 'iron_ore', 'gap is iron_ore (not iron_ingot)');
}

// ─── inferProduces() ────────────────────────────────────────────────

console.log('\n=== inferProduces() ===\n');

// Test 12: smeltItem iron_ore → iron_ingot
{
    const out = pv.inferProduces('!smeltItem("iron_ore", 3)');
    assert(out !== null, 'smeltItem returns non-null');
    assert(out.name === 'iron_ingot', 'smeltItem iron_ore → iron_ingot');
    assert(out.count === 3, 'count is 3');
    assert(out.type === 'item', 'type is item');
}

// Test 13: smeltItem gold_ore → gold_ingot
{
    const out = pv.inferProduces('!smeltItem("gold_ore", 1)');
    assert(out.name === 'gold_ingot', 'smeltItem gold_ore → gold_ingot');
}

// Test 14: collectBlocks → actual MC drop (MC 1.17+ raw ore drops)
{
    const out = pv.inferProduces('!collectBlocks("iron_ore", 3)');
    assert(out !== null, 'collectBlocks iron_ore returns non-null');
    assert(out.name === 'raw_iron', 'collectBlocks iron_ore → raw_iron (MC 1.17+)');
    assert(out.count === 3, 'count preserved');
}

// Test 14b: stone → cobblestone drop
{
    const out = pv.inferProduces('!collectBlocks("stone", 5)');
    assert(out.name === 'cobblestone', 'collectBlocks stone → cobblestone');
    assert(out.count === 5, 'count preserved');
}

// Test 15: craftRecipe → same item
{
    const out = pv.inferProduces('!craftRecipe("iron_sword", 1)');
    assert(out.name === 'iron_sword', 'craftRecipe → same item name');
}

// Test 16: null command
{
    const out = pv.inferProduces(null);
    assert(out === null, 'null command → null');
}

// Test 17: unrecognized command format
{
    const out = pv.inferProduces('go to the village');
    assert(out === null, 'non-command string → null');
}

// Test 18: smeltItem sand → glass
{
    const out = pv.inferProduces('!smeltItem("sand", 4)');
    assert(out.name === 'glass', 'smeltItem sand → glass');
}

// ─── parsePreconditionString() ──────────────────────────────────────

console.log('\n=== parsePreconditionString() ===\n');

// Test 19: new structured format "item:iron_ore:3"
{
    const cond = pv.parsePreconditionString('item:iron_ore:3');
    assert(cond.type === 'item', 'type is item');
    assert(cond.name === 'iron_ore', 'name is iron_ore');
    assert(cond.count === 3, 'count is 3');
}

// Test 20: new structured format "station:furnace"
{
    const cond = pv.parsePreconditionString('station:furnace');
    assert(cond.type === 'station', 'type is station');
    assert(cond.name === 'furnace', 'name is furnace');
}

// Test 21: new structured format "access:underground"
{
    const cond = pv.parsePreconditionString('access:underground');
    assert(cond.type === 'access', 'type is access');
    assert(cond.name === 'underground', 'name is underground');
}

// Test 22: old format "3x Iron Ingot"
{
    const cond = pv.parsePreconditionString('3x Iron Ingot');
    assert(cond.type === 'item', '"3x Iron Ingot" → type item');
    assert(cond.name === 'iron_ingot', '"3x Iron Ingot" → name iron_ingot');
    assert(cond.count === 3, '"3x Iron Ingot" → count 3');
}

// Test 23: old format "furnace" → station
{
    const cond = pv.parsePreconditionString('furnace');
    assert(cond.type === 'station', '"furnace" → type station');
    assert(cond.name === 'furnace', 'name furnace');
}

// Test 24: "Access to underground"
{
    const cond = pv.parsePreconditionString('Access to underground');
    assert(cond.type === 'access', '"Access to underground" → access');
    assert(cond.name === 'underground', 'name underground');
}

// Test 25: "Nearby: furnace"
{
    const cond = pv.parsePreconditionString('Nearby: furnace');
    assert(cond.type === 'station', '"Nearby: furnace" → station');
    assert(cond.name === 'furnace', 'name furnace');
}

// Test 26: null → null
{
    const cond = pv.parsePreconditionString(null);
    assert(cond === null, 'null → null');
}

// Test 27: empty string → null
{
    const cond = pv.parsePreconditionString('');
    assert(cond === null, 'empty → null');
}

// Test 28: "Iron Ingot in inventory"
{
    const cond = pv.parsePreconditionString('Iron Ingot in inventory');
    assert(cond.type === 'item', '"Iron Ingot in inventory" → item');
    assert(cond.name === 'iron_ingot', 'name iron_ingot');
}

// Test 29: noise word → null
{
    const cond = pv.parsePreconditionString('nearby');
    assert(cond === null, '"nearby" → null (noise word)');
}

// ─── isSatisfied() ──────────────────────────────────────────────────

console.log('\n=== isSatisfied() ===\n');

// Test 30: item in inventory
{
    const invMap = { iron_ingot: 2, stick: 1 };
    assert(pv.isSatisfied({ type: 'item', name: 'iron_ingot', count: 1 }, invMap, []) === true,
        'iron_ingot in inventory');
}

// Test 31: item produced by earlier step
{
    const invMap = {};
    const produced = [{ type: 'item', name: 'iron_ingot', count: 2 }];
    assert(pv.isSatisfied({ type: 'item', name: 'iron_ingot', count: 2 }, invMap, produced) === true,
        'iron_ingot produced by earlier step');
}

// Test 32: station in inventory
{
    const invMap = { furnace: 1 };
    assert(pv.isSatisfied({ type: 'station', name: 'furnace' }, invMap, []) === true,
        'furnace in inventory');
}

// Test 33: access always satisfied
{
    assert(pv.isSatisfied({ type: 'access', name: 'underground' }, {}, []) === true,
        'access always satisfied');
}

// Test 34: item not available
{
    assert(pv.isSatisfied({ type: 'item', name: 'diamond', count: 1 }, {}, []) === false,
        'diamond not available');
}

// Test 35: count not met
{
    const invMap = { iron_ingot: 1 };
    assert(pv.isSatisfied({ type: 'item', name: 'iron_ingot', count: 3 }, invMap, []) === false,
        'only 1 iron_ingot but need 3 → not satisfied');
}

// Test 36: inventory + produced combined
{
    const invMap = { iron_ingot: 1 };
    const produced = [{ type: 'item', name: 'iron_ingot', count: 2 }];
    assert(pv.isSatisfied({ type: 'item', name: 'iron_ingot', count: 3 }, invMap, produced) === true,
        '1 in inventory + 2 produced = 3 → satisfied');
}

// Test 37: null condition → true
{
    assert(pv.isSatisfied(null, {}, []) === true, 'null → satisfied');
}

// ─── buildGapPrompt() ───────────────────────────────────────────────

console.log('\n=== buildGapPrompt() ===\n');

// Test 38: valid result → empty
{
    const result = pv.buildGapPrompt({ valid: true, gaps: [] }, []);
    assert(result === '', 'valid result → empty string');
}

// Test 39: null result → empty
{
    const result = pv.buildGapPrompt(null, []);
    assert(result === '', 'null result → empty string');
}

// Test 40: structured gaps
{
    const gaps = [
        { step: 2, goal: 'Smelt iron', missingPrecondition: { type: 'item', name: 'iron_ore', count: 3 }, display: 'item:iron_ore:3' },
        { step: 3, goal: 'Craft sword', missingPrecondition: { type: 'item', name: 'stick', count: 1 }, display: 'item:stick:1' }
    ];
    const result = pv.buildGapPrompt({ valid: false, gaps }, [{ name: 'log', count: 3 }]);
    assert(result.includes('Step 2'), 'mentions step 2');
    assert(result.includes('iron_ore'), 'mentions iron_ore');
    assert(result.includes('Step 3'), 'mentions step 3');
    assert(result.includes('stick'), 'mentions stick');
    assert(result.includes('log'), 'includes inventory item');
    assert(result.toLowerCase().includes('corrected'), 'asks for corrected plan');
}

// Test 41: deduplication
{
    const gaps = [
        { step: 2, goal: 'Smelt', missingPrecondition: { type: 'item', name: 'iron_ore', count: 1 }, display: 'item:iron_ore:1' },
        { step: 2, goal: 'Smelt', missingPrecondition: { type: 'item', name: 'iron_ore', count: 1 }, display: 'item:iron_ore:1' }
    ];
    const result = pv.buildGapPrompt({ valid: false, gaps }, []);
    // Count occurrences of "Step 2"
    const matches = result.match(/Step 2/g);
    assert(matches && matches.length === 1, 'duplicate gap deduplicated');
}

// ─── conditionToDisplay() ───────────────────────────────────────────

console.log('\n=== conditionToDisplay() ===\n');

// Test 42
{
    assert(pv.conditionToDisplay({ type: 'item', name: 'iron_ore', count: 3 }) === 'item:iron_ore:3',
        'item display format');
}

// Test 43
{
    assert(pv.conditionToDisplay({ type: 'station', name: 'furnace' }) === 'station:furnace',
        'station display format');
}

// Test 44
{
    assert(pv.conditionToDisplay({ type: 'access', name: 'underground' }) === 'access:underground',
        'access display format');
}

// Test 45
{
    assert(pv.conditionToDisplay(null) === 'unknown', 'null → unknown');
}

// ─── 向后兼容测试 ──────────────────────────────────────────────────

console.log('\n=== 向后兼容 (string preconditions) ===\n');

// Test 46: old string preconditions still validate correctly
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Collect logs',
                command: '!collectBlocks("log", 3)',
                preconditions: ['Access to trees']  // old string format
            },
            {
                step: 2, goal: 'Craft planks',
                command: '!craftRecipe("planks", 12)',
                preconditions: ['3x log']  // old string format
            }
        ]
    };
    const result = pv.validate(plan, [{ name: 'crafting_table', count: 1 }]);
    // "Access to trees" → access → always satisfied
    // "3x log" → item:log:3 → satisfied by step 1 inferred produces
    // crafting_table implicit for craftRecipe → provided in inventory
    assert(result.valid === true, 'old string preconditions: step 2 satisfied by step 1 inferred output');
}

// Test 47: old string preconditions with station detection
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Smelt iron',
                command: '!smeltItem("iron_ore", 2)',
                preconditions: ['furnace']  // old string → should detect as station
            }
        ]
    };
    const result = pv.validate(plan, []);
    assert(result.valid === false, '"furnace" string → detected as station → gap when not in inventory');
}

// Test 48: mixed structured + string preconditions
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Smelt iron',
                command: '!smeltItem("iron_ore", 2)',
                preconditions: [
                    { type: 'item', name: 'iron_ore', count: 2 },  // structured
                    'furnace'  // old string
                ]
            }
        ]
    };
    const inventory = [{ name: 'iron_ore', count: 3 }];  // no furnace
    const result = pv.validate(plan, inventory);
    assert(result.valid === false, 'mixed format: furnace gap detected');
    assert(result.gaps.length === 1, 'only 1 gap (furnace)');
}

// ─── inferImplicitPreconditions() ────────────────────────────────────

console.log('\n=== inferImplicitPreconditions() ===\n');

// Test 49: smeltItem → furnace station requirement
{
    const result = pv.inferImplicitPreconditions('!smeltItem("iron_ore", 2)');
    assert(result.length === 1, 'smeltItem → 1 implicit precondition');
    assert(result[0].type === 'station', 'type is station');
    assert(result[0].name === 'furnace', 'name is furnace');
}

// Test 50: craftRecipe → crafting_table station requirement
{
    const result = pv.inferImplicitPreconditions('!craftRecipe("iron_sword", 1)');
    assert(result.length === 1, 'craftRecipe → 1 implicit precondition');
    assert(result[0].type === 'station', 'type is station');
    assert(result[0].name === 'crafting_table', 'name is crafting_table');
}

// Test 51: collectBlocks iron_ore → stone_pickaxe tool requirement
{
    const result = pv.inferImplicitPreconditions('!collectBlocks("iron_ore", 3)');
    assert(result.length === 1, 'collectBlocks iron_ore → 1 implicit precondition');
    assert(result[0].type === 'item', 'type is item');
    assert(result[0].name === 'stone_pickaxe', 'name is stone_pickaxe');
}

// Test 52: collectBlocks diamond_ore → iron_pickaxe tool requirement
{
    const result = pv.inferImplicitPreconditions('!collectBlocks("diamond_ore", 1)');
    assert(result.length === 1, 'collectBlocks diamond_ore → 1 implicit');
    assert(result[0].name === 'iron_pickaxe', 'name is iron_pickaxe');
}

// Test 53: collectBlocks cobblestone → wooden_pickaxe tool requirement
{
    const result = pv.inferImplicitPreconditions('!collectBlocks("cobblestone", 5)');
    assert(result.length === 1, 'collectBlocks cobblestone → 1 implicit');
    assert(result[0].name === 'wooden_pickaxe', 'name is wooden_pickaxe');
}

// Test 54: collectBlocks log → no tool requirement
{
    const result = pv.inferImplicitPreconditions('!collectBlocks("log", 3)');
    assert(result.length === 0, 'collectBlocks log → no implicit preconditions');
}

// Test 55: collectBlocks dirt → no tool requirement
{
    const result = pv.inferImplicitPreconditions('!collectBlocks("dirt", 10)');
    assert(result.length === 0, 'collectBlocks dirt → no implicit preconditions');
}

// Test 56: null command → empty array
{
    const result = pv.inferImplicitPreconditions(null);
    assert(result.length === 0, 'null → empty array');
}

// Test 57: unrecognized command → empty array
{
    const result = pv.inferImplicitPreconditions('go to the village');
    assert(result.length === 0, 'non-command → empty array');
}

// Test 58: already-declared precondition not duplicated
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Smelt iron',
                command: '!smeltItem("iron_ore", 2)',
                preconditions: [{ type: 'station', name: 'furnace' }]  // already declared
            }
        ]
    };
    const result = pv.validate(plan, [{ name: 'iron_ore', count: 2 }, { name: 'furnace', count: 1 }]);
    assert(result.valid === true, 'explicit furnace not duplicated by implicit injection');
}

// Test 59: implicit tool already declared → not duplicated
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Mine iron ore',
                command: '!collectBlocks("iron_ore", 2)',
                preconditions: [{ type: 'item', name: 'stone_pickaxe', count: 1 }]  // already declared
            }
        ]
    };
    const result = pv.validate(plan, [{ name: 'stone_pickaxe', count: 1 }]);
    assert(result.valid === true, 'explicit stone_pickaxe not duplicated by implicit injection');
}

// ─── Tool Tier Compatibility ────────────────────────────────────────

console.log('\n=== Tool Tier Compatibility ===\n');

// Test 60: iron_pickaxe satisfies stone_pickaxe requirement
{
    const invMap = { iron_pickaxe: 1 };
    assert(
        pv.isSatisfied({ type: 'item', name: 'stone_pickaxe', count: 1 }, invMap, []) === true,
        'iron_pickaxe satisfies stone_pickaxe requirement'
    );
}

// Test 61: diamond_pickaxe satisfies stone_pickaxe requirement
{
    const invMap = { diamond_pickaxe: 1 };
    assert(
        pv.isSatisfied({ type: 'item', name: 'stone_pickaxe', count: 1 }, invMap, []) === true,
        'diamond_pickaxe satisfies stone_pickaxe requirement'
    );
}

// Test 62: diamond_pickaxe satisfies iron_pickaxe requirement
{
    const invMap = { diamond_pickaxe: 1 };
    assert(
        pv.isSatisfied({ type: 'item', name: 'iron_pickaxe', count: 1 }, invMap, []) === true,
        'diamond_pickaxe satisfies iron_pickaxe requirement'
    );
}

// Test 63: stone_pickaxe does NOT satisfy iron_pickaxe requirement
{
    const invMap = { stone_pickaxe: 1 };
    assert(
        pv.isSatisfied({ type: 'item', name: 'iron_pickaxe', count: 1 }, invMap, []) === false,
        'stone_pickaxe does NOT satisfy iron_pickaxe requirement'
    );
}

// Test 64: wooden_pickaxe does NOT satisfy iron_pickaxe requirement
{
    const invMap = { wooden_pickaxe: 1 };
    assert(
        pv.isSatisfied({ type: 'item', name: 'iron_pickaxe', count: 1 }, invMap, []) === false,
        'wooden_pickaxe does NOT satisfy iron_pickaxe requirement'
    );
}

// Test 65: wooden_pickaxe satisfies wooden_pickaxe requirement (exact match)
{
    const invMap = { wooden_pickaxe: 1 };
    assert(
        pv.isSatisfied({ type: 'item', name: 'wooden_pickaxe', count: 1 }, invMap, []) === true,
        'wooden_pickaxe satisfies its own requirement'
    );
}

// Test 66: netherite_pickaxe satisfies diamond_pickaxe requirement
{
    const invMap = { netherite_pickaxe: 1 };
    assert(
        pv.isSatisfied({ type: 'item', name: 'diamond_pickaxe', count: 1 }, invMap, []) === true,
        'netherite_pickaxe satisfies diamond_pickaxe requirement'
    );
}

// Test 67: iron_pickaxe does NOT satisfy diamond_pickaxe requirement
{
    const invMap = { iron_pickaxe: 1 };
    assert(
        pv.isSatisfied({ type: 'item', name: 'diamond_pickaxe', count: 1 }, invMap, []) === false,
        'iron_pickaxe does NOT satisfy diamond_pickaxe requirement'
    );
}

// Test 68: validate() with iron_pickaxe in inventory satisfies implicit stone_pickaxe for iron_ore
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Collect iron ore',
                command: '!collectBlocks("iron_ore", 2)',
                preconditions: []
            }
        ]
    };
    const result = pv.validate(plan, [{ name: 'iron_pickaxe', count: 1 }]);
    assert(result.valid === true, 'iron_pickaxe in inventory satisfies implicit stone_pickaxe for iron_ore');
}

// Test 69: golden_pickaxe satisfies stone_pickaxe (same tier as iron)
{
    const invMap = { golden_pickaxe: 1 };
    assert(
        pv.isSatisfied({ type: 'item', name: 'stone_pickaxe', count: 1 }, invMap, []) === true,
        'golden_pickaxe (tier 2) satisfies stone_pickaxe (tier 1) requirement'
    );
}

// ─── _getStepCommands Tests ──────────────────────────────────────

console.log('\n--- _getStepCommands Tests ---');

// Test: step with only command
{
    const cmds = pv._getStepCommands({ command: '!collectBlocks("stone", 3)' });
    assert(cmds.length === 1 && cmds[0] === '!collectBlocks("stone", 3)',
        '_getStepCommands: step with command returns [command]');
}

// Test: step with only action_cmd
{
    const cmds = pv._getStepCommands({ action_cmd: ['!collectBlocks("log", 2)', '!craftRecipe("planks", 8)'] });
    assert(cmds.length === 2 && cmds[0] === '!collectBlocks("log", 2)',
        '_getStepCommands: step with action_cmd returns array');
}

// Test: step with both uses action_cmd (priority)
{
    const cmds = pv._getStepCommands({
        command: '!oldCommand()',
        action_cmd: ['!newCommand()']
    });
    assert(cmds.length === 1 && cmds[0] === '!newCommand()',
        '_getStepCommands: both present, action_cmd takes priority');
}

// Test: step with neither
{
    const cmds = pv._getStepCommands({});
    assert(cmds.length === 0,
        '_getStepCommands: no command or action_cmd returns []');
}

// ─── pruneSteps Tests ───────────────────────────────────────────

console.log('\n--- pruneSteps Tests ---');

// Test: empty inventory → no steps skipped
{
    const plan = {
        steps: [
            { step: 1, goal: 'Get sticks', produces: { type: 'item', name: 'stick', count: 2 } },
            { step: 2, goal: 'Get planks', produces: { type: 'item', name: 'planks', count: 4 } }
        ]
    };
    const result = pv.pruneSteps(plan, []);
    assert(result.steps[0].skip === false && result.steps[1].skip === false,
        'pruneSteps: empty inventory → no steps skipped');
}

// Test: single produces satisfied → step skipped
{
    const plan = {
        steps: [
            { step: 1, goal: 'Get sticks', produces: { type: 'item', name: 'stick', count: 2 } }
        ]
    };
    const result = pv.pruneSteps(plan, [{ name: 'stick', count: 5 }]);
    assert(result.steps[0].skip === true,
        'pruneSteps: inventory has produces → step skipped');
}

// Test: single produces NOT satisfied → step not skipped
{
    const plan = {
        steps: [
            { step: 1, goal: 'Get sticks', produces: { type: 'item', name: 'stick', count: 5 } }
        ]
    };
    const result = pv.pruneSteps(plan, [{ name: 'stick', count: 2 }]);
    assert(result.steps[0].skip === false,
        'pruneSteps: inventory has less than needed → step NOT skipped');
}

// Test: multi produces (array) all satisfied → step skipped
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Get planks and sticks',
                produces: [
                    { type: 'item', name: 'planks', count: 2 },
                    { type: 'item', name: 'stick', count: 2 }
                ]
            }
        ]
    };
    const result = pv.pruneSteps(plan, [{ name: 'planks', count: 3 }, { name: 'stick', count: 5 }]);
    assert(result.steps[0].skip === true,
        'pruneSteps: all array produces satisfied → step skipped');
}

// Test: multi produces partially satisfied → step NOT skipped
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Get planks and sticks',
                produces: [
                    { type: 'item', name: 'planks', count: 2 },
                    { type: 'item', name: 'stick', count: 2 }
                ]
            }
        ]
    };
    const result = pv.pruneSteps(plan, [{ name: 'planks', count: 5 }]); // no sticks
    assert(result.steps[0].skip === false,
        'pruneSteps: partial array produces → step NOT skipped');
}

// Test: no produces field → never skipped
{
    const plan = {
        steps: [
            { step: 1, goal: 'Search for block' } // no produces
        ]
    };
    const result = pv.pruneSteps(plan, [{ name: 'everything', count: 999 }]);
    assert(result.steps[0].skip === false,
        'pruneSteps: no produces → never skipped');
}

// Test: no produces field, but craftRecipe target already in inventory → inferred + skipped
// (regression test for cauldron live-eval bug: LLM plan re-crafts wooden_pickaxe the bot
// already owns because the step has no explicit produces field, so it never got pruned)
{
    const plan = {
        steps: [
            { step: 1, goal: 'Craft a wooden pickaxe', action_cmd: ['!craftRecipe("wooden_pickaxe", 1)'] }
        ]
    };
    const result = pv.pruneSteps(plan, [{ name: 'wooden_pickaxe', count: 1 }]);
    assert(result.steps[0].skip === true,
        'pruneSteps: no produces but craftRecipe target already owned → inferred and skipped');
}

// Test: no produces field, craftRecipe target NOT in inventory → inferred but NOT skipped
{
    const plan = {
        steps: [
            { step: 1, goal: 'Craft a wooden pickaxe', action_cmd: ['!craftRecipe("wooden_pickaxe", 1)'] }
        ]
    };
    const result = pv.pruneSteps(plan, []);
    assert(result.steps[0].skip === false,
        'pruneSteps: no produces, craftRecipe target not owned → not skipped');
}

// Test: no produces field, non-craft/smelt command (e.g. searchForBlock) → NOT inferred, never skipped
{
    const plan = {
        steps: [
            { step: 1, goal: 'Find a furnace', action_cmd: ['!searchForBlock("furnace", 32)'] }
        ]
    };
    const result = pv.pruneSteps(plan, [{ name: 'furnace', count: 1 }]);
    assert(result.steps[0].skip === false,
        'pruneSteps: non-craft/smelt command with no produces → never skipped even if item owned');
}

// Test: station/access type produces → ignored, not skipped
{
    const plan = {
        steps: [
            { step: 1, goal: 'Place furnace', produces: { type: 'station', name: 'furnace', count: 1 } }
        ]
    };
    const result = pv.pruneSteps(plan, []);
    assert(result.steps[0].skip === false,
        'pruneSteps: station produces → ignored, not skipped');
}

// Test: mixed scenario — some steps skipped, some not
{
    const plan = {
        steps: [
            { step: 1, goal: 'Get sticks', produces: { type: 'item', name: 'stick', count: 2 } },
            { step: 2, goal: 'Get cobblestone', produces: { type: 'item', name: 'cobblestone', count: 3 } },
            { step: 3, goal: 'Craft stone sword', produces: { type: 'item', name: 'stone_sword', count: 1 } }
        ]
    };
    // inventory has sticks and sword but not cobblestone
    const result = pv.pruneSteps(plan, [{ name: 'stick', count: 5 }, { name: 'stone_sword', count: 1 }]);
    assert(result.steps[0].skip === true, 'pruneSteps: step 1 skipped (has sticks)');
    assert(result.steps[1].skip === false, 'pruneSteps: step 2 NOT skipped (no cobblestone)');
    assert(result.steps[2].skip === true, 'pruneSteps: step 3 skipped (has sword)');
}

// ─── Virtual Inventory Consumption Tests ──────────────────────────

console.log('\n--- Virtual Inventory Consumption ---');

// Test: step 2 consumes all of step 1's output → step 3 correctly detects gap
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Smelt iron',
                command: '!smeltItem("raw_iron", 3)',
                preconditions: [],
                produces: { type: 'item', name: 'iron_ingot', count: 3 }
            },
            {
                step: 2, goal: 'Craft iron sword',
                command: '!craftRecipe("iron_sword", 1)',
                preconditions: [{ type: 'item', name: 'iron_ingot', count: 2 }],
                produces: { type: 'item', name: 'iron_sword', count: 1 }
            },
            {
                step: 3, goal: 'Craft iron pickaxe',
                command: '!craftRecipe("iron_pickaxe", 1)',
                preconditions: [{ type: 'item', name: 'iron_ingot', count: 3 }],
                produces: { type: 'item', name: 'iron_pickaxe', count: 1 }
            }
        ]
    };
    const result = pv.validate(plan, [
        { name: 'furnace', count: 1 },
        { name: 'crafting_table', count: 1 }
    ]);
    assert(result.valid === false, 'consumption tracking: step 3 iron_ingot gap detected');
    const ironGap = result.gaps.find(g => g.missingPrecondition.name === 'iron_ingot');
    assert(ironGap, 'iron_ingot gap present in step 3');
}

// Test: partial consumption leaves remainder available
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Smelt iron',
                command: '!smeltItem("raw_iron", 5)',
                preconditions: [],
                produces: { type: 'item', name: 'iron_ingot', count: 5 }
            },
            {
                step: 2, goal: 'Craft iron sword',
                command: '!craftRecipe("iron_sword", 1)',
                preconditions: [{ type: 'item', name: 'iron_ingot', count: 2 }],
                produces: { type: 'item', name: 'iron_sword', count: 1 }
            },
            {
                step: 3, goal: 'Craft iron pickaxe',
                command: '!craftRecipe("iron_pickaxe", 1)',
                preconditions: [{ type: 'item', name: 'iron_ingot', count: 3 }],
                produces: { type: 'item', name: 'iron_pickaxe', count: 1 }
            }
        ]
    };
    const result = pv.validate(plan, [
        { name: 'furnace', count: 1 },
        { name: 'crafting_table', count: 1 }
    ]);
    assert(result.valid === true, 'consumption: 5 - 2 = 3 remaining → step 3 satisfied');
}

// Test: tools are NOT consumed (pickaxe available for multiple collectBlocks steps)
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Mine iron ore',
                command: '!collectBlocks("iron_ore", 3)',
                preconditions: []
            },
            {
                step: 2, goal: 'Mine gold ore',
                command: '!collectBlocks("gold_ore", 2)',
                preconditions: []
            }
        ]
    };
    const result = pv.validate(plan, [{ name: 'iron_pickaxe', count: 1 }]);
    // iron_pickaxe satisfies stone_pickaxe (implicit for iron_ore) and iron_pickaxe (implicit for gold_ore)
    assert(result.valid === true, 'tools not consumed: iron_pickaxe satisfies both steps');
}

// ─── Tool Prerequisite Detection with RecipeResolver ────────────────

console.log('\n=== Tool Prerequisite Detection (RecipeResolver) ===\n');

import RecipeResolver from '../src/models/enhancers/recipe_resolver.js';

const rr = new RecipeResolver({ version: '1.20.4' });
const pvRr = new PlanValidator(true);
pvRr.setRecipeResolver(rr);

// Test: collectBlocks cobblestone without any pickaxe → gap detected
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Mine cobblestone',
                command: '!collectBlocks("cobblestone", 3)',
                preconditions: []
            }
        ]
    };
    const result = pvRr.validate(plan, []);
    assert(result.valid === false, 'cobblestone without pickaxe → gap detected');
    const toolGap = result.gaps.find(g => g.missingPrecondition.name === 'wooden_pickaxe');
    assert(toolGap, 'gap is wooden_pickaxe');
}

// Test: collectBlocks cobblestone WITH wooden_pickaxe in inventory → no gap
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Mine cobblestone',
                command: '!collectBlocks("cobblestone", 3)',
                preconditions: []
            }
        ]
    };
    const result = pvRr.validate(plan, [{ name: 'wooden_pickaxe', count: 1 }]);
    assert(result.valid === true, 'cobblestone with wooden_pickaxe → valid');
}

// Test: collectBlocks cobblestone, stone_pickaxe in inventory (higher tier) → no gap
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Mine cobblestone',
                command: '!collectBlocks("cobblestone", 3)',
                preconditions: []
            }
        ]
    };
    const result = pvRr.validate(plan, [{ name: 'stone_pickaxe', count: 1 }]);
    assert(result.valid === true, 'cobblestone with stone_pickaxe → valid (higher tier)');
}

// Test: collectBlocks iron_ore without stone_pickaxe → gap detected
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Mine iron ore',
                command: '!collectBlocks("iron_ore", 3)',
                preconditions: []
            }
        ]
    };
    const result = pvRr.validate(plan, []);
    assert(result.valid === false, 'iron_ore without pickaxe → gap detected');
    const toolGap = result.gaps.find(g => g.missingPrecondition.name === 'stone_pickaxe');
    assert(toolGap, 'gap is stone_pickaxe');
}

// Test: collectBlocks iron_ore with stone_pickaxe → no gap
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Mine iron ore',
                command: '!collectBlocks("iron_ore", 3)',
                preconditions: []
            }
        ]
    };
    const result = pvRr.validate(plan, [{ name: 'stone_pickaxe', count: 1 }]);
    assert(result.valid === true, 'iron_ore with stone_pickaxe → valid');
}

// Test: collectBlocks iron_ore with iron_pickaxe (higher tier) → no gap
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Mine iron ore',
                command: '!collectBlocks("iron_ore", 3)',
                preconditions: []
            }
        ]
    };
    const result = pvRr.validate(plan, [{ name: 'iron_pickaxe', count: 1 }]);
    assert(result.valid === true, 'iron_ore with iron_pickaxe → valid (higher tier)');
}

// Test: collectBlocks oak_log (no tool required) → no gap regardless of inventory
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Chop oak log',
                command: '!collectBlocks("oak_log", 3)',
                preconditions: []
            }
        ]
    };
    const result = pvRr.validate(plan, []);
    assert(result.valid === true, 'oak_log no tool needed → valid with empty inventory');
}

// Test: full iron_pickaxe plan without wooden_pickaxe → tool gap detected
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Collect cobblestone',
                command: '!collectBlocks("cobblestone", 3)',
                preconditions: [],
                produces: { type: 'item', name: 'cobblestone', count: 3 }
            },
            {
                step: 2, goal: 'Craft stone pickaxe',
                command: '!craftRecipe("stone_pickaxe", 1)',
                preconditions: [],
                produces: { type: 'item', name: 'stone_pickaxe', count: 1 }
            },
            {
                step: 3, goal: 'Collect iron ore',
                command: '!collectBlocks("iron_ore", 3)',
                preconditions: [],
                produces: { type: 'item', name: 'raw_iron', count: 3 }  // MC 1.17+ drop
            }
        ]
    };
    const result = pvRr.validate(plan, [{ name: 'crafting_table', count: 1 }]);
    assert(result.valid === false, 'full plan without wooden_pickaxe → gap for step 1 cobblestone');
    const wpGap = result.gaps.find(g => g.missingPrecondition.name === 'wooden_pickaxe');
    assert(wpGap, 'wooden_pickaxe gap present');
}

// Test: full iron_pickaxe plan with wooden_pickaxe → no tool gap
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Collect cobblestone',
                command: '!collectBlocks("cobblestone", 3)',
                preconditions: [],
                produces: { type: 'item', name: 'cobblestone', count: 3 }
            },
            {
                step: 2, goal: 'Craft stone pickaxe',
                command: '!craftRecipe("stone_pickaxe", 1)',
                preconditions: [],
                produces: { type: 'item', name: 'stone_pickaxe', count: 1 }
            },
            {
                step: 3, goal: 'Collect iron ore',
                command: '!collectBlocks("iron_ore", 3)',
                preconditions: [],
                produces: { type: 'item', name: 'raw_iron', count: 3 }  // MC 1.17+ drop
            }
        ]
    };
    const result = pvRr.validate(plan, [
        { name: 'wooden_pickaxe', count: 1 },
        { name: 'crafting_table', count: 1 }
    ]);
    assert(result.valid === true, 'full plan with wooden_pickaxe → valid (stone_pickaxe produced mid-plan for step 3)');
}

// Test: freeformGoal step with cobblestone → tool gap detected
{
    const plan = {
        steps: [
            {
                step: 1, goal: 'Mine cobblestone',
                freeformGoal: 'Collect 3 cobblestone using the best available tool',
                preconditions: []
            }
        ]
    };
    const result = pvRr.validate(plan, []);
    assert(result.valid === false, 'freeformGoal cobblestone → tool gap detected');
    const toolGap = result.gaps.find(g => g.missingPrecondition.name === 'wooden_pickaxe');
    assert(toolGap, 'freeformGoal gap is wooden_pickaxe');
}

// Test: _getStepCommands returns freeformGoal as pseudo-command
{
    const cmds = pvRr._getStepCommands({ freeformGoal: 'Collect 3 cobblestone' });
    assert(cmds.length === 1, '_getStepCommands returns freeformGoal');
    assert(cmds[0] === 'Collect 3 cobblestone', 'freeformGoal content matches');
}

// ─── Executability Constraint Tests (Suggestion 1) ──────────────────

console.log('\n=== Executability Constraint (produces vs action_cmd) ===\n');

// Test NEW-1: produces item not producible by any action_cmd → unsupported-produce gap
{
    const plan = {
        steps: [{
            step: 1, goal: 'Craft furnace',
            action_cmd: ['!collectBlocks("cobblestone", 8)', '!craftRecipe("crafting_table", 1)'],
            preconditions: [],
            produces: { type: 'item', name: 'furnace', count: 1 }  // BUG: no craftRecipe('furnace')
        }]
    };
    const result = pv.validate(plan, []);
    assert(result.valid === false, 'NEW-1: furnace in produces but not in action_cmd → invalid');
    assert(
        result.gaps.some(g => g.display.includes('unsupported-produce:furnace')),
        'NEW-1: gap identifies unsupported produce: furnace'
    );
    assert(
        !result.gaps.some(g => g.display.includes('unsupported-produce:cobblestone')),
        'NEW-1: cobblestone IS produced by collectBlocks → no false positive'
    );
    assert(
        !result.gaps.some(g => g.display.includes('unsupported-produce:crafting_table')),
        'NEW-1: crafting_table IS produced by craftRecipe → no false positive'
    );
}

// Test NEW-2: produces correctly matched by action_cmd → no executability gap
{
    const plan = {
        steps: [{
            step: 1, goal: 'Craft crafting table',
            action_cmd: ['!craftRecipe("oak_planks", 4)', '!craftRecipe("crafting_table", 1)'],
            preconditions: [],
            produces: { type: 'item', name: 'crafting_table', count: 1 }
        }]
    };
    const result = pv.validate(plan, [{ name: 'oak_log', count: 1 }]);
    assert(
        !result.gaps.some(g => g.display.includes('unsupported-produce:crafting_table')),
        'NEW-2: crafting_table supported by craftRecipe → no unsupported-produce gap'
    );
}

// Test NEW-3: freeformGoal → trust produces declaration (no false positive from empty inference)
{
    const plan = {
        steps: [{
            step: 1, goal: 'Find iron',
            freeformGoal: 'Look for iron ore near spawn',
            preconditions: [],
            produces: { type: 'item', name: 'iron_ore', count: 3 }
        }]
    };
    const result = pv.validate(plan, []);
    assert(
        !result.gaps.some(g => g.display.includes('unsupported-produce')),
        'NEW-3: freeformGoal has no inference → trust produces (no false positive)'
    );
}

// ─── Summary ────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
