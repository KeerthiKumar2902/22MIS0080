require('dotenv').config({ path: '../.env' });
const express = require('express');
const { Log } = require('../logging_middleware/logger');
const scheduleRoutes = require('./routes/scheduleRoutes');

const app = express();

app.use(express.json());

app.use('/api/schedule', scheduleRoutes);

app.listen(4000, async () => {
    process.stdout.write("Server running on port 4000\n");
    
    const logResponse = await Log("backend", "info", "route", "Vehicle scheduler service started");
    if (!logResponse.success) {
        process.stderr.write(`Logger failed: ${logResponse.error}\n`);
    }
});
