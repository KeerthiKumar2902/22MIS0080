const express = require('express');
const { getPriorityNotifications } = require('../controllers/priorityController');

const router = express.Router();

router.get('/:count', getPriorityNotifications);

module.exports = router;
