/**
 * TaskManager - 任务栈管理器（支持嵌套任务和中断恢复）
 *
 * 核心功能：
 * 1. 管理任务栈（主任务 + 子任务）
 * 2. 记录每个任务的执行状态
 * 3. 支持任务暂停、恢复、完成、失败
 * 4. 步骤执行失败时分析原因，动态插入子任务
 *
 * 执行循环接口（三件套）：
 * - getCurrentStep() — 只读，返回当前步骤（peek）
 * - advanceStep()    — 成功后调用，推进指针，返回 boolean
 * - run(executeStepFn, judgeAndPlanFn, ctx) — 自驱动执行循环
 */

import fs from 'fs';
import path from 'path';

const MAX_SUBTASK_DEPTH = 5;
const MAX_COMPLETED_TASKS = 100;
const MAX_STEP_RETRIES = 3;

export class TaskManager {
    constructor(debug = false) {
        this.debug = debug;
        this.taskStack = [];
        this.completedTasks = [];
        this.currentTask = null;
        this.evalMode = false;
        this.evalLogPath = null;
        this.evalMeta = {};
    }

    logDebug(...args) {
        if (this.debug) {
            console.log('[TaskManager]', ...args);
        }
    }

    // ─── 任务栈操作 ───────────────────────────────────────────────

    /**
     * 推入新任务到栈顶
     *
     * @param {object} task - 任务对象
     * @param {string} task.name - 任务名称
     * @param {array} task.steps - 步骤数组
     * @param {string} task.reason - 创建此任务的原因
     * @returns {object|null} - 创建的任务对象，超过深度限制返回 null
     */
    pushTask(task) {
        // 递归深度保护
        if (this.taskStack.length >= MAX_SUBTASK_DEPTH) {
            this.logDebug(`Max subtask depth (${MAX_SUBTASK_DEPTH}) reached, rejecting: ${task.name}`);
            return null;
        }

        // 目标去重：子任务目标与栈中已有任务重复 → 拒绝（防止死循环）
        if (this._isDuplicateGoal(task.name)) {
            this.logDebug(`Duplicate subtask goal rejected: "${task.name}" already in task stack`);
            return null;
        }

        const isRoot = !this.currentTask;
        const taskWithMeta = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: task.name,
            steps: task.steps || [],
            currentStep: 0,
            status: 'active',  // active, paused, completed, failed
            reason: task.reason || 'User request',
            parentTaskId: this.currentTask?.id || null,
            createdAt: new Date().toISOString(),
            metadata: (this.evalMode && isRoot && this.evalMeta)
                ? { ...task.metadata || {}, ...this.evalMeta }
                : task.metadata || {}
        };

        // 如果当前有活跃任务，暂停它
        if (this.currentTask && this.currentTask.status === 'active') {
            this.pauseTask(this.currentTask.id, 'Subtask created');
        }

        this.taskStack.push(taskWithMeta);
        this.currentTask = taskWithMeta;

        this.logDebug(`Task pushed: ${taskWithMeta.name} (ID: ${taskWithMeta.id})`);
        this.logDebug(`Stack depth: ${this.taskStack.length}`);

