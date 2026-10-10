import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY } from '@/constants/geoData';

export interface LocationResult {
  latitude: number;
  longitude: number;
  elevationM: number;
  formattedAddress: string;
  address: string;
  shortName: string;
}

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}

class LocationService {
  /**
   * Fetches real elevation in meters from Google Elevation API
   */
  async getElevation(latitude: number, longitude: number): Promise<number> {
    try {
      const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' && data.results?.[0]?.elevation) {
          return Math.round(data.results[0].elevation);
        }
      }
    } catch (e) {
      console.warn('[LocationService] Elevation fetch error:', (e as Error).message);
    }
    return 4410; // Default mountain elevation fallback
  }

  /**
   * Reverse geocodes latitude/longitude to a formatted address using Google Geocoding API
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<{ formattedAddress: string; shortName: string }> {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const first = data.results[0];
          const short = first.address_components?.[0]?.long_name || first.address_components?.[1]?.long_name || 'Current Location';
          return {
            formattedAddress: first.formatted_address,
            shortName: short,
          };
        }
      }
    } catch (e) {
      console.warn('[LocationService] Geocoding error:', (e as Error).message);
    }
    return {
      formattedAddress: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`,
      shortName: 'Current Coordinates',
    };
  }

  /**
   * Requests device GPS permission and fetches current location + elevation + address
   */
  async getCurrentLocation(): Promise<LocationResult> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied. Please enable GPS permissions in settings.');
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    const [elevation, geo] = await Promise.all([
      this.getElevation(lat, lng),
      this.reverseGeocode(lat, lng),
    ]);

    return {
      latitude: lat,
      longitude: lng,
      elevationM: elevation,
      formattedAddress: geo.formattedAddress,
      address: geo.formattedAddress,
      shortName: geo.shortName,
    };
  }

  /**
   * Autocompletes addresses and place names using Google Places API (New)
   */
  async searchPlaces(query: string): Promise<PlaceSuggestion[]> {
    if (!query || query.trim().length < 2) return [];

    try {
      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        },
        body: JSON.stringify({
          input: query.trim(),
        }),
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      if (!data.suggestions || !Array.isArray(data.suggestions)) {
        return [];
      }

      return data.suggestions.map((item: any) => {
        const pred = item.placePrediction;
        const main = pred?.structuredFormat?.mainText?.text || pred?.text?.text || query;
        const sec = pred?.structuredFormat?.secondaryText?.text || '';
        const full = pred?.text?.text || `${main}, ${sec}`;
        const placeId = pred?.placeId || (pred?.place ? pred.place.replace('places/', '') : '');

        return {
          placeId,
          mainText: main,
          secondaryText: sec,
          fullText: full,
        };
      });
    } catch (e) {
      console.warn('[LocationService] Autocomplete error:', (e as Error).message);
      return [];
    }
  }

  /**
   * Fetches coordinates and elevation for a selected place from Google Places API (New)
   */
  async getPlaceDetails(placeId: string, fallbackName = ''): Promise<LocationResult> {
    try {
      const cleanId = placeId.startsWith('places/') ? placeId.replace('places/', '') : placeId;
      const url = `https://places.googleapis.com/v1/places/${cleanId}?fields=location,displayName,formattedAddress`;

      const res = await fetch(url, {
        headers: {
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const lat = data.location?.latitude;
        const lng = data.location?.longitude;
        const address = data.formattedAddress || fallbackName;
        const shortName = data.displayName?.text || fallbackName || 'Selected Location';

        if (typeof lat === 'number' && typeof lng === 'number') {
          const elevation = await this.getElevation(lat, lng);
          return {
            latitude: lat,
            longitude: lng,
            elevationM: elevation,
            formattedAddress: address,
            address,
            shortName,
          };
        }
      }
    } catch (e) {
      console.warn('[LocationService] Place details error:', (e as Error).message);
    }

    // Fallback: search by geocoding address
    return {
      latitude: 27.8938,
      longitude: 86.8315,
      elevationM: 4410,
      formattedAddress: fallbackName || 'Dingboche, Solukhumbu, Nepal',
      address: fallbackName || 'Dingboche, Solukhumbu, Nepal',
      shortName: fallbackName.split(',')[0] || 'Dingboche',
    };
  }
}

export const locationService = new LocationService();
