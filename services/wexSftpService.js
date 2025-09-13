const SftpClient = require('ssh2-sftp-client');
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { Readable } = require('stream');

class WexSftpService {
  constructor() {
    this.sftp = new SftpClient();
    this.connected = false;
    
    // WEX SFTP Configuration from environment
    this.config = {
      host: process.env.WEX_SFTP_HOST,
      port: process.env.WEX_SFTP_PORT || 22,
      username: process.env.WEX_SFTP_USERNAME,
      password: process.env.WEX_SFTP_PASSWORD,
      privateKey: process.env.WEX_SFTP_PRIVATE_KEY,
      passphrase: process.env.WEX_SFTP_PASSPHRASE,
      readyTimeout: 30000, // 30 seconds
      strictVendor: false
    };
    
    // File processing settings
    this.settings = {
      remotePath: process.env.WEX_REMOTE_PATH || '/outbound',
      localPath: path.join('/tmp', 'wex'),
      archivePath: path.join('/tmp', 'wex', 'processed'),
      filePattern: /^.*\.(csv|CSV)$/,
      maxFileAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    };
  }

  /**
   * Connect to WEX SFTP server
   */
  async connect() {
    try {
      if (this.connected) {
        console.log('Already connected to WEX SFTP');
        return true;
      }

      console.log('Connecting to WEX SFTP server...');
      
      // Validate configuration
      if (!this.config.host || !this.config.username) {
        throw new Error('WEX SFTP configuration incomplete. Please check environment variables.');
      }

      // Create connection config
      const connectionConfig = {
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        readyTimeout: this.config.readyTimeout,
        strictVendor: this.config.strictVendor,
        debug: console.log, // Enable debug logging
        algorithms: {
          kex: [
            'diffie-hellman-group14-sha256',
            'diffie-hellman-group16-sha512',
            'diffie-hellman-group18-sha512',
            'diffie-hellman-group14-sha1'
          ],
          serverHostKey: ['ssh-rsa', 'ssh-dss'],
          cipher: ['aes128-ctr', 'aes192-ctr', 'aes256-ctr', 'aes128-gcm', 'aes256-gcm'],
          hmac: ['hmac-sha2-256', 'hmac-sha2-512', 'hmac-sha1']
        }
      };

      // Add authentication method
      if (this.config.privateKey) {
        connectionConfig.privateKey = this.config.privateKey;
        if (this.config.passphrase) {
          connectionConfig.passphrase = this.config.passphrase;
        }
      } else if (this.config.password) {
        connectionConfig.password = this.config.password;
      } else {
        throw new Error('No authentication method provided (password or private key)');
      }

      await this.sftp.connect(connectionConfig);
      this.connected = true;
      
      console.log('✅ Connected to WEX SFTP server successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to connect to WEX SFTP:', error.message);
      this.connected = false;
      throw new Error(`WEX SFTP Connection Failed: ${error.message}`);
    }
  }

