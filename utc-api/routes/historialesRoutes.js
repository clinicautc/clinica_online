const express = require('express');
const router = express.Router();
const historialesController = require('../controllers/historialesController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const STAFF = ['practicante', 'admin', 'master'];

router.get('/historiales', requireAuth, requireRole(STAFF), historialesController.getAll);
router.get('/historiales/verificar/:pacienteId/:area', requireAuth, requireRole(STAFF), historialesController.verificarRecurrencia);
router.put('/historiales/:id', requireAuth, requireRole(STAFF), historialesController.updateGenerico);
router.get('/historiales-nutricion/detalle/:appointmentId', requireAuth, requireRole(STAFF), historialesController.getNutricionDetalle);
router.get('/historiales-fisioterapia/detalle/:appointmentId', requireAuth, requireRole(STAFF), historialesController.getFisioterapiaDetalle);
router.get('/historiales-nutricion/paciente/:id', requireAuth, requireRole(STAFF), historialesController.getNutricionByPaciente);
router.get('/historiales-fisioterapia/paciente/:id', requireAuth, requireRole(STAFF), historialesController.getFisioterapiaByPaciente);
router.post('/historiales', requireAuth, requireRole(STAFF), historialesController.create);

module.exports = router;
