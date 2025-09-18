const express = require('express');
const router = express.Router();
const GmailService = require('../services/gmailService');
const Load = require('../models/Load');

const gmailService = new GmailService();

/**
 * Check Gmail service configuration and environment variables
 * GET /api/gmail/config-check
 */
router.get('/config-check', (req, res) => {
  try {
    const envCheck = {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: !!process.env.GOOGLE_REDIRECT_URI,
      service: {
        oauth2Client: !!gmailService.oauth2Client,
        gmail: !!gmailService.gmail
      }
    };

    const allEnvVarsPresent = envCheck.GOOGLE_CLIENT_ID && envCheck.GOOGLE_CLIENT_SECRET;
    const serviceInitialized = envCheck.service.oauth2Client && envCheck.service.gmail;

    res.json({
      success: true,
      production: process.env.NODE_ENV === 'production',
      environment: envCheck,
      status: {
        environmentVariables: allEnvVarsPresent ? 'OK' : 'MISSING',
        serviceInitialized: serviceInitialized ? 'OK' : 'NOT_INITIALIZED',
        ready: allEnvVarsPresent && serviceInitialized
      },
      message: !allEnvVarsPresent
        ? 'Missing required environment variables for Gmail API'
        : !serviceInitialized
        ? 'Gmail service not initialized - call /init endpoint'
        : 'Gmail service configuration is ready'
    });
  } catch (error) {
    console.error('Error checking Gmail config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Gmail configuration',
      error: error.message
    });
  }
});

/**
 * Initialize Gmail service with credentials
 * POST /api/gmail/init
 */
router.post('/init', async (req, res) => {
  try {
    // Check if environment variables are available when not providing credentials
    if (!req.body.credentials) {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(400).json({
          success: false,
          message: 'Gmail service cannot be initialized. Missing required environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET',
          envCheck: {
            GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
            GOOGLE_REDIRECT_URI: !!process.env.GOOGLE_REDIRECT_URI
          }
        });
      }
    }

    const credentials = req.body.credentials || {
      installed: {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uris: [process.env.GOOGLE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob']
      }
    };

    await gmailService.initialize(credentials);
    const authUrl = gmailService.getAuthUrl();

    res.json({
      success: true,
      authUrl,
      message: 'Gmail service initialized. Please visit the auth URL to grant permissions.'
    });
  } catch (error) {
    console.error('Error initializing Gmail service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize Gmail service',
      error: error.message
    });
  }
});

/**
 * Handle OAuth callback and set credentials
 * POST /api/gmail/auth
 */
router.post('/auth', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    const tokens = await gmailService.setCredentials(code);

    // Store tokens securely (in production, encrypt these)
    // For now, we'll just return them to be stored client-side
    res.json({
      success: true,
      tokens,
      message: 'Gmail authentication successful'
    });
  } catch (error) {
    console.error('Error setting Gmail credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to authenticate with Gmail',
      error: error.message
    });
  }
});

/**
 * Set existing tokens
 * POST /api/gmail/set-tokens
 */
router.post('/set-tokens', async (req, res) => {
  try {
    const { tokens } = req.body;

    if (!tokens) {
      return res.status(400).json({
        success: false,
        message: 'Tokens are required'
      });
    }

    // Initialize service if not already initialized
    if (!gmailService.oauth2Client) {
      // Check if required environment variables are available
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(400).json({
          success: false,
          message: 'Gmail service cannot be initialized. Missing required environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET'
        });
      }

      const credentials = {
        installed: {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uris: [process.env.GOOGLE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob']
        }
      };
      await gmailService.initialize(credentials);
    }

    gmailService.setTokens(tokens);

    res.json({
      success: true,
      message: 'Tokens set successfully'
    });
  } catch (error) {
    console.error('Error setting tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set tokens',
      error: error.message
    });
  }
});

/**
 * Check Gmail service initialization status
 */
const checkGmailService = async (req, res, next) => {
  try {
    // Check if Gmail service is initialized
    if (!gmailService.oauth2Client) {
      // Try to auto-initialize if environment variables are available
      if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        const credentials = {
          installed: {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uris: [process.env.GOOGLE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob']
          }
        };
        await gmailService.initialize(credentials);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Gmail service not initialized. Missing environment variables or initialization required.',
          action: 'initialize'
        });
      }
    }

    // Check if service has valid credentials
    if (!gmailService.oauth2Client.credentials || !gmailService.oauth2Client.credentials.access_token) {
      return res.status(401).json({
        success: false,
        message: 'Gmail service not authenticated. Please authenticate first.',
        action: 'authenticate'
      });
    }

    next();
  } catch (error) {
    console.error('Gmail service check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify Gmail service status',
      error: error.message
    });
  }
};

