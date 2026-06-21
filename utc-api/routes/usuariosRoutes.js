const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { requireAuth, requireRole, requireSameArea } = require('../middleware/authMiddleware');

router.get('/usuarios', requireAuth, requireRole(['admin', 'master']), usuariosController.getAll);
router.get('/usuarios/:id', requireAuth, usuariosController.getById);
router.patch('/usuarios/:id', requireAuth, usuariosController.updateProfile);
router.put('/usuarios/:id', requireAuth, requireRole(['admin', 'master']), requireSameArea, usuariosController.updateStatus);
router.delete('/usuarios/:id', requireAuth, requireRole(['admin', 'master']), requireSameArea, usuariosController.remove);

module.exports = router;
