/**
 * Cold-start validity audit for the demonstration bank (Codex round7 fix#2).
 *
 * Same defect class found in the original 9 combat examples (§4.5): a plan
 * step assumes a prerequisite item/tool is already in inventory without any
 * earlier command (in this step or a prior one) acquiring it. Walks each
 * example command-by-command from an empty cold-start inventory, reusing
 * PlanValidator's own implicit-precondition/produces inference so a step
 * that crafts its own crafting_table and then uses it later in the SAME
 * step (the normal, valid pattern in this data) is not a false positive —
 * PlanValidator.validate() checks preconditions once per step before the
 * step runs, so it can't see that intra-step production; this script
 * additionally simulates within-step command order to avoid that noise.
 *
 * Usage: node scripts/eval/audit_demo_bank_cold_start.mjs
 */
import fs from 'fs';
import { PlanValidator, TOOL_TIERS } from '../../src/models/enhancers/plan_validator.js';
import { FewShotLearning } from '../../src/models/enhancers/fewshot_learning.js';
import RecipeResolver from '../../src/models/enhancers/recipe_resolver.js';

const FILES = [
    'crafting_examples.json',
    'collecting_examples.json',
    'build_examples.json',
    'combat_examples.json',
];

const pv = new PlanValidator(false, null);
pv.setRecipeResolver(new RecipeResolver({ version: '1.20.4' }));
const fsl = new FewShotLearning();

function auditExample(ex) {
    const inv = {}; // cold start: empty
    const gaps = [];

    for (const step of ex.plan) {
        // Declared preconditions are genuine cross-step prerequisites — check
        // against inventory as it stood BEFORE this step (correct semantics).
        const declared = fsl.flattenStepPreconditions(step.preconditions)
            .map(c => pv.parsePreconditionString(c))
            .filter(Boolean);
        for (const cond of declared) {
            if (!pv._isSatisfiedByVirtual(cond, inv)) {
                gaps.push(`step${step.step} declared:${cond.type}:${cond.name}:${cond.count || 1}`);
            }
        }
        // Consume declared item preconditions (materials only — tools are never
        // consumed, matching PlanValidator.validate()'s real semantics).
        for (const cond of declared) {
            if (cond.type === 'item' && TOOL_TIERS[cond.name] === undefined) {
                inv[cond.name] = Math.max(0, (inv[cond.name] || 0) - (cond.count || 1));
            }
        }

        // Walk this step's commands in order so intra-step production
        // (e.g. craft crafting_table, then use it later in the same step)
        // satisfies later implicit preconditions within the same step.
        for (const cmd of (step.action_cmd || [])) {
            const implicit = pv.inferImplicitPreconditions(cmd);
            for (const cond of implicit) {
                if (!pv._isSatisfiedByVirtual(cond, inv)) {
                    gaps.push(`step${step.step} implicit:${cond.type}:${cond.name}:${cond.count || 1} (cmd: ${cmd})`);
                }
            }
            const produced = pv.inferProduces(cmd);
            if (produced && produced.type === 'item') {
                inv[produced.name] = (inv[produced.name] || 0) + (produced.count || 1);
            }
        }

        // Declared step.produces on top of inferred (covers non-command-inferable outputs).
        const declaredProduces = step.produces ? (Array.isArray(step.produces) ? step.produces : [step.produces]) : [];
        for (const p of declaredProduces) {
            if (p.type === 'item') {
                inv[p.name] = (inv[p.name] || 0) + (p.count || 1);
            }
        }
    }

    return gaps;
}

let totalExamples = 0;
let totalDefective = 0;

for (const file of FILES) {
    const examples = JSON.parse(fs.readFileSync(`data/training/${file}`, 'utf8'));
    const defective = [];

    for (const ex of examples) {
        totalExamples++;
        const gaps = auditExample(ex);
        if (gaps.length > 0) {
            totalDefective++;
            defective.push({ slug: ex.slug, gaps });
        }
    }

    console.log(`\n=== ${file} (${examples.length} examples, ${defective.length} defective) ===`);
    for (const d of defective) {
        console.log(`  ${d.slug}:`);
        for (const g of d.gaps) console.log(`      ${g}`);
    }
}

console.log(`\nTOTAL: ${totalDefective}/${totalExamples} examples have a cold-start gap.`);
