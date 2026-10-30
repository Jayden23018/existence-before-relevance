const DEFAULT_SCOUT_OFFSETS = [
    { x: 96, z: 0, label: 'east' },
    { x: -96, z: 0, label: 'west' },
    { x: 0, z: 96, label: 'south' },
    { x: 0, z: -96, label: 'north' },
    { x: 96, z: 96, label: 'south-east' },
    { x: -96, z: -96, label: 'north-west' }
];

const CHEAP_RENEWABLE_ITEMS = new Set([
    'stick',
    'sticks',
    'log',
    'wood',
    'planks',
    'any_log',
    'any_planks',
    'oak_log',
    'spruce_log',
    'birch_log',
    'jungle_log',
    'acacia_log',
    'dark_oak_log',
    'mangrove_log',
    'cherry_log',
    'stone',
    'cobblestone',
    'dirt',
    'sand',
    'gravel'
]);

const RARE_OR_PROCESSED_TERMS = [
    'diamond',
    'emerald',
    'ingot',
    'pickaxe',
    'sword',
    'axe',
    'shovel',
    'bucket',
    'furnace',
    'cooked',
    'glass',
    'obsidian'
];

export class CollaborativePlanner {
    constructor(options = {}) {
        this.agentName = options.agentName || 'unknown_agent';
        this.debug = Boolean(options.debug);
    }

    logDebug(...args) {
        if (this.debug) {
            console.log('[CollaborativePlanner]', ...args);
        }
    }

    selectCoordinator(addressedAgents, capabilityRecords = []) {
        const recordMap = new Map(
            (capabilityRecords || []).map(record => [record.agent, record])
        );

        const ranked = [...new Set(addressedAgents || [])].map(agent => {
            const record = recordMap.get(agent) || {};
            return {
                agent,
                activeTaskCount: Number(record.activeTaskCount) || 0,
                updatedAt: Number(record.updatedAt) || 0
            };
        }).sort((a, b) => {
            if (a.activeTaskCount !== b.activeTaskCount) {
                return a.activeTaskCount - b.activeTaskCount;
            }
            if (a.updatedAt !== b.updatedAt) {
                return b.updatedAt - a.updatedAt;
            }
            return a.agent.localeCompare(b.agent);
        });

        return ranked[0]?.agent || this.agentName;
    }

    findMatchingPatterns(fewShotLearning, intent, teamContext) {
        if (!fewShotLearning?.findMatchingCollaborativePattern) {
            return [];
        }
        return fewShotLearning.findMatchingCollaborativePattern(intent, teamContext) || [];
    }

    createSessionPlan({ session, intent, player, addressedAgents, localPosition, teamContext, patterns = [] }) {
        const uniqueAgents = [...new Set(addressedAgents || [])];
        const coordinator = session?.coordinator || this.selectCoordinator(uniqueAgents, teamContext?.capabilities || []);

        if (this.isBuildSiteSelectionRequest(intent?.input || '')) {
            return this.createBuildSitePlan({
                session,
                intent,
                player,
                addressedAgents: uniqueAgents,
                localPosition,
                coordinator,
                patterns
            });
        }

        return this.createGenericTeamPlan({
            session,
            intent,
            player,
            addressedAgents: uniqueAgents,
            localPosition,
            coordinator
        });
    }

    summarizeUserRequest(input, maxLength = 80) {
        const normalized = String(input || '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!normalized) {
            return 'the current shared task';
        }

        if (normalized.length <= maxLength) {
            return normalized;
        }

        return `${normalized.slice(0, maxLength - 3).trim()}...`;
    }

    formatGoalLabel(input, maxLength = 80) {
        const summary = this.summarizeUserRequest(input, maxLength);
        if (summary === 'the current shared task') {
            return summary;
        }
        return `"${summary}"`;
    }

    isBuildSiteSelectionRequest(input) {
        const text = String(input || '').toLowerCase();
        return (
            text.includes('coordinate') ||
            text.includes('coordinates') ||
            text.includes('good place') ||
            text.includes('good spot') ||
            text.includes('build site') ||
            text.includes('where to build') ||
            text.includes('send me the coordinate')
        );
    }

