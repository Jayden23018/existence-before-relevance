import minecraftData from 'minecraft-data';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mcdata = minecraftData('1.20.4');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

const COMMAND_DEFS = {
    '!collectBlocks':   { params: [{ type: 'BlockName' }, { type: 'int' }] },
    '!craftRecipe':     { params: [{ type: 'ItemName' }, { type: 'int' }] },
    '!smeltItem':       { params: [{ type: 'ItemName' }, { type: 'int' }] },
    '!searchForBlock':  { params: [{ type: 'BlockName' }, { type: 'float' }] },
    '!searchForEntity': { params: [{ type: 'string' }, { type: 'float' }] },
    '!attack':          { params: [{ type: 'string' }, { type: 'boolean' }] },
    '!equip':           { params: [{ type: 'ItemName' }] },
    '!placeHere':       { params: [{ type: 'BlockName' }] },
    '!inventory':       { params: [] },
    '!consume':         { params: [{ type: 'ItemName' }] },
    '!discard':         { params: [{ type: 'ItemName' }, { type: 'int' }] },
    '!activate':        { params: [{ type: 'BlockName' }] },
};

const CMD_REGEX = /!(\w+)(?:\(((?:-?\d+(?:\.\d+)?|true|false|"[^"]*"|'[^']*')(?:\s*,\s*(?:-?\d+(?:\.\d+)?|true|false|"[^"]*"|'[^']*'))*)\))?/;
const ARG_REGEX = /-?\d+(?:\.\d+)?|true|false|"[^"]*"|'[^']*'/g;

function isValidBlock(name) {
    return mcdata.blocksByName[name] !== undefined;
}

function isValidItem(name) {
    return mcdata.itemsByName[name] !== undefined;
}

function parseCommand(cmdStr) {
    const match = cmdStr.match(CMD_REGEX);
    if (!match) return { name: null, args: [], raw: cmdStr };

    const name = '!' + match[1];
    const args = match[2] ? match[2].match(ARG_REGEX) || [] : [];
    const cleanArgs = args.map(a => {
        if ((a.startsWith("'") && a.endsWith("'")) || (a.startsWith('"') && a.endsWith('"'))) {
            return a.slice(1, -1);
        }
        return a;
    });
    return { name, args: cleanArgs, raw: cmdStr };
}

function validateCommand(cmdStr, filePath, slug, stepNum) {
    const issues = [];
    const parsed = parseCommand(cmdStr);

    if (!parsed.name) {
        issues.push({ level: 'ERROR', msg: `Malformed command: ${cmdStr}` });
        return issues;
    }

    const def = COMMAND_DEFS[parsed.name];
    if (!def) {
        issues.push({ level: 'ERROR', msg: `Unknown command: ${parsed.name}` });
        return issues;
    }

    if (parsed.args.length !== def.params.length) {
        issues.push({
            level: 'ERROR',
            msg: `${parsed.name} expects ${def.params.length} args, got ${parsed.args.length}: ${cmdStr}`
        });
        return issues;
    }

    for (let i = 0; i < def.params.length; i++) {
        const paramDef = def.params[i];
        const arg = parsed.args[i];

        switch (paramDef.type) {
            case 'BlockName':
                if (arg === 'air') break;
                if (!isValidBlock(arg)) {
                    issues.push({
                        level: 'ERROR',
                        msg: `Invalid block name '${arg}' in ${parsed.name}: not found in MC 1.20.4 blocksByName`
                    });
                }
                break;
            case 'ItemName':
                if (!isValidItem(arg)) {
                    issues.push({
                        level: 'ERROR',
                        msg: `Invalid item name '${arg}' in ${parsed.name}: not found in MC 1.20.4 itemsByName`
                    });
                }
                break;
            case 'boolean':
                if (arg !== 'true' && arg !== 'false') {
                    issues.push({
                        level: 'ERROR',
                        msg: `Expected boolean, got '${arg}' in ${parsed.name}`
                    });
                }
                break;
            case 'int':
                if (!Number.isInteger(Number(arg))) {
                    issues.push({
                        level: 'ERROR',
                        msg: `Expected integer, got '${arg}' in ${parsed.name}`
                    });
                }
                break;
            case 'float':
                if (isNaN(Number(arg))) {
                    issues.push({
                        level: 'ERROR',
                        msg: `Expected number, got '${arg}' in ${parsed.name}`
                    });
                }
                break;
        }
    }

    return issues;
}

function validateFile(filePath) {
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    const allIssues = [];
    const fileName = filePath.split('/').pop();

    for (const example of data) {
        const slug = example.slug || 'unknown';
        for (const step of (example.plan || [])) {
            const stepNum = step.step || '?';
            for (const cmd of (step.action_cmd || [])) {
                const issues = validateCommand(cmd, fileName, slug, stepNum);
                for (const issue of issues) {
                    allIssues.push({ ...issue, file: fileName, slug, step: stepNum, cmd });
                }
            }
        }
    }

    return allIssues;
}

// Every file reachable from INTENT_TO_TRAINING_FILE. combat/build were omitted
// until 2026-07-30; combat in particular was unvalidated the whole time it was
// unreachable from the deployed router. cooking_examples.json is excluded on
// purpose — it is a dialogue corpus, not demonstrations, and nothing routes to it.
const files = [
    join(__dirname, '..', 'data', 'training', 'crafting_examples.json'),
    join(__dirname, '..', 'data', 'training', 'collecting_examples.json'),
    join(__dirname, '..', 'data', 'training', 'combat_examples.json'),
    join(__dirname, '..', 'data', 'training', 'build_examples.json'),
];

let totalErrors = 0;
let totalWarnings = 0;

for (const file of files) {
    const issues = validateFile(file);
    if (issues.length === 0) {
        console.log(`${GREEN}✓ ${file.split('/').pop()}: All commands valid${RESET}`);
        continue;
    }

    console.log(`\n${CYAN}${file.split('/').pop()}${RESET}`);
    for (const issue of issues) {
        const color = issue.level === 'ERROR' ? RED : YELLOW;
        const label = issue.level === 'ERROR' ? 'ERROR' : 'WARN';
        console.log(`  ${color}[${label}] ${issue.slug} step ${issue.step}: ${issue.msg}${RESET}`);
        console.log(`    Command: ${issue.cmd}`);
        if (issue.level === 'ERROR') totalErrors++;
        else totalWarnings++;
    }
}

console.log(`\n${'='.repeat(60)}`);
if (totalErrors === 0 && totalWarnings === 0) {
    console.log(`${GREEN}All commands valid. No issues found.${RESET}`);
} else {
    console.log(`${totalErrors > 0 ? RED : GREEN}Errors: ${totalErrors}${RESET}`);
    console.log(`${totalWarnings > 0 ? YELLOW : GREEN}Warnings: ${totalWarnings}${RESET}`);
}

process.exit(totalErrors > 0 ? 1 : 0);
