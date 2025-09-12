const WexSftpService = require('./wexSftpService');
const FuelTransaction = require('../models/FuelTransaction');
const { v4: uuidv4 } = require('uuid');

class FuelDataImporter {
  constructor() {
    this.wexSftp = new WexSftpService();
    this.importStats = {
      totalProcessed: 0,
      successfulImports: 0,
      skippedDuplicates: 0,
      errors: 0,
      validationWarnings: 0
    };
  }

  /**
   * Import fuel data from WEX SFTP
   */
  async importFuelData() {
    const importBatchId = uuidv4();
    console.log(`🚛 Starting fuel data import - Batch ID: ${importBatchId}`);
    
    try {
      // Reset import statistics
      this.resetStats();
      
      // Download new files from WEX SFTP
      const downloadedFiles = await this.wexSftp.downloadNewFiles();
      
      if (downloadedFiles.length === 0) {
        console.log('ℹ️ No new files found for import');
        return {
          success: true,
          message: 'No new files to process',
          batchId: importBatchId,
          stats: this.importStats
        };
      }
      
      // Process each downloaded file
      for (const file of downloadedFiles) {
        console.log(`📄 Processing file: ${file.name}`);
        await this.processFile(file.localPath, importBatchId);
        
        // Archive processed file
        await this.wexSftp.archiveFile(file.localPath);
      }
      
      // Disconnect from SFTP
      await this.wexSftp.disconnect();
      
      console.log(`✅ Import completed - Batch ID: ${importBatchId}`);
      console.log(`📊 Stats: ${this.importStats.successfulImports} imported, ${this.importStats.skippedDuplicates} duplicates, ${this.importStats.errors} errors`);
      
      return {
        success: true,
        message: 'Fuel data import completed successfully',
        batchId: importBatchId,
        stats: this.importStats,
        filesProcessed: downloadedFiles.length
      };
      
    } catch (error) {
      console.error('❌ Fuel data import failed:', error.message);
      
      // Ensure SFTP connection is closed
      try {
        await this.wexSftp.disconnect();
      } catch (disconnectError) {
        console.error('❌ Error during cleanup disconnect:', disconnectError.message);
      }
      
      return {
        success: false,
        message: error.message,
        batchId: importBatchId,
        stats: this.importStats
      };
    }
  }

