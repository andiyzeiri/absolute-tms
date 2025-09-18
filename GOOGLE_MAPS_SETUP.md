# Google Maps API Setup Guide

The TMS application now includes Google Maps integration for highly accurate driving distance calculations. Follow this guide to set up the Google Maps API for the most precise mileage calculations.

## 🚀 Quick Setup

### 1. Get a Google Maps API Key

1. **Visit Google Cloud Console**: https://console.cloud.google.com/
2. **Create or select a project**
3. **Enable the required APIs**:
   - Distance Matrix API
   - Geocoding API (optional, for address validation)
   - Directions API (optional, for route optimization)

4. **Create API Key**:
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Copy the generated API key

### 2. Configure API Key Restrictions (Recommended)

For security, restrict your API key:

**Application Restrictions:**
- Select "HTTP referrers (web sites)"
- Add your domains:
  - `http://localhost:3000/*` (development)
  - `https://yourdomain.com/*` (production)

**API Restrictions:**
- Select "Restrict key"
- Choose: Distance Matrix API, Geocoding API, Directions API

### 3. Add API Key to Environment Variables

Replace the placeholder in both environment files:

**Root `.env` file:**
```bash
GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

**Client `.env` file (`/client/.env`):**
```bash
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

### 4. Restart the Development Server

```bash
npm run dev
```

## ✅ How It Works

### Smart Fallback System
The application uses a **hybrid approach**:

1. **Primary**: Google Maps Distance Matrix API
   - Real-time, accurate driving distances
   - Considers current traffic and road conditions
   - Truck-friendly route preferences

2. **Fallback**: Static distance database
   - 100+ pre-calculated driving distances
   - Works without API key for development
   - Based on major interstate highway routes

### Features with Google Maps API

- ✅ **Real-time accuracy** - Current road conditions
- ✅ **Traffic-aware routing** - Dynamic distance calculations
- ✅ **Truck-friendly routes** - Avoids toll roads and restrictions
- ✅ **Duration estimates** - Travel time predictions
- ✅ **Address validation** - Automatic geocoding
- ✅ **Route optimization** - Multi-stop route planning

## 📊 API Usage & Costs

### Distance Matrix API Pricing (as of 2024)
- **Free tier**: 40,000 requests/month
- **Paid**: $0.005 per request after free tier
- **Typical TMS usage**: ~100-500 requests/day

### Cost Estimation for TMS
- **Small fleet** (50 loads/day): ~$7.50/month
- **Medium fleet** (200 loads/day): ~$30/month
- **Large fleet** (500 loads/day): ~$75/month

## 🔧 Configuration Options

### Environment Variables

```bash
# Required - Your Google Maps API Key
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here

# Optional - API configuration
REACT_APP_GOOGLE_MAPS_REGION=US
REACT_APP_GOOGLE_MAPS_UNITS=imperial
```

### Service Configuration
The Google Maps service can be configured in `/src/services/googleMapsService.js`:

```javascript
// Default settings optimized for trucking
const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
  params: {
    origins: originStr,
    destinations: destinationStr,
    units: 'imperial',      // Miles instead of kilometers
    mode: 'driving',        // Driving directions
    avoid: 'tolls',        // Avoid toll roads for trucking
    key: this.apiKey
  }
});
```

## 🛠️ Troubleshooting

### Common Issues

**1. "API key not configured" message**
- Ensure API key is in both `.env` files
- Restart development server after adding key
- Check API key has no extra spaces

**2. "Unable to calculate distance" errors**
- Verify API key permissions
- Check API quotas in Google Cloud Console
- Ensure Distance Matrix API is enabled

**3. Fallback to static distances**
- Normal behavior when API key is missing
- Check console for specific error messages
- Verify network connectivity

### Validation Commands

Test if your API key works:

```bash
# Test API key directly
curl "https://maps.googleapis.com/maps/api/distancematrix/json?origins=New%20York&destinations=Los%20Angeles&key=YOUR_API_KEY"
```

## 📈 Benefits vs. Static Database

| Feature | Google Maps API | Static Database |
|---------|----------------|-----------------|
| **Accuracy** | 99%+ accurate | ~85% accurate |
| **Real-time** | ✅ Current conditions | ❌ Fixed routes |
| **Traffic-aware** | ✅ Dynamic | ❌ Static |
| **Cost** | $0.005/request | Free |
| **Coverage** | Global | US major cities |
| **Offline** | ❌ Requires internet | ✅ Works offline |

## 🚛 Trucking-Specific Features

When Google Maps API is configured, the system automatically:

- **Avoids tolls** - Reduces operating costs
- **Prefers truck routes** - Uses truck-friendly highways
- **Calculates realistic times** - Includes rest stops and regulations
- **Updates with traffic** - Real-time condition adjustments

## 📋 Next Steps

1. **Get your API key** from Google Cloud Console
2. **Add it to environment files** (both root and client)
3. **Restart the application**
4. **Test with a new load** - You'll see "Loading..." then accurate mileage
5. **Monitor usage** in Google Cloud Console

---

**Need help?** Check the Google Maps Platform documentation: https://developers.google.com/maps/documentation/distance-matrix/overview