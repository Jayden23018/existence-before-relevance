/**
 * SAER Scorer - State-Aware Example Retrieval
 *
 * Replaces naive `examples.slice(0, count)` with a 5-dimensional scoring system:
 *   1. Ingredient Overlap Score  - Jaccard similarity of crafting ingredients (material tier match)
 *   2. Keyword Overlap Score     - token overlap between user input and example name/slug
 *   3. Mining Tier Gap Score     - whether player's pickaxe can mine blocks the example requires
 *   4. Level Proximity Score     - difficulty level alignment between user input and example
 *   5. Prereq Chain Overlap      - Jaccard of full static production graph nodes (BM25-invisible)
 *
 * Default composite  = 0.40 * ingredient + 0.30 * keyword + 0.20 * miningTierGap + 0.10 * level
 * Cold-start         = 0.50 * ingredient + 0.35 * keyword + 0.00 * miningTierGap + 0.15 * level
 *
 * calcPrereqChainOverlap (dim 5) is implemented but weight=0 — empirically did not
 * improve 60-task TCR over 4dim; caused regression on qwen3-8b (docs/decisions/saer-5dim-prereq-chain.md)
 */

import { FUEL_ITEMS } from './precondition_parser.js';
import RecipeResolver, { TOOL_TIER_ORDER } from './recipe_resolver.js';

const DEFAULT_WEIGHTS = {
    ingredient: 0.40,
    keyword: 0.30,
    miningTierGap: 0.20,
    level: 0.10
};

const COLD_START_WEIGHTS = {
    ingredient: 0.50,
    keyword: 0.35,
    miningTierGap: 0.00,
    level: 0.15
};

const STOPWORDS = new Set([
    'a', 'an', 'the', 'make', 'craft', 'create', 'build', 'please',
    'can', 'you', 'me', 'i', 'want', 'need', 'to', 'how', 'my', 'for',
    'get', 'of', 'and', 'some', 'one', 'with'
]);

// Level estimation keyword maps
const L1_INDICATORS = ['wooden', 'wood', 'simple', 'basic', 'easy', 'stone', 'cobblestone', 'leather'];
const L3_INDICATORS = [
    'diamond', 'enchanted', 'enchanting', 'complex',
    'anvil', 'brewing', 'beacon', 'ender',
    'iron sword', 'iron pickaxe', 'iron helmet', 'iron chestplate',
    'iron leggings', 'iron boots', 'iron axe'
];
const L4_INDICATORS = ['netherite', 'elytra', 'end', 'dragon', 'wither', 'shulker', 'nether_star'];
const L2_INDICATORS = ['gold', 'golden', 'steel', 'chain', 'bucket', 'shield', 'furnace', 'iron_ingot'];

export class SAERScorer {
    /**
     * @param {boolean} debug - Enable debug logging
     * @param {object} weights - Optional custom weights { ingredient, keyword, miningTierGap, level }
     * @param {object} coldStartWeights - Optional custom cold-start weights
     */
    constructor(debug = false, weights = null, coldStartWeights = null, recipeResolver = null) {
        this.debug = debug;
        this.weights = weights || { ...DEFAULT_WEIGHTS };
        this.coldStartWeights = coldStartWeights || { ...COLD_START_WEIGHTS };
        this.recipeResolver = recipeResolver ?? new RecipeResolver(null);
    }

    setRecipeResolver(resolver) {
        this.recipeResolver = resolver;
    }

    _normalizeHops(hops) {
        if (hops === 0) return 0;
        if (hops === Infinity || hops === undefined) return 1;
        const max = this.recipeResolver.getMaxObservedHops();
        return Math.min(1, hops / max);
    }