  /**
   * Process a single CSV file
   */
  async processFile(filePath, importBatchId) {
    try {
      console.log(`📊 Parsing file: ${filePath}`);
      
      // Parse CSV file
      const records = await this.wexSftp.parseCSVFile(filePath);
      
      console.log(`📝 Processing ${records.length} records`);
      
      // Process records in batches for better performance
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await this.processBatch(batch, importBatchId);
        
        if (i % 500 === 0 && i > 0) {
          console.log(`📊 Processed ${i}/${records.length} records`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error processing file:', error.message);
      throw error;
    }
  }

  /**
   * Process a batch of records
   */
  async processBatch(records, importBatchId) {
    const operations = [];
    
    for (const record of records) {
      try {
        this.importStats.totalProcessed++;
        
        // Transform and validate record
        const transformedRecord = await this.transformRecord(record, importBatchId);
        
        if (!transformedRecord) {
          this.importStats.errors++;
          continue;
        }
        
        // Prepare upsert operation
        operations.push({
          updateOne: {
            filter: { transactionId: transformedRecord.transactionId },
            update: { $setOnInsert: transformedRecord },
            upsert: true
          }
        });
        
      } catch (error) {
        console.error(`❌ Error processing record:`, error.message);
        this.importStats.errors++;
      }
    }
    
    // Execute batch operations
    if (operations.length > 0) {
      try {
        const result = await FuelTransaction.bulkWrite(operations, { ordered: false });
        
        this.importStats.successfulImports += result.upsertedCount;
        this.importStats.skippedDuplicates += (operations.length - result.upsertedCount);
        
      } catch (error) {
        console.error('❌ Bulk write error:', error.message);
        this.importStats.errors += operations.length;
      }
    }
  }

  /**
   * Transform raw CSV record to FuelTransaction format
   */
  async transformRecord(record, importBatchId) {
    try {
      // Skip empty records
      if (!record.transactionId || !record.transactionDate) {
        console.warn('⚠️ Skipping record with missing required fields');
        return null;
      }
      
      // Parse and validate transaction date
      const transactionDate = this.parseDate(record.transactionDate);
      if (!transactionDate) {
        console.warn(`⚠️ Invalid transaction date: ${record.transactionDate}`);
        this.importStats.validationWarnings++;
        return null;
      }
      
      // Parse merchant address if available
      const merchantAddress = this.parseMerchantAddress(record.merchantAddress);
      
      // Create transformed record
      const transformed = {
        transactionId: record.transactionId.toString().trim(),
        transactionDate: transactionDate,
        transactionTime: record.transactionTime || '00:00:00',
        
        // Card and Driver Information
        cardNumber: this.maskCardNumber(record.cardNumber),
        driverName: this.cleanName(record.driverName),
        vehicleNumber: record.vehicleNumber || '',
        vehicleId: record.vehicleId || record.vehicleNumber,
        
        // Fuel Details
        productCode: record.productCode || 'UNKNOWN',
        productDescription: record.productDescription || 'Unknown Product',
        quantity: this.parseFloat(record.quantity, 0),
        unitOfMeasure: record.unitOfMeasure || 'GAL',
        unitPrice: this.parseFloat(record.unitPrice, 0),
        totalAmount: this.parseFloat(record.totalAmount, 0),
        
        // Location Information
        merchantName: record.merchantName || 'Unknown Merchant',
        merchantAddress: merchantAddress,
        stationId: record.stationId || '',
        
        // Vehicle Information
        odometer: record.odometer ? this.parseInt(record.odometer) : null,
        
        // Authorization Details
        authorizationCode: record.authorizationCode || '',
        referenceNumber: record.referenceNumber || '',
        
        // Financial Details
        discountAmount: this.parseFloat(record.discountAmount, 0),
        taxAmount: this.parseFloat(record.taxAmount, 0),
        netAmount: this.parseFloat(record.netAmount) || this.parseFloat(record.totalAmount, 0),
        
        // WEX Specific Fields
        accountNumber: record.accountNumber || '',
        subAccount: record.subAccount || '',
        fleetId: record.fleetId || '',
        employeeId: record.employeeId || '',
        costCenter: record.costCenter || '',
        departmentCode: record.departmentCode || '',
        
        // Import Tracking
        dataSource: 'WEX',
        importBatch: importBatchId,
        processedDate: new Date(),
        status: 'PENDING',
        
        // Audit Trail
        createdBy: 'WEX_IMPORT',
        validationFlags: []
      };
      
      // Validate transformed record
      this.validateRecord(transformed);
      
      return transformed;
      
    } catch (error) {
      console.error('❌ Error transforming record:', error.message);
      return null;
    }
  }

  /**
   * Validate transformed record
   */
  validateRecord(record) {
    // Check for required fields
    if (!record.quantity || record.quantity <= 0) {
      record.validationFlags.push({
        flag: 'INVALID_QUANTITY',
        description: `Invalid quantity: ${record.quantity}`,
        severity: 'HIGH'
      });
    }
    
    if (!record.unitPrice || record.unitPrice <= 0) {
      record.validationFlags.push({
        flag: 'INVALID_UNIT_PRICE',
        description: `Invalid unit price: ${record.unitPrice}`,
        severity: 'HIGH'
      });
    }
    
    if (!record.totalAmount || record.totalAmount <= 0) {
      record.validationFlags.push({
        flag: 'INVALID_TOTAL_AMOUNT',
        description: `Invalid total amount: ${record.totalAmount}`,
        severity: 'HIGH'
      });
    }
    
    // Validate amount calculation
    if (record.quantity && record.unitPrice) {
      const calculatedAmount = record.quantity * record.unitPrice;
      const difference = Math.abs(calculatedAmount - record.totalAmount);
      
      if (difference > 0.05) { // Allow 5 cent tolerance
        record.validationFlags.push({
          flag: 'AMOUNT_CALCULATION_MISMATCH',
          description: `Calculated amount (${calculatedAmount.toFixed(2)}) doesn't match total (${record.totalAmount.toFixed(2)})`,
          severity: 'MEDIUM'
        });
      }
    }
    
    // Check for unusually high quantities (potential data error)
    if (record.quantity > 200) {
      record.validationFlags.push({
        flag: 'HIGH_QUANTITY',
        description: `Unusually high quantity: ${record.quantity} gallons`,
        severity: 'LOW'
      });
    }
    
    // Check for unusually high prices
    if (record.unitPrice > 10) {
      record.validationFlags.push({
        flag: 'HIGH_UNIT_PRICE',
        description: `Unusually high unit price: $${record.unitPrice}`,
        severity: 'LOW'
      });
    }
    
    if (record.validationFlags.length > 0) {
      this.importStats.validationWarnings++;
    }
  }

  // Utility methods for data transformation

  parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Handle common date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    ];
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date;
    } catch {
      return null;
    }
  }

  parseFloat(value, defaultValue = null) {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    // Remove currency symbols and commas
    const cleanValue = value.toString().replace(/[$,]/g, '');
    const parsed = parseFloat(cleanValue);
    
    return isNaN(parsed) ? defaultValue : parsed;
  }

  parseInt(value, defaultValue = null) {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    const parsed = parseInt(value.toString().replace(/[^\d]/g, ''));
    return isNaN(parsed) ? defaultValue : parsed;
  }

  maskCardNumber(cardNumber) {
    if (!cardNumber) return '';
    
    const cleaned = cardNumber.toString().replace(/\D/g, '');
    if (cleaned.length < 4) return cleaned;
    
    // Show only last 4 digits for security
    return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
  }

  cleanName(name) {
    if (!name) return '';
    
    return name.toString()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.-]/g, '');
  }

  parseMerchantAddress(addressStr) {
    if (!addressStr) return {};
    
    // Basic address parsing - could be enhanced based on actual WEX format
    const parts = addressStr.split(',').map(p => p.trim());
    
    return {
      street: parts[0] || '',
      city: parts[1] || '',
      state: parts[2] || '',
      zipCode: parts[3] || '',
      country: 'USA'
    };
  }

  resetStats() {
    this.importStats = {
      totalProcessed: 0,
      successfulImports: 0,
      skippedDuplicates: 0,
      errors: 0,
      validationWarnings: 0
    };
  }

  /**
   * Get import statistics
   */
  getStats() {
    return { ...this.importStats };
  }

  /**
   * Test connection to WEX SFTP
   */
  async testConnection() {
    return await this.wexSftp.testConnection();
  }
}

module.exports = FuelDataImporter;