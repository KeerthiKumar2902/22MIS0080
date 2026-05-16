const { fetchDepots } = require('../services/depotService');
const { fetchVehicles } = require('../services/vehicleService');
const { optimizeTasks } = require('../algorithms/scheduler');
const { Log } = require('../../logging_middleware/logger');

async function getOptimizedSchedule(req, res) {
    try {
        const depotId = parseInt(req.params.depotId, 10);
        await Log("backend", "info", "controller", `Request received for depotId: ${depotId}`);

        if (isNaN(depotId)) {
            await Log("backend", "error", "controller", "Invalid depot ID format");
            return res.status(400).json({ error: "Invalid depot ID" });
        }

        const depotsData = await fetchDepots();
        const depots = depotsData.depots || [];

        const targetDepot = depots.find(d => d.ID === depotId);
        
        if (!targetDepot) {
            await Log("backend", "error", "controller", `Depot ${depotId} not found`);
            return res.status(404).json({ error: "Depot not found" });
        }

        await Log("backend", "info", "controller", `Depot ${depotId} selected. Available hours: ${targetDepot.MechanicHours}`);

        const vehiclesData = await fetchVehicles();
        const tasks = vehiclesData.vehicles || [];

        const optimizationResult = await optimizeTasks(tasks, targetDepot.MechanicHours);

        const response = {
            depotId: targetDepot.ID,
            availableHours: targetDepot.MechanicHours,
            totalImpact: optimizationResult.totalImpact,
            totalDuration: optimizationResult.totalDuration,
            selectedTasks: optimizationResult.selectedTasks
        };

        return res.status(200).json(response);

    } catch (error) {
        process.stderr.write(`Error in scheduleController: ${error.message}\n`);
        await Log("backend", "error", "controller", `Schedule controller error: ${error.message}`);
        return res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = {
    getOptimizedSchedule
};
