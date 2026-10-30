/**
 * rcon_setup.js
 *
 * RCON-based environment staging for live bot evaluation.
 * Connects to a Minecraft server, clears the staging area,
 * places raw materials as world blocks, and optionally
 * summons entities or pre-places a furnace.
 *
 * Uses rcon-client (npm package: rcon-client v4.x, ES-module compatible).
 *
 * Usage:
 *   import { setupEnvironment, clearEnvironment } from './rcon_setup.js';
 *   const rcon = await connectRcon({ host, port, password });
 *   await setupEnvironment(rcon, task, seed, spawn);
 *   rcon.end();
 */

import { Rcon } from 'rcon-client';

// ─── Connection ────────────────────────────────────────────────────

/**
 * Connect to RCON and return the client.
 * @param {{ host: string, port: number, password: string }} cfg
 * @returns {Promise<Rcon>}
 */
export async function connectRcon(cfg) {
    const rcon = await Rcon.connect({
        host:     cfg.host     || 'localhost',
        port:     cfg.port     || 25575,
        password: cfg.password || 'livebot_eval',
    });
    return rcon;
}

// ─── Main setup ────────────────────────────────────────────────────

/**
 * Reset environment and place materials for one trial.
 *
 * @param {Rcon}   rcon    - connected RCON client
 * @param {object} task    - task entry from livebot_manifest.json
 * @param {number} seed    - seed index (0, 1, 2 …) — shifts X offset to isolate runs
 * @param {{ x, y, z }} spawn  - bot spawn point
 */
