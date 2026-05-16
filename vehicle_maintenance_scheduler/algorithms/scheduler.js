const { Log } = require('../../logging_middleware/logger');

/**
 * 0/1 Knapsack optimization for vehicle maintenance tasks.
 * 
 * @param {Array} tasks - Array of vehicle task objects { TaskID, Duration, Impact }
 * @param {number} maxHours - Available mechanic hours
 * @returns {Promise<Object>} Optimized schedule { totalImpact, totalDuration, selectedTasks }
 */
async function optimizeTasks(tasks, maxHours) {
    await Log("backend", "info", "algorithm", `Optimization started for maxHours: ${maxHours}`);

    const n = tasks.length;
    // DP array initialization: dp[w] stores max impact for exactly w capacity
    const dp = new Array(maxHours + 1).fill(0);
    // Track selected items to backtrack
    const selected = Array.from({ length: n }, () => new Array(maxHours + 1).fill(false));

    for (let i = 0; i < n; i++) {
        const { Duration, Impact } = tasks[i];
        for (let w = maxHours; w >= Duration; w--) {
            if (dp[w - Duration] + Impact > dp[w]) {
                dp[w] = dp[w - Duration] + Impact;
                selected[i][w] = true;
            }
        }
    }

    let w = maxHours;
    const selectedTasks = [];
    let totalDuration = 0;

    for (let i = n - 1; i >= 0; i--) {
        if (selected[i][w]) {
            selectedTasks.push(tasks[i]);
            w -= tasks[i].Duration;
            totalDuration += tasks[i].Duration;
        }
    }

    // Preserve original order if preferred, or return reversed
    selectedTasks.reverse();

    await Log("backend", "info", "algorithm", `Optimization completed. Selected task count: ${selectedTasks.length}`);

    return {
        totalImpact: dp[maxHours],
        totalDuration,
        selectedTasks
    };
}

module.exports = {
    optimizeTasks
};
