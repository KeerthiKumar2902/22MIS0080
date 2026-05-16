/**
 * Calculates a numerical priority score for a notification.
 * 
 * Scoring Logic:
 * 1. Base Type Priority: Placement = 1000, Result = 500, Event = 100
 *    - Placement notifications are highly critical and strictly outrank other types.
 * 2. Recency Score:
 *    - We use the notification's timestamp relative to the current time.
 *    - A simple exponential or linear decay can be used. For this system, we subtract
 *      the age of the notification (in hours) to give a slight edge to newer items.
 * 
 * Overall Priority = BasePriority - (AgeInHours * Weight)
 * 
 * @param {Object} notification - Notification object containing Type and Timestamp
 * @returns {number} The calculated priority score (higher is more important)
 */
function calculatePriority(notification) {
    let baseScore = 0;
    
    // Evaluate explicit type priority
    switch (notification.Type) {
        case 'Placement':
            baseScore = 10000;
            break;
        case 'Result':
            baseScore = 5000;
            break;
        case 'Event':
            baseScore = 1000;
            break;
        default:
            baseScore = 0;
    }

    // Evaluate recency priority
    // Calculate the age of the notification in hours
    const notifTime = new Date(notification.Timestamp).getTime();
    const currentTime = Date.now();
    const ageInHours = (currentTime - notifTime) / (1000 * 60 * 60);

    // Apply a minor decay based on age (1 point per hour). 
    // This ensures a 10-day old Placement (10000 - 240) still outranks a brand new Result (5000).
    // Math.max ensures we don't accidentally subtract negative hours for future timestamps.
    const recencyPenalty = Math.max(0, ageInHours);

    return baseScore - recencyPenalty;
}

module.exports = {
    calculatePriority
};
