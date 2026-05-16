const ALLOWED_STACKS = ['backend', 'frontend'];
const ALLOWED_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];
const ALLOWED_BACKEND_PACKAGES = ['cache', 'controller', 'cron_job', 'db', 'domain', 'handler', 'repository', 'route', 'service'];
const ALLOWED_FRONTEND_PACKAGES = ['api', 'component', 'hook', 'page', 'state', 'style'];
const ALLOWED_COMMON_PACKAGES = ['auth', 'config', 'middleware', 'utils'];

function validateParams(stack, level, pkg) {
    if (!ALLOWED_STACKS.includes(stack)) {
        throw new Error(`Invalid stack: ${stack}. Allowed values: ${ALLOWED_STACKS.join(', ')}`);
    }
    if (!ALLOWED_LEVELS.includes(level)) {
        throw new Error(`Invalid level: ${level}. Allowed values: ${ALLOWED_LEVELS.join(', ')}`);
    }

    const isBackendPkg = ALLOWED_BACKEND_PACKAGES.includes(pkg);
    const isFrontendPkg = ALLOWED_FRONTEND_PACKAGES.includes(pkg);
    const isCommonPkg = ALLOWED_COMMON_PACKAGES.includes(pkg);

    if (stack === 'backend' && !isBackendPkg && !isCommonPkg) {
        throw new Error(`Invalid package for backend stack: ${pkg}`);
    }
    if (stack === 'frontend' && !isFrontendPkg && !isCommonPkg) {
        throw new Error(`Invalid package for frontend stack: ${pkg}`);
    }
}

async function Log(stack, level, pkg, message) {
    try {
        validateParams(stack, level, pkg);

        const apiUrl = process.env.EVALUATION_SERVICE_URL || 'http://4.224.186.213/evaluation-service';
        const logEndpoint = `${apiUrl}/logs`;
        const authToken = process.env.AUTH_TOKEN;

        if (!authToken) {
            console.warn("Warning: AUTH_TOKEN is not set in environment variables. Log may be rejected.");
        }

        const payload = {
            stack: stack,
            level: level,
            package: pkg,
            message: message
        };

        const response = await fetch(logEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        process.stderr.write(`Log failed: ${error.message}\n`);
    }
}

module.exports = {
    Log
};
