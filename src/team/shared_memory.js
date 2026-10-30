import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

/**
 * Lightweight shared task ledger for multiple agents.
 * Stores JSON on disk so separate processes can read/write.
 */
export class SharedMemory {
    constructor(options = {}) {
        this.agentName = options.agentName || 'unknown_agent';
        this.statePath = options.path || join(process.cwd(), 'bots', '_shared', 'team_state.json');
        this.lastBroadcast = 0;
        this.broadcastCooldown = 5000; // 5 seconds to prevent broadcast storms
        mkdirSync(dirname(this.statePath), { recursive: true });
        if (!existsSync(this.statePath)) {
            writeFileSync(this.statePath, JSON.stringify(this._initialState(), null, 2), 'utf8');
        }
    }

    _initialState() {
        return {
            tasks: [],
            intents: [],
            capabilities: {},
            environmentData: {},
            benchmarkStatuses: {},
            latestUserDirective: null,
            completions: [],
            areaClaims: [],
            reservations: [],
            collaborationSessions: [],
            worldFacts: [],
            inventorySnapshots: {},
            workLedger: [],
            supplyRequests: [],
            collaborationMetrics: []
        };
    }

    _normalizeState(state = {}) {
        const normalized = {
            ...this._initialState(),
            ...state
        };
        normalized.tasks = Array.isArray(normalized.tasks) ? normalized.tasks : [];
        normalized.intents = Array.isArray(normalized.intents) ? normalized.intents : [];
        normalized.completions = Array.isArray(normalized.completions) ? normalized.completions : [];
        normalized.areaClaims = Array.isArray(normalized.areaClaims) ? normalized.areaClaims : [];
        normalized.reservations = Array.isArray(normalized.reservations) ? normalized.reservations : [];
        normalized.collaborationSessions = Array.isArray(normalized.collaborationSessions) ? normalized.collaborationSessions : [];
        normalized.worldFacts = Array.isArray(normalized.worldFacts) ? normalized.worldFacts : [];
        normalized.workLedger = Array.isArray(normalized.workLedger) ? normalized.workLedger : [];
        normalized.supplyRequests = Array.isArray(normalized.supplyRequests) ? normalized.supplyRequests : [];
        normalized.collaborationMetrics = Array.isArray(normalized.collaborationMetrics) ? normalized.collaborationMetrics : [];
        normalized.capabilities = normalized.capabilities && typeof normalized.capabilities === 'object' ? normalized.capabilities : {};
        normalized.inventorySnapshots = normalized.inventorySnapshots && typeof normalized.inventorySnapshots === 'object' ? normalized.inventorySnapshots : {};
        normalized.environmentData = normalized.environmentData && typeof normalized.environmentData === 'object' ? normalized.environmentData : {};
        normalized.benchmarkStatuses = normalized.benchmarkStatuses && typeof normalized.benchmarkStatuses === 'object' ? normalized.benchmarkStatuses : {};
        normalized.latestUserDirective = normalized.latestUserDirective && typeof normalized.latestUserDirective === 'object'
            ? normalized.latestUserDirective
            : null;
        return normalized;
    }

    /**
     * Analyze and filter intent data to ensure only useful information is broadcast
     * Filters out redundant info and enriches with useful environmental context
     */
    analyzeAndFilterIntent(intentData, botContext = null) {
        if (!intentData) return null;

        const analyzed = { ...intentData };
        const usefulInfo = {};

        // Only broadcast if we have meaningful information
        const hasUsefulData =
            intentData.type ||
            intentData.target ||
            (intentData.materials && Object.keys(intentData.materials).length > 0);

        if (!hasUsefulData) {
            console.warn('[SharedMemory] Skipping broadcast - no useful intent data');
            return null;
        }

        // Enrich with useful environmental information if available
        if (botContext) {
            usefulInfo.environment = this.extractUsefulEnvironmentInfo(botContext);
        }

        // Filter out redundant or low-value information
        if (analyzed.steps && analyzed.steps.length > 10) {
            analyzed.steps = analyzed.steps.slice(0, 10); // Keep only first 10 steps
        }

        return { ...analyzed, usefulInfo };
    }

    /**
     * Extract useful environmental information (biome, resources, etc.)
     */
    extractUsefulEnvironmentInfo(botContext) {
        const info = {};

        // Biome information
        if (botContext.biome) {
            info.biome = botContext.biome;
        }

        // Nearby resources
        if (botContext.nearbyResources) {
            info.resources = this.filterUsefulResources(botContext.nearbyResources);
        }

        // Known locations (mines, forests, stone deposits, etc.)
        if (botContext.knownLocations) {
            info.locations = this.filterUsefulLocations(botContext.knownLocations);
        }

        // Position for spatial awareness
        if (botContext.position) {
            info.position = {
                x: Math.round(botContext.position.x),
                y: Math.round(botContext.position.y),
                z: Math.round(botContext.position.z)
            };
        }

        // Time of day for activity coordination
        if (botContext.timeOfDay) {
            info.timeOfDay = botContext.timeOfDay;
        }

        return info;
    }

