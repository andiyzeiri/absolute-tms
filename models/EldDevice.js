const mongoose = require('mongoose');

const eldDeviceSchema = new mongoose.Schema({
  // Device identification
  deviceId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Device information
  manufacturer: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  firmwareVersion: String,
  softwareVersion: String,
  
  // ELD Provider details
  provider: {
    type: String,
    required: true,
    trim: true
  },
  providerId: String,
  apiEndpoint: String,
  
  // Installation and certification
  installationDate: {
    type: Date,
    required: true
  },
  certificationDate: Date,
  certificationExpiry: Date,
  certified: {
    type: Boolean,
    default: false
  },
  fmcsaCertified: {
    type: Boolean,
    default: false
  },
  
  // Vehicle assignment
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  vehicleNumber: String,
  
  // Current status
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'MALFUNCTION', 'RETIRED'],
    default: 'ACTIVE'
  },
  connectionStatus: {
    type: String,
    enum: ['CONNECTED', 'DISCONNECTED', 'ERROR'],
    default: 'DISCONNECTED'
  },
  lastCommunication: Date,
  
  // Configuration
  configuration: {
    timeZone: {
      type: String,
      default: 'America/New_York'
    },
    autoSync: {
      type: Boolean,
      default: true
    },
    syncInterval: {
      type: Number,
      default: 300 // seconds
    },
    dataRetentionDays: {
      type: Number,
      default: 184 // 6 months + 4 days
    }
  },
  
  // Malfunction and diagnostics
  malfunctions: [{
    malfunctionCode: String,
    description: String,
    startTime: Date,
    endTime: Date,
    resolved: {
      type: Boolean,
      default: false
    },
    severity: {
      type: String,
      enum: ['WARNING', 'CRITICAL'],
      default: 'WARNING'
    }
  }],
  
  diagnostics: [{
    diagnosticCode: String,
    description: String,
    timestamp: Date,
    cleared: {
      type: Boolean,
      default: false
    }
  }],
  
  // Performance metrics
  metrics: {
    totalRecords: {
      type: Number,
      default: 0
    },
    successfulSyncs: {
      type: Number,
      default: 0
    },
    failedSyncs: {
      type: Number,
      default: 0
    },
    lastSyncAt: Date,
    averageResponseTime: Number, // milliseconds
    dataAccuracy: Number // percentage
  },
  
  // Maintenance
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  maintenanceNotes: String,
  warrantyExpiry: Date,
  
  // Compliance
  complianceStatus: {
    type: String,
    enum: ['COMPLIANT', 'NON_COMPLIANT', 'PENDING_REVIEW'],
    default: 'PENDING_REVIEW'
  },
  lastInspectionDate: Date,
  nextInspectionDate: Date,
  
  // Additional metadata
  notes: String,
  tags: [String],
  
  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  indexes: [
    { deviceId: 1 },
    { serialNumber: 1 },
    { vehicleId: 1 },
    { status: 1 },
    { provider: 1 },
    { certificationExpiry: 1 },
    { nextMaintenanceDate: 1 }
  ]
});

// Virtual for device health score
eldDeviceSchema.virtual('healthScore').get(function() {
  let score = 100;
  
  // Deduct points for malfunctions
  const activeMalfunctions = this.malfunctions.filter(m => !m.resolved);
  score -= activeMalfunctions.length * 20;
  
  // Deduct points for poor sync performance
  if (this.metrics.failedSyncs > 0) {
    const failureRate = this.metrics.failedSyncs / (this.metrics.successfulSyncs + this.metrics.failedSyncs);
    score -= failureRate * 50;
  }
  
  // Deduct points for outdated firmware
  if (this.lastMaintenanceDate && Date.now() - this.lastMaintenanceDate.getTime() > 90 * 24 * 60 * 60 * 1000) {
    score -= 10;
  }
  
  // Deduct points if not connected
  if (this.connectionStatus !== 'CONNECTED') {
    score -= 30;
  }
  
  return Math.max(0, Math.round(score));
});

// Virtual for certification status
eldDeviceSchema.virtual('certificationStatus').get(function() {
  if (!this.certified) return 'NOT_CERTIFIED';
  if (this.certificationExpiry && Date.now() > this.certificationExpiry.getTime()) {
    return 'EXPIRED';
  }
  if (this.certificationExpiry && Date.now() > this.certificationExpiry.getTime() - 30 * 24 * 60 * 60 * 1000) {
    return 'EXPIRING_SOON';
  }
  return 'VALID';
});

