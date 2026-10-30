/**
 * FewShotLearning - Few-shot学习和模式泛化
 *
 * 核心创新：
 * 通过精心设计的Few-shot提示词，让Qwen-8B从训练示例中学习制作模式，
 * 然后泛化到新的物品（例如：从铁斧→铁剑）
 *
 * 关键能力：
 * 1. 学习材料数量规律（剑=2，斧=3）
 * 2. 学习步骤结构（收集→熔炼→制作）
 * 3. 学习依赖关系（需要先做木棍、熔炉等）
 * 4. 泛化到未见过的物品组合
 */

import { SAERScorer } from './saer_scorer.js';
import { BM25Retriever } from './bm25_retriever.js';
import { parseCommand } from './precondition_parser.js';
import { SMELTING_OUTPUTS } from './recipe_resolver.js';

export class FewShotLearning {
    constructor(debug = false) {
        this.debug = debug;
        this.saerEnabled = true;
        // 'saer' | 'bm25' | 'none'  — overrides saerEnabled when set explicitly by eval harness
        this.retrievalMode = 'saer';
        // Number of demonstrations placed in the prompt. 3 everywhere in the
        // paper; overridable so the eval harness can run a k-sensitivity study.
        this.topK = 3;
        this.saerScorer = new SAERScorer(debug);
        this.recipeResolver = null;

        // Minecraft制作知识库（用于构建提示词）
        this.craftingKnowledge = {
            // 材料数量规律
            materialQuantities: {
                sword: { materials: 2, sticks: 1, pattern: "工具类武器需要2个材料单位+1根木棍" },
                axe: { materials: 3, sticks: 2, pattern: "斧类工具需要3个材料单位+2根木棍" },
                pickaxe: { materials: 3, sticks: 2, pattern: "镐类工具需要3个材料单位+2根木棍" },
                shovel: { materials: 1, sticks: 2, pattern: "铲类工具需要1个材料单位+2根木棍" },
                hoe: { materials: 2, sticks: 2, pattern: "锄类工具需要2个材料单位+2根木棍" }
            },

            // 依赖关系
            dependencies: {
                'sticks': ['log', 'planks'],
                'iron_ingot': ['iron_ore', 'furnace'],
                'gold_ingot': ['gold_ore', 'furnace'],
                'any_crafting': ['crafting_table']
            }
        };
    }

    setRecipeResolver(resolver) {
        this.recipeResolver = resolver;
        this.saerScorer.setRecipeResolver(resolver);
    }

    /**
     * Override SAER scoring weights for ablation experiments.
     * @param {object} weights - e.g. {ingredient:1.0, keyword:0, miningTierGap:0, level:0}
     * @param {object|null} coldStartWeights - optional separate cold-start override
     */
    setWeights(weights, coldStartWeights = null) {
        this.saerScorer.weights = { ...weights };
        if (coldStartWeights) {
            this.saerScorer.coldStartWeights = { ...coldStartWeights };
        } else {
            this.saerScorer.coldStartWeights = { ...weights };
        }
    }

    logDebug(...args) {
        if (this.debug) {
            console.log('[FewShotLearning]', ...args);
        }
    }

    /**
     * 构建Few-shot学习提示词
     *
     * @param {object} userRequest - 用户请求 { input, intent }
     * @param {array} trainingExamples - 训练示例数组
     * @returns {string} - 完整的Few-shot提示词
     */
    buildFewShotPrompt(userRequest, trainingExamples, agentState = null) {
        let prompt = '';

        // 1. 角色定义
        prompt += this.buildRoleSection();

        // 2. 用户请求分析（让AI自己理解，不再使用keywords）
        prompt += this.buildRequestAnalysisSection(userRequest);

        // 3. 可用命令说明（关键！）
        prompt += this.buildCommandReferenceSection();

        // 4. 模式学习指导（关键！）
        prompt += this.buildPatternLearningSection();

        // 5. Few-shot示例（核心） - SAER scoring
        prompt += this.buildExamplesSection(trainingExamples, userRequest.input, agentState);

        // 6. 推理任务
        prompt += this.buildTaskSection(userRequest);

        if (this.debug) {
            console.log('\n' + '='.repeat(70));
            console.log('🤖 FEW-SHOT: Prompt Sent to AI');
            console.log('='.repeat(70));
            console.log(`User Request: "${userRequest.input || 'N/A'}"`);
            console.log(`Intent: ${userRequest.intent || 'N/A'}`);
            console.log(`Prompt Length: ${prompt.length} characters`);
            console.log(`\nPrompt Preview (first 1500 chars):\n`);
            console.log(prompt.substring(0, 1500));
            if (prompt.length > 1500) {
                console.log('\n... (truncated)');
            }
            console.log('\n' + '='.repeat(70) + '\n');
        }

        return prompt;
    }

