const express = require('express');
const axios = require('axios');
const router = express.Router();

// Distance calculation endpoint
router.post('/distance', async (req, res) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required'
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured',
        fallback: true
      });
    }

    const originStr = `${origin.city}, ${origin.state || origin.province}`;
    const destinationStr = `${destination.city}, ${destination.state || destination.province}`;

    try {
      // Try Routes API first (newer, more accurate)
      const routesResponse = await axios.post(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        {
          origin: {
            address: originStr
          },
          destination: {
            address: destinationStr
          },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
          units: 'IMPERIAL',
          routeModifiers: {
            avoidTolls: true,
            avoidHighways: false,
            avoidFerries: false
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
          }
        }
      );

      if (routesResponse.data.routes && routesResponse.data.routes.length > 0) {
        const route = routesResponse.data.routes[0];
        const distanceMeters = route.distanceMeters;
        const duration = route.duration;

        // Convert meters to miles
        const distanceInMiles = Math.round(distanceMeters * 0.000621371);

        return res.json({
          success: true,
          distance: distanceInMiles,
          distanceText: `${distanceInMiles} mi`,
          duration: duration,
          durationValue: parseInt(duration.replace('s', '')),
          apiUsed: 'Routes API'
        });
      } else {
        throw new Error('No routes found');
      }
    } catch (routesError) {
      console.log('Routes API failed, trying Distance Matrix API:', routesError.message);

      // Fallback to Distance Matrix API
      try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
          params: {
            origins: originStr,
            destinations: destinationStr,
            units: 'imperial',
            mode: 'driving',
            avoid: 'tolls',
            key: apiKey
          }
        });

        if (response.data.status === 'OK' &&
            response.data.rows[0] &&
            response.data.rows[0].elements[0] &&
            response.data.rows[0].elements[0].status === 'OK') {

          const element = response.data.rows[0].elements[0];
          const distanceText = element.distance.text;
          const distanceValue = element.distance.value;
          const durationText = element.duration.text;
          const durationValue = element.duration.value;

          const distanceInMiles = Math.round(distanceValue * 0.000621371);

          return res.json({
            success: true,
            distance: distanceInMiles,
            distanceText: distanceText,
            duration: durationText,
            durationValue: durationValue,
            apiUsed: 'Distance Matrix API'
          });
        } else {
          throw new Error('Unable to calculate distance via Google Maps');
        }
      } catch (fallbackError) {
        console.error('Both Routes API and Distance Matrix API failed:', fallbackError.message);
        return res.status(500).json({
          success: false,
          message: 'Google Maps API failed',
          fallback: true,
          error: fallbackError.message
        });
      }
    }
  } catch (error) {
    console.error('Maps API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      fallback: true,
      error: error.message
    });
  }
});

module.exports = router;