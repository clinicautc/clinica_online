// --- authRoutes.js ---

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/validate-session', authController.validateSession);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

router.post('/pre-register', authController.preRegister);
router.post('/verify-and-register', authController.verifyAndRegister);
router.post('/forgot-password', authController.forgotPassword);
router.post('/resend-code', authController.resendCode);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