    /**
     * 构建角色定义部分
     */
    buildRoleSection() {
        return `
# Role: Minecraft Crafting Expert with Pattern Recognition

You are an expert at understanding Minecraft crafting patterns from examples and applying them to create new items.

Your capability: Study examples → Recognize patterns → Generate plans for new items

`;
    }

    /**
     * 构建命令参考部分（关键！明确说明可用命令）
     */
    buildCommandReferenceSection() {
        return `
## Available Commands (READ CAREFULLY!)

You have access to ALL these standard Minecraft commands. **Use them for ALL standard tasks.**

### Crafting Commands
- **\`!craftRecipe("item_name", count)\`**: Can craft **ANY** craftable item in Minecraft
  - Item naming format: \`material_tool\` (e.g., \`iron_sword\`, \`diamond_pickaxe\`, \`stone_axe\`)
  - This is a **UNIVERSAL** command - works for ALL standard Minecraft items
  - Examples:
    - \`!craftRecipe("iron_sword", 1)\` → crafts 1 iron sword
    - \`!craftRecipe("diamond_pickaxe", 1)\` → crafts 1 diamond pickaxe
    - \`!craftRecipe("golden_hoe", 2)\` → crafts 2 golden hoes

### Processing Commands
- **\`!smeltItem("item_name", count)\`**: Smelt ores in a furnace
  - Example: \`!smeltItem("iron_ore", 3)\` → smelts 3 iron ore into ingots

### Collection Commands
- **\`!collectBlocks("block_type", count)\`**: Collect blocks from environment
  - Example: \`!collectBlocks("log", 3)\` → collects 3 logs

### ⚠️ IMPORTANT WARNING
**DO NOT use \`!newAction\` for standard crafting tasks!**
- \`!newAction\` is ONLY for completely new behaviors that cannot be done with existing commands
- ALL standard Minecraft crafting can be done with \`!craftRecipe\`
- If you think you need \`!newAction\` for crafting, you are WRONG - use \`!craftRecipe\` instead

`;
    }

    /**
     * 构建请求分析部分（AI自己理解）
     */
    buildRequestAnalysisSection(userRequest) {
        let section = `
## User Request

Input: "${userRequest.input || ''}"

Intent Type: ${userRequest.intent || 'Unknown'}

`;
        section += `**Task**: Analyze the user's request and understand what they want to create.\n`;
        section += `Extract the material, tool type, and target item from the input yourself.\n\n`;

        return section;
    }

    /**
     * 构建模式学习指导部分（最重要的！）
     */
    buildPatternLearningSection() {
        return `
## Pattern Learning Guide

Study the examples below and recognize these patterns:

### 1. Material Quantity Pattern
Different tool types require DIFFERENT amounts of materials:
- **Swords**: Always need **2 material units** + **1 stick**
- **Axes**: Always need **3 material units** + **2 sticks**
- **Pickaxes**: Always need **3 material units** + **2 sticks**
- **Shovels**: Always need **1 material unit** + **2 sticks**
- **Hoes**: Always need **2 material units** + **2 sticks**

This pattern is CONSISTENT regardless of material (iron, stone, diamond, etc.)

### 2. Material Processing Pattern
Some materials need processing BEFORE crafting:
- **Ores** (iron_ore, gold_ore) → must be **smelted** into ingots
  ⚠️ CRITICAL: Mining ore blocks drops raw materials. Use raw names for smelting:
  - !smeltItem("raw_iron") NOT !smeltItem("iron_ore")
  - !smeltItem("raw_gold") NOT !smeltItem("gold_ore")
- **Logs** → can be crafted into **planks**, then into **sticks**
- **Stone, Wood, Diamond** → can be used directly (no smelting)

### 3. Step Structure Pattern
Most crafting follows this structure:
1. Collect raw materials (ores, logs, etc.)
2. Process materials (smelt ores, craft planks/sticks)
3. Craft components (sticks, handles, etc.)
4. Craft final item at crafting table

### 4. Dependency Pattern
Some items require prerequisite items:
- **Smelting** → requires a **furnace**
- **Crafting** → requires a **crafting table**
- **Sticks** → requires **planks** → requires **logs**

### 5. Mining Tool Requirement Pattern
Collecting blocks requires the correct tier of pickaxe as a PREREQUISITE:
- **wood, dirt, sand, gravel** → no tool required
- **stone, cobblestone** → item:wooden_pickaxe (or better)
- **coal_ore, iron_ore, copper_ore, lapis_ore, redstone_ore** → item:stone_pickaxe (or better)
- **gold_ore, diamond_ore, emerald_ore** → item:iron_pickaxe (or better)
- **obsidian** → item:diamond_pickaxe

ALWAYS declare the required pickaxe as a precondition for collectBlocks steps.
If the pickaxe is not in inventory and not produced by an earlier step,
add a step to craft it BEFORE the collectBlocks step.

Full cold-start tool chain (assume NOTHING in inventory unless told):
Step 1: Collect logs and craft wooden pickaxe
Prerequisites: None
Command: !collectBlocks("oak_log", 3)
Command: !craftRecipe("oak_planks", 12)
Command: !craftRecipe("stick", 4)
Command: !craftRecipe("wooden_pickaxe", 1)

Step 2: Mine cobblestone and craft stone pickaxe
Prerequisites: item:wooden_pickaxe:1, access:stone
Command: !collectBlocks("stone", 3)
Command: !craftRecipe("stone_pickaxe", 1)

Step 3: Mine iron ore with stone pickaxe
Prerequisites: item:stone_pickaxe:1, access:underground
Command: !collectBlocks("iron_ore", 3)

### 6. Raw Ore Naming After collectBlocks
!collectBlocks("iron_ore") drops raw_iron — NOT iron_ore.
!collectBlocks("gold_ore") drops raw_gold — NOT gold_ore.
!collectBlocks("diamond_ore") drops diamond directly — NO smelting needed.
The next step that uses these materials must reference the DROP name:
  CORRECT: Prerequisites: item:raw_iron:3
  WRONG:   Prerequisites: item:iron_ore:3

### 7. Output Format (STRICT)
Use ONLY this plain-text format. No markdown, no bold, no bullets, no backticks:
  Step N: [goal]
  Prerequisites: [tokens or None]
  Command: !command("arg", value)
  Reasoning: [why]

`;
    }