    createBuildSitePlan({ session, intent, player, addressedAgents, localPosition, coordinator, patterns = [] }) {
        const basePosition = {
            x: Math.round(localPosition?.x || 0),
            y: Math.round(localPosition?.y || 64),
            z: Math.round(localPosition?.z || 0)
        };
        const goalLabel = this.formatGoalLabel(session?.request || intent?.input || '');

        const assignments = addressedAgents.map((agent, index) => {
            const offset = DEFAULT_SCOUT_OFFSETS[index % DEFAULT_SCOUT_OFFSETS.length];
            const target = {
                x: basePosition.x + offset.x,
                y: basePosition.y,
                z: basePosition.z + offset.z
            };
            const role = agent === coordinator ? 'coordinator_scout' : 'scout';
            const steps = [];

            if (agent === coordinator) {
                steps.push({
                    step: steps.length + 1,
                    stepType: 'public_message',
                    goal: 'Acknowledge the shared scouting plan to the player',
                    message: `@${player} Working together on your request to ${goalLabel}. I'll coordinate while everyone scouts a different direction for the best house site.`
                });
            } else {
                steps.push({
                    step: steps.length + 1,
                    stepType: 'public_message',
                    goal: `Announce scouting direction (${offset.label})`,
                    message: `@${player} I'm scouting ${offset.label} for your request to ${goalLabel} and I'll report back.`
                });
            }

            steps.push({
                step: steps.length + 1,
                stepType: 'command',
                goal: `Travel ${offset.label} to scout a different area`,
                action_cmd: [`!goToCoordinates(${target.x}, ${target.y}, ${target.z}, 12)`],
                metadata: {
                    assignmentRole: role,
                    targetPosition: target
                }
            });
            steps.push({
                step: steps.length + 1,
                stepType: 'command',
                goal: 'Search for a flat grassy build site nearby',
                action_cmd: ['!searchForBlock("grass_block", 128)'],
                metadata: {
                    assignmentRole: role,
                    recordCandidateSite: true
                }
            });
            steps.push({
                step: steps.length + 1,
                stepType: 'bot_message',
                goal: 'Report the candidate site to the coordinator',
                targetAgent: coordinator,
                messageTemplate: agent === coordinator
                    ? 'Coordinator note: I found a candidate at {{x}} {{y}} {{z}} with score {{score}}.'
                    : `Candidate site from ${agent}: {{x}} {{y}} {{z}} score={{score}} resources={{resourceSummary}} notes={{notes}}`,
                metadata: {
                    assignmentRole: role,
                    shareCandidate: true
                }
            });

            if (agent === coordinator) {
                steps.push({
                    step: steps.length + 1,
                    stepType: 'report_coordinate',
                    goal: 'Select the best shared candidate site and report it to the player',
                    player,
                    waitForAgents: addressedAgents,
                    messageTemplate: `@${player} Best site we found is at {{x}} {{y}} {{z}}. Score {{score}}. Nearby resources: {{resourceSummary}}.`
                });
            }

            return {
                id: `assignment_${Date.now()}_${index}_${agent}`,
                agent,
                role,
                summary: agent === coordinator
                    ? `Coordinate the team on ${goalLabel} and scout one build-site candidate`
                    : `Scout a ${offset.label} build-site candidate for ${goalLabel}`,
                dependsOn: [],
                areaClaim: {
                    x: target.x,
                    y: target.y,
                    z: target.z,
                    radius: 64
                },
                reservations: [],
                status: 'planned',
                result: null,
                steps
            };
        });

        return {
            sessionId: session?.id || null,
            coordinator,
            planVersion: (session?.planVersion || 0) + 1,
            patterns: patterns.map(pattern => pattern.slug || pattern.name).filter(Boolean),
            summary: `Coordinate ${addressedAgents.length} agents to scout and report the best build site`,
            assignments
        };
    }