export async function setupEnvironment(rcon, task, seed, spawn) {
    const seedOffset = seed * 30;
    const baseX = spawn.x + seedOffset;
    const baseY = spawn.y;
    const baseZ = spawn.z + 3;   // 3 blocks in front of spawn

    // 1. Clear the staging area for this seed slot
    await clearStagingArea(rcon, baseX, baseY, baseZ);

    // 2. Clear bot inventory
    await send(rcon, `/clear @a`);

    // 3. Teleport bot to THIS seed's staging slot (baseX), NOT the fixed spawn.
    //    Materials are placed at baseX = spawn.x + seed*30 to isolate runs; if the
    //    bot stayed at spawn.x, for seed≥3 the materials would sit 90/120 blocks
    //    away — beyond collectBlock's 64-block search range (skills.js:513) and
    //    smeltItem's 32-block furnace range — and the bot reports "No X nearby".
    //    Keeping z=spawn.z places the bot 3 blocks in front of the material row
    //    (baseZ = spawn.z + 3) for every seed, replicating the working seed-0 geometry.
    await send(rcon, `/tp ${task.botName || 'Max'} ${baseX} ${spawn.y} ${spawn.z}`);
    await send(rcon, `/time set 6000`);
    await send(rcon, `/weather clear`);

    // Force-load the staging area so subsequent setblock commands don't fail
    // with "That position is not loaded" (Paper async chunk loading race).
    const cx1 = Math.floor((baseX - 1) / 16) * 16;
    const cz1 = Math.floor((baseZ - 4) / 16) * 16;
    const cx2 = Math.floor((baseX + 56) / 16) * 16;
    const cz2 = Math.floor((baseZ + 11) / 16) * 16;
    await send(rcon, `/forceload add ${cx1} ${cz1} ${cx2} ${cz2}`);
    await sleep(600);   // brief pause for chunk data to propagate to client

    // 4. Place standard material blocks in a row
    let blockIdx = 0;
    for (const mat of task.materials) {
        for (let i = 0; i < mat.count; i++) {
            await send(rcon, `/setblock ${baseX + blockIdx} ${baseY} ${baseZ} minecraft:${mat.type}`);
            blockIdx++;
        }
    }

    // 4b. Over-stage cobblestone/stone/oak_log so no task ever fails purely from
    //     missing raw material (user request 2026-07-04, post-vanilla-migration
    //     robustness pass). Placed as a 4x4x4=64-block cube per type (one full
    //     stack), one Y-level ABOVE the ground-level material row (y=baseY+1..+4
    //     vs the row's y=baseY) so it never collides with that row regardless of
    //     its width (craft/anvil's own row is already 86 blocks wide, past the
    //     clearStagingArea x2 comment's assumed "max 48" — an elevated layer sidesteps
    //     needing to track that). Requires clearStagingArea's y2 bound widened by 1.
    await send(rcon, `/fill ${baseX} ${baseY + 1} ${baseZ} ${baseX + 3} ${baseY + 4} ${baseZ + 3} minecraft:cobblestone`);
    await send(rcon, `/fill ${baseX + 5} ${baseY + 1} ${baseZ} ${baseX + 8} ${baseY + 4} ${baseZ + 3} minecraft:stone`);
    await send(rcon, `/fill ${baseX + 10} ${baseY + 1} ${baseZ} ${baseX + 13} ${baseY + 4} ${baseZ + 3} minecraft:oak_log`);

    // 5. Furnace (Plan B): the bot self-builds its furnace from staged cobblestone.
    //    We do NOT pre-place a furnace block — an earlier design (prePlaceFurnace)
    //    pre-staged one, but the LLM/Plan-repair layer ignored it and still emitted a
    //    "craft furnace" step that consumed cobblestone, starving the real tool chain
    //    (3/3 L2 smoke trials failed on "craft furnace: not enough cobblestone").
    //    Self-building the furnace is a natural, low-knowledge step (assemble 8
    //    cobblestone) and keeps staging↔plan semantics consistent: the world contains
    //    exactly the leaf materials and nothing the bot didn't place itself.
    //    smeltItem (skills.js:252-262) auto-places a furnace from inventory if none is
    //    nearby, so a bot-crafted furnace is found and used.

    // 5b. Fuel only (Option Y staging). We do NOT /give a finished pickaxe: the
    //     full raw-material chain (oak_log + cobblestone + ore) is staged above, so
    //     building the tool chain (wooden → stone → iron pickaxe) is itself the
    //     multi-hop prerequisite knowledge the live study tests — exactly what SAER
    //     remediates. Pre-giving a pickaxe would short-circuit that knowledge axis
    //     and contradict the training examples (which lead with tool-making).
    //     Coal is given only as smelt fuel for smelting tasks (fuel is not a
    //     knowledge axis). Retrieval is unaffected: saer_cold pins cold-start
    //     weights in the harness, so a non-empty inventory at retrieval time does
    //     not change SAER example selection.
    const botName = task.botName || 'Max';
    if (taskNeedsSmelting(task)) {
        await send(rcon, `/give ${botName} minecraft:coal 16`);
    }

    // 6. Special collect-task setup (bamboo, sugar_cane, dripstone, terracotta)
    if (task.collectSetup) {
        await placeCollectBlocks(rcon, task.collectSetup, baseX, baseY, baseZ + 4);
    }

    // 7. Summon entity (combat tasks)
    if (task.summon) {
        const ex = baseX + 8;
        const ez = baseZ + 8;
        await send(rcon, `/summon minecraft:${task.summon} ${ex} ${baseY} ${ez}`);
    }
}

/**
 * Fill the staging area with air to erase leftover blocks from previous runs.
 */
async function clearStagingArea(rcon, baseX, baseY, baseZ) {
    const x1 = baseX - 1;
    const x2 = baseX + 55;   // max 48 iron_ore blocks + furnace + collect area
    const y1 = baseY;
    const y2 = baseY + 4;    // +1 to cover the over-staged cobblestone/stone/oak_log cubes (y=baseY+1..+4)
    const z1 = baseZ - 3;
    const z2 = baseZ + 10;
    await send(rcon, `/fill ${x1} ${y1} ${z1} ${x2} ${y2} ${z2} air`);
    // Kill dropped item entities in staging area — /fill air removes blocks but not
    // item entities on the ground. Stale drops from previous trials are picked up
    // automatically by the bot, polluting getAgentState().inventory and causing
    // pruneSteps to incorrectly skip prerequisite collection steps.
    await send(rcon, `/kill @e[type=item,x=${x1},y=${y1},z=${z1},dx=${x2 - x1},dy=5,dz=${z2 - z1}]`);
}

// ─── Collect-task placement helpers ───────────────────────────────

