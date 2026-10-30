import { join } from 'path';
import { readFileSync } from 'fs';
import { Enhancer } from './enhancer.js';
import { Local } from '../local.js';
import { Doubao } from '../doubao.js';
import { Qwen } from '../qwen.js';
import { DeepSeek } from '../deepseek.js';
import { GPT } from '../gpt.js';
import { OpenRouter } from '../openrouter.js';
import { Gemini } from '../gemini.js';
import { SharedMemory } from '../../team/shared_memory.js';
import { FewShotLearning } from './fewshot_learning.js';
import { TaskManager } from './task_manager.js';
import { BlockNameResolver } from './block_name_resolver.js';
import { PlanValidator } from './plan_validator.js';
import { executeCommand } from '../../agent/commands/index.js';
import minecraftData from 'minecraft-data';
import RecipeResolver, { TOOL_TIER_ORDER, SMELTING_OUTPUTS } from './recipe_resolver.js';

function _extractItemFromCmd(cmdInput) {
    if (!cmdInput) return null;
    const cmds = Array.isArray(cmdInput) ? cmdInput : [cmdInput];
    for (const cmd of cmds) {
        const match = cmd.match(/!(?:craftRecipe|smeltItem|collectBlocks)\(['"]([^'"]+)['"]/);
        if (match) return match[1];
    }
    return null;
}

// Items craftable in 2x2 player inventory — no crafting_table station needed.
// LLM sometimes incorrectly lists station:crafting_table for these; repairing
// that gap inserts an extra oak_log→planks→table chain that over-consumes logs
// and leaves too few planks for downstream wooden_pickaxe crafting.
const _INV_CRAFTABLE = new Set([
    'oak_planks', 'birch_planks', 'spruce_planks', 'jungle_planks',
    'acacia_planks', 'dark_oak_planks', 'crimson_planks', 'warped_planks',
    'bamboo_planks', 'cherry_planks', 'mangrove_planks',
    'crafting_table', 'stick', 'bowl',
]);

// Intent -> training file mapping
// cooking_examples.json is a 3975-entry {instruction,input,output} dialogue
// corpus, not demonstrations — 0 of its entries carry the name/plan schema the
// prompt builder needs, so COOK routes to the crafting demos instead (17 of
// which contain smeltItem chains). EXPLORE shares the collecting demos because
// no exploration demonstration file exists; see isDemonstration() below for the
// guard that catches any future file whose schema drifts.
export const INTENT_TO_TRAINING_FILE = {
    BUILD: 'build_examples.json',
    CRAFT: 'crafting_examples.json',
    COLLECT: 'collecting_examples.json',
    COOK: 'crafting_examples.json',
    COMBAT: 'combat_examples.json',
    EXPLORE: 'collecting_examples.json',
    DEFAULT: 'crafting_examples.json'
};

/**
 * A training entry is only usable as a few-shot demonstration if the prompt
 * builder can format it: formatExample() reads example.name unguarded and
 * walks example.plan. Entries failing this are dropped at load rather than
 * crashing buildFewShotPrompt or scoring as indistinguishable noise in SAER.
 */
export function isDemonstration(ex) {
    return !!ex && typeof ex.name === 'string' && Array.isArray(ex.plan) && ex.plan.length > 0;
}

/**
 * ImplicitEnhancer V2 - 隐式协作增强器
 *
 * 核心创新：
 * 1. Few-shot学习：让小模型从示例中学习制作模式
 * 2. 任务栈管理:支持嵌套任务和中断恢复
 * 3. 模式泛化:从已知物品推导到未知物品
 *
 * 架构:
 * - Intent Analysis (轻量) → Few-shot Learning (Qwen-8B) → Task Execution
 */
export class ImplicitEnhancer {
    constructor(config) {
        if (!config.enhancer) {
            throw new Error('ImplicitEnhancer requires an Enhancer instance in config');
        }

        this.agent = config.agent;
        this.debug = Boolean(config.enhancer?.debug);

        // 初始化模型
        let modelInstance = null;
        const modelConfig = config.enhancer.model;
        switch (modelConfig.api) {
            case 'ollama':
                modelInstance = new Local(modelConfig.model, modelConfig.url);
                break;
            case 'doubao':
                modelInstance = new Doubao(modelConfig.model, modelConfig.url);
                break;
            case 'qwen':
                modelInstance = new Qwen(modelConfig.model, modelConfig.url, modelConfig.params);
                break;
            // Live-eval parity with static createModel (scripts/eval/static_plan_eval.js):
            // the live agent path must support the same model APIs as the static study so
            // the live pass@k experiment can run the paper's models (DeepSeek-V3, GPT-4o,
            // OpenRouter-routed small models, Gemini). Additive — existing cases unchanged.
            case 'deepseek':
                modelInstance = new DeepSeek(modelConfig.model, modelConfig.url, modelConfig.params || null);
                break;
            case 'openai':
                modelInstance = new GPT(modelConfig.model, modelConfig.url || null, modelConfig.params || null, modelConfig.proxy || null);
                break;
            case 'openrouter':
                modelInstance = new OpenRouter(modelConfig.model, modelConfig.url || null);
                break;
            case 'gemini':
                modelInstance = new Gemini(modelConfig.model, modelConfig.url || null, modelConfig.params || null);
                break;
            default:
                throw new Error(`Unsupported model API: ${modelConfig.api}`);
        }

        this.innerEnhancer = new Enhancer({ ...config.enhancer, model: modelInstance });
        this.model = modelInstance;  // 保存模型引用用于Few-shot学习
        this.trainingDir = join(process.cwd(), 'data', 'training');
        this.memoryDir = join(process.cwd(), 'data', 'memory');

        // Team context
        const teamOptions = config.team || {};
        this.sharedMemory = new SharedMemory({
            agentName: this.agent?.name,
            path: teamOptions.shared_state_path
        });
        this.enableTeamContext = teamOptions.enable !== false;

        // 初始化核心组件
        this.fewShotLearning = new FewShotLearning(this.debug);
        // Live-eval mode toggle: let the profile JSON select the retrieval mode
        // so `node main.js --profiles <profile>` can run either condition without
        // the eval harness. Reads config.enhancer.{retrievalMode,saerEnabled};
        // unset → FewShotLearning defaults (saerEnabled=true, retrievalMode='saer'),
        // preserving the interactive bot's existing behavior. Pure config read —
        // does not touch SAER scoring, the execution layer, or static_plan_eval.
        if (typeof config.enhancer.retrievalMode === 'string') {
            this.fewShotLearning.retrievalMode = config.enhancer.retrievalMode;
        }
        if (typeof config.enhancer.saerEnabled === 'boolean') {
            this.fewShotLearning.saerEnabled = config.enhancer.saerEnabled;
        }
        this.taskManager = new TaskManager(this.debug);
        this.blockNameResolver = new BlockNameResolver(this.agent?.bot);
        this.planValidator = new PlanValidator(this.debug, this.agent?.bot);
        this.recipeResolver = new RecipeResolver(this.agent?.bot);
        this.planValidator.setRecipeResolver(this.recipeResolver);
        this.fewShotLearning.setRecipeResolver(this.recipeResolver);
        this._mcData = null;
        this._recentObservations = [];

        // Live-eval flag: when true, step recovery is purely deterministic (no LLM
        // judge, no freeform tool/item acquisition). This keeps the live harness
        // measuring plan-stage knowledge: the framework never repairs a plan gap
        // (missing tool/item the plan never produced) — it only fixes execution
        // noise (transient retries, equip/sync races, fungible-variant resolution,
        // collect-name candidate rotation). Default false preserves the interactive
        // bot's existing LLM self-correction (see _routeRecovery).
        this.deterministicRecovery = false;

        // Live-eval flag: when true, generateExecutionPlan() skips _repairPlanGaps
        // entirely and returns the raw (pruned-only) LLM plan even when
        // PlanValidator flags a precondition gap. Without this, gap repair runs
        // unconditionally at plan-generation time regardless of retrieval
        // condition, silently inserting resolveDependencyChain steps and masking
        // the exact knowledge gap the no_retrieval vs SAER comparison is meant to
        // measure. Default false preserves existing behavior for the interactive
        // bot and for any harness that hasn't opted in.
        this.disableGapRepair = false;
    }

    logDebug(...args) {
        if (this.debug) {
            console.log('[ImplicitEnhancer]', ...args);
        }
    }

    _getMcData() {
        if (this._mcData) return this._mcData;
        const bot = this.agent?.bot;
        if (!bot?.version) return null;
        this._mcData = minecraftData(bot.version);
        return this._mcData;
    }

    /**
     * Freeform execution: send a tight LLM prompt for a single sub-goal, then run
     * whatever !commands come back. Used when hop count ≤ 2.
     *
     * @param {string} goal  human-readable goal string
     * @param {object} agentState  { inventory: [{name,count}], nearbyBlocks: [] }
     * @returns {{ success: boolean, reason: string, commands: string[], responses: string[] }}
     */
    async executeFreeformStep(goal, agentState) {
        const inventoryStr = agentState.inventory.length > 0
            ? agentState.inventory.map(i => `${i.name}×${i.count}`).join(', ')
            : 'empty';

        const prompt = `You are controlling a Minecraft bot. Complete this single sub-task:
GOAL: ${goal}

CURRENT INVENTORY: ${inventoryStr}

Output ONLY the bot commands needed, one per line. Use ONLY:
!collectBlocks("block_name", count)
!craftRecipe("item_name", count)
!smeltItem("item_name", count)
!searchForBlock("block_name", range)
!equipItem("item_name")

Do NOT output any explanation. Commands only.`;

        let aiResponse;
        try {
            aiResponse = await this.model.sendRequest(
                [{ role: 'user', content: prompt }],
                'Output only !commands, one per line. No explanation, no markdown.'
            );
        } catch (err) {
            return { success: false, reason: `Freeform LLM failed: ${err.message}`, commands: [], responses: [] };
        }

        const commands = (aiResponse || '').split('\n')
            .map(l => l.trim())
            .filter(l => l.startsWith('!'));

        if (commands.length === 0) {
            return { success: false, reason: 'Freeform LLM returned no commands', commands: [], responses: [] };
        }

        this.logDebug(`[Freeform] executing ${commands.length} commands for "${goal}"`);
        const preSnapshot = this._snapshotInventory(this.agent?.bot);
        const executedCmds = [];
        const responses = [];

        for (const cmd of commands) {
            executedCmds.push(cmd);
            let resp;
            try {
                resp = await executeCommand(this.agent, cmd);
            } catch (err) {
                resp = err.message || 'Command threw error';
            }
            responses.push(resp);
            if (typeof resp === 'string' && (resp.startsWith('Error:') || resp.startsWith('Command is incorrectly'))) {
                break;
            }
        }

        const postSnapshot = this._snapshotInventory(this.agent?.bot);
        const diff = this._buildInventoryDiff(preSnapshot, postSnapshot);
        const inventoryChanged = diff !== 'no changes';

        // Goal-aware success: check if the expected item actually increased
        const pseudoResult = { preSnapshot, postSnapshot };
        const fungibleHit = this._findGainedFungible(goal, pseudoResult);
        const targetItem = !fungibleHit ? this._extractTargetItem(goal, []) : null;
        const targetGained = targetItem
            ? (postSnapshot.get(targetItem) ?? 0) > (preSnapshot.get(targetItem) ?? 0)
            : false;
        // Fall back to any-change only when goal item cannot be parsed at all
        const success = fungibleHit !== null || targetGained || (!fungibleHit && !targetItem && inventoryChanged);

        return {
            success,
            reason: success
                ? (fungibleHit ? `gained ${fungibleHit.gained}` : `inventory changed: ${diff}`)
                : 'no expected item gained',
            commands: executedCmds,
            responses
        };
    }

    /**
     * Extract the most relevant Minecraft item name from a natural-language step goal.
     * Used as fallback when command-based extraction fails.
     *
     * @param {string} goal
     * @param {Map<string,number>} inventoryMap  name → count (for variant resolution)
     * @returns {string|null}
     */
    _extractItemFromGoal(goal, inventoryMap) {
        if (!goal) return null;
        const text = goal.toLowerCase();

        // Try resolveInventoryAlias for generic words that need inventory-aware resolution
        const genericWords = ['log', 'logs', 'plank', 'planks'];
        for (const word of genericWords) {
            if (text.includes(word)) {
                const resolved = this.recipeResolver.resolveInventoryAlias(
                    word.endsWith('s') ? word.slice(0, -1) : word, inventoryMap
                );
                if (resolved !== word) return resolved;
            }
        }

        // Try to match known minecraft items from goal words
        const mcData = this._getMcData();
        if (!mcData) return null;

        // Look for snake_case words in goal first
        const snakeWords = text.match(/[a-z]+(?:_[a-z]+)+/g) || [];
        for (const w of snakeWords) {
            if (mcData.itemsByName[w]) return w;
        }

        // Try individual words (depluralized)
        const words = text.match(/[a-z]+/g) || [];
        for (const w of words) {
            if (mcData.itemsByName[w]) return w;
            if (w.endsWith('s') && mcData.itemsByName[w.slice(0, -1)]) return w.slice(0, -1);
        }

        return null;
    }

    /**
     * Extract target Minecraft item name from natural-language user input.
     * Matches against both mcData item registry and bot inventory names,
     * so it works even when mcData is unavailable.
     *
     * @param {string} input - user input (e.g. "craft iron pickaxe for me")
     * @param {Array<{name: string, count: number}>} inventory - bot inventory
     * @returns {string|null} minecraft item name (e.g. "iron_pickaxe") or null
     */
    _extractTargetItem(input, inventory) {
        if (!input) return null;
        const text = input.toLowerCase();
        const words = text.match(/[a-z]+/g) || [];

        const mcData = this._getMcData();
        const invNames = new Set((inventory || []).map(i => i.name));

        const isKnown = (name) => mcData?.itemsByName[name] || invNames.has(name);

        // Bigrams: "iron pickaxe" → "iron_pickaxe"
        for (let i = 0; i < words.length - 1; i++) {
            const bigram = `${words[i]}_${words[i + 1]}`;
            if (isKnown(bigram)) return bigram;
        }

        // Trigrams: "oak wood stairs" → "oak_wood_stairs" (rare)
        for (let i = 0; i < words.length - 2; i++) {
            const trigram = `${words[i]}_${words[i + 1]}_${words[i + 2]}`;
            if (isKnown(trigram)) return trigram;
        }

        // Single word fallback
        for (const w of words) {
            if (isKnown(w)) return w;
            if (w.endsWith('s') && isKnown(w.slice(0, -1))) return w.slice(0, -1);
        }

        return null;
    }

    /**
     * Layer 1: ErrorClassifier — deterministic error classification from bot output.
     * No LLM involved. Returns { type, detail } for the RecoveryRouter.
     */
    _classifyError(responses, step) {
        const output = (responses || []).join(' ');

        // TRANSIENT: timeout / connection issues — just retry
        // Note: MC pathfinder outputs "to long" (one 'o'), not "too long"
        if (/windowOpen did not fire/i.test(output) || /Timeout: Took to{1,2} long/i.test(output)) {
            return { type: 'TRANSIENT', detail: {} };
        }

        // MISSING_TOOL: bot can't harvest a block without proper tool
        // Use [a-z_][a-z0-9_]* to avoid capturing trailing punctuation (e.g. "cobblestone.")
        const toolMatch = output.match(/Don't have right tools to harvest ([a-z_][a-z0-9_]*)/i)
            || output.match(/don't have.*tools?.*harvest\s+([a-z_][a-z0-9_]*)/i);
        if (toolMatch) {
            return { type: 'MISSING_TOOL', detail: { blockName: toolMatch[1].toLowerCase() } };
        }

        // MISSING_ITEM: craft/smel failed due to insufficient resources
        if (/Insufficient resources/i.test(output) || /not enough/i.test(output)) {
            const itemName = _extractItemFromCmd(step.action_cmd || step.command);
            return { type: 'MISSING_ITEM', detail: { itemName } };
        }

        // CRAFT_SUCCESS: skill explicitly confirmed crafting — trust the skill output,
        // skip LLM judge. Catches cases where the crafted item auto-equips (armor) and
        // disappears from bot.inventory.items(), causing the LLM to wrongly judge failure.
        if (/Successfully crafted/i.test(output)) {
            return { type: 'CRAFT_SUCCESS', detail: {} };
        }

        // SEMANTIC: ambiguous — needs LLM judge
        return { type: 'SEMANTIC', detail: {} };
    }

    /**
     * Check whether the step goal wants a fungible item (e.g. oak_log) and
     * the execution actually gained a sibling variant (e.g. acacia_log).
     * Returns { wanted, gained } or null.
     */
    _findGainedFungible(goal, executionResult) {
        const { preSnapshot, postSnapshot } = executionResult;
        if (!preSnapshot || !postSnapshot) return null;

        const mcData = this.recipeResolver?._getMcData?.();
        if (!mcData) return null;

        const fungibleSuffixes = this.recipeResolver?.getFungibleSuffixes?.() ?? ['_log', '_planks'];
        const goalLower = (goal || '').toLowerCase();
        const goalNormalized = goalLower.replace(/\s+/g, '_');
        for (const suffix of fungibleSuffixes) {
            const allVariants = Object.keys(mcData.itemsByName).filter(n => n.endsWith(suffix));

            // Try specific variant match (e.g. "oak_log" in goal text)
            let wantedVariant = allVariants.find(v =>
                goalLower.includes(v) || goalNormalized.includes(v)
            );

            // Fallback: generic category match (e.g. "logs" or "planks" in goal text)
            if (!wantedVariant) {
                const rootWord = suffix.slice(1).replace(/s$/, ''); // "_log"→"log", "_planks"→"plank"
                const genericRe = new RegExp(`\\b${rootWord}s?\\b`, 'i');
                if (!genericRe.test(goalLower)) continue;
            }

            for (const variant of allVariants) {
                const pre = preSnapshot.get(variant) ?? 0;
                const post = postSnapshot.get(variant) ?? 0;
                if (post > pre) {
                    return { wanted: wantedVariant || suffix.slice(1), gained: variant };
                }
            }
        }
        return null;
    }

    /**
     * Layer 2: RecoveryRouter — dispatches recovery by error type.
     * Returns { success, reason, subtask } matching the judgeAndPlan interface.
     */
    async _routeRecovery(error, step, executionResult) {
        // Live-eval path: pure deterministic recovery, no LLM. Completely bypasses
        // the freeform/judgeAndPlan branches below so the framework never repairs a
        // plan gap (it only fixes execution noise). Flag set by the live harness.
        if (this.deterministicRecovery) {
            return this._deterministicRecovery(error, step, executionResult);
        }

        // Ensure resolver has bot reference so _getMcData() works for crafting graph
        if (this.recipeResolver && this.agent?.bot && !this.recipeResolver.bot) {
            this.recipeResolver.bot = this.agent.bot;
        }

        const agentState = this.getAgentState();
        const invMap = new Map(agentState.inventory.map(i => [i.name, i.count]));

        switch (error.type) {
            case 'CRAFT_SUCCESS':
                return { success: true, reason: 'craftRecipe confirmed success', subtask: null };

            case 'TRANSIENT':
                return { success: false, reason: 'transient error, retrying', subtask: null };

            case 'MISSING_TOOL': {
                const blockName = error.detail.blockName;
                const toolName = this.recipeResolver.getRequiredTool(blockName);
                if (!toolName) {
                    this.logDebug(`[RecoveryRouter] No tool mapping for block "${blockName}", falling back to LLM`);
                    return this.judgeAndPlan(step, executionResult);
                }

                const hops = this.recipeResolver.calcStaticHops(toolName, invMap);
                this.logDebug(`[RecoveryRouter] MISSING_TOOL: need ${toolName} for ${blockName}, hops=${hops}`);

                // Try freeform for simple tool acquisition (≤2 hops)
                if (hops <= 2 && !step._freeformAttempted) {
                    step._freeformAttempted = true;
                    const freeformResult = await this.executeFreeformStep(
                        `Get a ${toolName} to mine ${blockName}`, agentState
                    );
                    if (freeformResult.success) {
                        return { success: true, reason: `freeform obtained ${toolName}`, subtask: null };
                    }
                    this.logDebug(`[RecoveryRouter] Freeform failed for ${toolName}, falling back to rigid`);
                }

                // Rigid: resolveDependencyChain
                const chain = this.recipeResolver.resolveDependencyChain(toolName, invMap);
                if (chain.length > 0) {
                    const subSteps = chain.map(c => this._createStep(c));
                    return {
                        success: false,
                        reason: `Missing tool: ${toolName} for ${blockName}`,
                        subtask: {
                            name: `Obtain ${toolName}`,
                            steps: subSteps
                        }
                    };
                }
                // Deterministic chain empty (e.g. Nether items, non-standard tools) — fall back to LLM
                this.logDebug(`[RecoveryRouter] MISSING_TOOL chain empty for "${toolName}", falling back to LLM judge`);
                return this.judgeAndPlan(step, executionResult);
            }

            case 'MISSING_ITEM': {
                const itemName = error.detail.itemName || _extractItemFromCmd(step.action_cmd || step.command);
                if (!itemName) {
                    this.logDebug('[RecoveryRouter] MISSING_ITEM but cannot identify item, falling back to LLM');
                    return this.judgeAndPlan(step, executionResult);
                }

                this.logDebug(`[RecoveryRouter] MISSING_ITEM: ${itemName}`);
                const chain = this.recipeResolver.resolveDependencyChain(itemName, invMap);
                if (chain.length > 0) {
                    const subSteps = chain.map(c => this._createStep(c));
                    return {
                        success: false,
                        reason: `Missing item: ${itemName}`,
                        subtask: {
                            name: `Obtain ${itemName}`,
                            steps: subSteps
                        }
                    };
                }
                // Deterministic chain empty (e.g. combat drops, Nether items) — fall back to LLM
                this.logDebug(`[RecoveryRouter] MISSING_ITEM chain empty for "${itemName}", falling back to LLM judge`);
                return this.judgeAndPlan(step, executionResult);
            }

            case 'SEMANTIC':
            default: {
                // Fast path: if the goal wants a fungible item (e.g. oak_log) and we gained
                // a sibling variant (e.g. acacia_log), treat as success without LLM round-trip.
                const fungibleHit = this._findGainedFungible(step.goal, executionResult);
                if (fungibleHit) {
                    this.logDebug(`[Fungible] "${fungibleHit.gained}" satisfies goal for "${fungibleHit.wanted}" — skipping LLM judge`);
                    return { success: true, reason: `Fungible match: ${fungibleHit.gained} ≈ ${fungibleHit.wanted}`, subtask: null };
                }
                // LLM judge: receives inventory before/after + goal, handles all
                // other equivalence cases via prompt knowledge.
                return this.judgeAndPlan(step, executionResult);
            }
        }
    }

    /**
     * Deterministic recovery for the live-eval path (deterministicRecovery=true).
     * NEVER calls the LLM, never repairs a plan gap — only fixes execution noise.
     * Returns the same {success, reason, subtask, giveUp?} shape as _routeRecovery.
     *
     * giveUp:true makes run() fail the task immediately (no bounded retry); used for
     * genuine plan gaps (missing tool/item the plan never produced). TRANSIENT is the
     * sole case that returns success:false WITHOUT giveUp, letting run() retry.
     */
    _deterministicRecovery(error, step, executionResult) {
        // Ensure resolver has bot reference for getRequiredTool / crafting graph
        if (this.recipeResolver && this.agent?.bot && !this.recipeResolver.bot) {
            this.recipeResolver.bot = this.agent.bot;
        }

        switch (error.type) {
            case 'TRANSIENT':
                // Execution noise (timeout/pathfinder) — let run() bounded-retry.
                return { success: false, reason: 'transient error, retrying', subtask: null };

            case 'MISSING_TOOL': {
                // The bot couldn't harvest a block. Two sub-cases, both WITHOUT LLM:
                //  (a) Execution noise: the needed tool (or a higher-tier same-class
                //      tool) IS in inventory but wasn't equipped in time (equip/sync
                //      race after a craft). Deterministically equip it and let run()
                //      retry the same step.
                //  (b) Plan gap: the plan never produced the tool → fail (giveUp).
                const blockName = error.detail?.blockName;
                const requiredTool = blockName ? this.recipeResolver.getRequiredTool(blockName) : null;
                if (!requiredTool) {
                    // No tool mapping (e.g. hand-mineable block misclassified) — retry once.
                    return { success: false, reason: `no tool mapping for ${blockName}, retrying`, subtask: null };
                }
                const toolClass = requiredTool.replace(/^[a-z]+_/, ''); // pickaxe|axe|shovel
                const requiredTier = TOOL_TIER_ORDER[requiredTool];

                const inv = this.getAgentState().inventory;
                const candidate = inv.find(i => {
                    if (!i.name.endsWith(toolClass)) return false;
                    const tier = TOOL_TIER_ORDER[i.name];
                    return tier !== undefined && requiredTier !== undefined && tier >= requiredTier;
                });

                if (candidate) {
                    // (a) Execution noise: tool present but not equipped. Equip it now
                    //     so the retry's collectBlock().equipForBlock reads it.
                    const bot = this.agent?.bot;
                    if (bot) {
                        try {
                            const item = bot.inventory.items().find(it => it.name === candidate.name);
                            if (item) bot.equip(item, 'hand');
                        } catch (e) {
                            this.logDebug(`[DetRecovery] equip failed for ${candidate.name}: ${e.message}`);
                        }
                    }
                    return { success: false, reason: `equip retry: ${candidate.name} already in inventory`, subtask: null };
                }
                // (b) Plan gap — fail, do NOT freeform-acquire.
                return {
                    success: false,
                    reason: `plan-gap: missing tool ${requiredTool} for ${blockName}`,
                    subtask: null,
                    giveUp: true
                };
            }

            case 'MISSING_ITEM': {
                // craft/smelt failed on insufficient resources. Two sub-cases:
                //  (a) Inventory has a fungible sibling variant the recipe will accept
                //      (e.g. birch_planks when oak_planks missing) → resolve variant,
                //      rewrite the step command, retry.
                //  (b) Genuine shortfall (e.g. furnace needs 8 cobblestone, have 1) →
                //      plan gap → fail (giveUp). Never resolveDependencyChain/freeform.
                const itemName = error.detail?.itemName || _extractItemFromCmd(step.action_cmd || step.command);
                if (!itemName) {
                    return { success: false, reason: 'missing item: cannot identify, retrying', subtask: null };
                }
                // (a) Try fungible craft-variant resolution on the step command.
                const cmds = step.action_cmd?.length > 0 ? step.action_cmd : (step.command ? [step.command] : []);
                let resolved = false;
                for (let i = 0; i < cmds.length; i++) {
                    if (cmds[i].includes('craftRecipe')) {
                        const variant = this._resolveCraftVariant(cmds[i]);
                        if (variant && variant !== cmds[i]) {
                            cmds[i] = variant;
                            resolved = true;
                        }
                    }
                }
                if (resolved) {
                    return { success: false, reason: `variant retry: resolved fungible craft for ${itemName}`, subtask: null };
                }
                // (b) Real shortfall — plan gap.
                return {
                    success: false,
                    reason: `plan-gap: missing item ${itemName} (real shortfall)`,
                    subtask: null,
                    giveUp: true
                };
            }

            case 'SEMANTIC':
            default: {
                // Deterministic success/failure: did the step's target item (or a
                // fungible sibling) actually enter inventory? No LLM judge.
                //
                // IMPORTANT: the target is taken from the STEP COMMAND (e.g.
                // collectBlocks("cobblestone",3) → cobblestone; craftRecipe("furnace",1)
                // → furnace), NOT from the goal text. Goal text often names the
                // eventual product (e.g. "Mine stone to craft stone pickaxe") which
                // would make _extractTargetItem return "stone_pickaxe" — an item this
                // collect step never produces — and falsely judge a successful collect
                // as "no target gained" (a good-plan冤杀 bug, fixed 2026-06-23).
                const fungibleHit = this._findGainedFungible(step.goal, executionResult);
                if (fungibleHit) {
                    return {
                        success: true,
                        reason: `Fungible match: ${fungibleHit.gained} ≈ ${fungibleHit.wanted}`,
                        subtask: null
                    };
                }
                // Navigation-only step (!searchForBlock without !collectBlocks):
                // moves bot to block location but gains no item — inventory check
                // is irrelevant. Advance to the next step (collectBlocks) which does
                // the actual collection and inventory verification.
                const navCmds = step.action_cmd?.length > 0 ? step.action_cmd : (step.command ? [step.command] : []);
                if (navCmds.length > 0 && navCmds.every(c => c.includes('searchForBlock'))) {
                    return { success: true, reason: 'navigation: searchForBlock executed', subtask: null };
                }

                const { preSnapshot, postSnapshot } = executionResult;

                // Primary: command target from action_cmd (collect/craft/smelt).
                const cmdTarget = _extractItemFromCmd(step.action_cmd || step.command);
                let gained = false;
                if (cmdTarget && preSnapshot && postSnapshot) {
                    gained = (postSnapshot.get(cmdTarget) ?? 0) > (preSnapshot.get(cmdTarget) ?? 0);
                }
                // Collect fungible peers: mining stone yields cobblestone, etc. If the
                // command asked for one sibling but another peer increased, count success.
                if (!gained && cmdTarget && preSnapshot && postSnapshot) {
                    const peers = this._collectPeers(cmdTarget);
                    if (peers) {
                        gained = peers.some(p => (postSnapshot.get(p) ?? 0) > (preSnapshot.get(p) ?? 0));
                    }
                }
                // Smelt: the command target is the INPUT (consumed, e.g. raw_iron), but
                // success means the OUTPUT increased (iron_ingot). smeltItem("raw_iron",5)
                // consumes raw_iron and produces iron_ingot — checking raw_iron delta sees
                // a decrease and falsely judges failure. Map input→output via SMELTING_OUTPUTS.
                if (!gained && cmdTarget && preSnapshot && postSnapshot) {
                    const cmds = step.action_cmd?.length > 0 ? step.action_cmd : (step.command ? [step.command] : []);
                    const isSmelt = cmds.some(c => c.includes('smeltItem'));
                    if (isSmelt) {
                        const output = SMELTING_OUTPUTS[cmdTarget];
                        if (output) {
                            gained = (postSnapshot.get(output) ?? 0) > (preSnapshot.get(output) ?? 0);
                        }
                    }
                }
                if (gained) {
                    return { success: true, reason: `target ${cmdTarget} gained`, subtask: null };
                }

                // Fallback: goal-text target (craft steps whose goal == product).
                const goalTarget = this._extractTargetItem(step.goal, this.getAgentState().inventory);
                if (!gained && goalTarget && preSnapshot && postSnapshot) {
                    gained = (postSnapshot.get(goalTarget) ?? 0) > (preSnapshot.get(goalTarget) ?? 0);
                }
                if (gained) {
                    return { success: true, reason: `target ${goalTarget} gained (from goal)`, subtask: null };
                }

                // Last resort: no parseable target AND inventory changed → success
                // (mirrors executeFreeformStep fallback; safe because a craft/collect
                // that changes inventory made progress).
                const invChanged = !!(preSnapshot && postSnapshot) &&
                    JSON.stringify([...preSnapshot.entries()].sort()) !==
                    JSON.stringify([...postSnapshot.entries()].sort());
                if (!cmdTarget && !goalTarget && invChanged) {
                    return { success: true, reason: 'inventory changed (no parseable target)', subtask: null };
                }
                // Distinguish craft failure causes via skills.js response string:
                //   "Insufficient resources" → real material shortage → give up
                //   "execution error, not material shortage" → mineflayer sync race
                //     that outlasted the poll window → retry (rare)
                //   No explicit failure message → collectBlocks found nothing → give up
                const allResponses = (executionResult.responses || []).join('\n');
                const isInsufficient = allResponses.includes('Insufficient resources');
                if (isInsufficient) {
                    return {
                        success: false,
                        reason: 'no target item gained: insufficient materials',
                        subtask: null,
                        giveUp: true
                    };
                }
                const finalCmds = step.action_cmd?.length > 0
                    ? step.action_cmd
                    : (step.command ? [step.command] : []);
                const isCraftOrSmelt = finalCmds.some(
                    c => c.includes('craftRecipe') || c.includes('smeltItem'));
                if (isCraftOrSmelt) {
                    // skills.js polling absorbed most races; this branch = persistent sync
                    // issue beyond 1.25s. Retry via MAX_STEP_RETRIES (no material consumed
                    // again since skills.js returned false without re-crafting).
                    return {
                        success: false,
                        reason: 'no target item gained: execution error (mineflayer sync, retrying)',
                        subtask: null
                    };
                }
                return {
                    success: false,
                    reason: 'no target item gained',
                    subtask: null,
                    giveUp: true
                };
            }
        }
    }

    /**
     * Collect fungible peers for a block name — blocks that satisfy the same
     * "gather X" intent when mining yields a different item (e.g. mining 'stone'
     * yields 'cobblestone'; both are valid stone-class material). Used by the
     * deterministic SEMANTIC success check so a successful collect isn't falsely
     * judged a failure just because the mined drop differs from the asked name.
     * Mirrors block_name_resolver.js VARIANT_MAP (stone/cobblestone/deepslate).
     */
    _collectPeers(name) {
        // Mining a block often drops a DIFFERENT item than the block name (MC 1.20.4):
        //   stone → cobblestone, iron_ore → raw_iron, diamond_ore → diamond, etc.
        // A successful collect is falsely judged "no target gained" if we only check
        // the asked block name against inventory. Map asked-name → list of acceptable
        // inventory gains (block name + its drop + deepslate variant where relevant).
        const COLLECT_PEERS = {
            // stone class
            'stone':       ['stone', 'cobblestone', 'deepslate', 'cobbled_deepslate'],
            'cobblestone': ['cobblestone', 'stone', 'deepslate'],
            'deepslate':   ['deepslate', 'cobbled_deepslate', 'stone', 'cobblestone'],
            // ores: deepslate variant + the raw/gem drop
            'iron_ore':        ['iron_ore', 'deepslate_iron_ore', 'raw_iron'],
            'deepslate_iron_ore': ['deepslate_iron_ore', 'iron_ore', 'raw_iron'],
            'gold_ore':        ['gold_ore', 'deepslate_gold_ore', 'raw_gold'],
            'deepslate_gold_ore': ['deepslate_gold_ore', 'gold_ore', 'raw_gold'],
            'copper_ore':      ['copper_ore', 'deepslate_copper_ore', 'raw_copper'],
            'diamond_ore':     ['diamond_ore', 'deepslate_diamond_ore', 'diamond'],
            'coal_ore':        ['coal_ore', 'deepslate_coal_ore', 'coal'],
            'redstone_ore':    ['redstone_ore', 'deepslate_redstone_ore', 'redstone'],
            'emerald_ore':     ['emerald_ore', 'deepslate_emerald_ore', 'emerald'],
            'lapis_ore':       ['lapis_ore', 'deepslate_lapis_ore', 'lapis_lazuli'],
        };
        return COLLECT_PEERS[name] || null;
    }

    /**
     * 3-layer error recovery: classify → route → LLM judge (SEMANTIC only).
     * Enforces a per-step failure cap (4 attempts) to break infinite loops.
     */
    async _judgeAndPlanWithFreeform(step, executionResult) {
        step._failCount = (step._failCount || 0) + 1;

        // Infinite loop guard: after 4 failures on the same step, give up without subtask.
        // giveUp:true signals run() to fail the task immediately without further retries.
        if (step._failCount >= 4) {
            console.warn(`[LoopGuard] judgeAndPlan has given up on step "${step.goal}" after ${step._failCount} failures — subtask recovery disabled`);
            return { success: false, reason: `Step failed ${step._failCount} times without progress`, subtask: null, giveUp: true };
        }

        // Pre-classification check: if inventory shows a fungible gain, declare success
        // regardless of error type. Handles cases like: initial timeout + fallback success
        // (e.g. oak_log timeout → fallback collects acacia_log → TRANSIENT misclassification).
        const fungibleHit = this._findGainedFungible(step.goal, executionResult);
        if (fungibleHit) {
            this.logDebug(`[Fungible] "${fungibleHit.gained}" satisfies goal "${step.goal}" — skipping error classification`);
            step._failCount = 0;
            return { success: true, reason: `Fungible match: ${fungibleHit.gained} ≈ ${fungibleHit.wanted}`, subtask: null };
        }

        // Layer 1: Classify error deterministically
        const error = this._classifyError(executionResult.responses, step);
        this.logDebug(`[ErrorClassifier] type=${error.type} detail=${JSON.stringify(error.detail)}`);

        // Layer 2 + 3: Route recovery (SEMANTIC calls LLM judge internally)
        const result = await this._routeRecovery(error, step, executionResult);

        if (result.success) {
            step._failCount = 0;
            // Record completed step for context injection into subsequent LLM judge calls
            const obs = `✓ "${step.goal}": ${result.reason || 'completed'}`;
            this._recentObservations = [...this._recentObservations.slice(-2), obs];
        }

        return result;
    }

    /**
     * Extract current agent state for SAer scoring.
     * Reads inventory from Mineflayer bot instance and checks nearby blocks.
     *
     * @returns {object} { inventory: [{name, count}], nearbyBlocks: [string] }
     */
    getAgentState() {
        const bot = this.agent?.bot;
        if (!bot) {
            return { inventory: [], nearbyBlocks: [] };
        }

        // get inventory
        const inventory = (bot.inventory?.items() || []).map(item => ({
            name: item.name,
            count: item.count
        }));

        // Get nearby blocks (workstations and resource indicators)
        const nearbyBlocks = [];

        try {
            // check for common workstations
            const blockTypesToCheck = ['crafting_table', 'furnace', 'chest', 'anvil', 'brewing_stand'];
            for (const blockName of blockTypesToCheck) {
                const found = bot.findBlock?.({
                    maxDistance: 32,
                    matching: (b) => b?.name === blockName
                });
                if (found) {
                    nearbyBlocks.push(blockName);
                }
            }

            // Check for trees (logs)
            const logBlock = bot.findBlock?.({
                maxDistance: 32,
                matching: (b) => b?.name?.includes('log')
            });
            if (logBlock) nearbyBlocks.push('trees');

            // check for stone area
            const stoneBlock = bot.findBlock?.({
                maxDistance: 16,
                matching: (b) => b?.name === 'stone' || b?.name === 'deepslate'
            });
            if (stoneBlock) nearbyBlocks.push('stone_area');

        } catch (e) {
            // findBlock can fail, that's okay - nearbyBlocks stays empty
            this.logDebug('getAgentState: findBlock failed:', e.message);
        }

        return { inventory, nearbyBlocks };
    }

    /**
     * 主入口:处理用户请求
     */
    async sendRequest(model, turns, systemPrompt, stop_seq = '***') {
        if (this._isRunning) {
            return 'Task is already in progress. Please wait for it to complete.';
        }
        this._isRunning = true;
        try {
            return await this._sendRequestImpl(model, turns, systemPrompt, stop_seq);
        } finally {
            this._isRunning = false;
        }
    }

    async _sendRequestImpl(model, turns, systemPrompt, stop_seq = '***') {
        this._recentObservations = [];
        // 1. Intent analysis
        const intent = await this.getIntent(turns, systemPrompt);

        // 如果 no valid intent, use default behavior
        if (!intent) {
            this.logDebug('No valid intent found, using default enhancer behavior');
            return await this.innerEnhancer.sendRequest(model, turns, systemPrompt, stop_seq);
        }

        // 2. If a task is already running, don't start a new one
        //    run() is self-driving — once all tasks complete or unrecoverable failure
        if (this.taskManager.currentTask) {
            this.logDebug('Task already active, ignoring new input during execution');
            return 'Task is already in progress. Please wait for it to complete.';
        }

        // 3. Pre-task intercept: skip if target item already owned
        const preState = this.getAgentState();
        const targetItemPre = this._extractTargetItem(intent.input, preState.inventory);
        if (targetItemPre) {
            const owned = preState.inventory.find(i => i.name === targetItemPre);
            if (owned && owned.count > 0) {
                const displayName = targetItemPre.replace(/_/g, ' ');
                console.log(`[PreCheck] Already have ${targetItemPre} (${owned.count}x) — skipping task`);
                return `✅ You already have ${displayName} (${owned.count}x). No action needed.`;
            }
        }

        // 4. Load training data and generate plan
        const info = await this.getRelevantInfo(intent);
        this.logDebug(`New task: ${intent.input}`);
        this.logDebug(`Loaded ${info.length} training examples`);

        // 5. generate execution plan
        const executionPlan = await this.generateExecutionPlan(intent, info);

        if (!executionPlan || executionPlan.steps.length === 0) {
            this.logDebug('Plan generation failed, falling back to default');
            const prompt = await this.buildFallbackPrompt(intent, systemPrompt);
            return await this.innerEnhancer.sendRequest(model, turns.slice(-3), prompt, stop_seq);
        }

        // 5b. Post-plan check: if the step producing the target item is SKIP'd, entire plan is unnecessary
        if (executionPlan.target) {
            const targetStep = executionPlan.steps.find(s => {
                if (!s.skip) return false;
                const produces = s.produces
                    ? (Array.isArray(s.produces) ? s.produces : [s.produces])
                    : [];
                return produces.some(p => p.name === executionPlan.target);
            });
            if (targetStep) {
                const displayName = executionPlan.target.replace(/_/g, ' ');
                console.log(`[PostCheck] Target step "${executionPlan.target}" is SKIP'd — skipping entire plan`);
                return `✅ You already have ${displayName}. No action needed.`;
            }
        }

        // 6. push plan onto task stack
        const rootTask = this.taskManager.pushTask({
            name: executionPlan.target || intent.input,
            steps: executionPlan.steps,
            reason: 'User request',
            metadata: {
                reasoning: executionPlan.reasoning,
                intent: intent.type,
                targetItem: executionPlan.target || null,
                targetCount: 1
            }
        });
        if (!rootTask) {
            return `\u274c Task "${executionPlan.target || intent.input}" failed to start (task stack rejected).`;
        }

        console.log(`\n\u{b3} Plan: ${executionPlan.steps.length} steps, target=${executionPlan.target || intent.input}`);
        executionPlan.steps.forEach(s => {
            const skipTag = s.skip ? ' [SKIP]' : '';
            console.log(`  ${s.step}. ${s.goal} \u2192 ${s.command || 'N/A'}${skipTag}`);
        });
        console.log('');

        // 8. Run self-driving loop
        try {
            await this.taskManager.run(
                (step) => this.executeStep(step),
                (step, result) => this._judgeAndPlanWithFreeform(step, result),
                { bot: this.agent?.bot }
            );
        } catch (err) {
            console.error('[ImplicitEnhancer] run() threw:', err.message);
            return `\u2744 Task execution error: ${err.message}`;
        }

        const taskName = executionPlan.target || intent.input;
        const rootResult = this.taskManager.completedTasks.find(t => t.id === rootTask.id);

        // run() may exit early while root task is still active/paused (e.g., subtask failure break)
        if (!rootResult) {
            return `\u274c Task "${taskName}" did not reach a terminal state.`;
        }

        if (rootResult.status === 'failed') {
            const reason = rootResult.failReason || 'The bot could not complete all required steps.';
            return `\u274c Task "${taskName}" failed. ${reason}`;
        }

        if (rootResult.status !== 'completed') {
            return `\u274c Task "${taskName}" ended with unexpected status: ${rootResult.status}.`;
        }

        return `\u2705 Task "${taskName}" completed.`;
    }

    /**
     * 生成执行计划（核心创新: Few-shot学习)
     */
    async generateExecutionPlan(intent, trainingExamples) {
        if (this.debug) {
            console.log('\n' + '\u{1f}'.repeat(35));
            console.log(`\n\ud83d} FEW-SHot learning started`);
            console.log(`\n\ud83d} Intent: ${intent.type}`);
            console.log(`\n\ud83d} input: ${intent.input}\n`);
            console.log('\u{1f}'.repeat(35));
        }

        // 直接使用用户请求,让AI自己理解(不再使用keywordExtractor)
        const userRequest = {
            input: intent.input,
            intent: intent.type
        };

        // SAER: get agent state for state-aware example retrieval
        const agentState = this.getAgentState();
        // build few-shot prompt (传入 agentState 以启用 SAER scoring)
        // parseExecutionPlan only recognizes CRAFT-style targets (craftRecipe cmd /
        // craft-make-build wording); COLLECT/etc. plans leave plan.target null. Falling
        // back to the raw sentence (intent.input, which may still carry a chat-name
        // prefix like "JW: collect some gravel") breaks _verifyTaskCompletion, which
        // compares targetItem against inventory item names.
        const resolveTarget = (p) => p?.target || this._extractTargetItem(intent.input, agentState.inventory);
        const fewshotPrompt = this.fewShotLearning.buildFewShotPrompt(userRequest, trainingExamples, agentState);
        this.logDebug('Calling AI for Few-shot learning...');
        try {
            // 调用Qwen-8B进行学习和推理
            const aiResponse = await this.model.sendRequest([
                { role: 'user', content: fewshotPrompt }
            ], 'You are a Minecraft crafting expert. Always follow the output format exactly.');
            this.logDebug(`AI Response received (${aiResponse?.length || 0} chars)`);
            // parse execution plan
            const rawPlan = this.fewShotLearning.parseExecutionPlan(aiResponse, intent.input);
            // Split bundled multi-craft steps into one craft per step BEFORE validation/
            // pruning, so each craft is its own verify point (bundled-step false-success fix).
            const splitPlan = rawPlan ? this._splitBundledCraftSteps(rawPlan) : rawPlan;
            // Infer produces for single smelt steps so pruneSteps can skip them when smelted output is pre-given
            splitPlan?.steps?.forEach(s => {
                if (!s.produces && s.command?.includes('smeltItem'))
                    s.produces = this._deriveProducesFromCmd(s.command);
            });
            // Convert specific fungible collectBlocks (e.g. oak_log) to freeformGoal so bot picks any variant
            const plan = splitPlan ? this._abstractifyFungibleSteps(splitPlan) : splitPlan;
            if (plan) {
                this.logDebug(`execution plan generated: ${plan.steps?.length || 0} steps, target=${plan.target || 'N/A'}`);
                // Ensure validators have bot reference for recipe lookups
                if (this.agent?.bot) {
                    if (!this.planValidator.bot) this.planValidator.bot = this.agent.bot;
                    if (!this.recipeResolver.bot) this.recipeResolver.bot = this.agent.bot;
                }
                // PlanValidator: validate preconditions chain
                const inventory = agentState.inventory || [];
                const validation = this.planValidator.validate(plan, inventory);
                if (!validation.valid) {
                    console.log(`\n\u26a0\uFE0F Plan validation found ${validation.gaps.length} gap(s):`);
                    for (const gap of validation.gaps) {
                        console.log(`  - Step ${gap.step} "${gap.goal}" missing: ${gap.display}`);
                    }
                    if (this.disableGapRepair) {
                        console.log('  \u26a0\uFE0F disableGapRepair=true — returning raw plan, gap(s) left unrepaired');
                        const prunedRaw = this.planValidator.pruneSteps(plan, inventory);
                        return {
                            reasoning: plan.reasoning,
                            steps: prunedRaw.steps,
                            target: resolveTarget(plan)
                        };
                    }
                    // Deterministic repair: insert resolveDependencyChain steps before failing steps
                    const repairedPlan = this._repairPlanGaps(plan, validation.gaps, inventory);
                    const revalidation = this.planValidator.validate(repairedPlan, inventory);
                    if (!revalidation.valid) {
                        console.log(`  ⚠️ ${revalidation.gaps.length} gap(s) remain after repair — proceeding anyway`);
                    }
                    const prunedRepair = this.planValidator.pruneSteps(repairedPlan, inventory);
                    console.log(`\n\u{b3} Repaired plan: ${prunedRepair.steps.length} steps, target=${resolveTarget(repairedPlan)}`);
                    prunedRepair.steps.forEach(s => {
                        const skipTag = s.skip ? ' [SKIP]' : '';
                        const cmdDisplay = s.command || (s.freeformGoal ? '[freeform]' : (s.action_cmd?.[0] || 'N/A'));
                        console.log(`  ${s.step}. ${s.goal} \u2192 ${cmdDisplay}${skipTag}`);
                    });
                    console.log('');
                    return {
                        reasoning: repairedPlan.reasoning,
                        steps: prunedRepair.steps,
                        target: resolveTarget(repairedPlan)
                    };
                } else {
                    console.log('\u2705 Plan validation passed');
                }

                // Step ordering validation — catch plans that craft target first then gather
                const orderingCheck = this.planValidator.validateStepOrdering({
                    steps: plan.steps,
                    target: resolveTarget(plan)
                });
                if (!orderingCheck.valid) {
                    console.log(`\n\u26a0\uFE0F Step ordering issues:`);
                    for (const issue of orderingCheck.issues) {
                        console.log(`  - ${issue}`);
                    }
                    // Retry with ordering feedback
                    const orderingPrompt = '\n## \u26a0\uFE0F STEP ORDERING ERROR\n' +
                        orderingCheck.issues.map(i => `- ${i}`).join('\n') +
                        '\n\nRegenerate the plan with steps in CORRECT DEPENDENCY ORDER:\n' +
                        '1. Collect raw materials (collectBlocks)\n' +
                        '2. Process materials (smeltItem)\n' +
                        '3. Craft components (craftRecipe for sticks, etc.)\n' +
                        '4. Craft final item (craftRecipe for target) \u2014 MUST be the LAST step\n' +
                        '\nOutput the corrected plan EXACTLY ONCE.\n';

                    const orderingRetryPrompt = fewshotPrompt + orderingPrompt;
                    try {
                        const retryResponse = await this.model.sendRequest([
                            { role: 'user', content: orderingRetryPrompt }
                        ], 'You are a Minecraft crafting expert. Steps must be in dependency order.');
                        const retryRaw = this.fewShotLearning.parseExecutionPlan(retryResponse, intent.input);
                        const retryPlan = retryRaw ? this._splitBundledCraftSteps(retryRaw) : retryRaw;
                        if (retryPlan && retryPlan.steps.length > 0) {
                            const recheck = this.planValidator.validateStepOrdering({
                                steps: retryPlan.steps,
                                target: resolveTarget(retryPlan)
                            });
                            if (recheck.valid) {
                                console.log(`\n\u{b3} Retry plan (ordering fixed): ${retryPlan.steps.length} steps`);
                                // Prune steps whose output is already in inventory
                                const prunedOrderRetry = this.planValidator.pruneSteps({ steps: retryPlan.steps }, inventory);
                                retryPlan.steps = prunedOrderRetry.steps;
                                retryPlan.steps.forEach(s => {
                                    console.log(`  ${s.step}. ${s.goal} \u2192 ${s.command || 'N/A'}`);
                                });
                                console.log('');
                                return {
                                    reasoning: retryPlan.reasoning,
                                    steps: retryPlan.steps,
                                    target: resolveTarget(retryPlan)
                                };
                            } else {
                                console.log(`\n\u26a0\uFE0F Retry plan still has ordering issues, using original plan`);
                            }
                        }
                    } catch (retryError) {
                        console.warn('[ImplicitEnhancer] Ordering retry failed:', retryError.message);
                    }
                }

                // Prune steps whose output is already in inventory
                const pruned = this.planValidator.pruneSteps({ steps: plan.steps }, inventory);
                plan.steps = pruned.steps;
                const skippedCount = plan.steps.filter(s => s.skip).length;
                if (skippedCount > 0) {
                    console.log(`  [PRUNE] ${skippedCount}/${plan.steps.length} steps already satisfied, will skip`);
                }

                return {
                    reasoning: plan.reasoning,
                    steps: plan.steps,
                    target: resolveTarget(plan)  // AI识别目标物品
                };
            } else {
                this.logDebug('Failed to parse execution plan from AI response');
                return null;
            }
        } catch (error) {
            console.error('[ImplicitEnhancer] error in few-shot learning:', error);
            return null;
        }
    }

    /**
     * Execute a single step: directly invoke command, bypass LLM
     */
    async executeStep(step) {
        // collect_freeform step: LLM decides which variant to use at runtime
        if (step.freeformGoal) {
            const preSnapshot = this._snapshotInventory(this.agent?.bot);
            const agentState = this.getAgentState();
            const result = await this.executeFreeformStep(step.freeformGoal, agentState);
            const postSnapshot = this._snapshotInventory(this.agent?.bot);
            return {
                commands: result.commands,
                responses: result.responses,
                preSnapshot,
                postSnapshot,
                abortedAt: result.success ? null : 0,
                command: result.commands[0] || null,
                response: result.responses.join('\n')
            };
        }

        // Collect all commands: prefer action_cmd array, fallback to single command
        const commands = [];
        if (step.action_cmd?.length > 0) {
            commands.push(...step.action_cmd);
        } else if (step.command) {
            commands.push(step.command);
        }

        if (commands.length === 0) {
            return {
                commands: [], responses: [],
                preSnapshot: null, postSnapshot: null, abortedAt: null,
                // backward compat
                command: null,
                response: `No command found for step: ${step.goal}`
            };
        }

        // Snapshot before any command
        const preSnapshot = this._snapshotInventory(this.agent?.bot);

        const executedCommands = [];
        const responses = [];
        let abortedAt = null;

        for (let i = 0; i < commands.length; i++) {
            let cmd = commands[i];
            let collectContext = null;

            // BlockNameResolver: per-command resolution for commands with BlockName params
            const blockCmdMatch = cmd.match(/!(collectBlocks|searchForBlock)\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
            if (blockCmdMatch) {
                const [, cmdName, conceptName, amountOrRange] = blockCmdMatch;
                const result = this.blockNameResolver.resolve(conceptName);
                if (result.blockName) {
                    cmd = `!${cmdName}("${result.blockName}", ${amountOrRange})`;
                    this.logDebug(`BlockName resolved: "${conceptName}" → "${result.blockName}" (${result.source}, range=${result.range})`);
                }
                if (cmdName === 'collectBlocks') {
                    collectContext = {
                        conceptName,
                        resolvedBlockName: result.blockName || conceptName,
                        amount: parseInt(amountOrRange, 10),
                        resolvedSource: result.source,
                        resolvedCandidates: result.candidates || []
                    };
                }
            }

            // CraftVariantResolver: substitute fungible craft variant based on available inventory
            // e.g. !craftRecipe("oak_planks", 4) → !craftRecipe("acacia_planks", 4) if bot has acacia_log
            if (cmd.includes('craftRecipe')) {
                cmd = this._resolveCraftVariant(cmd);
            }

            executedCommands.push(cmd);
            let response;
            try {
                response = await executeCommand(this.agent, cmd);
            } catch (err) {
                response = err.message || 'Command execution threw an error';
                abortedAt = i;
                responses.push(response);
                break;  // Exception → stop remaining commands
            }
            responses.push(response);

            if (collectContext) console.log(`[FALLBACK-DEBUG] collectContext.resolvedSource="${collectContext.resolvedSource}" response="${response}"`);

            // collectBlocks fallback:
            // If resolve() already knows no blocks are nearby (mcdata_fallback), skip the doomed collectBlocks
            // and go directly to searchForBlock-based candidate rotation.
            // Otherwise, check if the response indicates failure and retry.
            const needsFallback = collectContext &&
                this._shouldRetryCollectWithCandidates(response);
            if (needsFallback && collectContext) {
                this.logDebug(
                    `Collect fallback triggered for "${collectContext.conceptName}" (source=${collectContext.resolvedSource})`
                );
                const fallback = await this._tryCollectFallbackCandidates(collectContext);
                if (fallback.recovered) {
                    executedCommands.push(...fallback.commands);
                    responses.push(...fallback.responses);
                    continue;
                }
                executedCommands.push(...fallback.commands);
                responses.push(...fallback.responses);
            }

            // Obvious format error → stop remaining commands
            if (typeof response === 'string' &&
                (response.startsWith('Error:') || response.startsWith('Command is incorrectly'))) {
                abortedAt = i;
                break;
            }
        }

        // Snapshot after all commands (or abort)
        // Inventory-sync window: craft/smelt/collect return before the server's
        // set_slot / window_items / pickup resync reaches bot.inventory. Reading
        // immediately can miss the just-produced/just-collected item, which then
        // makes the downstream SEMANTIC/MISSING_TOOL checks (and the next step's
        // collectBlock.equipForBlock) see a stale inventory — a step succeeds yet is
        // judged "no target gained" or the next step reports the item missing (the
        // equip/sync race documented in docs/decisions/live-self-correction-bounded-
        // deterministic.md and craft-no-reclaim-table.md). collect needs this too:
        // pickupNearbyItems' entity→inventory transfer lags collectBlock's return.
        // Wait briefly so the snapshot is authoritative.
        if (executedCommands.some(c => c.includes('craftRecipe') || c.includes('smeltItem') || c.includes('collectBlocks'))) {
            await new Promise(r => setTimeout(r, 400));
        }
        const postSnapshot = this._snapshotInventory(this.agent?.bot);

        return {
            commands: executedCommands, responses,
            preSnapshot, postSnapshot, abortedAt,
            // backward compat
            command: executedCommands[0] || null,
            response: responses.join('\n')
        };
    }

    /**
     * Layer 3: LLM Judge (SEMANTIC only).
     * Simplified: LLM only judges success/failure and provides a SUBTASK_GOAL.
     * Recovery steps are generated by resolveDependencyChain, not the LLM.
     */
    async judgeAndPlan(step, executionResult) {
        const { commands, responses, preSnapshot, postSnapshot, abortedAt } = executionResult;

        if (!commands || commands.length === 0) {
            return {
                success: false,
                reason: executionResult.response || 'No commands executed',
                subtask: null
            };
        }

        // Fast path: deterministic inventory check avoids LLM call for clear successes.
        // Inventory snapshot is ground truth — more reliable than LLM format compliance.
        if (preSnapshot && postSnapshot) {
            // Check if the step's command target item was gained
            const stepTarget = _extractItemFromCmd(step.action_cmd || step.command || commands);
            if (stepTarget) {
                const gained = (postSnapshot.get(stepTarget) ?? 0) - (preSnapshot.get(stepTarget) ?? 0);
                if (gained > 0) {
                    return { success: true, reason: `gained ${gained}x ${stepTarget}`, subtask: null };
                }
                // Mining a block often yields a different item name than the block
                // itself (stone→cobblestone, iron_ore→raw_iron, diamond_ore→diamond).
                // _collectPeers already encodes this for _deterministicRecovery; reuse
                // it here so a successful collect isn't misjudged as "goal not achieved"
                // and sent to the LLM judge, which only sees free-text step.goal and has
                // no way to know cobblestone satisfies a "mine stone" target.
                const collectPeers = this._collectPeers(stepTarget);
                if (collectPeers) {
                    for (const peer of collectPeers) {
                        const peerGained = (postSnapshot.get(peer) ?? 0) - (preSnapshot.get(peer) ?? 0);
                        if (peerGained > 0) {
                            return { success: true, reason: `gained ${peerGained}x ${peer} (peer of ${stepTarget})`, subtask: null };
                        }
                    }
                }
            }
            // Check fungible variants (e.g. collected acacia_log when goal said oak_log)
            const fungibleHit = this._findGainedFungible(step.goal, executionResult);
            if (fungibleHit) {
                return { success: true, reason: `Fungible match: ${fungibleHit.gained} ≈ ${fungibleHit.wanted}`, subtask: null };
            }
        }

        // ponytail: craftRecipe auto-equips armor via bot.armorManager.equipAll(), moving the item
        // to slots 5-8 which bot.inventory.items() excludes — snapshot delta always reads 0 for armor.
        // skills.js only logs "Successfully crafted" after verifying craftedCount > 0 via updateSlot listener.
        if (responses.some(r => /successfully crafted/i.test(r))) {
            return { success: true, reason: 'craftRecipe skill confirmed success', subtask: null };
        }

        const diff = this._buildInventoryDiff(preSnapshot, postSnapshot);
        const beforeObj = preSnapshot ? Object.fromEntries(preSnapshot) : {};
        const afterObj = postSnapshot ? Object.fromEntries(postSnapshot) : {};

        const executionLog = responses.map((r, i) =>
            `Command ${i + 1}: ${commands[i]}\nResponse: ${r}`
        ).join('\n\n');

        const abortNote = abortedAt !== null
            ? `\nNote: Execution stopped at command ${abortedAt + 1}/${commands.length} due to error.`
            : '';

        const recentHistory = this._recentObservations.length > 0
            ? `\n## Recent Completed Steps\n${this._recentObservations.join('\n')}\n`
            : '';

        const prompt = `
You are judging whether a Minecraft bot successfully completed a step.
Analyze the executed commands, responses, and inventory changes.
${recentHistory}
## Step
Goal: ${step.goal}

## Executed Commands
${executionLog}${abortNote}

## Inventory
Before: ${JSON.stringify(beforeObj)}
After: ${JSON.stringify(afterObj)}
Changes: ${diff}

## Instructions
- SUCCESS=true if the step's GOAL was achieved (check inventory changes, not just command responses)
- SUCCESS=false if the goal was NOT achieved
- CATEGORY: classify the failure type if not successful
- SUBTASK_GOAL: one sentence describing what the bot needs to do next (only when failed)

## Minecraft Knowledge
- Variants of the same material category are interchangeable for crafting. Examples:
  - Any _log variant (oak_log, acacia_log, birch_log, spruce_log, etc.) satisfies a "collect logs" goal.
  - Any _planks variant satisfies a "collect planks" goal.
  - raw_iron and iron_ore are interchangeable inputs (both yield iron_ingot when smelted).
- Judge by whether the FUNCTIONAL PURPOSE was achieved, not whether the exact item name matches.

## Output (structured text, one field per line — no JSON, no markdown)
SUCCESS: true or false
CATEGORY: LOCATION_FAIL | ENTITY_NOT_FOUND | UNKNOWN
SUBTASK_ITEM: <minecraft item name in snake_case, e.g. stone_pickaxe — only when SUCCESS=false>
SUBTASK_GOAL: <one sentence, only when SUCCESS=false>
REASON: <brief explanation>
`;
        try {
            const aiResponse = await this.model.sendRequest(
                [{ role: 'user', content: prompt }],
                'You are a Minecraft execution judge. Respond with structured text only. No JSON, no markdown.'
            );

            const success = /^\s*SUCCESS\s*:\s*true/im.test(aiResponse);
            const reasonMatch = aiResponse.match(/REASON\s*:\s*(.+)/i);
            const reason = reasonMatch ? reasonMatch[1].trim() : '';

            if (success) {
                return { success: true, reason, subtask: null };
            }

            // Failure: extract SUBTASK_ITEM (structured) or SUBTASK_GOAL (fallback) → resolveDependencyChain
            const itemMatch = aiResponse.match(/SUBTASK_ITEM\s*:\s*(.+)/i);
            const subtaskItem = itemMatch ? itemMatch[1].trim() : '';
            const goalMatch = aiResponse.match(/SUBTASK_GOAL\s*:\s*(.+)/i);
            const subtaskGoal = goalMatch ? goalMatch[1].trim() : '';

            if ((subtaskItem || subtaskGoal) && this.recipeResolver) {
                const agentState = this.getAgentState();
                const invMap = new Map(agentState.inventory.map(i => [i.name, i.count]));
                // Priority: structured SUBTASK_ITEM > command extraction > goal text parsing
                const targetItem = subtaskItem
                    || _extractItemFromCmd(step.action_cmd || step.command)
                    || _extractItemFromCmd(commands)
                    || this._extractItemFromGoal(subtaskGoal, invMap);

                if (targetItem) {
                    const chain = this.recipeResolver.resolveDependencyChain(targetItem, invMap);
                    if (chain.length > 0) {
                        const subSteps = chain.map(c => this._createStep(c));
                        return {
                            success: false,
                            reason: reason || subtaskGoal,
                            subtask: {
                                name: subtaskGoal,
                                steps: subSteps
                            }
                        };
                    }
                }
            }

            return { success: false, reason: reason || subtaskGoal || 'LLM judge: no recovery possible', subtask: null };
        } catch (err) {
            this.logDebug('judgeAndPlan error:', err.message);
            return {
                success: false,
                reason: `Fallback judgment (parse error): ${err.message}`,
                subtask: null
            };
        }
    }

    _buildInventoryDiff(preSnapshot, postSnapshot) {
        if (!preSnapshot || !postSnapshot) return 'no snapshot available';
        const changes = [];
        for (const [name, count] of postSnapshot) {
            const pre = preSnapshot.get(name) || 0;
            if (count > pre) changes.push(`${name}(+${count - pre})`);
            else if (count < pre) changes.push(`${name}(-${pre - count})`);
        }
        for (const [name, count] of preSnapshot) {
            if (!postSnapshot.has(name)) changes.push(`${name}(-${count})`);
        }
        return changes.length > 0 ? changes.join(', ') : 'no changes';
    }

    /**
     * Deterministically repair a plan by inserting resolveDependencyChain steps
     * before each failing step. Replaces LLM retry for gap filling.
     *
     * @param {object} plan - original plan { steps, target, reasoning }
     * @param {Array} gaps - from planValidator.validate()
     * @param {Array} inventory - current bot inventory [{ name, count }]
     * @returns {object} repaired plan with renumbered steps
     */
    _repairPlanGaps(plan, gaps, inventory) {
        // Ensure resolver has bot reference so crafting graph is available
        if (this.recipeResolver && this.agent?.bot && !this.recipeResolver.bot) {
            this.recipeResolver.bot = this.agent.bot;
        }
        const invMap = new Map((inventory || []).map(i => [i.name, i.count || 1]));

        // Deduplicate gaps by missing item name so we only generate one chain per item
        // Skip unsupported-produce gaps: those mean the LLM declared a wrong produces field,
        // NOT that a prerequisite item is missing. Inserting a dependency chain for them
        // generates spurious smelt/craft steps (e.g. smeltItem("cobblestone") to "produce" stone
        // when collectBlocks("stone") already yields cobblestone at runtime).
        const seenItems = new Set();
        const insertBefore = new Map(); // originalStepNum → [itemName, ...]
        for (const gap of gaps) {
            if (gap.display?.startsWith('unsupported-produce:')) continue;
            // Skip station:crafting_table gaps for 2x2-craftable items.
            // oak_planks and crafting_table itself don't need a crafting_table
            // station — inserting a repair chain for them wastes one oak_log and
            // creates duplicate steps that cause plank shortages at wooden_pickaxe.
            if (gap.missingPrecondition?.type === 'station' &&
                gap.missingPrecondition?.name === 'crafting_table') {
                const stepObj = plan.steps.find(s => s.step === gap.step);
                const craftCmd = (stepObj?.action_cmd || []).find(c => /craftRecipe/.test(c));
                const m = craftCmd?.match(/craftRecipe\(\s*['"]([^'"]+)['"]/);
                if (!m || _INV_CRAFTABLE.has(m[1])) continue;
            }
            // Skip self-referential gaps: the LLM sometimes lists the very item a
            // step crafts/smelts as that step's own precondition (copy artifact
            // from few-shot examples showing a *different* step's tool requirement).
            // Backfilling it duplicates steps 1..N and starves materials for the
            // step's real craft (e.g. wooden_pickaxe double-craft failure).
            if (gap.missingPrecondition?.type === 'item') {
                const stepObj = plan.steps.find(s => s.step === gap.step);
                const gapItem = gap.missingPrecondition.name;
                const producesList = Array.isArray(stepObj?.produces) ? stepObj.produces : [stepObj?.produces];
                const selfReferential = (stepObj?.action_cmd || []).some(c => {
                    const cm = c.match(/(?:craftRecipe|smeltItem)\(\s*['"]([^'"]+)['"]/);
                    return cm && cm[1] === gapItem;
                }) || producesList.some(p => p?.name === gapItem);
                if (selfReferential) continue;
                // Misnamed-ingredient check: the LLM sometimes declares a colloquial/wrong
                // item name (e.g. "stone" instead of "cobblestone") as a step's precondition.
                // If this step crafts a real, resolvable mcData recipe and gapItem isn't
                // actually one of that recipe's ingredients, the declared precondition is a
                // naming artifact, not a real gap — backfilling it built a real smelt/furnace
                // chain for an item nothing actually needs.
                // NOTE: deliberately NOT using RecipeResolver.resolveInventoryAlias() here —
                // its substring + highest-inventory-count heuristic can misresolve unrelated
                // items (e.g. "stone" -> "redstone", "iron" -> "raw_iron" when those happen to
                // have a higher count), which would silently mask genuine gaps.
                const craftCmd = (stepObj?.action_cmd || []).find(c => /craftRecipe\(/.test(c));
                const craftMatch = craftCmd?.match(/craftRecipe\(\s*['"]([^'"]+)['"]/);
                const realRecipes = craftMatch ? this.recipeResolver?.craftingRecipesFor?.(craftMatch[1]) : null;
                if (realRecipes && realRecipes.length > 0) {
                    const isRealIngredient = realRecipes.some(r => r.ingredients.some(ing => ing.name === gapItem));
                    if (!isRealIngredient) continue;
                }
            }
            const itemName = gap.missingPrecondition.name;
            // 保留 gap 数量:quantity gap(如 cobblestone:8)必须把 neededCount 传给
            // resolveDependencyChain,否则它默认 neededCount=1,看到库存已有 ≥1 就
            // 跳过 → 漏修(stone_button furnace bug:collect 1 却需要 8)。
            const needCount = gap.missingPrecondition.count || 1;
            if (seenItems.has(itemName)) continue;
            seenItems.add(itemName);
            if (!insertBefore.has(gap.step)) insertBefore.set(gap.step, []);
            insertBefore.get(gap.step).push({ name: itemName, count: needCount });
        }

        const newSteps = [];
        for (const step of plan.steps) {
            if (insertBefore.has(step.step)) {
                for (const { name: itemName, count: needCount } of insertBefore.get(step.step)) {
                    try {
                        const chain = this.recipeResolver.resolveDependencyChain(itemName, invMap, needCount);
                        for (const c of (chain || [])) {
                            newSteps.push(this._createStep(c));
                            // Track production
                            invMap.set(c.acquire, (invMap.get(c.acquire) ?? 0) + c.count);
                            // Track consumption (craft/smelt steps consume ingredients)
                            if (c.consumes) {
                                for (const [name, count] of Object.entries(c.consumes)) {
                                    invMap.set(name, (invMap.get(name) ?? 0) - count);
                                }
                            }
                        }
                    } catch (e) {
                        this.logDebug(`Gap repair chain failed for ${itemName}: ${e.message}`);
                    }
                }
            }
            newSteps.push(step);
            // Track this step's produces so subsequent gap repairs don't re-insert
            // items already made by an earlier plan step (e.g. crafting_table duplicate).
            if (step.produces) {
                const produces = Array.isArray(step.produces) ? step.produces : [step.produces];
                for (const p of produces) {
                    if (p?.type === 'item' && p.name) {
                        invMap.set(p.name, (invMap.get(p.name) ?? 0) + (p.count || 1));
                    }
                }
            }
        }

        return { ...plan, steps: newSteps.map((s, i) => ({ ...s, step: i + 1 })) };
    }

    /**
     * Create a plan step from a resolveDependencyChain chain item.
     * Fungible-aware: craft steps for fungible items (planks, wool, etc.)
     * automatically get freeformGoal instead of concrete craftRecipe command.
     * collect_freeform steps use concrete collectBlocks (BlockNameResolver handles
     * variant rotation at execution time — more reliable than LLM for 8B models).
     */
    _createStep(c) {
        const produces = { type: 'item', name: c.acquire, count: c.count };

        // collect_freeform: concrete command + BlockNameResolver fallback
        if (c.via === 'collect_freeform') {
            return {
                goal: `Collect ${c.count}x ${c.acquire} (any available variant)`,
                action_cmd: [`!collectBlocks("${c.acquire}", ${c.count})`],
                produces
            };
        }

        // craft (incl. fungible variants like oak_planks), smelt, collect: all use a
        // concrete static command below. craft is intentionally NOT routed to
        // freeform — LLM-generated freeform craft commands were unreliable (dropped
        // quotes → parser param-count failure, plus inventory-ignoring variant
        // choice). See docs/decisions/craft-static-not-freeform.md.
        // Everything else: concrete command
        // smelt INPUT is in c.consumes (e.g. cobblestone), not c.acquire (which is the OUTPUT, e.g. stone)
        const smeltInput = c.via === 'smelt' ? (Object.keys(c.consumes || {})[0] || c.acquire) : null;
        const cmd = c.via === 'collect' ? `!collectBlocks("${c.acquire}", ${c.count})`
            : c.via === 'smelt' ? `!smeltItem("${smeltInput}", ${c.count})`
            : `!craftRecipe("${c.acquire}", ${c.count})`;
        return {
            goal: `${c.via === 'collect' ? 'Collect' : c.via === 'smelt' ? 'Smelt' : 'Craft'} ${c.count}x ${c.acquire}`,
            action_cmd: [cmd],
            produces
        };
    }

    /**
     * Fungible step abstractification — currently a no-op passthrough.
     *
     * Previously converted fungible craftRecipe steps (e.g. oak_planks) into
     * freeformGoal so the LLM could pick a variant matching inventory. This was
     * unreliable for 8B models on TWO axes: (1) the LLM dropped quotes around the
     * item name (!craftRecipe(acacia_planks,4)), which the command parser rejected
     * via param-count mismatch; (2) even with correct syntax it picked variants
     * not in inventory (acacia_planks while only oak_log was available).
     *
     * craft now follows the SAME static-command pattern as collectBlocks — the
     * plan's concrete !craftRecipe("oak_planks",N) is executed directly, with no
     * LLM in the command-generation loop. Variant resolution is deferred to a
     * future inventory-aware resolver if the oak→birch edge case ever matters
     * (the 20-task live eval stages oak_log only, so it does not). collectBlocks
     * variant rotation is handled at execution time by BlockNameResolver and is
     * unaffected here. See docs/decisions/craft-static-not-freeform.md.
     *
     * Kept as an explicit no-op hook (rather than deleted) so a future
     * inventory-aware variant replacement has a natural insertion point.
     */
    _abstractifyFungibleSteps(plan) {
        return plan;
    }

    /**
     * Split bundled multi-craft steps so each sub-step holds ≤1 craftRecipe/smeltItem.
     *
     * A SAER-style step ("Collect logs and craft basic tools") packs several
     * craftRecipe commands into one action_cmd array. executeStep runs them in a
     * loop, but the deterministic success check (_extractItemFromCmd) verifies only
     * the FIRST command's target — so if the LAST craft silently fails (mineflayer
     * window-sync race, no throw → abortedAt stays null), the step is still marked
     * succeeded and the missing item surfaces later as a downstream plan-gap (e.g.
     * "missing tool wooden_pickaxe for stone"). One command per sub-step makes each
     * craft its own verify point, matching the working one-command-per-step
     * (no_retrieval) path. See docs/decisions/bundled-step-false-success-fix.md.
     *
     * Only steps with ≥2 craft/smelt commands are split; everything else (single
     * craft, pure collect, freeformGoal) passes through unchanged. Runtime only —
     * static_plan_eval never calls this, so paper Table 2/3 numbers are untouched.
     */
    _splitBundledCraftSteps(plan) {
        if (!plan?.steps?.length) return plan;

        const isCraftOrSmelt = (cmd) => cmd.includes('craftRecipe') || cmd.includes('smeltItem');
        const out = [];

        for (const step of plan.steps) {
            const cmds = step.action_cmd?.length > 0
                ? step.action_cmd
                : (step.command ? [step.command] : []);
            const craftCount = cmds.filter(isCraftOrSmelt).length;

            // No craft/smelt, only 1 command, or freeform → leave the step as-is.
            // Split when ≥2 cmds and at least one is craft/smelt (covers craft+craft AND collect+craft).
            if (craftCount < 1 || cmds.length < 2 || step.freeformGoal) {
                out.push(step);
                continue;
            }

            // ≥2 commands with ≥1 craft/smelt → one command per sub-step. Original preconditions gate
            // entry to the whole bundle, so they go on the first sub-step only; later
            // sub-steps rely on earlier produces via the validator's virtual inventory.
            cmds.forEach((cmd, i) => {
                out.push({
                    ...step,
                    goal: this._deriveStepGoal(cmd) || `${step.goal} (part ${i + 1})`,
                    command: cmd,
                    action_cmd: [cmd],
                    preconditions: i === 0 ? (step.preconditions || []) : [],
                    produces: this._deriveProducesFromCmd(cmd)
                });
            });
            this.logDebug(`_splitBundledCraftSteps: "${step.goal}" (${cmds.length} cmds, ${craftCount} craft/smelt) → ${cmds.length} sub-steps`);
        }

        // Renumber sequentially so step numbers stay consecutive after splitting.
        return { ...plan, steps: out.map((s, i) => ({ ...s, step: i + 1 })) };
    }

    /** Item + count from a single craft/smelt/collect command, count defaulting to 1. */
    _parseCmdItemCount(cmd) {
        const item = _extractItemFromCmd(cmd);
        if (!item) return null;
        const countMatch = cmd.match(/,\s*(\d+)\s*\)/);
        return { item, count: countMatch ? parseInt(countMatch[1], 10) : 1 };
    }

    /** Derive a step's produces from its single command (smelt maps input→output). */
    _deriveProducesFromCmd(cmd) {
        const parsed = this._parseCmdItemCount(cmd);
        if (!parsed) return null;
        const name = cmd.includes('smeltItem')
            ? (SMELTING_OUTPUTS[parsed.item] || parsed.item)
            : parsed.item;
        return { type: 'item', name, count: parsed.count };
    }

    /** Human-readable goal for a split sub-step, derived from its single command. */
    _deriveStepGoal(cmd) {
        const parsed = this._parseCmdItemCount(cmd);
        if (!parsed) return null;
        const verb = cmd.includes('collectBlocks') ? 'Collect'
            : cmd.includes('smeltItem') ? 'Smelt'
            : cmd.includes('craftRecipe') ? 'Craft'
            : null;
        return verb ? `${verb} ${parsed.count}x ${parsed.item}` : null;
    }

    /**
     * Resolve a !craftRecipe command to a fungible peer whose ingredients are
     * actually available in the bot's current inventory.
     *
     * Example: !craftRecipe("oak_planks", 4) when bot has acacia_log
     *   → !craftRecipe("acacia_planks", 4)
     *
     * Falls through to original command when:
     * - item is not fungible
     * - bot snapshot unavailable
     * - original command's ingredients are already satisfied
     * - no peer can be satisfied either (let downstream error handling take over)
     *
     * @param {string} cmd  - raw command string, e.g. !craftRecipe("oak_planks", 4)
     * @returns {string}    - resolved command (may be unchanged)
     */
    _resolveCraftVariant(cmd) {
        const match = cmd.match(/!craftRecipe\(["']([^"']+)["']\s*,\s*(\d+)\)/);
        if (!match) return cmd;

        const [, targetItem, countStr] = match;

        if (!this.recipeResolver?.isFungible?.(targetItem)) return cmd;

        const invMap = this._snapshotInventory(this.agent?.bot);
        if (!invMap) return cmd;

        // Fast path: if original item is craftable, no substitution needed
        if (this._canCraftFromInventory(targetItem, invMap)) return cmd;

        const peers = this.recipeResolver.getFungiblePeers(targetItem) || [];
        for (const peer of peers) {
            if (peer === targetItem) continue;
            if (this._canCraftFromInventory(peer, invMap)) {
                this.logDebug(`[CraftVariant] "${targetItem}" → "${peer}" (inventory-aware substitution)`);
                console.log(`  [CraftVariant] Substituting "${targetItem}" → "${peer}" based on inventory`);
                return `!craftRecipe("${peer}", ${countStr})`;
            }
        }

        return cmd;
    }

    /**
     * Check if all ingredients for any recipe variant of itemName are available in inventoryMap.
     *
     * @param {string} itemName
     * @param {Map<string,number>} inventoryMap
     * @returns {boolean}
     */
    _canCraftFromInventory(itemName, inventoryMap) {
        const recipes = this.recipeResolver?.craftingRecipesFor?.(itemName);
        if (!recipes || recipes.length === 0) return false;
        return recipes.some(recipe =>
            recipe.ingredients.every(ing =>
                (inventoryMap.get(ing.name) ?? 0) >= ing.count
            )
        );
    }

    _snapshotInventory(bot) {
        if (!bot?.inventory?.items) return null;
        const snapshot = new Map();
        try {
            for (const item of bot.inventory.items()) {
                const current = snapshot.get(item.name) || 0;
                snapshot.set(item.name, current + item.count);
            }
            // Armor slots (5=helmet,6=chest,7=legs,8=boots) — mirrors _buildInventoryMap.
            // Crafted armor auto-equips and won't appear in items() without this.
            for (const slotIdx of [5, 6, 7, 8]) {
                const item = bot?.inventory?.slots?.[slotIdx];
                if (item?.name) snapshot.set(item.name, (snapshot.get(item.name) || 0) + item.count);
            }
        } catch (err) {
            this.logDebug(`_snapshotInventory: items() threw: ${err.message}`);
            return null;
        }
        return snapshot;
    }

    _shouldRetryCollectWithCandidates(response) {
        return this._isCollectNameOrRangeFailure(response);
    }

    _isCollectNameOrRangeFailure(response) {
        if (!response || typeof response !== 'string') return false;
        const text = response.toLowerCase();

        // Invalid name / alias, e.g. "Invalid block type: xxx"
        if (text.includes('invalid block type')) return true;

        // Nearby/range failures from collect flow (multiple phrasings)
        if (text.includes('nearby to collect')) return true;
        if (text.includes('likely out of range')) return true;
        if (text.includes('collected 0 ')) return true;
        if (/no\s+.+\s+collected/.test(text)) return true;
        if (text.includes('could not find any')) return true;
        if (/no\s+.+\s+nearby/.test(text)) return true;

        // Debug: log unmatched responses for future pattern discovery
        this.logDebug(`[fallback] unmatched collect response: "${text.substring(0, 200)}"`);

        return false;
    }

    _searchNotFound(response) {
        if (!response || typeof response !== 'string') return true;
        const text = response.toLowerCase();
        // Whitelist: only known success patterns mean "found".
        // goToNearestBlock success: "Found X at Y. Navigating..."
        // Anything else (error, timeout, unknown format) → treat as not found
        const successPatterns = ['found', 'moving to', 'navigating', 'heading to'];
        return !successPatterns.some(p => text.includes(p));
    }

    _collectFailed(response) {
        return this._isCollectNameOrRangeFailure(response);
    }

    async _tryCollectFallbackCandidates({ conceptName, resolvedBlockName, amount, resolvedCandidates }) {
        const extraCommands = [];
        const extraResponses = [];
        const MAX_ATTEMPTS = 20;

        // Candidate order:
        // 1) current resolved name first (if any)
        // 2) mcData candidate order (generic across all block families)
        // Prefer pre-computed candidates from resolve() to avoid redundant computation
        const candidatePlan = resolvedCandidates?.length > 0
            ? resolvedCandidates
            : this.blockNameResolver.getCandidatePlan(conceptName, 12);
        const seen = new Set();
        const candidates = [];

        const addCandidate = (name) => {
            if (!name || seen.has(name)) return;
            seen.add(name);
            candidates.push(name);
        };

        addCandidate(resolvedBlockName);
        for (const name of candidatePlan) addCandidate(name);

        if (candidates.length === 0) {
            return { recovered: false, commands: extraCommands, responses: extraResponses };
        }

        const ranges = [32, 64, 96, 128];
        for (const candidate of candidates) {
            for (const range of ranges) {
                if (extraCommands.length >= MAX_ATTEMPTS) {
                    this.logDebug(`Collect fallback hit max attempts (${MAX_ATTEMPTS}) for "${conceptName}"`);
                    return { recovered: false, commands: extraCommands, responses: extraResponses };
                }

                const searchCmd = `!searchForBlock("${candidate}", ${range})`;
                let searchRes;
                try {
                    searchRes = await executeCommand(this.agent, searchCmd);
                } catch (err) {
                    searchRes = err.message || 'searchForBlock threw an error';
                }
                extraCommands.push(searchCmd);
                extraResponses.push(searchRes);

                if (this._searchNotFound(searchRes)) {
                    continue;
                }

                const collectCmd = `!collectBlocks("${candidate}", ${amount})`;
                let collectRes;
                try {
                    collectRes = await executeCommand(this.agent, collectCmd);
                } catch (err) {
                    collectRes = err.message || 'collectBlocks threw an error';
                }
                extraCommands.push(collectCmd);
                extraResponses.push(collectRes);

                if (!this._collectFailed(collectRes)) {
                    this.logDebug(`Collect fallback succeeded: "${conceptName}" -> "${candidate}" (range=${range})`);
                    return { recovered: true, commands: extraCommands, responses: extraResponses };
                }
            }
        }

        this.logDebug(`Collect fallback exhausted for "${conceptName}" (candidates=${candidates.length})`);
        return { recovered: false, commands: extraCommands, responses: extraResponses };
    }

    /**
     * buildFallbackPrompt (when Few-shot fails)
     */
    buildFallbackPrompt(intent, systemPrompt) {
        let prompt = systemPrompt;
        prompt += `\n\nThe task is: ${intent.input}\n`;
        prompt += `please help complete this task step by step.\n`;
        prompt += this.buildCommandReference();
        return prompt;
    }

    /**
     * intent analysis (using AI)
     */
    async getIntent(turns, systemPrompt) {
        if (!turns || turns.length === 0) return null;

        const lastUserMessage = [...turns].reverse().find(msg => msg.role === 'user' && msg.content?.trim().length > 0);
        if (!lastUserMessage) return null;

        const userInput = lastUserMessage.content;
        let intentAnalysis;
        try {
            intentAnalysis = await this.determineIntentType(userInput);
        } catch (err) {
            console.warn('intent analysis failed:', err);
            intentAnalysis = { type: 'GENERAL', subtype: 'unknown' };
        }

        return {
            id: `intent_${Date.now()}`,
            source: 'user',
            input: userInput,
            type: intentAnalysis.type,
            subtype: intentAnalysis.subtype
        };
    }

    /**
     * intent classification (using AI, not rule matching)
     */
    async determineIntentType(input) {
        const prompt = `
# task: intent classification

analyze the user's request and classify their intent.

## user request
"${input}"

## intent categories

1. **CRAFT** - creating items, weapons, tools
   - keywords: craft, make, build, create, smith
   - examples: "craft an iron sword", "make a bow", "create shears"

2. **COOK** - cooking food or smelting ores in a furnace
   - keywords: cook, smelt, bake, roast, furnace
   - examples: "cook beef", "smelt iron ore", "bake a cake"

3. **COLLECT** - gathering resources from the environment
   - keywords: collect, gather, mine, chop, harvest, farm
   - examples: "collect iron ore", "gather wood", "mine diamonds"

4. **BUILD** - constructing structures or placing blocks
   - keywords: place, put, construct, build, structure
   - examples: "build a house", "place blocks", "construct a shelter"

5. **COMBAT** - fighting, killing, or defending against mobs
   - keywords: attack, kill, fight, slay, hunt, defeat
   - examples: "attack zombie", "kill the skeleton", "defeat a creeper"

6. **EXPLORE** - movement or exploration without combat
   - keywords: go to, find, explore, travel, search for
   - examples: "find a cave", "go to village", "explore the ravine"

7. **GENERAL** - other requests that don't fit above categories

## output format (json)
{
  "type": "CRAFT|COOK|COLLECT|BUILD|COMBAT|EXPLORE|GENERAL",
  "subtype": "more specific category",
  "confidence": "high|medium|low",
  "reasoning": "brief explanation"
}

## instructions
- analyze the user's main goal, not just keywords
- consider context and implied intent
- if uncertain, choose GENERAL with low confidence
`;

        try {
            const response = await this.model.sendRequest([
                { role: 'user', content: prompt }
            ], 'You are a task classification assistant. Always respond with valid JSON.');

            // parse AI response
            const parsed = this.parseIntentResponse(response);

            if (parsed) {
                this.logDebug(`AI classified intent: ${parsed.type} (${parsed.subtype}) - ${parsed.reasoning}`);
                return parsed;
            } else {
                this.logDebug('Failed to parse AI intent response, using fallback');
                return { type: 'GENERAL', subtype: 'unknown', confidence: 'low', reasoning: 'Parse failed' };
            }
        } catch (error) {
            console.warn('AI intent classification failed:', error.message);
            return { type: 'GENERAL', subtype: 'unknown', confidence: 'low', reasoning: 'AI call failed' };
        }
    }

    /**
     * parse AI intent classification response
     */
    parseIntentResponse(response) {
        if (!response) return null;
        try {
            // extract JSON
            let jsonStr = response;

            // remove markdown code block
            const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1];
            }

            // find JSON object
            const objectMatch = response.match(/\{[\s\S]*\}/);
            if (objectMatch) {
                jsonStr = objectMatch[0];
            }

            const parsed = JSON.parse(jsonStr);

            // validate required fields
            if (!parsed.type) {
                this.logDebug('Invalid intent response: missing type field');
                return null;
            }

            // normalize intent type to uppercase
            parsed.type = parsed.type.toUpperCase();

            // validate type is valid
            // must stay in sync with INTENT_TO_TRAINING_FILE — an emittable
            // label with no mapping silently falls back to crafting demos
            const validTypes = [...Object.keys(INTENT_TO_TRAINING_FILE).filter(k => k !== 'DEFAULT'), 'GENERAL'];
            if (!validTypes.includes(parsed.type)) {
                this.logDebug(`Invalid intent type: ${parsed.type}`);
                parsed.type = 'GENERAL';
            }

            return {
                type: parsed.type,
                subtype: parsed.subtype || 'unknown',
                confidence: parsed.confidence || 'medium',
                reasoning: parsed.reasoning || ''
            };
        } catch (error) {
            this.logDebug('Failed to parse intent JSON:', error.message);
            return null;
        }
    }

    /**
     * get relevant training data (preserve original logic)
     */
    async getRelevantInfo(intent) {
        if (!intent) return [];

        const relevantFiles = await this.getRelevantTrainingFiles(intent);
        if (this.debug) {
            console.log('\n' + '='.repeat(70));
            console.log('\ud83d} training data loading');
            console.log('='.repeat(70));
            console.log(`intent: ${intent.type}`);
            console.log(`Files to load: ${relevantFiles.length}`);
            relevantFiles.forEach(file => console.log(`  - ${file}`));
            console.log('='.repeat(70) + '\n');
        }

        let allExamples = [];

        for (const filePath of relevantFiles) {
            try {
                const trainingData = JSON.parse(readFileSync(filePath, 'utf8'));
                const usable = trainingData.filter(isDemonstration);
                if (usable.length < trainingData.length) {
                    console.warn(`\u26a0 ${filePath}: dropped ${trainingData.length - usable.length}/${trainingData.length} entries lacking the demonstration schema (name + non-empty plan)`);
                }
                allExamples = allExamples.concat(usable.map((ex, i) => ({
                    ...ex,
                    id: `${filePath}_${i}`,
                    source_file: filePath
                })));
                this.logDebug(`Loaded ${usable.length} examples from ${filePath}`);
            } catch (err) {
                console.warn(`\u2744 Failed to load training data from ${filePath}:`, err.message);
            }
        }

        // A routed file that yields nothing usable would hand the prompt builder
        // an empty demo set; fall back to the default file rather than degrade
        // silently to no-retrieval.
        if (allExamples.length === 0) {
            const fallback = join(this.trainingDir, INTENT_TO_TRAINING_FILE.DEFAULT);
            try {
                const fallbackData = JSON.parse(readFileSync(fallback, 'utf8')).filter(isDemonstration);
                allExamples = fallbackData.map((ex, i) => ({ ...ex, id: `${fallback}_${i}`, source_file: fallback }));
                console.warn(`\u26a0 No usable demonstrations for intent ${intent.type}; fell back to ${INTENT_TO_TRAINING_FILE.DEFAULT}`);
            } catch (err) {
                console.warn(`\u2744 Fallback training data unavailable:`, err.message);
            }
        }

        this.logDebug(`Total training examples loaded: ${allExamples.length}`);
        return allExamples;
    }

    getRelevantTrainingFiles(intent) {
        if (!intent) return [];
        const relevantFiles = new Set();
        const mainIntentFile = INTENT_TO_TRAINING_FILE[intent.type] || INTENT_TO_TRAINING_FILE.DEFAULT;
        relevantFiles.add(join(this.trainingDir, mainIntentFile));

        return Array.from(relevantFiles).filter(file => {
            try { readFileSync(file); return true; }
            catch { return false; }
        });
    }

    // --- action_manager callback interface ---

    markTaskDone(extra) {
        this.logDebug(`[markTaskDone] Action completed: ${extra?.actionLabel || 'unknown'}`);
    }

    markTaskFailed(extra) {
        this.logDebug(`[markTaskFailed] Action failed: ${extra?.actionLabel || 'unknown'}`);
    }

    markTaskInProgress(extra) {
        this.logDebug(`[markTaskInProgress] Action started: ${extra?.actionLabel || 'unknown'}`);
    }

    // --- helper methods ---

    buildCommandReference() {
        let reference = '\n## command reference & syntax\n';
        reference += 'commands use parentheses and double quotes for strings. examples:\n';
        reference += '- !collectBlocks("block_type", count)\n';
        reference += '- !craftRecipe("recipe_name", count) - can craft any item! use item names like "iron_sword", "diamond_pickaxe"\n';
        reference += '- !smeltItem("raw_item", count)\n';
        reference += '- !searchForBlock("block_type", search_range)\n';
        reference += '- !inventory\n';
        reference += '\n\u26a0\uFE0F important: do not use !newAction for standard crafting or collection tasks.\n';
        reference += 'all standard minecraft tasks can be done with the commands above.\n';
        return reference;
    }
}
