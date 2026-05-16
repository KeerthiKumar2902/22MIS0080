require('dotenv').config({ path: '../.env' });
const express = require('express');
const { Log } = require('../logging_middleware/logger');
const priorityRoutes = require('./routes/priorityRoutes');

const app = express();

app.use(express.json());

app.use('/api/priority', priorityRoutes);

app.listen(5000, async () => {
    process.stdout.write("Notification service running on port 5000\n");

    const logResponse = await Log("backend", "info", "route", "Notification priority inbox service started");
    if (!logResponse.success) {
        process.stderr.write(`Logger failed: ${logResponse.error}\n`);
    }
});
