/**
 * TaskManager Unit Tests
 *
 * Run: node tests/task_manager.test.js
 */

import { TaskManager } from '../src/models/enhancers/task_manager.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passed++;
    } else {
        console.log(`  ❌ FAIL: ${message}`);
        failed++;
    }
}

// ─── pushTask() ──────────────────────────────────────────────────

console.log('\n=== pushTask() ===\n');

// Test 1: basic push
{
    const tm = new TaskManager(true);
    const task = tm.pushTask({
        name: 'Craft iron sword',
        steps: [
            { step: 1, goal: 'Collect logs', command: '!collectBlocks("log", 3)', preconditions: [] },
            { step: 2, goal: 'Craft planks', command: '!craftRecipe("planks", 3)', preconditions: [] }
        ],
        reason: 'User request'
    });
    assert(task !== null, 'pushTask returns task object');
    assert(task.name === 'Craft iron sword', 'task.name is correct');
    assert(task.status === 'active', 'task is active');
    assert(task.currentStep === 0, 'starts at step 0');
    assert(tm.currentTask === task, 'currentTask points to pushed task');
    assert(tm.taskStack.length === 1, 'stack depth is 1');
}

// Test 2: push subtask pauses parent
{
    const tm = new TaskManager(true);
    tm.pushTask({
        name: 'Parent task',
        steps: [{ step: 1, goal: 'Do something', command: '!collectBlocks("log", 1)', preconditions: [] }],
        reason: 'User request'
    });
    const parentTask = tm.currentTask;

    tm.pushTask({
        name: 'Subtask',
        steps: [{ step: 1, goal: 'Sub-step', command: '!collectBlocks("stone", 1)', preconditions: [] }],
        reason: 'Need stone'
    });

    assert(parentTask.status === 'paused', 'parent task is paused');
    assert(tm.currentTask.name === 'Subtask', 'currentTask is subtask');
    assert(tm.taskStack.length === 2, 'stack depth is 2');
    assert(tm.currentTask.parentTaskId === parentTask.id, 'subtask has parentTaskId');
}

// Test 3: MAX_SUBTASK_DEPTH limit
{
    const tm = new TaskManager(true);
    // Push 5 levels (max)
    for (let i = 0; i < 5; i++) {
        const result = tm.pushTask({
            name: `Task level ${i}`,
            steps: [{ step: 1, goal: `Goal ${i}`, command: `!collectBlocks("dirt", 1)`, preconditions: [] }],
            reason: `Level ${i}`
        });
        assert(result !== null, `level ${i} push succeeds`);
    }
    assert(tm.taskStack.length === 5, 'stack depth is 5');

    // 6th level should be rejected
    const rejected = tm.pushTask({
        name: 'Task level 5',
        steps: [{ step: 1, goal: 'Overflow', command: '!collectBlocks("dirt", 1)', preconditions: [] }],
        reason: 'Should fail'
    });
    assert(rejected === null, '6th level push returns null');
    assert(tm.taskStack.length === 5, 'stack depth stays 5');
}

// ─── advanceStep() ───────────────────────────────────────────────

console.log('\n=== advanceStep() ===\n');

// Test 4: advanceStep returns boolean
{
    const tm = new TaskManager(true);
    tm.pushTask({
        name: 'Two-step task',
        steps: [
            { step: 1, goal: 'Step 1', command: '!collectBlocks("log", 1)', preconditions: [] },
            { step: 2, goal: 'Step 2', command: '!craftRecipe("planks", 4)', preconditions: [] }
        ],
        reason: 'Test'
    });

    const hasMore1 = tm.advanceStep();
    assert(hasMore1 === true, 'advanceStep returns true (more steps remain)');
    assert(tm.currentTask.currentStep === 1, 'currentStep is now 1');

    const hasMore2 = tm.advanceStep();
    assert(hasMore2 === false, 'advanceStep returns false (no more steps)');
    assert(tm.currentTask.currentStep === 2, 'currentStep is now 2');
}

