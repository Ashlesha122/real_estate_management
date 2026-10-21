import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, (req, res, next) => authController.register(req, res, next));
router.post('/login', authLimiter, (req, res, next) => authController.login(req, res, next));
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', authenticate, (req, res) => authController.logout(req, res));
router.post('/verify-otp', authenticate, otpLimiter, (req, res, next) => authController.verifyOtp(req, res, next));
router.post('/resend-otp', authenticate, otpLimiter, (req, res, next) => authController.resendOtp(req, res, next));
router.post('/change-password', authenticate, (req, res, next) => authController.changePassword(req, res, next));

export default router;