    _extractItemFromPrecondition(cond) {
        const lower = cond.toLowerCase();

        // Pattern 1: "3x Iron Ingot" → iron_ingot
        const itemMatch = lower.match(/(\d+)x?\s+(.+)/);
        if (itemMatch) {
            return itemMatch[2].trim().replace(/\s+/g, '_');
        }

        // Pattern 3: crafting table
        if (lower.includes('crafting table') || lower.includes('crafting_table')) return 'crafting_table';

        // Pattern 4: furnace
        if (lower.includes('furnace')) return 'furnace';

        // Pattern 9: "X in inventory"
        const invMatch = lower.match(/(.+?)\s+in\s+(your\s+)?inventory/);
        if (invMatch) {
            return invMatch[1].trim().replace(/\s+/g, '_');
        }

        return null;
    }

    /**
     * Main entry: score all examples and return top-k.
     *
     * @param {string} userInput - Raw user input, e.g. "make an iron axe"
     * @param {Array} examples - Training examples from the category
     * @param {object} agentState - { inventory: [{ name, count }], nearbyBlocks: [string] }
     * @param {number} topK - Number of examples to return (default 3)
     * @returns {Array} Top-k examples sorted by score descending, each with `_saerScore` field
     */
    selectExamples(userInput, examples, agentState, topK = 3) {
        if (!examples || examples.length === 0) return [];
        if (examples.length <= topK) {
            // Not enough examples to rank, return as-is
            return examples.map(ex => ({ ...ex, _saerScore: 1.0 }));
        }

        const scored = examples.map(example => {
            const composite = this.calcCompositeScore(userInput, example, agentState);
            return { ...example, _saerScore: composite };
        });

        scored.sort((a, b) => b._saerScore - a._saerScore);

        if (this.debug) {
            console.log('\n' + '='.repeat(70));
            console.log('[SAER] Full ranking:');
            scored.forEach((ex, idx) => {
                console.log(`  #${idx + 1}: ${ex.name} (score: ${ex._saerScore.toFixed(3)})`);
            });
            console.log('='.repeat(70));
        }

        return scored.slice(0, topK);
    }

    // ─── Dimension 1: Precondition Gap Score ───────────────────────────

    /**
     * Calculate how well the agent's current state matches an example's preconditions.
     *
     * Cold-start (empty inventory): returns tool chain depth / 3,
     * so examples with complete tool chains score higher.
     *
     * Non-cold-start: averages gap distances across ALL steps with inventory
     * preconditions. Earlier steps that are already satisfied push the score up;
     * later steps requiring items far from current inventory pull it down.
     * This naturally rewards examples whose complexity matches the player's
     * current progress (e.g., L2 iron examples score higher than L3 diamond
     * examples when player already has a wooden_pickaxe).
     *
     * @param {object} example - Training example with .plan array
     * @param {object} agentState - { inventory: [...], nearbyBlocks: [...] }
     * @returns {number} Score between 0.0 and 1.0
     */
    calcPreconditionGapScore(example, agentState) {
        if (this._isColdStart(agentState)) {
            const depth = this._calcToolChainDepth(example);
            return depth / 3;
        }

        const plan = example.plan || [];
        const inventory = agentState.inventory || [];
        const nearbyBlocks = agentState.nearbyBlocks || [];
        const inventoryMap = this.buildInventoryMap(inventory);
        const inventoryMapForHops = new Map(Object.entries(inventoryMap));

        // Aggregate gap distances across ALL steps that have inventory preconditions.
        // Steps without inventory preconditions (e.g. "access: trees") are skipped.
        const allDistances = [];
        for (const step of plan) {
            if (!step?.preconditions) continue;
            const stepWrapper = { plan: [step] };
            const preconditions = this.flattenExamplePreconditions(stepWrapper);
            if (preconditions.length === 0) continue;

            for (const cond of preconditions) {
                const result = this.checkPrecondition(cond, inventoryMap, nearbyBlocks);
                if (!result.parseable) continue;

                if (result.satisfied) {
                    allDistances.push(0);
                } else {
                    const itemName = this._extractItemFromPrecondition(cond);
                    if (itemName) {
                        const hops = this.recipeResolver.calcStaticHops(itemName, inventoryMapForHops);
                        allDistances.push(this._normalizeHops(hops));
                    }
                    // else: access/environment condition (e.g. "Access to trees") —
                    // skip, not an inventory requirement, should not inflate distance.
                }
            }
        }

        // No inventory preconditions found → example has no tool requirements.
        // Fall back to cold-start tool chain depth to rank trivial examples lower
        // than examples requiring the player's current tools.
        if (allDistances.length === 0) {
            return this._calcToolChainDepth(example) / 3;
        }
        const meanDistance = allDistances.reduce((a, b) => a + b, 0) / allDistances.length;
        return 1 - meanDistance;
    }

