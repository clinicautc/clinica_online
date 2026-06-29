const express = require('express');
const router = express.Router();
const horariosController = require('../controllers/horariosController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.get('/horarios/:usuarioId', requireAuth, requireRole(['admin', 'master']), horariosController.getByUsuario);
router.put('/horarios/:usuarioId', requireAuth, requireRole(['admin', 'master']), horariosController.upsert);

module.exports = router;
