const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');
const { requireAuth, requireRole, canModifyAppointment } = require('../middleware/authMiddleware');

router.get('/citas', requireAuth, citasController.getAll);
router.get('/citas/paciente/:id', requireAuth, citasController.getByPaciente);
router.get('/citas/disponibilidad', requireAuth, citasController.getDisponibilidad);
router.post('/citas', requireAuth, requireRole(['paciente', 'admin', 'master']), citasController.create);
// Se agregó requireRole(['paciente', 'admin', 'master']) para permitir que los coordinadores (admin) puedan re-agendar desde su panel.
router.put('/citas/:id', requireAuth, canModifyAppointment, citasController.update);
router.delete('/citas/:id', requireAuth, canModifyAppointment, citasController.remove);
router.patch('/citas/:id/asignar', requireAuth, requireRole(['admin', 'master']), citasController.asignar);

module.exports = router;
