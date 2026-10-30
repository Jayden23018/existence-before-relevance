/**
 * BlockNameResolver — 将模糊方块概念名解析为真实 Minecraft 方块名
 *
 * 核心能力：
 * 1. 环境感知：扫描 bot 附近方块，模糊匹配（includes）
 * 2. mcData 候选：从 minecraft-data 数据库生成候选列表，精确扫描
 *
 * 输入：任意概念名（如 "log"、"oak_log"、"iron_ore"）
 * 输出：{ blockName, source, range }
 */

import minecraftData from 'minecraft-data';

const DEFAULT_SEARCH_RANGES = [32, 64, 96, 128];
const DEFAULT_MAX_CANDIDATES = 12;

export class BlockNameResolver {
    constructor(bot) {
        this.bot = bot;
        this._mcData = null;
        this._resolveCache = new Map();
        this._cacheTTL = 5000;
    }

    /**
     * 懒加载 mcData，依赖 bot.version（spawn 后可用）
     */
    _getMcData() {
        if (this._mcData) return this._mcData;
        if (!this.bot?.version) return null;
        this._mcData = minecraftData(this.bot.version);
        return this._mcData;
    }

    /**
     * 从 mcData.blocksArray 生成包含 keyword 的候选列表
     *
     * @param {string} keyword - 搜索关键词
     * @returns {string[]} 候选方块名列表（已排序）
     */
    getCandidates(keyword) {
        const mcData = this._getMcData();
        if (!mcData) return [];

        const normalized = keyword.toLowerCase().trim();
        return mcData.blocksArray
            .filter(b => {
                if (b.name === normalized) return true;
                if (b.name.endsWith('_' + normalized)) return true;
                if (b.name.startsWith(normalized + '_')) return true;
                return false;
            })
            .map(b => b.name);
    }

    /**
     * 构建“从精确到泛化”的关键词序列（通用，不只 log）
     * 示例：
     *  - oak_log -> ["oak_log", "log"]
     *  - deepslate_iron_ore -> ["deepslate_iron_ore", "iron_ore", "ore"]
     *
     * @param {string} normalizedName - 归一化后的概念名
     * @returns {string[]}
     */
    _buildFallbackKeywords(normalizedName) {
        const keywords = [];
        const seen = new Set();
        const add = (kw) => {
            if (!kw || seen.has(kw)) return;
            seen.add(kw);
            keywords.push(kw);
        };

        add(normalizedName);

        const parts = normalizedName.split('_').filter(Boolean);
        if (parts.length > 1) {
            // 降级到后缀，但避免过于泛化（例如 deepslate_iron_ore -> ore）
            // 规则：
            // - 两段名: 允许退化到单段（oak_log -> log）
            // - 三段及以上: 仅保留长度>=2 的后缀（deepslate_iron_ore -> iron_ore）
            const maxIndexExclusive = parts.length === 2 ? parts.length : parts.length - 1;
            for (let i = 1; i < maxIndexExclusive; i++) {
                add(parts.slice(i).join('_'));
            }
        }

        return keywords;
    }

    /**
     * 生成候选列表（保持 mcData 原始顺序，不做 sort）
     * 优先 exact，再按 fallback keyword 扩展。
     * mcData 不可用时（bot 未完全初始化）走硬编码变体表兜底。
     *
     * @param {string} conceptName
     * @param {number} maxCandidates
     * @returns {string[]}
     */
    getCandidatePlan(conceptName, maxCandidates = DEFAULT_MAX_CANDIDATES) {
        if (!conceptName) return [];

        const mcData = this._getMcData();
        if (!mcData) {
            return this._getHardcodedVariants(conceptName);
        }

        const normalized = conceptName.toLowerCase().trim();
        const keywords = this._buildFallbackKeywords(normalized);
        const candidates = [];
        const seen = new Set();

        const add = (name) => {
            if (!name || seen.has(name)) return false;
            seen.add(name);
            candidates.push(name);
            return true;
        };

        // exact 命中放首位
        if (mcData.blocksByName[normalized]) {
            add(normalized);
        }

        // 依次用 fallback keyword 扩展
        for (const kw of keywords) {
            const matched = this.getCandidates(kw);
            for (const candidate of matched) {
                add(candidate);
                if (candidates.length >= maxCandidates) {
                    return candidates;
                }
            }
        }

        return candidates;
    }