// Test 5: advanceStep with no active task
{
    const tm = new TaskManager(true);
    const result = tm.advanceStep();
    assert(result === false, 'advanceStep with no task returns false');
}

// Test 6: advanceStep on paused task
{
    const tm = new TaskManager(true);
    tm.pushTask({
        name: 'Paused task',
        steps: [{ step: 1, goal: 'Step 1', command: '!collectBlocks("log", 1)', preconditions: [] }],
        reason: 'Test'
    });
    tm.pauseTask(tm.currentTask.id, 'Testing');
    const result = tm.advanceStep();
    assert(result === false, 'advanceStep on paused task returns false');
}

// ─── getCurrentStep() ────────────────────────────────────────────

console.log('\n=== getCurrentStep() ===\n');

// Test 7: peek at current step
{
    const tm = new TaskManager(true);
    tm.pushTask({
        name: 'Test task',
        steps: [
            { step: 1, goal: 'Collect logs', command: '!collectBlocks("log", 3)', preconditions: [] },
            { step: 2, goal: 'Craft planks', command: '!craftRecipe("planks", 3)', preconditions: [] }
        ],
        reason: 'Test'
    });

    const step = tm.getCurrentStep();
    assert(step !== null, 'getCurrentStep returns step');
    assert(step.goal === 'Collect logs', 'first step goal correct');

    // Advance and peek again
    tm.advanceStep();
    const step2 = tm.getCurrentStep();
    assert(step2?.goal === 'Craft planks', 'second step goal correct');
}

// Test 8: getCurrentStep past end
{
    const tm = new TaskManager(true);
    tm.pushTask({
        name: 'Single step',
        steps: [{ step: 1, goal: 'Only step', command: '!collectBlocks("log", 1)', preconditions: [] }],
        reason: 'Test'
    });
    tm.advanceStep();
    const step = tm.getCurrentStep();
    assert(step === null, 'getCurrentStep past end returns null');
}

// ─── popTask() — parentTaskId restoration ────────────────────────

console.log('\n=== popTask() parentTaskId restoration ===\n');

// Test 9: pop subtask restores correct parent
{
    const tm = new TaskManager(true);
    tm.pushTask({
        name: 'Parent',
        steps: [
            { step: 1, goal: 'P-Step 1', command: '!collectBlocks("log", 1)', preconditions: [] },
            { step: 2, goal: 'P-Step 2', command: '!craftRecipe("planks", 4)', preconditions: [] }
        ],
        reason: 'Test'
    });
    const parentId = tm.currentTask.id;

    tm.pushTask({
        name: 'Subtask',
        steps: [{ step: 1, goal: 'S-Step 1', command: '!collectBlocks("stone", 1)', preconditions: [] }],
        reason: 'Need stone'
    });
    const subtaskId = tm.currentTask.id;

    // Pop subtask
    tm.popTask(subtaskId, 'Done');

    assert(tm.currentTask.id === parentId, 'currentTask restored to parent');
    assert(tm.currentTask.status === 'active', 'parent task is active again');
    assert(tm.currentTask.currentStep === 0, 'parent step pointer unchanged');
}

// Test 10: pop last task clears currentTask
{
    const tm = new TaskManager(true);
    tm.pushTask({
        name: 'Only task',
        steps: [{ step: 1, goal: 'Step 1', command: '!collectBlocks("log", 1)', preconditions: [] }],
        reason: 'Test'
    });
    const taskId = tm.currentTask.id;

    tm.popTask(taskId, 'Done');
    assert(tm.currentTask === null, 'currentTask is null after popping last task');
    assert(tm.taskStack.length === 0, 'stack is empty');
    assert(tm.completedTasks.length === 1, 'completedTasks has 1 entry');
    assert(tm.completedTasks[0].status === 'completed', 'completed task status is completed');
}

// ─── failCurrentTask() ───────────────────────────────────────────

console.log('\n=== failCurrentTask() ===\n');