/**
 * Debug email search
 * GET /api/gmail/debug-search
 */
router.get('/debug-search', checkGmailService, async (req, res) => {
  try {
    const { query = '', maxResults = 5 } = req.query;

    console.log(`Debug search with query: "${query}"`);

    // Try a broad search first
    const broadSearch = await gmailService.searchEmails('is:unread OR is:read', parseInt(maxResults));
    console.log(`Found ${broadSearch.length} total emails`);

    // If specific query provided, search with that
    let specificSearch = [];
    if (query) {
      specificSearch = await gmailService.searchEmails(query, parseInt(maxResults));
      console.log(`Found ${specificSearch.length} emails for query: ${query}`);
    }

    res.json({
      success: true,
      debug: {
        totalEmails: broadSearch.length,
        specificEmails: specificSearch.length,
        query,
        broadSample: broadSearch.slice(0, 3).map(email => ({
          id: email.id,
          threadId: email.threadId
        })),
        specificSample: specificSearch.slice(0, 3).map(email => ({
          id: email.id,
          threadId: email.threadId
        }))
      }
    });
  } catch (error) {
    console.error('Debug search error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug search failed',
      error: error.message
    });
  }
});

/**
 * Fetch and parse emails for load data
 * GET /api/gmail/emails
 */
router.get('/emails', checkGmailService, async (req, res) => {
  try {
    const { maxResults = 20, query } = req.query;

    // Get load-related emails
    const emails = query
      ? await gmailService.searchEmails(query, parseInt(maxResults))
      : await gmailService.getLoadEmails(parseInt(maxResults));

    // Parse each email for load data
    const parsedEmails = [];

    for (const emailRef of emails.slice(0, 10)) { // Limit to 10 for performance
      try {
        const fullEmail = await gmailService.getEmailById(emailRef.id);
        const loadData = gmailService.parseEmailForLoadData(fullEmail);

        parsedEmails.push({
          email: {
            id: fullEmail.id,
            subject: fullEmail.payload.headers.find(h => h.name === 'Subject')?.value || '',
            from: fullEmail.payload.headers.find(h => h.name === 'From')?.value || '',
            date: new Date(parseInt(fullEmail.internalDate)),
            snippet: fullEmail.snippet
          },
          loadData,
          confidence: calculateConfidence(loadData)
        });
      } catch (error) {
        console.error(`Error parsing email ${emailRef.id}:`, error);
      }
    }

    // Sort by confidence score
    parsedEmails.sort((a, b) => b.confidence - a.confidence);

    res.json({
      success: true,
      emails: parsedEmails,
      total: emails.length
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emails',
      error: error.message
    });
  }
});

/**
 * Create load from email data
 * POST /api/gmail/create-load
 */
router.post('/create-load', checkGmailService, async (req, res) => {
  try {
    const { emailId, loadData, overrides = {} } = req.body;

    // Merge load data with any overrides
    const finalLoadData = {
      ...loadData,
      ...overrides,
      loadNumber: overrides.loadNumber || loadData.loadNumber || generateLoadNumber(),
      driver: overrides.driver || loadData.driver || 'TBD',
      vehicle: overrides.vehicle || loadData.vehicle || 'TBD',
      weight: overrides.weight || loadData.weight || 'TBD',
      commodity: overrides.commodity || loadData.commodity || 'Amazon Delivery',
      rate: overrides.rate || loadData.rate || 0,
      pickupDate: overrides.pickupDate ? new Date(overrides.pickupDate) :
                  (loadData.pickupDate ? new Date(loadData.pickupDate) : new Date()),
      deliveryDate: overrides.deliveryDate ? new Date(overrides.deliveryDate) :
                    (loadData.deliveryDate ? new Date(loadData.deliveryDate) : new Date()),
      origin: {
        city: overrides.origin?.city || loadData.origin?.city || 'TBD',
        province: overrides.origin?.province || loadData.origin?.province || 'TBD',
        address: overrides.origin?.address || loadData.origin?.address || 'TBD'
      },
      destination: {
        city: overrides.destination?.city || loadData.destination?.city || 'TBD',
        province: overrides.destination?.province || loadData.destination?.province || 'TBD',
        address: overrides.destination?.address || loadData.destination?.address || 'TBD'
      },
      createdAt: new Date(),
      status: 'pending',
      proofOfDelivery: [],
      rateConfirmation: []
    };

    // Validate required fields
    if (!finalLoadData.customer) {
      return res.status(400).json({
        success: false,
        message: 'Customer is required to create a load'
      });
    }

    // Create new load in database
    const newLoad = new Load(finalLoadData);
    await newLoad.save();

    res.json({
      success: true,
      load: newLoad,
      message: 'Load created successfully from email'
    });
  } catch (error) {
    console.error('Error creating load from email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create load from email',
      error: error.message
    });
  }
});