    /**
     * 构建示例部分（展示完整的学习案例）
     */
    buildExamplesSection(trainingExamples, userInput = '', agentState = null) {
        let section = `
## Few-Shot Learning Examples

Study these examples carefully to understand the patterns:

`;

        // 选择最相关的示例（最多3个） - SAER scoring
        const relevantExamples = this.selectRelevantExamples(trainingExamples, this.topK, userInput, agentState);

        for (let i = 0; i < relevantExamples.length; i++) {
            const ex = relevantExamples[i];
            section += this.formatExample(ex, i + 1);
        }

        return section;
    }

    /**
     * 格式化单个示例
     */
    formatExample(example, index) {
        let formatted = `### Example ${index}: ${example.name}\n\n`;

        // 提取物品信息
        const itemInfo = this.extractItemInfo(example);
        if (itemInfo) {
            formatted += `**Item Analysis**:\n`;
            formatted += `- Material: ${itemInfo.material || 'Unknown'}\n`;
            formatted += `- Tool Type: ${itemInfo.tool || 'Unknown'}\n`;
            if (itemInfo.materialCount !== undefined) {
                formatted += `- Material Count: ${itemInfo.materialCount}\n`;
            }
            if (itemInfo.stickCount !== undefined) {
                formatted += `- Stick Count: ${itemInfo.stickCount}\n`;
            }
            if (itemInfo.needsSmelting !== undefined) {
                formatted += `- Needs Smelting: ${itemInfo.needsSmelting ? 'Yes' : 'No'}\n`;
            }
            formatted += `\n`;
        }

        // 模式识别
        formatted += `**Pattern Recognition**:\n`;
        formatted += this.recognizePatterns(example, itemInfo);
        formatted += `\n`;

        // 完整步骤
        formatted += `**Execution Steps**:\n`;
        if (example.plan && example.plan.length > 0) {
            for (const step of example.plan) {
                formatted += `Step ${step.step}: ${step.goal}\n`;
                if (step.preconditions) {
                    const flat = this.flattenStepPreconditions(step.preconditions);
                    if (flat.length > 0) {
                        formatted += `  Prerequisites: ${flat.join(', ')}\n`;
                    }
                }
                // Always infer Produces from commands — never expose the explicit produces
                // field from training data to the LLM. Showing explicit produces teaches the
                // model to output Produces: lines; when those values are wrong, PlanValidator
                // virtual-inventory tracking breaks (inflated inventory → false precondition
                // pass). Command inference via inferProducesDisplay() is the single source of
                // truth; PlanValidator's always-infer-produces-from-commands path does the same.
                if (step.action_cmd && step.action_cmd.length > 0) {
                    const keyCmd = [...step.action_cmd].reverse().find(c =>
                        c.includes('craftRecipe') || c.includes('smeltItem')
                    );
                    if (keyCmd) {
                        const produces = this.inferProducesDisplay(keyCmd);
                        if (produces) formatted += `  Produces: ${produces}\n`;
                    }
                }
                // Show ALL commands (not just first) so the model learns the full multi-step sequence
                if (step.action_cmd && step.action_cmd.length > 0) {
                    for (const cmd of step.action_cmd) {
                        formatted += `  Command: ${cmd}\n`;
                    }
                }
            }
        }

        formatted += `\n${'='.repeat(70)}\n\n`;

        if (this.debug) {
            console.log(`\n📖 Example ${index}: ${example.name}`);
            if (itemInfo) {
                console.log(`   Material: ${itemInfo.material || 'N/A'}`);
                console.log(`   Tool: ${itemInfo.tool || 'N/A'}`);
                if (itemInfo.materialCount !== undefined) {
                    console.log(`   Material Count: ${itemInfo.materialCount}`);
                }
            }
        }

        return formatted;
    }

