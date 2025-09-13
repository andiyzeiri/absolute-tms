const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  next();
};

const validateObjectId = (field = 'id') => {
  return param(field).custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid ID format');
    }
    return true;
  });
};

const validateEmail = (field = 'email') => {
  return body(field)
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address');
};

const validatePassword = (field = 'password') => {
  return body(field)
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long');
};

const validatePhone = (field = 'phone') => {
  return body(field)
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number');
};

const validateDateRange = (startField = 'startDate', endField = 'endDate') => {
  return [
    body(startField).isISO8601().withMessage(`${startField} must be a valid date`),
    body(endField).isISO8601().withMessage(`${endField} must be a valid date`),
    body(endField).custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body[startField])) {
        throw new Error(`${endField} must be after ${startField}`);
      }
      return true;
    })
  ];
};

const validatePagination = () => {
  return [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isString()
      .withMessage('SortBy must be a string'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('SortOrder must be either "asc" or "desc"')
  ];
};

// User validation rules
const userValidation = {
  register: [
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name is required and must be less than 50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name is required and must be less than 50 characters'),
    validateEmail('email'),
    validatePassword('password'),
    body('role')
      .optional()
      .isIn(['admin', 'dispatcher', 'driver', 'customer'])
      .withMessage('Invalid role'),
    validatePhone('phone')
  ],
  
  login: [
    validateEmail('email'),
    body('password').notEmpty().withMessage('Password is required')
  ],

  updateProfile: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be less than 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be less than 50 characters'),
    validatePhone('phone')
  ]
};

// Trip validation rules
const tripValidation = {
  create: [
    body('customer').custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid customer ID');
      }
      return true;
    }),
    body('driver').custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid driver ID');
      }
      return true;
    }),
    body('vehicle').custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid vehicle ID');
      }
      return true;
    }),
    body('origin.address').notEmpty().withMessage('Origin address is required'),
    body('destination.address').notEmpty().withMessage('Destination address is required'),
    body('cargo.description').notEmpty().withMessage('Cargo description is required'),
    body('schedule.pickupDate').isISO8601().withMessage('Valid pickup date is required'),
    body('schedule.deliveryDate').isISO8601().withMessage('Valid delivery date is required'),
    body('pricing.baseRate').isFloat({ min: 0 }).withMessage('Base rate must be a positive number'),
    body('pricing.totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number')
  ]
};

// Vehicle validation rules
const vehicleValidation = {
  create: [
    body('vehicleNumber').trim().notEmpty().withMessage('Vehicle number is required'),
    body('make').trim().notEmpty().withMessage('Vehicle make is required'),
    body('model').trim().notEmpty().withMessage('Vehicle model is required'),
    body('year').isInt({ min: 1980, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
    body('type').isIn(['truck', 'van', 'trailer', 'semi', 'pickup']).withMessage('Invalid vehicle type'),
    body('registration.plateNumber').trim().notEmpty().withMessage('Plate number is required')
  ]
};

module.exports = {
  handleValidationErrors,
  validateObjectId,
  validateEmail,
  validatePassword,
  validatePhone,
  validateDateRange,
  validatePagination,
  userValidation,
  tripValidation,
  vehicleValidation
};