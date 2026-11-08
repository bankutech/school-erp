import { Router } from 'express';
import { login, logout, getMe, forgotPassword, resetPassword } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateToken } from '../../middleware/auth.js';
import { createRateLimiter } from '../../middleware/rateLimit.js';
import { LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from '@school-erp/shared';

const router = Router();

// Rate limiters for abuse prevention (15-minute sliding windows)
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 attempts per 15 min window
  message: 'Too many authentication attempts. Please wait 15 minutes before retrying.',
});

const forgotPasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 reset requests per 15 min window
  message: 'Too many password reset requests. Please wait 15 minutes before retrying.',
});

router.post('/login', loginLimiter, validateRequest(LoginSchema), login);
router.post('/forgot-password', forgotPasswordLimiter, validateRequest(ForgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateRequest(ResetPasswordSchema), resetPassword);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);

export default router;
