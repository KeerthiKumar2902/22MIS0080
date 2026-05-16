const { fetchDepots } = require('./services/depotService');
const { fetchVehicles } = require('./services/vehicleService');

(async () => {
    try {
        process.stdout.write("Testing depot API...\n");
        const depotsResponse = await fetchDepots();
        process.stdout.write(JSON.stringify(depotsResponse, null, 2) + "\n\n");

        process.stdout.write("Testing vehicle API...\n");
        const vehiclesResponse = await fetchVehicles();
        process.stdout.write(JSON.stringify(vehiclesResponse, null, 2) + "\n\n");

        process.stdout.write("Combined API tests passed successfully.\n");
    } catch (error) {
        process.stderr.write(`Test suite failed: ${error.message}\n`);
    }
})();
