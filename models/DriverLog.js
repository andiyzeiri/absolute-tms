const mongoose = require('mongoose');

const dutyStatusChangeSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['OFF_DUTY', 'SLEEPER_BERTH', 'DRIVING', 'ON_DUTY_NOT_DRIVING'],
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  odometer: {
    type: Number,
    min: 0
  },
  engineHours: {
    type: Number,
    min: 0
  },
  notes: String,
  editedBy: String,
  editReason: String,
  originalTimestamp: Date
}, { _id: true });

const violationSchema = new mongoose.Schema({
  violationType: {
    type: String,
    enum: ['DRIVE_TIME', 'DUTY_TIME', 'REST_BREAK', 'CYCLE_TIME', 'FORM_MANNER', 'MALFUNCTION'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startTime: Date,
  endTime: Date,
  severity: {
    type: String,
    enum: ['WARNING', 'VIOLATION', 'CRITICAL'],
    default: 'WARNING'
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: String,
  resolvedAt: Date,
  notes: String
}, { _id: true });

const driverLogSchema = new mongoose.Schema({
  // Driver identification
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverLicenseNumber: String,
  
  // Log date (YYYY-MM-DD format)
  logDate: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  
  // Vehicle information
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  vehicleNumber: String,
  
  // Duty status changes throughout the day
  dutyStatusChanges: [dutyStatusChangeSchema],
  
  // Calculated time totals (in minutes)
  totalDriveTime: {
    type: Number,
    default: 0,
    min: 0,
    max: 840 // 14 hours max
  },
  totalDutyTime: {
    type: Number,
    default: 0,
    min: 0,
    max: 840 // 14 hours max
  },
  totalOnDutyTime: {
    type: Number,
    default: 0,
    min: 0
  },
  totalOffDutyTime: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // HOS compliance status
  violations: [violationSchema],
  hasViolations: {
    type: Boolean,
    default: false
  },
  
  // Log certification
  certified: {
    type: Boolean,
    default: false
  },
  certifiedAt: Date,
  certifiedBy: String,
  
  // Cycle information
  cycleHours: {
    type: Number,
    default: 70 // 70-hour/8-day or 60-hour/7-day
  },
  cycleStartDate: String,
  
  // ELD device information
  eldDeviceId: String,
  eldProvider: String,
  
  // Data source and sync
  dataSource: {
    type: String,
    enum: ['ELD_DEVICE', 'MANUAL_ENTRY', 'API_IMPORT'],
    default: 'API_IMPORT'
  },
  lastSyncAt: Date,
  syncStatus: {
    type: String,
    enum: ['PENDING', 'SYNCED', 'ERROR'],
    default: 'PENDING'
  },
  
  // Approval workflow
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REQUIRES_REVIEW'],
    default: 'DRAFT'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  
  // Additional metadata
  notes: String,
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,
  
  // Odometer and engine hours
  startOdometer: Number,
  endOdometer: Number,
  totalMiles: Number,
  startEngineHours: Number,
  endEngineHours: Number,
  totalEngineHours: Number
}, {
  timestamps: true,
  indexes: [
    { driverId: 1, logDate: 1 }, // Composite unique index
    { logDate: 1 },
    { driverId: 1 },
    { vehicleId: 1 },
    { status: 1 },
    { hasViolations: 1 },
    { syncStatus: 1 }
  ]
});

// Compound unique index to prevent duplicate logs
driverLogSchema.index({ driverId: 1, logDate: 1 }, { unique: true });

// Virtual for formatted log date
driverLogSchema.virtual('formattedLogDate').get(function() {
  return new Date(this.logDate + 'T00:00:00.000Z').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for current duty status
driverLogSchema.virtual('currentStatus').get(function() {
  if (this.dutyStatusChanges && this.dutyStatusChanges.length > 0) {
    return this.dutyStatusChanges[this.dutyStatusChanges.length - 1].status;
  }
  return 'OFF_DUTY';
});

// Virtual for total violations
driverLogSchema.virtual('totalViolations').get(function() {
  return this.violations ? this.violations.length : 0;
});

// Pre-save middleware to calculate totals and check for violations
driverLogSchema.pre('save', function(next) {
  this.calculateTimeTotals();
  this.checkViolations();
  next();
});

// Methods
driverLogSchema.methods.calculateTimeTotals = function() {
  if (!this.dutyStatusChanges || this.dutyStatusChanges.length === 0) return;
  
  let totalDrive = 0;
  let totalDuty = 0;
  let totalOnDuty = 0;
  let totalOffDuty = 0;
  
  const sortedChanges = this.dutyStatusChanges.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  for (let i = 0; i < sortedChanges.length - 1; i++) {
    const current = sortedChanges[i];
    const next = sortedChanges[i + 1];
    const duration = (new Date(next.timestamp) - new Date(current.timestamp)) / (1000 * 60); // minutes
    
    switch (current.status) {
      case 'DRIVING':
        totalDrive += duration;
        totalDuty += duration;
        totalOnDuty += duration;
        break;
      case 'ON_DUTY_NOT_DRIVING':
        totalDuty += duration;
        totalOnDuty += duration;
        break;
      case 'OFF_DUTY':
      case 'SLEEPER_BERTH':
        totalOffDuty += duration;
        break;
    }
  }
  
  this.totalDriveTime = Math.round(totalDrive);
  this.totalDutyTime = Math.round(totalDuty);
  this.totalOnDutyTime = Math.round(totalOnDuty);
  this.totalOffDutyTime = Math.round(totalOffDuty);
  
  // Calculate miles and engine hours
  if (this.startOdometer && this.endOdometer) {
    this.totalMiles = this.endOdometer - this.startOdometer;
  }
  
  if (this.startEngineHours && this.endEngineHours) {
    this.totalEngineHours = this.endEngineHours - this.startEngineHours;
  }
};

driverLogSchema.methods.checkViolations = function() {
  const violations = [];
  
  // 11-hour driving limit
  if (this.totalDriveTime > 660) { // 11 hours = 660 minutes
    violations.push({
      violationType: 'DRIVE_TIME',
      description: `Drive time exceeded 11 hours: ${Math.round(this.totalDriveTime/60 * 10)/10} hours`,
      severity: 'VIOLATION'
    });
  }
  
  // 14-hour duty limit
  if (this.totalDutyTime > 840) { // 14 hours = 840 minutes
    violations.push({
      violationType: 'DUTY_TIME',
      description: `Duty time exceeded 14 hours: ${Math.round(this.totalDutyTime/60 * 10)/10} hours`,
      severity: 'VIOLATION'
    });
  }
  
  // Check for required rest break (8 consecutive hours)
  const hasRequiredRest = this.checkRequiredRestBreak();
  if (!hasRequiredRest) {
    violations.push({
      violationType: 'REST_BREAK',
      description: 'Required 10-hour off-duty period not met',
      severity: 'VIOLATION'
    });
  }
  
  this.violations = violations;
  this.hasViolations = violations.length > 0;
};

driverLogSchema.methods.checkRequiredRestBreak = function() {
  if (!this.dutyStatusChanges || this.dutyStatusChanges.length === 0) return true;
  
  const sortedChanges = this.dutyStatusChanges.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let maxOffDutyPeriod = 0;
  let currentOffDutyStart = null;
  
  sortedChanges.forEach(change => {
    if (change.status === 'OFF_DUTY' || change.status === 'SLEEPER_BERTH') {
      if (!currentOffDutyStart) {
        currentOffDutyStart = new Date(change.timestamp);
      }
    } else {
      if (currentOffDutyStart) {
        const offDutyDuration = (new Date(change.timestamp) - currentOffDutyStart) / (1000 * 60); // minutes
        maxOffDutyPeriod = Math.max(maxOffDutyPeriod, offDutyDuration);
        currentOffDutyStart = null;
      }
    }
  });
  
  return maxOffDutyPeriod >= 600; // 10 hours = 600 minutes
};

// Static methods
driverLogSchema.statics.getDriverLogs = function(driverId, startDate, endDate) {
  const query = { driverId };
  
  if (startDate || endDate) {
    query.logDate = {};
    if (startDate) query.logDate.$gte = startDate;
    if (endDate) query.logDate.$lte = endDate;
  }
  
  return this.find(query)
    .populate('driverId', 'firstName lastName email')
    .populate('vehicleId', 'vehicleNumber make model')
    .sort({ logDate: -1 });
};

driverLogSchema.statics.getComplianceReport = function(startDate, endDate) {
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.logDate = {};
    if (startDate) matchStage.logDate.$gte = startDate;
    if (endDate) matchStage.logDate.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalLogs: { $sum: 1 },
        logsWithViolations: { $sum: { $cond: ['$hasViolations', 1, 0] } },
        totalViolations: { $sum: { $size: '$violations' } },
        avgDriveTime: { $avg: '$totalDriveTime' },
        avgDutyTime: { $avg: '$totalDutyTime' },
        certifiedLogs: { $sum: { $cond: ['$certified', 1, 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        totalLogs: 1,
        logsWithViolations: 1,
        totalViolations: 1,
        complianceRate: {
          $multiply: [
            { $divide: [
              { $subtract: ['$totalLogs', '$logsWithViolations'] },
              '$totalLogs'
            ]},
            100
          ]
        },
        avgDriveTime: { $round: [{ $divide: ['$avgDriveTime', 60] }, 1] },
        avgDutyTime: { $round: [{ $divide: ['$avgDutyTime', 60] }, 1] },
        certificationRate: {
          $multiply: [
            { $divide: ['$certifiedLogs', '$totalLogs'] },
            100
          ]
        }
      }
    }
  ]);
};

// Export model
const DriverLog = mongoose.model('DriverLog', driverLogSchema);
module.exports = DriverLog;