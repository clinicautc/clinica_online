const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistenciaController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.get('/asistencia', requireAuth, requireRole(['admin', 'master']), asistenciaController.getByFecha);
router.post('/asistencia', requireAuth, requireRole(['admin', 'master']), asistenciaController.registrar);
router.get('/asistencia/mes', requireAuth, requireRole(['admin', 'master']), asistenciaController.getByMes);
router.get('/asistencia/practicante/:usuarioId', requireAuth, requireRole(['admin', 'master']), asistenciaController.getByPracticante);

module.exports = router;