    createGenericTeamPlan({ session, intent, player, addressedAgents, localPosition, coordinator }) {
        const basePosition = {
            x: Math.round(localPosition?.x || 0),
            y: Math.round(localPosition?.y || 64),
            z: Math.round(localPosition?.z || 0)
        };
        const goalLabel = this.formatGoalLabel(session?.request || intent?.input || '');

        const assignments = addressedAgents.map((agent, index) => {
            const offset = DEFAULT_SCOUT_OFFSETS[index % DEFAULT_SCOUT_OFFSETS.length];
            const target = {
                x: basePosition.x + offset.x,
                y: basePosition.y,
                z: basePosition.z + offset.z
            };
            const steps = [
                {
                    step: 1,
                    stepType: 'public_message',
                    goal: 'Announce the shared task split',
                    message: agent === coordinator
                        ? `@${player} We're splitting up your request to ${goalLabel} and coordinating in chat so we don't duplicate work.`
                        : `@${player} I'm taking one part of your request to ${goalLabel} and will report progress here.`
                },
                {
                    step: 2,
                    stepType: 'command',
                    goal: 'Move to a different working area',
                    action_cmd: [`!goToCoordinates(${target.x}, ${target.y}, ${target.z}, 12)`],
                    metadata: {
                        assignmentRole: agent === coordinator ? 'coordinator' : 'worker',
                        targetPosition: target
                    }
                }
            ];

            if (agent === coordinator) {
                steps.push({
                    step: 3,
                    stepType: 'bot_message',
                    goal: 'Confirm task split internally',
                    targetAgent: addressedAgents.find(name => name !== coordinator) || coordinator,
                    messageTemplate: `Session ${session?.id || 'pending'} is active for ${goalLabel}. Stick to that player request, stay in your assigned area, and report blockers quickly.`,
                    metadata: {
                        assignmentRole: 'coordinator'
                    }
                });
            }

            return {
                id: `assignment_${Date.now()}_${index}_${agent}`,
                agent,
                role: agent === coordinator ? 'coordinator' : 'worker',
                summary: agent === coordinator
                    ? `Coordinate and execute the lead slice of ${goalLabel}`
                    : `Execute a non-overlapping slice of ${goalLabel}`,
                dependsOn: [],
                areaClaim: {
                    x: target.x,
                    y: target.y,
                    z: target.z,
                    radius: 48
                },
                reservations: [],
                status: 'planned',
                result: null,
                steps
            };
        });

        return {
            sessionId: session?.id || null,
            coordinator,
            planVersion: (session?.planVersion || 0) + 1,
            patterns: [],
            summary: `Coordinate ${addressedAgents.length} agents on "${intent?.input || 'shared task'}"`,
            assignments
        };
    }

    normalizeItemName(itemName) {
        return String(itemName || '').trim().toLowerCase().replace(/\s+/g, '_');
    }

