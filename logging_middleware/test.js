const { Log } = require('./logger');

(async () => {
    // This requires AUTH_TOKEN to be set in your environment
    const result = await Log(
        "backend",
        "info",
        "service",
        "Logger test successful"
    );

    if (result.success) {
        console.log("Test passed:", result.data);
    } else {
        console.error("Test failed:", result.error);
    }
})();
