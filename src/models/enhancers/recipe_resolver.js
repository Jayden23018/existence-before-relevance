/**
 * RecipeResolver — single source of truth for Minecraft recipe data.
 *
 * Data sources:
 *   Crafting graph:  mcData.recipes (shaped + shapeless, 2409 recipes for 729 items in 1.20.4)
 *   Tool requirements: mcData.blocksByName[].harvestTools ({ "numericId": true })
 *   Smelting maps:   SMELTING_OUTPUTS constant below (mcData.recipes has NO smelting entries for PC)
 *   Fuel set:        FUEL_ITEMS from precondition_parser.js (mcData items have no burnTime field)
 *
 * mcData format notes (1.20.4, verified 2026-04-30):
 *   - Recipe keys are stringified numeric item IDs: { "280": [{ inShape: [[id,null],...], result: {id,count} }] }
 *   - Shaped recipes have `inShape` (2D array of numeric IDs, null = empty)
 *   - Shapeless recipes have `ingredients` (flat array of numeric IDs)
 *   - No `type` field — all entries are crafting recipes (no smelting/blasting)
 *   - harvestTools: { "816": true } — string keys of numeric item IDs
 *   - Items: { id, name, displayName, stackSize } — no fuel/burn properties
 *   - No wildcard ingredient arrays observed in 1.20.4
 */

import minecraftData from 'minecraft-data';
import { FUEL_ITEMS } from './precondition_parser.js';

const MAX_HOP_DEPTH = 6;

// Minecraft tag-based fungible categories: any variant is interchangeable.
// When resolveDependencyChain needs one of these, it emits a collect_freeform step
// so the LLM can choose whichever variant is available in the environment.
const FALLBACK_FUNGIBLE_SUFFIXES = ['_log', '_planks'];

export const TOOL_TIER_ORDER = {
    'wooden_pickaxe': 0, 'stone_pickaxe': 1, 'iron_pickaxe': 2,
    'golden_pickaxe': 2, 'diamond_pickaxe': 3, 'netherite_pickaxe': 4,
    'wooden_axe': 0, 'stone_axe': 1, 'iron_axe': 2,
    'golden_axe': 2, 'diamond_axe': 3, 'netherite_axe': 4,
    'wooden_shovel': 0, 'stone_shovel': 1, 'iron_shovel': 2,
    'golden_shovel': 2, 'diamond_shovel': 3, 'netherite_shovel': 4,
};

/**
 * Smelting input → output map.
 * mcData does not include smelting recipes for PC edition — these entries are maintained manually.
 * Wood log variants are NOT listed individually; smeltOutputFor() uses a _log suffix pattern
 * to return 'charcoal' for any *_log name.
 */
export const SMELTING_OUTPUTS = {
    'iron_ore': 'iron_ingot',
    'gold_ore': 'gold_ingot',
    'raw_iron': 'iron_ingot',
    'raw_gold': 'gold_ingot',
    'raw_copper': 'copper_ingot',
    'copper_ore': 'copper_ingot',
    'sand': 'glass',
    'cobblestone': 'stone',
    'clay_ball': 'brick',
    'cactus': 'green_dye',
    'kelp': 'dried_kelp',
    'wet_sponge': 'sponge',
    'potato': 'baked_potato',
    'beef': 'cooked_beef',
    'porkchop': 'cooked_porkchop',
    'chicken': 'cooked_chicken',
    'mutton': 'cooked_mutton',
    'cod': 'cooked_cod',
    'salmon': 'cooked_salmon',
};

export default class RecipeResolver {
    constructor(bot = null) {
        this.bot = bot;
        this._mcData = null;
        this._smeltingOutput = null;
        this._smeltingInput = null;
        this._craftingProducedBy = null;
        this._fuelSet = null;
        this._blockHarvestTools = null;
        this._maxObservedHops = undefined;
        this._fungibleSuffixes = null;
    }

    _getMcData() {
        if (this._mcData) return this._mcData;
        if (!this.bot?.version) return null;
        this._mcData = minecraftData(this.bot.version);
        return this._mcData;
    }

