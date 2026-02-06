const express = require('express');
const { body } = require('express-validator');
const {
  signup,
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  sendVerificationEmail,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
} = require('../controllers/authController');
const { protect, authorize, handlePreviewMode, blockPreviewWrites } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

const updatePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

const verifyEmailValidation = [
  body('token').notEmpty().withMessage('Verification token is required'),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const resendVerificationValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
];

// Routes
// Public signup route (no authentication required)
router.post(
  '/signup',
  registerValidation,
  validate,
  signup
);

// Admin-only registration route
router.post(
  '/register',
  protect,
  authorize('admin'),
  registerValidation,
  validate,
  register
);

router.post('/login', loginValidation, validate, login);

router.get('/me', protect, handlePreviewMode, getMe);

router.put('/updatedetails', protect, handlePreviewMode, blockPreviewWrites, updateDetails);

router.put(
  '/updatepassword',
  protect,
  handlePreviewMode,
  blockPreviewWrites,
  updatePasswordValidation,
  validate,
  updatePassword
);

// Email verification routes
router.post(
  '/send-verification',
  protect,
  handlePreviewMode,
  blockPreviewWrites,
  sendVerificationEmail
);

router.post(
  '/verify-email',
  verifyEmailValidation,
  validate,
  verifyEmail
);

router.post(
  '/resend-verification',
  resendVerificationValidation,
  validate,
  resendVerificationEmail
);

// Password reset routes
router.post(
  '/forgot-password',
  (req, res, next) => {
    console.log('🔥 [ROUTE] /auth/forgot-password HIT');
    console.log('Request body:', req.body);
    next();
  },
  forgotPasswordValidation,
  validate,
  requestPasswordReset
);

router.post(
  '/reset-password',
  resetPasswordValidation,
  validate,
  resetPassword
);

module.exports = router;