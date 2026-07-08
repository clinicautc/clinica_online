const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');
const consentimientosController = require('../controllers/consentimientosController');
const { requireAuth, requireRole, canModifyAppointment } = require('../middleware/authMiddleware');

router.get('/citas', requireAuth, citasController.getAll);
router.get('/citas/paciente/:id', requireAuth, citasController.getByPaciente);
router.get('/citas/disponibilidad', requireAuth, citasController.getDisponibilidad);
router.get('/citas/dias-completos',  requireAuth, citasController.getDiasCompletos);
router.post('/citas', requireAuth, requireRole(['paciente', 'admin', 'master']), citasController.create);
// Se agregó requireRole(['paciente', 'admin', 'master']) para permitir que los coordinadores (admin) puedan re-agendar desde su panel.
router.put('/citas/:id', requireAuth, canModifyAppointment, citasController.update);
router.delete('/citas/:id', requireAuth, canModifyAppointment, citasController.remove);
router.patch('/citas/:id/asignar', requireAuth, requireRole(['admin', 'master']), citasController.asignar);

// Ciclo de vida clínico — sin canModifyAppointment (practicante necesita acceso)
router.get('/citas/:id',                requireAuth, citasController.getById);
router.patch('/citas/:id/iniciar',      requireAuth, requireRole(['practicante']), citasController.iniciar);
router.patch('/citas/:id/finalizar',    requireAuth, requireRole(['practicante']), citasController.finalizar);
router.patch('/citas/:id/no-asistio',   requireAuth, requireRole(['practicante', 'admin', 'master']), citasController.noAsistio);
router.patch('/citas/:id/revertir',     requireAuth, requireRole(['admin', 'master']), citasController.revertirAProgramada);
router.patch('/citas/:id/recuperar',    requireAuth, requireRole(['admin', 'master']), citasController.recuperar);
router.patch('/citas/:id/borrador',     requireAuth, requireRole(['practicante']), citasController.guardarBorrador);
router.post('/citas/:id/consentimiento',            requireAuth, requireRole(['practicante', 'admin', 'master']), consentimientosController.upload);
router.get('/citas/:id/consentimiento',             requireAuth, consentimientosController.check);
router.get('/citas/:id/consentimiento/descargar',   requireAuth, consentimientosController.descargar);
router.delete('/citas/:id/consentimiento',          requireAuth, requireRole(['practicante', 'admin', 'master']), consentimientosController.eliminar);

module.exports = router;
