import * as world from '../../agent/library/world.js';
import * as skills from '../../agent/library/skills.js';
import { executeCommand } from '../../agent/commands/index.js';
import { execFileSync, spawn } from 'child_process';
import { existsSync, mkdirSync, rmSync, statSync } from 'fs';
import { join } from 'path';
import Vec3 from 'vec3';
import { SharedMemory } from '../../team/shared_memory.js';
import { CollaborativePlanner } from '../../models/enhancers/collaborative_planner.js';
import { CATEGORIES, getTasksForSuite } from './test_tasks.js';

const EFFICIENCY_STANDARD = {
    name: 'Implicit Collaboration Efficiency Standard',
    standardVersion: 'ICES-v1',
    unit: 'evidence_score_0_to_100',
    passThreshold: 70
};

export class TestRunner {
    constructor(agent, tasks, recorder) {
        this.agent = agent;
        this.tasks = tasks;
        this.recorder = recorder;
        this.currentTaskIndex = 0;
        this.taskFailed = false;
        this.clearPermissionWarningSent = false;
    }

    getTasksForSuite(suiteName = 'all') {
        return getTasksForSuite(suiteName);
    }

    /**
     * Run all tests sequentially
     */
    async runAll() {
        return this.runSuite('all');
    }

    async runSuite(suiteName = 'all') {
        const suiteTasks = this.getTasksForSuite(suiteName);
        console.log(`[TestRunner] Starting ${suiteName} suite with ${suiteTasks.length} tests...`);
        this.recorder.startRun?.({ suite: suiteName });

        const results = [];

        for (let i = 0; i < suiteTasks.length; i++) {
            const task = suiteTasks[i];
            this.currentTaskIndex = i;

            if (!this.isLiveGameTask(task)) {
                this.agent.bot.chat(`[${i + 1}/${suiteTasks.length}] Running: ${task.name}`);
            }
            console.log(`[TestRunner] Running task ${i + 1}/${suiteTasks.length}: ${task.id}`);

            try {
                const result = await this.runTaskWithRepeatPolicy(task);
                results.push(result);

                if (this.isLiveGameTask(task)) {
                    console.log(`[TestRunner] ${task.name} ${result.success ? 'passed' : 'failed'} (${result.durationMs}ms)`);
                } else if (result.success) {
                    this.agent.bot.chat(`✓ ${task.name} passed (${result.durationMs}ms)`);
                } else {
                    this.agent.bot.chat(`✗ ${task.name} failed`);
                }
            } catch (err) {
                console.error(`[TestRunner] Error in task ${task.id}:`, err);
                const failResult = {
                    taskId: task.id,
                    taskName: task.name,
                    success: false,
                    error: err.message,
                    durationMs: 0
                };
                this.recorder.startTask(task.id, task.name);
                this.recorder.endTask(false, null, {
                    error: err.message,
                    finalFailureReason: err.message
                });
                results.push(failResult);
                this.agent.bot.chat(`✗ ${task.name} error: ${err.message}`);
            }

            if (!this.isDecisionOnlyTask(task) && !this.isLiveGameTask(task)) {
                await this.clearState();
            }

            // Small delay between tests
            await this.sleep(1000);
        }

        console.log(`[TestRunner] All tests complete. ${results.filter(r => r.success).length}/${results.length} passed.`);
        return results;
    }