    /**
     * 从示例中提取物品信息
     */
    extractItemInfo(example) {
        const name = example.name.toLowerCase();
        const slug = example.slug?.toLowerCase() || '';

        // 提取材料
        let material = null;
        const materials = ['wood', 'stone', 'iron', 'gold', 'diamond', 'netherite'];
        for (const mat of materials) {
            if (name.includes(mat) || slug.includes(mat)) {
                material = mat;
                break;
            }
        }

        // 提取工具类型
        let tool = null;
        const tools = ['axe', 'pickaxe', 'sword', 'shovel', 'hoe'];
        for (const t of tools) {
            if (name.includes(t) || slug.includes(t)) {
                tool = t;
                break;
            }
        }

        // 从步骤中推导材料数量和木棍数量
        let materialCount = undefined;
        let stickCount = undefined;
        let needsSmelting = false;

        if (example.plan) {
            for (const step of example.plan) {
                if (step.action_cmd) {
                    // 检查smelt命令
                    for (const cmd of step.action_cmd) {
                        if (cmd.includes('smeltItem')) {
                            needsSmelting = true;
                            const match = cmd.match(/smeltItem\("([^"]+)",\s*(\d+)\)/);
                            if (match) {
                                materialCount = parseInt(match[2]);
                            }
                        }
                        // 检查collectBlocks命令（针对材料）
                        if (cmd.includes('collectBlocks')) {
                            const match = cmd.match(/collectBlocks\("([^"]+)",\s*(\d+)\)/);
                            if (match && match[1].includes(material)) {
                                materialCount = parseInt(match[2]);
                            }
                        }
                    }
                }
            }

            // 从crafting knowledge推导
            if (tool && material) {
                const knowledge = this.craftingKnowledge.materialQuantities[tool];
                if (knowledge) {
                    // 如果步骤中没有找到数量，使用知识库
                    if (materialCount === undefined) {
                        materialCount = knowledge.materials;
                    }
                    if (stickCount === undefined) {
                        stickCount = knowledge.sticks;
                    }
                }
            }
        }

        return {
            material,
            tool,
            materialCount,
            stickCount,
            needsSmelting
        };
    }

    /**
     * 识别示例中的模式（用于指导AI）
     */
    recognizePatterns(example, itemInfo) {
        let patterns = [];

        if (itemInfo) {
            // 模式1：材料数量
            if (itemInfo.tool && itemInfo.materialCount !== undefined) {
                patterns.push(`- **Quantity Pattern**: ${itemInfo.tool} tools need ${itemInfo.materialCount} ${itemInfo.material}_ingot units`);
            }

            // 模式2：材料处理
            if (itemInfo.needsSmelting) {
                patterns.push(`- **Processing Pattern**: ${itemInfo.material}_ore must be smelted into ${itemInfo.material}_ingot before crafting`);
            }

            // 模式3：依赖关系
            if (example.plan) {
                const hasSticks = example.plan.some(step =>
                    step.action_cmd && step.action_cmd.some(cmd => cmd.includes('stick'))
                );
                if (hasSticks) {
                    patterns.push(`- **Dependency Pattern**: Requires sticks (crafted from planks, which come from logs)`);
                }
            }
        }

        return patterns.length > 0 ? patterns.join('\n') : '- Pattern: Standard crafting process';
    }

    /**
     * 选择最相关的示例（SAER scoring）
     *
     * @param {Array} examples - All candidate examples
     * @param {number} count - Number to select (default 3)
     * @param {string} userInput - Raw user input for SAER scoring
     * @param {object} agentState - Current agent state { inventory, nearbyBlocks }
     * @returns {Array} Top examples sorted by SAER score
     */
    selectRelevantExamples(examples, count = 3, userInput = '', agentState = null) {
        if (!examples || examples.length === 0) return [];
        if (examples.length <= count) return examples;

        if (this.retrievalMode === 'bm25') {
            const bm25 = new BM25Retriever(examples);
            return bm25.search(userInput, count);
        }
        // eval no_retrieval: truly empty few-shot (aligns with static_plan_eval's
        // buildFewShotPrompt(userRequest, [], null)). Only the explicit 'none' mode
        // returns [] — the legacy !saerEnabled fallback (slice) is preserved below
        // so default/non-eval configs (e.g. lucy.json with saer off) keep behavior.
        if (this.retrievalMode === 'none') {
            return [];
        }
        if (!this.saerEnabled) {
            return examples.slice(0, count);
        }

        // Use SAER scorer if agentState is available, otherwise fall back to keyword-only
        let relevantExamples;
        if (agentState) {
            relevantExamples = this.saerScorer.selectExamples(userInput, examples, agentState, count);
        } else {
            // Fallback: keyword-only scoring (no precondition gap)
            relevantExamples = this.saerScorer.selectExamples(userInput, examples, { inventory: [], nearbyBlocks: [] }, count);
        }

        if (this.debug) {
            console.log('\n' + '='.repeat(70));
            console.log('📚 SAER: Selected Training Examples');
            console.log('='.repeat(70));
            console.log(`Total candidates: ${examples.length}`);
            console.log(`Selected: ${relevantExamples.length} (by SAER score)\n`);

            relevantExamples.forEach((ex, idx) => {
                console.log(`#${idx + 1}: ${ex.name} (score: ${ex._saerScore?.toFixed(3)})`);
                console.log(`  Slug: ${ex.slug}`);
                console.log(`  Level: ${ex.level || 'N/A'}`);
                console.log(`  Steps: ${ex.plan?.length || 0}`);
                if (ex.plan && ex.plan.length > 0) {
                    console.log(`  First step: ${ex.plan[0].goal}`);
                }
                console.log('');
            });

            console.log('='.repeat(70) + '\n');
        }

        return relevantExamples;
    }