    /**
     * Filter to only useful resources (wood, stone, ores, etc.)
     */
    filterUsefulResources(resources) {
        const usefulTypes = [
            'log', 'planks', 'stick',
            'stone', 'cobblestone',
            'iron_ore', 'gold_ore', 'coal_ore', 'diamond_ore', 'copper_ore',
            'raw_iron', 'raw_gold', 'raw_copper'
        ];

        if (!resources || !Array.isArray(resources)) return [];

        return resources.filter(r => {
            const name = typeof r === 'string' ? r : r.name;
            return usefulTypes.some(useful =>
                name && name.toLowerCase().includes(useful.toLowerCase())
            );
        });
    }

    /**
     * Filter to only useful locations (mines, forests, caves, etc.)
     */
    filterUsefulLocations(locations) {
        const usefulTypes = ['mine', 'forest', 'cave', 'ore', 'tree', 'stone', 'house'];

        if (!locations || !Array.isArray(locations)) return [];

        return locations.filter(loc => {
            const name = (loc.name || loc.type || '').toLowerCase();
            return usefulTypes.some(useful => name.includes(useful));
        }).map(loc => ({
            type: loc.type || 'unknown',
            name: loc.name,
            x: Math.round(loc.x),
            y: Math.round(loc.y),
            z: Math.round(loc.z)
        }));
    }

    /**
     * Check if we should broadcast (prevents broadcast storms)
     */
    shouldBroadcast() {
        const now = Date.now();
        if (now - this.lastBroadcast > this.broadcastCooldown) {
            this.lastBroadcast = now;
            return true;
        }
        return false;
    }

    /**
     * Advertise useful environmental information to the team
     */
    advertiseEnvironment(environmentInfo) {
        const state = this._load();
        state.environmentData = state.environmentData || {};

        state.environmentData[this.agentName] = {
            agent: this.agentName,
            environment: environmentInfo,
            updatedAt: Date.now()
        };

        // Keep only recent environment data (last 5 minutes)
        const cutoff = Date.now() - 5 * 60 * 1000;
        for (const agent of Object.keys(state.environmentData)) {
            if (state.environmentData[agent].updatedAt < cutoff) {
                delete state.environmentData[agent];
            }
        }

        this._save(state);
    }

    /**
     * Get team environment data (useful shared locations, resources, etc.)
     */
    getTeamEnvironment(excludeAgent = this.agentName) {
        const state = this._load();
        const environmentData = [];

        for (const [agent, data] of Object.entries(state.environmentData || {})) {
            if (agent !== excludeAgent && data.updatedAt > Date.now() - 5 * 60 * 1000) {
                environmentData.push(data);
            }
        }

        return environmentData;
    }

    _load() {
        try {
            const raw = readFileSync(this.statePath, 'utf8');
            return this._normalizeState(JSON.parse(raw));
        } catch (err) {
            console.warn('SharedMemory load failed, resetting state:', err);
            return this._initialState();
        }
    }

    _save(state) {
        const tempPath = `${this.statePath}.tmp.${process.pid}.${Date.now()}.${Math.floor(Math.random() * 100000)}`;
        writeFileSync(tempPath, JSON.stringify(this._normalizeState(state), null, 2), 'utf8');
        renameSync(tempPath, this.statePath);
    }

    _normalizeItemName(itemName) {
        return String(itemName || '').trim().toLowerCase().replace(/\s+/g, '_');
    }

    _normalizePosition(position = {}) {
        if (!position || typeof position !== 'object') {
            return null;
        }

        const x = Number(position.x);
        const y = Number(position.y);
        const z = Number(position.z);
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
            return null;
        }

