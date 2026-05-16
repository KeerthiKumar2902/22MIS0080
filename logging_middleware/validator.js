const {
    ALLOWED_STACKS,
    ALLOWED_LEVELS,
    ALLOWED_BACKEND_PACKAGES,
    ALLOWED_FRONTEND_PACKAGES,
    ALLOWED_COMMON_PACKAGES
} = require('./constants');

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

module.exports = {
    validateParams
};
