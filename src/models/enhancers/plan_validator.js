/**
 * PlanValidator — LLM 生成 Plan 的后置验证器（结构化版）
 *
 * 核心能力：
 * 1. 检查每个 step 的 preconditions 是否被 inventory 或前面步骤满足
 * 2. 生成 gap 反馈 prompt，让 LLM 重新生成修正后的 plan
 * 3. 最多重试 1 次，失败不阻塞
 * 4. 动态查配方，推断 craftRecipe 步骤的材料前置条件
 *
 * 数据格式：
 * - preconditions: [{ type: "item"|"station"|"access", name: string, count?: number }]
 * - produces: { type, name, count } | null
 *
 * 向后兼容：
 * - 旧格式字符串 preconditions 自动通过 parsePreconditionString() 转换
 * - 无 produces 字段时用 inferProduces() 从 command 推断
 *
 * 不做的事：
 * - 不查掉落表
 * - 不查环境
 */

import minecraftData from 'minecraft-data';
import { parsePrecondition, parseCommand, FUEL_ITEMS } from './precondition_parser.js';
import { SMELTING_OUTPUTS, TOOL_TIER_ORDER } from './recipe_resolver.js';

export { SMELTING_OUTPUTS };

/**
 * Minecraft 矿石 → 所需最低镐等级 映射表
 */
export const ORE_TOOL_REQUIREMENTS = {
    // wooden pickaxe tier
    'stone': 'wooden_pickaxe',
    'cobblestone': 'wooden_pickaxe',
    'coal_ore': 'wooden_pickaxe',
    'deepslate_coal_ore': 'wooden_pickaxe',
    // stone pickaxe tier
    'iron_ore': 'stone_pickaxe',
    'deepslate_iron_ore': 'stone_pickaxe',
    'copper_ore': 'stone_pickaxe',
    'deepslate_copper_ore': 'stone_pickaxe',
    'lapis_ore': 'stone_pickaxe',
    'deepslate_lapis_ore': 'stone_pickaxe',
    'redstone_ore': 'iron_pickaxe',       // mcData harvestTools: {831,836,841} = iron_pickaxe+
    'deepslate_redstone_ore': 'iron_pickaxe',
    // iron pickaxe tier
    'gold_ore': 'iron_pickaxe',
    'deepslate_gold_ore': 'iron_pickaxe',
    'diamond_ore': 'iron_pickaxe',
    'deepslate_diamond_ore': 'iron_pickaxe',
    'emerald_ore': 'iron_pickaxe',
    'deepslate_emerald_ore': 'iron_pickaxe',
    // diamond pickaxe tier
    'obsidian': 'diamond_pickaxe',
};

/**
 * Minecraft 镐等级链（低→高）
 * Re-exported from recipe_resolver for backward compatibility.
 */
export const TOOL_TIERS = TOOL_TIER_ORDER;

/**
 * 挖掘方块名 → 实际掉落物名（1.17+ raw drops + 无精准采集时的方块→掉落差异）
 * module-level so both inferProduces() and the precondition satisfaction
 * checks (isSatisfied/_isSatisfiedByVirtual) share one source of truth —
 * an LLM-declared precondition naming the block ("stone") must resolve to
 * the same item the block actually drops ("cobblestone") or it reads as a
 * false gap even though the virtual inventory already holds the item.
 */
export const BLOCK_DROP_ALIASES = {
    'iron_ore': 'raw_iron',            'deepslate_iron_ore': 'raw_iron',
    'gold_ore': 'raw_gold',             'deepslate_gold_ore': 'raw_gold',
    'copper_ore': 'raw_copper',         'deepslate_copper_ore': 'raw_copper',
    'diamond_ore': 'diamond',           'deepslate_diamond_ore': 'diamond',
    'emerald_ore': 'emerald',           'deepslate_emerald_ore': 'emerald',
    'coal_ore': 'coal',                 'deepslate_coal_ore': 'coal',
    'lapis_ore': 'lapis_lazuli',        'deepslate_lapis_ore': 'lapis_lazuli',
    'redstone_ore': 'redstone',         'deepslate_redstone_ore': 'redstone',
    'nether_quartz_ore': 'quartz',
    'stone': 'cobblestone',
    'deepslate': 'cobbled_deepslate',
    'clay': 'clay_ball',
    'grass_block': 'dirt'
};