    /**
     * 构建任务部分（让AI应用学到的模式）
     */
    buildTaskSection(userRequest) {
        let section = `
## Your Task: Generate Execution Plan

Using the patterns learned from the examples above, generate a complete execution plan for: "${userRequest.input}"

**Important**: First, analyze the user's request to identify:
- The target item (e.g., "iron_sword")
- The material type (e.g., "iron")
- The tool type (e.g., "sword")

Then generate the execution plan following the patterns learned from examples.

### Requirements:
1. **Apply Quantity Pattern**: Use the correct material count based on tool type
2. **Apply Processing Pattern**: Include smelting steps if needed
3. **Include Dependencies**: Add steps for crafting components (sticks, etc.)
4. **Specify Exact Commands**: Output executable Minecraft commands
5. **Show Reasoning**: Explain how you applied the patterns

### Output Format:

CRITICAL: Use ONLY plain-text. No markdown formatting (no **, no -, no backticks, no bold).

**REASONING**:
[Briefly explain which example(s) you referenced and how you adapted the pattern]
[Identify the target item, material, and tool type from the user's request]

**EXECUTION PLAN**:
Step 1: [Goal description]
Prerequisites: [type:name:count pairs, e.g. "item:raw_iron:3, station:furnace", or "None"]
Command: !command("arg", value)
Reasoning: [Why this step is needed]

Step 2: [Goal description]
Prerequisites: [type:name:count pairs, or "None"]
Command: !command("arg", value)
Reasoning: [Why this step is needed]

Prerequisite types: "item:name:count" for items, "station:name" for workstations, "access:name" for locations
Note: After !collectBlocks("iron_ore"), subsequent steps must use item:raw_iron (not item:iron_ore).
Note: !collectBlocks("diamond_ore") produces diamond directly — no smelting step is needed for diamonds.

...

### Material Transformations
`;
        // 根据用户请求动态注入相关转换链
        const inputLower = (userRequest.input || '').toLowerCase();
        const relevantTransforms = [];

        for (const [from, to] of Object.entries(SMELTING_OUTPUTS)) {
            if (inputLower.includes(from.split('_')[0])) {
                relevantTransforms.push(`${from} → ${to}`);
            }
        }

        if (relevantTransforms.length > 0) {
            section += relevantTransforms.map(t => `- ${t}`).join('\n') + '\n';
        } else {
            section += `- Check if your materials need processing before crafting\n`;
        }

        section += '\n';

        // 注入依赖提示
        for (const [item, deps] of Object.entries(this.craftingKnowledge.dependencies)) {
            if (inputLower.includes(item.split('_')[0])) {
                section += `### Key Dependency\n`;
                section += `**${item}** requires: ${deps.join(' + ')}\n\n`;
            }
        }

        section += `### Critical Rules:
- Item names MUST use underscores: iron_ore, iron_ingot, iron_sword (NOT "iron ore")
- Command format: !commandName("arg", number)
- Quantities MUST match the tool type pattern (sword=2, axe=3, etc.)
- If smelting is needed, include the smelting step
- Include all dependency steps (sticks, crafting table, furnace, etc.)
- Steps MUST be in DEPENDENCY ORDER: collect raw materials FIRST → process/smelt SECOND → craft components THIRD → craft final item LAST
- NEVER put the final craftRecipe as Step 1. The target item's craftRecipe MUST be the LAST step in the plan.

`;
        return section;
    }

    /**
     * 解析单个 precondition token
     * 新格式 "item:iron_ore:3" → 结构化对象
     * 旧格式 "iron_ore" → 保持为字符串（由 PlanValidator.parsePreconditionString 处理）
     *
     * @param {string} token
     * @returns {object|string|null}
     */
    parsePreconditionToken(token) {
        if (!token) return null;

        // 新结构化格式: "type:name:count" 或 "type:name"
        const structMatch = token.match(/^(item|station|access):([a-zA-Z_]+)(?::(\d+))?$/);
        if (structMatch) {
            return {
                type: structMatch[1],
                name: structMatch[2],
                count: structMatch[3] ? parseInt(structMatch[3]) : 1
            };
        }

        // 旧格式：保持为字符串
        return token;
    }