    /**
     * Run a single test by ID
     */
    async runSingle(taskId) {
        const task = this.getTasksForSuite('all').find(t => t.id === taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        console.log(`[TestRunner] Running single task: ${task.id}`);
        this.recorder.startRun?.({ suite: task.category || 'single' });

        try {
            const result = await this.runTaskWithRepeatPolicy(task);
            return result;
        } finally {
            if (!this.isDecisionOnlyTask(task) && !this.isLiveGameTask(task)) {
                await this.clearState();
            }
        }
    }

    isDecisionOnlyTask(task) {
        return task?.category === CATEGORIES.COLLAB_DECISION;
    }

    isLiveGameTask(task) {
        return task?.category === CATEGORIES.COLLAB_GAME ||
            task?.category === CATEGORIES.COLLAB_DUPLICATE_GAME ||
            task?.category === CATEGORIES.COLLAB_DUPLICATE_BASELINE_GAME ||
            task?.category === CATEGORIES.COLLAB_DUPLICATE_SOLO_GAME ||
            task?.category === CATEGORIES.COLLAB_HARD_PIPELINE_GAME ||
            task?.category === CATEGORIES.COLLAB_HARD_PIPELINE_CONTEXT_GAME ||
            task?.category === CATEGORIES.COLLAB_HARD_PIPELINE_HIGH_BASELINE_GAME ||
            task?.category === CATEGORIES.COLLAB_HARD_PIPELINE_ORACLE_BASELINE_GAME ||
            task?.category === CATEGORIES.COLLAB_HARD_PIPELINE_BASELINE_GAME ||
            task?.category === CATEGORIES.COLLAB_HARD_PIPELINE_SOLO_GAME ||
            task?.category === CATEGORIES.COLLAB_REQUIRED_BASELINE_GAME ||
            task?.category === CATEGORIES.COLLAB_REQUIRED_CONTEXT_GAME ||
            task?.category === CATEGORIES.COLLAB_REQUIRED_COMPACT_BASELINE_GAME ||
            task?.category === CATEGORIES.COLLAB_REQUIRED_COMPACT_CONTEXT_GAME ||
            task?.category === CATEGORIES.COLLAB_DIVERSE_MODEL_BASELINE_GAME ||
            task?.category === CATEGORIES.COLLAB_DIVERSE_MODEL_CONTEXT_GAME ||
            task?.category === CATEGORIES.COLLAB_EXPLICIT_COMMUNICATION_GAME ||
            task?.category === CATEGORIES.COLLAB_MATCHED_IMPLICIT_CONTEXT_GAME ||
            task?.category === CATEGORIES.COLLAB_KNOWLEDGE_NORMAL_GAME ||
            task?.category === CATEGORIES.COLLAB_KNOWLEDGE_EXPLICIT_GAME ||
            task?.category === CATEGORIES.COLLAB_KNOWLEDGE_IMPLICIT_GAME;
    }

    getRepeatPolicy(task) {
        const inGameSimulation = this.isLiveGameTask(task);
        return {
            inGameSimulation,
            attempts: inGameSimulation ? 5 : 10,
            passThreshold: inGameSimulation ? 3 : 7
        };
    }

    async runTaskWithRepeatPolicy(task) {
        const policy = this.getRepeatPolicy(task);
        const startedAt = Date.now();
        const attempts = [];
        const detailedResults = [];

        for (let attemptIndex = 1; attemptIndex <= policy.attempts; attemptIndex++) {
            const taskForAttempt = {
                ...task,
                repeatContext: {
                    attemptIndex,
                    totalAttempts: policy.attempts,
                    passThreshold: policy.passThreshold,
                    inGameSimulation: policy.inGameSimulation
                }
            };

            console.log(`[TestRunner] Attempt ${attemptIndex}/${policy.attempts} for ${task.id}`);

            try {
                const result = await this.executeTask(taskForAttempt);
                detailedResults.push(result);
                attempts.push({
                    attemptIndex,
                    taskId: result?.taskId || task.id,
                    success: Boolean(result?.success),
                    durationMs: Number(result?.durationMs || 0),
                    finalFailureReason: result?.finalFailureReason || result?.error || null
                });
            } catch (err) {
                detailedResults.push({
                    taskId: task.id,
                    taskName: task.name,
                    success: false,
                    durationMs: 0,
                    finalFailureReason: err.message
                });
                attempts.push({
                    attemptIndex,
                    taskId: task.id,
                    success: false,
                    durationMs: 0,
                    finalFailureReason: err.message
                });
            }

            if (attemptIndex < policy.attempts) {
                await this.sleep(250);
            }
        }

        const passedAttempts = attempts.filter(attempt => attempt.success).length;
        const representative = detailedResults.find(result => result?.success) || detailedResults[0] || {};
        const communicationLog = detailedResults.flatMap(result => result?.communicationLog || []);
        const aggregate = {
            taskId: task.id,
            taskName: task.name,
            aggregateResult: true,
            success: passedAttempts >= policy.passThreshold,
            planQuality: passedAttempts >= policy.passThreshold ? 'repeat_policy_pass' : 'repeat_policy_fail',
            durationMs: Date.now() - startedAt,
            category: representative.category || task.category || null,
            actualGameRun: Boolean(representative.actualGameRun),
            scriptedEvidenceExchange: Boolean(representative.scriptedEvidenceExchange),
            soloRun: Boolean(representative.soloRun),
            teammate: representative.teammate || null,
            objectiveSuccess: passedAttempts >= policy.passThreshold &&
                (Object.prototype.hasOwnProperty.call(representative, 'objectiveSuccess')
                    ? Boolean(representative.objectiveSuccess)
                    : true),
            estimatedTaskTimeSeconds: representative.estimatedTaskTimeSeconds,
            roleOverlapRate: representative.roleOverlapRate,
            taskCoverageRate: representative.taskCoverageRate,
            handoffSuccesses: representative.handoffSuccesses,
            duplicateWorkUnits: representative.duplicateWorkUnits,
            duplicateWorkAvoided: representative.duplicateWorkAvoided,
            plannedAssignments: representative.plannedAssignments,
            communicationLog,
            repeatPolicy: policy,
            passedAttempts,
            failedAttempts: policy.attempts - passedAttempts,
            attempts,
            finalFailureReason: passedAttempts >= policy.passThreshold
                ? null
                : `Passed ${passedAttempts}/${policy.attempts}; required ${policy.passThreshold}`
        };

        if (typeof this.recorder?.recordAggregateResult === 'function') {
            return this.recorder.recordAggregateResult(aggregate);
        }

        return aggregate;
    }

    /**
     * Clear inventory and memory before each test
     */
    async clearState(options = {}) {
        const notifyModel = options.notifyModel !== false;
        const announce = options.announce === true;
        console.log('[TestRunner] Clearing state...');

        if (this.agent.actions && typeof this.agent.actions.stop === 'function') {
            await this.agent.actions.stop();
        }

        if (announce && this.agent?.bot?.chat) {
            this.agent.bot.chat('[BENCHMARK RESET] Clearing inventory and memory before this live game trial.');
        }

        if (notifyModel && typeof this.agent.handleMessage === 'function') {
            await this.agent.handleMessage('system',
                '[BENCHMARK MODE] Preparing for next test. Inventory will be cleared to ensure a clean state. This is normal and expected during benchmarking.'
            );
        }

        // Try to clear inventory, but don't fail the test if we can't
        try {
            const clearResult = await this.clearInventoryWithCommand();
            if (!clearResult.success) {
                if (clearResult.permissionDenied) {
                    const warning = 'I cannot use /clear on this server. Please give me operator/admin permission so the TestingExtension can fully reset inventory between tasks.';
                    await this.notifyClearPermissionIssue(warning);
                }
                if (options.requireInventoryEmpty === true) {
                    throw new Error(clearResult.message);
                }
                console.warn(`[TestRunner] ${clearResult.message} - continuing anyway`);
            } else {
                console.log(`[TestRunner] ${clearResult.message}`);
            }
        } catch (err) {
            console.warn('[TestRunner] Error clearing inventory:', err.message, '- continuing anyway');
        }

        // Clear memory
        try {
            if (this.agent.history && typeof this.agent.history.clear === 'function') {
                this.agent.history.clear();
            } else if (this.agent.history) {
                // Fallback: clear turns directly
                this.agent.history.turns = [];
            }
            console.log('[TestRunner] Memory cleared');
        } catch (err) {
            console.warn('[TestRunner] Error clearing memory:', err.message);
        }

        await this.sleep(500);
    }

    /**
     * Execute a single task (with timeout based on task configuration)
     */
    async executeTask(task) {
        const communicationCapture = this.startCommunicationCapture(task);
        const repeatMetadata = task.repeatContext ? { repeatContext: task.repeatContext } : {};
        let trialRecording = null;

        try {
            trialRecording = await this.startTrialRecording(task);
            await this.clearState(this.isLiveGameTask(task)
                ? { notifyModel: false, announce: false, requireInventoryEmpty: true }
                : {}
            );

            this.recorder.startTask(task.id, task.name);

            if (this.isDecisionOnlyTask(task)) {
                const outcome = await this.executeCollaborationDecisionTask(task);
                return this.endRecordedTask(
                    Boolean(outcome.success),
                    outcome.planQuality || null,
                    { ...(outcome.metadata || {}), ...repeatMetadata, ...(trialRecording ? { trialRecording } : {}) },
                    communicationCapture
                );
            }

            if (this.isLiveGameTask(task)) {
                const outcome = await this.executeLiveGameTask(task, communicationCapture);
                return this.endRecordedTask(
                    Boolean(outcome.success),
                    outcome.planQuality || null,
                    { ...(outcome.metadata || {}), ...repeatMetadata, ...(trialRecording ? { trialRecording } : {}) },
                    communicationCapture
                );
            }

            const enhancer = this.getBenchmarkEnhancer();
            const supportsBenchmarkRecovery = this.supportsBenchmarkRecovery(enhancer);
            let deathHandler = null;

            try {
                const runPromise = (supportsBenchmarkRecovery
                    ? this.executeTaskWithBenchmarkRecovery(task, enhancer)
                    : this.executeTaskLegacy(task)
                ).catch(err => ({
                    success: false,
                    metadata: {
                        error: err.message,
                        finalFailureReason: err.message
                    }
                }));

                const deathPromise = new Promise(resolve => {
                    deathHandler = () => {
                        console.warn(`[TestRunner] Agent died during task ${task.id}`);
                        resolve({
                            success: false,
                            metadata: {
                                death: true,
                                finalFailureReason: 'Agent died during benchmark task',
                                failureStepGoal: null,
                                repeatedMistakeSignature: null,
                                benchmarkRetries: 0
                            }
                        });
                    };

                    this.agent.bot.once('death', deathHandler);
                });

                const outcome = await Promise.race([runPromise, deathPromise]);
                return this.endRecordedTask(
                    Boolean(outcome?.success),
                    null,
                    { ...(outcome?.metadata || {}), ...repeatMetadata, ...(trialRecording ? { trialRecording } : {}) },
                    communicationCapture
                );
            } catch (err) {
                return this.endRecordedTask(false, null, {
                    error: err.message,
                    finalFailureReason: err.message,
                    ...repeatMetadata,
                    ...(trialRecording ? { trialRecording } : {})
                }, communicationCapture);
            } finally {
                if (deathHandler) {
                    this.agent.bot.off('death', deathHandler);
                }

                if (supportsBenchmarkRecovery && typeof enhancer.resetBenchmarkTask === 'function') {
                    enhancer.resetBenchmarkTask({ clearTaskStack: true });
                }
            }
        } finally {
            await this.finishTrialRecording(trialRecording);
            communicationCapture.stop();
        }
    }

    async startTrialRecording(task) {
        const recordingDir = process.env.TEST_RECORD_TRIALS_DIR;
        if (!recordingDir) return null;

        const suite = this.sanitizeFilename(process.env.TEST_RECORD_SUITE || task?.category || 'suite');
        const taskId = this.sanitizeFilename(task?.id || 'task');
        const attempt = Number(task?.repeatContext?.attemptIndex || 1);
        if (!this.shouldRecordTrialAttempt(attempt)) {
            return null;
        }
        const seconds = Math.max(5, Number(process.env.TEST_RECORD_TRIAL_SECONDS || 30));
        const display = String(process.env.TEST_RECORD_DISPLAY || '1');
        const windowId = process.env.TEST_RECORD_WINDOW_ID ? String(process.env.TEST_RECORD_WINDOW_ID) : null;
        const region = process.env.TEST_RECORD_REGION ? String(process.env.TEST_RECORD_REGION) : null;
        mkdirSync(recordingDir, { recursive: true });
        const path = join(recordingDir, `${suite}_${taskId}_attempt_${attempt}.mov`);
        const backend = process.env.TEST_RECORD_BACKEND === 'frames' ? 'frames' : 'screencapture_video';

        if (!region) {
            this.focusRecordingTarget();
            await this.sleep(1000);
        }
        const frameArgs = [
                join(process.cwd(), 'scripts', 'record_screen_frames.js'),
                '--output', path,
                '--seconds', String(seconds),
                '--interval-ms', String(process.env.TEST_RECORD_FRAME_INTERVAL_MS || 1000),
                '--focus-process', process.env.TEST_RECORD_FOCUS_PROCESS || 'java'
            ];
        if (region) {
            frameArgs.push('--region', region);
        } else if (windowId) {
            frameArgs.push('--window-id', windowId);
        } else {
            frameArgs.push('--display', display);
        }
        const child = backend === 'frames'
            ? spawn(process.execPath, frameArgs, { stdio: ['ignore', 'ignore', 'pipe'] })
            : spawn('/usr/sbin/screencapture', [
                '-v',
                '-V',
                String(seconds),
                '-D',
                display,
                '-k',
                path
            ], { stdio: ['ignore', 'ignore', 'pipe'] });
        const stderr = [];
        child.stderr?.on('data', chunk => stderr.push(String(chunk)));

        const recording = {
            path,
            seconds,
            display,
            backend,
            frameIntervalMs: backend === 'frames'
                ? Number(process.env.TEST_RECORD_FRAME_INTERVAL_MS || 1000)
                : null,
            windowId,
            region,
            fullscreenRequested: process.env.TEST_RECORD_FULLSCREEN !== '0',
            focusProcess: process.env.TEST_RECORD_FOCUS_PROCESS || 'java',
            startedAt: new Date().toISOString(),
            stderr
        };
        Object.defineProperty(recording, 'process', {
            value: child,
            enumerable: false,
            configurable: true
        });
        return recording;
    }

    shouldRecordTrialAttempt(attempt) {
        const configured = process.env.TEST_RECORD_TRIAL_ATTEMPTS;
        if (!configured) return true;
        const allowed = configured
            .split(',')
            .map(value => Number(value.trim()))
            .filter(value => Number.isFinite(value));
        return allowed.includes(Number(attempt));
    }

    async finishTrialRecording(recording) {
        if (!recording?.process) return null;
        await this.waitForProcess(recording.process, Math.max(5000, (Number(recording.seconds || 30) + 10) * 1000));
        recording.finishedAt = new Date().toISOString();
        recording.exists = existsSync(recording.path);
        recording.bytes = recording.exists ? statSync(recording.path).size : 0;
        recording.stderr = (recording.stderr || []).join('').trim();
        delete recording.process;
        return recording;
    }

    focusRecordingTarget() {
        const processName = process.env.TEST_RECORD_FOCUS_PROCESS || 'java';
        const escaped = processName.replace(/"/g, '\\"');
        const setFullscreen = process.env.TEST_RECORD_FULLSCREEN !== '0';
        const script = [
            'tell application "System Events"',
            `if exists process "${escaped}" then`,
            `tell process "${escaped}"`,
            'set frontmost to true',
            'delay 0.2',
            'if (count of windows) > 0 then',
            ...(setFullscreen ? [
                'try',
                'set value of attribute "AXFullScreen" of window 1 to true',
                'end try'
            ] : []),
            'try',
            'set position of window 1 to {0, 0}',
            'set size of window 1 to {1920, 1080}',
            'end try',
            'end if',
            'end tell',
            'end if',
            'end tell'
        ];
        try {
            execFileSync('/usr/bin/osascript', script.flatMap(line => ['-e', line]), { stdio: 'ignore' });
        } catch {
            // Recording can still proceed if macOS denies accessibility or fullscreen control.
        }
    }

    waitForProcess(child, timeoutMs) {
        return new Promise(resolve => {
            if (!child || child.exitCode !== null || child.signalCode !== null) {
                resolve();
                return;
            }

            let done = false;
            const finish = () => {
                if (done) return;
                done = true;
                resolve();
            };
            child.on('exit', finish);
            setTimeout(() => {
                if (!done) {
                    child.kill('SIGINT');
                    finish();
                }
            }, timeoutMs);
        });
    }

    sanitizeFilename(value) {
        return String(value || 'artifact').replace(/[^A-Za-z0-9_-]/g, '_');
    }

    endRecordedTask(success, planQuality, metadata = {}, communicationCapture = null) {
        const communicationLog = communicationCapture?.log || [];
        const efficiency = this.buildRuntimeEfficiencyRecord(metadata, communicationLog);
        return this.recorder.endTask(success, planQuality, {
            ...metadata,
            communicationLog,
            efficiency
        });
    }

    buildRuntimeEfficiencyRecord(metadata = {}, communicationLog = []) {
        const gainSignals = [];
        if (metadata.helperAdoption) {
            gainSignals.push('helper_adoption');
        }
        if (Number(metadata.supplyRequests || 0) > 0) {
            gainSignals.push('supply_request_created');
        }
        if (Number(metadata.workClaims || 0) > 0) {
            gainSignals.push('work_claim_created');
        }
        if (metadata.duplicateWorkAvoided) {
            gainSignals.push('duplicate_work_avoided');
        }
        if (Number(metadata.factsUsed || 0) > 0) {
            gainSignals.push('shared_world_fact_used');
        }

        return {
            standardName: EFFICIENCY_STANDARD.name,
            standardVersion: EFFICIENCY_STANDARD.standardVersion,
            comparisonType: 'single_trial_runtime_observation',
            score: null,
            improved: null,
            passThreshold: EFFICIENCY_STANDARD.passThreshold,
            gainSignals,
            observations: {
                communicationMessageCount: communicationLog.length,
                supplyRequests: Number(metadata.supplyRequests || 0),
                workClaims: Number(metadata.workClaims || 0),
                factsUsed: Number(metadata.factsUsed || 0),
                duplicateWorkAvoided: Boolean(metadata.duplicateWorkAvoided),
                helperAdoption: Boolean(metadata.helperAdoption),
                decision: metadata.decision || null
            },
            note: 'Single live trials record efficiency signals but require a paired disabled-control baseline for an ICES-v1 improvement score.'
        };
    }

    startCommunicationCapture(task) {
        const log = [];
        const bot = this.agent?.bot;
        const originalBotChat = typeof bot?.chat === 'function' ? bot.chat.bind(bot) : null;
        const originalOpenChat = typeof this.agent?.openChat === 'function' ? this.agent.openChat.bind(this.agent) : null;
        const originalHandleMessage = typeof this.agent?.handleMessage === 'function' ? this.agent.handleMessage.bind(this.agent) : null;
        const rawChatListener = (source, message) => {
            if (source === (this.agent?.name || bot?.username)) return;
            record('minecraft.chat', message, { source: source || null });
        };
        const record = (channel, message, extra = {}) => {
            log.push({
                timestamp: new Date().toISOString(),
                agent: this.agent?.name || bot?.username || 'unknown_agent',
                taskId: task?.id || null,
                taskName: task?.name || null,
                channel,
                message: String(message),
                ...extra
            });
        };

        if (originalBotChat) {
            bot.chat = (message, ...args) => {
                record('bot.chat', message);
                return originalBotChat(message, ...args);
            };
        }

        if (originalOpenChat) {
            this.agent.openChat = async (message, ...args) => {
                record('agent.openChat', message);
                return originalOpenChat(message, ...args);
            };
        }

        if (originalHandleMessage) {
            this.agent.handleMessage = async (source, message, ...args) => {
                record('agent.handleMessage', message, { source: source || null });
                return originalHandleMessage(source, message, ...args);
            };
        }

        if (bot && typeof bot.on === 'function') {
            bot.on('chat', rawChatListener);
        }

        return {
            log,
            stop: () => {
                if (bot && typeof bot.off === 'function') {
                    bot.off('chat', rawChatListener);
                }
                if (originalBotChat) {
                    bot.chat = originalBotChat;
                }
                if (originalOpenChat) {
                    this.agent.openChat = originalOpenChat;
                }
                if (originalHandleMessage) {
                    this.agent.handleMessage = originalHandleMessage;
                }
            }
        };
    }

    async executeLiveGameTask(task, communicationCapture) {
        const liveGame = task.liveGame || {};
        if (liveGame.explicitActionBaseline) {
            return this.executeExplicitRoleActionGameTask(task, communicationCapture);
        }
        if (liveGame.modelAllocationBaseline || liveGame.modelAllocationContext ||
            liveGame.explicitCommunicationBaseline || liveGame.matchedImplicitContext) {
            return this.executeDiverseModelAllocationGameTask(task, communicationCapture);
        }
        if (liveGame.knowledgeReuseCondition) {
            return this.executeKnowledgeReuseGameTask(task, communicationCapture);
        }
        if (liveGame.decomposedChecklistBaseline) {
            return this.executeDecomposedChecklistBaselineGameTask(task, communicationCapture);
        }
        if (liveGame.noPromptContext) {
            return this.executeNoPromptContextGameTask(task, communicationCapture);
        }

        const solo = Boolean(liveGame.solo);
        const teammate = liveGame.teammate || 'Max';
        const executionLog = [];
        const localMessages = liveGame.localMessages || [];
        const teammateMessages = liveGame.teammateMessages || [];
        const restoreLocalChat = this.suspendLocalChatHandling();
        const remoteRestoreCommands = [];

        const event = (name, detail = {}) => {
            executionLog.push({
                order: executionLog.length + 1,
                event: name,
                timestamp: new Date().toISOString(),
                detail
            });
        };

        try {
            event('live_game_trial_started', {
                taskId: task.id,
                taskName: task.name,
                localAgent: this.agent?.name || this.agent?.bot?.username || 'unknown',
                teammate: solo ? null : teammate,
                solo
            });
            const localAgentName = this.agent?.bot?.username || this.agent?.name || 'Lucy';
            const activeAgents = solo ? [localAgentName] : [localAgentName, teammate];

            if (!solo) {
                await this.sendMonitorCommand(teammate, '!evidenceSetChatHandling("off")');
                remoteRestoreCommands.push(teammate);
                event('teammate_chat_handling_suspended', { teammate });

                await this.sendMonitorCommand(teammate, '!evidenceClearState');
                event('teammate_state_reset_requested', { teammate });
                await this.sleep(500);
            } else {
                event('solo_trial_no_teammate_reset_needed', {
                    reason: 'Solo live trial intentionally runs without teammate commands.'
                });
            }

            await this.prepareNoPromptTrialIsolation(task, activeAgents, event);
            await this.prepareNoPromptAgentVitals(activeAgents, event);
            await this.prepareLiveRecordingCamera(task, solo ? localAgentName : teammate, event);

            const attempt = Number(task?.repeatContext?.attemptIndex || 1);
            this.agent.bot.chat(`[LIVE GAME TRIAL] ${task.name} attempt ${attempt}`);
            event('trial_announced_in_game', { message: `[LIVE GAME TRIAL] ${task.name} attempt ${attempt}` });

            for (const message of localMessages) {
                await this.agent.openChat(message);
                event('local_message_sent', { agent: this.agent.name, message });
                await this.sleep(250);
            }

            const observedTeammateMessages = [];
            for (const message of solo ? [] : teammateMessages) {
                await this.sendMonitorCommand(teammate, `!evidenceSay("${this.escapeCommandString(message)}")`);
                event('teammate_message_requested', { teammate, message });

                const observed = await this.waitForCommunicationEntry(
                    communicationCapture,
                    entry => entry.source === teammate &&
                        String(entry.message || '').trim().includes(String(message || '').trim()),
                    5000
                );
                observedTeammateMessages.push(Boolean(observed));
                event(observed ? 'teammate_message_observed' : 'teammate_message_missing', {
                    teammate,
                    message
                });
            }

            const success = observedTeammateMessages.every(Boolean);
            return {
                success,
                planQuality: success ? 'live_game_pass' : 'live_game_fail',
                metadata: {
                    category: task.category,
                    actualGameRun: true,
                    scriptedEvidenceExchange: true,
                    soloRun: solo,
                    teammate: solo ? null : teammate,
                    localMessageCount: localMessages.length,
                    teammateMessageCount: solo ? 0 : teammateMessages.length,
                    teammateMessagesObserved: observedTeammateMessages.filter(Boolean).length,
                    executionLog,
                    finalFailureReason: success ? null : `Expected in-game teammate messages from ${teammate} were not all observed`,
                    ...(liveGame.metadata || {})
                }
            };
        } finally {
            restoreLocalChat();
            for (const remoteAgent of remoteRestoreCommands) {
                if (this.shouldKeepEvidenceChatSuspended(task)) {
                    event('teammate_chat_handling_left_suspended', { teammate: remoteAgent });
                    continue;
                }
                try {
                    await this.sendMonitorCommand(remoteAgent, '!evidenceSetChatHandling("on")');
                    event('teammate_chat_handling_restored', { teammate: remoteAgent });
                } catch (err) {
                    console.warn(`[TestRunner] Failed to restore chat handling for ${remoteAgent}:`, err.message);
                }
            }
        }
    }

    async prepareLiveRecordingCamera(task, targetAgent, event) {
        const localName = this.agent?.bot?.username || this.agent?.name || 'Lucy';
        const cameraName = this.findRecordingCameraPlayer([localName, targetAgent]);
        if (cameraName) {
            await this.positionRecordingCamera(cameraName, targetAgent, event, {
                taskId: task?.id || null,
                attempt: Number(task?.repeatContext?.attemptIndex || 1)
            });
        } else {
            event('recording_camera_not_found', {
                reason: 'No non-bot player was visible in bot.players.',
                targetAgent
            });
        }
    }

    async positionRecordingCamera(cameraName, targetAgent, event, extra = {}) {
        const mode = String(process.env.TEST_RECORD_CAMERA_MODE || 'spectate').toLowerCase();
        await this.sendSetupCommand(`/gamemode spectator ${cameraName}`, event);

        if (mode === 'overview') {
            await this.sendSetupCommand('/spectate', event);
            await this.sendSetupCommand(`/execute at ${targetAgent} run tp ${cameraName} ~ ~10 ~ 0 70`, event);
            event('recording_camera_positioned', {
                cameraName,
                mode: 'spectator_overview',
                targetAgent,
                ...extra
            });
        } else {
            await this.sendSetupCommand(`/spectate ${targetAgent} ${cameraName}`, event);
            event('recording_camera_positioned', {
                cameraName,
                mode: 'spectator',
                spectating: targetAgent,
                ...extra
            });
        }

        await this.sleep(500);
    }

    getContextWorkItemSpecs(context = {}) {
        if (Array.isArray(context.workItems) && context.workItems.length > 0) {
            return context.workItems.map((work, index) => ({
                kind: work.kind || 'collect',
                item: work.item,
                count: Number(work.count || 1),
                summary: work.summary || `${work.item} x${work.count || 1}`,
                collectBlockType: work.collectBlockType || work.block || work.item,
                outputItem: work.outputItem || work.item,
                collectionCandidates: work.collectionCandidates || work.alternatives || [],
                index
            }));
        }

        return Object.entries(context.teammateItems || {}).map(([item, count], index) => ({
            kind: 'collect',
            item,
            count: Number(count || 1),
            summary: `${item} x${count}`,
            collectBlockType: item,
            outputItem: item,
            collectionCandidates: context.collectionCandidates || context.alternatives || [],
            index
        }));
    }

    createContextWorkItem(sharedMemory, {
        context,
        namespace,
        task,
        localAgent,
        claimant,
        status = 'planned',
        spec,
        source,
        explicitPrompt,
        duplicateBaseline = false,
        kindSuffix = ''
    }) {
        return sharedMemory.createWorkItem({
            namespace,
            kind: `${spec.kind || 'collect'}${kindSuffix}`,
            item: spec.item,
            count: spec.count,
            agent: localAgent,
            claimant,
            status,
            summary: spec.summary || `${task.id} needs ${spec.count} ${spec.item}`,
            position: context.base || null,
            metadata: {
                taskId: task.id,
                requester: localAgent,
                source,
                explicitPrompt,
                noCheat: true,
                duplicateBaseline,
                acceptAnyCollectedItem: context.acceptAnyCollectedItem === true,
                collectBlockType: spec.collectBlockType || spec.item,
                outputItem: spec.outputItem || spec.item,
                collectionCandidates: spec.collectionCandidates || context.collectionCandidates || context.alternatives || []
            }
        });
    }

    getWorkCommandCandidates(context = {}, work = {}) {
        return [
            work.metadata?.collectBlockType,
            ...(work.metadata?.collectionCandidates || []),
            ...(context.collectionCandidates || context.alternatives || [])
        ].map(item => String(item || '').trim()).filter(Boolean);
    }

    getInventoryCountForAgent(agent, itemName) {
        return (agent?.bot?.inventory?.items?.() || [])
            .filter(item => item.name === itemName)
            .reduce((sum, item) => sum + Number(item.count || 0), 0);
    }

    async completeLocalEvidenceWorkItem(statePath, work, handoffMethod) {
        const requestedCount = Math.max(1, Number(work.count || 1));
        const outputItem = work.metadata?.outputItem || work.item;
        const candidates = this.getWorkCommandCandidates({}, work);
        const attempts = [];
        let collected = 0;
        let lastError = null;

        for (const candidate of candidates.length > 0 ? candidates : [work.item]) {
            await this.prepareLocalEvidenceCollectionControl();
            const observedBefore = this.getInventoryCountForAgent(this.agent, outputItem);
            let observedAfter = observedBefore;
            let error = null;
            try {
                if (this.shouldUseManualTerrainCollection(candidate, outputItem)) {
                    await this.collectNearbyTerrainBlocks(this.agent, candidate, requestedCount, outputItem, observedBefore);
                } else {
                    await skills.collectBlock(this.agent.bot, candidate, requestedCount);
                }
            } catch (err) {
                error = err.message;
            }
            observedAfter = this.getInventoryCountForAgent(this.agent, outputItem);
            collected = Math.max(0, observedAfter - observedBefore);
            attempts.push({
                item: candidate,
                outputItem,
                observedBefore,
                observedAfter,
                collected,
                success: collected >= requestedCount,
                error
            });
            if (collected >= requestedCount) {
                const memory = new SharedMemory({ agentName: this.agent?.name || 'Lucy', path: statePath });
                memory.completeWorkItem(work.id, {
                    status: 'completed',
                    outputs: {
                        requestedItem: work.item,
                        actualItem: outputItem,
                        collectedBlock: candidate,
                        [outputItem]: collected,
                        handoffMethod,
                        providerInventoryBefore: observedBefore,
                        providerInventoryAfter: observedAfter,
                        collectionAttempts: attempts
                    },
                    result: `Local evidence work completed as ${outputItem}.`
                });
                return { success: true, collected, attempts };
            }
            lastError = error;
        }

        const memory = new SharedMemory({ agentName: this.agent?.name || 'Lucy', path: statePath });
        memory.completeWorkItem(work.id, {
            status: 'failed',
            outputs: {
                requestedItem: work.item,
                actualItem: outputItem,
                handoffMethod,
                collectionAttempts: attempts
            },
            result: `Local evidence work failed${lastError ? `: ${lastError}` : ''}.`
        });
        return { success: false, collected: 0, attempts, error: lastError };
    }

    shouldUseManualTerrainCollection(candidate, outputItem) {
        return outputItem === 'dirt' && ['dirt', 'grass_block'].includes(String(candidate || ''));
    }

    async collectNearbyTerrainBlocks(agent, candidate, count, outputItem = 'dirt', observedBefore = null) {
        const bot = agent?.bot;
        if (!bot) return;

        const blockNames = candidate === 'dirt' ? ['dirt', 'grass_block'] : [candidate];
        const excluded = new Set();
        let attempts = 0;
        const before = Number.isFinite(Number(observedBefore))
            ? Number(observedBefore)
            : this.getInventoryCountForAgent(agent, outputItem);
        while (this.getInventoryCountForAgent(agent, outputItem) - before < count && attempts < count * 8) {
            attempts++;
            await this.prepareLocalEvidenceCollectionControl();
            const botPos = bot.entity?.position;
            const blocks = world.getNearestBlocks(bot, blockNames, 5)
                .filter(block => block?.position)
                .filter(block => !excluded.has(`${block.position.x},${block.position.y},${block.position.z}`))
                .filter(block => !botPos || botPos.distanceTo(block.position) > 1.4);
            if (blocks.length === 0) {
                break;
            }

            const block = blocks[0];
            excluded.add(`${block.position.x},${block.position.y},${block.position.z}`);
            const broke = await this.withEvidenceActionTimeout(
                skills.breakBlockAt(bot, block.position.x, block.position.y, block.position.z),
                8000,
                `break ${candidate}`
            );
            if (broke) {
                await this.withEvidenceActionTimeout(
                    skills.pickupNearbyItems(bot),
                    this.getEvidencePickupTimeoutMs(),
                    `pickup ${outputItem}`
                );
                await this.sleep(150);
            }
        }
    }

    async withEvidenceActionTimeout(promise, timeoutMs, label) {
        let timer = null;
        try {
            return await Promise.race([
                promise,
                new Promise((_, reject) => {
                    timer = setTimeout(
                        () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
                        timeoutMs
                    );
                })
            ]);
        } finally {
            if (timer) {
                clearTimeout(timer);
            }
        }
    }

    getEvidencePickupTimeoutMs() {
        return Math.max(4000, Number(process.env.TEST_EVIDENCE_PICKUP_TIMEOUT_MS || 10000));
    }

    async prepareLocalEvidenceCollectionControl() {
        const bot = this.agent?.bot;
        if (!bot) return;

        try {
            if (this.agent.self_prompter?.isActive?.()) {
                this.agent.self_prompter.stopLoop?.();
                await this.agent.self_prompter.pause?.();
            }
        } catch {
            // Best effort; evidence collection can still proceed.
        }

        try { bot.stopDigging?.(); } catch {}
        try { bot.collectBlock?.cancelTask?.(); } catch {}
        try { bot.pathfinder?.stop?.(); } catch {}
        try { bot.pathfinder?.setGoal?.(null); } catch {}
        try { bot.pvp?.stop?.(); } catch {}
        try { bot.clearControlStates?.(); } catch {}
        bot.interrupt_code = false;

        for (const mode of ['unstuck', 'self_preservation', 'self_defense', 'cowardice', 'hunting', 'torch_placing', 'item_collecting']) {
            try {
                if (bot.modes?.exists?.(mode)) {
                    bot.modes.pause(mode);
                }
            } catch {
                // Mode may not exist on all profiles.
            }
        }

        await this.sleep(250);
    }

    async executeExplicitRoleActionGameTask(task, communicationCapture) {
        const liveGame = task.liveGame || {};
        const context = liveGame.context || {};
        const namespace = context.namespace || 'explicit_role_baseline';
        const teammate = liveGame.teammate || 'Max';
        const localAgent = this.agent?.name || this.agent?.bot?.username || 'Lucy';
        const statePath = this.getScenarioStatePath(`${task.id}_attempt_${task.repeatContext?.attemptIndex || 1}`);
        const sharedMemory = new SharedMemory({ agentName: localAgent, path: statePath });
        const localMessages = liveGame.localMessages || [];
        const teammateMessages = liveGame.teammateMessages || [];
        const executionLog = [];
        const restoreLocalChat = this.suspendLocalChatHandling();
        const remoteRestoreCommands = [];
        const event = (name, detail = {}) => {
            executionLog.push({
                order: executionLog.length + 1,
                event: name,
                timestamp: new Date().toISOString(),
                detail
            });
        };

        this.resetScenarioState(statePath);

        try {
            event('explicit_role_action_trial_started', {
                taskId: task.id,
                localAgent,
                teammate,
                statePath
            });

            await this.sendMonitorCommand(teammate, '!evidenceSetChatHandling("off")');
            remoteRestoreCommands.push(teammate);
            event('teammate_chat_handling_suspended', { teammate });

            await this.sendMonitorCommand(teammate, '!evidenceClearState');
            event('teammate_state_reset_requested', { teammate });
            await this.sleep(500);

            await this.prepareNoPromptTrialIsolation(task, [localAgent, teammate], event);
            await this.prepareNoPromptAgentVitals([localAgent, teammate], event);
            await this.prepareLiveRecordingCamera(task, teammate, event);

            const attempt = Number(task?.repeatContext?.attemptIndex || 1);
            this.agent.bot.chat(`[LIVE GAME TRIAL] ${task.name} attempt ${attempt}`);
            event('trial_announced_in_game', { message: `[LIVE GAME TRIAL] ${task.name} attempt ${attempt}` });

            for (const message of localMessages) {
                await this.agent.openChat(message);
                event('explicit_role_instruction_sent', { agent: this.agent.name, message });
                await this.sleep(250);
            }

            const observedTeammateMessages = [];
            for (const message of teammateMessages) {
                await this.sendMonitorCommand(teammate, `!evidenceSay("${this.escapeCommandString(message)}")`);
                event('teammate_ack_requested', { teammate, message });
                const observed = await this.waitForCommunicationEntry(
                    communicationCapture,
                    entry => entry.source === teammate &&
                        String(entry.message || '').trim().includes(String(message || '').trim()),
                    5000
                );
                observedTeammateMessages.push(Boolean(observed));
                event(observed ? 'teammate_ack_observed' : 'teammate_ack_missing', { teammate, message });
            }

            const workItems = [];
            for (const spec of this.getContextWorkItemSpecs(context)) {
                const work = this.createContextWorkItem(sharedMemory, {
                    context,
                    namespace,
                    task,
                    localAgent,
                    claimant: teammate,
                    status: 'active',
                    spec,
                    source: 'explicit_role_baseline',
                    explicitPrompt: true
                });
                workItems.push(work);
            }
            event('explicit_baseline_work_items_seeded', {
                count: workItems.length,
                ids: workItems.map(work => work.id)
            });

            const timeoutMs = this.getContextTimeoutMs(context);
            for (const work of workItems) {
                const candidates = [
                    ...(context.collectionCandidates || context.alternatives || [])
                ].join(',');
                const collectCommand = `!evidenceCollectSupport("${this.escapeCommandString(task.id)}","${this.escapeCommandString(statePath)}","${this.escapeCommandString(work.id)}","${Number(work.count || 1)}","${this.escapeCommandString(candidates)}")`;
                await this.sendMonitorCommand(teammate, collectCommand);
                event('explicit_physical_collect_command_sent', {
                    teammate,
                    workId: work.id,
                    count: work.count,
                    command: '!evidenceCollectSupport(taskId,statePath,workId,count,candidates)'
                });
                const workState = await this.waitForWorkItemTerminalState(statePath, work.id, timeoutMs);
                event('explicit_physical_collect_finished', {
                    teammate,
                    workId: work.id,
                    status: workState?.status || null,
                    item: work.item,
                    count: work.count
                });
            }

            const finalState = await this.waitForSharedContextCompletion(
                statePath,
                namespace,
                workItems.length,
                timeoutMs
            );
            event('explicit_physical_completion_observed', {
                completedWorkItems: this.countCompletedWorkItems(finalState, namespace),
                timeoutMs
            });

            await this.sleep(1000);
            const verification = this.verifyNoPromptContextOutcome({ ...context, namespace }, finalState);
            const success = observedTeammateMessages.every(Boolean) && verification.success;
            event('objective_state_verified', verification);

            return {
                success,
                planQuality: success ? 'explicit_action_live_game_pass' : 'explicit_action_live_game_fail',
                metadata: {
                    ...(liveGame.metadata || {}),
                    category: task.category,
                    actualGameRun: true,
                    scriptedEvidenceExchange: true,
                    explicitRolePhysicalExecution: true,
                    soloRun: false,
                    teammate,
                    localMessageCount: localMessages.length,
                    teammateMessageCount: teammateMessages.length,
                    teammateMessagesObserved: observedTeammateMessages.filter(Boolean).length,
                    executionLog,
                    finalFailureReason: success ? null : verification.reason || `Expected in-game teammate acknowledgement from ${teammate} was not observed`,
                    objectiveSuccess: verification.success,
                    roleOverlapRate: verification.roleOverlapRate,
                    taskCoverageRate: verification.taskCoverageRate,
                    handoffSuccesses: verification.handoffSuccesses,
                    duplicateWorkUnits: verification.duplicateWorkUnits,
                    completedSubgoals: verification.completedSubgoals,
                    totalSubgoals: verification.totalSubgoals,
                    scenarioStatePath: statePath,
                    measuredInventory: verification.inventoryCounts,
                    measuredBlocks: verification.blockChecks
                }
            };
        } catch (err) {
            event('explicit_role_action_trial_error', { error: err.message });
            return {
                success: false,
                planQuality: 'explicit_action_live_game_error',
                metadata: {
                    category: task.category,
                    actualGameRun: true,
                    scriptedEvidenceExchange: true,
                    explicitRolePhysicalExecution: true,
                    teammate,
                    executionLog,
                    finalFailureReason: err.message,
                    scenarioStatePath: statePath,
                    ...(liveGame.metadata || {})
                }
            };
        } finally {
            restoreLocalChat();
            for (const remoteAgent of remoteRestoreCommands) {
                if (this.shouldKeepEvidenceChatSuspended(task)) {
                    event('teammate_chat_handling_left_suspended', { teammate: remoteAgent });
                    continue;
                }
                try {
                    await this.sendMonitorCommand(remoteAgent, '!evidenceSetChatHandling("on")');
                    event('teammate_chat_handling_restored', { teammate: remoteAgent });
                } catch (err) {
                    console.warn(`[TestRunner] Failed to restore chat handling for ${remoteAgent}:`, err.message);
                }
            }
        }
    }

    async executeDiverseModelAllocationGameTask(task) {
        const liveGame = task.liveGame || {};
        const context = liveGame.context || {};
        const workSpecs = Array.isArray(context.workItems) ? context.workItems : [];
        const baseline = liveGame.modelAllocationBaseline === true;
        const explicitCommunication = liveGame.explicitCommunicationBaseline === true;
        const matchedImplicitContext = liveGame.matchedImplicitContext === true;
        const matchedProtocol = explicitCommunication || matchedImplicitContext;
        const condition = explicitCommunication
            ? 'explicit_communication'
            : matchedImplicitContext
                ? 'matched_implicit_context'
                : baseline ? 'model_baseline' : 'implicit_context';
        const localAgent = this.agent;
        const teammateName = liveGame.teammate || 'Max';
        const teammateAgent = globalThis.__testingExtensionAgents?.[teammateName] || null;
        const localName = localAgent?.name || localAgent?.bot?.username || 'Lucy';
        const statePath = this.getScenarioStatePath(`${task.id}_attempt_${task.repeatContext?.attemptIndex || 1}`);
        const namespace = context.namespace || `diverse_${condition}`;
        const memory = new SharedMemory({ agentName: localName, path: statePath });
        const executionLog = [];
        const modelInteractionLog = [];
        const selectionRecords = [];
        const physicalExecutions = [];
        const explicitChatLog = [];
        const restoreLocalChat = this.suspendLocalChatHandling();
        let remoteChatSuspended = false;
        const event = (name, detail = {}) => {
            executionLog.push({
                order: executionLog.length + 1,
                event: name,
                timestamp: new Date().toISOString(),
                detail
            });
        };

        this.resetScenarioState(statePath);

        try {
            if (!teammateAgent) {
                throw new Error(`Diverse model benchmark requires in-process teammate ${teammateName}`);
            }
            if (workSpecs.length !== 3) {
                throw new Error(`Diverse model benchmark requires exactly three work items, found ${workSpecs.length}`);
            }

            event('diverse_model_trial_started', {
                taskId: task.id,
                condition,
                domain: context.domain,
                localAgent: localName,
                teammate: teammateName,
                statePath
            });

            await this.sendMonitorCommand(teammateName, '!evidenceSetChatHandling("off")');
            remoteChatSuspended = true;
            event('teammate_chat_handling_suspended', { teammate: teammateName });
            await this.sendMonitorCommand(teammateName, '!evidenceClearState');
            event('teammate_state_reset_requested', { teammate: teammateName });

            for (const agent of [localAgent, teammateAgent]) {
                if (agent.bot?.modes?.exists?.('cheat')) {
                    agent.bot.modes.setOn('cheat', false);
                }
                for (const mode of ['unstuck', 'self_preservation', 'self_defense', 'cowardice', 'hunting', 'torch_placing', 'item_collecting']) {
                    if (agent.bot?.modes?.exists?.(mode)) {
                        agent.bot.modes.pause(mode);
                    }
                }
            }
            event('work_teleportation_disabled', {
                agents: [localName, teammateName],
                cheatMode: false
            });

            await this.prepareNoPromptTrialIsolation(task, [localName, teammateName], event);
            await this.prepareNoPromptAgentVitals([localName, teammateName], event);
            await this.prepareDiverseModelArena([localName, teammateName], event);
            await this.prepareLiveRecordingCamera(task, teammateName, event);

            const bases = {
                [localName]: this.getRoundedAgentPosition(localAgent),
                [teammateName]: this.getRoundedAgentPosition(teammateAgent)
            };
            const attempt = Number(task?.repeatContext?.attemptIndex || 1);
            const decisionWorkSpecs = matchedProtocol
                ? this.getCounterbalancedWorkSpecs(workSpecs, context.domain, attempt)
                : workSpecs;
            localAgent.bot.chat(`[LIVE GAME TRIAL] ${task.name} attempt ${attempt}`);
            event('trial_announced_in_game', {
                message: `[LIVE GAME TRIAL] ${task.name} attempt ${attempt}`,
                bases,
                catalogOrder: decisionWorkSpecs.map(spec => spec.id)
            });

            const canonicalWork = new Map();
            if (!baseline && !explicitCommunication) {
                for (const spec of workSpecs) {
                    const work = memory.createWorkItem({
                        namespace,
                        kind: spec.actionType,
                        item: spec.id,
                        count: Number(spec.effortUnits || 1),
                        agent: localName,
                        claimant: null,
                        status: 'planned',
                        summary: spec.summary,
                        metadata: {
                            taskId: task.id,
                            workKey: spec.id,
                            domain: context.domain,
                            actionType: spec.actionType,
                            spec
                        }
                    });
                    canonicalWork.set(spec.id, work.id);
                }
                event('implicit_work_ledger_seeded', {
                    workIds: workSpecs.map(spec => spec.id),
                    namespace
                });
            }

            const agents = [localAgent, teammateAgent];
            if (explicitCommunication) {
                const leaderDecision = await this.requestDiverseModelSelection({
                    agent: localAgent,
                    task,
                    workSpecs: decisionWorkSpecs,
                    state: null,
                    namespace,
                    orderOffset: 0,
                    maxSelections: Number(context.selectionsPerAgent || 2)
                });
                modelInteractionLog.push(...leaderDecision.interactions);
                selectionRecords.push({
                    agent: localAgent.name,
                    selectedWorkIds: leaderDecision.selectedWorkIds,
                    rationale: leaderDecision.rationale,
                    parsed: leaderDecision.parsed,
                    stage: 'leader_initial_selection'
                });
                event('explicit_leader_selection_recorded', selectionRecords.at(-1));

                for (const workId of leaderDecision.selectedWorkIds) {
                    const spec = workSpecs.find(item => item.id === workId);
                    if (!spec) continue;
                    const result = await this.executeDiversePhysicalWork(localAgent, spec, bases[localName]);
                    physicalExecutions.push({ agent: localAgent.name, workId: spec.id, ...result });
                    event('explicit_leader_physical_work_finished', physicalExecutions.at(-1));
                }

                const completionMessage = await this.requestExplicitCompletionMessage({
                    agent: localAgent,
                    task,
                    workSpecs: decisionWorkSpecs,
                    executions: physicalExecutions.filter(entry => entry.agent === localAgent.name)
                });
                modelInteractionLog.push(...completionMessage.interactions);
                const leaderChat = this.formatExperimentChat('TEAM UPDATE', completionMessage.message);
                const leaderReceipt = this.waitForAgentChat(teammateAgent, localName, leaderChat, 5000);
                localAgent.bot.chat(leaderChat);
                const leaderObserved = await leaderReceipt;
                explicitChatLog.push({
                    sender: localName,
                    receiver: teammateName,
                    message: leaderChat,
                    observed: leaderObserved,
                    modelGenerated: completionMessage.parsed,
                    timestamp: new Date().toISOString()
                });
                event('explicit_leader_message_sent', explicitChatLog.at(-1));

                const followerDecision = await this.requestExplicitFollowerSelection({
                    agent: teammateAgent,
                    task,
                    workSpecs: decisionWorkSpecs,
                    teammateMessage: leaderChat
                });
                modelInteractionLog.push(...followerDecision.interactions);
                selectionRecords.push({
                    agent: teammateAgent.name,
                    selectedWorkIds: followerDecision.selectedWorkIds,
                    rationale: followerDecision.rationale,
                    parsed: followerDecision.parsed,
                    stage: 'follower_after_chat'
                });
                event('explicit_follower_selection_recorded', selectionRecords.at(-1));

                const followerChat = this.formatExperimentChat('TEAM CONFIRM', followerDecision.message);
                const followerReceipt = this.waitForAgentChat(localAgent, teammateName, followerChat, 5000);
                teammateAgent.bot.chat(followerChat);
                const followerObserved = await followerReceipt;
                explicitChatLog.push({
                    sender: teammateName,
                    receiver: localName,
                    message: followerChat,
                    observed: followerObserved,
                    modelGenerated: followerDecision.parsed && Boolean(followerDecision.message),
                    timestamp: new Date().toISOString()
                });
                event('explicit_follower_message_sent', explicitChatLog.at(-1));

                for (const workId of followerDecision.selectedWorkIds) {
                    const spec = workSpecs.find(item => item.id === workId);
                    if (!spec) continue;
                    const result = await this.executeDiversePhysicalWork(teammateAgent, spec, bases[teammateName]);
                    physicalExecutions.push({ agent: teammateAgent.name, workId: spec.id, ...result });
                    event('explicit_follower_physical_work_finished', physicalExecutions.at(-1));
                }
            } else if (baseline) {
                const decisions = await Promise.all(agents.map((agent, index) =>
                    this.requestDiverseModelSelection({
                        agent,
                        task,
                        workSpecs,
                        state: null,
                        namespace,
                        orderOffset: index,
                        maxSelections: Number(context.selectionsPerAgent || 2)
                    })
                ));

                for (let index = 0; index < agents.length; index++) {
                    const agent = agents[index];
                    const decision = decisions[index];
                    modelInteractionLog.push(...decision.interactions);
                    selectionRecords.push({
                        agent: agent.name,
                        selectedWorkIds: decision.selectedWorkIds,
                        rationale: decision.rationale,
                        parsed: decision.parsed
                    });
                    event('baseline_model_selection_recorded', selectionRecords.at(-1));

                    for (const workId of decision.selectedWorkIds) {
                        const spec = workSpecs.find(item => item.id === workId);
                        if (!spec) continue;
                        const ledger = memory.createWorkItem({
                            namespace,
                            kind: `${spec.actionType}_${agent.name}`,
                            item: `${spec.id}_${agent.name}`,
                            count: Number(spec.effortUnits || 1),
                            agent: agent.name,
                            claimant: agent.name,
                            status: 'active',
                            summary: spec.summary,
                            metadata: {
                                taskId: task.id,
                                workKey: spec.id,
                                domain: context.domain,
                                actionType: spec.actionType,
                                baselineIndependentSelection: true,
                                spec
                            }
                        });
                        const result = await this.executeDiversePhysicalWork(agent, spec, bases[agent.name]);
                        physicalExecutions.push({ agent: agent.name, workId: spec.id, ...result });
                        memory.completeWorkItem(ledger.id, {
                            status: result.success ? 'completed' : 'failed',
                            outputs: result,
                            result: result.success ? `${agent.name} physically completed ${spec.id}` : result.error
                        });
                        event('baseline_physical_work_finished', physicalExecutions.at(-1));
                    }
                }
            } else {
                for (let index = 0; index < agents.length; index++) {
                    const agent = agents[index];
                    const stateBeforeDecision = memory._load();
                    const decision = await this.requestDiverseModelSelection({
                        agent,
                        task,
                        workSpecs: decisionWorkSpecs,
                        state: stateBeforeDecision,
                        namespace,
                        orderOffset: matchedProtocol ? 0 : index,
                        maxSelections: Number(context.selectionsPerAgent || 2)
                    });
                    modelInteractionLog.push(...decision.interactions);
                    selectionRecords.push({
                        agent: agent.name,
                        selectedWorkIds: decision.selectedWorkIds,
                        rationale: decision.rationale,
                        parsed: decision.parsed
                    });
                    event('implicit_model_selection_recorded', selectionRecords.at(-1));

                    for (const workId of decision.selectedWorkIds) {
                        const spec = workSpecs.find(item => item.id === workId);
                        const ledgerId = canonicalWork.get(workId);
                        const current = (memory._load().workLedger || []).find(work => work.id === ledgerId);
                        if (!spec || !current) continue;
                        if (current.status !== 'planned') {
                            physicalExecutions.push({
                                agent: agent.name,
                                workId,
                                success: false,
                                executed: false,
                                protocolRejected: true,
                                observedStatus: current.status
                            });
                            event('implicit_nonplanned_selection_rejected', physicalExecutions.at(-1));
                            continue;
                        }

                        const claimed = memory.claimWorkItem(ledgerId, agent.name, {
                            status: 'active',
                            metadata: { selectedByModel: true, selectedAt: Date.now() }
                        });
                        if (!claimed || claimed.conflict) {
                            physicalExecutions.push({
                                agent: agent.name,
                                workId,
                                success: false,
                                executed: false,
                                protocolRejected: true,
                                observedStatus: claimed?.status || null
                            });
                            event('implicit_claim_conflict', physicalExecutions.at(-1));
                            continue;
                        }

                        const result = await this.executeDiversePhysicalWork(agent, spec, bases[agent.name]);
                        physicalExecutions.push({ agent: agent.name, workId: spec.id, ...result });
                        memory.completeWorkItem(ledgerId, {
                            status: result.success ? 'completed' : 'failed',
                            outputs: result,
                            result: result.success ? `${agent.name} physically completed ${spec.id}` : result.error
                        });
                        event('implicit_physical_work_finished', physicalExecutions.at(-1));
                    }
                }
            }

            const successful = physicalExecutions.filter(entry => entry.success && entry.executed !== false);
            const uniqueCompleted = [...new Set(successful.map(entry => entry.workId))];
            const seen = new Set();
            let duplicateWorkUnits = 0;
            let totalCompletedEffort = 0;
            for (const entry of successful) {
                const spec = workSpecs.find(item => item.id === entry.workId);
                const effort = Number(spec?.effortUnits || 1);
                totalCompletedEffort += effort;
                if (seen.has(entry.workId)) duplicateWorkUnits += effort;
                seen.add(entry.workId);
            }
            const objectiveSuccess = uniqueCompleted.length === workSpecs.length;
            const communicationSuccess = !explicitCommunication ||
                (explicitChatLog.length === 2 && explicitChatLog.every(entry => entry.observed && entry.modelGenerated));
            const success = objectiveSuccess && communicationSuccess;
            const taskCoverageRate = uniqueCompleted.length / workSpecs.length;
            const roleOverlapRate = totalCompletedEffort > 0 ? duplicateWorkUnits / totalCompletedEffort : 0;
            const prompts = modelInteractionLog.map(entry => entry.prompt).join('\n');
            const promptNeutralityAudit = !/duplicate|overlap|division of labor|role assignment|assigned role/i.test(prompts);
            const modelIds = [...new Set(modelInteractionLog.map(entry => entry.model).filter(Boolean))];

            event('diverse_model_objective_verified', {
                success,
                objectiveSuccess,
                communicationSuccess,
                uniqueCompleted,
                totalWorkItems: workSpecs.length,
                duplicateWorkUnits,
                taskCoverageRate,
                roleOverlapRate,
                promptNeutralityAudit,
                modelIds
            });

            return {
                success,
                planQuality: success ? 'heterogeneous_model_allocation_pass' : 'heterogeneous_model_allocation_fail',
                metadata: {
                    ...(liveGame.metadata || {}),
                    category: task.category,
                    actualGameRun: true,
                    scriptedEvidenceExchange: false,
                    modelInLoop: true,
                    modelIds,
                    modelApiCalls: modelInteractionLog.length,
                    modelInteractionLog,
                    selectionRecords,
                    physicalExecutions,
                    explicitChatLog,
                    executionLog,
                    objectiveSuccess,
                    communicationSuccess,
                    coordinationMode: explicitCommunication
                        ? 'model_generated_explicit_minecraft_chat'
                        : matchedImplicitContext
                            ? 'implicit_enhancer_shared_ledger'
                            : baseline ? 'independent_selection' : 'implicit_enhancer_shared_ledger',
                    catalogOrder: decisionWorkSpecs.map(spec => spec.id),
                    catalogOrderMatchedAcrossAgents: matchedProtocol,
                    explicitChatMessageCount: explicitChatLog.length,
                    explicitChatCharacterCount: explicitChatLog.reduce((sum, entry) => sum + entry.message.length, 0),
                    roleOverlapRate,
                    taskCoverageRate,
                    duplicateWorkUnits,
                    completedSubgoals: uniqueCompleted.length,
                    totalSubgoals: workSpecs.length,
                    handoffSuccesses: successful.length,
                    promptNeutralityAudit,
                    scenarioStatePath: statePath,
                    finalFailureReason: success
                        ? null
                        : !communicationSuccess
                            ? 'The model-generated Minecraft chat exchange was not observed by both agents'
                            : `Completed ${uniqueCompleted.length}/${workSpecs.length} distinct physical work items`
                }
            };
        } catch (err) {
            event('diverse_model_trial_error', { error: err.message });
            return {
                success: false,
                planQuality: 'heterogeneous_model_allocation_error',
                metadata: {
                    ...(liveGame.metadata || {}),
                    category: task.category,
                    actualGameRun: true,
                    scriptedEvidenceExchange: false,
                    modelInLoop: true,
                    modelInteractionLog,
                    selectionRecords,
                    physicalExecutions,
                    explicitChatLog,
                    executionLog,
                    scenarioStatePath: statePath,
                    finalFailureReason: err.message
                }
            };
        } finally {
            restoreLocalChat();
            if (remoteChatSuspended && !this.shouldKeepEvidenceChatSuspended(task)) {
                try {
                    await this.sendMonitorCommand(teammateName, '!evidenceSetChatHandling("on")');
                } catch (err) {
                    event('teammate_chat_handling_restore_failed', { teammate: teammateName, error: err.message });
                }
            }
        }
    }

    async executeKnowledgeReuseGameTask(task, communicationCapture) {
        const liveGame = task.liveGame || {};
        const context = liveGame.context || {};
        const condition = String(liveGame.knowledgeReuseCondition || 'normal');
        const localAgent = this.agent;
        const teammateName = liveGame.teammate || 'Max';
        const teammateAgent = globalThis.__testingExtensionAgents?.[teammateName] || null;
        const localName = localAgent?.name || localAgent?.bot?.username || 'Lucy';
        const attempt = Number(task?.repeatContext?.attemptIndex || 1);
        const statePath = this.getScenarioStatePath(`${task.id}_attempt_${attempt}`);
        const namespace = context.namespace || `knowledge_reuse_${condition}`;
        const memory = new SharedMemory({ agentName: localName, path: statePath });
        const executionLog = [];
        const modelInteractionLog = [];
        const explicitChatLog = [];
        const restoreLocalChat = this.suspendLocalChatHandling();
        let remoteChatSuspended = false;
        let arena = null;
        const event = (name, detail = {}) => {
            executionLog.push({
                order: executionLog.length + 1,
                event: name,
                timestamp: new Date().toISOString(),
                detail
            });
        };

        this.resetScenarioState(statePath);

        try {
            if (!teammateAgent) {
                throw new Error(`Knowledge-reuse benchmark requires in-process teammate ${teammateName}`);
            }
            if (!['normal', 'explicit', 'implicit'].includes(condition)) {
                throw new Error(`Unknown knowledge-reuse condition: ${condition}`);
            }

            event('knowledge_reuse_trial_started', {
                taskId: task.id,
                scenarioId: context.scenarioId,
                condition,
                localAgent: localName,
                teammate: teammateName,
                statePath
            });

            await this.sendMonitorCommand(teammateName, '!evidenceSetChatHandling("off")');
            remoteChatSuspended = true;
            event('teammate_chat_handling_suspended', { teammate: teammateName });
            await this.sendMonitorCommand(teammateName, '!evidenceClearState');
            event('teammate_state_reset_requested', { teammate: teammateName });

            for (const agent of [localAgent, teammateAgent]) {
                if (agent.bot?.modes?.exists?.('cheat')) {
                    agent.bot.modes.setOn('cheat', false);
                }
                for (const mode of ['unstuck', 'self_preservation', 'self_defense', 'cowardice', 'hunting', 'torch_placing', 'item_collecting']) {
                    if (agent.bot?.modes?.exists?.(mode)) {
                        agent.bot.modes.pause(mode);
                    }
                }
            }
            event('knowledge_work_teleportation_disabled', {
                agents: [localName, teammateName],
                cheatMode: false
            });

            await this.prepareNoPromptTrialIsolation(task, [localName, teammateName], event);
            await this.prepareNoPromptAgentVitals([localName, teammateName], event);
            arena = await this.prepareKnowledgeReuseArena(task, [localName, teammateName], event);
            await this.prepareLiveRecordingCamera(task, localName, event);

            localAgent.bot.chat(`[LIVE GAME TRIAL] ${task.name} attempt ${attempt}`);
            event('trial_announced_in_game', {
                message: `[LIVE GAME TRIAL] ${task.name} attempt ${attempt}`,
                targetSite: arena.targetSiteId,
                scoutOrder: arena.scoutOrder
            });

            const scout = await this.executeKnowledgeSiteSearch({
                agent: localAgent,
                siteOrder: arena.scoutOrder,
                sites: arena.sites,
                targetBlock: context.targetBlock,
                event,
                eventPrefix: 'scout'
            });
            if (!scout.success) {
                throw new Error(`Scout did not find ${context.targetBlock}`);
            }
            const discoveryTimestamp = Date.now();
            const discoveredSite = arena.sites.find(site => site.id === scout.foundSiteId);
            event('target_discovered', {
                siteId: scout.foundSiteId,
                targetBlock: context.targetBlock,
                position: discoveredSite.position,
                visitedSites: scout.visitedSites,
                discoveryDurationMs: scout.durationMs
            });

            let sharedFact = null;
            if (condition === 'implicit') {
                sharedFact = memory.recordWorldFact({
                    namespace,
                    type: 'knowledge_reuse_target',
                    name: `${context.scenarioId}_target`,
                    blockName: context.targetBlock,
                    resource: context.outputItem,
                    position: discoveredSite.position,
                    sourceAgent: localName,
                    confidence: 1,
                    notes: `${localName} physically observed ${context.targetBlock} at ${discoveredSite.id}`,
                    metadata: {
                        taskId: task.id,
                        scenarioId: context.scenarioId,
                        siteId: discoveredSite.id,
                        observedBlock: scout.observedBlock
                    }
                });
                event('implicit_world_fact_recorded', sharedFact);
            }

            const scoutReturned = Boolean(await this.withEvidenceActionTimeout(
                skills.goToPosition(localAgent.bot, arena.base.x - 2, arena.base.y, arena.base.z + 4, 2),
                30000,
                `${localName} return from discovery site`
            ));
            event('scout_returned_after_discovery', {
                agent: localName,
                returned: scoutReturned,
                position: this.getRoundedAgentPosition(localAgent),
                method: 'physical_pathfinding'
            });
            if (!scoutReturned) {
                throw new Error('Scout could not clear the target site after discovery');
            }

            const cameraName = this.findRecordingCameraPlayer([localName, teammateName]);
            if (cameraName) {
                await this.positionRecordingCamera(cameraName, teammateName, event, {
                    taskId: task.id,
                    attempt,
                    phase: 'knowledge_consumer'
                });
            }

            let consumerOrder = [];
            if (condition === 'normal') {
                const decision = await this.requestKnowledgeSearchOrder({
                    agent: teammateAgent,
                    task,
                    sites: arena.presentationOrder
                });
                modelInteractionLog.push(...decision.interactions);
                consumerOrder = decision.siteOrder;
                event('normal_consumer_search_order_selected', {
                    agent: teammateName,
                    siteOrder: consumerOrder,
                    parsed: decision.parsed
                });
            } else if (condition === 'explicit') {
                const report = await this.requestKnowledgeDiscoveryMessage({
                    agent: localAgent,
                    task,
                    discoveredSite,
                    targetBlock: context.targetBlock
                });
                modelInteractionLog.push(...report.interactions);
                const leaderChat = this.formatExperimentChat('KNOWLEDGE REPORT', report.message);
                const leaderReceipt = this.waitForAgentChat(teammateAgent, localName, leaderChat, 5000);
                localAgent.bot.chat(leaderChat);
                const leaderObserved = await leaderReceipt;
                explicitChatLog.push({
                    sender: localName,
                    receiver: teammateName,
                    message: leaderChat,
                    observed: leaderObserved,
                    modelGenerated: report.parsed,
                    timestamp: new Date().toISOString()
                });
                event('explicit_discovery_message_sent', explicitChatLog.at(-1));

                const decision = await this.requestKnowledgeTargetSelection({
                    agent: teammateAgent,
                    task,
                    sites: arena.presentationOrder,
                    evidenceLabel: 'Teammate Minecraft chat message',
                    evidence: leaderChat,
                    requireMessage: true
                });
                modelInteractionLog.push(...decision.interactions);
                consumerOrder = decision.siteId ? [decision.siteId] : [];
                const followerChat = this.formatExperimentChat('KNOWLEDGE CONFIRM', decision.message);
                const followerReceipt = this.waitForAgentChat(localAgent, teammateName, followerChat, 5000);
                teammateAgent.bot.chat(followerChat);
                const followerObserved = await followerReceipt;
                explicitChatLog.push({
                    sender: teammateName,
                    receiver: localName,
                    message: followerChat,
                    observed: followerObserved,
                    modelGenerated: decision.parsed,
                    timestamp: new Date().toISOString()
                });
                event('explicit_selection_confirmation_sent', explicitChatLog.at(-1));
            } else {
                const retrievedFacts = memory.queryWorldFacts({
                    namespace,
                    type: 'knowledge_reuse_target',
                    maxAgeMs: 5 * 60 * 1000
                });
                const decision = await this.requestKnowledgeTargetSelection({
                    agent: teammateAgent,
                    task,
                    sites: arena.presentationOrder,
                    evidenceLabel: 'ImplicitEnhancer structured world facts',
                    evidence: JSON.stringify(retrievedFacts),
                    requireMessage: false
                });
                modelInteractionLog.push(...decision.interactions);
                consumerOrder = decision.siteId ? [decision.siteId] : [];
                event('implicit_fact_retrieved_for_consumer', {
                    factCount: retrievedFacts.length,
                    selectedSite: decision.siteId,
                    parsed: decision.parsed
                });
            }

            const consumerSearch = await this.executeKnowledgeSiteSearch({
                agent: teammateAgent,
                siteOrder: consumerOrder,
                sites: arena.sites,
                targetBlock: context.targetBlock,
                event,
                eventPrefix: 'consumer'
            });
            const completion = consumerSearch.success
                ? await this.executeKnowledgeCompletion(teammateAgent, context, discoveredSite, event)
                : { success: false, error: 'Consumer did not reach the target site' };
            const postDiscoveryDurationMs = Date.now() - discoveryTimestamp;
            const communicationSuccess = condition !== 'explicit' ||
                (explicitChatLog.length === 2 && explicitChatLog.every(entry => entry.observed && entry.modelGenerated));
            const success = scout.success && consumerSearch.success && completion.success && communicationSuccess;
            const consumerSearchOverheadVisits = Math.max(0, consumerSearch.visitedSites.length - 1);
            const prompts = modelInteractionLog.map(entry => `${entry.systemPrompt || ''}\n${entry.prompt || ''}`).join('\n');
            const promptNeutralityAudit = !/duplicate|overlap|division of labor|assigned role|role assignment/i.test(prompts);
            const modelIds = [...new Set(modelInteractionLog.map(entry => entry.model).filter(Boolean))];

            event('knowledge_reuse_objective_verified', {
                success,
                condition,
                targetSite: arena.targetSiteId,
                consumerOrder,
                consumerVisitedSites: consumerSearch.visitedSites,
                consumerSearchOverheadVisits,
                completion,
                communicationSuccess,
                postDiscoveryDurationMs,
                modelApiCalls: modelInteractionLog.length
            });

            return {
                success,
                planQuality: success ? 'knowledge_reuse_pass' : 'knowledge_reuse_fail',
                metadata: {
                    ...(liveGame.metadata || {}),
                    category: task.category,
                    actualGameRun: true,
                    modelInLoop: true,
                    modelIds,
                    condition,
                    coordinationMode: condition === 'normal'
                        ? 'independent_search_no_team_knowledge'
                        : condition === 'explicit'
                            ? 'model_generated_explicit_knowledge_chat'
                            : 'implicit_enhancer_structured_world_fact',
                    modelApiCalls: modelInteractionLog.length,
                    modelInteractionLog,
                    explicitChatLog,
                    explicitChatMessageCount: explicitChatLog.length,
                    explicitChatCharacterCount: explicitChatLog.reduce((total, entry) => total + entry.message.length, 0),
                    executionLog,
                    scenarioStatePath: statePath,
                    targetSiteId: arena.targetSiteId,
                    targetPosition: discoveredSite.position,
                    scoutOrder: arena.scoutOrder,
                    scoutVisitedSites: scout.visitedSites,
                    scoutDiscoveryDurationMs: scout.durationMs,
                    consumerOrder,
                    consumerVisitedSites: consumerSearch.visitedSites,
                    consumerSearchDurationMs: consumerSearch.durationMs,
                    consumerSearchOverheadVisits,
                    postDiscoveryDurationMs,
                    structuredFactsUsed: condition === 'implicit' && sharedFact ? 1 : 0,
                    taskCoverageRate: completion.success ? 1 : 0,
                    completedSubgoals: completion.success ? 1 : 0,
                    totalSubgoals: 1,
                    duplicateWorkUnits: consumerSearchOverheadVisits,
                    roleOverlapRate: consumerSearchOverheadVisits / Math.max(1, consumerSearch.visitedSites.length),
                    completion,
                    communicationSuccess,
                    promptNeutralityAudit,
                    noWorkTeleportation: true,
                    setupTeleportationOnly: true,
                    finalFailureReason: success
                        ? null
                        : completion.error || 'Knowledge-reuse objective was not completed'
                }
            };
        } catch (err) {
            event('knowledge_reuse_trial_error', { error: err.message });
            return {
                success: false,
                planQuality: 'knowledge_reuse_error',
                metadata: {
                    ...(liveGame.metadata || {}),
                    category: task.category,
                    actualGameRun: true,
                    modelInLoop: true,
                    condition,
                    modelApiCalls: modelInteractionLog.length,
                    modelInteractionLog,
                    explicitChatLog,
                    executionLog,
                    scenarioStatePath: statePath,
                    finalFailureReason: err.message
                }
            };
        } finally {
            restoreLocalChat();
            if (arena?.base) {
                try {
                    await this.sendSetupCommand(
                        `/forceload remove ${arena.base.x - 32} ${arena.base.z - 32} ${arena.base.x + 32} ${arena.base.z + 32}`,
                        event
                    );
                    event('knowledge_reuse_chunks_released', { base: arena.base, setupOnly: true });
                } catch (err) {
                    event('knowledge_reuse_chunk_release_failed', { error: err.message });
                }
            }
            if (remoteChatSuspended && !this.shouldKeepEvidenceChatSuspended(task)) {
                try {
                    await this.sendMonitorCommand(teammateName, '!evidenceSetChatHandling("on")');
                } catch (err) {
                    event('teammate_chat_handling_restore_failed', { teammate: teammateName, error: err.message });
                }
            }
        }
    }

    getKnowledgeReuseArena(context, attempt) {
        const siteIds = ['site_alpha', 'site_beta', 'site_gamma'];
        const scenarioOffset = context.scenarioId === 'workstation' ? 1 : 0;
        const targetIndex = (Math.max(1, Number(attempt || 1)) - 1 + scenarioOffset) % siteIds.length;
        const base = {
            x: 3000 + scenarioOffset * 800 + (Math.max(1, Number(attempt || 1)) - 1) * 100,
            y: 100,
            z: 3000
        };
        const offsets = [
            { x: -24, z: 0 },
            { x: 0, z: -24 },
            { x: 24, z: 0 }
        ];
        const sites = siteIds.map((id, index) => ({
            id,
            position: { x: base.x + offsets[index].x, y: base.y, z: base.z + offsets[index].z }
        }));
        const scoutOrder = [siteIds[(targetIndex + 1) % 3], siteIds[targetIndex], siteIds[(targetIndex + 2) % 3]];
        const permutations = [
            [0, 1, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1], [2, 1, 0], [1, 0, 2]
        ];
        const presentation = permutations[(scenarioOffset * 5 + Math.max(1, Number(attempt || 1)) - 1) % permutations.length];
        return {
            base,
            sites,
            targetSiteId: siteIds[targetIndex],
            scoutOrder,
            presentationOrder: presentation.map(index => sites[index])
        };
    }

    async prepareKnowledgeReuseArena(task, agentNames, event) {
        const context = task.liveGame?.context || {};
        const attempt = Number(task?.repeatContext?.attemptIndex || 1);
        const arena = this.getKnowledgeReuseArena(context, attempt);
        const { base } = arena;
        const decoys = Array.isArray(context.decoyBlocks) ? context.decoyBlocks : ['stone', 'cobblestone'];
        const commands = [
            '/time set day',
            '/weather clear',
            `/fill ${base.x - 32} ${base.y} ${base.z - 32} ${base.x + 32} ${base.y + 4} ${base.z + 32} minecraft:air`,
            `/fill ${base.x - 32} ${base.y - 1} ${base.z - 32} ${base.x + 32} ${base.y - 1} ${base.z + 32} minecraft:stone`,
            `/tp ${agentNames[0]} ${base.x - 2} ${base.y} ${base.z + 4} 180 0`,
            `/tp ${agentNames[1]} ${base.x + 2} ${base.y} ${base.z + 4} 180 0`
        ];
        await this.sendSetupCommand(
            `/forceload add ${base.x - 32} ${base.z - 32} ${base.x + 32} ${base.z + 32}`,
            event
        );
        await this.sleep(1500);
        let decoyIndex = 0;
        for (const site of arena.sites) {
            const block = site.id === arena.targetSiteId
                ? context.targetBlock
                : decoys[decoyIndex++ % decoys.length];
            commands.push(`/setblock ${site.position.x} ${site.position.y} ${site.position.z} minecraft:${block}`);
        }
        for (const item of context.startingItems || []) {
            commands.push(`/give ${agentNames[1]} minecraft:${item.item} ${Number(item.count || 1)}`);
        }
        for (const command of commands) {
            await this.sendSetupCommand(command, event);
        }
        await this.sleep(750);
        event('knowledge_reuse_arena_prepared', {
            scenarioId: context.scenarioId,
            targetSiteId: arena.targetSiteId,
            targetBlock: context.targetBlock,
            sites: arena.sites,
            scoutOrder: arena.scoutOrder,
            presentationOrder: arena.presentationOrder.map(site => site.id),
            startingItems: context.startingItems || [],
            setupOnly: true,
            workTeleportation: false
        });
        return arena;
    }

    async executeKnowledgeSiteSearch({ agent, siteOrder, sites, targetBlock, event, eventPrefix }) {
        const startedAt = Date.now();
        const visitedSites = [];
        let foundSiteId = null;
        let observedBlock = null;
        for (const siteId of siteOrder) {
            const site = sites.find(candidate => candidate.id === siteId);
            if (!site) continue;
            let reached = false;
            let error = null;
            try {
                reached = Boolean(await this.withEvidenceActionTimeout(
                    skills.goToPosition(agent.bot, site.position.x, site.position.y, site.position.z, 2),
                    30000,
                    `${agent.name} search ${siteId}`
                ));
            } catch (err) {
                error = err.message;
            }
            observedBlock = agent.bot.blockAt(new Vec3(site.position.x, site.position.y, site.position.z))?.name || null;
            visitedSites.push(siteId);
            event(`${eventPrefix}_site_inspected`, {
                agent: agent.name,
                siteId,
                position: site.position,
                reached,
                observedBlock,
                targetBlock,
                error
            });
            if (reached && observedBlock === targetBlock) {
                foundSiteId = siteId;
                break;
            }
        }
        return {
            success: Boolean(foundSiteId),
            foundSiteId,
            observedBlock,
            visitedSites,
            durationMs: Date.now() - startedAt
        };
    }

    async executeKnowledgeCompletion(agent, context, targetSite, event) {
        const startedAt = Date.now();
        try {
            if (context.completionAction === 'collect_target') {
                const before = this.getInventoryCountForAgent(agent, context.outputItem);
                const helperSuccess = await this.withEvidenceActionTimeout(
                    skills.collectBlock(agent.bot, context.targetBlock, 1),
                    30000,
                    `collect ${context.outputItem}`
                );
                await this.sleep(750);
                const after = this.getInventoryCountForAgent(agent, context.outputItem);
                const result = {
                    success: Boolean(helperSuccess) && after > before,
                    action: 'collect_target',
                    outputItem: context.outputItem,
                    observedBefore: before,
                    observedAfter: after,
                    durationMs: Date.now() - startedAt
                };
                event('knowledge_target_completion_finished', result);
                return result;
            }

            if (context.completionAction === 'craft_at_target') {
                const table = agent.bot.blockAt(new Vec3(targetSite.position.x, targetSite.position.y, targetSite.position.z));
                if (table?.name !== context.targetBlock) {
                    throw new Error(`Expected ${context.targetBlock} at selected site, observed ${table?.name || 'nothing'}`);
                }
                const before = this.getInventoryCountForAgent(agent, context.outputItem);
                const helperSuccess = await this.withEvidenceActionTimeout(
                    skills.craftRecipe(agent.bot, context.outputItem, 1),
                    30000,
                    `craft ${context.outputItem}`
                );
                const after = this.getInventoryCountForAgent(agent, context.outputItem);
                const result = {
                    success: Boolean(helperSuccess) && after > before,
                    action: 'craft_at_target',
                    outputItem: context.outputItem,
                    workstationPosition: targetSite.position,
                    observedBefore: before,
                    observedAfter: after,
                    durationMs: Date.now() - startedAt
                };
                event('knowledge_target_completion_finished', result);
                return result;
            }

            throw new Error(`Unsupported knowledge completion action: ${context.completionAction}`);
        } catch (err) {
            const result = {
                success: false,
                action: context.completionAction,
                error: err.message,
                durationMs: Date.now() - startedAt
            };
            event('knowledge_target_completion_failed', result);
            return result;
        }
    }

    async requestKnowledgeSearchOrder({ agent, task, sites }) {
        const model = agent?.prompter?.chat_model;
        if (!model?.sendRequest) throw new Error(`Chat model is unavailable for ${agent?.name || 'unknown agent'}`);
        const siteIds = sites.map(site => site.id);
        const systemPrompt = [
            'Choose a Minecraft field-site search order.',
            'Return JSON only with keys site_order and rationale.',
            'Include every listed site exactly once.',
            'The target identity is unknown.'
        ].join(' ');
        const prompt = [
            `Agent: ${agent.name}`,
            `Objective: ${task.command}`,
            `Available sites: ${JSON.stringify(siteIds)}`,
            'No teammate observation or shared world fact is available.',
            `Required JSON shape: ${JSON.stringify({ site_order: siteIds, rationale: 'brief reason' })}`
        ].join('\n');
        const interactions = [];
        let parsed = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
            const attemptPrompt = attempt === 1 ? prompt : `${prompt}\nThe previous response was invalid. Return only the required JSON.`;
            const response = await model.sendRequest([{ role: 'user', content: attemptPrompt }], systemPrompt, null);
            parsed = this.parseKnowledgeSiteOrder(response, siteIds);
            interactions.push({
                interactionType: 'knowledge_normal_search_order',
                agent: agent.name,
                provider: model.constructor?.name || null,
                model: model.model_name || null,
                attempt,
                systemPrompt,
                prompt: attemptPrompt,
                response: String(response || ''),
                parsed: parsed.valid,
                siteOrder: parsed.siteOrder,
                error: parsed.error
            });
            if (parsed.valid) break;
        }
        return { siteOrder: parsed?.siteOrder || [], rationale: parsed?.rationale || '', parsed: Boolean(parsed?.valid), interactions };
    }

    parseKnowledgeSiteOrder(response, siteIds) {
        try {
            const parsed = this.parseJsonObject(response);
            const order = Array.isArray(parsed.site_order) ? parsed.site_order.map(String) : [];
            const allowed = new Set(siteIds);
            const valid = order.length === siteIds.length && new Set(order).size === siteIds.length && order.every(id => allowed.has(id));
            return valid
                ? { valid: true, siteOrder: order, rationale: String(parsed.rationale || ''), error: null }
                : { valid: false, siteOrder: order, rationale: String(parsed.rationale || ''), error: 'Expected each available site exactly once' };
        } catch (err) {
            return { valid: false, siteOrder: [], rationale: '', error: err.message };
        }
    }

    async requestKnowledgeDiscoveryMessage({ agent, task, discoveredSite, targetBlock }) {
        const model = agent?.prompter?.chat_model;
        if (!model?.sendRequest) throw new Error(`Chat model is unavailable for ${agent?.name || 'unknown agent'}`);
        const systemPrompt = [
            'Report one physically observed Minecraft location to a teammate.',
            'Return JSON only with keys site_id and message.',
            'The site_id must match the observation and the message must include that exact site ID.',
            'Do not add unobserved locations.'
        ].join(' ');
        const prompt = [
            `Objective: ${task.command}`,
            `Observed target: ${JSON.stringify({ site_id: discoveredSite.id, block: targetBlock, position: discoveredSite.position })}`,
            `Required JSON shape: ${JSON.stringify({ site_id: discoveredSite.id, message: `${targetBlock} observed at ${discoveredSite.id}` })}`
        ].join('\n');
        const interactions = [];
        let parsed = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
            const attemptPrompt = attempt === 1 ? prompt : `${prompt}\nThe previous response was invalid. Return only the required JSON.`;
            const response = await model.sendRequest([{ role: 'user', content: attemptPrompt }], systemPrompt, null);
            parsed = this.parseKnowledgeMessage(response, discoveredSite.id);
            interactions.push({
                interactionType: 'knowledge_explicit_discovery_message',
                agent: agent.name,
                provider: model.constructor?.name || null,
                model: model.model_name || null,
                attempt,
                systemPrompt,
                prompt: attemptPrompt,
                response: String(response || ''),
                parsed: parsed.valid,
                siteId: parsed.siteId,
                message: parsed.message,
                error: parsed.error
            });
            if (parsed.valid) break;
        }
        return { siteId: parsed?.siteId || '', message: parsed?.message || '', parsed: Boolean(parsed?.valid), interactions };
    }