// Virtual for maintenance status
eldDeviceSchema.virtual('maintenanceStatus').get(function() {
  if (!this.nextMaintenanceDate) return 'UNKNOWN';
  
  const now = new Date();
  const daysUntilMaintenance = Math.ceil((this.nextMaintenanceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilMaintenance < 0) return 'OVERDUE';
  if (daysUntilMaintenance <= 7) return 'DUE_SOON';
  if (daysUntilMaintenance <= 30) return 'SCHEDULED';
  return 'OK';
});

// Methods
eldDeviceSchema.methods.recordMalfunction = function(code, description, severity = 'WARNING') {
  this.malfunctions.push({
    malfunctionCode: code,
    description,
    startTime: new Date(),
    severity
  });
  
  if (severity === 'CRITICAL') {
    this.status = 'MALFUNCTION';
  }
  
  return this.save();
};

eldDeviceSchema.methods.resolveMalfunction = function(malfunctionId) {
  const malfunction = this.malfunctions.id(malfunctionId);
  if (malfunction) {
    malfunction.resolved = true;
    malfunction.endTime = new Date();
    
    // If this was the last critical malfunction, restore status
    const criticalMalfunctions = this.malfunctions.filter(m => 
      !m.resolved && m.severity === 'CRITICAL'
    );
    
    if (criticalMalfunctions.length === 0 && this.status === 'MALFUNCTION') {
      this.status = 'ACTIVE';
    }
  }
  
  return this.save();
};

eldDeviceSchema.methods.updateConnectionStatus = function(status, responseTime = null) {
  this.connectionStatus = status;
  this.lastCommunication = new Date();
  
  if (responseTime) {
    this.metrics.averageResponseTime = this.metrics.averageResponseTime 
      ? (this.metrics.averageResponseTime + responseTime) / 2 
      : responseTime;
  }
  
  return this.save();
};

eldDeviceSchema.methods.recordSyncAttempt = function(success = true) {
  this.metrics.lastSyncAt = new Date();
  
  if (success) {
    this.metrics.successfulSyncs += 1;
  } else {
    this.metrics.failedSyncs += 1;
  }
  
  return this.save();
};

eldDeviceSchema.methods.scheduleMaintenance = function(days = 90) {
  const maintenanceDate = new Date();
  maintenanceDate.setDate(maintenanceDate.getDate() + days);
  this.nextMaintenanceDate = maintenanceDate;
  
  return this.save();
};

// Static methods
eldDeviceSchema.statics.getActiveDevices = function() {
  return this.find({ status: 'ACTIVE' })
    .populate('vehicleId', 'vehicleNumber make model')
    .sort({ lastCommunication: -1 });
};

eldDeviceSchema.statics.getDevicesRequiringMaintenance = function() {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  return this.find({
    $or: [
      { nextMaintenanceDate: { $lte: thirtyDaysFromNow } },
      { certificationExpiry: { $lte: thirtyDaysFromNow } }
    ]
  }).populate('vehicleId', 'vehicleNumber');
};

eldDeviceSchema.statics.getFleetHealthSummary = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalDevices: { $sum: 1 },
        activeDevices: {
          $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] }
        },
        connectedDevices: {
          $sum: { $cond: [{ $eq: ['$connectionStatus', 'CONNECTED'] }, 1, 0] }
        },
        devicesWithMalfunctions: {
          $sum: { $cond: [{ $gt: [{ $size: '$malfunctions' }, 0] }, 1, 0] }
        },
        avgSuccessfulSyncs: { $avg: '$metrics.successfulSyncs' },
        avgFailedSyncs: { $avg: '$metrics.failedSyncs' }
      }
    },
    {
      $project: {
        _id: 0,
        totalDevices: 1,
        activeDevices: 1,
        connectedDevices: 1,
        devicesWithMalfunctions: 1,
        connectionRate: {
          $multiply: [
            { $divide: ['$connectedDevices', '$totalDevices'] },
            100
          ]
        },
        activeRate: {
          $multiply: [
            { $divide: ['$activeDevices', '$totalDevices'] },
            100
          ]
        },
        avgSuccessfulSyncs: { $round: ['$avgSuccessfulSyncs', 0] },
        avgFailedSyncs: { $round: ['$avgFailedSyncs', 0] }
      }
    }
  ]);
};

// Pre-save middleware
eldDeviceSchema.pre('save', function(next) {
  // Auto-schedule maintenance if not set
  if (!this.nextMaintenanceDate && this.installationDate) {
    const maintenanceDate = new Date(this.installationDate);
    maintenanceDate.setDate(maintenanceDate.getDate() + 90);
    this.nextMaintenanceDate = maintenanceDate;
  }
  
  // Update certification status
  if (this.certificationDate && this.certificationExpiry && 
      Date.now() >= this.certificationDate.getTime() && 
      Date.now() < this.certificationExpiry.getTime()) {
    this.certified = true;
  }
  
  next();
});

// Export model
const EldDevice = mongoose.model('EldDevice', eldDeviceSchema);
module.exports = EldDevice;