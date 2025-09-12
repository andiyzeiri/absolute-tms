const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  origin: {
    address: { type: String, required: true },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    contactPerson: String,
    contactPhone: String
  },
  destination: {
    address: { type: String, required: true },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    contactPerson: String,
    contactPhone: String
  },
  cargo: {
    description: { type: String, required: true },
    weight: Number, // in pounds
    volume: Number, // in cubic feet
    type: {
      type: String,
      enum: ['general', 'fragile', 'hazardous', 'perishable', 'oversized'],
      default: 'general'
    },
    specialInstructions: String
  },
  schedule: {
    pickupDate: { type: Date, required: true },
    deliveryDate: { type: Date, required: true },
    estimatedDuration: Number // in hours
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  pricing: {
    baseRate: { type: Number, required: true },
    fuelSurcharge: Number,
    additionalCharges: [{
      description: String,
      amount: Number
    }],
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'USD' }
  },
  tracking: {
    currentLocation: {
      latitude: Number,
      longitude: Number,
      timestamp: Date,
      address: String
    },
    milestones: [{
      event: String,
      timestamp: Date,
      location: String,
      notes: String
    }],
    estimatedArrival: Date
  },
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  notes: [{
    message: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    isInternal: { type: Boolean, default: false }
  }],
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  rating: {
    score: { type: Number, min: 1, max: 5 },
    feedback: String,
    ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ratedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate trip number
tripSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments({
    createdAt: { $gte: new Date(year, 0, 1) }
  });
  
  this.tripNumber = `TMS-${year}-${String(count + 1).padStart(6, '0')}`;
  next();
});

// Virtual for trip duration
tripSchema.virtual('actualDuration').get(function() {
  if (this.status === 'delivered' && this.tracking.milestones.length > 0) {
    const start = this.tracking.milestones.find(m => m.event === 'pickup_started');
    const end = this.tracking.milestones.find(m => m.event === 'delivered');
    
    if (start && end) {
      return Math.round((end.timestamp - start.timestamp) / (1000 * 60 * 60)); // hours
    }
  }
  return null;
});

// Indexes
tripSchema.index({ tripNumber: 1 });
tripSchema.index({ driver: 1, status: 1 });
tripSchema.index({ customer: 1, createdAt: -1 });
tripSchema.index({ 'schedule.pickupDate': 1 });

module.exports = mongoose.model('Trip', tripSchema);