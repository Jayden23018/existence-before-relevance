/**
 * 共享前置条件解析器
 *
 * 统一 TaskManager._parsePrecondition 和 PlanValidator.parsePreconditionString
 * 的解析逻辑，确保两处行为一致。
 */

const STATION_NAMES = new Set([
    'furnace', 'crafting_table', 'chest', 'anvil',
    'brewing_stand', 'enchanting_table', 'loom',
    'stonecutter', 'smithing_table', 'cartography_table',
    'grindstone', 'fletching_table', 'blast_furnace',
    'smoker', 'campfire', 'soul_campfire'
]);

const NOISE_WORDS = new Set([
    'have', 'need', 'access', 'to', 'in', 'the', 'a', 'an',
    'and', 'or', 'with', 'for', 'of', 'is', 'are', 'none',
    'required', 'recommended', 'must', 'should', 'available',
    'nearby', 'near', 'equipped', 'optional', 'tool'
]);

const COUNT_NOISE_WORDS = new Set(['a', 'an', 'the', 'in', 'to', 'or', 'and']);

function normalizeItemName(name) {
    return String(name || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_');
}

/**
 * 解析前置条件（字符串或结构化对象）为统一格式
 *
 * @param {string|object} cond - 前置条件，支持以下格式:
 *   - 结构化对象: { type: 'item', name: 'iron_ingot', count: 3 }
 *   - 结构化字符串: "item:iron_ore:3", "station:furnace", "access:trees"
 *   - 自然语言: "3x Iron Ingot", "furnace nearby", "Access to trees"
 *   - 旧格式: "Iron Ingot in inventory"
 * @returns {{ type: string, name: string, count: number } | null}
 */
export function parsePrecondition(cond) {
    if (!cond) return null;

    // 结构化对象直接转换
    if (typeof cond === 'object') {
        if (!cond.type || !cond.name) return null;
        return {
            type: cond.type,
            name: normalizeItemName(cond.name),
            count: cond.count || 1
        };
    }

    if (typeof cond !== 'string') return null;
    const raw = cond.trim();
    if (!raw) return null;
    const lower = raw.toLowerCase();

    // 1. 新结构化格式: "type:name" 或 "type:name:count"
    const structMatch = lower.match(/^(item|station|access):([a-zA-Z0-9_]+)(?::(\d+))?$/);
    if (structMatch) {
        return {
            type: structMatch[1],
            name: structMatch[2],
            count: structMatch[3] ? parseInt(structMatch[3]) : 1
        };
    }

    // 2. "Nearby: furnace" / "furnace nearby"
    const nearbyPrefixMatch = lower.match(/^nearby:\s*([a-zA-Z0-9_]+)/);
    if (nearbyPrefixMatch) {
        return { type: 'station', name: nearbyPrefixMatch[1], count: 1 };
    }
    const nearbySuffixMatch = lower.match(/^([a-zA-Z0-9_]+)\s+nearby$/);
    if (nearbySuffixMatch) {
        return { type: 'station', name: nearbySuffixMatch[1], count: 1 };
    }

    // 3. "Access to underground" / "access to trees"
    const accessMatch = lower.match(/access\s+to\s+([a-zA-Z0-9_]+)/);
    if (accessMatch) {
        return { type: 'access', name: accessMatch[1], count: 1 };
    }

    // 4. "3x Iron Ingot" / "3x iron_ingot" / "3 iron_ingot"
    const countMatch = lower.match(/(\d+)x?\s+(.+)/);
    if (countMatch) {
        const name = countMatch[2].trim().replace(/\s+/g, '_');
        if (COUNT_NOISE_WORDS.has(name)) return null;

        if (STATION_NAMES.has(name)) {
            return { type: 'station', name, count: parseInt(countMatch[1]) };
        }
        return { type: 'item', name, count: parseInt(countMatch[1]) };
    }

    // 5. "Iron Ingot in inventory" / "iron_ingot in inventory"
    const invMatch = lower.match(/(.+?)\s+in\s+(?:your\s+)?inventory/);
    if (invMatch) {
        const name = invMatch[1].trim().replace(/\s+/g, '_');
        return { type: 'item', name, count: 1 };
    }

    // 6. 纯名称（可能是 item 或 station）
    const normalized = normalizeItemName(lower);
    if (NOISE_WORDS.has(normalized)) return null;

    if (STATION_NAMES.has(normalized)) {
        return { type: 'station', name: normalized, count: 1 };
    }

    return { type: 'item', name: normalized, count: 1 };
}

export { STATION_NAMES, NOISE_WORDS, normalizeItemName };

export const FUEL_ITEMS = new Set([
    'coal', 'charcoal', 'coal_block', 'lava_bucket',
    'dried_kelp_block', 'bamboo', 'stick',
    'oak_planks', 'birch_planks', 'spruce_planks', 'jungle_planks',
    'acacia_planks', 'dark_oak_planks', 'mangrove_planks',
    'oak_log', 'birch_log', 'spruce_log', 'jungle_log',
    'acacia_log', 'dark_oak_log', 'mangrove_log',
    'oak_slab', 'birch_slab', 'spruce_slab',
    'wooden_axe', 'wooden_pickaxe', 'wooden_sword',
    'wooden_shovel', 'wooden_hoe',
    'planks', 'log'
]);

/**
 * 解析命令字符串为结构化对象
 *
 * 支持格式: !commandName("itemName", count) 或 !commandName('itemName')
 *
 * @param {string} commandString - 命令字符串
 * @returns {{ cmdName: string, itemName: string, count: number | null } | null}
 */
export function parseCommand(commandString) {
    if (!commandString || typeof commandString !== 'string') return null;
    const match = commandString.match(/!(\w+)\(['"]([^'"]+)['"]\s*(?:,\s*(\d+))?\)/);
    if (!match) return null;
    return {
        cmdName: match[1],
        itemName: match[2],
        count: match[3] ? parseInt(match[3]) : null
    };
}
