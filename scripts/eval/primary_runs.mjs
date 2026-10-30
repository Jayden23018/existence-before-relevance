// The run prefixes behind the paper's reported numbers, pinned.
//
// Why this file exists: the Plancraft cross-validation scripts used to pick
// "the latest N seed files" out of scripts/eval/results/ with a directory glob.
// That glob (a) only ever saw the top level, while the primary study's runs live
// in results/canonical/ and results/fixed_mcdata/, and (b) silently re-targeted
// itself every time a later ablation was run, so the same command produced a
// different measurement each month. Running it today picked the 2026-07-31 top-k
// and weight ablations and reported an agreement rate for runs the paper never
// cross-validated.
//
// Selection here is by run identity, not by mtime, so the command is a function
// of the release contents alone. mcnemar_table.mjs keeps its own copy of the
// same prefixes on purpose: it is the artifact's headline reproducibility
// command and must not depend on another module resolving.
import { existsSync } from 'fs';

const R = 'scripts/eval/results/';

/** condition -> [run prefix]; the arms that produce Table 2 and Table 3. */
export const QWENMAX_ABLATION = {
    no_retrieval: [`${R}canonical/eval_20260604_213651_no_retrieval`],
    random_retrieval: [`${R}canonical/eval_20260605_000159_random_retrieval`],
    bm25_retrieval: [`${R}canonical/eval_20260605_004805_bm25_retrieval`],
    saer_cold: [`${R}fixed_mcdata/eval_20260621_001120_saer_cold`],
};

export const PRIMARY_RUNS = {
    no_retrieval: [
        `${R}canonical/eval_20260605_213048_no_retrieval`,   // Qwen3-8B
        `${R}canonical/eval_20260605_213059_no_retrieval`,   // GPT-4o
        `${R}canonical/eval_20260605_233949_no_retrieval`,   // Claude Sonnet 4.5
        `${R}canonical/eval_20260604_213651_no_retrieval`,   // Qwen2.5-Max
        `${R}canonical/eval_20260604_231018_no_retrieval`,   // DeepSeek-V3
    ],
    random_retrieval: [
        `${R}canonical/eval_20260605_000159_random_retrieval`, // Qwen2.5-Max only
    ],
    bm25_retrieval: [
        `${R}canonical/eval_20260620_191130_bm25_retrieval`,     // Qwen3-8B
        `${R}fixed_mcdata/eval_20260621_121743_bm25_retrieval`,  // GPT-4o
        `${R}fixed_mcdata/eval_20260621_144209_bm25_retrieval`,  // Claude Sonnet 4.5
        `${R}canonical/eval_20260605_004805_bm25_retrieval`,     // Qwen2.5-Max
        `${R}fixed_mcdata/eval_20260621_115631_bm25_retrieval`,  // DeepSeek-V3
    ],
    saer_cold: [
        `${R}fixed_mcdata/eval_20260621_004648_saer_cold`,   // Qwen3-8B
        `${R}fixed_mcdata/eval_20260621_013640_saer_cold`,   // GPT-4o
        `${R}fixed_mcdata/eval_20260621_021308_saer_cold`,   // Claude Sonnet 4.5
        `${R}fixed_mcdata/eval_20260621_001120_saer_cold`,   // Qwen2.5-Max
        `${R}fixed_mcdata/eval_20260621_011658_saer_cold`,   // DeepSeek-V3
    ],
};

/**
 * Seed files for the pinned runs, as {file, condition} pairs.
 * Throws if any run is incomplete, so a partial release cannot quietly report a
 * smaller cross-validation than the paper cites.
 */
export function primarySeedFiles(runs = PRIMARY_RUNS) {
    const out = [];
    for (const [condition, prefixes] of Object.entries(runs)) {
        for (const prefix of prefixes) {
            for (const s of [1, 2, 3]) {
                const file = `${prefix}_s${s}.json`;
                if (!existsSync(file)) {
                    throw new Error(`pinned run file missing: ${file}\n`
                        + 'The Plancraft cross-validation is defined over the runs that '
                        + 'produce Table 2 and Table 3; refusing to substitute whatever '
                        + 'else is on disk.');
                }
                out.push({ file, condition });
            }
        }
    }
    return out;
}