    _buildFungibleSuffixes() {
        if (this._fungibleSuffixes) return;
        const mcData = this._getMcData();
        if (!mcData) {
            this._fungibleSuffixes = FALLBACK_FUNGIBLE_SUFFIXES;
            return;
        }
        const outputToInputSuffixes = new Map();
        for (const [resultIdStr, recipes] of Object.entries(mcData.recipes)) {
            const resultName = mcData.items[resultIdStr]?.name;
            if (!resultName) continue;
            for (const recipe of recipes) {
                const ingredientIds = new Set();
                if (recipe.inShape) {
                    for (const row of recipe.inShape) {
                        for (const cell of row) {
                            if (cell == null || cell === 0 || cell === -1) continue;
                            ingredientIds.add(Array.isArray(cell) ? cell[0] : cell);
                        }
                    }
                } else if (recipe.ingredients) {
                    for (const id of recipe.ingredients) {
                        if (id == null || id === 0 || id === -1) continue;
                        ingredientIds.add(Array.isArray(id) ? id[0] : id);
                    }
                }
                const ingredientNames = [...ingredientIds]
                    .map(id => mcData.items[id]?.name)
                    .filter(Boolean);
                if (!outputToInputSuffixes.has(resultName)) {
                    outputToInputSuffixes.set(resultName, new Map());
                }
                const suffixMap = outputToInputSuffixes.get(resultName);
                for (const name of ingredientNames) {
                    const last = name.lastIndexOf('_');
                    if (last === -1) continue;
                    const suffix = name.slice(last);
                    if (!suffixMap.has(suffix)) suffixMap.set(suffix, new Set());
                    suffixMap.get(suffix).add(name);
                }
            }
        }
        const fungibleSuffixSet = new Set();
        for (const [, suffixMap] of outputToInputSuffixes) {
            for (const [suffix, items] of suffixMap) {
                if (items.size >= 3) {
                    fungibleSuffixSet.add(suffix);
                }
            }
        }
        this._fungibleSuffixes = fungibleSuffixSet.size > 0
            ? [...fungibleSuffixSet]
            : FALLBACK_FUNGIBLE_SUFFIXES;
    }

    getFungibleSuffixes() {
        this._buildFungibleSuffixes();
        return this._fungibleSuffixes;
    }

    isFungible(itemName) {
        const suffixes = this.getFungibleSuffixes();
        return suffixes.some(s => itemName.endsWith(s));
    }

    getFungiblePeers(itemName) {
        const mcData = this._getMcData();
        if (!mcData) return [itemName];
        const suffix = this.getFungibleSuffixes().find(s => itemName.endsWith(s));
        if (!suffix) return [itemName];
        return Object.keys(mcData.itemsByName).filter(n => n.endsWith(suffix));
    }

    _resolveItemId(id) {
        const mcData = this._getMcData();
        if (!mcData) return null;
        return mcData.items[id]?.name ?? null;
    }

    _buildSmeltingMaps() {
        if (this._smeltingOutput) return;
        this._smeltingOutput = new Map(Object.entries(SMELTING_OUTPUTS));
        this._smeltingInput = new Map();
        for (const [input, output] of this._smeltingOutput) {
            if (!this._smeltingInput.has(output)) {
                this._smeltingInput.set(output, new Set());
            }
            this._smeltingInput.get(output).add(input);
        }
    }

    _buildCraftingGraph() {
        if (this._craftingProducedBy) return;
        const mcData = this._getMcData();
        if (!mcData) {
            console.warn('[RecipeResolver] No mcData available — crafting graph empty');
            this._craftingProducedBy = new Map();
            return;
        }
        this._craftingProducedBy = new Map();
        for (const [resultIdStr, recipes] of Object.entries(mcData.recipes)) {
            const resultName = mcData.items[resultIdStr]?.name;
            if (!resultName) continue;
            const recipeSets = [];
            for (const recipe of recipes) {
                const ingredientIds = new Set();
                if (recipe.inShape) {
                    for (const row of recipe.inShape) {
                        for (const cell of row) {
                            if (cell == null || cell === 0 || cell === -1) continue;
                            if (Array.isArray(cell)) {
                                ingredientIds.add(cell[0]);
                            } else {
                                ingredientIds.add(cell);
                            }
                        }
                    }
                } else if (recipe.ingredients) {
                    for (const id of recipe.ingredients) {
                        if (id == null || id === 0 || id === -1) continue;
                        if (Array.isArray(id)) {
                            ingredientIds.add(id[0]);
                        } else {
                            ingredientIds.add(id);
                        }
                    }
                }
                const ingredientNames = new Set();
                for (const id of ingredientIds) {
                    const name = mcData.items[id]?.name;
                    if (name) ingredientNames.add(name);
                }
                if (ingredientNames.size > 0) {
                    recipeSets.push(ingredientNames);
                }
            }
            if (recipeSets.length > 0) {
                this._craftingProducedBy.set(resultName, recipeSets);
            }
        }
    }

