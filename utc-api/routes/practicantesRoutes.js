const express = require('express');
const router = express.Router();
const practicantesController = require('../controllers/practicantesController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.get('/practicantes', requireAuth, requireRole(['admin', 'master']), practicantesController.getAll);
router.post('/practicantes', requireAuth, requireRole(['admin', 'master']), practicantesController.create);
router.put('/practicantes/:id', requireAuth, requireRole(['admin', 'master']), practicantesController.updateStatus);

module.exports = router;
