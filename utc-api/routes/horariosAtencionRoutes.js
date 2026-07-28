const express = require('express');
const router = express.Router();
const horariosAtencionController = require('../controllers/horariosAtencionController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Lectura: cualquier usuario autenticado (el paciente la necesita para armar
// su calendario de citas). Escritura: solo master.
router.get('/horarios-atencion/:area', requireAuth, horariosAtencionController.getHorarios);
router.put('/horarios-atencion/:area', requireAuth, requireRole(['master']), horariosAtencionController.upsertHorarios);

router.get('/cierres-clinicos/:area', requireAuth, horariosAtencionController.getCierres);
router.post('/cierres-clinicos', requireAuth, requireRole(['master']), horariosAtencionController.crearCierre);
router.delete('/cierres-clinicos/:id', requireAuth, requireRole(['master']), horariosAtencionController.eliminarCierre);

router.get('/consultorios/:area', requireAuth, horariosAtencionController.getConsultorios);
router.put('/consultorios/:area', requireAuth, requireRole(['master']), horariosAtencionController.upsertConsultorios);

module.exports = router;
