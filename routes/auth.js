const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { userValidation, handleValidationErrors } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth routes
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset requests, please try again later'
  }
});

// Public routes (no authentication required)
router.post('/register', 
  userValidation.register,
  handleValidationErrors,
  AuthController.register
);

router.post('/login', 
  authRateLimit,
  userValidation.login,
  handleValidationErrors,
  AuthController.login
);

router.post('/refresh-token', AuthController.refreshToken);

router.post('/forgot-password',
  passwordResetRateLimit,
  [
    require('express-validator').body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required')
  ],
  handleValidationErrors,
  AuthController.forgotPassword
);

router.post('/reset-password',
  [
    require('express-validator').body('token').notEmpty().withMessage('Reset token is required'),
    require('express-validator').body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
  ],
  handleValidationErrors,
  AuthController.resetPassword
);

// Protected routes (authentication required)
router.use(authenticateToken);

router.post('/logout', AuthController.logout);

router.get('/profile', AuthController.getProfile);

router.put('/change-password',
  [
    require('express-validator').body('currentPassword').notEmpty().withMessage('Current password is required'),
    require('express-validator').body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
  ],
  handleValidationErrors,
  AuthController.changePassword
);

module.exports = router;