    /**
     * Compute tool chain depth (0-3) for an example.
     * Used during cold-start to prefer examples with complete tool chains.
     *
     * +1 if plan has collectBlocks steps
     * +1 if plan has smeltItem steps
     * +1 if preconditions mention pickaxe
     */
    _calcToolChainDepth(example) {
        if (!example.plan) return 0;
        let depth = 0;

        const allCmds = example.plan.flatMap(s => s.action_cmd || []);
        if (allCmds.some(c => c.includes('collectBlocks'))) depth += 1;
        if (allCmds.some(c => c.includes('smeltItem'))) depth += 1;

        const allPrecondStrings = this.flattenExamplePreconditions(example).join(' ').toLowerCase();
        if (allPrecondStrings.includes('pickaxe')) depth += 1;

        return depth;
    }

    // ─── Dimension 1: Ingredient Overlap Score ────────────────────────

    /**
     * Infer the target item name from user input text.
     * Uses bigram/trigram matching against known craftable items.
     * Returns null if no craftable item can be inferred (e.g., for collect tasks).
     *
     * @param {string} userInput
     * @returns {string|null} Snake-case item name, or null
     */
    _inferTargetItem(userInput) {
        const words = (userInput || '').toLowerCase().match(/[a-z]+/g) || [];
        const filtered = words.filter(w => !STOPWORDS.has(w));

        const isKnownCraftable = (name) => {
            return this.recipeResolver.craftingRecipesFor(name) !== null;
        };

        // Try bigrams first (most common: "iron_axe", "wooden_pickaxe")
        for (let i = 0; i < filtered.length - 1; i++) {
            const bigram = `${filtered[i]}_${filtered[i + 1]}`;
            if (isKnownCraftable(bigram)) return bigram;
        }

        // Try trigrams (rare: "diamond_horse_armor")
        for (let i = 0; i < filtered.length - 2; i++) {
            const trigram = `${filtered[i]}_${filtered[i + 1]}_${filtered[i + 2]}`;
            if (isKnownCraftable(trigram)) return trigram;
        }

        // Try single words (e.g., "furnace", "shield", "bow")
        for (const word of filtered) {
            if (isKnownCraftable(word)) return word;
        }

        // Try de-pluralised single words ("torches" → "torch", "swords" → "sword")
        for (const word of filtered) {
            if (word.endsWith('es') && isKnownCraftable(word.slice(0, -2))) return word.slice(0, -2);
            if (word.endsWith('s')  && isKnownCraftable(word.slice(0, -1))) return word.slice(0, -1);
        }

        return null;
    }

    /**
     * Get the set of top-level ingredient names for an item.
     * Returns an empty Set if the item has no crafting recipe.
     *
     * @param {string} itemName - Snake-case item name
     * @returns {Set<string>}
     */
    _getIngredientSet(itemName) {
        if (!itemName) return new Set();
        const recipes = this.recipeResolver.craftingRecipesFor(itemName);
        if (!recipes || recipes.length === 0) return new Set();
        const ingredients = recipes[0].ingredients || [];
        return new Set(ingredients.map(ing => ing.name).filter(Boolean));
    }

