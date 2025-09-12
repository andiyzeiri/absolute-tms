# WEX SFTP Integration Setup Guide

## Overview

This TMS application includes comprehensive WEX (Wright Express) SFTP integration for automated fuel data import. The system automatically downloads, parses, and imports fuel transaction data from WEX's SFTP servers on a scheduled basis.

## Features Implemented

✅ **SFTP Client Service** - Secure connection to WEX SFTP servers  
✅ **Automated Data Import** - Scheduled fuel transaction downloads  
✅ **Data Validation** - Comprehensive validation with flagging system  
✅ **MongoDB Integration** - Robust fuel transaction data model  
✅ **REST API Endpoints** - Complete API for fuel data management  
✅ **React Dashboard** - Modern UI for fuel transaction management  
✅ **Duplicate Prevention** - Intelligent duplicate transaction handling  
✅ **Error Handling** - Comprehensive error logging and recovery  

## Environment Configuration

Add these variables to your `.env` file:

```env
# WEX SFTP Configuration
WEX_SFTP_HOST=sftpus1.mft.wextransfer.com
WEX_SFTP_PORT=22
WEX_SFTP_USERNAME=your_wex_username
WEX_SFTP_PASSWORD=your_wex_password
WEX_SFTP_PRIVATE_KEY=          # Optional: Path to private key file
WEX_SFTP_PASSPHRASE=           # Optional: Private key passphrase
WEX_REMOTE_PATH=/outbound      # Path to fuel data files on WEX server
WEX_SFTP_MAX_FILE_AGE_DAYS=7   # Only process files newer than this

# Fuel Sync Scheduler Configuration
FUEL_SYNC_ENABLED=true         # Enable/disable automatic sync
FUEL_SYNC_SCHEDULE=0 */6 * * * # Cron schedule (every 6 hours)
TZ=America/New_York            # Timezone for scheduling
```

## WEX SFTP Credentials Setup

### Option 1: Username/Password Authentication
```env
WEX_SFTP_USERNAME=your_fleet_id
WEX_SFTP_PASSWORD=your_secure_password
```

### Option 2: SSH Key Authentication (Recommended)
```env
WEX_SFTP_USERNAME=your_fleet_id
WEX_SFTP_PRIVATE_KEY=/path/to/your/private_key.pem
WEX_SFTP_PASSPHRASE=your_key_passphrase    # If key is encrypted
```

## File Format Support

The system supports standard WEX CSV export formats with these fields:

- **Transaction ID** - Unique transaction identifier
- **Transaction Date/Time** - When fuel was purchased
- **Card Number** - Fleet card used (automatically masked for security)
- **Driver Name** - Name of driver who made purchase
- **Vehicle ID/Number** - Vehicle identifier
- **Product Code/Description** - Fuel type (Diesel, Unleaded, DEF, etc.)
- **Quantity** - Gallons purchased
- **Unit Price** - Price per gallon
- **Total Amount** - Total transaction amount
- **Merchant Name/Address** - Gas station information
- **Odometer** - Vehicle odometer reading (if available)
- **Authorization Code** - Transaction authorization
- **Tax/Discount Amounts** - Financial breakdown

## API Endpoints

### Get Fuel Transactions
```http
GET /api/fuel/transactions?page=1&limit=50&startDate=2024-01-01&driverName=John&status=APPROVED
```

### Get Fuel Statistics
```http
GET /api/fuel/stats?startDate=2024-01-01&endDate=2024-12-31&groupBy=month
```

### Manual Import Trigger
```http
POST /api/fuel/import
```

### Test SFTP Connection
```http
GET /api/fuel/test-connection
```

### Update Transaction Status
```http
PUT /api/fuel/transactions/:id/status
{
  "status": "APPROVED",
  "notes": "Verified with driver"
}
```

### Get Import Status
```http
GET /api/fuel/import-status
```

### Validation Report
```http
GET /api/fuel/validation-report
```

## Data Validation Features

The system automatically validates imported transactions and flags potential issues:

- **Amount Calculation Mismatch** - When calculated amount doesn't match reported total
- **Invalid Quantity/Price** - Negative or zero values
- **High Quantity Warning** - Transactions over 200 gallons
- **High Price Warning** - Unit prices over $10/gallon
- **Missing Required Fields** - Incomplete transaction data