        return {
            x: Math.round(x),
            y: Math.round(y),
            z: Math.round(z)
        };
    }

    _normalizeInventory(inventory = []) {
        const counts = new Map();
        const items = Array.isArray(inventory) ? inventory : [];

        for (const item of items) {
            const name = this._normalizeItemName(item?.name || item?.item || item?.type);
            const count = Number(item?.count ?? item?.quantity ?? 0);
            if (!name || !Number.isFinite(count) || count <= 0) {
                continue;
            }
            counts.set(name, (counts.get(name) || 0) + count);
        }

        return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
    }

    _getInventoryCount(inventory = [], itemName) {
        const target = this._normalizeItemName(itemName);
        return (inventory || []).reduce((sum, item) => {
            return sum + (this._normalizeItemName(item?.name) === target ? Number(item.count || 0) : 0);
        }, 0);
    }

    _isFresh(updatedAt, maxAgeMs) {
        if (!maxAgeMs) return true;
        return Number(updatedAt || 0) >= Date.now() - maxAgeMs;
    }

    _distanceBetweenPositions(a, b) {
        const pa = this._normalizePosition(a);
        const pb = this._normalizePosition(b);
        if (!pa || !pb) {
            return null;
        }
        return this.distance(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
    }

    _factMatchesResource(fact, resourceName) {
        const resource = this._normalizeItemName(resourceName);
        if (!resource) {
            return true;
        }

        const values = [
            fact.type,
            fact.name,
            fact.blockName,
            fact.item,
            fact.resource,
            ...(Array.isArray(fact.tags) ? fact.tags : [])
        ].map(value => this._normalizeItemName(value)).filter(Boolean);

        if (resource === 'stick' || resource.includes('planks')) {
            return values.some(value =>
                value.includes('forest') ||
                value.includes('tree') ||
                value.includes('log') ||
                value.includes('wood')
            );
        }

        if (resource.includes('iron')) {
            return values.some(value => value.includes('iron') || value.includes('cave') || value.includes('ore'));
        }

        if (resource.includes('diamond')) {
            return values.some(value => value.includes('diamond') || value.includes('cave') || value.includes('ore'));
        }

        if (resource.includes('coal')) {
            return values.some(value => value.includes('coal') || value.includes('cave') || value.includes('ore'));
        }

        if (resource.includes('cobblestone') || resource === 'stone') {
            return values.some(value => value.includes('stone') || value.includes('cave'));
        }

        return values.some(value => value.includes(resource) || resource.includes(value));
    }

    _cleanupTransientCollaborationState(state, now = Date.now()) {
        state.workLedger = (state.workLedger || []).filter(item => {
            if (!item) return false;
            if (item.expiresAt && item.expiresAt <= now) return false;
            return true;
        });

        state.supplyRequests = (state.supplyRequests || []).filter(request => {
            if (!request) return false;
            if (request.expiresAt && request.expiresAt <= now &&
                !['completed', 'cancelled', 'failed'].includes(request.status)) {
                request.status = 'expired';
                request.updatedAt = now;
            }
            return true;
        }).slice(-200);

        state.collaborationMetrics = (state.collaborationMetrics || []).slice(-500);
        return state;
    }

    /**
     * Persist a useful world fact such as a forest, cave, ore vein, water source,
     * workstation, chest, or build-site candidate.
     */
    recordWorldFact(fact = {}) {
        const position = this._normalizePosition(fact.position || fact.location || fact);
        const type = this._normalizeItemName(fact.type || fact.kind || 'location');
        const name = String(fact.name || fact.blockName || fact.resource || type || 'location').trim();
        const now = Date.now();

        if (!position || !name) {
            return null;
        }

        const state = this._load();
        state.worldFacts = state.worldFacts || [];

        const namespace = fact.namespace || 'default';
        const sourceAgent = fact.agent || fact.sourceAgent || this.agentName;
        const existing = state.worldFacts.find(item => {
            if (!item) return false;
            if ((item.namespace || 'default') !== namespace) return false;
            if (this._normalizeItemName(item.type) !== type) return false;
            if (this._normalizeItemName(item.name) !== this._normalizeItemName(name)) return false;
            const distance = this._distanceBetweenPositions(item.position || item, position);
            return distance !== null && distance <= Number(fact.mergeRadius || 12);
        });

        const record = {
            id: existing?.id || `fact_${now}_${Math.floor(Math.random() * 1000)}`,
            namespace,
            type,
            name,
            blockName: fact.blockName || null,
            item: this._normalizeItemName(fact.item || fact.resource || fact.blockName || ''),
            resource: this._normalizeItemName(fact.resource || fact.item || fact.blockName || ''),
            tags: Array.isArray(fact.tags) ? fact.tags.map(tag => this._normalizeItemName(tag)).filter(Boolean) : [],
            position,
            confidence: Number.isFinite(Number(fact.confidence)) ? Number(fact.confidence) : 0.75,
            quality: Number.isFinite(Number(fact.quality)) ? Number(fact.quality) : null,
            sourceAgent,
            notes: fact.notes || '',
            metadata: fact.metadata || {},
            createdAt: existing?.createdAt || now,
            updatedAt: now,
            expiresAt: fact.expiresAt || null
        };

        if (existing) {
            Object.assign(existing, record);
        } else {
            state.worldFacts.push(record);
        }

        state.worldFacts = state.worldFacts
            .filter(item => !item.expiresAt || item.expiresAt > now)
            .slice(-500);

        this._save(state);
        return record;
    }

    queryWorldFacts(query = {}) {
        const state = this._load();
        const now = Date.now();
        const namespace = query.namespace || null;
        const near = this._normalizePosition(query.near || query.position || null);
        const maxDistance = Number(query.maxDistance || Infinity);
        const maxAgeMs = query.maxAgeMs || null;
        const type = query.type ? this._normalizeItemName(query.type) : null;
        const resource = query.resource || query.item || query.blockName || null;

        return (state.worldFacts || [])
            .filter(fact => {
                if (!fact) return false;
                if (fact.expiresAt && fact.expiresAt <= now) return false;
                if (namespace && (fact.namespace || 'default') !== namespace) return false;
                if (type && this._normalizeItemName(fact.type) !== type) return false;
                if (maxAgeMs && !this._isFresh(fact.updatedAt, maxAgeMs)) return false;
                if (resource && !this._factMatchesResource(fact, resource)) return false;
                if (near) {
                    const distance = this._distanceBetweenPositions(fact.position || fact, near);
                    if (distance === null || distance > maxDistance) return false;
                }
                return true;
            })
            .map(fact => {
                const distance = near ? this._distanceBetweenPositions(fact.position || fact, near) : null;
                return {
                    ...fact,
                    distance,
                    score: (Number(fact.confidence || 0.75) * 100) -
                        (distance === null ? 0 : distance / 4) +
                        (Number(fact.quality || 0) / 2)
                };
            })
            .sort((a, b) => {
                if ((b.score || 0) !== (a.score || 0)) {
                    return (b.score || 0) - (a.score || 0);
                }
                return (b.updatedAt || 0) - (a.updatedAt || 0);
            });
    }

    recordInventorySnapshot(snapshot = {}, agentName = this.agentName) {
        const state = this._load();
        const now = Date.now();
        const agent = agentName || snapshot.agent || this.agentName;
        const inventory = this._normalizeInventory(snapshot.inventory || snapshot.items || []);

        state.inventorySnapshots = state.inventorySnapshots || {};
        state.inventorySnapshots[agent] = {
            agent,
            inventory,
            position: this._normalizePosition(snapshot.position || snapshot.location) || null,
            activeTaskCount: Number(snapshot.activeTaskCount || 0),
            currentActionLabel: snapshot.currentActionLabel || null,
            workload: snapshot.workload || null,
            status: snapshot.status || 'available',
            namespace: snapshot.namespace || 'default',
            updatedAt: Number(snapshot.updatedAt || now),
            metadata: snapshot.metadata || {}
        };

        this._save(state);
        return state.inventorySnapshots[agent];
    }

    getTeamInventory(options = {}) {
        const state = this._load();
        const excludeAgent = options.excludeAgent === undefined ? this.agentName : options.excludeAgent;
        const maxAgeMs = options.maxAgeMs || 5 * 60 * 1000;
        const includeStale = Boolean(options.includeStale);
        const namespace = options.namespace || null;

        return Object.values(state.inventorySnapshots || {})
            .filter(record => {
                if (!record) return false;
                if (excludeAgent && record.agent === excludeAgent) return false;
                if (namespace && (record.namespace || 'default') !== namespace) return false;
                if (!includeStale && !this._isFresh(record.updatedAt, maxAgeMs)) return false;
                return true;
            })
            .map(record => ({
                ...record,
                stale: !this._isFresh(record.updatedAt, maxAgeMs)
            }));
    }

    findItemProviders(itemName, count = 1, options = {}) {
        const required = Math.max(1, Number(count) || 1);
        const requesterPosition = this._normalizePosition(options.requesterPosition || options.position || null);
        const providers = this.getTeamInventory({
            excludeAgent: options.excludeAgent === undefined ? this.agentName : options.excludeAgent,
            includeStale: options.includeStale,
            maxAgeMs: options.maxAgeMs,
            namespace: options.namespace
        });

        return providers
            .map(record => {
                const available = this._getInventoryCount(record.inventory, itemName);
                const distance = requesterPosition && record.position
                    ? this._distanceBetweenPositions(requesterPosition, record.position)
                    : null;
                const stalePenalty = record.stale ? 250 : 0;
                const busyPenalty = Number(record.activeTaskCount || 0) * 75 +
                    (record.currentActionLabel && record.currentActionLabel !== 'Idle' ? 100 : 0);
                const distanceCost = distance === null ? 120 : distance;
                return {
                    ...record,
                    item: this._normalizeItemName(itemName),
                    available,
                    distance,
                    utilityCost: distanceCost + busyPenalty + stalePenalty
                };
            })
            .filter(record => record.available >= required)
            .sort((a, b) => a.utilityCost - b.utilityCost);
    }

    createWorkItem(work = {}) {
        const state = this._cleanupTransientCollaborationState(this._load());
        const now = Date.now();
        const namespace = work.namespace || 'default';
        const item = this._normalizeItemName(work.item || work.resource || work.target || '');
        const kind = this._normalizeItemName(work.kind || work.type || 'work');
        const position = this._normalizePosition(work.position || work.location || null);

        const duplicate = (state.workLedger || []).find(entry => {
            if (!entry) return false;
            if ((entry.namespace || 'default') !== namespace) return false;
            if (!['planned', 'claimed', 'active'].includes(entry.status)) return false;
            if (item && this._normalizeItemName(entry.item) !== item) return false;
            if (kind && this._normalizeItemName(entry.kind) !== kind) return false;
            if (!position || !entry.position) return true;
            const distance = this._distanceBetweenPositions(entry.position, position);
            return distance !== null && distance <= Number(work.mergeRadius || 48);
        });

        if (duplicate) {
            return { ...duplicate, duplicate: true };
        }

        const record = {
            id: `work_${now}_${Math.floor(Math.random() * 1000)}`,
            namespace,
            kind,
            item,
            count: Number(work.count || 1),
            agent: work.agent || this.agentName,
            claimant: work.claimant || null,
            status: work.status || 'planned',
            position,
            summary: work.summary || '',
            createdAt: now,
            updatedAt: now,
            expiresAt: work.expiresAt || now + Number(work.duration || 10 * 60 * 1000),
            metadata: work.metadata || {}
        };

        state.workLedger.push(record);
        this._save(state);
        return record;
    }

    claimWorkItem(workId, claimant = this.agentName, extra = {}) {
        const state = this._cleanupTransientCollaborationState(this._load());
        const work = (state.workLedger || []).find(entry => entry.id === workId);
        if (!work) return null;
        if (work.claimant && work.claimant !== claimant && ['claimed', 'active'].includes(work.status)) {
            return { ...work, conflict: true };
        }

        work.claimant = claimant;
        work.status = extra.status || 'claimed';
        work.updatedAt = Date.now();
        Object.assign(work.metadata, extra.metadata || {});
        this._save(state);
        return work;
    }

    completeWorkItem(workId, result = {}) {
        const state = this._cleanupTransientCollaborationState(this._load());
        const work = (state.workLedger || []).find(entry => entry.id === workId);
        if (!work) return null;

        work.status = result.status || 'completed';
        work.completedAt = Date.now();
        work.updatedAt = work.completedAt;
        work.outputs = result.outputs || {};
        work.result = result.result || null;
        this._save(state);
        return work;
    }

    findDuplicateWork(query = {}) {
        const state = this._cleanupTransientCollaborationState(this._load());
        const namespace = query.namespace || null;
        const item = this._normalizeItemName(query.item || query.resource || query.target || '');
        const kind = query.kind || query.type ? this._normalizeItemName(query.kind || query.type) : null;
        const statuses = query.statuses || ['planned', 'claimed', 'active'];

        return (state.workLedger || []).filter(entry => {
            if (!entry) return false;
            if (namespace && (entry.namespace || 'default') !== namespace) return false;
            if (item && this._normalizeItemName(entry.item) !== item) return false;
            if (kind && this._normalizeItemName(entry.kind) !== kind) return false;
            return statuses.includes(entry.status);
        });
    }

    createSupplyRequest(request = {}) {
        const state = this._cleanupTransientCollaborationState(this._load());
        const now = Date.now();
        const item = this._normalizeItemName(request.item || request.itemName);
        const count = Math.max(1, Number(request.count || 1));
        const requester = request.requester || this.agentName;
        const provider = request.provider || null;
        const namespace = request.namespace || 'default';

        if (!item) {
            return null;
        }

        const existing = (state.supplyRequests || []).find(entry =>
            entry &&
            (entry.namespace || 'default') === namespace &&
            entry.requester === requester &&
            entry.provider === provider &&
            entry.item === item &&
            ['pending', 'claimed', 'in_progress'].includes(entry.status)
        );

        if (existing) {
            return existing;
        }

        const record = {
            id: `supply_${now}_${Math.floor(Math.random() * 1000)}`,
            namespace,
            requester,
            provider,
            item,
            count,
            status: request.status || 'pending',
            taskId: request.taskId || null,
            reason: request.reason || '',
            requesterPosition: this._normalizePosition(request.requesterPosition || request.position) || null,
            providerPosition: this._normalizePosition(request.providerPosition) || null,
            createdAt: now,
            updatedAt: now,
            expiresAt: request.expiresAt || now + Number(request.duration || 5 * 60 * 1000),
            metadata: request.metadata || {}
        };

        state.supplyRequests.push(record);
        this._save(state);
        return record;
    }

    claimSupplyRequest(requestId, provider = this.agentName, extra = {}) {
        const state = this._cleanupTransientCollaborationState(this._load());
        const request = (state.supplyRequests || []).find(entry => entry.id === requestId);
        if (!request) return null;
        if (request.provider && request.provider !== provider && request.status !== 'pending') {
            return { ...request, conflict: true };
        }

        request.provider = provider;
        request.status = extra.status || 'claimed';
        request.providerPosition = this._normalizePosition(extra.providerPosition || request.providerPosition) || request.providerPosition;
        request.updatedAt = Date.now();
        Object.assign(request.metadata, extra.metadata || {});
        this._save(state);
        return request;
    }

    completeSupplyRequest(requestId, result = {}) {
        const state = this._cleanupTransientCollaborationState(this._load());
        const request = (state.supplyRequests || []).find(entry => entry.id === requestId);
        if (!request) return null;

        request.status = result.status || 'completed';
        request.completedAt = Date.now();
        request.updatedAt = request.completedAt;
        request.result = result.result || null;
        request.deliveredCount = Number(result.deliveredCount || request.count || 0);
        this._save(state);
        return request;
    }

    getSupplyRequests(query = {}) {
        const state = this._cleanupTransientCollaborationState(this._load());
        const statuses = query.statuses || null;
        const item = query.item ? this._normalizeItemName(query.item) : null;
        const namespace = query.namespace || null;

        return (state.supplyRequests || []).filter(request => {
            if (!request) return false;
            if (namespace && (request.namespace || 'default') !== namespace) return false;
            if (item && request.item !== item) return false;
            if (query.requester && request.requester !== query.requester) return false;
            if (query.provider && request.provider !== query.provider) return false;
            if (statuses && !statuses.includes(request.status)) return false;
            return true;
        });
    }

    recordCollaborationMetric(metric = {}) {
        const state = this._load();
        const record = {
            id: `metric_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            agent: metric.agent || this.agentName,
            kind: metric.kind || 'decision',
            scenarioId: metric.scenarioId || null,
            decision: metric.decision || null,
            item: metric.item || null,
            reason: metric.reason || '',
            createdAt: Date.now(),
            metadata: metric.metadata || {}
        };
        state.collaborationMetrics = state.collaborationMetrics || [];
        state.collaborationMetrics.push(record);
        state.collaborationMetrics = state.collaborationMetrics.slice(-500);
        this._save(state);
        return record;
    }

    listActive({ excludeAgent } = {}) {
        const state = this._load();
        return (state.tasks || []).filter(t => {
            const active = t.status === 'planning' || t.status === 'in_progress';
            const notExcluded = !excludeAgent || t.agent !== excludeAgent;
            return active && notExcluded;
        });
    }

    claimTask({ agent, intent, summary, status = 'planning' }) {
        const state = this._load();
        const now = new Date().toISOString();
        const taskSummary = (summary || intent?.input || intent?.type || '').slice(0, 120);

        // Avoid duplicate entries for the same agent + same summary if already active
        const existing = (state.tasks || []).find(
            t => t.agent === agent && t.summary === taskSummary && (t.status === 'planning' || t.status === 'in_progress')
        );
        if (existing) {
            return existing;
        }

        const task = {
            id: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            agent: agent || this.agentName,
            intent: intent || {},
            summary: taskSummary,
            status,
            createdAt: now,
            updatedAt: now
        };
        state.tasks = state.tasks || [];
        state.tasks.push(task);
        this._save(state);
        return task;
    }

    updateStatus(id, status, extra = {}) {
        const state = this._load();
        const task = (state.tasks || []).find(t => t.id === id);
        if (!task) return null;
        task.status = status;
        task.updatedAt = new Date().toISOString();
        Object.assign(task, extra);
        this._save(state);
        return task;
    }

    completeTask(id, result) {
        return this.updateStatus(id, 'done', { result });
    }

    /**
     * Broadcast intent when starting a new task
     * Analyzes and filters intent to ensure only useful information is shared
     */
    broadcastIntent(intentData, botContext = null) {
        // Check broadcast cooldown first
        if (!this.shouldBroadcast()) {
            console.warn('[SharedMemory] Broadcast skipped - cooldown active');
            return null;
        }

        // Analyze and filter the intent data before broadcasting
        const analyzedData = this.analyzeAndFilterIntent(intentData, botContext);
        if (!analyzedData) {
            return null;
        }

        const state = this._load();
        state.intents = state.intents || [];

        // Remove old intents from this agent
        state.intents = state.intents.filter(i => i.agent !== this.agentName);

        // Add new intent with analyzed, useful information
        state.intents.push({
            id: `intent_${Date.now()}`,
            agent: this.agentName,
            type: analyzedData.type,           // CRAFT, COLLECT, BUILD, EXPLORE
            target: analyzedData.target,       // iron_sword, house, etc.
            materials: analyzedData.materials, // { iron_ingot: 3, stick: 2 }
            steps: analyzedData.steps,         // Outline of planned steps
            status: analyzedData.status || 'planning', // planning | active | stalled
            priority: analyzedData.priority || 'normal',
            location: analyzedData.location,   // { x, y, z }
            timestamp: Date.now(),
            estimatedDuration: analyzedData.estimatedDuration,
            usefulInfo: analyzedData.usefulInfo // Enriched environmental data
        });

        // Keep only recent intents (last 10 minutes)
        const cutoff = Date.now() - 10 * 60 * 1000;
        state.intents = state.intents.filter(i => i.timestamp > cutoff);

        this._save(state);
        console.log(`[SharedMemory] Broadcasted useful intent: ${analyzedData.type || 'unknown'} - ${analyzedData.target || 'unknown'}`);
        return state.intents[state.intents.length - 1];
    }

    /**
     * Get all active intents from other agents
     */
    getOtherIntents(excludeAgent = this.agentName) {
        const state = this._load();
        const cutoff = Date.now() - 5 * 60 * 1000; // 5 min stale threshold

        return (state.intents || [])
            .filter(i => i.agent !== excludeAgent && i.timestamp > cutoff);
    }

    /**
     * Claim a work area to prevent interference
     */
    claimArea(x, y, z, radius, taskId, duration = 300000) {
        const state = this._load();
        state.areaClaims = state.areaClaims || [];

        // Remove expired claims
        const now = Date.now();
        state.areaClaims = state.areaClaims.filter(c => c.expiresAt > now);

        // Check for conflicts
        const conflict = state.areaClaims.find(c =>
            c.agent !== this.agentName &&
            this.distance(c.x, c.y, c.z, x, y, z) < (c.radius + radius)
        );

        if (conflict) {
            return { success: false, conflict };
        }

        // Add claim
        state.areaClaims.push({
            agent: this.agentName,
            taskId,
            x, y, z, radius,
            claimedAt: now,
            expiresAt: now + duration
        });

        this._save(state);
        return { success: true };
    }

    /**
     * Reserve resources to prevent duplicate gathering
     */
    reserveResource(itemName, count, taskId) {
        const state = this._load();
        state.reservations = state.reservations || [];

        // Remove expired reservations
        const now = Date.now();
        state.reservations = state.reservations.filter(r => r.expiresAt > now);

        // Check current total reserved
        const currentlyReserved = state.reservations
            .filter(r => r.item === itemName)
            .reduce((sum, r) => sum + r.count, 0);

        state.reservations.push({
            agent: this.agentName,
            taskId,
            item: itemName,
            count,
            reservedAt: now,
            expiresAt: now + 5 * 60 * 1000 // 5 min timeout
        });

        this._save(state);
        return { reserved: count, totalReserved: currentlyReserved + count };
    }

    /**
     * Advertise capabilities for other agents
     */
    advertiseCapability(capabilities, extras = {}) {
        const state = this._load();
        state.capabilities = state.capabilities || {};
        const now = Date.now();

        state.capabilities[this.agentName] = {
            agent: this.agentName,
            capabilities: capabilities.map(c => ({
                name: c.name,        // e.g., "smelting", "crafting_tier_2"
                available: c.available,
                location: c.location,
                updatedAt: now
            })),
            inventory: extras.inventory || [],
            currentActionLabel: extras.currentActionLabel || null,
            activeTaskCount: Number(extras.activeTaskCount) || 0,
            nearbyBlocks: extras.nearbyBlocks || [],
            position: extras.position || null,
            biome: extras.biome || null,
            recentSearches: extras.recentSearches || [],
            lastObservation: extras.lastObservation || null,
            updatedAt: now
        };

        this._save(state);
    }

    /**
     * Get capabilities of other agents
     */
    getTeamCapabilities(excludeAgent = this.agentName) {
        const state = this._load();
        const capabilities = [];

        for (const [agent, data] of Object.entries(state.capabilities || {})) {
            if (agent !== excludeAgent && data.updatedAt > Date.now() - 5 * 60 * 1000) {
                capabilities.push(data);
            }
        }

        return capabilities;
    }

    getCapability(agent = this.agentName) {
        const state = this._load();
        return state.capabilities?.[agent] || null;
    }

    updateBenchmarkStatus(status, details = {}) {
        const state = this._load();
        state.benchmarkStatuses = state.benchmarkStatuses || {};

        state.benchmarkStatuses[this.agentName] = {
            agent: this.agentName,
            status,
            updatedAt: Date.now(),
            ...details
        };

        const cutoff = Date.now() - 30 * 60 * 1000;
        for (const [agent, data] of Object.entries(state.benchmarkStatuses)) {
            if (!data || data.updatedAt < cutoff) {
                delete state.benchmarkStatuses[agent];
            }
        }

        this._save(state);
        return state.benchmarkStatuses[this.agentName];
    }

    getBenchmarkStatuses(excludeAgent = this.agentName) {
        const state = this._load();
        const cutoff = Date.now() - 30 * 60 * 1000;

        return Object.values(state.benchmarkStatuses || {})
            .filter(entry => entry?.agent !== excludeAgent && entry?.updatedAt >= cutoff);
    }

    updateLatestUserDirective(directive = {}) {
        const prompt = String(directive.prompt || '').trim();
        if (!prompt) {
            return null;
        }

        const state = this._load();
        const nextDirective = {
            player: directive.player || 'player',
            prompt,
            intentType: directive.intentType || 'GENERAL',
            intentSubtype: directive.intentSubtype || 'unknown',
            updatedAt: Number(directive.updatedAt) || Date.now(),
            sourceAgent: directive.sourceAgent || this.agentName
        };

        const current = state.latestUserDirective || null;
        if (current && Number(current.updatedAt || 0) > nextDirective.updatedAt) {
            return current;
        }

        state.latestUserDirective = nextDirective;
        this._save(state);
        return nextDirective;
    }

    getLatestUserDirective() {
        const state = this._load();
        return state.latestUserDirective || null;
    }

    findOrCreateCollaborationSession({
        player,
        request,
        addressedAgents = [],
        coordinator = null,
        metadata = {}
    }) {
        const state = this._load();
        const normalizedRequest = String(request || '').trim().toLowerCase();
        const normalizedPlayer = String(player || '').trim().toLowerCase();
        const now = Date.now();

        const existing = state.collaborationSessions.find(session => {
            if (!session) return false;
            if (session.status === 'completed' || session.status === 'aborted') return false;
            if (now - (session.createdAt || 0) > 10 * 60 * 1000) return false;
            return String(session.player || '').trim().toLowerCase() === normalizedPlayer &&
                String(session.request || '').trim().toLowerCase() === normalizedRequest;
        });

        if (existing) {
            return existing;
        }

        const session = {
            id: `session_${now}_${Math.floor(Math.random() * 1000)}`,
            player,
            request,
            addressedAgents: [...new Set(addressedAgents)],
            coordinator,
            status: 'planning',
            createdAt: now,
            updatedAt: now,
            planVersion: 0,
            metadata,
            assignments: [],
            candidateSites: [],
            updates: []
        };

        state.collaborationSessions.push(session);
        this._save(state);
        return session;
    }

    getCollaborationSession(sessionId) {
        if (!sessionId) return null;
        const state = this._load();
        return state.collaborationSessions.find(session => session.id === sessionId) || null;
    }

    updateCollaborationSession(sessionId, patch = {}) {
        const state = this._load();
        const session = state.collaborationSessions.find(item => item.id === sessionId);
        if (!session) {
            return null;
        }

        Object.assign(session, patch, { updatedAt: Date.now() });
        this._save(state);
        return session;
    }

    setCollaborationCoordinator(sessionId, coordinator, rankInfo = {}) {
        return this.updateCollaborationSession(sessionId, {
            coordinator,
            coordinatorRank: rankInfo,
            status: 'planned'
        });
    }

    setCollaborationAssignments(sessionId, assignments = [], extra = {}) {
        return this.updateCollaborationSession(sessionId, {
            assignments: assignments.map(assignment => ({
                ...assignment,
                status: assignment.status || 'planned'
            })),
            planVersion: Number(extra.planVersion) || 1,
            summary: extra.summary || null,
            patterns: extra.patterns || []
        });
    }

    getAssignmentsForAgent(sessionId, agentName = this.agentName) {
        const session = this.getCollaborationSession(sessionId);
        if (!session) {
            return [];
        }
        return (session.assignments || []).filter(assignment => assignment.agent === agentName);
    }

    updateAssignmentStatus(sessionId, assignmentId, status, extra = {}) {
        const state = this._load();
        const session = state.collaborationSessions.find(item => item.id === sessionId);
        if (!session) {
            return null;
        }
        const assignment = (session.assignments || []).find(item => item.id === assignmentId);
        if (!assignment) {
            return null;
        }

        Object.assign(assignment, extra, { status, updatedAt: Date.now() });
        session.updatedAt = Date.now();
        this._save(state);
        return assignment;
    }

    addSessionUpdate(sessionId, update = {}) {
        const state = this._load();
        const session = state.collaborationSessions.find(item => item.id === sessionId);
        if (!session) {
            return null;
        }

        session.updates = session.updates || [];
        session.updates.push({
            agent: this.agentName,
            timestamp: Date.now(),
            visibility: 'internal',
            ...update
        });
        session.updatedAt = Date.now();
        this._save(state);
        return session.updates[session.updates.length - 1];
    }

    sendCollaborationMessage(sessionId, message = {}) {
        if (!sessionId) {
            return null;
        }

        return this.addSessionUpdate(sessionId, {
            kind: 'bot_message',
            visibility: 'internal',
            targetAgent: message.targetAgent || null,
            assignmentId: message.assignmentId || null,
            priority: message.priority || 'normal',
            intentContext: message.intentContext || null,
            message: message.message || ''
        });
    }

    addCandidateSite(sessionId, site = {}) {
        const state = this._load();
        const session = state.collaborationSessions.find(item => item.id === sessionId);
        if (!session) {
            return null;
        }

        session.candidateSites = session.candidateSites || [];
        const rounded = {
            x: Math.round(site.x || 0),
            y: Math.round(site.y || 0),
            z: Math.round(site.z || 0)
        };
        const existing = session.candidateSites.find(candidate =>
            candidate.agent === (site.agent || this.agentName) &&
            candidate.x === rounded.x &&
            candidate.y === rounded.y &&
            candidate.z === rounded.z
        );

        const record = {
            agent: site.agent || this.agentName,
            x: rounded.x,
            y: rounded.y,
            z: rounded.z,
            score: Number(site.score) || 0,
            flatness: Number(site.flatness) || 0,
            resourceSummary: site.resourceSummary || 'unknown',
            notes: site.notes || '',
            updatedAt: Date.now()
        };

        if (existing) {
            Object.assign(existing, record);
        } else {
            session.candidateSites.push(record);
        }

        session.updatedAt = Date.now();
        this._save(state);
        return record;
    }

    getCandidateSites(sessionId) {
        return this.getCollaborationSession(sessionId)?.candidateSites || [];
    }

    /**
     * Notify task completion
     */
    notifyCompletion(taskId, outputs = {}) {
        const state = this._load();
        state.completions = state.completions || [];

        state.completions.push({
            agent: this.agentName,
            taskId,
            outputs,
            completedAt: Date.now()
        });

        // Keep last 50 completions
        if (state.completions.length > 50) {
            state.completions = state.completions.slice(-50);
        }

        this._save(state);
    }
    distance(x1, y1, z1, x2, y2, z2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
    }
}
