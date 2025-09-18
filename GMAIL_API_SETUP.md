# Gmail API Setup Guide

This guide will help you set up Gmail API integration for the TMS system to automatically create loads from emails.

## Prerequisites

- Google Cloud Console account
- Gmail account that will be used for email integration

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

### 2. Enable Gmail API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click on "Gmail API" and then "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in the required fields (App name, User support email, etc.)
   - Add your email to the test users list
4. For application type, choose "Web application"
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (for development)
   - Add your production domain if deploying
6. Click "Create"
7. Copy the Client ID and Client Secret

### 4. Update Environment Variables

Update your `.env` file with the credentials:

```bash
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

### 5. OAuth Consent Screen Configuration

1. Go to "APIs & Services" > "OAuth consent screen"
2. Fill in the required information:
   - App name: "TMS Email Integration"
   - User support email: your email
   - App domain: your domain (or localhost for testing)
3. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
4. Add test users (emails that can use the integration)

## How to Use

### 1. Initialize Gmail Integration

1. Log into your TMS system
2. Navigate to "Email Integration" in the sidebar
3. Click "Connect Gmail"
4. You'll be redirected to Google's authorization page
5. Grant permissions to read your Gmail
6. Copy the authorization code and paste it in the TMS dialog
7. Click "Authenticate"

### 2. Processing Emails

Once authenticated:

1. Click "Refresh Emails" to fetch recent emails
2. The system will automatically parse emails for load information
3. Review the extracted data and confidence scores
4. Edit any incorrect information
5. Click "Create Load" to add it to your TMS

## Email Parsing Features

The system automatically extracts:

- **Load Numbers**: From subject lines and email content
- **Customer Information**: From sender email and content
- **Origin/Destination**: City, state/province information
- **Dates**: Pickup and delivery dates
- **Rates**: Dollar amounts found in emails
- **Weight**: Load weights in lbs
- **Commodity**: Type of freight
- **Special Instructions**: Notes and requirements

## Supported Email Formats

The parser works best with emails containing:

- Load or shipment numbers
- Clear pickup/delivery locations
- Dates in standard formats (MM/DD/YYYY, etc.)
- Rate information with dollar signs
- Weight information with "lbs" or "pounds"
- Common freight terminology

## Security Notes

- OAuth tokens are stored locally in your browser
- The system only reads emails (readonly access)
- No emails are stored on the server
- All parsing happens in real-time

## Troubleshooting

### Authentication Issues

- Make sure redirect URI matches exactly in Google Cloud Console
- Check that Gmail API is enabled for your project
- Verify your email is added as a test user

### Email Not Found

- Try different search terms in the email query
- Check that emails contain freight-related keywords
- Ensure you have permission to read the Gmail account

### Parsing Issues

- Review and edit extracted data before creating loads
- Add additional keywords to the notes field
- The system learns from patterns in your emails

## Production Deployment

For production deployment:

1. Update redirect URIs in Google Cloud Console
2. Submit OAuth consent screen for review (if needed)
3. Update environment variables with production values
4. Consider implementing token encryption for security

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure Gmail API quotas haven't been exceeded
4. Contact support with specific error messages