const express = require('express');
const router = express.Router();
const recomendacionesController = require('../controllers/recomendacionesController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.post('/recomendaciones', requireAuth, requireRole(['practicante', 'admin', 'master']), recomendacionesController.create);
router.get('/recomendaciones/paciente/:id', requireAuth, recomendacionesController.getByPaciente);

module.exports = router;