/**
 * 命令 → 隐式工作站需求
 */
export const COMMAND_STATION_REQUIREMENTS = {
    'smeltItem': 'furnace',
    'craftRecipe': 'crafting_table',
};

export class PlanValidator {
    constructor(debug = false, bot = null) {
        this.debug = debug;
        this.bot = bot;
        this._mcData = null;
        this.recipeResolver = null;
    }

    setRecipeResolver(resolver) {
        this.recipeResolver = resolver;
    }

    logDebug(...args) {
        if (this.debug) {
            console.log('[PlanValidator]', ...args);
        }
    }

    /**
     * Lazy-load minecraft-data for the bot's version
     * @returns {object|null} mcData instance or null if bot not available
     */
    _getMcData() {
        if (this._mcData) return this._mcData;
        if (!this.bot?.version) return null;
        this._mcData = minecraftData(this.bot.version);
        return this._mcData;
    }

    // ─── 核心验证 ──────────────────────────────────────────────────

    /**
     * 验证 plan 的 preconditions 链是否完整
     *
     * @param {object} plan - { steps: [{ step, goal, command, preconditions, produces }] }
     * @param {Array<{name: string, count: number}>} inventory
     * @returns {{ valid: boolean, gaps: Array<{step, goal, missingPrecondition, display}> }}
     */
    validate(plan, inventory) {
        if (!plan || !plan.steps || plan.steps.length === 0) {
            return { valid: true, gaps: [] };
        }

        // Virtual inventory: starts as real inventory, updated with each step's consumption + production
        const virtualInventory = {};
        for (const item of (inventory || [])) {
            if (item.name) {
                virtualInventory[item.name] = (virtualInventory[item.name] || 0) + (item.count || 1);
            }
        }

        const gaps = [];

        for (const step of plan.steps) {
            const preconditions = step.preconditions || [];

            // 标准化：字符串 → 结构化对象
            const structuredConds = preconditions
                .map(cond => typeof cond === 'string'
                    ? this.parsePreconditionString(cond)
                    : cond
                )
                .filter(Boolean);

            // 补充 LLM 可能漏掉的隐式 precondition（工具等级、工作站需求）
            // 支持多命令：对 action_cmd 中的每条命令都推断隐式 precondition
            const cmds = this._getStepCommands(step);
            for (const cmd of cmds) {
                const implicitConds = this.inferImplicitPreconditions(cmd);
                for (const implicit of implicitConds) {
                    const alreadyDeclared = structuredConds.some(
                        c => c.type === implicit.type && c.name === implicit.name
                    );
                    if (!alreadyDeclared) {
                        structuredConds.push(implicit);
                        this.logDebug(`Auto-added implicit precondition: ${this.conditionToDisplay(implicit)} for step "${step.goal}"`);
                    }
                }
            }

            const isSmeltStep = cmds.some(c => c.includes('smeltItem'));

            // Check preconditions against virtual inventory
            for (const cond of structuredConds) {
                // "fuel" is a generic category word the LLM writes for smelt-step
                // preconditions (e.g. "1x Fuel") — it is never a real Minecraft item name,
                // so it won't match any FUEL_ITEMS entry. Left unhandled, this becomes a
                // fake gap that _repairPlanGaps tries to backfill via
                // collectBlocks("fuel", ...), which fails (invalid block type) every time.
                // Fuel selection is already handled internally by smeltItem/skills.js
                // (mc.getSmeltingFuel), so exempt the literal word too.
                if (isSmeltStep && cond.type === 'item' && (cond.name === 'fuel' || FUEL_ITEMS.has(cond.name))) {
                    continue;
                }

                if (!this._isSatisfiedByVirtual(cond, virtualInventory)) {
                    gaps.push({
                        step: step.step,
                        goal: step.goal,
                        missingPrecondition: cond,
                        display: this.conditionToDisplay(cond)
                    });
                }
            }

            // Consume non-tool, non-fuel item preconditions (materials used by this step)
            for (const cond of structuredConds) {
                if (cond.type === 'item'
                    && !FUEL_ITEMS.has(cond.name)
                    && TOOL_TIERS[cond.name] === undefined) {
                    const needed = cond.count || 1;
                    virtualInventory[cond.name] = Math.max(
                        0,
                        (virtualInventory[cond.name] || 0) - needed
                    );
                }
            }

            // Executability constraint: compute what action_cmd can actually produce
            const inferredOutputs = [];
            for (const cmd of cmds) {
                const inferred = this.inferProduces(cmd);
                if (inferred) inferredOutputs.push(inferred);
            }
            const derivableNames = new Set(inferredOutputs.map(o => o.name));

            // Determine step outputs with executability validation
            let stepOutputs;
            if (step.produces) {
                const declaredList = Array.isArray(step.produces) ? step.produces : [step.produces];

                // Only check when we have actual inferences — freeformGoal produces no inference,
                // so trust declared produces in that case (no false positives for non-command steps).
                if (inferredOutputs.length > 0) {
                    const unsupportedItems = declaredList.filter(
                        p => p.type === 'item' && !derivableNames.has(p.name)
                    );
                    for (const p of unsupportedItems) {
                        gaps.push({
                            step: step.step,
                            goal: step.goal,
                            missingPrecondition: { type: 'item', name: p.name, count: p.count || 1 },
                            display: `unsupported-produce:${p.name} (declared but no action_cmd produces it)`
                        });
                        this.logDebug(
                            `Step ${step.step}: declared produces "${p.name}" not derivable from action_cmd — skipping virtual inventory`
                        );
                    }
                }

                // Keep supported declared produces; also add any inferred outputs not already covered
                const supportedList = inferredOutputs.length > 0
                    ? declaredList.filter(p => p.type !== 'item' || derivableNames.has(p.name))
                    : declaredList;
                const supportedNames = new Set(supportedList.map(p => p.name));
                stepOutputs = [
                    ...supportedList,
                    ...inferredOutputs.filter(o => !supportedNames.has(o.name))
                ];
            } else {
                stepOutputs = inferredOutputs;
            }

            for (const output of stepOutputs) {
                if (output.type === 'item') {
                    virtualInventory[output.name] = (virtualInventory[output.name] || 0) + (output.count || 1);
                }
            }
        }

        return { valid: gaps.length === 0, gaps };
    }

