# ELD Web Token Integration Setup Guide

## Overview

This TMS application includes comprehensive ELD (Electronic Logging Device) web token integration for automated driver Hours of Service (HOS) compliance, real-time vehicle tracking, and regulatory reporting. The system supports web token authentication with most major ELD providers.

## Features Implemented

✅ **Web Token Authentication** - Secure OAuth2 integration with ELD providers  
✅ **Driver HOS Management** - Complete Hours of Service tracking and compliance  
✅ **Real-time Vehicle Tracking** - Live location and status monitoring  
✅ **Compliance Monitoring** - Automated violation detection and alerts  
✅ **Driver Log Management** - Digital logbook with approval workflows  
✅ **ELD Device Management** - Device health monitoring and diagnostics  
✅ **Comprehensive Reporting** - Fleet-wide compliance and performance reports  
✅ **Modern Dashboard** - React-based interface with real-time updates  

## Environment Configuration

Add these variables to your `.env` file:

```env
# ELD Provider Configuration
ELD_API_BASE_URL=https://api.your-eld-provider.com/v1
ELD_WEB_TOKEN=your_web_token_from_eld_provider
ELD_CLIENT_ID=your_client_id
ELD_CLIENT_SECRET=your_client_secret
ELD_REFRESH_TOKEN=your_refresh_token
ELD_TOKEN_EXPIRY=3600
```

## Supported ELD Providers

The system is designed to work with any ELD provider that supports OAuth2 web token authentication:

### Popular ELD Providers:
- **KeepTruckin (Motive)** - Fleet management and ELD solutions
- **Samsara** - IoT fleet management platform
- **Verizon Connect** - Fleet tracking and ELD services
- **Fleet Complete** - Comprehensive fleet management
- **Geotab** - Telematics and fleet management
- **EROAD** - Electronic road user charging and fleet management
- **Omnitracs** - Transportation technology solutions
- **TruckSpy** - Fleet management and ELD compliance
- **Azuga Fleet** - GPS fleet tracking with ELD
- **RAM Tracking** - Fleet management solutions

## Web Token Authentication Setup

### Step 1: ELD Provider Account Setup

1. **Create Developer Account** with your ELD provider
2. **Register Your Application** in their developer portal
3. **Obtain API Credentials**:
   - Client ID
   - Client Secret
   - API Base URL
4. **Request Web Token** from provider support

### Step 2: Token Configuration

```env
# Example configuration for different providers:

# Motive (KeepTruckin)
ELD_API_BASE_URL=https://api.gomotive.com/v1
ELD_WEB_TOKEN=your_motive_web_token
ELD_CLIENT_ID=your_motive_client_id
ELD_CLIENT_SECRET=your_motive_client_secret

# Samsara
ELD_API_BASE_URL=https://api.samsara.com/v1
ELD_WEB_TOKEN=your_samsara_access_token
ELD_CLIENT_ID=your_samsara_client_id
ELD_CLIENT_SECRET=your_samsara_client_secret

# Geotab
ELD_API_BASE_URL=https://api.geotab.com/v1
ELD_WEB_TOKEN=your_geotab_session_id
ELD_CLIENT_ID=your_geotab_username
ELD_CLIENT_SECRET=your_geotab_password
```

## API Integration Features

### Driver HOS Management
- **Real-time Status Tracking** - Current duty status for all drivers
- **Time Remaining Calculations** - Drive, duty, and cycle time remaining
- **Violation Detection** - Automatic flagging of HOS violations
- **Break Requirements** - Required rest period monitoring

### Vehicle Tracking
- **Live Location Data** - GPS coordinates and addresses
- **Engine Status** - On/off status and engine hours
- **Odometer Readings** - Mileage tracking and reporting
- **Speed Monitoring** - Current and historical speed data

### Compliance Reporting
- **Driver Logs** - Electronic duty status records
- **Violation Reports** - Detailed compliance analysis
- **Inspection Reports** - DOT inspection readiness
- **IFTA Reporting** - Fuel tax reporting support

## API Endpoints

### Authentication
```http
GET /api/eld/test-connection
POST /api/eld/status
```