/**
 * Get email content by ID
 * GET /api/gmail/email/:id
 */
router.get('/email/:id', checkGmailService, async (req, res) => {
  try {
    const { id } = req.params;
    const email = await gmailService.getEmailById(id);
    const loadData = gmailService.parseEmailForLoadData(email);

    res.json({
      success: true,
      email,
      loadData,
      confidence: calculateConfidence(loadData)
    });
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email',
      error: error.message
    });
  }
});

/**
 * Auto-process last 100 emails and create loads with high confidence
 * POST /api/gmail/auto-process
 */
router.post('/auto-process', checkGmailService, async (req, res) => {
  try {
    const { minConfidence = 70, dryRun = false } = req.body;

    console.log(`Starting auto-process: minConfidence=${minConfidence}, dryRun=${dryRun}`);

    // Get last 100 emails
    const emails = await gmailService.getLoadEmails(100);
    console.log(`Found ${emails.length} emails to process`);

    const results = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0,
      createdLoads: [],
      skippedEmails: [],
      errorEmails: []
    };

    // Process each email
    for (const emailRef of emails) {
      try {
        results.processed++;

        // Get full email content
        const fullEmail = await gmailService.getEmailById(emailRef.id);
        const loadData = gmailService.parseEmailForLoadData(fullEmail);
        const confidence = calculateConfidence(loadData);

        console.log(`Email ${emailRef.id}: confidence=${confidence}%`);

        // Check if confidence meets threshold
        if (confidence < minConfidence) {
          results.skipped++;
          results.skippedEmails.push({
            id: fullEmail.id,
            subject: fullEmail.payload.headers.find(h => h.name === 'Subject')?.value || '',
            confidence: confidence,
            reason: 'Below minimum confidence threshold'
          });
          continue;
        }

        // Check if load already exists with this email ID
        const existingLoad = await Load.findOne({ emailId: fullEmail.id });
        if (existingLoad) {
          results.skipped++;
          results.skippedEmails.push({
            id: fullEmail.id,
            subject: fullEmail.payload.headers.find(h => h.name === 'Subject')?.value || '',
            confidence: confidence,
            reason: 'Load already exists for this email'
          });
          continue;
        }

        // Validate required fields
        if (!loadData.customer || !loadData.destination?.city) {
          results.skipped++;
          results.skippedEmails.push({
            id: fullEmail.id,
            subject: fullEmail.payload.headers.find(h => h.name === 'Subject')?.value || '',
            confidence: confidence,
            reason: 'Missing required fields (customer or destination)'
          });
          continue;
        }

        // Create load data with defaults for missing required fields
        const finalLoadData = {
          ...loadData,
          loadNumber: loadData.loadNumber || generateLoadNumber(),
          driver: loadData.driver || 'TBD',
          vehicle: loadData.vehicle || 'TBD',
          weight: loadData.weight || 'TBD',
          commodity: loadData.commodity || 'Amazon Delivery',
          rate: loadData.rate || 0,
          pickupDate: loadData.pickupDate ? new Date(loadData.pickupDate) : new Date(),
          deliveryDate: loadData.deliveryDate ? new Date(loadData.deliveryDate) : new Date(),
          origin: {
            city: loadData.origin?.city || 'TBD',
            province: loadData.origin?.province || 'TBD',
            address: loadData.origin?.address || 'TBD'
          },
          destination: {
            city: loadData.destination?.city || 'TBD',
            province: loadData.destination?.province || 'TBD',
            address: loadData.destination?.address || 'TBD'
          },
          status: 'pending',
          proofOfDelivery: [],
          rateConfirmation: [],
          emailId: fullEmail.id,
          emailDate: new Date(parseInt(fullEmail.internalDate)),
          emailSubject: fullEmail.payload.headers.find(h => h.name === 'Subject')?.value || '',
          emailFrom: fullEmail.payload.headers.find(h => h.name === 'From')?.value || ''
        };

        if (!dryRun) {
          // Create new load in database
          const newLoad = new Load(finalLoadData);
          await newLoad.save();

          results.created++;
          results.createdLoads.push({
            id: newLoad._id,
            loadNumber: newLoad.loadNumber,
            customer: newLoad.customer,
            origin: newLoad.origin,
            destination: newLoad.destination,
            driver: newLoad.driver,
            vehicle: newLoad.vehicle,
            status: newLoad.status,
            pickupDate: newLoad.pickupDate.toISOString().split('T')[0],
            deliveryDate: newLoad.deliveryDate.toISOString().split('T')[0],
            deliveryTime: newLoad.deliveryTime || '',
            rate: newLoad.rate,
            weight: newLoad.weight,
            commodity: newLoad.commodity,
            notes: newLoad.notes || '',
            confidence: confidence,
            emailId: fullEmail.id,
            emailSubject: finalLoadData.emailSubject,
            emailFrom: finalLoadData.emailFrom
          });

          console.log(`Created load ${newLoad.loadNumber} from email ${fullEmail.id}`);
        } else {
          results.created++;
          results.createdLoads.push({
            loadNumber: finalLoadData.loadNumber,
            customer: finalLoadData.customer,
            origin: finalLoadData.origin,
            destination: finalLoadData.destination,
            driver: finalLoadData.driver,
            vehicle: finalLoadData.vehicle,
            status: finalLoadData.status,
            pickupDate: finalLoadData.pickupDate.toISOString().split('T')[0],
            deliveryDate: finalLoadData.deliveryDate.toISOString().split('T')[0],
            deliveryTime: finalLoadData.deliveryTime || '',
            rate: finalLoadData.rate,
            weight: finalLoadData.weight,
            commodity: finalLoadData.commodity,
            notes: finalLoadData.notes || '',
            confidence: confidence,
            emailId: fullEmail.id,
            emailSubject: finalLoadData.emailSubject,
            emailFrom: finalLoadData.emailFrom,
            dryRun: true
          });

          console.log(`[DRY RUN] Would create load ${finalLoadData.loadNumber} from email ${fullEmail.id}`);
        }
      } catch (error) {
        console.error(`Error processing email ${emailRef.id}:`, error);
        results.errors++;
        results.errorEmails.push({
          id: emailRef.id,
          error: error.message
        });
      }
    }

    console.log(`Auto-process complete: ${results.created} created, ${results.skipped} skipped, ${results.errors} errors`);

    res.json({
      success: true,
      message: dryRun
        ? `Dry run completed: ${results.created} loads would be created`
        : `Auto-process completed: ${results.created} loads created`,
      results
    });
  } catch (error) {
    console.error('Error in auto-process:', error);
    res.status(500).json({
      success: false,
      message: 'Auto-process failed',
      error: error.message
    });
  }
});