    /**
     * mcData 不可用时（bot 未完全初始化）的硬编码变体表。
     * 保证 fallback 候选列表不为空，即使 mcData 还没加载。
     *
     * @param {string} conceptName
     * @returns {string[]}
     */
    _getHardcodedVariants(conceptName) {
        const normalized = (conceptName || '').toLowerCase().trim();

        const VARIANT_MAP = {
            'log':           ['oak_log', 'spruce_log', 'birch_log', 'jungle_log', 'acacia_log', 'dark_oak_log', 'mangrove_log', 'cherry_log'],
            'oak_log':       ['oak_log', 'spruce_log', 'birch_log', 'jungle_log', 'acacia_log', 'dark_oak_log'],
            'spruce_log':    ['spruce_log', 'oak_log', 'birch_log', 'jungle_log', 'acacia_log', 'dark_oak_log'],
            'birch_log':     ['birch_log', 'oak_log', 'spruce_log', 'jungle_log', 'acacia_log', 'dark_oak_log'],
            'planks':        ['oak_planks', 'spruce_planks', 'birch_planks', 'jungle_planks', 'acacia_planks', 'dark_oak_planks'],
            'oak_planks':    ['oak_planks', 'spruce_planks', 'birch_planks', 'jungle_planks', 'acacia_planks', 'dark_oak_planks'],
            'stone':         ['stone', 'cobblestone', 'deepslate'],
            'cobblestone':   ['cobblestone', 'stone', 'deepslate'],
            'iron_ore':      ['iron_ore', 'deepslate_iron_ore'],
            'coal_ore':      ['coal_ore', 'deepslate_coal_ore'],
            'copper_ore':    ['copper_ore', 'deepslate_copper_ore'],
            'gold_ore':      ['gold_ore', 'deepslate_gold_ore'],
            'diamond_ore':   ['diamond_ore', 'deepslate_diamond_ore'],
            'sand':          ['sand', 'red_sand'],
            'dirt':          ['dirt', 'grass_block', 'coarse_dirt'],
        };

        if (VARIANT_MAP[normalized]) return VARIANT_MAP[normalized];

        // 后缀匹配：oak_log → 'log' 组
        for (const [key, list] of Object.entries(VARIANT_MAP)) {
            if (normalized !== key && (normalized.endsWith('_' + key) || key.endsWith('_' + normalized.split('_').pop()))) {
                return list;
            }
        }

        return [];
    }

    /**
     * 主入口：将概念名解析为真实方块名
     *
     * @param {string} conceptName - 概念名（如 "log"、"oak_log"）
     * @returns {{ blockName: string|null, source: string, range: number }}
     */
    resolve(conceptName) {
        if (!conceptName || !this.bot) {
            return { blockName: null, source: 'not_found', range: 128, candidates: [] };
        }

        const keyword = conceptName.toLowerCase().trim();

        const cached = this._resolveCache.get(keyword);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.result;
        }

        const ranges = DEFAULT_SEARCH_RANGES;

        // 阶段1 — 候选列表（按 mcData 顺序，不排序）
        const candidates = this.getCandidatePlan(keyword);
        if (candidates.length > 0) {
            console.log(`[BlockNameResolver] env miss, candidates: [${candidates.slice(0, 6).join(', ')}${candidates.length > 6 ? ', ...' : ''}]`);
        }

        // 阶段2 — 候选轮换：每个 candidate 都按 32→64→96→128 扫描
        for (const candidate of candidates) {
            for (const range of ranges) {
                try {
                    const block = this.bot.findBlock({
                        maxDistance: range,
                        matching: b => b?.name === candidate
                    });
                    if (block) {
                        console.log(`[BlockNameResolver] \u2705 mcdata: "${conceptName}" \u2192 "${block.name}" (range=${range})`);
                        const result = { blockName: block.name, source: 'mcdata_candidate', range, candidates };
                        this._resolveCache.set(keyword, { result, expiresAt: Date.now() + this._cacheTTL });
                        return result;
                    }
                } catch (e) {
                    console.warn(`[BlockNameResolver] findBlock error for "${candidate}" at range ${range}: ${e.message}`);
                }
            }
        }

        // 阶段3 — 环境扫描失败但 mcData 有候选 → 返回首候选 + 完整候选列表供回退使用
        if (candidates.length > 0) {
            console.log(`[BlockNameResolver] \u26a0\ufe0f mcdata fallback: "${conceptName}" \u2192 "${candidates[0]}" (no blocks nearby, ${candidates.length} candidates available for retry)`);
            const fallbackResult = { blockName: candidates[0], source: 'mcdata_fallback', range: 0, candidates };
            this._resolveCache.set(keyword, { result: fallbackResult, expiresAt: Date.now() + this._cacheTTL });
            return fallbackResult;
        }

        // 阶段4 — 完全找不到（mcData 也无候选）
        console.log(`[BlockNameResolver] \u274c "${conceptName}" not found in mcData or environment`);
        const notFoundResult = { blockName: null, source: 'not_found', range: 128, candidates: [] };
        this._resolveCache.set(keyword, { result: notFoundResult, expiresAt: Date.now() + this._cacheTTL });
        return notFoundResult;
    }

    clearCache() {
        this._resolveCache.clear();
    }
}
