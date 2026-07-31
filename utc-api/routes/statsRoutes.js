const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.get('/stats/eventos', requireAuth, requireRole(['admin', 'master']), statsController.getEventos);
router.get('/logs', requireAuth, requireRole(['admin', 'master']), statsController.getLogs);

module.exports = router;