    _buildFuelSet() {
        if (this._fuelSet) return;
        this._fuelSet = new Set(FUEL_ITEMS);
    }

    _buildToolRequirementsMap() {
        if (this._blockHarvestTools) return;
        const mcData = this._getMcData();
        if (!mcData) {
            console.warn('[RecipeResolver] No mcData available — tool requirements map empty');
            this._blockHarvestTools = new Map();
            return;
        }
        this._blockHarvestTools = new Map();
        for (const block of Object.values(mcData.blocksByName)) {
            if (!block.harvestTools || Object.keys(block.harvestTools).length === 0) continue;
            const toolNames = new Set();
            for (const toolId of Object.keys(block.harvestTools)) {
                const name = mcData.items[toolId]?.name;
                if (name) toolNames.add(name);
            }
            if (toolNames.size > 0) {
                this._blockHarvestTools.set(block.name, toolNames);
            }
        }
    }

    smeltOutputFor(itemName) {
        this._buildSmeltingMaps();
        const exact = this._smeltingOutput.get(itemName);
        if (exact) return exact;
        if (itemName.endsWith('_log')) return 'charcoal';
        return null;
    }

    smeltInputsFor(outputName) {
        this._buildSmeltingMaps();
        const inputs = this._smeltingInput.get(outputName);
        if (outputName === 'charcoal') {
            const all = new Set(inputs ?? []);
            return all;
        }
        return inputs ? new Set(inputs) : new Set();
    }

    isFuel(itemName) {
        this._buildFuelSet();
        return this._fuelSet.has(itemName);
    }

    canHarvestWith(toolName, blockName) {
        this._buildToolRequirementsMap();
        const tools = this._blockHarvestTools.get(blockName);
        if (!tools) return true;
        return tools.has(toolName);
    }

    getRequiredTool(blockName) {
        this._buildToolRequirementsMap();
        const tools = this._blockHarvestTools.get(blockName);
        if (!tools || tools.size === 0) return null;
        let minTier = Infinity;
        let minTool = null;
        for (const tool of tools) {
            const tier = TOOL_TIER_ORDER[tool];
            if (tier !== undefined && tier < minTier) {
                minTier = tier;
                minTool = tool;
            }
        }
        return minTool;
    }

    craftingProducedBy(itemName) {
        this._buildCraftingGraph();
        return this._craftingProducedBy.get(itemName) ?? null;
    }

    craftingRecipesFor(itemName) {
        const mcData = this._getMcData();
        if (!mcData) return null;
        const itemId = mcData.itemsByName[itemName]?.id;
        if (itemId == null) return null;
        const rawRecipes = mcData.recipes[String(itemId)];
        if (!rawRecipes || rawRecipes.length === 0) return null;

        const results = [];
        for (const recipe of rawRecipes) {
            const countMap = new Map();

            if (recipe.inShape) {
                for (const row of recipe.inShape) {
                    for (const cell of row) {
                        const id = Array.isArray(cell) ? cell[0] : cell;
                        if (id == null || id <= 0) continue;
                        const name = mcData.items[id]?.name;
                        if (name) countMap.set(name, (countMap.get(name) ?? 0) + 1);
                    }
                }
                const requiresTable = recipe.inShape.length > 2 ||
                    recipe.inShape.some(row => row.length > 2);
                results.push({
                    ingredients: [...countMap.entries()].map(([name, count]) => ({ name, count })),
                    outputCount: recipe.result?.count ?? 1,
                    requiresTable
                });
            } else if (recipe.ingredients) {
                for (const id of recipe.ingredients) {
                    const realId = Array.isArray(id) ? id[0] : id;
                    if (realId == null || realId <= 0) continue;
                    const name = mcData.items[realId]?.name;
                    if (name) countMap.set(name, (countMap.get(name) ?? 0) + 1);
                }
                results.push({
                    ingredients: [...countMap.entries()].map(([name, count]) => ({ name, count })),
                    outputCount: recipe.result?.count ?? 1,
                    requiresTable: countMap.size > 4
                });
            }
        }
        return results.length > 0 ? results : null;
    }

