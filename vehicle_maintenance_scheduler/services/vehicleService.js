require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const { Log } = require('../../logging_middleware/logger');

async function fetchVehicles() {
    const baseUrl = process.env.BASE_URL || process.env.EVALUATION_SERVICE_URL;
    const token = process.env.AUTH_TOKEN;

    if (!baseUrl) {
        throw new Error("BASE_URL is missing from environment variables");
    }

    if (!token) {
        throw new Error("AUTH_TOKEN is missing from environment variables");
    }

    try {
        await Log("backend", "info", "service", "Initiating fetch to vehicles API");

        const response = await axios.get(`${baseUrl}/vehicles`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        await Log("backend", "info", "service", "Successfully fetched vehicles API");

        return response.data;
    } catch (error) {
        const errorMessage = error.response 
            ? `API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}` 
            : `Network/Client Error: ${error.message}`;

        process.stderr.write(`Failed to fetch vehicles: ${errorMessage}\n`);
        
        await Log("backend", "error", "service", `Failed to fetch vehicles: ${errorMessage}`);
        
        throw error;
    }
}

module.exports = {
    fetchVehicles
};