    // ─── 满足度检查 ────────────────────────────────────────────────

    /**
     * 检查单个结构化 precondition 是否被满足
     *
     * @param {object} cond - { type, name, count? }
     * @param {object} inventoryMap - { itemName: totalCount }
     * @param {Array<{type, name, count}>} producedByPlan
     * @returns {boolean}
     */
    isSatisfied(cond, inventoryMap, producedByPlan) {
        if (!cond) return true;  // null/undefined → 保守认为已满足

        // access 类型：无法程序验证，保守放行
        if (cond.type === 'access') return true;

        // station 类型：查 inventory + produced（精确名称匹配）
        if (cond.type === 'station') {
            if ((inventoryMap[cond.name] || 0) > 0) return true;
            return producedByPlan.some(p =>
                (p.type === 'station' || p.type === 'item') && p.name === cond.name
            );
        }

        // item 类型：精确名称匹配 + 工具等级兼容性 + count 累加
        if (cond.type === 'item') {
            const needed = cond.count || 1;
            let inInventory = inventoryMap[cond.name] || 0;

            // 挖掘方块名与实际掉落物名不同（如 precondition 写 "stone" 但
            // collectBlocks 实际产出 "cobblestone"）：LLM 常把方块名误写进
            // precondition，这里按 BLOCK_DROP_ALIASES 兜底再查一次库存
            if (inInventory < needed && BLOCK_DROP_ALIASES[cond.name]) {
                inInventory += (inventoryMap[BLOCK_DROP_ALIASES[cond.name]] || 0);
            }

            // 工具等级兼容性：如果 precondition 是镐类工具，
            // 背包中更高等级的镐也能满足
            if (inInventory < needed && TOOL_TIERS[cond.name] !== undefined) {
                const requiredTier = TOOL_TIERS[cond.name];
                for (const [toolName, toolTier] of Object.entries(TOOL_TIERS)) {
                    if (toolTier >= requiredTier && toolName !== cond.name) {
                        inInventory += (inventoryMap[toolName] || 0);
                    }
                }
            }

            if (inInventory >= needed) return true;

            // 累加前面步骤的产出
            let producedCount = 0;
            for (const p of producedByPlan) {
                if (p.name === cond.name) {
                    producedCount += (p.count || 1);
                }
            }

            return (inInventory + producedCount) >= needed;
        }

        // 未知类型：保守放行
        return true;
    }

