const mongoose = require('mongoose');

const loadSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  loadNumber: {
    type: String,
    trim: true,
    default: ''
  },
  customer: {
    type: String,
    trim: true,
    default: ''
  },
  origin: {
    city: {
      type: String,
      trim: true,
      default: ''
    },
    province: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    }
  },
  destination: {
    city: {
      type: String,
      trim: true,
      default: ''
    },
    province: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    }
  },
  driver: {
    type: String,
    trim: true,
    default: ''
  },
  vehicle: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'delivered', 'delayed'],
    default: 'pending'
  },
  pickupDate: {
    type: Date,
    default: Date.now
  },
  deliveryDate: {
    type: Date,
    default: Date.now
  },
  deliveryTime: {
    type: String,
    trim: true,
    default: ''
  },
  pickupTime: {
    type: String,
    trim: true,
    default: ''
  },
  rate: {
    type: Number,
    min: 0,
    default: 0
  },
  weight: {
    type: String,
    trim: true,
    default: ''
  },
  commodity: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  proofOfDelivery: [{
    filename: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    size: {
      type: Number,
      required: true
    },
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    }
  }],
  rateConfirmation: [{
    filename: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    size: {
      type: Number,
      required: true
    },
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    }
  }]
}, {
  timestamps: true
});

// Create indexes for better query performance
loadSchema.index({ company: 1 });
loadSchema.index({ company: 1, loadNumber: 1 }, { unique: true }); // Unique loadNumber per company
loadSchema.index({ company: 1, status: 1 });
loadSchema.index({ company: 1, customer: 1 });
loadSchema.index({ company: 1, pickupDate: 1 });
loadSchema.index({ company: 1, deliveryDate: 1 });

module.exports = mongoose.model('Load', loadSchema);