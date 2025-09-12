const express = require('express');
const router = express.Router();
const DemoAuthController = require('../controllers/demoAuthController');
const { authenticateToken } = require('../middleware/demoAuth');
const { userValidation, handleValidationErrors } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth routes
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window for demo
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (no authentication required)
router.post('/register', 
  userValidation.register,
  handleValidationErrors,
  DemoAuthController.register
);

router.post('/login', 
  authRateLimit,
  userValidation.login,
  handleValidationErrors,
  DemoAuthController.login
);

router.post('/refresh-token', DemoAuthController.refreshToken);

// Demo forgot password (just returns success for demo)
router.post('/forgot-password', (req, res) => {
  res.json({
    success: true,
    message: 'Password reset instructions sent to your email',
    note: 'This is a demo - no email was actually sent'
  });
});

// Demo reset password (just returns success for demo)
router.post('/reset-password', (req, res) => {
  res.json({
    success: true,
    message: 'Password reset successfully',
    note: 'This is a demo - password was not actually changed'
  });
});

// Protected routes (authentication required)
router.use(authenticateToken);

router.post('/logout', DemoAuthController.logout);

router.get('/profile', DemoAuthController.getProfile);

// Demo change password
router.put('/change-password', (req, res) => {
  res.json({
    success: true,
    message: 'Password changed successfully',
    note: 'This is a demo - password was not actually changed'
  });
});

module.exports = router;