    /**
     * Extract the target item name from a training example.
     * Uses the slug's last path component (e.g., "crafting/iron_axe" → "iron_axe"),
     * falling back to text inference from the example name.
     *
     * @param {object} example - Training example with .slug and .name
     * @returns {string|null}
     */
    _inferExampleItem(example) {
        if (example.slug) {
            const parts = example.slug.split('/');
            return parts[parts.length - 1];
        }
        return this._inferTargetItem(example.name || '');
    }

    /**
     * Calculate Jaccard similarity between the query item's crafting ingredients
     * and the example item's crafting ingredients.
     *
     * Items sharing the same materials (e.g., iron_axe and iron_sword both use
     * iron_ingot + stick) score higher together, while cross-tier items (iron vs
     * diamond, iron vs stone) score lower.  Returns 0.0 if either side has no
     * known crafting recipe (e.g., collect tasks — keyword handles those instead).
     *
     * @param {string} userInput - Raw user request text
     * @param {object} example - Training example with .slug/.name and .plan
     * @returns {number} Jaccard similarity in [0.0, 1.0]
     */
    calcIngredientOverlapScore(userInput, example) {
        const queryItem = this._inferTargetItem(userInput);
        if (!queryItem) return 0.0;

        const queryIngredients = this._getIngredientSet(queryItem);
        if (queryIngredients.size === 0) return 0.0;

        const exampleItem = this._inferExampleItem(example);
        const exampleIngredients = this._getIngredientSet(exampleItem);
        if (exampleIngredients.size === 0) return 0.0;

        // Jaccard: |A ∩ B| / |A ∪ B|
        const intersection = [...queryIngredients].filter(ing => exampleIngredients.has(ing));
        const union = new Set([...queryIngredients, ...exampleIngredients]);
        return intersection.length / union.size;
    }

    // ─── Dimension 3: Mining Tier Gap Score ───────────────────────────