### Driver Management
```http
GET /api/eld/logs/:driverId?startDate=2024-01-01&endDate=2024-12-31
GET /api/eld/logs/:driverId/current
POST /api/eld/sync-driver/:driverId
POST /api/eld/sync-all
```

### Compliance Monitoring
```http
GET /api/eld/compliance/report?startDate=2024-01-01&endDate=2024-12-31
PUT /api/eld/logs/:logId/approve
```

### Device Management
```http
GET /api/eld/devices?status=ACTIVE&page=1&limit=20
GET /api/eld/devices/health
```

## Data Models

### Driver Log Schema
```javascript
{
  driverId: ObjectId,
  logDate: "YYYY-MM-DD",
  dutyStatusChanges: [{
    status: "DRIVING|ON_DUTY_NOT_DRIVING|OFF_DUTY|SLEEPER_BERTH",
    timestamp: Date,
    location: { latitude, longitude, address },
    odometer: Number,
    engineHours: Number
  }],
  totalDriveTime: Number, // minutes
  totalDutyTime: Number,  // minutes
  violations: [{
    violationType: "DRIVE_TIME|DUTY_TIME|REST_BREAK|CYCLE_TIME",
    description: String,
    severity: "WARNING|VIOLATION|CRITICAL"
  }],
  status: "DRAFT|SUBMITTED|APPROVED|REJECTED",
  certified: Boolean
}
```

### ELD Device Schema
```javascript
{
  deviceId: String,
  serialNumber: String,
  manufacturer: String,
  model: String,
  vehicleId: ObjectId,
  status: "ACTIVE|INACTIVE|MAINTENANCE|MALFUNCTION",
  connectionStatus: "CONNECTED|DISCONNECTED|ERROR",
  lastCommunication: Date,
  healthScore: Number, // 0-100
  malfunctions: Array,
  diagnostics: Array
}
```

## HOS Compliance Rules

The system automatically validates against Federal Motor Carrier Safety Administration (FMCSA) Hours of Service regulations:

### Property-Carrying Drivers
- **11-Hour Driving Limit** - Maximum 11 hours driving after 10+ hours off duty
- **14-Hour Duty Limit** - Maximum 14-hour duty period
- **10-Hour Rest Break** - Minimum 10 consecutive hours off duty
- **60/70-Hour Limit** - 60 hours in 7 days or 70 hours in 8 days
- **30-Minute Rest Break** - Required after 8 hours of driving

### Passenger-Carrying Drivers
- **10-Hour Driving Limit** - Maximum 10 hours driving after 8+ hours off duty
- **15-Hour Duty Limit** - Maximum 15-hour duty period
- **8-Hour Rest Break** - Minimum 8 consecutive hours off duty
- **60/70-Hour Limit** - Same as property-carrying

## Frontend Integration

The ELD management interface is available at:
- **URL**: `http://localhost:3000` → ELD Management
- **Features**:
  - Real-time driver status dashboard
  - HOS compliance monitoring
  - Driver log approval workflows
  - ELD device health monitoring
  - Compliance reporting and analytics
  - Violation management and resolution

### Dashboard Components
1. **Driver Logs Tab**
   - Current duty status for all drivers
   - Time remaining calculations
   - Violation flagging and management
   - Log approval workflows

2. **ELD Devices Tab**
   - Device status and health monitoring
   - Connection status tracking
   - Malfunction detection and reporting
   - Maintenance scheduling

3. **Compliance Report Tab**
   - Fleet-wide compliance metrics
   - Violation trends and analysis
   - Regulatory reporting tools
   - Performance benchmarking

## Real-time Updates

The system provides real-time updates through WebSocket connections:

```javascript
// Listen for driver status changes
socket.on('driver_status_update', (data) => {
  console.log(`Driver ${data.driverId} changed to ${data.status}`);
});

// Listen for violation alerts
socket.on('hos_violation', (data) => {
  console.log(`HOS violation: ${data.violationType} for driver ${data.driverId}`);
});

// Listen for device malfunctions
socket.on('device_malfunction', (data) => {
  console.log(`ELD device ${data.deviceId} malfunction: ${data.description}`);
});
```

## Security Features

