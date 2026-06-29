const express = require('express');
const router = express.Router();
const practicantesController = require('../controllers/practicantesController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.get('/practicantes', requireAuth, requireRole(['admin', 'master']), practicantesController.getAll);
router.post('/practicantes', requireAuth, requireRole(['admin', 'master']), practicantesController.create);

module.exports = router;
