const mongoose = require('mongoose');

const loadSchema = new mongoose.Schema({
  loadNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customer: {
    type: String,
    required: true,
    trim: true
  },
  origin: {
    city: {
      type: String,
      required: true,
      trim: true
    },
    province: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    }
  },
  destination: {
    city: {
      type: String,
      required: true,
      trim: true
    },
    province: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    }
  },
  driver: {
    type: String,
    required: true,
    trim: true
  },
  vehicle: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'delivered', 'delayed'],
    default: 'pending'
  },
  pickupDate: {
    type: Date,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
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
    required: true,
    min: 0
  },
  weight: {
    type: String,
    required: true,
    trim: true
  },
  commodity: {
    type: String,
    required: true,
    trim: true
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
loadSchema.index({ loadNumber: 1 });
loadSchema.index({ status: 1 });
loadSchema.index({ customer: 1 });
loadSchema.index({ pickupDate: 1 });
loadSchema.index({ deliveryDate: 1 });

module.exports = mongoose.model('Load', loadSchema);