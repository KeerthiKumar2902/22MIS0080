const ALLOWED_STACKS = ['backend', 'frontend'];
const ALLOWED_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];
const ALLOWED_BACKEND_PACKAGES = ['cache', 'controller', 'cron_job', 'db', 'domain', 'handler', 'repository', 'route', 'service'];
const ALLOWED_FRONTEND_PACKAGES = ['api', 'component', 'hook', 'page', 'state', 'style'];
const ALLOWED_COMMON_PACKAGES = ['auth', 'config', 'middleware', 'utils'];

module.exports = {
    ALLOWED_STACKS,
    ALLOWED_LEVELS,
    ALLOWED_BACKEND_PACKAGES,
    ALLOWED_FRONTEND_PACKAGES,
    ALLOWED_COMMON_PACKAGES
};
