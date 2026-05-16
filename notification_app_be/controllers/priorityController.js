const { fetchNotifications } = require('../services/notificationService');
const { getTopNotifications } = require('../algorithms/topNotifications');
const { Log } = require('../../logging_middleware/logger');

async function getPriorityNotifications(req, res) {
    try {
        const count = parseInt(req.params.count, 10);
        await Log("backend", "info", "controller", `Priority inbox request received for top ${count}`);

        if (isNaN(count) || count <= 0) {
            await Log("backend", "error", "controller", "Invalid count parameter");
            return res.status(400).json({ error: "Count must be a positive integer" });
        }

        const data = await fetchNotifications();
        const notifications = data.notifications || data || [];

        const topNotifications = await getTopNotifications(notifications, count);

        await Log("backend", "info", "controller", `Returning ${topNotifications.length} priority notifications`);

        return res.status(200).json({
            count: topNotifications.length,
            notifications: topNotifications
        });

    } catch (error) {
        process.stderr.write(`Error in priorityController: ${error.message}\n`);
        await Log("backend", "error", "controller", `Priority controller error: ${error.message}`);
        return res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = {
    getPriorityNotifications
};