    parseKnowledgeMessage(response, expectedSiteId) {
        try {
            const parsed = this.parseJsonObject(response);
            const siteId = String(parsed.site_id || '');
            const message = String(parsed.message || '').replace(/\s+/g, ' ').trim();
            const valid = siteId === expectedSiteId && message.length > 0 && message.length <= 180 && message.includes(expectedSiteId);
            return valid
                ? { valid: true, siteId, message, error: null }
                : { valid: false, siteId, message, error: 'Expected the observed site ID and a matching message of at most 180 characters' };
        } catch (err) {
            return { valid: false, siteId: '', message: '', error: err.message };
        }
    }

    async requestKnowledgeTargetSelection({ agent, task, sites, evidenceLabel, evidence, requireMessage }) {
        const model = agent?.prompter?.chat_model;
        if (!model?.sendRequest) throw new Error(`Chat model is unavailable for ${agent?.name || 'unknown agent'}`);
        const siteIds = sites.map(site => site.id);
        const systemPrompt = [
            'Choose one Minecraft field site supported by the supplied observation.',
            `Return JSON only with keys site_id, rationale${requireMessage ? ', and message' : ''}.`,
            'Choose exactly one listed site ID.',
            ...(requireMessage ? ['The message must include the exact selected site ID.'] : [])
        ].join(' ');
        const example = { site_id: siteIds[0], rationale: 'brief evidence-based reason' };
        if (requireMessage) example.message = `Proceeding to ${siteIds[0]}`;
        const prompt = [
            `Agent: ${agent.name}`,
            `Objective: ${task.command}`,
            `Available sites: ${JSON.stringify(siteIds)}`,
            `${evidenceLabel}: ${evidence}`,
            `Required JSON shape: ${JSON.stringify(example)}`
        ].join('\n');
        const interactions = [];
        let parsed = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
            const attemptPrompt = attempt === 1 ? prompt : `${prompt}\nThe previous response was invalid. Return only the required JSON.`;
            const response = await model.sendRequest([{ role: 'user', content: attemptPrompt }], systemPrompt, null);
            parsed = this.parseKnowledgeTargetSelection(response, siteIds, requireMessage);
            interactions.push({
                interactionType: requireMessage ? 'knowledge_explicit_target_selection' : 'knowledge_implicit_target_selection',
                agent: agent.name,
                provider: model.constructor?.name || null,
                model: model.model_name || null,
                attempt,
                systemPrompt,
                prompt: attemptPrompt,
                response: String(response || ''),
                parsed: parsed.valid,
                siteId: parsed.siteId,
                message: parsed.message,
                error: parsed.error
            });
            if (parsed.valid) break;
        }
        return {
            siteId: parsed?.siteId || '',
            rationale: parsed?.rationale || '',
            message: parsed?.message || '',
            parsed: Boolean(parsed?.valid),
            interactions
        };
    }

    parseKnowledgeTargetSelection(response, siteIds, requireMessage) {
        try {
            const parsed = this.parseJsonObject(response);
            const siteId = String(parsed.site_id || '');
            const message = String(parsed.message || '').replace(/\s+/g, ' ').trim();
            const valid = siteIds.includes(siteId) && (!requireMessage || (message.length > 0 && message.length <= 180 && message.includes(siteId)));
            return valid
                ? { valid: true, siteId, rationale: String(parsed.rationale || ''), message, error: null }
                : { valid: false, siteId, rationale: String(parsed.rationale || ''), message, error: 'Expected one listed site ID and the required matching message' };
        } catch (err) {
            return { valid: false, siteId: '', rationale: '', message: '', error: err.message };
        }
    }

    parseJsonObject(response) {
        const text = String(response || '').trim();
        const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
        const candidate = fenced ? fenced[1].trim() : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
        return JSON.parse(candidate);
    }

    getCounterbalancedWorkSpecs(workSpecs, domain, attempt) {
        const permutations = [
            [0, 1, 2],
            [1, 2, 0],
            [2, 0, 1],
            [0, 2, 1],
            [2, 1, 0],
            [1, 0, 2]
        ];
        const domains = ['acquisition', 'construction', 'crafting', 'exploration'];
        const domainIndex = Math.max(0, domains.indexOf(String(domain || '')));
        const permutationIndex = (domainIndex * 5 + Math.max(0, Number(attempt || 1) - 1)) % permutations.length;
        return permutations[permutationIndex].map(index => workSpecs[index]);
    }

    formatExperimentChat(label, message) {
        const normalized = String(message || '(no valid model message)').replace(/\s+/g, ' ').trim();
        return `[${label}] ${normalized}`.slice(0, 240);
    }

    waitForAgentChat(agent, expectedSource, expectedMessage, timeoutMs = 5000) {
        const bot = agent?.bot;
        if (!bot?.on || !bot?.off) return Promise.resolve(false);
        return new Promise(resolve => {
            let settled = false;
            const finish = value => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                bot.off('chat', onChat);
                resolve(value);
            };
            const onChat = (source, message) => {
                if (source === expectedSource && String(message || '').includes(expectedMessage)) {
                    finish(true);
                }
            };
            const timer = setTimeout(() => finish(false), timeoutMs);
            bot.on('chat', onChat);
        });
    }

    async requestExplicitCompletionMessage({ agent, task, workSpecs, executions }) {
        const model = agent?.prompter?.chat_model;
        if (!model?.sendRequest) {
            throw new Error(`Chat model is unavailable for ${agent?.name || 'unknown agent'}`);
        }
        const systemPrompt = [
            'Report observed Minecraft work results to a teammate.',
            'Return JSON only with one key named message.',
            'The message must name the completed or failed work IDs and stay below 180 characters.',
            'Do not assign roles or claim work that was not observed.'
        ].join(' ');
        const prompt = [
            `Agent: ${agent.name}`,
            `Objective: ${task.command}`,
            `Work catalog: ${JSON.stringify(workSpecs.map(spec => ({ id: spec.id, summary: spec.summary })))}`,
            `Observed executions: ${JSON.stringify(executions.map(entry => ({ work_id: entry.workId, success: entry.success, error: entry.error || null })))}`,
            'Required JSON shape: {"message":"brief factual teammate update"}'
        ].join('\n');
        const interactions = [];
        let parsed = null;

        for (let attempt = 1; attempt <= 2; attempt++) {
            const attemptPrompt = attempt === 1
                ? prompt
                : `${prompt}\nThe previous response was invalid. Return only the required JSON object.`;
            const rawResponse = await model.sendRequest(
                [{ role: 'user', content: attemptPrompt }],
                systemPrompt,
                null
            );
            parsed = this.parseExplicitMessage(rawResponse);
            interactions.push({
                interactionType: 'explicit_completion_message',
                agent: agent.name,
                provider: model.constructor?.name || null,
                model: model.model_name || null,
                attempt,
                systemPrompt,
                prompt: attemptPrompt,
                response: String(rawResponse || ''),
                parsed: parsed.valid,
                message: parsed.message,
                error: parsed.error
            });
            if (parsed.valid) break;
        }

        return {
            message: parsed?.message || '',
            parsed: Boolean(parsed?.valid),
            interactions
        };
    }

    async requestExplicitFollowerSelection({ agent, task, workSpecs, teammateMessage }) {
        const model = agent?.prompter?.chat_model;
        if (!model?.sendRequest) {
            throw new Error(`Chat model is unavailable for ${agent?.name || 'unknown agent'}`);
        }
        const systemPrompt = [
            'Choose one Minecraft job after reading a teammate message.',
            'Return JSON only with keys selected_work_ids, rationale, and message.',
            'Select exactly one listed work ID so the team completes all three distinct jobs.',
            'The message must briefly confirm the selected work ID.',
            'Do not assign roles or invent work IDs.'
        ].join(' ');
        const workCatalog = workSpecs.map(spec => ({
            id: spec.id,
            action_type: spec.actionType,
            summary: spec.summary
        }));
        const prompt = [
            `Agent: ${agent.name}`,
            `Objective: ${task.command}`,
            `Work catalog: ${JSON.stringify(workCatalog)}`,
            `Teammate Minecraft chat message: ${JSON.stringify(teammateMessage)}`,
            'No shared-memory status is available in this condition.',
            'Required JSON shape: {"selected_work_ids":["work_id"],"rationale":"brief reason","message":"brief teammate confirmation"}'
        ].join('\n');
        const interactions = [];
        let parsed = null;

        for (let attempt = 1; attempt <= 2; attempt++) {
            const attemptPrompt = attempt === 1
                ? prompt
                : `${prompt}\nThe previous response was invalid. Return only the required JSON object.`;
            const rawResponse = await model.sendRequest(
                [{ role: 'user', content: attemptPrompt }],
                systemPrompt,
                null
            );
            parsed = this.parseDiverseModelSelection(rawResponse, workSpecs, 1);
            if (parsed.valid && !parsed.message.trim()) {
                parsed = { ...parsed, valid: false, error: 'Expected a non-empty teammate confirmation message' };
            }
            interactions.push({
                interactionType: 'explicit_follower_selection',
                agent: agent.name,
                provider: model.constructor?.name || null,
                model: model.model_name || null,
                attempt,
                systemPrompt,
                prompt: attemptPrompt,
                response: String(rawResponse || ''),
                parsed: parsed.valid,
                selectedWorkIds: parsed.selectedWorkIds,
                message: parsed.message,
                error: parsed.error
            });
            if (parsed.valid) break;
        }

        return {
            selectedWorkIds: parsed?.selectedWorkIds || [],
            rationale: parsed?.rationale || '',
            message: parsed?.message || '',
            parsed: Boolean(parsed?.valid),
            interactions
        };
    }

    parseExplicitMessage(rawResponse) {
        const text = String(rawResponse || '').trim();
        const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
        const candidate = fenced ? fenced[1].trim() : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
        try {
            const parsed = JSON.parse(candidate);
            const message = String(parsed.message || '').replace(/\s+/g, ' ').trim();
            if (!message || message.length > 180) {
                return { valid: false, message, error: 'Expected a non-empty message of at most 180 characters' };
            }
            return { valid: true, message, error: null };
        } catch (err) {
            return { valid: false, message: '', error: err.message };
        }
    }

    async requestDiverseModelSelection({
        agent,
        task,
        workSpecs,
        state,
        namespace,
        orderOffset = 0,
        maxSelections = 2
    }) {
        const model = agent?.prompter?.chat_model;
        if (!model?.sendRequest) {
            throw new Error(`Chat model is unavailable for ${agent?.name || 'unknown agent'}`);
        }

        const ordered = workSpecs.slice(orderOffset).concat(workSpecs.slice(0, orderOffset));
        const ledger = state
            ? (state.workLedger || []).filter(work => (work.namespace || 'default') === namespace)
            : [];
        const statuses = Object.fromEntries(workSpecs.map(spec => {
            const work = ledger.find(entry => entry.metadata?.workKey === spec.id || entry.item === spec.id);
            return [spec.id, work ? {
                status: work.status,
                claimant: work.claimant || null,
                result: work.result || null
            } : { status: 'planned', claimant: null, result: null }];
        }));
        const workCatalog = ordered.map(spec => ({
            id: spec.id,
            action_type: spec.actionType,
            summary: spec.summary,
            status: statuses[spec.id]?.status || 'planned',
            claimant: statuses[spec.id]?.claimant || null
        }));
        const plannedCount = workCatalog.filter(work => work.status === 'planned').length;
        const requiredSelections = Math.min(maxSelections, plannedCount || maxSelections);
        const selectionExample = Array.from(
            { length: requiredSelections },
            (_, index) => `work_id_${index + 1}`
        );
        const systemPrompt = [
            'You are making one Minecraft work-selection decision.',
            'Return JSON only with keys selected_work_ids and rationale.',
            `Select exactly ${requiredSelections} listed work ID${requiredSelections === 1 ? '' : 's'} whose status is planned.`,
            'Do not invent IDs or describe actions outside the JSON.'
        ].join(' ');
        const prompt = [
            `Agent: ${agent.name}`,
            `Objective: ${task.command}`,
            `Work catalog: ${JSON.stringify(workCatalog)}`,
            state
                ? `ImplicitEnhancer shared-state snapshot: ${JSON.stringify(statuses)}`
                : 'ImplicitEnhancer shared-state snapshot: unavailable in this condition.',
            `Required JSON shape: ${JSON.stringify({ selected_work_ids: selectionExample, rationale: 'brief reason' })}`
        ].join('\n');
        const interactions = [];
        let parsed = null;

        for (let attempt = 1; attempt <= 2; attempt++) {
            const attemptPrompt = attempt === 1
                ? prompt
                : `${prompt}\nThe previous response was not valid for this schema. Return only the required JSON object.`;
            const rawResponse = await model.sendRequest(
                [{ role: 'user', content: attemptPrompt }],
                systemPrompt,
                null
            );
            parsed = this.parseDiverseModelSelection(rawResponse, workSpecs, requiredSelections);
            interactions.push({
                agent: agent.name,
                provider: model.constructor?.name || null,
                model: model.model_name || null,
                attempt,
                systemPrompt,
                prompt: attemptPrompt,
                response: String(rawResponse || ''),
                parsed: parsed.valid,
                selectedWorkIds: parsed.selectedWorkIds,
                error: parsed.error
            });
            if (parsed.valid) break;
        }

        return {
            selectedWorkIds: parsed?.selectedWorkIds || [],
            rationale: parsed?.rationale || '',
            message: parsed?.message || '',
            parsed: Boolean(parsed?.valid),
            interactions
        };
    }

    parseDiverseModelSelection(rawResponse, workSpecs, requiredSelections) {
        const text = String(rawResponse || '').trim();
        const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
        const candidate = fenced ? fenced[1].trim() : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
        try {
            const parsed = JSON.parse(candidate);
            const ids = Array.isArray(parsed.selected_work_ids) ? parsed.selected_work_ids.map(String) : [];
            const validIds = new Set(workSpecs.map(spec => spec.id));
            const selectedWorkIds = [...new Set(ids.filter(id => validIds.has(id)))];
            const hasExactCardinality = ids.length === requiredSelections;
            const allIdsValid = ids.every(id => validIds.has(id));
            const allIdsUnique = selectedWorkIds.length === ids.length;
            if (!hasExactCardinality || !allIdsValid || !allIdsUnique) {
                return {
                    valid: false,
                    selectedWorkIds,
                    rationale: String(parsed.rationale || ''),
                    message: String(parsed.message || ''),
                    error: `Expected exactly ${requiredSelections} unique valid work IDs, received ${ids.length}`
                };
            }
            return {
                valid: true,
                selectedWorkIds,
                rationale: String(parsed.rationale || ''),
                message: String(parsed.message || ''),
                error: null
            };
        } catch (err) {
            return { valid: false, selectedWorkIds: [], rationale: '', message: '', error: err.message };
        }
    }

    async prepareDiverseModelArena(agentNames, event = null) {
        const commands = [
            '/time set day',
            '/weather clear'
        ];
        for (const name of [...new Set(agentNames.filter(Boolean))]) {
            commands.push(
                `/execute at ${name} run fill ~2 ~ ~-5 ~5 ~ ~-3 minecraft:dirt replace air`,
                `/execute at ${name} run fill ~2 ~ ~3 ~5 ~ ~5 minecraft:sand replace air`,
                `/execute at ${name} run fill ~-5 ~ ~-1 ~-3 ~ ~1 minecraft:oak_log replace air`,
                `/execute at ${name} run setblock ~4 ~ ~4 minecraft:gold_block`,
                `/execute at ${name} run setblock ~-4 ~ ~4 minecraft:iron_block`,
                `/execute at ${name} run setblock ~4 ~ ~-4 minecraft:lapis_block`
            );
        }
        for (const command of commands) {
            await this.sendSetupCommand(command, event);
        }
        await this.sleep(750);
        if (event) {
            event('diverse_model_arena_prepared', {
                agents: agentNames,
                commands,
                setupOnly: true,
                domains: ['acquisition', 'construction', 'crafting', 'exploration']
            });
        }
    }

    getRoundedAgentPosition(agent) {
        const position = agent?.bot?.entity?.position;
        if (!position) return null;
        return {
            x: Math.round(position.x),
            y: Math.floor(position.y),
            z: Math.round(position.z)
        };
    }

    async executeDiversePhysicalWork(agent, spec, base) {
        const startedAt = Date.now();
        try {
            if (!agent?.bot || !base) {
                throw new Error('Agent or base position is unavailable');
            }
            let evidence = null;
            if (spec.actionType === 'collect') {
                evidence = await this.collectDiverseBlock(agent, spec.block, spec.outputItem, Number(spec.count || 1));
            } else if (spec.actionType === 'build') {
                const collection = await this.collectDiverseBlock(agent, spec.block, spec.outputItem, 1);
                if (!collection.success) throw new Error(collection.error || `Could not collect ${spec.block}`);
                const target = {
                    x: base.x + Number(spec.targetOffset?.x || 0),
                    y: base.y + Number(spec.targetOffset?.y || 0),
                    z: base.z + Number(spec.targetOffset?.z || 0)
                };
                const placed = await skills.placeBlock(agent.bot, spec.block, target.x, target.y, target.z, 'bottom', true);
                const observed = agent.bot.blockAt(new Vec3(target.x, target.y, target.z))?.name || null;
                evidence = {
                    success: observed === spec.block,
                    collection,
                    target,
                    helperReportedSuccess: Boolean(placed),
                    observed
                };
            } else if (spec.actionType === 'craft') {
                const collection = await this.collectDiverseBlock(agent, spec.sourceBlock, spec.sourceBlock, 1);
                if (!collection.success) throw new Error(collection.error || `Could not collect ${spec.sourceBlock}`);
                const before = this.getInventoryCountForAgent(agent, spec.outputItem);
                const recipeResults = [];
                for (const recipe of spec.recipe || []) {
                    recipeResults.push({ recipe, success: await skills.craftRecipe(agent.bot, recipe, 1) });
                }
                const after = this.getInventoryCountForAgent(agent, spec.outputItem);
                evidence = {
                    success: recipeResults.every(result => result.success) && after - before >= Number(spec.outputCount || 1),
                    collection,
                    recipeResults,
                    outputItem: spec.outputItem,
                    observedBefore: before,
                    observedAfter: after,
                    crafted: Math.max(0, after - before)
                };
            } else if (spec.actionType === 'explore') {
                const marker = world.getNearestBlock(agent.bot, spec.markerBlock, 12);
                if (!marker?.position) throw new Error(`Marker ${spec.markerBlock} was not found`);
                const reached = await skills.goToPosition(
                    agent.bot,
                    marker.position.x,
                    marker.position.y,
                    marker.position.z,
                    1.5
                );
                const distance = agent.bot.entity.position.distanceTo(marker.position);
                evidence = {
                    success: Boolean(reached) && distance <= 2.5 && agent.bot.blockAt(marker.position)?.name === spec.markerBlock,
                    markerBlock: spec.markerBlock,
                    markerPosition: { x: marker.position.x, y: marker.position.y, z: marker.position.z },
                    finalPosition: this.getRoundedAgentPosition(agent),
                    distance
                };
            } else {
                throw new Error(`Unsupported diverse work action: ${spec.actionType}`);
            }

            return {
                success: Boolean(evidence?.success),
                executed: true,
                actionType: spec.actionType,
                durationMs: Date.now() - startedAt,
                evidence,
                error: evidence?.success ? null : `Physical ${spec.actionType} predicate failed`
            };
        } catch (err) {
            return {
                success: false,
                executed: true,
                actionType: spec.actionType,
                durationMs: Date.now() - startedAt,
                evidence: null,
                error: err.message
            };
        }
    }

    async collectDiverseBlock(agent, blockName, outputItem, count) {
        const bot = agent?.bot;
        const requested = Math.max(1, Number(count || 1));
        const before = this.getInventoryCountForAgent(agent, outputItem);
        const attempted = [];
        const excluded = new Set();

        for (let attempt = 0; attempt < requested * 8; attempt++) {
            const observed = this.getInventoryCountForAgent(agent, outputItem) - before;
            if (observed >= requested) {
                return { success: true, blockName, outputItem, requested, collected: observed, attempted };
            }
            const botPosition = bot.entity?.position;
            const blocks = world.getNearestBlocks(bot, [blockName], 8)
                .filter(block => block?.position)
                .filter(block => !excluded.has(`${block.position.x},${block.position.y},${block.position.z}`))
                .filter(block => !botPosition || botPosition.distanceTo(block.position) > 1.4);
            if (blocks.length === 0) break;
            const block = blocks[0];
            excluded.add(`${block.position.x},${block.position.y},${block.position.z}`);
            const position = { x: block.position.x, y: block.position.y, z: block.position.z };
            let error = null;
            try {
                await this.withEvidenceActionTimeout(
                    skills.breakBlockAt(bot, position.x, position.y, position.z),
                    12000,
                    `break ${blockName}`
                );
                await this.withEvidenceActionTimeout(
                    skills.pickupNearbyItems(bot),
                    this.getEvidencePickupTimeoutMs(),
                    `pickup ${outputItem}`
                );
            } catch (err) {
                error = err.message;
            }
            attempted.push({ position, error });
            await this.sleep(150);
        }

        const collected = Math.max(0, this.getInventoryCountForAgent(agent, outputItem) - before);
        return {
            success: collected >= requested,
            blockName,
            outputItem,
            requested,
            collected,
            attempted,
            error: collected >= requested ? null : `Collected ${collected}/${requested} ${outputItem}`
        };
    }

    async executeDecomposedChecklistBaselineGameTask(task, communicationCapture) {
        const liveGame = task.liveGame || {};
        const context = liveGame.context || {};
        const namespace = context.namespace || 'required_decomposed_baseline';
        const teammate = liveGame.teammate || 'Max';
        const localAgent = this.agent?.name || this.agent?.bot?.username || 'Lucy';
        const statePath = this.getScenarioStatePath(`${task.id}_attempt_${task.repeatContext?.attemptIndex || 1}`);
        const sharedMemory = new SharedMemory({ agentName: localAgent, path: statePath });
        const localMessages = liveGame.localMessages || [];
        const teammateMessages = liveGame.teammateMessages || [];
        const executionLog = [];
        const restoreLocalChat = this.suspendLocalChatHandling();
        const remoteRestoreCommands = [];
        const event = (name, detail = {}) => {
            executionLog.push({
                order: executionLog.length + 1,
                event: name,
                timestamp: new Date().toISOString(),
                detail
            });
        };

        this.resetScenarioState(statePath);

        try {
            event('decomposed_checklist_baseline_started', {
                taskId: task.id,
                localAgent,
                teammate,
                statePath
            });

            await this.sendMonitorCommand(teammate, '!evidenceSetChatHandling("off")');
            remoteRestoreCommands.push(teammate);
            event('teammate_chat_handling_suspended', { teammate });

            await this.sendMonitorCommand(teammate, '!evidenceClearState');
            event('teammate_state_reset_requested', { teammate });
            await this.sleep(500);

            await this.prepareNoPromptTrialIsolation(task, [localAgent, teammate], event);
            await this.prepareNoPromptAgentVitals([localAgent, teammate], event);
            await this.prepareLiveRecordingCamera(task, teammate, event);

            const attempt = Number(task?.repeatContext?.attemptIndex || 1);
            this.agent.bot.chat(`[LIVE GAME TRIAL] ${task.name} attempt ${attempt}`);
            event('trial_announced_in_game', { message: `[LIVE GAME TRIAL] ${task.name} attempt ${attempt}` });

            for (const message of localMessages) {
                await this.agent.openChat(message);
                event('baseline_local_checklist_message_sent', { agent: this.agent.name, message });
                await this.sleep(250);
            }

            const observedTeammateMessages = [];
            for (const message of teammateMessages) {
                await this.sendMonitorCommand(teammate, `!evidenceSay("${this.escapeCommandString(message)}")`);
                event('baseline_teammate_checklist_ack_requested', { teammate, message });
                const observed = await this.waitForCommunicationEntry(
                    communicationCapture,
                    entry => entry.source === teammate &&
                        String(entry.message || '').trim().includes(String(message || '').trim()),
                    5000
                );
                observedTeammateMessages.push(Boolean(observed));
                event(observed ? 'baseline_teammate_ack_observed' : 'baseline_teammate_ack_missing', { teammate, message });
            }

            const localWorkItems = [];
            const teammateWorkItems = [];
            for (const spec of this.getContextWorkItemSpecs(context)) {
                localWorkItems.push(this.createContextWorkItem(sharedMemory, {
                    context,
                    namespace,
                    task,
                    localAgent,
                    claimant: localAgent,
                    status: 'active',
                    spec,
                    source: 'decomposed_checklist_baseline',
                    explicitPrompt: true,
                    duplicateBaseline: false,
                    kindSuffix: '_local'
                }));
                teammateWorkItems.push(this.createContextWorkItem(sharedMemory, {
                    context,
                    namespace,
                    task,
                    localAgent,
                    claimant: teammate,
                    status: 'active',
                    spec,
                    source: 'decomposed_checklist_baseline',
                    explicitPrompt: true,
                    duplicateBaseline: true,
                    kindSuffix: '_teammate'
                }));
            }
            event('baseline_independent_work_items_seeded', {
                localCount: localWorkItems.length,
                teammateCount: teammateWorkItems.length,
                duplicateUnitsPlanned: teammateWorkItems.reduce((sum, work) => sum + Number(work.count || 0), 0)
            });

            for (const work of teammateWorkItems) {
                const candidates = this.getWorkCommandCandidates(context, work).join(',');
                const collectCommand = `!evidenceCollectSupport("${this.escapeCommandString(task.id)}","${this.escapeCommandString(statePath)}","${this.escapeCommandString(work.id)}","${Number(work.count || 1)}","${this.escapeCommandString(candidates)}")`;
                await this.sendMonitorCommand(teammate, collectCommand);
                event('baseline_teammate_collect_command_sent', {
                    teammate,
                    workId: work.id,
                    item: work.item,
                    count: work.count,
                    command: '!evidenceCollectSupport(taskId,statePath,workId,count,candidates)'
                });
                const workState = await this.waitForWorkItemTerminalState(statePath, work.id, this.getContextTimeoutMs(context));
                event('baseline_teammate_collect_finished', {
                    teammate,
                    workId: work.id,
                    status: workState?.status || null,
                    item: work.item,
                    count: work.count
                });
            }

            for (const work of localWorkItems) {
                const result = await this.completeLocalEvidenceWorkItem(statePath, work, 'baseline_local_physical_collect');
                event('baseline_local_collect_completed', {
                    workId: work.id,
                    item: work.item,
                    count: work.count,
                    success: result.success,
                    collected: result.collected
                });
            }

            const timeoutMs = this.getContextTimeoutMs(context);
            const requiredCompletionCount = context.allowDuplicateBaselineFailures
                ? localWorkItems.length
                : localWorkItems.length + teammateWorkItems.length;
            const finalState = await this.waitForSharedContextCompletion(
                statePath,
                namespace,
                requiredCompletionCount,
                timeoutMs
            );
            event('baseline_physical_completion_observed', {
                completedWorkItems: this.countCompletedWorkItems(finalState, namespace),
                requiredCompletionCount,
                timeoutMs
            });

            await this.sleep(1000);
            const verification = this.verifyNoPromptContextOutcome({ ...context, namespace }, finalState);
            const success = observedTeammateMessages.every(Boolean) && verification.success;
            event('objective_state_verified', verification);

            return {
                success,
                planQuality: success ? 'decomposed_checklist_baseline_pass' : 'decomposed_checklist_baseline_fail',
                metadata: {
                    ...(liveGame.metadata || {}),
                    category: task.category,
                    actualGameRun: true,
                    scriptedEvidenceExchange: true,
                    decomposedChecklistBaseline: true,
                    soloRun: false,
                    teammate,
                    localMessageCount: localMessages.length,
                    teammateMessageCount: teammateMessages.length,
                    teammateMessagesObserved: observedTeammateMessages.filter(Boolean).length,
                    executionLog,
                    finalFailureReason: success ? null : verification.reason || `Expected in-game teammate acknowledgement from ${teammate} was not observed`,
                    objectiveSuccess: verification.success,
                    roleOverlapRate: verification.roleOverlapRate,
                    taskCoverageRate: verification.taskCoverageRate,
                    handoffSuccesses: verification.handoffSuccesses,
                    duplicateWorkUnits: verification.duplicateWorkUnits,
                    completedSubgoals: verification.completedSubgoals,
                    totalSubgoals: verification.totalSubgoals,
                    scenarioStatePath: statePath,
                    measuredInventory: verification.inventoryCounts,
                    measuredBlocks: verification.blockChecks
                }
            };
        } catch (err) {
            event('decomposed_checklist_baseline_error', { error: err.message });
            return {
                success: false,
                planQuality: 'decomposed_checklist_baseline_error',
                metadata: {
                    category: task.category,
                    actualGameRun: true,
                    scriptedEvidenceExchange: true,
                    decomposedChecklistBaseline: true,
                    teammate,
                    executionLog,
                    finalFailureReason: err.message,
                    scenarioStatePath: statePath,
                    ...(liveGame.metadata || {})
                }
            };
        } finally {
            restoreLocalChat();
            for (const remoteAgent of remoteRestoreCommands) {
                if (this.shouldKeepEvidenceChatSuspended(task)) {
                    event('teammate_chat_handling_left_suspended', { teammate: remoteAgent });
                    continue;
                }
                try {
                    await this.sendMonitorCommand(remoteAgent, '!evidenceSetChatHandling("on")');
                    event('teammate_chat_handling_restored', { teammate: remoteAgent });
                } catch (err) {
                    console.warn(`[TestRunner] Failed to restore chat handling for ${remoteAgent}:`, err.message);
                }
            }
        }
    }

    async executeNoPromptContextGameTask(task, communicationCapture) {
        const liveGame = task.liveGame || {};
        const context = liveGame.context || {};
        const teammate = liveGame.teammate || 'Max';
        const localAgent = this.agent?.name || this.agent?.bot?.username || 'Lucy';
        const statePath = this.getScenarioStatePath(`${task.id}_attempt_${task.repeatContext?.attemptIndex || 1}`);
        const executionLog = [];
        const event = (name, detail = {}) => {
            executionLog.push({
                order: executionLog.length + 1,
                event: name,
                timestamp: new Date().toISOString(),
                detail
            });
        };

        this.resetScenarioState(statePath);
        const sharedMemory = new SharedMemory({ agentName: localAgent, path: statePath });

        try {
            event('no_prompt_context_trial_started', {
                taskId: task.id,
                localAgent,
                teammate,
                statePath
            });

            await this.sendMonitorCommand(teammate, '!evidenceClearState');
            event('teammate_state_reset_requested', { teammate });

            await this.prepareNoPromptTrialIsolation(task, [localAgent, teammate], event);
            await this.prepareNoPromptAgentVitals([localAgent, teammate], event);
            await this.prepareNoPromptContextArena(task, context, teammate, event);
            const intent = sharedMemory.broadcastIntent({
                type: context.intentType || 'BUILD',
                target: task.command,
                materials: context.materials || {},
                steps: [],
                status: 'active',
                priority: 'benchmark',
                location: this.getCurrentBotPosition()
            });
            event('intent_broadcast_to_shared_memory', { intentId: intent?.id || null });

            const workItems = [];
            for (const spec of this.getContextWorkItemSpecs(context)) {
                const work = this.createContextWorkItem(sharedMemory, {
                    context,
                    namespace: context.namespace || 'no_prompt_context',
                    task,
                    localAgent,
                    claimant: null,
                    status: 'planned',
                    spec,
                    source: 'implicit_context',
                    explicitPrompt: false
                });
                workItems.push(work);
            }
            event('context_work_items_seeded', {
                count: workItems.length,
                ids: workItems.map(work => work.id)
            });

            const contextCommand = `!evidenceApplyContext("${this.escapeCommandString(task.id)}","${this.escapeCommandString(statePath)}")`;
            await this.sendMonitorCommand(teammate, contextCommand);
            event('generic_context_command_sent_to_teammate', {
                teammate,
                command: '!evidenceApplyContext(taskId,statePath)'
            });

            const timeoutMs = this.getContextTimeoutMs(context);
            const finalState = await this.waitForSharedContextCompletion(
                statePath,
                context.namespace || 'no_prompt_context',
                workItems.length,
                timeoutMs
            );
            event('shared_context_completion_observed', {
                completedWorkItems: this.countCompletedWorkItems(finalState, context.namespace || 'no_prompt_context'),
                timeoutMs
            });

            await this.sleep(1000);
            const verification = this.verifyNoPromptContextOutcome(context, finalState);
            event('objective_state_verified', verification);

            return {
                success: verification.success,
                planQuality: verification.success ? 'context_live_game_pass' : 'context_live_game_fail',
                metadata: {
                    ...(liveGame.metadata || {}),
                    category: task.category,
                    actualGameRun: true,
                    scriptedEvidenceExchange: false,
                    contextDrivenExecution: true,
                    noExplicitRolePrompt: true,
                    soloRun: false,
                    teammate,
                    localMessageCount: 0,
                    teammateMessageCount: 0,
                    teammateMessagesObserved: 0,
                    executionLog,
                    finalFailureReason: verification.success ? null : verification.reason,
                    objectiveSuccess: verification.success,
                    roleOverlapRate: verification.roleOverlapRate,
                    taskCoverageRate: verification.taskCoverageRate,
                    handoffSuccesses: verification.handoffSuccesses,
                    duplicateWorkUnits: verification.duplicateWorkUnits,
                    completedSubgoals: verification.completedSubgoals,
                    totalSubgoals: verification.totalSubgoals,
                    scenarioStatePath: statePath,
                    measuredInventory: verification.inventoryCounts,
                    measuredBlocks: verification.blockChecks
                }
            };
        } catch (err) {
            event('no_prompt_context_trial_error', { error: err.message });
            return {
                success: false,
                planQuality: 'context_live_game_error',
                metadata: {
                    category: task.category,
                    actualGameRun: true,
                    scriptedEvidenceExchange: false,
                    contextDrivenExecution: true,
                    noExplicitRolePrompt: true,
                    teammate,
                    executionLog,
                    finalFailureReason: err.message,
                    scenarioStatePath: statePath,
                    ...(liveGame.metadata || {})
                }
            };
        }
    }

    getContextTimeoutMs(context = {}) {
        return Math.max(30000, Number(context.timeoutMs || process.env.TEST_CONTEXT_TIMEOUT_MS || 60000));
    }

    async sendSetupCommand(command, event = null) {
        const normalized = String(command || '').trim();
        if (!normalized) return;

        if (this.agent?.bot?.chat) {
            this.agent.bot.chat(normalized);
        }

        let hostCommandSent = false;
        let hostCommandError = null;
        if (this.hostSetupCommandsEnabled()) {
            try {
                this.runHostSetupCommand(normalized);
                hostCommandSent = true;
            } catch (err) {
                hostCommandError = err.message;
                console.warn(`[TestRunner] Host setup command failed for ${normalized}: ${err.message}`);
            }
        }

        if (event) {
            event(hostCommandError ? 'setup_command_failed' : 'setup_command_sent', {
                command: normalized,
                botChatSent: Boolean(this.agent?.bot?.chat),
                hostCommandSent,
                hostCommandError
            });
        }

        await this.sleep(hostCommandSent ? 650 : 250);
    }

    hostSetupCommandsEnabled() {
        return process.env.TEST_HOST_SETUP_COMMANDS === '1';
    }

    runHostSetupCommand(command) {
        const processName = process.env.TEST_RECORD_FOCUS_PROCESS || 'java';
        const escapedProcessName = this.escapeAppleScriptString(processName);
        const escapedCommand = this.escapeAppleScriptString(command);
        execFileSync('/usr/bin/osascript', [
            '-e',
            `tell application "System Events" to set frontmost of process "${escapedProcessName}" to true`,
            '-e',
            'delay 0.1',
            '-e',
            'tell application "System Events" to keystroke "t"',
            '-e',
            'delay 0.1',
            '-e',
            `tell application "System Events" to keystroke "${escapedCommand}"`,
            '-e',
            'delay 0.1',
            '-e',
            'tell application "System Events" to key code 36'
        ], { stdio: 'ignore' });
    }

    escapeAppleScriptString(value) {
        return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    async waitForMonitorAgentModes(agentNames = [], expectedMode = 'survival', timeoutMs = 8000) {
        const names = [...new Set(agentNames.filter(Boolean))];
        const started = Date.now();
        let observed = {};

        while (Date.now() - started < timeoutMs) {
            observed = await this.fetchMonitorAgents();
            if (names.every(name => observed[name]?.gameMode === expectedMode)) {
                return observed;
            }
            await this.sleep(250);
        }

        return observed;
    }

    async fetchMonitorAgents() {
        const localAgents = globalThis.__testingExtensionAgents || null;
        if (localAgents) {
            const agents = {};
            for (const [name, agent] of Object.entries(localAgents)) {
                agents[name] = {
                    gameMode: agent?.bot?.game?.gameMode || null,
                    health: agent?.bot?.health ?? null,
                    hunger: agent?.bot?.food ?? agent?.bot?.hunger ?? null,
                    coordinates: agent?.bot?.entity?.position
                        ? {
                            x: Math.floor(agent.bot.entity.position.x),
                            y: Math.floor(agent.bot.entity.position.y),
                            z: Math.floor(agent.bot.entity.position.z)
                        }
                        : null
                };
            }
            return agents;
        }

        try {
            const host = process.env.MONITOR_SERVER_HOST || '127.0.0.1';
            const port = process.env.MONITOR_SERVER_PORT || '8080';
            const response = await fetch(`http://${host}:${port}/api/agents`);
            const body = await response.json();
            const agents = {};
            for (const agent of body.data || []) {
                agents[agent.name] = {
                    gameMode: agent.gameMode || null,
                    health: agent.health ?? null,
                    hunger: agent.hunger ?? null,
                    coordinates: agent.coordinates || null
                };
            }
            return agents;
        } catch (err) {
            console.warn('[TestRunner] Could not read monitor agent state:', err.message);
            return {};
        }
    }

    async prepareNoPromptTrialIsolation(task, agentNames = [], event = null) {
        const names = [...new Set(agentNames.filter(Boolean))];
        if (names.length === 0) return;

        if (this.shouldUseLocalTerrainReset(task)) {
            await this.prepareLocalTerrainReset(names, event);
            return;
        }

        const region = this.computeIsolationRegion(task?.id || 'task', task?.repeatContext?.attemptIndex || 1);
        await this.sendSetupCommand(`/spreadplayers ${region.x} ${region.z} 4 12 false ${names.join(' ')}`, event);
        await this.sleep(3000);
        if (event) {
            event('trial_region_isolated', {
                agents: names,
                method: 'spreadplayers',
                center: region,
                command: `/spreadplayers ${region.x} ${region.z} 4 12 false ${names.join(' ')}`,
                setupOnly: true,
                reason: 'Prevent trial-to-trial reuse of terrain changes or nearby collected items.'
            });
        }
    }

    shouldUseLocalTerrainReset(task) {
        return process.env.TEST_LOCAL_TERRAIN_RESET === '1' ||
            task?.category === CATEGORIES.COLLAB_REQUIRED_BASELINE_GAME ||
            task?.category === CATEGORIES.COLLAB_REQUIRED_CONTEXT_GAME ||
            task?.category === CATEGORIES.COLLAB_REQUIRED_COMPACT_BASELINE_GAME ||
            task?.category === CATEGORIES.COLLAB_REQUIRED_COMPACT_CONTEXT_GAME ||
            task?.category === CATEGORIES.COLLAB_DIVERSE_MODEL_BASELINE_GAME ||
            task?.category === CATEGORIES.COLLAB_DIVERSE_MODEL_CONTEXT_GAME ||
            task?.category === CATEGORIES.COLLAB_EXPLICIT_COMMUNICATION_GAME ||
            task?.category === CATEGORIES.COLLAB_MATCHED_IMPLICIT_CONTEXT_GAME ||
            task?.category === CATEGORIES.COLLAB_KNOWLEDGE_NORMAL_GAME ||
            task?.category === CATEGORIES.COLLAB_KNOWLEDGE_EXPLICIT_GAME ||
            task?.category === CATEGORIES.COLLAB_KNOWLEDGE_IMPLICIT_GAME;
    }

    shouldKeepEvidenceChatSuspended(task) {
        return process.env.TEST_KEEP_EVIDENCE_CHAT_SUSPENDED === '1' ||
            task?.category === CATEGORIES.COLLAB_REQUIRED_BASELINE_GAME ||
            task?.category === CATEGORIES.COLLAB_REQUIRED_CONTEXT_GAME ||
            task?.category === CATEGORIES.COLLAB_REQUIRED_COMPACT_BASELINE_GAME ||
            task?.category === CATEGORIES.COLLAB_REQUIRED_COMPACT_CONTEXT_GAME;
    }

    async prepareLocalTerrainReset(agentNames = [], event = null) {
        const commands = [
            '/gamerule sendCommandFeedback false',
            '/gamerule logAdminCommands false'
        ];
        for (const name of agentNames) {
            commands.push(
                `/execute at ${name} run kill @e[type=item,distance=..12]`,
                `/execute at ${name} run fill ~-5 ~ ~-5 ~5 ~4 ~5 minecraft:air replace`,
                `/execute at ${name} run fill ~-20 ~-2 ~-20 ~20 ~-1 ~20 minecraft:stone replace`,
                `/execute at ${name} run fill ~3 ~ ~-5 ~12 ~4 ~5 minecraft:dirt replace`
            );
        }

        for (const command of commands) {
            await this.sendSetupCommand(command, event);
        }
        await this.sleep(1000);

        if (event) {
            event('trial_terrain_restored', {
                agents: agentNames,
                method: 'local_fill_reset',
                commands,
                setupOnly: true,
                reason: 'Restore a controlled nearby dirt work area and remove dropped items so trials cannot reuse previous work without forcing distant chunk generation.'
            });
        }
    }

    computeIsolationRegion(taskId, attemptIndex = 1) {
        const hash = String(taskId || 'task')
            .split('')
            .reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const scenarioOffsetX = (hash % 7) * 2400;
        const scenarioOffsetZ = (Math.floor(hash / 7) % 7) * 2400;
        const attemptOffset = Number(attemptIndex || 1) * 1200;
        return {
            x: 2000 + scenarioOffsetX + attemptOffset,
            z: 2000 + scenarioOffsetZ + attemptOffset
        };
    }

    async prepareNoPromptContextArena(task, context, teammate, event) {
        const localName = this.agent?.bot?.username || this.agent?.name || 'Lucy';
        const cameraName = this.findRecordingCameraPlayer([localName, teammate]);
        const attempt = Number(task?.repeatContext?.attemptIndex || 1);

        this.agent.bot.chat(`[LIVE GAME TRIAL] ${task?.id || 'context_task'} attempt ${attempt}: context-only ${context.namespace || 'no_prompt_context'}`);
        event('agents_ready_in_isolated_region', {
            localName,
            teammate,
            attempt,
            localPosition: this.getCurrentBotPosition()
        });

        if (cameraName) {
            await this.positionRecordingCamera(cameraName, teammate, event, {
                taskId: task?.id || null,
                attempt
            });
        } else {
            event('recording_camera_not_found', {
                reason: 'No non-bot player was visible in bot.players.'
            });
        }
    }

    async prepareNoPromptAgentVitals(agentNames = [], event = null) {
        const names = [...new Set(agentNames.filter(Boolean))];
        for (const name of names) {
            await this.sendSetupCommand(`/clear ${name}`, event);
            await this.sendSetupCommand(`/gamemode survival ${name}`, event);
            await this.sendSetupCommand(`/effect give ${name} minecraft:instant_health 1 255 true`, event);
            await this.sendSetupCommand(`/effect give ${name} minecraft:saturation 3 255 true`, event);
        }
        const observedAgents = await this.waitForMonitorAgentModes(names, 'survival', 8000);
        const failures = names.filter(name => observedAgents[name]?.gameMode !== 'survival');
        if (event) {
            event('survival_health_hunger_reset', {
                agents: names,
                inventory: 'cleared_with_setup_clear_command',
                mode: 'survival',
                health: 'restored_with_instant_health',
                hunger: 'restored_with_saturation',
                setupOnly: true,
                observedAgents
            });
        }
        if (failures.length > 0) {
            throw new Error(`Survival mode verification failed for ${failures.join(', ')}`);
        }
    }

    findRecordingCameraPlayer(botNames = []) {
        const excluded = new Set(botNames.filter(Boolean));
        const players = Object.keys(this.agent?.bot?.players || {});
        return players.find(name => !excluded.has(name)) || null;
    }

    async waitForSharedContextCompletion(statePath, namespace, expectedCount, timeoutMs) {
        const started = Date.now();
        while (Date.now() - started < timeoutMs) {
            const memory = new SharedMemory({ agentName: this.agent?.name || 'Lucy', path: statePath });
            const state = memory._load();
            if (this.countCompletedWorkItems(state, namespace) >= expectedCount) {
                return state;
            }
            await this.sleep(250);
        }

        const memory = new SharedMemory({ agentName: this.agent?.name || 'Lucy', path: statePath });
        return memory._load();
    }

    async waitForWorkItemTerminalState(statePath, workId, timeoutMs) {
        const started = Date.now();
        while (Date.now() - started < timeoutMs) {
            const memory = new SharedMemory({ agentName: this.agent?.name || 'Lucy', path: statePath });
            const state = memory._load();
            const work = (state.workLedger || []).find(entry => entry.id === workId);
            if (work && ['completed', 'failed'].includes(work.status)) {
                return work;
            }
            await this.sleep(250);
        }

        const memory = new SharedMemory({ agentName: this.agent?.name || 'Lucy', path: statePath });
        const state = memory._load();
        return (state.workLedger || []).find(entry => entry.id === workId) || null;
    }

    countCompletedWorkItems(state, namespace) {
        return (state?.workLedger || [])
            .filter(work => (work.namespace || 'default') === namespace && work.status === 'completed')
            .length;
    }

    verifyNoPromptContextOutcome(context, state) {
        const namespace = context.namespace || 'no_prompt_context';
        const objectiveItems = context.objectiveItems || {};
        const objectiveBlocks = context.objectiveBlocks || [];
        const inventoryCounts = {};
        const outputByItem = {};
        let totalCollected = 0;
        for (const work of (state?.workLedger || []).filter(work => (work.namespace || 'default') === namespace)) {
            const item = work.item;
            const actualItem = work.outputs?.actualItem || item;
            const observed = Number(work.outputs?.[actualItem] || work.outputs?.[item] || 0);
            outputByItem[actualItem] = (outputByItem[actualItem] || 0) + observed;
            outputByItem[item] = (outputByItem[item] || 0) + observed;
            totalCollected += observed;
            inventoryCounts[actualItem] = Math.max(Number(work.outputs?.providerInventoryAfter || 0), Number(inventoryCounts[actualItem] || 0));
            inventoryCounts[item] = Math.max(Number(work.outputs?.providerInventoryAfter || 0), Number(inventoryCounts[item] || 0));
        }
        const itemChecks = context.acceptAnyCollectedItem
            ? [{
                item: 'any_collected_resource',
                required: Object.values(objectiveItems).reduce((sum, count) => sum + Number(count || 0), 0),
                observed: totalCollected,
                providerInventoryAfter: Math.max(0, ...Object.values(inventoryCounts).map(Number)),
                success: totalCollected >= Object.values(objectiveItems).reduce((sum, count) => sum + Number(count || 0), 0)
            }]
            : Object.entries(objectiveItems).map(([item, count]) => ({
                item,
                required: count,
                observed: Number(outputByItem[item] || 0),
                providerInventoryAfter: Number(inventoryCounts[item] || 0),
                success: Number(outputByItem[item] || 0) >= Number(count)
            }));
        const blockChecks = objectiveBlocks.map(blockSpec => {
            const pos = this.resolveContextPosition(context, blockSpec);
            const block = this.agent.bot.blockAt(new Vec3(pos.x, pos.y, pos.z));
            return {
                block: blockSpec.block,
                position: pos,
                observed: block?.name || null,
                success: block?.name === blockSpec.block
            };
        });
        const workItems = (state?.workLedger || []).filter(work => (work.namespace || 'default') === namespace);
        const completedWorkItems = workItems.filter(work => work.status === 'completed');
        const isDuplicateWork = work => work.duplicate || work.metadata?.duplicateBaseline || work.metadata?.duplicateOf;
        const duplicateWorkUnits = workItems
            .filter(work => isDuplicateWork(work) && work.status === 'completed')
            .reduce((sum, work) => sum + Number(work.count || 0), 0);
        const requiredWorkItems = context.allowDuplicateBaselineFailures
            ? workItems.filter(work => !isDuplicateWork(work))
            : workItems;
        const completedRequiredWorkItems = requiredWorkItems.filter(work => work.status === 'completed');
        const completedSubgoals = itemChecks.filter(check => check.success).length +
            blockChecks.filter(check => check.success).length +
            completedWorkItems.length;
        const totalSubgoals = itemChecks.length + blockChecks.length + workItems.length;
        const taskCoverageRate = totalSubgoals > 0 ? completedSubgoals / totalSubgoals : 0;
        const roleOverlapRate = workItems.length > 0
            ? duplicateWorkUnits / workItems.reduce((sum, work) => sum + Number(work.count || 0), 0)
            : 0;
        const success = itemChecks.every(check => check.success) &&
            blockChecks.every(check => check.success) &&
            completedRequiredWorkItems.length >= requiredWorkItems.length &&
            requiredWorkItems.length > 0;

        return {
            success,
            reason: success ? null : 'No-prompt context objective state was incomplete',
            inventoryCounts,
            itemChecks,
            blockChecks,
            completedSubgoals,
            totalSubgoals,
            handoffSuccesses: completedWorkItems.length,
            duplicateWorkUnits,
            roleOverlapRate,
            taskCoverageRate
        };
    }

    resolveContextPosition(context, spec = {}) {
        const base = context.base || { x: 0, y: 64, z: 0 };
        return {
            x: Math.round(base.x + Number(spec.dx || 0)),
            y: Math.round(base.y + Number(spec.dy || 0)),
            z: Math.round(base.z + Number(spec.dz || 0))
        };
    }

    getCurrentBotPosition() {
        const position = this.agent?.bot?.entity?.position;
        if (!position) return null;
        return {
            x: Math.round(position.x),
            y: Math.round(position.y),
            z: Math.round(position.z)
        };
    }

    suspendLocalChatHandling() {
        const bot = this.agent?.bot;
        const respondAtFunc = this.agent?.respondAtFunc;
        const restoreModes = this.disableLocalEvidenceAutonomousModes();

        if (!bot || typeof bot.off !== 'function' || typeof bot.on !== 'function' || !respondAtFunc) {
            return () => restoreModes();
        }

        const wasSuspended = Boolean(this.agent.__testingExtensionChatSuspended);
        if (!wasSuspended) {
            bot.off('chat', respondAtFunc);
            this.agent.__testingExtensionChatSuspended = true;
        }
        return () => {
            if (!wasSuspended) {
                bot.on('chat', respondAtFunc);
                this.agent.__testingExtensionChatSuspended = false;
            }
            restoreModes();
        };
    }

    evidenceModeNames() {
        return ['self_preservation', 'unstuck', 'cowardice', 'self_defense', 'hunting', 'item_collecting', 'torch_placing'];
    }

    disableLocalEvidenceAutonomousModes() {
        const bot = this.agent?.bot;
        if (!bot?.modes) {
            return () => {};
        }

        const previous = {};
        for (const mode of this.evidenceModeNames()) {
            try {
                if (!bot.modes.exists?.(mode)) continue;
                previous[mode] = bot.modes.isOn(mode);
                bot.modes.setOn(mode, false);
                bot.modes.pause(mode);
            } catch {
                // Mode may not exist on all profiles.
            }
        }

        return () => {
            for (const [mode, wasOn] of Object.entries(previous)) {
                try {
                    if (!bot.modes.exists?.(mode)) continue;
                    bot.modes.setOn(mode, Boolean(wasOn));
                    bot.modes.unpause(mode);
                } catch {
                    // Mode may not exist on all profiles.
                }
            }
        };
    }

    async sendMonitorCommand(agentName, command) {
        const localAgents = globalThis.__testingExtensionAgents || null;
        const localAgent = localAgents?.[agentName];
        if (localAgent) {
            const result = await executeCommand(localAgent, command);
            return {
                success: true,
                local: true,
                agent: agentName,
                command,
                result
            };
        }

        const port = process.env.MONITOR_SERVER_PORT || '8080';
        const host = process.env.MONITOR_SERVER_HOST || '127.0.0.1';
        const response = await fetch(`http://${host}:${port}/api/agents/${encodeURIComponent(agentName)}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Monitor command failed for ${agentName}: ${response.status} ${body}`);
        }

        return response.json();
    }

    async waitForCommunicationEntry(communicationCapture, predicate, timeoutMs = 5000) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const found = (communicationCapture?.log || []).find(predicate);
            if (found) {
                return found;
            }
            await this.sleep(100);
        }
        return null;
    }

    escapeCommandString(value) {
        return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    async executeCollaborationDecisionTask(task) {
        const statePath = this.getScenarioStatePath(task.id);
        this.resetScenarioState(statePath);

        const localAgent = task.decision?.local?.agent || task.split?.local?.agent || this.agent.name || 'AgentA';
        const sharedMemory = new SharedMemory({
            agentName: localAgent,
            path: statePath
        });
        const planner = new CollaborativePlanner({
            agentName: localAgent,
            debug: false
        });

        const now = Date.now();
        const seed = task.decision || task.split || {};

        for (const inventory of seed.inventories || []) {
            sharedMemory.recordInventorySnapshot({
                inventory: inventory.inventory || [],
                position: inventory.position || null,
                activeTaskCount: inventory.activeTaskCount || 0,
                currentActionLabel: inventory.currentActionLabel || null,
                updatedAt: now + Number(inventory.updatedAtOffsetMs || 0),
                status: inventory.activeTaskCount > 0 ? 'busy' : 'available',
                namespace: 'implicit'
            }, inventory.agent);
        }

        for (const fact of seed.worldFacts || []) {
            sharedMemory.recordWorldFact({
                namespace: 'implicit',
                sourceAgent: fact.sourceAgent || 'Seeder',
                ...fact
            });
        }

        for (const work of seed.workLedger || []) {
            const created = sharedMemory.createWorkItem({
                namespace: 'implicit',
                agent: work.agent || 'Seeder',
                claimant: work.claimant || work.agent || 'Seeder',
                kind: work.kind,
                item: work.item,
                count: work.count || 1,
                status: work.status || 'active',
                summary: work.summary || `Seeded ${work.kind || 'work'} for ${work.item}`,
                position: work.position || null,
                duration: 30 * 60 * 1000
            });
            if (work.status === 'completed' && created?.id) {
                sharedMemory.completeWorkItem(created.id, {
                    outputs: work.outputs || {},
                    result: 'Seeded completed work'
                });
            }
        }

        const teamContext = this.buildScenarioTeamContext(sharedMemory);
        let decision = null;
        let workSplit = [];

        if (task.decision) {
            decision = planner.chooseMissingItemStrategy({
                item: task.decision.item,
                count: task.decision.count,
                localCapabilities: {
                    inventory: task.decision.local?.inventory || [],
                    position: task.decision.local?.position || null,
                    activeTaskCount: task.decision.local?.activeTaskCount || 0
                },
                teamContext
            });

            if (decision.action === 'request_supply') {
                sharedMemory.createSupplyRequest({
                    namespace: 'implicit',
                    requester: localAgent,
                    provider: decision.provider?.agent,
                    item: decision.item,
                    count: decision.count,
                    requesterPosition: task.decision.local?.position || null,
                    providerPosition: decision.provider?.position || null,
                    reason: decision.reason
                });
            }
        }

        if (task.split) {
            workSplit = planner.createImplicitWorkSplit({
                plan: task.split.plan,
                intent: { input: task.command, type: 'BUILD' },
                teamContext,
                localCapabilities: {
                    inventory: task.split.local?.inventory || [],
                    position: task.split.local?.position || null,
                    activeTaskCount: task.split.local?.activeTaskCount || 0
                }
            });
            for (const work of workSplit) {
                sharedMemory.createWorkItem({
                    ...work,
                    namespace: 'implicit',
                    agent: localAgent
                });
            }
        }

        const finalState = sharedMemory._load();
        const verification = this.verifyCollaborationScenario(task, {
            decision,
            workSplit,
            state: finalState
        });

        return {
            success: verification.success,
            planQuality: verification.success ? 'pass' : 'fail',
            metadata: {
                category: task.category,
                decision: decision?.action || null,
                decisionReason: decision?.reason || null,
                provider: decision?.provider?.agent || null,
                factsUsed: decision?.worldFact ? 1 : 0,
                supplyRequests: (finalState.supplyRequests || []).length,
                workClaims: (finalState.workLedger || []).length,
                duplicateWorkAvoided: decision?.action === 'wait_for_team_work',
                helperAdoption: decision?.action === 'request_supply',
                finalFailureReason: verification.success ? null : verification.reason,
                scenarioStatePath: statePath
            }
        };
    }

    getScenarioStatePath(taskId) {
        const dir = join(process.cwd(), 'bots', '_shared', 'testing_extension');
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        return join(dir, `${this.agent.name || 'agent'}_${taskId}.json`);
    }

    resetScenarioState(statePath) {
        if (existsSync(statePath)) {
            rmSync(statePath, { force: true });
        }
    }

    buildScenarioTeamContext(sharedMemory) {
        const state = sharedMemory._load();
        return {
            otherIntents: sharedMemory.getOtherIntents(),
            capabilities: sharedMemory.getTeamCapabilities(),
            environmentData: sharedMemory.getTeamEnvironment(),
            worldFacts: state.worldFacts || [],
            inventorySnapshots: state.inventorySnapshots || {},
            workLedger: state.workLedger || [],
            supplyRequests: state.supplyRequests || [],
            areaClaims: state.areaClaims || [],
            reservations: state.reservations || []
        };
    }

    verifyCollaborationScenario(task, outcome) {
        const expected = task.decision?.expected || task.split?.expected || {};
        const decision = outcome.decision || {};
        const state = outcome.state || {};

        if (expected.action && decision.action !== expected.action) {
            return {
                success: false,
                reason: `Expected decision ${expected.action}, got ${decision.action || 'none'}`
            };
        }

        if (expected.provider && decision.provider?.agent !== expected.provider) {
            return {
                success: false,
                reason: `Expected provider ${expected.provider}, got ${decision.provider?.agent || 'none'}`
            };
        }

        if (expected.notProvider && decision.provider?.agent === expected.notProvider) {
            return {
                success: false,
                reason: `Provider ${expected.notProvider} should have been avoided`
            };
        }

        if (expected.noSupplyRequest && (state.supplyRequests || []).length > 0) {
            return {
                success: false,
                reason: 'Expected no supply request, but one was created'
            };
        }

        if (expected.duplicateWorkAvoided && decision.action !== 'wait_for_team_work') {
            return {
                success: false,
                reason: 'Expected duplicate work avoidance'
            };
        }

        if (expected.minWorkItems && outcome.workSplit.length < expected.minWorkItems) {
            return {
                success: false,
                reason: `Expected at least ${expected.minWorkItems} split work items, got ${outcome.workSplit.length}`
            };
        }

        return { success: true, reason: null };
    }

    /**
     * Wait for task completion - waits minimum time before considering idle as complete
     */
    async waitForCompletion(task) {
        const MIN_WAIT_MS = 15000; // Wait at least 15 seconds
        const timeoutMs = task.timeout || 10 * 60 * 1000; // Default 10 minutes
        const startTime = Date.now();

        console.log(`[TestRunner] Waiting for task to complete (min ${MIN_WAIT_MS/1000}s, max ${timeoutMs/1000}s)...`);

        return new Promise((resolve, reject) => {
            const intervalId = setInterval(() => {
                const elapsed = Date.now() - startTime;

                // Enforce minimum wait time
                if (elapsed < MIN_WAIT_MS) {
                    return;
                }

                // After minimum wait, check if agent is idle
                if (this.agent.isIdle()) {
                    console.log(`[TestRunner] Task complete (waited ${elapsed/1000}s)`);
                    clearInterval(intervalId);
                    clearTimeout(timeoutId);
                    resolve();
                }

                // Check for timeout
                if (elapsed > timeoutMs) {
                    clearInterval(intervalId);
                    clearTimeout(timeoutId);
                    reject(new Error(`Task timed out after ${timeoutMs}ms`));
                }
            }, 500);

            // Safety timeout
            const timeoutId = setTimeout(() => {
                clearInterval(intervalId);
                reject(new Error(`Task timed out after ${timeoutMs}ms`));
            }, timeoutMs + 1000);
        });
    }

    getBenchmarkEnhancer() {
        return this.agent?.prompter?.enhancer || null;
    }

    supportsBenchmarkRecovery(enhancer) {
        return Boolean(
            enhancer &&
            typeof enhancer.beginBenchmarkTask === 'function' &&
            typeof enhancer.resetBenchmarkTask === 'function' &&
            typeof enhancer.consumeBenchmarkRecoveryState === 'function'
        );
    }

    async executeTaskLegacy(task) {
        await this.agent.handleMessage('system', this.buildTaskPrompt(task));
        await this.waitForCompletion(task);

        const success = await this.verifySuccess(task);
        return {
            success,
            metadata: {
                benchmarkRetries: 0,
                repeatedMistakeSignature: null,
                finalFailureReason: success ? null : `Task "${task.name}" did not satisfy benchmark verification`,
                failureStepGoal: null
            }
        };
    }

    async executeTaskWithBenchmarkRecovery(task, enhancer) {
        const timeoutMs = task.timeout || 10 * 60 * 1000;
        const startedAt = Date.now();
        let benchmarkRetries = 0;
        let lastRecoveryState = null;

        enhancer.beginBenchmarkTask({
            taskId: task.id,
            taskName: task.name,
            taskCommand: task.command
        });

        let prompt = this.buildTaskPrompt(task);
        while (Date.now() - startedAt < timeoutMs) {
            const remainingMs = timeoutMs - (Date.now() - startedAt);
            await this.executePromptWithTimeout(prompt, remainingMs);

            const success = await this.verifySuccess(task);
            if (success) {
                return {
                    success: true,
                    metadata: {
                        benchmarkRetries,
                        repeatedMistakeSignature: lastRecoveryState?.repeatedMistakeSignature || null,
                        finalFailureReason: null,
                        failureStepGoal: null
                    }
                };
            }

            const recoveryState = enhancer.consumeBenchmarkRecoveryState();
            lastRecoveryState = recoveryState;

            if (!recoveryState) {
                return {
                    success: false,
                    metadata: {
                        benchmarkRetries,
                        repeatedMistakeSignature: null,
                        finalFailureReason: `Benchmark task "${task.name}" ended without success verification or recovery guidance`,
                        failureStepGoal: null
                    }
                };
            }

            if (recoveryState.status === 'needs_reprompt') {
                benchmarkRetries += 1;
                prompt = this.buildRecoveryPrompt(task, recoveryState);
                continue;
            }

            return {
                success: false,
                metadata: {
                    benchmarkRetries,
                    repeatedMistakeSignature: recoveryState.repeatedMistakeSignature || null,
                    finalFailureReason: recoveryState.finalFailureReason || recoveryState.reason || `Benchmark task "${task.name}" failed`,
                    failureStepGoal: recoveryState.failureStepGoal || null
                }
            };
        }

        return {
            success: false,
            metadata: {
                benchmarkRetries,
                repeatedMistakeSignature: lastRecoveryState?.repeatedMistakeSignature || null,
                finalFailureReason: `Task timed out after ${timeoutMs}ms`,
                failureStepGoal: lastRecoveryState?.failureStepGoal || null
            }
        };
    }

    async executePromptWithTimeout(prompt, timeoutMs) {
        if (timeoutMs <= 0) {
            throw new Error('Task timed out before another recovery attempt could start');
        }

        let timeoutId = null;
        try {
            await Promise.race([
                this.agent.handleMessage('system', prompt),
                new Promise((_, reject) => {
                    timeoutId = setTimeout(async () => {
                        try {
                            this.agent.requestInterrupt?.();
                            if (this.agent.actions?.stop) {
                                await this.agent.actions.stop();
                            }
                        } catch (err) {
                            console.warn('[TestRunner] Failed to stop timed out benchmark attempt:', err.message);
                        }

                        reject(new Error(`Task timed out after ${timeoutMs}ms`));
                    }, timeoutMs);
                })
            ]);
        } finally {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        }
    }

    /**
     * Verify if task succeeded (check inventory for crafted item, etc.)
     */
    async verifySuccess(task) {
        if (task.verifyItem) {
            const counts = world.getInventoryCounts(this.agent.bot);
            return counts[task.verifyItem] > 0;
        }

        return true;
    }

    buildTaskPrompt(task) {
        const prompt = [
            '=== BENCHMARK MODE ===',
            'You are currently running a benchmark task from the TestingExtension.',
            'Work on this task just like you would normally - explore, gather materials, craft things, and be persistent!',
            '',
            'GUIDELINES:',
            '1. Do NOT use Minecraft slash/server commands to solve the task (like /give, /tp, /gamemode, /setblock, etc.)',
            '2. The ONLY allowed slash command is /clear, which the test runner may use to reset your own inventory between tests',
            '3. Bot commands starting with ! are fully allowed',
            '4. Your inventory may be cleared between tests - this is normal and part of the benchmarking process',
            '5. Be persistent! If you can\'t find something, search in a larger area or try a different location',
            '6. Work together with other bots if they are around - you can gather different materials in parallel',
            '',
            'Your task:'
        ];

        prompt.push(task.command);

        return prompt.join('\n');
    }

    buildRecoveryPrompt(task, recoveryState) {
        const prompt = [
            '=== BENCHMARK MODE ===',
            'You are still running the same benchmark task from the TestingExtension.',
            'The benchmark is NOT complete yet.',
            '',
            'RECOVERY CONTEXT:',
            `- Last failed step: ${recoveryState.failureStepGoal || 'unknown step'}`,
            `- Last failed command path: ${recoveryState.failedCommand || 'unknown command'}`,
            `- Failure reason: ${recoveryState.reason || recoveryState.finalFailureReason || 'unknown reason'}`,
            `- Attempts on this failed step: ${recoveryState.attemptCount || '?'} / 5`,
            `- Same mistake repeats: ${recoveryState.signatureCount || '?'} / 3`,
            '- You MUST take a different concrete action from the failed command path above.',
            '- Do NOT repeat the same failed command unless the situation has materially changed.',
            '- If searching failed, search farther away or move to a different area.',
            '- Keep working until the benchmark goal is actually complete.',
            '',
            'Your task:'
        ];

        prompt.push(task.command);

        return prompt.join('\n');
    }

    async clearInventoryWithCommand() {
        const bot = this.agent?.bot;
        const username = bot?.username || this.agent?.name;

        if (!bot || !username) {
            console.warn('[TestRunner] Bot is not connected, skipping inventory clear');
            return {
                success: false,
                permissionDenied: false,
                message: 'Bot is not connected'
            };
        }

        const restoreModes = this.disableLocalEvidenceAutonomousModes();
        const seenMessages = [];
        const onMessage = (message) => {
            seenMessages.push(String(message));
        };

        bot.on('messagestr', onMessage);
        try {
            for (let attempt = 1; attempt <= 4; attempt++) {
                // Only clear this specific bot between tests.
                if (this.hostSetupCommandsEnabled()) {
                    await this.sendSetupCommand(`/clear ${username}`);
                } else {
                    bot.chat(`/clear ${username}`);
                }
                await this.sleep(750);

                const remainingItems = await this.waitForInventoryItems(1000);
                if (remainingItems.length === 0) {
                    return {
                        success: true,
                        permissionDenied: false,
                        message: `Inventory cleared after ${attempt} /clear attempt${attempt === 1 ? '' : 's'}`
                    };
                }
            }
        } finally {
            bot.off('messagestr', onMessage);
            restoreModes();
        }

        const permissionMessage = seenMessages.find(message => this.isClearPermissionError(message));
        if (permissionMessage) {
            console.warn(`[TestRunner] Inventory cleanup permission issue: ${permissionMessage}`);
            return {
                success: false,
                permissionDenied: true,
                message: `Inventory cleanup failed because /clear is not permitted: ${permissionMessage}`
            };
        }

        try {
            const remainingItems = this.getInventoryItems();
            if (remainingItems.length > 0) {
                const remainingSummary = remainingItems
                    .map(item => `${item.count}x ${item.name}`)
                    .join(', ');

                console.warn(`[TestRunner] Inventory not fully cleared: ${remainingSummary}`);
                return {
                    success: false,
                    permissionDenied: false,
                    message: `Inventory not fully cleared after repeated /clear attempts: ${remainingSummary}`
                };
            }
        } catch (e) {
            console.warn('[TestRunner] Error checking remaining items:', e.message);
            return {
                success: false,
                permissionDenied: false,
                message: `Inventory cleanup verification failed: ${e.message}`
            };
        }

        return {
            success: true,
            permissionDenied: false,
            message: 'Inventory cleared'
        };
    }

    getInventoryItems() {
        const inventory = this.agent?.bot?.inventory;
        if (!inventory) return [];
        if (typeof inventory.items === 'function') {
            return inventory.items().filter(item => item !== null);
        }
        if (Array.isArray(inventory.items)) {
            return inventory.items.filter(item => item !== null);
        }
        return [];
    }

    async waitForInventoryItems(timeoutMs = 1000) {
        const started = Date.now();
        let items = this.getInventoryItems();
        while (items.length > 0 && Date.now() - started < timeoutMs) {
            await this.sleep(100);
            items = this.getInventoryItems();
        }
        return items;
    }

    isClearPermissionError(message) {
        const lower = String(message).toLowerCase();
        const patterns = [
            'do not have permission',
            "don't have permission",
            'not allowed to use this command',
            'requires operator',
            'must be a server operator',
            'only available to server operators',
            'unknown or incomplete command',
            'unknown command'
        ];

        return patterns.some(pattern => lower.includes(pattern));
    }

    async notifyClearPermissionIssue(message) {
        if (this.clearPermissionWarningSent) return;
        this.clearPermissionWarningSent = true;

        console.warn(`[TestRunner] ${message}`);

        if (typeof this.agent.openChat === 'function') {
            await this.agent.openChat(message);
            return;
        }

        this.agent.bot.chat(message);
    }

    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
