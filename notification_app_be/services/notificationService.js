require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const { Log } = require('../../logging_middleware/logger');

/**
 * Fetches notifications from the protected API.
 * @returns {Promise<Array>} Array of notification objects.
 */
async function fetchNotifications() {
    const baseUrl = process.env.BASE_URL || process.env.EVALUATION_SERVICE_URL;
    const token = process.env.AUTH_TOKEN;

    if (!baseUrl || !token) {
        throw new Error("Missing BASE_URL or AUTH_TOKEN environment variables");
    }

    try {
        await Log("backend", "info", "service", "Initiating fetch to notifications API");

        const response = await axios.get(`${baseUrl}/notifications`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        await Log("backend", "info", "service", "Successfully fetched notifications from API");
        return response.data;
    } catch (error) {
        const errorMessage = error.response 
            ? `API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}` 
            : `Network/Client Error: ${error.message}`;

        process.stderr.write(`Failed to fetch notifications: ${errorMessage}\n`);
        await Log("backend", "error", "service", `Failed to fetch notifications: ${errorMessage}`);
        throw error;
    }
}

module.exports = {
    fetchNotifications
};
