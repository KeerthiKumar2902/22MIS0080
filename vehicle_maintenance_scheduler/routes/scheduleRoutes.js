const express = require('express');
const { fetchDepots } = require('../services/depotService');
const { fetchVehicles } = require('../services/vehicleService');
const { optimizeSchedule } = require('../algorithms/scheduler');
const { Log } = require('../../logging_middleware/logger');

const router = express.Router();

router.get('/generate', async (req, res) => {
    try {
        await Log("backend", "info", "route", "Triggered schedule generation route");

        // 1. Fetch from Services
        const [depotsData, vehiclesData] = await Promise.all([
            fetchDepots(),
            fetchVehicles()
        ]);

        const depots = depotsData.depots || [];
        const vehicles = vehiclesData.vehicles || [];

        // 2. Pass to Algorithm
        const optimizedOutput = optimizeSchedule(depots, vehicles);

        await Log("backend", "info", "route", "Successfully generated optimized schedule");

        // 3. Return Final Output
        res.status(200).json({
            success: true,
            data: optimizedOutput
        });

    } catch (error) {
        process.stderr.write(`Schedule Generation Failed: ${error.message}\n`);
        await Log("backend", "error", "route", `Schedule generation failed: ${error.message}`);
        
        res.status(500).json({
            success: false,
            error: "Failed to generate schedule. Check server logs."
        });
    }
});

module.exports = router;
