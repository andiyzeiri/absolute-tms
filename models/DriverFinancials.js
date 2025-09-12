const mongoose = require('mongoose');

const driverFinancialSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverType: {
    type: String,
    enum: ['owner_operator', 'company_driver'],
    required: true
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  // Current year totals
  yearlyGross: {
    type: Number,
    default: 0,
    min: 0
  },
  yearlyProfit: {
    type: Number,
    default: 0
  },
  // Weekly data for trends
  weeklyData: [{
    weekStart: {
      type: Date,
      required: true
    },
    gross: {
      type: Number,
      default: 0,
      min: 0
    },
    profit: {
      type: Number,
      default: 0
    }
  }],
  // Monthly data for trends
  monthlyData: [{
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    gross: {
      type: Number,
      default: 0,
      min: 0
    },
    profit: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
driverFinancialSchema.index({ driver: 1, year: 1 }, { unique: true });
driverFinancialSchema.index({ driverType: 1 });

// Virtual for profit margin
driverFinancialSchema.virtual('profitMargin').get(function() {
  if (this.yearlyGross === 0) return 0;
  return (this.yearlyProfit / this.yearlyGross) * 100;
});

module.exports = mongoose.model('DriverFinancials', driverFinancialSchema);