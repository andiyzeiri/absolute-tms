const mongoose = require('mongoose');

const brokerSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  brokerId: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  totalShipments: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  lastShipment: {
    type: Date,
    default: null
  },
  paymentTerms: {
    type: String,
    trim: true,
    default: 'Net 30'
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  industry: {
    type: String,
    trim: true,
    default: 'Freight Brokerage'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
brokerSchema.index({ company: 1 });
brokerSchema.index({ company: 1, brokerId: 1 }, { unique: true });
brokerSchema.index({ company: 1, status: 1 });
brokerSchema.index({ company: 1, companyName: 1 });
brokerSchema.index({ company: 1, email: 1 });

module.exports = mongoose.model('Broker', brokerSchema);