- **OAuth2 Authentication** - Industry-standard security protocols
- **Token Refresh** - Automatic token renewal for uninterrupted service
- **Rate Limiting** - API request throttling for stability
- **Data Encryption** - Secure transmission of sensitive data
- **Access Control** - Role-based permissions for data access
- **Audit Trails** - Complete logging of all system activities

## Deployment Configuration

### Production Setup

1. **Server Requirements**
   ```bash
   # Minimum system requirements
   CPU: 2 cores
   RAM: 4GB
   Storage: 50GB SSD
   Network: Stable internet connection
   ```

2. **Environment Variables**
   ```bash
   NODE_ENV=production
   ELD_API_BASE_URL=https://api.your-eld-provider.com/v1
   ELD_WEB_TOKEN=your_production_web_token
   ELD_CLIENT_ID=your_production_client_id
   ELD_CLIENT_SECRET=your_production_client_secret
   ```

3. **Database Optimization**
   ```bash
   # MongoDB indexes for performance
   db.driverlogs.createIndex({"driverId": 1, "logDate": 1})
   db.driverlogs.createIndex({"hasViolations": 1})
   db.elddevices.createIndex({"status": 1, "connectionStatus": 1})
   ```

## Monitoring & Alerts

### System Health Monitoring
- **API Response Times** - Track ELD provider API performance
- **Token Validity** - Monitor authentication status
- **Data Sync Status** - Ensure continuous data flow
- **Device Connectivity** - Alert on device disconnections

### Compliance Alerts
- **HOS Violations** - Immediate notification of violations
- **Approaching Limits** - Proactive warnings before violations
- **Missing Logs** - Alert for incomplete or missing logs
- **Device Malfunctions** - Critical device issue notifications

## Troubleshooting

### Common Issues

**Authentication Errors**
```bash
Error: "ELD Authentication Failed: Invalid web token"
```
- Verify web token is valid and not expired
- Check client ID and secret are correct
- Ensure API base URL is accurate

**Connection Timeouts**
```bash
Error: "ELD API request timeout"
```
- Check network connectivity
- Verify ELD provider API status
- Review rate limiting settings

**Data Sync Issues**
```bash
Error: "Failed to sync driver data"
```
- Check driver ID exists in ELD system
- Verify date range is valid
- Review ELD provider data format

### Debug Commands

```bash
# Test ELD connection
curl http://localhost:5000/api/eld/test-connection

# Check service status
curl http://localhost:5000/api/eld/status

# Manual driver sync
curl -X POST http://localhost:5000/api/eld/sync-driver/DRIVER_ID

# Get compliance report
curl http://localhost:5000/api/eld/compliance/report
```

## API Rate Limits

Different ELD providers have varying rate limits:

- **Motive**: 1000 requests/hour
- **Samsara**: 2000 requests/hour
- **Geotab**: 500 requests/hour
- **Verizon Connect**: 1500 requests/hour

The system automatically manages rate limiting to prevent API quota exhaustion.

## Data Retention

- **Driver Logs**: 6 months + 4 days (FMCSA requirement)
- **Vehicle Data**: 30 days (configurable)
- **Device Health**: 90 days
- **Compliance Reports**: 3 years (regulatory requirement)

## Support & Maintenance

### Regular Tasks
- **Token Renewal** - Monitor and renew authentication tokens
- **Database Maintenance** - Regular backups and optimization
- **Device Health Checks** - Weekly ELD device status reviews
- **Compliance Audits** - Monthly compliance report reviews
- **API Updates** - Stay current with ELD provider API changes

### Integration Support
- **ELD Provider Setup** - Assistance with provider onboarding
- **Custom Integrations** - Support for specialized ELD systems
- **Regulatory Compliance** - Updates for changing regulations
- **Performance Optimization** - System tuning and optimization

This comprehensive ELD integration provides enterprise-grade Hours of Service compliance, real-time fleet monitoring, and regulatory reporting capabilities for your TMS system.

## Quick Start Guide

1. **Setup ELD Provider Account** - Contact your ELD provider for API access
2. **Configure Environment** - Add ELD credentials to `.env` file
3. **Test Connection** - Use "Test Connection" button in ELD Management dashboard
4. **Sync Driver Data** - Click "Sync All" to import existing data
5. **Monitor Compliance** - Review compliance reports and manage violations

Your TMS system is now equipped with professional-grade ELD integration!