const express = require('express');
const router = express.Router();
const notasController = require('../controllers/notasController');
const seguimientoNutricionalController = require('../controllers/seguimientoNutricionalController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const STAFF        = ['practicante', 'admin', 'master'];
const COORDINACION = ['admin', 'master'];

router.get('/notas-evolucion/:id', requireAuth, requireRole(STAFF), notasController.getEvolucion);
router.get('/notas-evolutivas/paciente/:id', notasController.getEvolucionByPaciente);
router.post('/notas-evolucion', requireAuth, requireRole(STAFF), notasController.createEvolucion);
router.put('/notas-evolucion/:id', requireAuth, requireRole(STAFF), notasController.updateEvolucion);

// Seguimiento Nutricional — exclusivo de nutrición, documento por columnas
// con bloqueo progresivo (ver seguimientoNutricionalController.js).
router.get('/seguimiento-nutricional/:appointmentId', requireAuth, requireRole(STAFF), seguimientoNutricionalController.getSeguimiento);
router.put('/seguimiento-nutricional/:appointmentId', requireAuth, requireRole(STAFF), seguimientoNutricionalController.guardarSeguimiento);

router.get('/notas_universitarias', requireAuth, notasController.getUniversitarias);
router.post('/notas_universitarias', requireAuth, requireRole(STAFF), notasController.createUniversitaria);
router.post('/notas_universitarias/:id/responder', requireAuth, requireRole(COORDINACION), notasController.responderUniversitaria);

module.exports = router;