    /**
     * Check a precondition against a virtual inventory map.
     * Unlike isSatisfied() which takes separate inventoryMap + producedByPlan,
     * this works with a single merged map that tracks net availability.
     *
     * @param {object} cond - { type, name, count? }
     * @param {object} virtualInventory - { itemName: netCount }
     * @returns {boolean}
     */
    _isSatisfiedByVirtual(cond, virtualInventory) {
        if (!cond) return true;
        if (cond.type === 'access') return true;

        if (cond.type === 'station') {
            return (virtualInventory[cond.name] || 0) > 0;
        }

        if (cond.type === 'item') {
            const needed = cond.count || 1;
            let available = virtualInventory[cond.name] || 0;

            // 同上：precondition 写方块名("stone")但虚拟库存记的是实际
            // 掉落物名("cobblestone") 时的兜底解析
            if (available < needed && BLOCK_DROP_ALIASES[cond.name]) {
                available += (virtualInventory[BLOCK_DROP_ALIASES[cond.name]] || 0);
            }

            if (available < needed && TOOL_TIERS[cond.name] !== undefined) {
                const requiredTier = TOOL_TIERS[cond.name];
                for (const [toolName, toolTier] of Object.entries(TOOL_TIERS)) {
                    if (toolTier >= requiredTier && toolName !== cond.name) {
                        available += (virtualInventory[toolName] || 0);
                    }
                }
            }

            // Fungible peer check: acacia_log satisfies oak_log requirement, etc.
            if (available < needed && this.recipeResolver?.isFungible?.(cond.name)) {
                const peers = this.recipeResolver.getFungiblePeers(cond.name) || [];
                for (const peer of peers) {
                    if (peer !== cond.name) {
                        available += virtualInventory[peer] || 0;
                        if (available >= needed) break;
                    }
                }
            }

            return available >= needed;
        }

        return true;
    }

    // ─── 产出推断 ──────────────────────────────────────────────────

    /**
     * 从命令字符串推断产出物品
     *
     * @param {string} commandString - 如 '!smeltItem("iron_ore", 3)'
     * @returns {{ type: string, name: string, count: number } | null}
     */
    inferProduces(commandString) {
        if (!commandString) return null;

        const parsed = parseCommand(commandString);
        if (!parsed) return null;

        const { cmdName, itemName, count } = parsed;
        const n = count || 1;

        if (cmdName === 'smeltItem') {
            const outputName = SMELTING_OUTPUTS[itemName] || itemName;
            return { type: 'item', name: outputName, count: n };
        }

        if (cmdName === 'collectBlocks') {
            // Minecraft 1.17+ raw drops + block→drop differences (no Silk Touch)
            return { type: 'item', name: BLOCK_DROP_ALIASES[itemName] || itemName, count: n };
        }

        if (cmdName === 'attack') {
            // Second arg is boolean (true/false), not a count — hardcode 5 for kill-goal checks
            const MOB_DROPS = {
                'zombie': 'rotten_flesh',   'skeleton': 'bone',    'spider': 'string',
                'cave_spider': 'string',    'creeper': 'gunpowder', 'enderman': 'ender_pearl',
                'slime': 'slime_ball',      'blaze': 'blaze_rod',  'wither_skeleton': 'bone',
                'witch': 'redstone',        'cow': 'beef',         'pig': 'porkchop',
                'chicken': 'chicken',       'sheep': 'wool'
            };
            const drop = MOB_DROPS[itemName];
            if (!drop) return null;
            return { type: 'item', name: drop, count: 5 };
        }

        // craftRecipe, placeHere, and all other commands → produces the named item
        return { type: 'item', name: itemName, count: n };
    }

