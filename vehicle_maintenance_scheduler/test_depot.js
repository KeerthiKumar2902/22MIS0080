const { fetchDepots } = require('./services/depotService');

(async () => {
    try {
        process.stdout.write("Testing fetchDepots...\n");
        const data = await fetchDepots();
        process.stdout.write(`\nSuccess! Fetched data:\n`);
        process.stdout.write(JSON.stringify(data, null, 2) + "\n");
    } catch (error) {
        process.stderr.write(`\nTest failed: ${error.message}\n`);
    }
})();