## Schedule Configuration Options

```javascript
// Predefined schedule options:
FREQUENT: '0 6-22/4 * * *'    // Every 4 hours, 6 AM - 10 PM
REGULAR: '0 */6 * * *'        // Every 6 hours (default)
DAILY: '0 6 * * *'           // Daily at 6 AM
TESTING: '*/30 * * * *'      // Every 30 minutes (for testing)
```

## Frontend Integration

The fuel management interface is available at:
- **URL**: `http://localhost:3000` → Fuel Management
- **Features**:
  - Transaction listing with advanced filtering
  - Real-time statistics dashboard
  - Manual import triggering
  - Connection testing
  - Transaction status management
  - Validation flag monitoring

## Monitoring & Logging

The system provides comprehensive logging for:
- SFTP connection attempts and errors
- File download and processing status
- Import batch tracking with unique IDs
- Validation warnings and errors
- Scheduler status and performance metrics

### Log Examples:
```
🚛 Starting fuel data import - Batch ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
📁 Listing files in: /outbound
📄 Found 3 CSV files
⬇️ Downloading: /outbound/fuel_transactions_20241201.csv
📊 Parsed 1,247 records from CSV
✅ Import completed - Batch ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
📊 Stats: 1,195 imported, 52 duplicates, 0 errors
```

## Security Features

- **Secure SFTP Connection** - SSL/TLS encrypted file transfer
- **Credential Protection** - Environment variable storage
- **Card Number Masking** - Automatic PII protection
- **Access Control** - API authentication required
- **Rate Limiting** - Protection against abuse
- **Input Validation** - SQL injection prevention

## Production Deployment

### 1. Server Setup
```bash
# Ensure MongoDB is running
systemctl start mongod

# Install dependencies
npm install

# Set production environment
export NODE_ENV=production
```

### 2. SSL Certificate (if using SFTP key authentication)
```bash
# Generate SSH key pair for WEX SFTP
ssh-keygen -t rsa -b 4096 -f ~/.ssh/wex_sftp_key
# Provide public key to WEX for account setup
```

### 3. Process Management
```bash
# Using PM2 for production
npm install -g pm2
pm2 start npm --name "tms-app" -- run start
pm2 startup
pm2 save
```

### 4. Monitoring Setup
- Set up log aggregation (ELK Stack, Splunk, etc.)
- Configure alerts for import failures
- Monitor SFTP connection health
- Track import performance metrics

## Troubleshooting

### Common Issues:

**SFTP Connection Failed**
- Verify host, port, and credentials
- Check firewall/VPN requirements
- Test connection using WEX-provided tools

**No Files Found**
- Confirm remote path configuration
- Check file naming patterns
- Verify WEX data export schedule

**Import Errors**
- Review CSV format compatibility
- Check validation flags in database
- Examine server logs for details

**Scheduling Issues**
- Verify cron format syntax
- Check timezone configuration
- Ensure scheduler is enabled

### Debug Commands:
```bash
# Test SFTP connection
curl http://localhost:5000/api/fuel/test-connection

# Check scheduler status
curl http://localhost:5000/api/fuel/import-status

# Manual import trigger
curl -X POST http://localhost:5000/api/fuel/import

# View validation issues
curl http://localhost:5000/api/fuel/validation-report
```

## Support & Maintenance

- **Database Backups**: Implement regular MongoDB backups
- **Log Rotation**: Configure log file rotation
- **Performance Monitoring**: Track import times and database performance
- **WEX Updates**: Monitor for changes in WEX file formats or API
- **Security Updates**: Keep dependencies updated regularly

## Integration Examples

### Custom Import Trigger
```javascript
// Trigger import from external system
const response = await fetch('/api/fuel/import', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token }
});
```

### Real-time Notifications
```javascript
// Listen for import completion via WebSocket
socket.on('fuel_import_complete', (data) => {
  console.log(`Import completed: ${data.importedTransactions} new records`);
});
```

This integration provides enterprise-grade fuel data management capabilities for your TMS system, with automatic synchronization, comprehensive validation, and modern user interfaces.