    // ─── 隐式 precondition 推断 ──────────────────────────────────

    /**
     * 根据命令类型推断隐式 precondition（LLM 可能漏掉的）
     *
     * @param {string} commandString - 如 '!collectBlocks("iron_ore", 2)'
     * @returns {Array<{type, name, count}>} 推断出的 precondition 列表
     */
    inferImplicitPreconditions(commandString) {
        if (!commandString) return [];

        const parsed = parseCommand(commandString);
        if (!parsed) {
            // freeformGoal text: try to extract block name for tool checking
            const result = [];
            const blockMatch = commandString.match(/\b(cobblestone|iron_ore|gold_ore|diamond_ore|emerald_ore|lapis_ore|redstone_ore|copper_ore|coal_ore|deepslate_\w+_ore|obsidian|stone)\b/i);
            if (blockMatch) {
                const blockName = blockMatch[1].toLowerCase();
                let requiredTool = null;
                if (this.recipeResolver) {
                    requiredTool = this.recipeResolver.getRequiredTool(blockName);
                }
                if (!requiredTool) {
                    requiredTool = ORE_TOOL_REQUIREMENTS[blockName] || null;
                }
                if (requiredTool) {
                    result.push({ type: 'item', name: requiredTool, count: 1 });
                }
            }
            return result;
        }

        const { cmdName, itemName } = parsed;
        const result = [];

        // smeltItem / craftRecipe → 需要工作站
        if (COMMAND_STATION_REQUIREMENTS[cmdName]) {
            result.push({
                type: 'station',
                name: COMMAND_STATION_REQUIREMENTS[cmdName],
                count: 1
            });
        }

        // craftRecipe → dynamically look up recipe ingredients from minecraft-data
        if (cmdName === 'craftRecipe' && this.bot) {
            const mcData = this._getMcData();
            if (mcData) {
                const item = mcData.itemsByName[itemName];
                if (item) {
                    try {
                        // Use true as craftingTable param to get ALL recipes (2x2 + 3x3)
                        const recipes = this.bot.recipesFor(item.id, null, 1, true);
                        if (recipes && recipes[0]?.delta) {
                            for (const delta of recipes[0].delta) {
                                if (delta.count < 0) {
                                    const ingredient = mcData.items[delta.id];
                                    if (ingredient) {
                                        result.push({
                                            type: 'item',
                                            name: ingredient.name,
                                            count: Math.abs(delta.count)
                                        });
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        this.logDebug(`Recipe lookup failed for ${itemName}:`, err.message);
                    }
                }
            }
        }

        // collectBlocks → check tool requirement via RecipeResolver (data-driven) or fallback
        if (cmdName === 'collectBlocks') {
            let requiredTool = null;
            if (this.recipeResolver) {
                requiredTool = this.recipeResolver.getRequiredTool(itemName);
            }
            if (!requiredTool) {
                requiredTool = ORE_TOOL_REQUIREMENTS[itemName] || null;
            }
            if (requiredTool) {
                result.push({
                    type: 'item',
                    name: requiredTool,
                    count: 1
                });
            }
        }

        return result;
    }

    // ─── 字符串 → 结构化（向后兼容）───────────────────────────────

    /**
     * 将旧格式字符串 precondition 转为结构化对象
     *
     * 支持格式：
     *   "item:iron_ore:3"             → { type: "item", name: "iron_ore", count: 3 }
     *   "station:furnace"             → { type: "station", name: "furnace" }
     *   "access:underground"          → { type: "access", name: "underground" }
     *   "3x Iron Ingot"               → { type: "item", name: "iron_ingot", count: 3 }
     *   "furnace"                     → { type: "station", name: "furnace" }
     *   "Access to underground"       → { type: "access", name: "underground" }
     *   "Nearby: furnace"             → { type: "station", name: "furnace" }
     *   "iron_ingot"                  → { type: "item", name: "iron_ingot", count: 1 }
     *
     * @param {string} condString
     * @returns {object|null}
     */
    parsePreconditionString(condString) {
        return parsePrecondition(condString);
    }

    // ─── Gap Prompt ────────────────────────────────────────────────

    /**
     * 构建 gap 反馈 prompt
     *
     * @param {{ valid: boolean, gaps: Array }} validationResult
     * @param {Array<{name: string, count: number}>} inventory
     * @returns {string}
     */
    buildGapPrompt(validationResult, inventory = []) {
        if (!validationResult || validationResult.valid || !validationResult.gaps?.length) {
            return '';
        }

        let prompt = '\n## ⚠️ YOUR PREVIOUS PLAN HAD MISSING PREREQUISITES\n\n';
        prompt += 'Fix these issues in your new plan:\n\n';

        // 去重：同一 precondition 在多个步骤缺失时只报一次
        const seen = new Set();
        for (const gap of validationResult.gaps) {
            const key = `${gap.step}:${gap.display}`;
            if (seen.has(key)) continue;
            seen.add(key);
            prompt += `- Step ${gap.step} "${gap.goal}" requires ${gap.display} but nothing before it provides this\n`;
        }

        prompt += '\nMake sure every prerequisite is satisfied by an earlier step or is already in inventory.\n';
        prompt += 'Generate the COMPLETE corrected plan.\n';

        if (inventory.length > 0) {
            prompt += '\n## CURRENT INVENTORY\n';
            for (const item of inventory) {
                prompt += `- ${item.name} (${item.count})\n`;
            }
        }

        return prompt;
    }

    // ─── 辅助方法 ──────────────────────────────────────────────────

    /**
     * 将结构化 condition 转为可读字符串
     */
    conditionToDisplay(cond) {
        if (!cond) return 'unknown';
        if (cond.type === 'item') {
            return `item:${cond.name}:${cond.count || 1}`;
        }
        if (cond.type === 'station') {
            return `station:${cond.name}`;
        }
        if (cond.type === 'access') {
            return `access:${cond.name}`;
        }
        return JSON.stringify(cond);
    }

    // ─── 多命令支持 ─────────────────────────────────────────────

    /**
     * 提取步骤中的所有命令字符串（统一 action_cmd 数组和 command 字符串）
     *
     * @param {object} step
     * @returns {string[]} 命令数组（可能为空）
     */
    _getStepCommands(step) {
        if (step.action_cmd?.length > 0) return step.action_cmd;
        if (step.command) return [step.command];
        if (step.freeformGoal) return [step.freeformGoal];
        return [];
    }

    // ─── 步骤裁剪 ─────────────────────────────────────────────────

    /**
     * 根据当前 inventory 标记可跳过的步骤。
     * 只使用显式 produces 字段，不依赖 inferProduces 推断。
     *
     * @param {object} plan - { steps: [...] }
     * @param {Array<{name: string, count: number}>} inventory - 当前 bot inventory
     * @returns {object} 新 plan 对象（不修改原 plan）
     */
    pruneSteps(plan, inventory) {
        if (!plan?.steps) return plan;

        const inventoryMap = {};
        for (const item of (inventory || [])) {
            if (item.name) {
                inventoryMap[item.name] = (inventoryMap[item.name] || 0) + (item.count || 1);
            }
        }

        const newSteps = plan.steps.map(step => {
            let producesList;

            if (step.produces) {
                // 统一为数组
                producesList = Array.isArray(step.produces)
                    ? step.produces
                    : [step.produces];
            } else {
                // 没有显式 produces（常见于 LLM 原生计划步骤）→ 仅对 craftRecipe/smeltItem
                // 从 action_cmd 推断，避免"库存已有 wooden_pickaxe 仍重复合成一把导致材料
                // 不足而失败"这类冗余步骤无法被剪掉。其余命令类型语义上不代表"产出可跳过
                // 的物品"（如 searchForBlock），保守不跳过。
                const commands = this._getStepCommands(step);
                const allCraftOrSmelt = commands.length > 0 && commands.every(cmd => {
                    const parsed = parseCommand(cmd);
                    return parsed && (parsed.cmdName === 'craftRecipe' || parsed.cmdName === 'smeltItem');
                });
                if (!allCraftOrSmelt) {
                    return { ...step, skip: false };
                }
                producesList = commands.map(cmd => this.inferProduces(cmd)).filter(Boolean);
                if (producesList.length !== commands.length) {
                    return { ...step, skip: false };
                }
            }

            // 过滤只看 item 类型（忽略 station/access）
            const itemProduces = producesList.filter(p => p.type === 'item');

            // 没有 item 类型的产出 → 不跳过
            if (itemProduces.length === 0) {
                return { ...step, skip: false };
            }

            // 检查所有 item 产出是否都在 inventory 中满足
            const allSatisfied = itemProduces.every(p => {
                const needed = p.count || 1;
                return (inventoryMap[p.name] || 0) >= needed;
            });

            if (allSatisfied) {
                this.logDebug(`pruneSteps: Step ${step.step} "${step.goal}" → SKIP (produces already in inventory)`);
            }

            return { ...step, skip: allSatisfied };
        });

        return { ...plan, steps: newSteps };
    }

    // ─── 步骤排序验证 ─────────────────────────────────────────────

    /**
     * Validate that plan steps are in correct dependency order.
     * Detects when craftRecipe for target appears before gather/process steps.
     *
     * @param {object} plan - { steps: [...], target?: string }
     * @returns {{ valid: boolean, issues: string[] }}
     */
    validateStepOrdering(plan) {
        if (!plan || !plan.steps || plan.steps.length <= 1) {
            return { valid: true, issues: [] };
        }

        const issues = [];
        const steps = plan.steps;

        // Check if step 1 is a craftRecipe while later steps gather/process materials
        const firstCmds = this._getStepCommands(steps[0]);
        if (firstCmds.some(c => c.toLowerCase().includes('craftrecipe'))) {
            const hasLaterGather = steps.slice(1).some(s => {
                const cmds = this._getStepCommands(s);
                return cmds.some(c => {
                    const lower = c.toLowerCase();
                    return lower.includes('collectblocks') || lower.includes('smeltitem');
                });
            });
            if (hasLaterGather) {
                const craftCmd = firstCmds.find(c => c.toLowerCase().includes('craftrecipe')) || '';
                const firstMatch = craftCmd.match(/craftrecipe\(["']([^"']+)["']/);
                const crafted = firstMatch ? firstMatch[1] : 'item';
                issues.push(
                    `Step 1 crafts "${crafted}" but later steps gather/process materials. ` +
                    `Material gathering must come BEFORE crafting.`
                );
            }
        }

        // Check: collectBlocks/smeltItem should not appear after the final craftRecipe
        let lastCraftIdx = -1;
        for (let i = steps.length - 1; i >= 0; i--) {
            const cmds = this._getStepCommands(steps[i]);
            if (cmds.some(c => c.toLowerCase().includes('craftrecipe'))) {
                lastCraftIdx = i;
                break;
            }
        }
        if (lastCraftIdx >= 0 && lastCraftIdx < steps.length - 1) {
            for (let i = lastCraftIdx + 1; i < steps.length; i++) {
                const cmds = this._getStepCommands(steps[i]);
                const hasGatherCmd = cmds.some(c => {
                    const lower = c.toLowerCase();
                    return lower.includes('collectblocks') || lower.includes('smeltitem');
                });
                if (hasGatherCmd) {
                    issues.push(
                        `Step ${i + 1} "${steps[i].goal}" gathers/processes materials ` +
                        `after the final craft step (${lastCraftIdx + 1}). ` +
                        `All gathering must come before crafting.`
                    );
                }
            }
        }

        return { valid: issues.length === 0, issues };
    }
}