  /**
   * Disconnect from SFTP server
   */
  async disconnect() {
    try {
      if (this.connected) {
        await this.sftp.end();
        this.connected = false;
        console.log('✅ Disconnected from WEX SFTP server');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from WEX SFTP:', error.message);
      this.connected = false;
    }
  }

  /**
   * List files in the remote directory
   */
  async listRemoteFiles(remotePath = null) {
    try {
      await this.ensureConnected();
      
      const targetPath = remotePath || this.settings.remotePath;
      console.log(`📁 Listing files in: ${targetPath}`);
      
      const fileList = await this.sftp.list(targetPath);
      
      // Filter for CSV files and exclude directories
      const csvFiles = fileList.filter(file => 
        file.type === '-' && // Regular file
        this.settings.filePattern.test(file.name)
      );
      
      console.log(`📄 Found ${csvFiles.length} CSV files`);
      
      // Sort by modification time (newest first)
      csvFiles.sort((a, b) => new Date(b.modifyTime) - new Date(a.modifyTime));
      
      return csvFiles.map(file => ({
        name: file.name,
        size: file.size,
        modifyTime: new Date(file.modifyTime),
        remotePath: path.posix.join(targetPath, file.name)
      }));
      
    } catch (error) {
      console.error('❌ Error listing remote files:', error.message);
      throw new Error(`Failed to list remote files: ${error.message}`);
    }
  }

  /**
   * Download a specific file from WEX SFTP
   */
  async downloadFile(remoteFilePath, localFilePath = null) {
    try {
      await this.ensureConnected();
      
      // Generate local file path if not provided
      if (!localFilePath) {
        const fileName = path.basename(remoteFilePath);
        localFilePath = path.join(this.settings.localPath, fileName);
      }
      
      // Ensure local directory exists
      await this.ensureLocalDirectory(path.dirname(localFilePath));
      
      console.log(`⬇️ Downloading: ${remoteFilePath} -> ${localFilePath}`);
      
      await this.sftp.fastGet(remoteFilePath, localFilePath);
      
      // Verify file was downloaded
      const stats = await fs.stat(localFilePath);
      console.log(`✅ Downloaded ${stats.size} bytes`);
      
      return {
        localPath: localFilePath,
        size: stats.size,
        downloadTime: new Date()
      };
      
    } catch (error) {
      console.error('❌ Error downloading file:', error.message);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Download all new files from WEX SFTP
   */
  async downloadNewFiles() {
    try {
      const remoteFiles = await this.listRemoteFiles();
      const downloadedFiles = [];
      
      for (const file of remoteFiles) {
        const localFilePath = path.join(this.settings.localPath, file.name);
        
        // Check if file already exists locally
        try {
          const localStats = await fs.stat(localFilePath);
          if (localStats.size === file.size) {
            console.log(`⏭️ Skipping existing file: ${file.name}`);
            continue;
          }
        } catch (error) {
          // File doesn't exist locally, proceed with download
        }
        
        // Check file age
        const fileAge = Date.now() - file.modifyTime.getTime();
        if (fileAge > this.settings.maxFileAge) {
          console.log(`⏭️ Skipping old file: ${file.name} (${Math.round(fileAge / (24 * 60 * 60 * 1000))} days old)`);
          continue;
        }
        
        try {
          const result = await this.downloadFile(file.remotePath, localFilePath);
          downloadedFiles.push({
            ...file,
            ...result
          });
        } catch (error) {
          console.error(`❌ Failed to download ${file.name}:`, error.message);
        }
      }
      
      console.log(`✅ Downloaded ${downloadedFiles.length} new files`);
      return downloadedFiles;
      
    } catch (error) {
      console.error('❌ Error downloading new files:', error.message);
      throw error;
    }
  }

  /**
   * Parse CSV file content
   */
  async parseCSVFile(filePath) {
    try {
      console.log(`📊 Parsing CSV file: ${filePath}`);
      
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const results = [];
      
      return new Promise((resolve, reject) => {
        const stream = Readable.from([fileContent]);
        
        stream
          .pipe(csv({
            // WEX CSV headers mapping
            mapHeaders: ({ header, index }) => {
              const headerMap = {
                'Transaction ID': 'transactionId',
                'Transaction Date': 'transactionDate',
                'Transaction Time': 'transactionTime',
                'Card Number': 'cardNumber',
                'Driver Name': 'driverName',
                'Vehicle Number': 'vehicleNumber',
                'Product Code': 'productCode',
                'Product Description': 'productDescription',
                'Quantity': 'quantity',
                'Unit Price': 'unitPrice',
                'Total Amount': 'totalAmount',
                'Merchant Name': 'merchantName',
                'Merchant Address': 'merchantAddress',
                'Station ID': 'stationId',
                'Odometer': 'odometer',
                'Vehicle ID': 'vehicleId',
                'Authorization Code': 'authorizationCode',
                'Reference Number': 'referenceNumber',
                'Discount Amount': 'discountAmount',
                'Tax Amount': 'taxAmount',
                'Net Amount': 'netAmount',
                'Account Number': 'accountNumber'
              };
              
              return headerMap[header] || header.toLowerCase().replace(/\s+/g, '_');
            }
          }))
          .on('data', (data) => results.push(data))
          .on('end', () => {
            console.log(`✅ Parsed ${results.length} records from CSV`);
            resolve(results);
          })
          .on('error', (error) => {
            console.error('❌ Error parsing CSV:', error.message);
            reject(error);
          });
      });
      
    } catch (error) {
      console.error('❌ Error reading CSV file:', error.message);
      throw new Error(`Failed to parse CSV file: ${error.message}`);
    }
  }

  /**
   * Archive processed file
   */
  async archiveFile(filePath) {
    try {
      const fileName = path.basename(filePath);
      const archiveFilePath = path.join(this.settings.archivePath, fileName);
      
      await this.ensureLocalDirectory(this.settings.archivePath);
      await fs.rename(filePath, archiveFilePath);
      
      console.log(`📦 Archived file: ${fileName}`);
      return archiveFilePath;
      
    } catch (error) {
      console.error('❌ Error archiving file:', error.message);
      throw error;
    }
  }

  /**
   * Test SFTP connection
   */
  async testConnection() {
    try {
      console.log('🧪 Testing WEX SFTP connection...');
      
      await this.connect();
      const files = await this.listRemoteFiles();
      
      const result = {
        success: true,
        message: 'WEX SFTP connection successful',
        filesFound: files.length,
        serverInfo: {
          host: this.config.host,
          port: this.config.port,
          username: this.config.username
        }
      };
      
      await this.disconnect();
      
      console.log('✅ WEX SFTP connection test passed');
      return result;
      
    } catch (error) {
      console.error('❌ WEX SFTP connection test failed:', error.message);
      return {
        success: false,
        message: error.message,
        filesFound: 0
      };
    }
  }

  // Private helper methods

  async ensureConnected() {
    if (!this.connected) {
      await this.connect();
    }
  }

  async ensureLocalDirectory(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dirPath}`);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      connected: this.connected,
      config: {
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        configured: !!(this.config.host && this.config.username)
      },
      paths: this.settings
    };
  }
}

module.exports = WexSftpService;