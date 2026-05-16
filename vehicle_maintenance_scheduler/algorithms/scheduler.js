/**
 * Core algorithm for vehicle maintenance scheduling
 * (0/1 Knapsack variation)
 */

/**
 * Optimizes the vehicle maintenance schedule to maximize impact
 * while staying within the total available mechanic hours.
 * 
 * @param {Array} depots - Array of depot objects with { ID, MechanicHours }
 * @param {Array} vehicles - Array of vehicle task objects with { TaskID, Duration, Impact }
 * @returns {Object} - An object containing the optimized tasks, total used hours, and max impact.
 */
function optimizeSchedule(depots, vehicles) {
    // 1. Calculate total available capacity across all depots
    const totalCapacity = depots.reduce((sum, depot) => sum + depot.MechanicHours, 0);

    // 2. Initialize DP array and state tracking
    // dp[w] stores the maximum impact possible with w hours
    const dp = new Array(totalCapacity + 1).fill(0);
    
    // selected[i][w] tracks if item i was included to achieve dp[w]
    const selected = Array.from({ length: vehicles.length }, () => new Array(totalCapacity + 1).fill(false));

    // 3. Populate DP table
    for (let i = 0; i < vehicles.length; i++) {
        const { Duration, Impact } = vehicles[i];
        
        // Traverse backwards to allow item reuse (0/1 knapsack)
        for (let w = totalCapacity; w >= Duration; w--) {
            if (dp[w - Duration] + Impact > dp[w]) {
                dp[w] = dp[w - Duration] + Impact;
                selected[i][w] = true;
            }
        }
    }

    // 4. Backtrack to find which tasks were selected
    let w = totalCapacity;
    const chosenTasks = [];
    let totalUsedHours = 0;

    for (let i = vehicles.length - 1; i >= 0; i--) {
        if (selected[i][w]) {
            chosenTasks.push(vehicles[i]);
            w -= vehicles[i].Duration;
            totalUsedHours += vehicles[i].Duration;
        }
    }

    // 5. Return structured result
    return {
        maxImpact: dp[totalCapacity],
        totalCapacity,
        totalUsedHours,
        scheduledTasks: chosenTasks.reverse() // Reverse to maintain relative original order
    };
}

module.exports = {
    optimizeSchedule
};
