const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

class GmailService {
  constructor() {
    this.oauth2Client = null;
    this.gmail = null;
  }

  /**
   * Initialize OAuth2 client with credentials
   */
  async initialize(credentials) {
    const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

    this.oauth2Client = new OAuth2Client(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    return this;
  }

  /**
   * Generate authorization URL for user consent
   */
  getAuthUrl() {
    const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob'
    });
  }

  /**
   * Set credentials from authorization code
   */
  async setCredentials(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  /**
   * Set existing tokens
   */
  setTokens(tokens) {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized. Call initialize() first.');
    }
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Search for emails with specific query
   */
  async searchEmails(query = '', maxResults = 10) {
    try {
      if (!this.gmail) {
        throw new Error('Gmail service not initialized. Call initialize() and setCredentials() first.');
      }

      if (!this.oauth2Client.credentials || !this.oauth2Client.credentials.access_token) {
        throw new Error('No valid credentials set. Call setCredentials() or setTokens() first.');
      }

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxResults
      });

      return response.data.messages || [];
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }

  /**
   * Get full email content by message ID
   */
  async getEmailById(messageId) {
    try {
      if (!this.gmail) {
        throw new Error('Gmail service not initialized. Call initialize() and setCredentials() first.');
      }

      if (!this.oauth2Client.credentials || !this.oauth2Client.credentials.access_token) {
        throw new Error('No valid credentials set. Call setCredentials() or setTokens() first.');
      }

      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting email:', error);
      throw error;
    }
  }

  /**
   * Parse email content to extract load information
   */
  parseEmailForLoadData(email) {
    const headers = email.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';

    // Extract body text
    let bodyText = '';
    if (email.payload.body?.data) {
      bodyText = Buffer.from(email.payload.body.data, 'base64').toString('utf8');
    } else if (email.payload.parts) {
      // Handle multipart messages
      for (const part of email.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          bodyText += Buffer.from(part.body.data, 'base64').toString('utf8');
        }
      }
    }

    // Combine subject and body for parsing
    const fullText = `${subject} ${bodyText}`;
    const fullTextLower = fullText.toLowerCase();

    // Check for Amazon facility format first: ND9-2 09/25/2025 13:00 EDT
    const amazonData = this.parseAmazonFacilityFormat(fullText);

    // Extract load information using patterns
    const loadData = {
      loadNumber: amazonData.loadNumber || this.extractLoadNumber(fullTextLower),
      customer: this.extractCustomer(from, fullTextLower),
      origin: this.extractLocation(fullTextLower, ['pickup', 'origin', 'from']),
      destination: amazonData.destination || this.extractLocation(fullTextLower, ['delivery', 'destination', 'to', 'drop']),
      pickupDate: this.extractDate(fullTextLower, ['pickup', 'pick up', 'ready']),
      deliveryDate: amazonData.deliveryDate || this.extractDate(fullTextLower, ['delivery', 'deliver', 'due']),
      deliveryTime: amazonData.deliveryTime || '',
      rate: this.extractRate(fullTextLower),
      weight: this.extractWeight(fullTextLower),
      commodity: amazonData.commodity || this.extractCommodity(fullTextLower),
      notes: amazonData.notes || this.extractNotes(subject, bodyText, from),
      emailId: email.id,
      emailDate: new Date(parseInt(email.internalDate)),
      emailSubject: subject,
      emailFrom: from
    };

    return loadData;
  }

  /**
   * Parse Amazon facility format: ND9-2 09/25/2025 13:00 EDT
   */
  parseAmazonFacilityFormat(text) {
    // Pattern for Amazon facility format: [FACILITY] [MM/DD/YYYY] [HH:MM] [TIMEZONE]
    const amazonPattern = /([A-Z]{2,4}\d*-?\d*)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2})\s+([A-Z]{3})/gi;

    let match;
    const results = {
      loadNumber: '',
      destination: { city: '', province: '', address: '' },
      deliveryDate: '',
      deliveryTime: '',
      notes: '',
      commodity: 'Amazon Delivery'
    };

    while ((match = amazonPattern.exec(text)) !== null) {
      const [fullMatch, facilityCode, date, time, timezone] = match;

      // Extract facility code for notes
      results.notes = `Amazon Facility: ${facilityCode} | Delivery Time: ${time} ${timezone}`;

      // Parse delivery date
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        results.deliveryDate = parsedDate.toISOString().split('T')[0];
      }

      // Store delivery time
      results.deliveryTime = `${time} ${timezone}`;

      // Use facility code as part of load identification
      results.loadNumber = facilityCode;

      // Try to determine location from facility code (common Amazon facilities)
      const facilityLocation = this.getAmazonFacilityLocation(facilityCode);
      if (facilityLocation.city) {
        results.destination = facilityLocation;
      }

      // Found Amazon format, break after first match
      break;
    }

    return results;
  }

  /**
   * Get location info for common Amazon facility codes
   */
  getAmazonFacilityLocation(facilityCode) {
    const facilityMap = {
      // Common Amazon facility codes and their locations
      'ND9': { city: 'Nashville', province: 'TN', address: 'Nashville Distribution Center' },
      'ATL1': { city: 'Atlanta', province: 'GA', address: 'Atlanta Fulfillment Center' },
      'ATL2': { city: 'Atlanta', province: 'GA', address: 'Atlanta Distribution Center' },
      'BWI2': { city: 'Baltimore', province: 'MD', address: 'Baltimore Fulfillment Center' },
      'CMH1': { city: 'Columbus', province: 'OH', address: 'Columbus Fulfillment Center' },
      'DFW7': { city: 'Dallas', province: 'TX', address: 'Dallas Fulfillment Center' },
      'IAD8': { city: 'Washington', province: 'DC', address: 'Washington DC Fulfillment Center' },
      'LAX9': { city: 'Los Angeles', province: 'CA', address: 'Los Angeles Fulfillment Center' },
      'MDW2': { city: 'Chicago', province: 'IL', address: 'Chicago Distribution Center' },
      'MKE1': { city: 'Milwaukee', province: 'WI', address: 'Milwaukee Fulfillment Center' },
      'PHX3': { city: 'Phoenix', province: 'AZ', address: 'Phoenix Fulfillment Center' },
      'SEA8': { city: 'Seattle', province: 'WA', address: 'Seattle Distribution Center' },
      'TPA2': { city: 'Tampa', province: 'FL', address: 'Tampa Fulfillment Center' }
    };

    // Check for exact match first
    if (facilityMap[facilityCode]) {
      return facilityMap[facilityCode];
    }

    // Check for partial match (e.g., ND9-2 should match ND9)
    const baseCode = facilityCode.replace(/-\d+$/, '');
    if (facilityMap[baseCode]) {
      return {
        ...facilityMap[baseCode],
        address: `${facilityMap[baseCode].address} - ${facilityCode}`
      };
    }

    // Default to generic Amazon facility
    return {
      city: 'Amazon Facility',
      province: '',
      address: `Amazon Distribution Center - ${facilityCode}`
    };
  }

  /**
   * Extract load number from text
   */
  extractLoadNumber(text) {
    const patterns = [
      /load\s*#?\s*([a-z0-9\-]+)/i,
      /reference\s*#?\s*([a-z0-9\-]+)/i,
      /ref\s*#?\s*([a-z0-9\-]+)/i,
      /shipment\s*#?\s*([a-z0-9\-]+)/i,
      /#([a-z0-9\-]{4,})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].toUpperCase();
    }
    return '';
  }

  /**
   * Extract customer name from email sender or content
   */
  extractCustomer(from, text) {
    // Extract company name from email address
    const emailMatch = from.match(/(.+?)\s*<.*@(.+?)>/);
    if (emailMatch) {
      return emailMatch[1].replace(/['"]/g, '').trim();
    }

    // Look for company patterns in text
    const patterns = [
      /from\s+(.+?)\s+(?:regarding|for|about)/i,
      /company[:\s]+(.+?)(?:\n|$)/i,
      /shipper[:\s]+(.+?)(?:\n|$)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }

    return from.split('@')[0] || 'Unknown Customer';
  }

  /**
   * Extract location information
   */
  extractLocation(text, keywords) {
    for (const keyword of keywords) {
      const patterns = [
        new RegExp(`${keyword}\\s*:?\\s*([a-z\\s,]+(?:,\\s*[a-z]{2})?)`, 'i'),
        new RegExp(`${keyword}\\s+(?:at|in)?\\s*([a-z\\s,]+(?:,\\s*[a-z]{2})?)`, 'i')
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const location = match[1].trim();
          return this.parseLocation(location);
        }
      }
    }

    return { city: '', province: '', address: '' };
  }

  /**
   * Parse location string into city, province, address
   */
  parseLocation(locationStr) {
    const parts = locationStr.split(',').map(p => p.trim());

    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      // Check if last part looks like a state/province (2 letters)
      if (lastPart.match(/^[a-z]{2}$/i)) {
        return {
          city: parts[parts.length - 2] || '',
          province: lastPart.toUpperCase(),
          address: parts.slice(0, -2).join(', ') || `${parts[parts.length - 2]}, ${lastPart}`
        };
      }
    }

    // Fallback
    return {
      city: parts[0] || locationStr,
      province: parts[1] || '',
      address: locationStr
    };
  }

  /**
   * Extract dates
   */
  extractDate(text, keywords) {
    for (const keyword of keywords) {
      const patterns = [
        new RegExp(`${keyword}\\s*:?\\s*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})`, 'i'),
        new RegExp(`${keyword}\\s*:?\\s*(\\d{1,2}\\s+\\w+\\s+\\d{2,4})`, 'i'),
        new RegExp(`${keyword}\\s*:?\\s*(\\w+\\s+\\d{1,2},?\\s+\\d{2,4})`, 'i')
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const parsedDate = new Date(match[1]);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString().split('T')[0];
          }
        }
      }
    }
    return '';
  }

  /**
   * Extract rate information
   */
  extractRate(text) {
    const patterns = [
      /rate[\s:]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /pay[\s:]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    return 0;
  }

  /**
   * Extract weight information
   */
  extractWeight(text) {
    const patterns = [
      /weight[\s:]*(\d+(?:,\d{3})*)\s*lbs?/i,
      /(\d+(?:,\d{3})*)\s*lbs?\s*load/i,
      /(\d+(?:,\d{3})*)\s*pounds?/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return `${match[1]} lbs`;
      }
    }
    return '';
  }

  /**
   * Extract commodity information
   */
  extractCommodity(text) {
    const patterns = [
      /commodity[\s:]+([^\n\r.]+)/i,
      /cargo[\s:]+([^\n\r.]+)/i,
      /freight[\s:]+([^\n\r.]+)/i,
      /product[\s:]+([^\n\r.]+)/i,
      /shipping[\s:]+([^\n\r.]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return 'General Freight';
  }

  /**
   * Extract or create notes from email
   */
  extractNotes(subject, body, from) {
    const notes = [];

    // Add email source info
    notes.push(`Email from: ${from}`);
    notes.push(`Subject: ${subject}`);

    // Look for special instructions
    const instructionPatterns = [
      /special instructions?[:\s]+([^\n\r.]+)/i,
      /notes?[:\s]+([^\n\r.]+)/i,
      /instructions?[:\s]+([^\n\r.]+)/i,
      /requirements?[:\s]+([^\n\r.]+)/i
    ];

    for (const pattern of instructionPatterns) {
      const match = body.match(pattern);
      if (match && match[1]) {
        notes.push(`Instructions: ${match[1].trim()}`);
      }
    }

    return notes.join(' | ');
  }

  /**
   * Get recent load-related emails
   */
  async getLoadEmails(maxResults = 20) {
    // Search for emails that might contain load information
    const queries = [
      // Amazon facility patterns
      'subject:(ND9 OR ATL OR BWI OR CMH OR DFW OR IAD OR LAX OR MDW OR MKE OR PHX OR SEA OR TPA)',
      // Date patterns that might indicate Amazon loads
      'subject:(/2024 OR /2025 OR EDT OR EST OR PDT OR PST)',
      // Traditional load patterns
      'subject:(load OR shipment OR freight OR pickup OR delivery)',
      'load OR shipment OR "pick up" OR "delivery"',
      'subject:(ref OR reference OR "#")',
      // Amazon specific
      'amazon OR fulfillment OR distribution',
      // Facility codes pattern
      'subject:([A-Z]{2,4}[0-9])'
    ];

    let allEmails = [];

    for (const query of queries) {
      try {
        const messages = await this.searchEmails(query, Math.ceil(maxResults / queries.length));
        allEmails = allEmails.concat(messages);
      } catch (error) {
        console.error(`Error searching with query "${query}":`, error);
      }
    }

    // Remove duplicates
    const uniqueEmails = allEmails.filter((email, index, self) =>
      index === self.findIndex(e => e.id === email.id)
    );

    // Sort by date (newest first)
    uniqueEmails.sort((a, b) => {
      return parseInt(b.internalDate || 0) - parseInt(a.internalDate || 0);
    });

    return uniqueEmails.slice(0, maxResults);
  }
}

module.exports = GmailService;