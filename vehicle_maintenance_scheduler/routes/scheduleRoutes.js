const express = require('express');
const { getOptimizedSchedule } = require('../controllers/scheduleController');

const router = express.Router();

router.get('/:depotId', getOptimizedSchedule);

module.exports = router;
