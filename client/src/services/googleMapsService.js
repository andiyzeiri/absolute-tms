import axios from 'axios';

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  // Check if API key is configured
  isConfigured() {
    return this.apiKey && this.apiKey !== 'your_google_maps_api_key_here';
  }

  // Calculate driving distance between two locations using Routes API
  async calculateDrivingDistance(origin, destination) {
    if (!this.isConfigured()) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const originStr = `${origin.city}, ${origin.state || origin.province}`;
      const destinationStr = `${destination.city}, ${destination.state || destination.province}`;

      // Try the newer Routes API first
      const routesResponse = await axios.post(
        `https://routes.googleapis.com/directions/v2:computeRoutes`,
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
            'X-Goog-Api-Key': this.apiKey,
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

        return {
          distance: distanceInMiles,
          distanceText: `${distanceInMiles} mi`,
          duration: duration,
          durationValue: parseInt(duration.replace('s', ''))
        };
      } else {
        throw new Error('No routes found');
      }
    } catch (error) {
      console.error('Routes API failed, trying Distance Matrix API:', error);

      // Fallback to Distance Matrix API
      try {
        const originStr = `${origin.city}, ${origin.state || origin.province}`;
        const destinationStr = `${destination.city}, ${destination.state || destination.province}`;

        const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
          params: {
            origins: originStr,
            destinations: destinationStr,
            units: 'imperial',
            mode: 'driving',
            avoid: 'tolls',
            key: this.apiKey
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

          return {
            distance: distanceInMiles,
            distanceText: distanceText,
            duration: durationText,
            durationValue: durationValue
          };
        } else {
          throw new Error('Unable to calculate distance via Google Maps');
        }
      } catch (fallbackError) {
        console.error('Both Routes API and Distance Matrix API failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  // Geocode an address to get coordinates
  async geocodeAddress(address) {
    if (!this.isConfigured()) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: address,
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formattedAddress: result.formatted_address
        };
      } else {
        throw new Error('Unable to geocode address');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  // Get optimized route for multiple waypoints (useful for multi-stop loads)
  async getOptimizedRoute(waypoints) {
    if (!this.isConfigured()) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const origin = waypoints[0];
      const destination = waypoints[waypoints.length - 1];
      const waypointsStr = waypoints.slice(1, -1).map(wp => `${wp.city}, ${wp.province}`).join('|');

      const params = {
        origin: `${origin.city}, ${origin.province}`,
        destination: `${destination.city}, ${destination.province}`,
        mode: 'driving',
        avoid: 'tolls',
        optimize: 'true',
        key: this.apiKey
      };

      if (waypointsStr) {
        params.waypoints = `optimize:true|${waypointsStr}`;
      }

      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: params
      });

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];

        return {
          distance: Math.round(leg.distance.value * 0.000621371), // Convert to miles
          duration: leg.duration.text,
          optimizedOrder: response.data.routes[0].waypoint_order || []
        };
      } else {
        throw new Error('Unable to calculate optimized route');
      }
    } catch (error) {
      console.error('Route optimization error:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const googleMapsService = new GoogleMapsService();
export default googleMapsService;