// Test 11: fail marks task as failed
{
    const tm = new TaskManager(true);
    tm.pushTask({
        name: 'Will fail',
        steps: [{ step: 1, goal: 'Step 1', command: '!collectBlocks("log", 1)', preconditions: [] }],
        reason: 'Test'
    });

    const failedTask = tm.failCurrentTask('No logs nearby');
    assert(failedTask !== null, 'failCurrentTask returns task');
    assert(failedTask.status === 'failed', 'task status is failed');
    assert(failedTask.failReason === 'No logs nearby', 'failReason recorded');
    assert(tm.currentTask === null, 'currentTask is null');
    assert(tm.completedTasks.some(t => t.status === 'failed'), 'completedTasks contains failed task');
}

// Test 12: fail subtask restores parent
{
    const tm = new TaskManager(true);
    tm.pushTask({
        name: 'Parent',
        steps: [{ step: 1, goal: 'P-Step 1', command: '!collectBlocks("log", 1)', preconditions: [] }],
        reason: 'Test'
    });
    const parentId = tm.currentTask.id;

    tm.pushTask({
        name: 'Failing subtask',
        steps: [{ step: 1, goal: 'S-Step 1', command: '!collectBlocks("nothing", 1)', preconditions: [] }],
        reason: 'Test'
    });

    tm.failCurrentTask('Cannot find nothing');
    assert(tm.currentTask.id === parentId, 'parent restored after subtask failure');
    assert(tm.currentTask.status === 'active', 'parent is active');
}

// ─── pauseTask / resumeTask ──────────────────────────────────────

console.log('\n=== pauseTask / resumeTask ===\n');

// Test 27
{
    const tm = new TaskManager(true);
    tm.pushTask({
        name: 'Test',
        steps: [{ step: 1, goal: 'G', command: '!collectBlocks("dirt", 1)', preconditions: [] }],
        reason: 'Test'
    });

    const ok = tm.pauseTask(tm.currentTask.id, 'Need subtask');
    assert(ok === true, 'pauseTask returns true');
    assert(tm.currentTask.status === 'paused', 'status is paused');
}

// Test 28
{
    const tm = new TaskManager(true);
    const ok = tm.pauseTask('nonexistent', 'Test');
    assert(ok === false, 'pauseTask nonexistent returns false');
}

// Test 29
{
    const tm = new TaskManager(true);
    tm.pushTask({
        name: 'Test',
        steps: [{ step: 1, goal: 'G', command: '!collectBlocks("dirt", 1)', preconditions: [] }],
        reason: 'Test'
    });
    tm.pauseTask(tm.currentTask.id, 'Pause');
    const ok = tm.resumeTask(tm.currentTask.id, 'Resume');
    assert(ok === true, 'resumeTask returns true');
    assert(tm.currentTask.status === 'active', 'status is active again');
}

// ─── _trimCompletedTasks ─────────────────────────────────────────

console.log('\n=== _trimCompletedTasks ===\n');

// Test 31: trimming at MAX_COMPLETED_TASKS
{
    const tm = new TaskManager(true);
    // Manually fill completedTasks to trigger trimming
    for (let i = 0; i < 102; i++) {
        tm.completedTasks.push({ id: `old_${i}`, name: `Old task ${i}`, status: 'completed' });
    }
    assert(tm.completedTasks.length === 102, 'filled to 102');

    // Trigger trim via popTask (which calls _trimCompletedTasks)
    tm.pushTask({
        name: 'Temp',
        steps: [{ step: 1, goal: 'G', command: '!collectBlocks("dirt", 1)', preconditions: [] }],
        reason: 'Test'
    });
    tm.popTask(tm.currentTask.id, 'Done');

    assert(tm.completedTasks.length < 102, 'completedTasks was trimmed');
}

// ─── run() completion verification ───────────────────────────────

console.log('\n=== run() completion verification ===\n');

