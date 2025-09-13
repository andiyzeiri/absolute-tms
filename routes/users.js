const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { userValidation, handleValidationErrors } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Get all users in company (admin only)
router.get('/', UserController.getUsersByCompany);

// Invite new user to company (admin only)
router.post('/invite',
  [
    require('express-validator').body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name is required and must be less than 50 characters'),
    require('express-validator').body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name is required and must be less than 50 characters'),
    require('express-validator').body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    require('express-validator').body('role')
      .isIn(['dispatcher', 'driver', 'customer'])
      .withMessage('Role must be dispatcher, driver, or customer'),
    require('express-validator').body('phone')
      .optional()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Please provide a valid phone number')
  ],
  handleValidationErrors,
  UserController.inviteUser
);

// Update user details (admin only)
router.put('/:userId',
  [
    require('express-validator').body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    require('express-validator').body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    require('express-validator').body('role')
      .optional()
      .isIn(['admin', 'dispatcher', 'driver', 'customer'])
      .withMessage('Invalid role'),
    require('express-validator').body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],
  handleValidationErrors,
  UserController.updateUser
);

// Deactivate user (admin only)
router.delete('/:userId', UserController.deactivateUser);

module.exports = router;