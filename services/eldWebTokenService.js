const axios = require('axios');
const crypto = require('crypto');

class EldWebTokenService {
  constructor() {
    // ELD Provider Configuration from environment
    this.config = {
      apiBaseUrl: process.env.ELD_API_BASE_URL,
      webToken: process.env.ELD_WEB_TOKEN,
      clientId: process.env.ELD_CLIENT_ID,
      clientSecret: process.env.ELD_CLIENT_SECRET,
      refreshToken: process.env.ELD_REFRESH_TOKEN,
      tokenExpiry: process.env.ELD_TOKEN_EXPIRY || '1h',
      rateLimit: {
        requestsPerMinute: 60,
        burstLimit: 100
      }
    };

    // Token management
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.rateLimitCounter = 0;
    this.lastRequestTime = 0;

    // Request queue for rate limiting
    this.requestQueue = [];
    this.isProcessingQueue = false;

    // ELD data cache
    this.cache = {
      driverLogs: new Map(),
      vehicleStatus: new Map(),
      hosData: new Map(),
      lastUpdated: new Map()
    };
  }

  /**
   * Initialize ELD service and authenticate
   */
  async initialize() {
    try {
      console.log('🔌 Initializing ELD Web Token Service...');
      
      // Validate configuration
      if (!this.config.apiBaseUrl || !this.config.webToken) {
        throw new Error('ELD configuration incomplete. Please check environment variables.');
      }

      // Authenticate and get access token
      await this.authenticate();
      
      // Set up token refresh interval
      this.setupTokenRefresh();
      
      // Set up rate limiting processor
      this.startQueueProcessor();

      console.log('✅ ELD Web Token Service initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize ELD service:', error.message);
      throw error;
    }
  }

