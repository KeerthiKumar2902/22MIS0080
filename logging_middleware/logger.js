const axios = require('axios');
const { validateParams } = require('./validator');

async function Log(stack, level, pkg, message) {
    try {
        validateParams(stack, level, pkg);

        const apiUrl = process.env.EVALUATION_SERVICE_URL || 'http://4.224.186.213/evaluation-service';
        const logEndpoint = `${apiUrl}/logs`;
        const authToken = process.env.AUTH_TOKEN;

        if (!authToken) {
            throw new Error("AUTH_TOKEN missing in environment");
        }

        const payload = {
            stack,
            level,
            package: pkg,
            message
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, 5000);

        try {
            const response = await axios.post(logEndpoint, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                signal: controller.signal
            });

            clearTimeout(timeout);

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            clearTimeout(timeout);
            
            let errorMessage = error.message;
            if (error.response) {
                errorMessage = `Logging API failed | Status: ${error.response.status} | Response: ${JSON.stringify(error.response.data)}`;
            } else if (error.code === 'ERR_CANCELED') {
                errorMessage = 'Logging API timeout after 5000ms';
            }
            
            throw new Error(errorMessage);
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    Log
};
