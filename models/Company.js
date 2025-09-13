const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number']
  },
  email: {
    type: String,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  website: String,
  dotNumber: String, // DOT number for trucking companies
  mcNumber: String,  // MC number for motor carriers
  taxId: String,
  isActive: {
    type: Boolean,
    default: true
  },
  subscriptionStatus: {
    type: String,
    enum: ['trial', 'active', 'suspended', 'cancelled'],
    default: 'trial'
  },
  subscriptionExpiry: Date,
  maxUsers: {
    type: Number,
    default: 10
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  settings: {
    timezone: { type: String, default: 'America/New_York' },
    currency: { type: String, default: 'USD' },
    measurementUnit: { type: String, enum: ['metric', 'imperial'], default: 'imperial' }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
companySchema.index({ name: 1 });
companySchema.index({ createdBy: 1 });
companySchema.index({ isActive: 1 });

// Virtual for user count
companySchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'company',
  count: true
});

module.exports = mongoose.model('Company', companySchema);