    /**
     * 解析 produces token
     * 格式:
     *   单产出: "item:iron_ingot:3" 或 "iron_ingot:3"          → object
     *   多产出: "item:stick:2, item:crafting_table:1"            → array of objects
     *
     * 所有下游消费者（PlanValidator, static eval）均已支持 Array.isArray(produces)。
     *
     * @param {string} token
     * @returns {object|object[]|null}
     */
    parseProduceToken(token) {
        if (!token) return null;

        const parseSingle = (t) => {
            t = t.trim();
            const match = t.match(/^(item|station|access):([a-zA-Z_]+)(?::(\d+))?$/);
            if (match) {
                return { type: match[1], name: match[2], count: match[3] ? parseInt(match[3]) : 1 };
            }
            // Fallback: treat as plain item name with optional count
            const fallback = t.match(/^([a-zA-Z_]+)(?::(\d+))?$/);
            if (fallback) {
                return { type: 'item', name: fallback[1], count: fallback[2] ? parseInt(fallback[2]) : 1 };
            }
            return null;
        };

        // Multi-produces: "item:stick:2, item:crafting_table:1" → array
        if (token.includes(',')) {
            const parsed = token.split(',').map(parseSingle).filter(Boolean);
            if (parsed.length === 0) return null;
            return parsed.length === 1 ? parsed[0] : parsed;
        }

        return parseSingle(token);
    }