/**
 * Does this task require smelting (and thus fuel + a furnace)?
 * Inferred from staged materials and goal item — NOT from prePlaceFurnace, since
 * Plan B no longer pre-places a furnace but the bot still needs coal to smelt in
 * its self-built one. Matches recipe_resolver SMELTING_OUTPUTS directions:
 *   - raw ores (iron_ore/gold_ore) → smelt to ingot
 *   - cobblestone → smelt to stone (stone_bricks / stone_button / stone_pressure_plate)
 *   - clay → smelt to terracotta
 *   - goal items that are smelt outputs (iron_ingot, terracotta, …)
 */
function taskNeedsSmelting(task) {
    const smeltMaterials = new Set([
        'iron_ore', 'gold_ore', 'copper_ore', 'raw_iron', 'raw_gold', 'raw_copper',
        'cobblestone', 'clay', 'clay_ball', 'sand', 'red_sand', 'kelp',
    ]);
    const smeltGoals = new Set([
        'iron_ingot', 'gold_ingot', 'copper_ingot',
        'stone', 'smooth_stone', 'stone_bricks', 'stone_button', 'stone_pressure_plate',
        'stone_slab', 'smooth_stone_slab', 'terracotta', 'glass',
    ]);
    const mats = Array.isArray(task.materials) ? task.materials : [];
    if (mats.some(m => smeltMaterials.has(m.type))) return true;
    if (task.goal_item && smeltGoals.has(task.goal_item)) return true;
    return false;
}

/**
 * Place collect-task blocks near the bot.
 * Handles bamboo, sugar_cane (needs water), and simple solid blocks.
 */
async function placeCollectBlocks(rcon, setup, baseX, baseY, baseZ) {
    const { type, count, baseBlock, needsWater } = setup;

    if (type === 'sugar_cane') {
        await placeSugarCane(rcon, baseX, baseY, baseZ, count);
    } else if (type === 'bamboo') {
        await placeBamboo(rcon, baseX, baseY, baseZ, count);
    } else {
        // Solid blocks (pointed_dripstone, terracotta): place directly
        for (let i = 0; i < count; i++) {
            if (baseBlock) {
                // Ensure base block first
                await send(rcon, `/setblock ${baseX + i} ${baseY} ${baseZ} minecraft:${baseBlock}`);
            }
            await send(rcon, `/setblock ${baseX + i} ${baseY + 1} ${baseZ} minecraft:${type}`);
        }
    }
}

/**
 * Place sugar_cane with water source adjacent.
 *
 * Layout (top view, y=baseY):
 *   [water][dirt][dirt][dirt]...
 *   sugar_cane grows on dirt at y+1
 */
async function placeSugarCane(rcon, baseX, baseY, baseZ, count) {
    // Water source at baseX, dirt row starts at baseX+1
    await send(rcon, `/setblock ${baseX} ${baseY} ${baseZ} minecraft:water`);
    for (let i = 0; i < count; i++) {
        const x = baseX + 1 + i;
        await send(rcon, `/setblock ${x} ${baseY}     ${baseZ} minecraft:dirt`);
        await send(rcon, `/setblock ${x} ${baseY + 1} ${baseZ} minecraft:sugar_cane`);
    }
}

/**
 * Place bamboo on sand blocks.
 */
async function placeBamboo(rcon, baseX, baseY, baseZ, count) {
    for (let i = 0; i < count; i++) {
        const x = baseX + i;
        await send(rcon, `/setblock ${x} ${baseY}     ${baseZ} minecraft:sand`);
        await send(rcon, `/setblock ${x} ${baseY + 1} ${baseZ} minecraft:bamboo`);
    }
}

// ─── Utility ──────────────────────────────────────────────────────

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send an RCON command and return the response string.
 * Logs the command for debugging.
 */
async function send(rcon, cmd) {
    // RCON sends to server console — strip leading slash (chat-style prefix not needed)
    const consoleCmd = cmd.startsWith('/') ? cmd.slice(1) : cmd;
    const response = await rcon.send(consoleCmd);
    if (process.env.RCON_DEBUG === '1') {
        console.log(`[RCON] ${consoleCmd}`);
        if (response) console.log(`       → ${response.slice(0, 120)}`);
    }
    return response;
}
