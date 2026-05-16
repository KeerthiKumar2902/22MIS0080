require('dotenv').config({ path: '../.env' });
const express = require('express');
const { Log } = require('../logging_middleware/logger');

const app = express();

app.use(express.json());

app.listen(3000, async () => {
    process.stdout.write("Server running on port 3000\n");
    
    const logResponse = await Log("backend", "info", "route", "Vehicle Maintenance Server started on port 3000");
    if (!logResponse.success) {
        process.stderr.write(`Logger failed: ${logResponse.error}\n`);
    }
});
