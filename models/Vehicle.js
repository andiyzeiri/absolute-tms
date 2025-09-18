const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true,
    uppercase: true
  },
  make: {
    type: String,
    required: false
  },
  model: {
    type: String,
    required: false
  },
  year: {
    type: Number,
    required: false,
    min: 1980,
    max: new Date().getFullYear() + 1
  },
  type: {
    type: String,
    enum: ['truck', 'van', 'trailer', 'semi', 'pickup'],
    required: false
  },
  specifications: {
    capacity: {
      weight: Number, // in pounds
      volume: Number  // in cubic feet
    },
    dimensions: {
      length: Number, // in feet
      width: Number,  // in feet
      height: Number  // in feet
    },
    fuelType: {
      type: String,
      enum: ['gasoline', 'diesel', 'electric', 'hybrid'],
      default: 'diesel'
    },
    transmission: {
      type: String,
      enum: ['manual', 'automatic'],
      default: 'automatic'
    }
  },
  registration: {
    plateNumber: {
      type: String,
      required: false,
      unique: false,
      sparse: true,
      uppercase: true
    },
    state: String,
    expiryDate: Date,
    vinNumber: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function(v) {
          return !v || /^[A-HJ-NPR-Z0-9]{17}$/.test(v);
        },
        message: 'Invalid VIN number format'
      }
    }
  },
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date,
    coverageAmount: Number
  },
  maintenance: {
    lastServiceDate: Date,
    nextServiceDate: Date,
    odometerReading: {
      type: Number,
      default: 0
    },
    maintenanceRecords: [{
      date: Date,
      type: String, // oil change, inspection, repair, etc.
      description: String,
      cost: Number,
      performedBy: String,
      odometerReading: Number
    }]
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive', 'retired'],
    default: 'active'
  },
  location: {
    currentAddress: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    lastUpdated: Date
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fuelEfficiency: {
    mpg: Number,
    lastCalculated: Date
  },
  documents: [{
    name: String,
    type: String, // registration, insurance, inspection, etc.
    url: String,
    expiryDate: Date,
    uploadedAt: { type: Date, default: Date.now }
  }],
  alerts: [{
    type: {
      type: String,
      enum: ['maintenance_due', 'insurance_expiring', 'registration_expiring', 'inspection_due']
    },
    message: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    createdAt: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for vehicle display name
vehicleSchema.virtual('displayName').get(function() {
  return `${this.year} ${this.make} ${this.model} (${this.vehicleNumber})`;
});

// Virtual for days until next service
vehicleSchema.virtual('daysUntilService').get(function() {
  if (this.maintenance.nextServiceDate) {
    const days = Math.ceil((this.maintenance.nextServiceDate - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  }
  return null;
});

// Pre-save middleware to generate alerts
vehicleSchema.pre('save', function(next) {
  const alerts = [];
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Check maintenance due
  if (this.maintenance.nextServiceDate && this.maintenance.nextServiceDate <= thirtyDaysFromNow) {
    alerts.push({
      type: 'maintenance_due',
      message: `Maintenance due on ${this.maintenance.nextServiceDate.toDateString()}`,
      severity: this.maintenance.nextServiceDate <= now ? 'critical' : 'high'
    });
  }

  // Check insurance expiry
  if (this.insurance.expiryDate && this.insurance.expiryDate <= thirtyDaysFromNow) {
    alerts.push({
      type: 'insurance_expiring',
      message: `Insurance expires on ${this.insurance.expiryDate.toDateString()}`,
      severity: this.insurance.expiryDate <= now ? 'critical' : 'high'
    });
  }

  // Check registration expiry
  if (this.registration.expiryDate && this.registration.expiryDate <= thirtyDaysFromNow) {
    alerts.push({
      type: 'registration_expiring',
      message: `Registration expires on ${this.registration.expiryDate.toDateString()}`,
      severity: this.registration.expiryDate <= now ? 'critical' : 'high'
    });
  }

  // Update alerts (clear old ones and add new ones)
  this.alerts = this.alerts.filter(alert => alert.resolved) || [];
  this.alerts.push(...alerts);

  next();
});

// Indexes
vehicleSchema.index({ company: 1, vehicleNumber: 1 }, { unique: true });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ assignedDriver: 1 });
vehicleSchema.index({ 'registration.plateNumber': 1 }, { sparse: true });
vehicleSchema.index({ company: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);