  /**
   * Authenticate with ELD provider using web token
   */
  async authenticate() {
    try {
      console.log('🔐 Authenticating with ELD provider...');

      const authData = {
        grant_type: 'web_token',
        web_token: this.config.webToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      };

      const response = await axios.post(`${this.config.apiBaseUrl}/oauth/token`, authData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      if (response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.refreshToken = response.data.refresh_token || this.config.refreshToken;
        
        // Calculate token expiry (subtract 5 minutes for safety)
        const expiresIn = response.data.expires_in || 3600;
        this.tokenExpiresAt = Date.now() + ((expiresIn - 300) * 1000);

        console.log('✅ ELD authentication successful');
        console.log(`🕐 Token expires at: ${new Date(this.tokenExpiresAt).toISOString()}`);
        
        return true;
      } else {
        throw new Error('Invalid authentication response from ELD provider');
      }

    } catch (error) {
      console.error('❌ ELD authentication failed:', error.response?.data || error.message);
      throw new Error(`ELD Authentication Failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    try {
      console.log('🔄 Refreshing ELD access token...');

      const refreshData = {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      };

      const response = await axios.post(`${this.config.apiBaseUrl}/oauth/token`, refreshData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      if (response.data.access_token) {
        this.accessToken = response.data.access_token;
        
        const expiresIn = response.data.expires_in || 3600;
        this.tokenExpiresAt = Date.now() + ((expiresIn - 300) * 1000);

        console.log('✅ ELD token refreshed successfully');
        return true;
      }

    } catch (error) {
      console.error('❌ Token refresh failed:', error.message);
      // Fall back to full authentication
      return await this.authenticate();
    }
  }

  /**
   * Setup automatic token refresh
   */
  setupTokenRefresh() {
    setInterval(async () => {
      if (this.tokenExpiresAt && Date.now() >= this.tokenExpiresAt - 600000) {
        // Refresh token 10 minutes before expiry
        try {
          await this.refreshAccessToken();
        } catch (error) {
          console.error('❌ Automatic token refresh failed:', error.message);
        }
      }
    }, 300000); // Check every 5 minutes
  }

  /**
   * Make authenticated API request with rate limiting
   */
  async makeRequest(endpoint, method = 'GET', data = null, options = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        endpoint,
        method,
        data,
        options,
        resolve,
        reject,
        timestamp: Date.now()
      });

      if (!this.isProcessingQueue) {
        this.processRequestQueue();
      }
    });
  }

  /**
   * Process request queue with rate limiting
   */
  async processRequestQueue() {
    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      
      try {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < 1000) {
          // Wait to maintain rate limit
          await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
        }

        // Check if token needs refresh
        if (!this.accessToken || (this.tokenExpiresAt && Date.now() >= this.tokenExpiresAt)) {
          await this.refreshAccessToken();
        }

        // Make the actual request
        const response = await this.executeRequest(request);
        this.lastRequestTime = Date.now();
        
        request.resolve(response);

      } catch (error) {
        request.reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Execute individual API request
   */
  async executeRequest({ endpoint, method, data, options }) {
    try {
      const config = {
        method,
        url: `${this.config.apiBaseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        },
        timeout: 30000,
        ...options
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;

    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired, refresh and retry
        await this.refreshAccessToken();
        return this.executeRequest({ endpoint, method, data, options });
      }
      
      console.error(`❌ ELD API request failed [${method} ${endpoint}]:`, error.response?.data || error.message);
      throw new Error(`ELD API Error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get driver Hours of Service (HOS) data
   */
  async getDriverHOS(driverId, startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const endpoint = `/drivers/${driverId}/hos?${params.toString()}`;
      const hosData = await this.makeRequest(endpoint);

      // Cache the data
      this.cache.hosData.set(driverId, hosData);
      this.cache.lastUpdated.set(`hos_${driverId}`, Date.now());

      return this.processHOSData(hosData);

    } catch (error) {
      console.error(`❌ Failed to get HOS data for driver ${driverId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get driver duty status logs
   */
  async getDriverLogs(driverId, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const endpoint = `/drivers/${driverId}/logs/${targetDate}`;
      
      const logsData = await this.makeRequest(endpoint);

      // Cache the data
      this.cache.driverLogs.set(`${driverId}_${targetDate}`, logsData);
      this.cache.lastUpdated.set(`logs_${driverId}_${targetDate}`, Date.now());

      return this.processDriverLogs(logsData);

    } catch (error) {
      console.error(`❌ Failed to get driver logs for ${driverId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get vehicle status and location data
   */
  async getVehicleStatus(vehicleId) {
    try {
      const endpoint = `/vehicles/${vehicleId}/status`;
      const statusData = await this.makeRequest(endpoint);

      // Cache the data
      this.cache.vehicleStatus.set(vehicleId, statusData);
      this.cache.lastUpdated.set(`vehicle_${vehicleId}`, Date.now());

      return this.processVehicleStatus(statusData);

    } catch (error) {
      console.error(`❌ Failed to get vehicle status for ${vehicleId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all active drivers and their current status
   */
  async getAllActiveDrivers() {
    try {
      const endpoint = '/drivers/active';
      const driversData = await this.makeRequest(endpoint);

      return driversData.map(driver => this.processDriverStatus(driver));

    } catch (error) {
      console.error('❌ Failed to get active drivers:', error.message);
      throw error;
    }
  }

  /**
   * Get fleet-wide compliance summary
   */
  async getComplianceSummary() {
    try {
      const endpoint = '/compliance/summary';
      const complianceData = await this.makeRequest(endpoint);

      return this.processComplianceData(complianceData);

    } catch (error) {
      console.error('❌ Failed to get compliance summary:', error.message);
      throw error;
    }
  }

  /**
   * Send driver status update to ELD
   */
  async updateDriverStatus(driverId, status, location = null) {
    try {
      const updateData = {
        driver_id: driverId,
        status: status,
        timestamp: new Date().toISOString(),
        location: location
      };

      const endpoint = `/drivers/${driverId}/status`;
      const result = await this.makeRequest(endpoint, 'POST', updateData);

      console.log(`✅ Driver status updated: ${driverId} -> ${status}`);
      return result;

    } catch (error) {
      console.error(`❌ Failed to update driver status for ${driverId}:`, error.message);
      throw error;
    }
  }

  // Data processing methods

  processHOSData(rawData) {
    return {
      driverId: rawData.driver_id,
      currentStatus: rawData.current_status,
      timeRemaining: {
        drive: rawData.drive_time_remaining || 0,
        duty: rawData.duty_time_remaining || 0,
        cycle: rawData.cycle_time_remaining || 0
      },
      violations: rawData.violations || [],
      lastStatusChange: rawData.last_status_change,
      nextBreakRequired: rawData.next_break_required,
      cycleStart: rawData.cycle_start
    };
  }

  processDriverLogs(rawData) {
    return {
      driverId: rawData.driver_id,
      logDate: rawData.log_date,
      dutyStatusChanges: rawData.duty_status_changes.map(change => ({
        status: change.status,
        timestamp: change.timestamp,
        location: change.location,
        odometer: change.odometer,
        engineHours: change.engine_hours
      })),
      totalDriveTime: rawData.total_drive_time,
      totalDutyTime: rawData.total_duty_time,
      violations: rawData.violations || [],
      certified: rawData.certified || false
    };
  }

  processVehicleStatus(rawData) {
    return {
      vehicleId: rawData.vehicle_id,
      driverId: rawData.current_driver_id,
      location: {
        latitude: rawData.latitude,
        longitude: rawData.longitude,
        address: rawData.address,
        timestamp: rawData.location_timestamp
      },
      engineStatus: rawData.engine_status,
      speed: rawData.speed,
      odometer: rawData.odometer,
      engineHours: rawData.engine_hours,
      fuelLevel: rawData.fuel_level,
      lastUpdate: rawData.last_update
    };
  }

  processDriverStatus(rawData) {
    return {
      driverId: rawData.driver_id,
      name: rawData.name,
      currentStatus: rawData.current_status,
      vehicleId: rawData.vehicle_id,
      location: rawData.location,
      statusSince: rawData.status_since,
      hoursRemaining: rawData.hours_remaining,
      nextBreak: rawData.next_break,
      violations: rawData.violations || []
    };
  }

  processComplianceData(rawData) {
    return {
      totalDrivers: rawData.total_drivers,
      activeDrivers: rawData.active_drivers,
      violationsCount: rawData.violations_count,
      complianceRate: rawData.compliance_rate,
      criticalViolations: rawData.critical_violations || [],
      upcomingDeadlines: rawData.upcoming_deadlines || [],
      fleetUtilization: rawData.fleet_utilization || 0
    };
  }

  /**
   * Test ELD connection and authentication
   */
  async testConnection() {
    try {
      console.log('🧪 Testing ELD connection...');
      
      await this.authenticate();
      const driversData = await this.makeRequest('/drivers/test');

      return {
        success: true,
        message: 'ELD connection successful',
        tokenValid: !!this.accessToken,
        apiBaseUrl: this.config.apiBaseUrl,
        testResponse: driversData
      };

    } catch (error) {
      console.error('❌ ELD connection test failed:', error.message);
      return {
        success: false,
        message: error.message,
        tokenValid: false
      };
    }
  }

  /**
   * Get service status and configuration
   */
  getStatus() {
    return {
      initialized: !!this.accessToken,
      tokenValid: this.accessToken && (!this.tokenExpiresAt || Date.now() < this.tokenExpiresAt),
      tokenExpiresAt: this.tokenExpiresAt ? new Date(this.tokenExpiresAt).toISOString() : null,
      requestQueueLength: this.requestQueue.length,
      cacheStats: {
        driverLogs: this.cache.driverLogs.size,
        vehicleStatus: this.cache.vehicleStatus.size,
        hosData: this.cache.hosData.size
      },
      config: {
        apiBaseUrl: this.config.apiBaseUrl,
        clientId: this.config.clientId,
        hasWebToken: !!this.config.webToken
      }
    };
  }

  /**
   * Clear cached data
   */
  clearCache() {
    this.cache.driverLogs.clear();
    this.cache.vehicleStatus.clear();
    this.cache.hosData.clear();
    this.cache.lastUpdated.clear();
    console.log('🧹 ELD cache cleared');
  }
}

module.exports = EldWebTokenService;