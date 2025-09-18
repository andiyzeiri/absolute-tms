const mongoose = require('mongoose');

const fuelTransactionSchema = new mongoose.Schema({
  // Company association for multi-tenancy
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // WEX Transaction Identifier
  transactionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Transaction Details
  transactionDate: {
    type: Date,
    required: true,
    index: true
  },
  transactionTime: {
    type: String,
    required: true
  },
  
  // Card Information
  cardNumber: {
    type: String,
    required: true,
    index: true
  },
  driverName: {
    type: String,
    required: true
  },
  vehicleNumber: {
    type: String,
    index: true
  },
  
  // Fuel Details
  productCode: {
    type: String,
    required: true // e.g., 'DIESEL', 'UNLEADED', 'DEF'
  },
  productDescription: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unitOfMeasure: {
    type: String,
    required: true,
    default: 'GAL' // Gallons
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Location Information
  merchantName: {
    type: String,
    required: true
  },
  merchantAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  stationId: String,
  
  // Vehicle Information
  odometer: {
    type: Number,
    min: 0
  },
  vehicleId: {
    type: String,
    index: true
  },
  
  // Trip Association
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    index: true
  },
  
  // Authorization Details
  authorizationCode: String,
  referenceNumber: String,
  
  // Discount and Tax Information
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  
  // Data Source and Processing
  dataSource: {
    type: String,
    default: 'WEX',
    enum: ['WEX', 'MANUAL', 'OTHER']
  },
  importBatch: {
    type: String,
    index: true // Track which batch this transaction was imported in
  },
  processedDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Status and Validation
  status: {
    type: String,
    enum: ['PENDING', 'VALIDATED', 'DISPUTED', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    index: true
  },
  validationFlags: [{
    flag: String,
    description: String,
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH']
    }
  }],
  
  // Additional WEX Fields
  accountNumber: String,
  subAccount: String,
  fleetId: String,
  employeeId: String,
  costCenter: String,
  departmentCode: String,
  
  // Fuel Economy Tracking
  mpg: Number,
  fuelEfficiency: Number,
  
  // Geolocation (if available)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  
  // Exception Handling
  exceptions: [{
    type: String,
    description: String,
    resolvedDate: Date,
    resolvedBy: String
  }],
  
  // Audit Trail
  createdBy: {
    type: String,
    default: 'SYSTEM'
  },
  updatedBy: String,
  notes: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance with company isolation
fuelTransactionSchema.index({ company: 1, transactionId: 1 }, { unique: true }); // Unique transactionId per company
fuelTransactionSchema.index({ company: 1, transactionDate: -1 });
fuelTransactionSchema.index({ company: 1, cardNumber: 1, transactionDate: -1 });
fuelTransactionSchema.index({ company: 1, vehicleId: 1, transactionDate: -1 });
fuelTransactionSchema.index({ company: 1, driverName: 1, transactionDate: -1 });
fuelTransactionSchema.index({ company: 1, merchantName: 1 });
fuelTransactionSchema.index({ company: 1, status: 1, processedDate: -1 });
fuelTransactionSchema.index({ company: 1, importBatch: 1 });
fuelTransactionSchema.index({ company: 1 });

// Virtual for fuel cost per mile (if odometer data available)
fuelTransactionSchema.virtual('costPerMile').get(function() {
  if (this.mpg && this.unitPrice) {
    return this.unitPrice / this.mpg;
  }
  return null;
});

// Virtual for transaction description
fuelTransactionSchema.virtual('transactionDescription').get(function() {
  return `${this.quantity} ${this.unitOfMeasure} ${this.productDescription} at ${this.merchantName}`;
});

// Static method to find transactions by date range
fuelTransactionSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    transactionDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ transactionDate: -1 });
};

// Static method to find transactions by vehicle
fuelTransactionSchema.statics.findByVehicle = function(vehicleId) {
  return this.find({ vehicleId })
    .sort({ transactionDate: -1 });
};

// Static method to find transactions by driver
fuelTransactionSchema.statics.findByDriver = function(driverName) {
  return this.find({ driverName })
    .sort({ transactionDate: -1 });
};

// Static method to get fuel statistics
fuelTransactionSchema.statics.getFuelStats = function(filter = {}) {
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalGallons: { $sum: '$quantity' },
        totalAmount: { $sum: '$totalAmount' },
        averagePrice: { $avg: '$unitPrice' },
        averageGallons: { $avg: '$quantity' }
      }
    }
  ]);
};

// Pre-save middleware for validation
fuelTransactionSchema.pre('save', function(next) {
  // Calculate net amount if not provided
  if (!this.netAmount) {
    this.netAmount = this.totalAmount - this.discountAmount + this.taxAmount;
  }
  
  // Validate transaction amount
  if (this.quantity && this.unitPrice) {
    const calculatedAmount = this.quantity * this.unitPrice;
    if (Math.abs(calculatedAmount - this.totalAmount) > 0.01) {
      this.validationFlags.push({
        flag: 'AMOUNT_MISMATCH',
        description: `Calculated amount (${calculatedAmount}) doesn't match total amount (${this.totalAmount})`,
        severity: 'MEDIUM'
      });
    }
  }
  
  next();
});

// Post-save middleware for notifications
fuelTransactionSchema.post('save', function(doc) {
  // Here you could trigger notifications for high-value transactions,
  // exceptions, or other business rules
  if (doc.totalAmount > 500) {
    console.log(`High value fuel transaction: ${doc.transactionId} - $${doc.totalAmount}`);
  }
});

module.exports = mongoose.model('FuelTransaction', fuelTransactionSchema);