    /**
     * 解析AI生成的执行计划
     */
    parseExecutionPlan(aiResponse, userInput = '') {
        if (!aiResponse) return null;

        try {
            const steps = [];

            // Phase 1: Block-based parsing (robust against field order/format variations)
            const stepBlocks = aiResponse.split(/(?=Step\s+\d+:\s)/gi);

            for (const block of stepBlocks) {
                const headerMatch = block.match(/Step\s+(\d+):\s*([^\n]+)/i);
                if (!headerMatch) continue;

                const stepNum = parseInt(headerMatch[1]);
                const goal = headerMatch[2].trim();

                // Extract each field independently (tolerates ordering differences).
                // Collect ALL Command: lines so multi-command steps are fully captured.
                // Also match "- Command:" / "  Command:" bullet/indented variants.
                const cmdMatches = [...block.matchAll(/^[ \t]*-?[ \t]*Command:\s*([^\n]+)/gim)];
                const reasonMatch = block.match(/^[ \t]*-?[ \t]*Reasoning:\s*([^\n]+)/im);
                const prereqMatch = block.match(/^[ \t]*-?[ \t]*Prerequisites?:\s*([^\n]+)/im);
                const prodMatch = block.match(/^[ \t]*-?[ \t]*Produces:\s*([^\n]+)/im);

                if (cmdMatches.length === 0) continue; // Skip blocks without commands

                const action_cmd = cmdMatches.map(m => m[1].trim());
                const command = action_cmd[0]; // first command for backward compat
                const reasoning = reasonMatch ? reasonMatch[1].trim() : '';

                // Parse prerequisites
                let precondList = [];
                if (prereqMatch && prereqMatch[1].trim().toLowerCase() !== 'none') {
                    precondList = prereqMatch[1].split(',').map(p => {
                        const trimmed = p.trim();
                        return this.parsePreconditionToken(trimmed);
                    }).filter(Boolean);
                }

                // Parse produces
                let producesObj = null;
                if (prodMatch && prodMatch[1].trim().toLowerCase() !== 'none') {
                    producesObj = this.parseProduceToken(prodMatch[1].trim());
                }

                steps.push({
                    step: stepNum,
                    goal,
                    command,      // first command (backward compat for executeStep)
                    action_cmd,   // all commands (for PlanValidator, static eval)
                    reasoning,
                    preconditions: precondList,
                    produces: producesObj
                });
            }

            // Phase 2: Fallback — try original monolithic regex if block-based found nothing
            if (steps.length === 0) {
                const stepRegex = /Step\s+(\d+):\s*([^\n]+)\s*(?:Prerequisites?:\s*([^\n]+)\s*)?(?:Produces:\s*([^\n]+)\s*)?Command:\s*([^\n]+)\s*Reasoning:\s*([^\n]+)/gi;
                let match;
                while ((match = stepRegex.exec(aiResponse)) !== null) {
                    const [, stepNum, goal, prerequisites, produces, command, reasoning] = match;
                    let precondList = [];
                    if (prerequisites && prerequisites.trim().toLowerCase() !== 'none') {
                        precondList = prerequisites.split(',').map(p => {
                            const trimmed = p.trim();
                            return this.parsePreconditionToken(trimmed);
                        }).filter(Boolean);
                    }
                    let producesObj = null;
                    if (produces && produces.trim().toLowerCase() !== 'none') {
                        producesObj = this.parseProduceToken(produces.trim());
                    }
                    steps.push({
                        step: parseInt(stepNum),
                        goal: goal.trim(),
                        command: command.trim(),
                        reasoning: reasoning.trim(),
                        preconditions: precondList,
                        produces: producesObj
                    });
                }
            }

            // Phase 3: Fallback — strip markdown formatting and retry block-based
            if (steps.length === 0) {
                const stripped = aiResponse
                    .replace(/\*\*/g, '')
                    .replace(/\*/g, '')
                    .replace(/`{1,3}/g, '')
                    .replace(/#{1,6}\s/g, '')
                    // Normalize "- Prerequisites:", "- Command:", "- Reasoning:" → plain labels
                    .replace(/^[ \t]*-[ \t]+(Prerequisites?|Command|Reasoning|Produces):/gim, '$1:');
                const strippedBlocks = stripped.split(/(?=Step\s+\d+:\s)/gi);
                for (const block of strippedBlocks) {
                    const headerMatch = block.match(/Step\s+(\d+):\s*([^\n]+)/i);
                    if (!headerMatch) continue;
                    const cmdMatches3 = [...block.matchAll(/^Command:\s*([^\n]+)/gim)];
                    if (cmdMatches3.length === 0) continue;
                    const reasonMatch = block.match(/Reasoning:\s*([^\n]+)/i);
                    const prereqMatch = block.match(/Prerequisites?:\s*([^\n]+)/i);
                    const prodMatch = block.match(/Produces:\s*([^\n]+)/i);

                    let precondList = [];
                    if (prereqMatch && prereqMatch[1].trim().toLowerCase() !== 'none') {
                        precondList = prereqMatch[1].split(',').map(p => {
                            const trimmed = p.trim();
                            return this.parsePreconditionToken(trimmed);
                        }).filter(Boolean);
                    }
                    let producesObj = null;
                    if (prodMatch && prodMatch[1].trim().toLowerCase() !== 'none') {
                        producesObj = this.parseProduceToken(prodMatch[1].trim());
                    }

                    const action_cmd3 = cmdMatches3.map(m => m[1].trim());
                    steps.push({
                        step: parseInt(headerMatch[1]),
                        goal: headerMatch[2].trim(),
                        command: action_cmd3[0],
                        action_cmd: action_cmd3,
                        reasoning: reasonMatch ? reasonMatch[1].trim() : '',
                        preconditions: precondList,
                        produces: producesObj
                    });
                }
            }

            if (steps.length === 0) {
                console.log('❌ FEW-SHOT: Failed to parse execution plan - no steps found');
                return null;
            }

            // Dedup pass 1: keep first occurrence of each step number
            // (handles LLM repeating "Step 3:" twice in same response)
            const seenNums = new Set();
            const dedupByNum = steps.filter(s => {
                if (seenNums.has(s.step)) return false;
                seenNums.add(s.step);
                return true;
            });

            // Dedup pass 2: keep LAST occurrence of each command
            // LLMs often generate two full chains in one response (first-draft shortcut then
            // corrected full expansion). Both have unique step numbers, so pass 1 misses them.
            // Keeping the last occurrence preserves the correctly-ordered final chain.
            const cmdLastIdx = new Map();
            dedupByNum.forEach((s, i) => { if (s.command) cmdLastIdx.set(s.command, i); });
            const dedupedSteps = dedupByNum.filter((s, i) =>
                !s.command || cmdLastIdx.get(s.command) === i
            );

            // Renumber to ensure consecutive
            const renumberedSteps = dedupedSteps.map((s, i) => ({
                ...s,
                step: i + 1
            }));

            // 提取reasoning部分
            let reasoning = '';
            const reasoningMatch = aiResponse.match(/\*\*REASONING\*\*:\s*\n?\n?([^\n]+)/i);
            if (reasoningMatch) {
                reasoning = reasoningMatch[1].trim();
            }

            // 提取target（多策略：reasoning → craftRecipe → 用户输入）
            let target = null;

            // 策略1: 从 REASONING 段中提取
            const targetMatch = aiResponse.match(/target\s*[:=]\s*(\w+)/i);
            if (targetMatch) {
                target = targetMatch[1];
            }

            // 策略2: 从最后一个 craftRecipe 命令提取（支持单引号和双引号）
            if (!target) {
                for (let i = steps.length - 1; i >= 0; i--) {
                    const cmd = steps[i].command;
                    const craftMatch = cmd.match(/craftRecipe\(['"](\w+)['"]\s*,\s*\d+\)/);
                    if (craftMatch) {
                        target = craftMatch[1];
                        break;
                    }
                }
            }

            // 策略3: 从用户输入中提取 material + tool 组合
            if (!target && userInput) {
                const inputMatch = userInput.match(/(?:craft|make|build|forge|smith)\s+(?:an?\s+)?(\w+)[_\s]+(\w+)/i);
                if (inputMatch) {
                    target = `${inputMatch[1]}_${inputMatch[2]}`;
                }
            }

            if (this.debug) {
                console.log('\n' + '='.repeat(70));
                console.log('✅ FEW-SHOT: Execution Plan Parsed');
                console.log('='.repeat(70));
                console.log(`Steps Generated: ${steps.length}`);
                console.log(`Target Item: ${target || 'Unknown'}`);

                steps.forEach((step) => {
                    console.log(`\nStep ${step.step}: ${step.goal}`);
                    if (step.preconditions && step.preconditions.length > 0) {
                        const preDisplay = step.preconditions.map(p =>
                            typeof p === 'string' ? p : `${p.type}:${p.name}:${p.count || 1}`
                        ).join(', ');
                        console.log(`  Prerequisites: ${preDisplay}`);
                    }
                    if (step.produces) {
                        const ps = Array.isArray(step.produces) ? step.produces : [step.produces];
                        console.log(`  Produces: ${ps.map(p => `${p.type}:${p.name}:${p.count || 1}`).join(', ')}`);
                    }
                    console.log(`  Command: ${step.command}`);
                });

                console.log('\n' + '='.repeat(70) + '\n');
            }

            // 检查是否使用了 !newAction（不应该！）
            const hasNewAction = steps.some(step =>
                step.command && step.command.includes('!newAction')
            );

            if (hasNewAction) {
                this.logDebug('⚠️ WARNING: AI tried to use !newAction for crafting!');
                this.logDebug('This is incorrect - all standard crafting should use !craftRecipe');
                this.logDebug('AI response:', aiResponse?.substring(0, 500));

                // 不直接返回null，而是记录警告并继续
                // 实际执行时会失败（因为 !newAction 被禁用）
                // 这里让系统继续，以便看到完整的错误信息
            }

            return {
                reasoning,
                steps: renumberedSteps,
                target,
                raw: aiResponse
            };

        } catch (error) {
            this.logDebug('Error parsing execution plan:', error.message);
            this.logDebug('AI response was:', aiResponse?.substring(0, 500));
            return null;
        }
    }

    /**
     * 从命令字符串推断产出，返回 "type:name:count" 格式字符串
     * 用于 formatExample() 中显示 Produces 行
     *
     * @param {string} commandString - 如 "!smeltItem('iron_ore', 3)"
     * @returns {string|null} 如 "item:iron_ingot:3"
     */
    inferProducesDisplay(commandString) {
        if (!commandString) return null;

        const parsed = parseCommand(commandString);
        if (!parsed) return null;

        const { cmdName, itemName, count } = parsed;
        const n = count || 1;

        if (cmdName === 'smeltItem') {
            const outputName = this.recipeResolver?.smeltOutputFor(itemName) ?? SMELTING_OUTPUTS[itemName] ?? itemName;
            return `item:${outputName}:${n}`;
        }

        // collectBlocks, craftRecipe 等：产出 = 输入物品
        return `item:${itemName}:${n}`;
    }

    /**
     * 将 preconditions 展平为结构化格式字符串数组
     * 支持两种输入格式：
     * 1. 数组格式: ["item:iron_ore:3", "station:furnace"]  或旧格式 ["3x Iron Ingot"]
     * 2. 结构化对象格式: { items: { inventory: [...], nearby: [] }, access: [...] }
     *
     * 输出统一为 "type:name:count" 格式字符串
     */
    flattenStepPreconditions(preconditions) {
        if (!preconditions) return [];
        if (Array.isArray(preconditions)) return preconditions.filter(Boolean);

        if (typeof preconditions === 'object') {
            const result = [];

            // items 部分
            const items = preconditions.items;
            if (items) {
                for (const inv of (items.inventory || [])) {
                    // "item_name:count" 或纯名称
                    if (typeof inv === 'string' && inv.includes(':')) {
                        const [name, count] = inv.split(':');
                        result.push(`item:${name}:${count}`);
                    } else {
                        result.push(`item:${inv}:1`);
                    }
                }
                for (const near of (items.nearby || [])) {
                    result.push(`station:${near}`);
                }
                // NOTE: items.optional is intentionally NOT included here.
                // Optional items (torches, fuel variants) are NOT required preconditions.
                // The smeltItem skill handles fuel internally.
                if (items.equipped) {
                    for (const eq of items.equipped) {
                        result.push(`item:${eq}:1`);
                    }
                }
            }

            // access / tools 等列表字段
            for (const acc of (preconditions.access || [])) {
                result.push(`access:${acc}`);
            }
            for (const tool of (preconditions.tools || [])) {
                result.push(`item:${tool}:1`);
            }

            return result;
        }

        return [];
    }
}
