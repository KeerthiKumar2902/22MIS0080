const { calculatePriority } = require('./priorityEngine');
const { Log } = require('../../logging_middleware/logger');

/**
 * Filters for unread notifications, scores them, and sorts to return the top N.
 * 
 * Sorting Complexity: O(N log N) dominated by the native Array.sort() operation,
 * where N is the number of unread notifications.
 * 
 * @param {Array} notifications - The raw array of notifications
 * @param {number} topN - The maximum number of notifications to return
 * @returns {Array} The sliced, priority-sorted array of unread notifications
 */
async function getTopNotifications(notifications, topN) {
    await Log("backend", "info", "algorithm", `Priority calculation started for ${notifications.length} notifications`);

    // 1. Filter out already read notifications
    const unread = notifications.filter(notif => !notif.isRead);

    // 2. Score each notification dynamically
    const scoredNotifications = unread.map(notif => {
        return {
            ...notif,
            priorityScore: calculatePriority(notif)
        };
    });

    // 3. Sort descending based on priorityScore
    scoredNotifications.sort((a, b) => b.priorityScore - a.priorityScore);

    // 4. Extract Top N elements
    const topResults = scoredNotifications.slice(0, topN);

    await Log("backend", "info", "algorithm", `Sorting completed. Returning top ${topResults.length} unread notifications`);

    return topResults;
}

module.exports = {
    getTopNotifications
};