    _getFungibleCandidates(suffix) {
        const mcData = this._getMcData();
        if (!mcData) return [];
        return Object.keys(mcData.itemsByName).filter(n => n.endsWith(suffix));
    }

    _countFungibleInInventory(suffix, virtualInventory) {
        return this._getFungibleCandidates(suffix)
            .reduce((sum, name) => sum + (virtualInventory.get(name) ?? 0), 0);
    }

    resolveDependencyChain(targetItem, inventoryMap, neededCount = 1) {
        const steps = [];
        const visited = new Set();
        const virtualInventory = new Map(inventoryMap);
        this._expandDep(targetItem, neededCount, steps, visited, virtualInventory);
        return steps;
    }

    _expandDep(itemName, neededCount, steps, visited, virtualInventory) {
        // Fungible group check: count all variants in virtual inventory.
        // Only short-circuit to collect_freeform for items WITHOUT crafting recipes
        // (e.g., logs are found in the world). Craftable fungible items (planks, beds,
        // carpets) must go through the crafting path so ingredient resolution works.
        const fungibleSuffix = this.getFungibleSuffixes().find(s => itemName.endsWith(s));
        if (fungibleSuffix) {
            const totalHave = this._countFungibleInInventory(fungibleSuffix, virtualInventory);
            if (totalHave >= neededCount) return;
            // If this item has a crafting recipe, don't short-circuit — let the
            // crafting path handle it so it resolves ingredients recursively.
            const hasRecipe = this.craftingRecipesFor(itemName) ||
                this.smeltInputsFor(itemName).size > 0;
            if (!hasRecipe) {
                const stillNeed = neededCount - totalHave;
                if (visited.has(itemName)) return;
                visited.add(itemName);
                steps.push({ acquire: itemName, count: stillNeed, via: 'collect_freeform', station: null });
                virtualInventory.set(itemName, (virtualInventory.get(itemName) ?? 0) + stillNeed);
                visited.delete(itemName);
                return;
            }
        }

        const have = virtualInventory.get(itemName) ?? 0;
        if (have >= neededCount) return;
        const stillNeed = neededCount - have;

        if (visited.has(itemName)) return;
        visited.add(itemName);

        const smeltInputs = this.smeltInputsFor(itemName);
        if (smeltInputs.size > 0) {
            let bestInput = null;
            for (const inp of smeltInputs) {
                if ((virtualInventory.get(inp) ?? 0) > 0) { bestInput = inp; break; }
            }
            if (!bestInput) bestInput = [...smeltInputs][0];

            if ((virtualInventory.get('furnace') ?? 0) === 0) {
                this._expandDep('furnace', 1, steps, visited, virtualInventory);
            }
            this._expandDep(bestInput, stillNeed, steps, visited, virtualInventory);
            steps.push({ acquire: itemName, count: stillNeed, via: 'smelt', station: 'furnace',
                consumes: { [bestInput]: stillNeed } });
            virtualInventory.set(itemName, have + stillNeed);
            visited.delete(itemName);
            return;
        }

        const recipes = this.craftingRecipesFor(itemName);
        if (recipes && recipes.length > 0) {
            let bestRecipe = recipes[0];
            let bestScore = -1;
            for (const r of recipes) {
                const score = r.ingredients.reduce((s, ing) =>
                    s + Math.min(virtualInventory.get(ing.name) ?? 0, ing.count), 0);
                if (score > bestScore) { bestScore = score; bestRecipe = r; }
            }

            const craftsNeeded = Math.ceil(stillNeed / bestRecipe.outputCount);

            if (bestRecipe.requiresTable && (virtualInventory.get('crafting_table') ?? 0) === 0) {
                this._expandDep('crafting_table', 1, steps, visited, virtualInventory);
            }

            for (const ing of bestRecipe.ingredients) {
                this._expandDep(ing.name, ing.count * craftsNeeded, steps, visited, virtualInventory);
            }

            steps.push({ acquire: itemName, count: stillNeed, via: 'craft',
                station: bestRecipe.requiresTable ? 'crafting_table' : null,
                consumes: Object.fromEntries(
                    bestRecipe.ingredients.map(ing => [ing.name, ing.count * craftsNeeded])
                ) });
            virtualInventory.set(itemName, have + craftsNeeded * bestRecipe.outputCount);
            visited.delete(itemName);
            return;
        }

        steps.push({ acquire: itemName, count: stillNeed, via: 'collect', station: null });
        virtualInventory.set(itemName, have + stillNeed);
        visited.delete(itemName);
    }

