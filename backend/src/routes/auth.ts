import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  logout,
  facebookAuth,
  checkUsername,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  sendVerificationEmailEndpoint,
  verifyEmailRedirect,
  resetPasswordRedirect,
} from '../controllers/authController';
import { sendVerificationCode, verifyPhoneCode } from '../controllers/phoneVerificationController';
import { protect } from '../middleware/auth';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/facebook', facebookAuth);

// Email verification
router.post('/verify-email', verifyEmail);
// Private endpoint: resend verification email for the authenticated user
router.post('/send-verification-email', protect, sendVerificationEmailEndpoint);
router.get('/verify-email-redirect', verifyEmailRedirect);

// Password reset
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/reset-password-redirect', resetPasswordRedirect);

// Username availability
router.get('/check-username', checkUsername);

// SMS phone verification
router.post('/send-verification-code', sendVerificationCode);
router.post('/verify-phone', verifyPhoneCode);

router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;