    /**
     * Get the maximum pickaxe tier required by collectBlocks commands in an example.
     * Scans all action_cmd arrays for `collectBlocks('block', n)` calls and looks
     * up the harvest tool requirement from mcData via RecipeResolver.
     *
     * @param {object} example - Training example with .plan array
     * @returns {number} Maximum tier required (0=wooden…4=netherite), or -1 if no pickaxe needed
     */
    _getExampleRequiredPickaxeTier(example) {
        if (!example.plan) return -1;
        let maxTier = -1;

        for (const step of example.plan) {
            for (const cmd of (step.action_cmd || [])) {
                const match = cmd.match(/collectBlocks\(['"]([\w]+)['"]/);
                if (!match) continue;
                const blockName = match[1];
                const toolName = this.recipeResolver.getRequiredTool(blockName);
                if (toolName !== null && toolName !== undefined) {
                    const tier = TOOL_TIER_ORDER[toolName];
                    if (tier !== undefined) {
                        maxTier = Math.max(maxTier, tier);
                    }
                }
            }
        }
        return maxTier;
    }

    /**
     * Calculate mining tier gap score.
     *
     * Measures whether the player's current pickaxe can mine the blocks the
     * example requires.  High score = player can already mine (or no mining
     * needed).  Low score = example needs a better pickaxe than the player has.
     *
     * Formula: 1 - max(0, requiredTier - playerBestTier) / 3
     * Cold start (empty inventory): returns 0.5 — neutral, and miningTierGap
     * weight is 0.00 in cold-start mode so the value is irrelevant.
     *
     * @param {object} example - Training example with .plan array
     * @param {object} agentState - { inventory: [...], nearbyBlocks: [...] }
     * @returns {number} Score in [0.0, 1.0]
     */
    calcMiningTierGap(example, agentState) {
        if (this._isColdStart(agentState)) return 0.5;

        const requiredTier = this._getExampleRequiredPickaxeTier(example);
        if (requiredTier === -1) return 1.0; // No mining required → perfect match

        // Find player's best pickaxe tier
        const inventory = agentState.inventory || [];
        const inventoryMap = this.buildInventoryMap(inventory);
        let playerBestTier = -1;
        for (const itemName of Object.keys(inventoryMap)) {
            if (!itemName.endsWith('_pickaxe')) continue;
            const tier = TOOL_TIER_ORDER[itemName];
            if (tier !== undefined) {
                playerBestTier = Math.max(playerBestTier, tier);
            }
        }

        // Score = 1 - max(0, requiredTier - playerBestTier) / 3
        const gap = Math.max(0, requiredTier - playerBestTier);
        return 1 - gap / 3;
    }

    /**
     * Check a single precondition against agent state.
     *
     * @returns {{ parseable: boolean, satisfied: boolean }}
     */
    checkPrecondition(cond, inventoryMap, nearbyBlocks) {
        const lower = cond.toLowerCase();

        // Pattern 1: Item count - "3x Iron Ingot", "2x Stick"
        const itemMatch = lower.match(/(\d+)x?\s+(.+)/);
        if (itemMatch) {
            const count = parseInt(itemMatch[1]);
            const rawName = itemMatch[2].trim();
            const normalizedName = rawName.toLowerCase().replace(/\s+/g, '_');

            // Skip unparseable "items" like "inventory space"
            if (this.isUnparseableItem(normalizedName)) {
                return { parseable: false, satisfied: false };
            }

            const hasItem = (inventoryMap[normalizedName] || 0) >= count;
            if (hasItem) return { parseable: true, satisfied: true };

            // Tool tier upward compatibility:
            // "1x wooden_pickaxe" is satisfied by stone_pickaxe (higher tier ≥ required tier).
            // This reflects Minecraft mechanics — any better tool also satisfies the minimum.
            const reqTier = TOOL_TIER_ORDER[normalizedName];
            if (reqTier !== undefined) {
                const hasBetterTool = Object.entries(inventoryMap).some(([name, cnt]) => {
                    const t = TOOL_TIER_ORDER[name];
                    return t !== undefined && t >= reqTier && cnt >= count;
                });
                return { parseable: true, satisfied: hasBetterTool };
            }

            return { parseable: true, satisfied: false };
        }

        // Pattern 2: Tool in inventory - "Stone Pickaxe in inventory"
        const toolMatch = lower.match(/(pickaxe|axe|shovel|sword|hoe)/i);
        if (toolMatch && lower.includes('in inventory')) {
            const toolType = toolMatch[1];
            const hasTool = Object.keys(inventoryMap).some(name => name.includes(toolType));
            return { parseable: true, satisfied: hasTool };
        }

        // Pattern 3: Crafting table
        if (lower.includes('crafting table') || lower.includes('crafting_table')) {
            const hasInInventory = (inventoryMap['crafting_table'] || 0) > 0;
            const hasNearby = nearbyBlocks.includes('crafting_table');
            return { parseable: true, satisfied: hasInInventory || hasNearby };
        }

        // Pattern 4: Furnace
        if (lower.includes('furnace')) {
            const hasInInventory = (inventoryMap['furnace'] || 0) > 0;
            const hasNearby = nearbyBlocks.includes('furnace');
            return { parseable: true, satisfied: hasInInventory || hasNearby };
        }

        // Pattern 5: Fuel source - "At least 1 fuel source (coal, charcoal, or wood)"
        if (/\bfuel\b/.test(lower)) {
            const hasFuel = Object.keys(inventoryMap).some(name => FUEL_ITEMS.has(name));
            return { parseable: true, satisfied: hasFuel };
        }

        // Pattern 6: Access to trees / wood / logs
        if (/\btrees?\b/.test(lower) || /\bwood\b/.test(lower) || /\blog(s)?\b/.test(lower)) {
            if (lower.includes('access to') || lower.includes('nearby')) {
                const hasNearby = nearbyBlocks.includes('trees');
                const hasLogs = Object.keys(inventoryMap).some(n => n.includes('log'));
                return { parseable: true, satisfied: hasNearby || hasLogs };
            }
        }

        // Pattern 7: Access to stone / underground / cave
        if (/\bstone\b/.test(lower) || lower.includes('underground') || lower.includes('cave')) {
            if (lower.includes('access to')) {
                const hasNearby = nearbyBlocks.includes('stone_area');
                return { parseable: true, satisfied: hasNearby };
            }
        }

        // Pattern 8: Weapon equipped / combat gear
        if (lower.includes('weapon') || lower.includes('equipped') || lower.includes('gear')) {
            const hasWeapon = Object.keys(inventoryMap).some(n =>
                n.includes('sword') || n.includes('axe')
            );
            return { parseable: true, satisfied: hasWeapon };
        }

        // Pattern 9: Generic item check - "Log in inventory", "Building materials in inventory"
        if (lower.includes('in inventory') || lower.includes('in your inventory')) {
            // Try to extract the item name before "in inventory"
            const invMatch = lower.match(/(.+?)\s+in\s+(your\s+)?inventory/);
            if (invMatch) {
                const itemName = invMatch[1].trim().replace(/\s+/g, '_');
                // Skip vague items
                if (this.isUnparseableItem(itemName)) {
                    return { parseable: false, satisfied: false };
                }
                const hasItem = Object.keys(inventoryMap).some(n =>
                    n.includes(itemName) || itemName.includes(n)
                );
                return { parseable: true, satisfied: hasItem };
            }
        }

        // Not parseable - skip
        return { parseable: false, satisfied: false };
    }

    /**
     * Check if an item name is too vague to parse meaningfully.
     */
    isUnparseableItem(name) {
        const unparseable = [
            'inventory_space', 'enough_inventory_space', 'enough',
            'building_materials', 'materials', 'resources', 'flat_ground',
            'access_to_materials', 'combat_gear', 'item'
        ];
        return unparseable.some(u => name.includes(u));
    }

    /**
     * Build a map from inventory array for O(1) lookups.
     */
    buildInventoryMap(inventory) {
        const map = {};
        for (const item of inventory) {
            map[item.name] = (map[item.name] || 0) + item.count;
        }
        return map;
    }

    // ─── Dimension 2: Keyword Overlap Score ───────────────────────────

    /**
     * Calculate keyword overlap between user input and example name/slug.
     *
     * Algorithm:
     * 1. Tokenize userInput: split, lowercase, remove stopwords
     * 2. Tokenize example.name + example.slug: same process
     * 3. Score = sharedCount / max(inputTokens.length, exampleTokens.length)
     *
     * @param {string} userInput
     * @param {object} example - with .name and .slug fields
     * @returns {number} Score between 0.0 and 1.0
     */
    calcKeywordScore(userInput, example) {
        const inputTokens = this.tokenize(userInput);
        const nameTokens = this.tokenize(example.name || '');
        const slugTokens = this.tokenizeSlug(example.slug || '');

        // Combine name and slug tokens
        const exampleTokens = new Set([...nameTokens, ...slugTokens]);

        if (inputTokens.length === 0 || exampleTokens.size === 0) return 0.0;

        let sharedCount = 0;
        for (const token of inputTokens) {
            if (exampleTokens.has(token)) {
                sharedCount++;
            }
        }

        const denominator = Math.max(inputTokens.length, exampleTokens.size);
        return sharedCount / denominator;
    }

    /**
     * Tokenize a string: lowercase, split, remove stopwords and short tokens.
     */
    tokenize(text) {
        if (!text) return [];
        return text
            .toLowerCase()
            .split(/[\s/-_,]+/)
            .filter(t => t.length > 1 && !STOPWORDS.has(t));
    }

    /**
     * Tokenize a slug: strip path prefix, replace underscores with spaces.
     */
    tokenizeSlug(slug) {
        if (!slug) return [];
        // Strip path prefix: "crafting/iron_axe" → "iron_axe"
        const parts = slug.split('/');
        const base = parts[parts.length - 1];
        // Replace underscores with spaces, then tokenize
        const asText = base.replace(/_/g, ' ');
        return this.tokenize(asText);
    }

    // ─── Dimension 3: Level Proximity Score ───────────────────────────

    /**
     * Score based on difficulty level alignment.
     *
     * Algorithm:
     * 1. Estimate target difficulty from user input keywords
     * 2. Parse example.level: "L1" → 1, "L2" → 2, etc.
     * 3. Score = 1.0 - (|estimatedLevel - exampleLevel| / maxRange)
     *
     * @param {string} userInput
     * @param {object} example - with .level field like "L1"
     * @returns {number} Score between 0.0 and 1.0
     */
    calcLevelScore(userInput, example) {
        const estimatedLevel = this.estimateLevel(userInput);
        const exampleLevel = this.parseLevel(example.level);
        const maxRange = 3; // L1 to L4

        return 1.0 - (Math.abs(estimatedLevel - exampleLevel) / maxRange);
    }

    /**
     * Estimate target difficulty from user input keywords.
     */
    estimateLevel(userInput) {
        const lower = (userInput || '').toLowerCase();

        // Check L4 first (most specific)
        if (L4_INDICATORS.some(kw => lower.includes(kw))) return 4;
        // Then L3
        if (L3_INDICATORS.some(kw => lower.includes(kw))) return 3;
        // Then L2
        if (L2_INDICATORS.some(kw => lower.includes(kw))) return 2;
        // Then L1
        if (L1_INDICATORS.some(kw => lower.includes(kw))) return 1;

        // Default to L2 (most common tasks)
        return 2;
    }

    /**
     * Parse level string to number: "L1" → 1, "L2" → 2, etc.
     */
    parseLevel(level) {
        if (!level) return 2; // Default
        const match = level.match(/L(\d)/i);
        return match ? parseInt(match[1]) : 2;
    }

    // ─── Composite Score ──────────────────────────────────────────────

    /**
     * Calculate final composite score for a single example.
     *
     * Normal weights:     ingredient=0.40, keyword=0.30, miningTierGap=0.20, level=0.10
     * Cold-start weights: ingredient=0.50, keyword=0.35, miningTierGap=0.00, level=0.15
     *
     * @returns {number} Weighted sum of all dimensions
     */
    calcCompositeScore(userInput, example, agentState) {
        const ingScore   = this.calcIngredientOverlapScore(userInput, example);
        const kwScore    = this.calcKeywordScore(userInput, example);
        const mineScore  = this.calcMiningTierGap(example, agentState);
        const lvlScore   = this.calcLevelScore(userInput, example);
        const chainScore = this.calcPrereqChainOverlap(userInput, example);

        const coldStart = this._isColdStart(agentState);
        const weights   = coldStart ? this.coldStartWeights : this.weights;

        const composite = (weights.ingredient    || 0) * ingScore
                        + (weights.keyword       || 0) * kwScore
                        + (weights.miningTierGap || 0) * mineScore
                        + (weights.level         || 0) * lvlScore
                        + (weights.prereqChain   || 0) * chainScore;

        if (this.debug) {
            console.log(`[SAER] ${example.name}: ingr=${ingScore.toFixed(3)} kw=${kwScore.toFixed(3)} mine=${mineScore.toFixed(3)} lvl=${lvlScore.toFixed(3)} chain=${chainScore.toFixed(3)} → ${composite.toFixed(3)}${coldStart ? ' (cold-start)' : ''}`);
        }

        return composite;
    }

    // ─── Dimension 5: Prerequisite Chain Overlap ──────────────────────

    /**
     * Extract the full static production chain for an item as a Set of node names.
     * Nodes = all acquire targets + non-null stations (workstations).
     * Returns empty Set if the item has no recipe or resolver has no mcData.
     *
     * Memoized per item name since the chain is static (empty inventory).
     *
     * @param {string} itemName
     * @returns {Set<string>}
     */
    _extractChainNodes(itemName) {
        if (!this._chainNodeCache) this._chainNodeCache = new Map();
        if (this._chainNodeCache.has(itemName)) return this._chainNodeCache.get(itemName);

        const nodes = new Set();
        try {
            const steps = this.recipeResolver.resolveDependencyChain(itemName, new Map());
            for (const step of steps) {
                nodes.add(step.acquire);
                if (step.station) nodes.add(step.station);
            }
        } catch {
            // fall through → empty set (null resolver or unknown item)
        }

        this._chainNodeCache.set(itemName, nodes);
        return nodes;
    }

    /**
     * Jaccard similarity between the full prerequisite chains of the query item
     * and the example item.
     *
     * Captures multi-hop production graph structure that BM25 keyword matching
     * cannot see. Examples: "shield" and "iron_pickaxe" share no keywords but
     * both require furnace + smelt(raw_iron) → iron_ingot; "iron_sword" and
     * "wooden_sword" match on "sword" keyword but have different smelt chains.
     *
     * Returns 0.0 when:
     *   - No craftable target can be inferred from user input (collect tasks)
     *   - Either item has no known recipe (resolver has no mcData)
     *
     * @param {string} userInput
     * @param {object} example - with .slug/.name
     * @returns {number} Jaccard similarity in [0.0, 1.0]
     */
    calcPrereqChainOverlap(userInput, example) {
        const queryItem = this._inferTargetItem(userInput);
        if (!queryItem) return 0.0;

        const exampleItem = this._inferExampleItem(example);
        if (!exampleItem) return 0.0;

        const queryNodes = this._extractChainNodes(queryItem);
        if (queryNodes.size === 0) return 0.0;

        const exampleNodes = this._extractChainNodes(exampleItem);
        if (exampleNodes.size === 0) return 0.0;

        const intersection = [...queryNodes].filter(n => exampleNodes.has(n));
        const union = new Set([...queryNodes, ...exampleNodes]);
        return intersection.length / union.size;
    }

    // ─── Helpers ──────────────────────────────────────────────────────

    /**
     * Extract all precondition strings from all steps of an example.
     *
     * @param {object} example - Training example with .plan array
     * @returns {string[]} Flat array of all precondition strings (deduplicated)
     */
    flattenExamplePreconditions(example) {
        if (!example.plan) return [];
        const allPreconditions = [];
        for (const step of example.plan) {
            if (!step.preconditions) continue;

            if (Array.isArray(step.preconditions)) {
                // Legacy format: string array
                allPreconditions.push(...step.preconditions);
            } else if (typeof step.preconditions === 'object') {
                // Structured format per DATA_SPEC.md
                const pre = step.preconditions;
                const items = pre.items || {};

                if (items.inventory) {
                    for (const entry of items.inventory) {
                        if (entry.includes(':')) {
                            const [item, count] = entry.split(':');
                            allPreconditions.push(`${count}x ${item.replace(/_/g, ' ')}`);
                        } else {
                            allPreconditions.push(`${entry.replace(/_/g, ' ')} in inventory`);
                        }
                    }
                }
                if (items.nearby) {
                    for (const block of items.nearby) {
                        allPreconditions.push(`${block.replace(/_/g, ' ')} nearby`);
                    }
                }
                if (items.equipped) {
                    for (const item of items.equipped) {
                        allPreconditions.push(`${item.replace(/_/g, ' ')} equipped`);
                    }
                }
                // items.optional intentionally excluded — should not affect gap scoring
                if (pre.access) {
                    for (const loc of pre.access) {
                        allPreconditions.push(`Access to ${loc.replace(/_/g, ' ')}`);
                    }
                }
                if (pre.resources?.fuel) {
                    allPreconditions.push(`${pre.resources.fuel} fuel source`);
                }
            }
        }
        return [...new Set(allPreconditions)];
    }

    /**
     * 检查是否处于冷启动状态（空 inventory）
     */
    _isColdStart(agentState) {
        return !agentState ||
            (!agentState.inventory || agentState.inventory.length === 0);
    }
}
