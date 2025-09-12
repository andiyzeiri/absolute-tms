const cron = require('node-cron');
const FuelDataImporter = require('./fuelDataImporter');

class FuelSyncScheduler {
  constructor() {
    this.fuelImporter = new FuelDataImporter();
    this.jobs = new Map();
    this.isRunning = false;
    
    // Default schedule configurations
    this.schedules = {
      // Every 4 hours between 6 AM and 10 PM (business hours)
      FREQUENT: '0 6-22/4 * * *',
      
      // Every 6 hours
      REGULAR: '0 */6 * * *',
      
      // Daily at 6 AM
      DAILY: '0 6 * * *',
      
      // Every 30 minutes (for testing)
      TESTING: '*/30 * * * *'
    };
    
    this.currentSchedule = process.env.FUEL_SYNC_SCHEDULE || this.schedules.REGULAR;
    this.enabled = process.env.FUEL_SYNC_ENABLED !== 'false'; // Enabled by default
    
    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastRunTime: null,
      lastRunStatus: null,
      nextRunTime: null
    };
  }

  /**
   * Start the scheduled fuel data sync
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Fuel sync scheduler is already running');
      return;
    }

    if (!this.enabled) {
      console.log('ℹ️ Fuel sync scheduler is disabled');
      return;
    }

    console.log(`🕐 Starting fuel sync scheduler with cron: ${this.currentSchedule}`);
    
    // Create and start the cron job
    const job = cron.schedule(this.currentSchedule, async () => {
      await this.runSyncJob();
    }, {
      scheduled: false,
      timezone: process.env.TZ || 'America/New_York'
    });
    
    // Start the job
    job.start();
    this.jobs.set('main', job);
    this.isRunning = true;
    
    // Calculate next run time
    this.updateNextRunTime();
    
    console.log(`✅ Fuel sync scheduler started successfully`);
    console.log(`📅 Next sync scheduled for: ${this.stats.nextRunTime}`);
  }

  /**
   * Stop the scheduled fuel data sync
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Fuel sync scheduler is not running');
      return;
    }

    console.log('🛑 Stopping fuel sync scheduler...');
    
    // Stop all jobs
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`🛑 Stopped job: ${name}`);
    }
    
    this.jobs.clear();
    this.isRunning = false;
    this.stats.nextRunTime = null;
    
    console.log('✅ Fuel sync scheduler stopped');
  }

  /**
   * Restart the scheduler with new configuration
   */
  restart(newSchedule = null) {
    console.log('🔄 Restarting fuel sync scheduler...');
    
    this.stop();
    
    if (newSchedule) {
      this.currentSchedule = newSchedule;
    }
    
    this.start();
  }

  /**
   * Run a single sync job
   */
  async runSyncJob() {
    if (!this.enabled) {
      console.log('⚠️ Fuel sync is disabled, skipping scheduled run');
      return;
    }

    console.log('🚛 Starting scheduled fuel data sync...');
    this.stats.totalRuns++;
    this.stats.lastRunTime = new Date();
    
    try {
      const result = await this.fuelImporter.importFuelData();
      
      if (result.success) {
        this.stats.successfulRuns++;
        this.stats.lastRunStatus = 'SUCCESS';
        
        console.log(`✅ Scheduled fuel sync completed successfully`);
        console.log(`📊 Batch: ${result.batchId}, Files: ${result.filesProcessed}, Imported: ${result.stats.successfulImports}`);
        
        // Log significant imports
        if (result.stats.successfulImports > 0) {
          console.log(`💰 Imported ${result.stats.successfulImports} new fuel transactions`);
        }
        
        if (result.stats.errors > 0) {
          console.log(`⚠️ Warning: ${result.stats.errors} records had errors during import`);
        }
        
      } else {
        this.stats.failedRuns++;
        this.stats.lastRunStatus = 'FAILED';
        console.error(`❌ Scheduled fuel sync failed: ${result.message}`);
      }
      
    } catch (error) {
      this.stats.failedRuns++;
      this.stats.lastRunStatus = 'ERROR';
      console.error('❌ Scheduled fuel sync encountered an error:', error.message);
    }
    
    // Update next run time
    this.updateNextRunTime();
    
    console.log(`📅 Next fuel sync scheduled for: ${this.stats.nextRunTime}`);
  }

  /**
   * Run sync job manually (outside of schedule)
   */
  async runManualSync() {
    console.log('🚛 Running manual fuel data sync...');
    
    try {
      const result = await this.fuelImporter.importFuelData();
      
      console.log('✅ Manual fuel sync completed');
      return result;
      
    } catch (error) {
      console.error('❌ Manual fuel sync failed:', error.message);
      throw error;
    }
  }

  /**
   * Test the connection without running full import
   */
  async testConnection() {
    console.log('🧪 Testing fuel data connection...');
    
    try {
      const result = await this.fuelImporter.testConnection();
      
      if (result.success) {
        console.log(`✅ Connection test successful - Found ${result.filesFound} files`);
      } else {
        console.log(`❌ Connection test failed: ${result.message}`);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Connection test error:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Update the sync schedule
   */
  updateSchedule(schedule) {
    const validSchedules = Object.values(this.schedules);
    
    if (!validSchedules.includes(schedule) && !cron.validate(schedule)) {
      throw new Error('Invalid cron schedule format');
    }
    
    console.log(`🕐 Updating fuel sync schedule from '${this.currentSchedule}' to '${schedule}'`);
    
    this.currentSchedule = schedule;
    
    if (this.isRunning) {
      this.restart();
    }
  }

  /**
   * Enable or disable the scheduler
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    if (enabled) {
      console.log('✅ Fuel sync scheduler enabled');
      if (!this.isRunning) {
        this.start();
      }
    } else {
      console.log('🚫 Fuel sync scheduler disabled');
      if (this.isRunning) {
        this.stop();
      }
    }
  }

  /**
   * Get scheduler status and statistics
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      enabled: this.enabled,
      currentSchedule: this.currentSchedule,
      availableSchedules: this.schedules,
      stats: { ...this.stats },
      activeJobs: Array.from(this.jobs.keys())
    };
  }

  /**
   * Get detailed statistics
   */
  getDetailedStats() {
    const status = this.getStatus();
    
    // Calculate success rate
    const successRate = status.stats.totalRuns > 0 
      ? (status.stats.successfulRuns / status.stats.totalRuns * 100).toFixed(1)
      : 0;
    
    return {
      ...status,
      performance: {
        successRate: parseFloat(successRate),
        averageRunsPerDay: this.calculateAverageRunsPerDay(),
        uptime: this.calculateUptime()
      }
    };
  }

  /**
   * Private helper methods
   */
  
  updateNextRunTime() {
    if (!this.isRunning || !this.currentSchedule) {
      this.stats.nextRunTime = null;
      return;
    }
    
    try {
      // Create a temporary cron job to get next execution time
      const tempJob = cron.schedule(this.currentSchedule, () => {}, { scheduled: false });
      
      // This is a simplified estimation - actual implementation would need a cron parser
      const now = new Date();
      const nextRun = new Date(now.getTime() + (4 * 60 * 60 * 1000)); // Rough estimate
      this.stats.nextRunTime = nextRun.toISOString();
      
    } catch (error) {
      console.warn('⚠️ Could not calculate next run time:', error.message);
      this.stats.nextRunTime = 'Unknown';
    }
  }

  calculateAverageRunsPerDay() {
    if (!this.stats.lastRunTime) return 0;
    
    const daysSinceFirstRun = Math.max(1, 
      (Date.now() - new Date(this.stats.lastRunTime).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return (this.stats.totalRuns / daysSinceFirstRun).toFixed(2);
  }

  calculateUptime() {
    // This is a simplified uptime calculation
    // In a real implementation, you'd track start/stop times
    return this.isRunning ? '100%' : '0%';
  }

  /**
   * Validate cron schedule format
   */
  static validateSchedule(schedule) {
    return cron.validate(schedule);
  }

  /**
   * Get predefined schedule options
   */
  static getScheduleOptions() {
    return {
      FREQUENT: {
        cron: '0 6-22/4 * * *',
        description: 'Every 4 hours during business hours (6 AM - 10 PM)'
      },
      REGULAR: {
        cron: '0 */6 * * *',
        description: 'Every 6 hours'
      },
      DAILY: {
        cron: '0 6 * * *',
        description: 'Daily at 6 AM'
      },
      TESTING: {
        cron: '*/30 * * * *',
        description: 'Every 30 minutes (for testing)'
      }
    };
  }
}

module.exports = FuelSyncScheduler;