    resolveInventoryAlias(genericName, inventoryMap) {
        if (inventoryMap?.get(genericName) > 0) return genericName;
        const mcData = this._getMcData();
        if (!mcData) return genericName;
        const candidates = [];
        const lower = genericName.toLowerCase();
        for (const [name, item] of Object.entries(mcData.itemsByName)) {
            if (name.toLowerCase().includes(lower)) {
                candidates.push(item.name);
            }
        }
        if (candidates.length === 0) return genericName;
        let bestMatch = null;
        let bestCount = 0;
        for (const candidate of candidates) {
            const count = inventoryMap?.get(candidate) ?? 0;
            if (count > bestCount) {
                bestCount = count;
                bestMatch = candidate;
            }
        }
        if (bestMatch) return bestMatch;
        if (mcData.itemsByName[genericName]) return genericName;
        return genericName;
    }

    calcStaticHops(itemName, inventoryMap, _depth = 0, _visited = new Set()) {
        if (_depth >= MAX_HOP_DEPTH) return Infinity;
        if (_visited.has(itemName)) return Infinity;
        if ((inventoryMap?.get(itemName) ?? 0) > 0) return 0;
        // Fungible: any _log or _planks variant in inventory counts as satisfied (0 hops)
        const fungibleSuffix = this.getFungibleSuffixes().find(s => itemName.endsWith(s));
        if (fungibleSuffix) {
            const haveAny = this._getFungibleCandidates(fungibleSuffix)
                .some(c => (inventoryMap?.get(c) ?? 0) > 0);
            if (haveAny) return 0;
        }

        let bestHop = Infinity;
        const nextVisited = new Set([..._visited, itemName]);

        const smeltInputs = this.smeltInputsFor(itemName);
        for (const input of smeltInputs) {
            const hops = this.calcStaticHops(input, inventoryMap, _depth + 1, nextVisited);
            if (hops !== Infinity && hops + 1 < bestHop) {
                bestHop = hops + 1;
            }
        }

        const recipes = this.craftingProducedBy(itemName);
        if (recipes) {
            for (const ingredientSet of recipes) {
                let maxIngredientHops = 0;
                let allFeasible = true;
                for (const ingredient of ingredientSet) {
                    const hops = this.calcStaticHops(ingredient, inventoryMap, _depth + 1, nextVisited);
                    if (hops === Infinity) {
                        allFeasible = false;
                        break;
                    }
                    if (hops > maxIngredientHops) maxIngredientHops = hops;
                }
                if (allFeasible && maxIngredientHops + 1 < bestHop) {
                    bestHop = maxIngredientHops + 1;
                }
            }
        }

        return bestHop;
    }

    getMaxObservedHops() {
        if (this._maxObservedHops !== undefined) return this._maxObservedHops;

        const mcData = this._getMcData();
        if (!mcData) {
            console.warn('[RecipeResolver] No mcData available, using default maxObservedHops=4');
            this._maxObservedHops = 4;
            return 4;
        }

        const emptyMap = new Map();
        let maxHops = 0;
        let checked = 0;
        const MAX_CHECK = 50;

        for (const [name] of Object.entries(mcData.itemsByName)) {
            if (checked >= MAX_CHECK) break;
            const hasRecipe = this.craftingProducedBy(name) || this.smeltInputsFor(name).size > 0;
            if (!hasRecipe) continue;
            const hops = this.calcStaticHops(name, emptyMap);
            if (hops !== Infinity && hops > maxHops) {
                maxHops = hops;
            }
            checked++;
        }

        if (maxHops === 0) {
            console.warn('[RecipeResolver] No finite hops found in sample, using default maxObservedHops=4');
            maxHops = 4;
        }

        this._maxObservedHops = maxHops;
        return maxHops;
    }
}