        return taskWithMeta;
    }

    /**
     * 完成当前任务，弹出栈，恢复父任务
     *
     * @param {string} taskId - 任务ID
     * @param {string} result - 任务结果描述
     */
    popTask(taskId, result = 'Completed') {
        const index = this.taskStack.findIndex(t => t.id === taskId);
        if (index === -1) {
            this.logDebug(`Task not found: ${taskId}`);
            return null;
        }

        const task = this.taskStack[index];
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        task.result = result;

        // 移出栈
        this.taskStack.splice(index, 1);
        this._trimCompletedTasks();

        this.completedTasks.push(task);

        if (this.evalMode && this.evalLogPath && !task.parentTaskId) {
            this._writeEvalLog({
                success: true,
                taskName: task.name,
                result: task.result,
                stepsTotal: task.steps?.length || 0,
                completedAt: task.completedAt
            });
        }

        this.logDebug(`Task completed: ${task.name} (ID: ${task.id})`);
        this.logDebug(`Result: ${result}`);

        // 如果是当前任务完成了，恢复父任务
        if (this.currentTask?.id === taskId) {
            if (this.taskStack.length > 0) {
                // 通过 parentTaskId 精确恢复（而非盲目取栈顶）
                const parentTask = this.taskStack.find(t => t.id === task.parentTaskId)
                    ?? this.taskStack[this.taskStack.length - 1];  // fallback
                this.resumeTask(parentTask.id, `Subtask '${task.name}' completed`);
                this.currentTask = parentTask;
                this.logDebug(`Resumed parent task: ${parentTask.name}`);
                // Reset fail counter for parent's current step — subtask may have fixed the issue
                const failKey = `${parentTask.id}:${parentTask.currentStep}`;
                if (this._runFailCounts) {
                    this._runFailCounts.delete(failKey);
                }
            } else {
                this.currentTask = null;
                this.logDebug('All tasks completed!');
            }
        }

        return task;
    }

    // ─── 步骤执行接口（三件套） ────────────────────────────────────

    /**
     * 获取当前应该执行的步骤（只读 peek）
     *
     * @returns {object|null} - 当前步骤对象
     */
    getCurrentStep() {
        if (!this.currentTask) return null;

        const { steps, currentStep } = this.currentTask;

        if (currentStep >= steps.length) {
            return null;
        }

        return steps[currentStep];
    }

    /**
     * 推进当前任务的步骤指针（执行成功后调用）
     *
     * @returns {boolean} true = 还有后续步骤，false = 当前任务所有步骤已完成
     */
    advanceStep() {
        if (!this.currentTask || this.currentTask.status !== 'active') {
            return false;
        }

        const { steps, currentStep } = this.currentTask;

        if (currentStep >= steps.length) {
            this.logDebug(`Task '${this.currentTask.name}' already completed`);
            return false;
        }

        this.currentTask.currentStep += 1;

        const remaining = this.currentTask.currentStep < steps.length;
        this.logDebug(`Task '${this.currentTask.name}' advanced to step ${this.currentTask.currentStep}/${steps.length}`);

        return remaining;
    }

    // ─── 任务失败处理 ─────────────────────────────────────────────

    /**
     * 彻底失败当前任务（handleStepFailure 返回 handled:false 时调用）
     *
     * @param {string} reason - 失败原因
     * @returns {object|null} 失败的任务对象
     */
    failCurrentTask(reason) {
        if (!this.currentTask) return null;

        const task = this.currentTask;
        task.status = 'failed';
        task.failedAt = new Date().toISOString();
        task.failReason = reason;

        // 从栈中移除
        const index = this.taskStack.findIndex(t => t.id === task.id);
        if (index !== -1) {
            this.taskStack.splice(index, 1);
        }

        this._trimCompletedTasks();
        this.completedTasks.push(task);

        if (this.evalMode && this.evalLogPath && !task.parentTaskId) {
            this._writeEvalLog({
                success: false,
                taskName: task.name,
                failReason: task.failReason,
                stepsTotal: task.steps?.length || 0,
                failedAt: task.failedAt
            });
        }

        this.logDebug(`Task failed: ${task.name} - ${reason}`);

        // 恢复父任务
        if (task.parentTaskId) {
            const parentTask = this.taskStack.find(t => t.id === task.parentTaskId);
            if (parentTask) {
                this.resumeTask(parentTask.id, `Child task failed: ${reason}`);
                this.currentTask = parentTask;
                this.logDebug(`Resumed parent after failure: ${parentTask.name}`);
                return task;
            }
        }

        // 无父任务或找不到，取栈顶
        if (this.taskStack.length > 0) {
            this.currentTask = this.taskStack[this.taskStack.length - 1];
        } else {
            this.currentTask = null;
            this.logDebug('All tasks cleared after failure');
        }

        return task;
    }

    // ─── 暂停/恢复 ───────────────────────────────────────────────

    /**
     * 暂停任务（通常是因为需要创建子任务）
     */
    pauseTask(taskId, reason = 'Paused') {
        const task = this.taskStack.find(t => t.id === taskId);
        if (!task) {
            this.logDebug(`Task not found: ${taskId}`);
            return false;
        }

        if (task.status !== 'active') {
            this.logDebug(`Task is not active: ${task.name} (status: ${task.status})`);
            return false;
        }

        task.status = 'paused';
        task.pausedReason = reason;
        task.pausedAt = new Date().toISOString();

        this.logDebug(`Task paused: ${task.name} - ${reason}`);

        return true;
    }

    /**
     * 恢复暂停的任务
     */
    resumeTask(taskId, reason = 'Resumed') {
        const task = this.taskStack.find(t => t.id === taskId);
        if (!task) {
            this.logDebug(`Task not found: ${taskId}`);
            return false;
        }

        if (task.status !== 'paused') {
            this.logDebug(`Task is not paused: ${task.name} (status: ${task.status})`);
            return false;
        }

        task.status = 'active';
        task.resumedReason = reason;
        task.resumedAt = new Date().toISOString();

        this.logDebug(`Task resumed: ${task.name} - ${reason}`);

        return true;
    }

    // ─── 自驱动执行循环 ─────────────────────────────────────────

    /**
     * Self-driving execution loop.
     * Runs until all tasks complete or unrecoverable failure.
     *
     * @param {Function} executeStepFn - async (step) => executionResult
     * @param {Function} judgeAndPlanFn - async (step, executionResult) => { success, reason, giveUp? }
     * @param {object} runtimeContext - { bot }
     */
    async run(executeStepFn, judgeAndPlanFn, runtimeContext = {}) {
        this.logDebug('run() started');
        this._runFailCounts = new Map(); // "taskId:stepIdx" -> count

        while (this.currentTask) {
            const step = this.getCurrentStep();

            if (!step) {
                // Verify with brief retries: a freshly collected/crafted goal item
                // can lag bot.inventory by ~1s (server pickup/window sync). Reading once
                // can under-count (e.g. collected 3 bamboo but verify reads 2) and falsely
                // fail an otherwise-complete task. Retry a few times with short waits.
                let verifyResult = this._verifyTaskCompletion(this.currentTask, runtimeContext.bot);
                for (let attempt = 0; attempt < 3 && !verifyResult.success; attempt++) {
                    await new Promise(r => setTimeout(r, 500));
                    verifyResult = this._verifyTaskCompletion(this.currentTask, runtimeContext.bot);
                }
                this.currentTask.verifyResult = verifyResult;
                if (!verifyResult.success) {
                    console.log(`❌ Task completion check failed: ${verifyResult.reason}`);
                    this.failCurrentTask(verifyResult.reason);
                    continue;
                }
                this.logDebug(`Task "${this.currentTask.name}" all steps done → popping`);
                this.popTask(this.currentTask.id, verifyResult.reason || 'All steps completed');
                continue;
            }

            // Check skip flag (set by pruneSteps)
            if (step.skip) {
                console.log(`  [SKIP] Step ${this.currentTask.currentStep + 1}: ${step.goal} (already satisfied)`);
                this.advanceStep();
                continue;
            }

            console.log(`\n⚙️  [${this.currentTask.name}] Step ${this.currentTask.currentStep + 1}/${this.currentTask.steps.length}: ${step.goal}`);

            const executionResult = await executeStepFn(step);
            const judgment = await judgeAndPlanFn(step, executionResult);

            this.logDebug(`Judgment: success=${judgment.success}, reason=${judgment.reason}`);

            if (judgment.success) {
                console.log(`✅ Step succeeded: ${step.goal}`);
                this.advanceStep();
            } else {
                console.log(`❌ Step failed: ${judgment.reason}`);

                // LoopGuard: judge explicitly gave up — fail task immediately
                if (judgment.giveUp) {
                    console.log(`⛔ Step "${step.goal}" gave up (LoopGuard), failing task`);
                    this.failCurrentTask(`Step "${step.goal}" gave up: ${judgment.reason}`);
                    continue;
                }

                // Track how many times this exact step has failed
                const failKey = `${this.currentTask.id}:${this.currentTask.currentStep}`;
                const failCount = (this._runFailCounts.get(failKey) || 0) + 1;
                this._runFailCounts.set(failKey, failCount);

                if (failCount >= MAX_STEP_RETRIES) {
                    console.log(`⛔ Step "${step.goal}" failed ${failCount} times, giving up on task "${this.currentTask.name}"`);
                    this.failCurrentTask(`Step "${step.goal}" failed ${failCount} times: ${judgment.reason}`);
                    continue;
                }

                // Retry the same step
                console.log(`🔄 Step "${step.goal}" failed (attempt ${failCount}/${MAX_STEP_RETRIES}), retrying...`);
            }
        }

        this.logDebug('run() completed — task stack empty');
    }

    // ─── 状态查询 ─────────────────────────────────────────────────

    getStackStatus() {
        return {
            stackDepth: this.taskStack.length,
            currentTask: this.currentTask ? {
                id: this.currentTask.id,
                name: this.currentTask.name,
                step: `${this.currentTask.currentStep}/${this.currentTask.steps.length}`,
                status: this.currentTask.status
            } : null,
            allTasks: this.taskStack.map(t => ({
                id: t.id,
                name: t.name,
                step: `${t.currentStep}/${t.steps.length}`,
                status: t.status,
                reason: t.reason
            }))
        };
    }

    clear() {
        this.taskStack = [];
        this.currentTask = null;
        this.completedTasks = [];
        this.logDebug('Task stack cleared');
    }

    /**
     * Enable eval mode — auto-write results on root task completion/failure.
     *
     * @param {string} logPath - JSONL log file path (e.g. 'eval_results/eval_log.jsonl')
     * @param {object} meta - Eval metadata (mode, taskSlug, level, etc.)
     */
    enableEvalMode(logPath, meta = {}) {
        this.evalMode = true;
        this.evalLogPath = logPath;
        this.evalMeta = meta;

        const dir = path.dirname(logPath);
        if (dir && dir !== '.' && !fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        this.logDebug(`Eval mode enabled: logging to ${logPath}`);
    }

    // ─── 私有辅助方法 ─────────────────────────────────────────────

    _verifyTaskCompletion(task, bot) {
        if (!task) {
            return { success: false, reason: 'No task to verify' };
        }

        const targetItem = task.metadata?.targetItem;
        const targetCount = Number(task.metadata?.targetCount) > 0
            ? Number(task.metadata.targetCount)
            : 1;

        // 子任务或无显式目标：默认按“步骤执行完毕”判定
        if (!targetItem) {
            return { success: true, reason: 'All steps completed' };
        }

        if (!bot?.inventory?.items) {
            return { success: false, reason: `Cannot verify target "${targetItem}" without bot inventory` };
        }

        const inventoryMap = this._buildInventoryMap(null, bot);
        const have = this._getItemCount(inventoryMap, targetItem);
        if (have >= targetCount) {
            return { success: true, reason: `Target verified: ${targetItem} x${have}` };
        }

        // Debug: print all inventory items to diagnose name mismatch
        const allItems = bot.inventory.items?.() || [];
        const itemList = allItems.map(i => `${i.name}x${i.count}`).join(', ') || 'empty';
        console.log(`[verify-debug] Looking for "${targetItem}", inventory: ${itemList}`);

        return {
            success: false,
            reason: `Target missing: need ${targetCount}x ${targetItem}, have ${have}`
        };
    }

    _normalizeItemName(name) {
        return String(name || '')
            .toLowerCase()
            .replace(/[^a-z0-9_\s]/g, '')
            .trim()
            .replace(/\s+/g, '_');
    }

    _buildInventoryMap(inventory, bot) {
        const map = {};
        const fromInventory = inventory?.items;
        if (Array.isArray(fromInventory)) {
            for (const item of fromInventory) {
                if (!item?.name) continue;
                map[item.name] = (map[item.name] || 0) + (item.count || 1);
            }
            return map;
        }

        const botItems = bot?.inventory?.items?.();
        if (Array.isArray(botItems)) {
            for (const item of botItems) {
                if (!item?.name) continue;
                map[item.name] = (map[item.name] || 0) + (item.count || 1);
            }
        }

        // bot.inventory.items() excludes armor slots (5=helmet,6=chest,7=legs,8=boots).
        // An item auto-equipped after crafting lands here, not in the main inventory.
        for (const slotIdx of [5, 6, 7, 8]) {
            const item = bot?.inventory?.slots?.[slotIdx];
            if (item?.name) map[item.name] = (map[item.name] || 0) + (item.count || 1);
        }

        return map;
    }

    _getItemCount(inventoryMap, itemName) {
        const normalized = this._normalizeItemName(itemName);
        return inventoryMap[normalized] || 0;
    }

    /**
     * 修剪 completedTasks 防止内存泄漏
     */
    _trimCompletedTasks() {
        if (this.completedTasks.length >= MAX_COMPLETED_TASKS) {
            this.completedTasks = this.completedTasks.slice(-Math.floor(MAX_COMPLETED_TASKS / 2));
        }
    }

    /**
     * Append eval result as JSON line to log file.
     * @param {object} result
     */
    _writeEvalLog(result) {
        if (!this.evalLogPath) return;

        const entry = {
            ...this.evalMeta,
            ...result,
            timestamp: new Date().toISOString()
        };

        try {
            fs.appendFileSync(this.evalLogPath, JSON.stringify(entry) + '\n', 'utf8');
            this.logDebug(`Eval log written: ${JSON.stringify(entry)}`);
        } catch (err) {
            console.warn(`[TaskManager] Failed to write eval log: ${err.message}`);
        }
    }

    /**
     * 检查任务目标是否与栈中已有任务重复
     * 提取任务名中的关键物品名（如 "Gather missing items: iron_ore, furnace" → "iron_ore", "furnace"）
     *
     * @param {string} taskName - 待创建任务名
     * @returns {boolean} true = 重复
     */
    _isDuplicateGoal(taskName) {
        if (!taskName || this.taskStack.length === 0) return false;

        // 从任务名中提取 minecraft 物品/方块关键字（snake_case 词）
        const extractKeywords = (name) => {
            const lower = name.toLowerCase();
            const matches = lower.match(/[a-z]+_[a-z_]+/g) || [];
            // 也提取单个物品词
            const singles = lower.match(/\b(?:iron|gold|diamond|stone|wooden|cobblestone|oak|birch|stick|plank|log|ore|ingot|sword|axe|pickaxe|shovel|hoe|furnace|crafting_table|chest)\b/g) || [];
            return [...new Set([...matches, ...singles.map(s => s.toLowerCase())])];
        };

        const newKeywords = extractKeywords(taskName);
        if (newKeywords.length === 0) return false;

        for (const existing of this.taskStack) {
            const existingKeywords = extractKeywords(existing.name);
            const overlap = newKeywords.filter(k => existingKeywords.includes(k));
            // Require either a specific underscore item OR 2+ keywords to match before treating as duplicate.
            // Prevents false positives where only a generic material word (e.g. "iron") overlaps,
            // which would wrongly block "Obtain iron_sword" when "Obtain iron_pickaxe" is already in stack.
            const hasSpecificMatch = overlap.some(k => k.includes('_'));
            const hasStrongOverlap = overlap.length >= 2;
            if ((hasSpecificMatch || hasStrongOverlap) &&
                (overlap.length === newKeywords.length || overlap.length === existingKeywords.length)) {
                if (overlap.length > 0) return true;
            }
        }

        return false;
    }
}
