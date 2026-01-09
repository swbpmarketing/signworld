const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
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

// Routes
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

module.exports = router;