/**
 * Calculate confidence score for parsed load data
 */
function calculateConfidence(loadData) {
  let score = 0;
  const weights = {
    loadNumber: 20,
    customer: 15,
    origin: 15,
    destination: 15,
    pickupDate: 10,
    deliveryDate: 10,
    deliveryTime: 5,
    rate: 8,
    weight: 4,
    commodity: 3
  };

  Object.keys(weights).forEach(field => {
    if (loadData[field] && loadData[field] !== '' && loadData[field] !== 0) {
      if (typeof loadData[field] === 'object') {
        // For location objects, check if city is present
        if (loadData[field].city) {
          score += weights[field];
        }
      } else {
        score += weights[field];
      }
    }
  });

  // Bonus points for Amazon facility format
  if (loadData.notes && loadData.notes.includes('Amazon Facility:')) {
    score += 25; // High confidence for Amazon format
  }

  // Bonus for delivery time
  if (loadData.deliveryTime && loadData.deliveryTime.includes('EDT') ||
      loadData.deliveryTime.includes('EST') ||
      loadData.deliveryTime.includes('PDT') ||
      loadData.deliveryTime.includes('PST')) {
    score += 10;
  }

  // Bonus for commodity being Amazon Delivery
  if (loadData.commodity === 'Amazon Delivery') {
    score += 15;
  }

  return Math.min(score, 100); // Cap at 100%
}

/**
 * Generate a unique load number
 */
function generateLoadNumber() {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `L-${year}-${timestamp}`;
}

module.exports = router;