    normalizePosition(position = {}) {
        if (!position || typeof position !== 'object') {
            return null;
        }
        const x = Number(position.x);
        const y = Number(position.y);
        const z = Number(position.z);
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
            return null;
        }
        return { x, y, z };
    }

    distance(a, b) {
        const pa = this.normalizePosition(a);
        const pb = this.normalizePosition(b);
        if (!pa || !pb) {
            return null;
        }
        return Math.sqrt((pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2 + (pa.z - pb.z) ** 2);
    }

    getInventoryCount(inventory = [], itemName) {
        const target = this.normalizeItemName(itemName);
        return (inventory || []).reduce((sum, item) => {
            return sum + (this.normalizeItemName(item?.name) === target ? Number(item.count || 0) : 0);
        }, 0);
    }

    isCheapRenewable(itemName) {
        const item = this.normalizeItemName(itemName);
        return CHEAP_RENEWABLE_ITEMS.has(item) ||
            item.includes('log') ||
            item.includes('planks') ||
            item.includes('wood');
    }

    isRareOrProcessed(itemName) {
        const item = this.normalizeItemName(itemName);
        return RARE_OR_PROCESSED_TERMS.some(term => item.includes(term));
    }

    getGatherTarget(itemName) {
        const item = this.normalizeItemName(itemName);
        if (item === 'stick' || item === 'sticks' || item.includes('planks') || item === 'any_planks') {
            return 'log';
        }
        if (item.includes('iron')) return 'iron_ore';
        if (item.includes('gold')) return 'gold_ore';
        if (item.includes('diamond')) return 'diamond_ore';
        if (item.includes('coal')) return 'coal_ore';
        if (item === 'cobblestone') return 'stone';
        if (item === 'cooked_beef') return 'beef';
        if (item === 'cooked_porkchop') return 'porkchop';
        if (item === 'cooked_mutton') return 'mutton';
        if (item === 'cooked_chicken') return 'chicken';
        return item;
    }

    getTeamInventoryRecords(teamContext = {}) {
        const fromSnapshots = Object.values(teamContext.inventorySnapshots || {});
        const fromCapabilities = (teamContext.capabilities || [])
            .filter(record => Array.isArray(record.inventory))
            .map(record => ({
                agent: record.agent,
                inventory: record.inventory,
                position: record.position || null,
                activeTaskCount: Number(record.activeTaskCount || 0),
                currentActionLabel: record.currentActionLabel || null,
                updatedAt: Number(record.updatedAt || 0),
                source: 'capabilities'
            }));

        const byAgent = new Map();
        for (const record of [...fromCapabilities, ...fromSnapshots]) {
            if (!record?.agent) continue;
            const current = byAgent.get(record.agent);
            if (!current || Number(record.updatedAt || 0) >= Number(current.updatedAt || 0)) {
                byAgent.set(record.agent, record);
            }
        }
        return Array.from(byAgent.values());
    }

    getWorldFacts(teamContext = {}) {
        const facts = Array.isArray(teamContext.worldFacts) ? [...teamContext.worldFacts] : [];
        for (const env of teamContext.environmentData || []) {
            for (const search of env?.environment?.recentSearches || []) {
                facts.push({
                    id: `recent_${env.agent}_${search.timestamp || search.updatedAt || 0}`,
                    type: search.blockName || 'location',
                    name: search.blockName || search.notes || 'recent_search',
                    blockName: search.blockName || null,
                    position: { x: search.x, y: search.y, z: search.z },
                    sourceAgent: env.agent,
                    updatedAt: search.timestamp || env.updatedAt || Date.now(),
                    confidence: 0.65
                });
            }
        }
        return facts;
    }

    factMatchesItem(fact, itemName) {
        const item = this.normalizeItemName(itemName);
        const gatherTarget = this.getGatherTarget(item);
        const values = [
            fact?.type,
            fact?.name,
            fact?.blockName,
            fact?.item,
            fact?.resource,
            ...(Array.isArray(fact?.tags) ? fact.tags : [])
        ].map(value => this.normalizeItemName(value)).filter(Boolean);

        if (item === 'stick' || item.includes('planks') || item.includes('log')) {
            return values.some(value =>
                value.includes('forest') ||
                value.includes('tree') ||
                value.includes('log') ||
                value.includes('wood')
            );
        }

        if (item.includes('iron')) {
            return values.some(value => value.includes('iron') || value.includes('cave') || value.includes('ore'));
        }
        if (item.includes('diamond')) {
            return values.some(value => value.includes('diamond') || value.includes('cave') || value.includes('ore'));
        }
        if (item.includes('coal')) {
            return values.some(value => value.includes('coal') || value.includes('cave') || value.includes('ore'));
        }
        if (item === 'stone' || item === 'cobblestone') {
            return values.some(value => value.includes('stone') || value.includes('cave'));
        }
        if (item.includes('cooked') || ['beef', 'porkchop', 'mutton', 'chicken'].includes(item)) {
            return values.some(value => value.includes('animal') || value.includes('farm') || value.includes('furnace') || value.includes(item));
        }

        return values.some(value =>
            value.includes(item) ||
            item.includes(value) ||
            value.includes(gatherTarget)
        );
    }

    findBestWorldFactForItem(itemName, localPosition, teamContext = {}) {
        const local = this.normalizePosition(localPosition);
        const facts = this.getWorldFacts(teamContext)
            .filter(fact => this.factMatchesItem(fact, itemName))
            .map(fact => {
                const factPosition = fact.position || fact.location || fact;
                const distance = local ? this.distance(local, factPosition) : null;
                const stalePenalty = Number(fact.updatedAt || 0) > 0 && Date.now() - Number(fact.updatedAt) > 30 * 60 * 1000 ? 80 : 0;
                const confidenceBonus = Number(fact.confidence || 0.7) * 40;
                const qualityBonus = Number(fact.quality || 0) / 2;
                const cost = (distance === null ? 120 : distance) + stalePenalty - confidenceBonus - qualityBonus;
                return {
                    ...fact,
                    position: this.normalizePosition(factPosition),
                    distance,
                    utilityCost: Math.max(1, cost)
                };
            })
            .filter(fact => fact.position)
            .sort((a, b) => a.utilityCost - b.utilityCost);

        return facts[0] || null;
    }

    rankItemProviders(itemName, count, localPosition, teamContext = {}, options = {}) {
        const required = Math.max(1, Number(count) || 1);
        const local = this.normalizePosition(localPosition);
        const maxAgeMs = Number(options.maxAgeMs || 5 * 60 * 1000);
        const now = Date.now();

        return this.getTeamInventoryRecords(teamContext)
            .filter(record => record.agent && record.agent !== this.agentName)
            .map(record => {
                const available = this.getInventoryCount(record.inventory, itemName);
                const distance = local && record.position ? this.distance(local, record.position) : null;
                const stale = !record.updatedAt || now - Number(record.updatedAt) > maxAgeMs;
                const stalePenalty = stale ? 250 : 0;
                const busyPenalty = Number(record.activeTaskCount || 0) * 75 +
                    (record.currentActionLabel && record.currentActionLabel !== 'Idle' ? 100 : 0);
                const distanceCost = distance === null ? 120 : distance;
                return {
                    ...record,
                    item: this.normalizeItemName(itemName),
                    available,
                    distance,
                    stale,
                    utilityCost: distanceCost + busyPenalty + stalePenalty
                };
            })
            .filter(record => record.available >= required)
            .sort((a, b) => a.utilityCost - b.utilityCost);
    }

    findActiveWorkForItem(itemName, teamContext = {}) {
        const item = this.normalizeItemName(itemName);
        const gatherTarget = this.getGatherTarget(item);
        return (teamContext.workLedger || [])
            .filter(work => {
                if (!work || !['planned', 'claimed', 'active'].includes(work.status)) {
                    return false;
                }
                const workItem = this.normalizeItemName(work.item || work.resource || work.target);
                return workItem === item || workItem === gatherTarget || item.includes(workItem) || workItem.includes(item);
            })
            .sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0))[0] || null;
    }

    findCompletedOutputForItem(itemName, teamContext = {}) {
        const item = this.normalizeItemName(itemName);
        return (teamContext.workLedger || [])
            .filter(work => {
                if (!work || work.status !== 'completed') return false;
                const workItem = this.normalizeItemName(work.item || work.resource || work.target);
                const outputCount = Number(work.outputs?.[item] || 0);
                return workItem === item || outputCount > 0;
            })
            .sort((a, b) => Number(b.completedAt || b.updatedAt || 0) - Number(a.completedAt || a.updatedAt || 0))[0] || null;
    }

    estimateGatherCost(itemName, worldFact, options = {}) {
        const item = this.normalizeItemName(itemName);
        const base = this.isCheapRenewable(item) ? 35 : 120;
        const rarityPenalty = this.isRareOrProcessed(item) ? 120 : 0;
        const distance = worldFact?.distance ?? worldFact?.utilityCost ?? null;
        const unknownPenalty = distance === null ? (this.isCheapRenewable(item) ? 70 : 180) : 0;
        const countPenalty = Math.max(0, Number(options.count || 1) - 1) * (this.isCheapRenewable(item) ? 4 : 18);
        return base + rarityPenalty + (distance || 0) + unknownPenalty + countPenalty;
    }

    chooseMissingItemStrategy({ item, count = 1, localCapabilities = {}, teamContext = {}, reason = '' }) {
        const itemName = this.normalizeItemName(item);
        const localInventory = localCapabilities.inventory || [];
        const localPosition = localCapabilities.position || null;
        const localHave = this.getInventoryCount(localInventory, itemName);
        const bestFact = this.findBestWorldFactForItem(itemName, localPosition, teamContext);
        const providers = this.rankItemProviders(itemName, count, localPosition, teamContext);
        const bestProvider = providers[0] || null;
        const activeWork = this.findActiveWorkForItem(itemName, teamContext);
        const completedWork = this.findCompletedOutputForItem(itemName, teamContext);
        const gatherCost = this.estimateGatherCost(itemName, bestFact, { count });
        const providerCost = bestProvider ? bestProvider.utilityCost : Infinity;
        const cheap = this.isCheapRenewable(itemName);
        const rare = this.isRareOrProcessed(itemName);

        if (localHave >= count) {
            return {
                action: 'use_self_inventory',
                item: itemName,
                count,
                reason: `Already have ${localHave}x ${itemName}.`,
                scores: { localHave, gatherCost, providerCost }
            };
        }

        if (completedWork && !bestProvider) {
            return {
                action: 'reuse_completed_work',
                item: itemName,
                count,
                work: completedWork,
                reason: `${completedWork.agent || completedWork.claimant || 'A teammate'} already completed related ${itemName} work.`,
                scores: { gatherCost, providerCost }
            };
        }

        if (activeWork && (!bestProvider || activeWork.agent !== bestProvider.agent) && !rare) {
            return {
                action: 'wait_for_team_work',
                item: itemName,
                count,
                work: activeWork,
                reason: `Avoiding duplicate ${itemName} work already claimed by ${activeWork.claimant || activeWork.agent || 'a teammate'}.`,
                scores: { gatherCost, providerCost }
            };
        }

        const nearbyCheapResource = cheap && bestFact && Number(bestFact.distance ?? Infinity) <= 96;
        if (nearbyCheapResource && (!bestProvider || providerCost > gatherCost * 1.35)) {
            return {
                action: 'collect_nearby_resource',
                item: itemName,
                count,
                worldFact: bestFact,
                gatherTarget: this.getGatherTarget(itemName),
                reason: `Nearby ${bestFact.name || bestFact.type} is cheaper than asking a teammate for ${itemName}.`,
                scores: { gatherCost, providerCost }
            };
        }

        if (bestProvider && (rare || providerCost + 25 < gatherCost || !bestFact)) {
            return {
                action: 'request_supply',
                item: itemName,
                count,
                provider: bestProvider,
                reason: `${bestProvider.agent} has ${bestProvider.available}x ${itemName} and supply is cheaper than gathering.`,
                scores: { gatherCost, providerCost }
            };
        }

        if (bestFact) {
            return {
                action: nearbyCheapResource ? 'collect_nearby_resource' : 'travel_to_known_fact',
                item: itemName,
                count,
                worldFact: bestFact,
                gatherTarget: this.getGatherTarget(itemName),
                reason: `Using shared world fact ${bestFact.name || bestFact.type} for ${itemName}.`,
                scores: { gatherCost, providerCost }
            };
        }

        if (activeWork) {
            return {
                action: 'wait_for_team_work',
                item: itemName,
                count,
                work: activeWork,
                reason: `Waiting for active teammate work on ${itemName}.`,
                scores: { gatherCost, providerCost }
            };
        }

        return {
            action: 'collect_locally',
            item: itemName,
            count,
            gatherTarget: this.getGatherTarget(itemName),
            reason: reason || `No better team option found for ${itemName}.`,
            scores: { gatherCost, providerCost }
        };
    }

    buildStepsForDecision(decision = {}) {
        const item = decision.item;
        const count = Math.max(1, Number(decision.count || 1));

        switch (decision.action) {
            case 'request_supply':
                return [
                    {
                        stepType: 'request_item',
                        goal: `Request ${count}x ${item} from ${decision.provider.agent}`,
                        item,
                        count,
                        provider: decision.provider.agent,
                        preconditions: [],
                        metadata: {
                            collaborationDecision: decision.action,
                            decisionReason: decision.reason
                        }
                    },
                    {
                        stepType: 'wait_for_supply',
                        goal: `Wait for ${count}x ${item} from ${decision.provider.agent}`,
                        item,
                        count,
                        provider: decision.provider.agent,
                        preconditions: [],
                        metadata: {
                            collaborationDecision: 'wait_for_supply',
                            decisionReason: decision.reason
                        }
                    }
                ];

            case 'wait_for_team_work':
                return [{
                    stepType: 'wait_for_team_work',
                    goal: `Wait for teammate work on ${item}`,
                    item,
                    count,
                    workId: decision.work?.id || null,
                    preconditions: [],
                    metadata: {
                        collaborationDecision: decision.action,
                        decisionReason: decision.reason
                    }
                }];

            case 'travel_to_known_fact': {
                const pos = decision.worldFact?.position;
                if (!pos) return [];
                return [
                    {
                        goal: `Travel to shared ${decision.worldFact.name || decision.worldFact.type} for ${item}`,
                        action_cmd: [`!goToCoordinates(${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}, 8)`],
                        preconditions: [],
                        metadata: {
                            collaborationDecision: decision.action,
                            decisionReason: decision.reason,
                            worldFactId: decision.worldFact.id || null
                        }
                    },
                    {
                        goal: `Collect ${count}x ${decision.gatherTarget || item} using shared location`,
                        action_cmd: [`!collectBlocks("${decision.gatherTarget || item}", ${count})`],
                        preconditions: []
                    }
                ];
            }

            case 'collect_nearby_resource':
                return [{
                    goal: `Collect ${count}x ${decision.gatherTarget || item} near shared ${decision.worldFact?.name || 'resource'}`,
                    action_cmd: [`!collectBlocks("${decision.gatherTarget || item}", ${count})`],
                    preconditions: [],
                    metadata: {
                        collaborationDecision: decision.action,
                        decisionReason: decision.reason,
                        worldFactId: decision.worldFact?.id || null
                    }
                }];

            default:
                return [];
        }
    }

    inferRequestedItemsFromPlan(plan = {}, intentMaterials = {}) {
        const items = new Map();
        for (const [name, count] of Object.entries(intentMaterials || {})) {
            const item = this.normalizeItemName(name);
            if (item) items.set(item, Math.max(Number(count) || 1, items.get(item) || 0));
        }

        for (const step of plan.steps || []) {
            const commands = step.action_cmd || (step.command ? [step.command] : []);
            for (const command of commands) {
                const collectMatch = String(command).match(/!collectBlocks\(["']([^"']+)["']\s*,\s*(\d+)/);
                if (collectMatch) {
                    const item = this.normalizeItemName(collectMatch[1]);
                    items.set(item, Math.max(Number(collectMatch[2]) || 1, items.get(item) || 0));
                }
                const craftMatch = String(command).match(/!craftRecipe\(["']([^"']+)["']\s*,\s*(\d+)/);
                if (craftMatch) {
                    const item = this.normalizeItemName(craftMatch[1]);
                    if (['stick', 'crafting_table', 'furnace'].includes(item) || this.isRareOrProcessed(item)) {
                        items.set(item, Math.max(Number(craftMatch[2]) || 1, items.get(item) || 0));
                    }
                }
                const smeltMatch = String(command).match(/!smeltItem\(["']([^"']+)["']\s*,\s*(\d+)/);
                if (smeltMatch) {
                    const item = this.normalizeItemName(smeltMatch[1]);
                    items.set(item, Math.max(Number(smeltMatch[2]) || 1, items.get(item) || 0));
                }
            }
        }

        return Array.from(items.entries()).map(([item, count]) => ({ item, count }));
    }

    rewritePlanWithUtility(basePlan, { localCapabilities = {}, teamContext = {}, intentMaterials = {} } = {}) {
        if (!basePlan?.steps?.length) {
            return { plan: basePlan, decisions: [] };
        }

        const candidates = this.inferRequestedItemsFromPlan(basePlan, intentMaterials);
        const decisions = candidates
            .map(candidate => this.chooseMissingItemStrategy({
                item: candidate.item,
                count: candidate.count,
                localCapabilities,
                teamContext
            }))
            .filter(decision => !['use_self_inventory', 'collect_locally'].includes(decision.action));

        if (decisions.length === 0) {
            return { plan: basePlan, decisions: [] };
        }

        const prepSteps = [];
        for (const decision of decisions) {
            prepSteps.push(...this.buildStepsForDecision(decision));
        }

        const suppliedItems = new Set(
            decisions
                .filter(decision => ['request_supply', 'reuse_completed_work'].includes(decision.action))
                .map(decision => decision.item)
        );

        const rewrittenSteps = (basePlan.steps || []).map(step => {
            const commands = step.action_cmd || (step.command ? [step.command] : []);
            const producesSuppliedItem = commands.some(command => {
                const craftMatch = String(command).match(/!craftRecipe\(["']([^"']+)["']/);
                const collectMatch = String(command).match(/!collectBlocks\(["']([^"']+)["']/);
                const produced = this.normalizeItemName(craftMatch?.[1] || collectMatch?.[1] || '');
                if (!produced) return false;
                if (suppliedItems.has(produced)) return true;
                return suppliedItems.has('stick') && (produced.includes('log') || produced.includes('planks'));
            });

            if (!producesSuppliedItem) {
                return step;
            }

            return {
                ...step,
                skip: true,
                skipReason: 'Satisfied by implicit team supply decision'
            };
        });

        return {
            plan: {
                ...basePlan,
                reasoning: [
                    basePlan.reasoning,
                    `Implicit collaboration decisions: ${decisions.map(d => `${d.item}:${d.action}`).join(', ')}`
                ].filter(Boolean).join('\n'),
                steps: [...prepSteps, ...rewrittenSteps].map((step, index) => ({
                    ...step,
                    step: index + 1,
                    command: step.command || (step.action_cmd?.[0] ?? null)
                }))
            },
            decisions
        };
    }

    shouldSplitWork({ plan = {}, intent = {}, teamContext = {}, localCapabilities = {} } = {}) {
        const steps = plan.steps || [];
        const teamAgents = this.getTeamInventoryRecords(teamContext)
            .filter(record => record.agent !== this.agentName);
        const independentSteps = steps.filter(step => !step.preconditions || step.preconditions.length === 0);
        const buildLike = /build|house|base|shelter|structure/i.test(`${intent?.type || ''} ${intent?.input || ''} ${plan.target || ''}`);
        const localBusy = Number(localCapabilities.activeTaskCount || 0) > 0;

        return teamAgents.length > 0 && (
            buildLike ||
            steps.length >= 5 ||
            independentSteps.length >= 3 ||
            localBusy
        );
    }

    createImplicitWorkSplit({ plan = {}, intent = {}, teamContext = {}, localCapabilities = {} } = {}) {
        if (!this.shouldSplitWork({ plan, intent, teamContext, localCapabilities })) {
            return [];
        }

        const agents = this.getTeamInventoryRecords(teamContext)
            .filter(record => record.agent !== this.agentName)
            .sort((a, b) => Number(a.activeTaskCount || 0) - Number(b.activeTaskCount || 0));
        if (agents.length === 0) {
            return [];
        }

        const desiredItems = this.inferRequestedItemsFromPlan(plan, {});
        const useful = desiredItems.filter(item =>
            ['log', 'stone', 'cobblestone', 'coal_ore', 'iron_ore'].some(resource => item.item.includes(resource) || resource.includes(item.item))
        );

        const fallback = [
            { item: 'log', count: 16, kind: 'gather' },
            { item: 'stone', count: 32, kind: 'gather' },
            { item: 'build_site', count: 1, kind: 'scout' }
        ];

        const workSeeds = [...useful];
        for (const fallbackWork of fallback) {
            if (workSeeds.length >= agents.length) break;
            if (!workSeeds.some(work => work.item === fallbackWork.item)) {
                workSeeds.push(fallbackWork);
            }
        }

        return workSeeds.slice(0, agents.length).map((work, index) => ({
            kind: work.kind || 'gather',
            item: work.item,
            count: work.count || 1,
            agent: agents[index]?.agent,
            status: 'planned',
            summary: `Implicitly split ${work.kind || 'gather'} work for ${work.item}`,
            metadata: {
                intent: intent?.input || plan.target || 'shared task',
                reason: 'heavy_workload_implicit_split'
            }
        }));
    }

    scoreCandidateSite(candidate, context = {}) {
        const position = candidate?.position || candidate || {};
        const nearbyBlocks = context.nearbyBlocks || [];
        const distance = Math.sqrt(
            ((position.x || 0) - (context.origin?.x || 0)) ** 2 +
            ((position.z || 0) - (context.origin?.z || 0)) ** 2
        );

        let score = 50;
        if (nearbyBlocks.includes('trees')) score += 10;
        if (nearbyBlocks.includes('stone_area')) score += 8;
        if (nearbyBlocks.includes('crafting_table')) score += 4;
        if (nearbyBlocks.includes('furnace')) score += 4;
        if (distance >= 48 && distance <= 192) score += 12;
        if (Math.abs(position.y || 64) <= 90) score += 6;

        return Math.max(1, Math.min(100, Math.round(score)));
    }

    chooseBestCandidate(candidateSites = []) {
        return [...candidateSites]
            .sort((a, b) => {
                if ((b.score || 0) !== (a.score || 0)) {
                    return (b.score || 0) - (a.score || 0);
                }
                return (b.updatedAt || 0) - (a.updatedAt || 0);
            })[0] || null;
    }
}