// Test 32: target exists in inventory → completed
{
    const tm = new TaskManager(true);
    tm.pushTask({
        name: 'Craft iron sword',
        steps: [],
        reason: 'Test',
        metadata: { targetItem: 'iron_sword', targetCount: 1 }
    });

    const mockBot = {
        inventory: {
            items: () => [{ name: 'iron_sword', count: 1 }]
        }
    };

    await tm.run(
        async () => ({ response: 'unused' }),
        async () => ({ success: true, reason: 'unused', subtask: null }),
        { bot: mockBot }
    );

    assert(tm.currentTask === null, 'run success: currentTask cleared');
    const completed = tm.completedTasks[tm.completedTasks.length - 1];
    assert(completed?.status === 'completed', 'run success: task marked completed');
}

// Test 33: target missing in inventory → failed
{
    const tm = new TaskManager(true);
    tm.pushTask({
        name: 'Craft iron sword',
        steps: [],
        reason: 'Test',
        metadata: { targetItem: 'iron_sword', targetCount: 1 }
    });

    const mockBot = {
        inventory: {
            items: () => []
        }
    };

    await tm.run(
        async () => ({ response: 'unused' }),
        async () => ({ success: true, reason: 'unused', subtask: null }),
        { bot: mockBot }
    );

    assert(tm.currentTask === null, 'run failure: currentTask cleared');
    const completed = tm.completedTasks[tm.completedTasks.length - 1];
    assert(completed?.status === 'failed', 'run failure: task marked failed');
    assert(completed?.failReason?.includes('Target missing'), 'run failure: reason mentions missing target');
}

// ─── run() bounded retry (no replan, no subtask) ─────────────────

console.log('\n=== run() bounded retry ===\n');

// Test 34: step fails MAX_STEP_RETRIES times → failCurrentTask, no subtask created
{
    const tm = new TaskManager(false);
    tm.pushTask({
        name: 'Impossible task',
        steps: [{ step: 1, goal: 'Mine bedrock', command: '!collectBlocks("bedrock", 1)', preconditions: [] }],
        reason: 'Test'
    });

    let executeCallCount = 0;
    await tm.run(
        async () => { executeCallCount++; return {}; },
        async () => ({ success: false, reason: 'cannot mine bedrock' }),
        { bot: null }
    );

    const last = tm.completedTasks[tm.completedTasks.length - 1];
    assert(last?.status === 'failed', 'Test 34: task fails after MAX_STEP_RETRIES exhausted');
    assert(tm.taskStack.length === 0, 'Test 34: task stack is empty after failure');
    assert(tm.currentTask === null, 'Test 34: no current task remains');
    assert(executeCallCount === 3, 'Test 34: executeStep called exactly MAX_STEP_RETRIES (3) times');
}

// Test 35: judgment returns subtask field → subtask ignored, bounded retry still fails task
{
    const tm = new TaskManager(false);
    tm.pushTask({
        name: 'Task with subtask judge',
        steps: [{ step: 1, goal: 'Collect diamond', command: '!collectBlocks("diamond_ore", 1)', preconditions: [] }],
        reason: 'Test'
    });

    let callCount = 0;
    await tm.run(
        async () => ({}),
        async () => {
            callCount++;
            return {
                success: false,
                reason: 'no diamond',
                subtask: { name: 'Get pickaxe', steps: [{ goal: 'Craft pickaxe', command: '!craftRecipe("diamond_pickaxe",1)', action_cmd: ['!craftRecipe("diamond_pickaxe",1)'], preconditions: [] }] }
            };
        },
        { bot: null }
    );

    const last = tm.completedTasks[tm.completedTasks.length - 1];
    assert(last?.status === 'failed', 'Test 35: task fails even when judge returns subtask (subtask ignored)');
    assert(tm.taskStack.length === 0, 'Test 35: no subtask was pushed onto stack');
    assert(callCount === 3, 'Test 35: called MAX_STEP_RETRIES times, subtask never created');
}

// ─── Summary ─────────────────────────────────────────────────────

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
