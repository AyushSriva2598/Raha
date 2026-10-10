import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/tokens';
import { SafePoint } from '@/types';
import {
  DINGBOCHE_COORDINATES,
  HAZARD_INUNDATION_GEOJSON,
  SAFE_ESCAPE_ROUTE_GEOJSON,
  GOOGLE_MAPS_API_KEY,
} from '@/constants/geoData';

interface HazardMapCanvasProps {
  mode: 'EVACUATE' | 'NAVIGATE';
  targetPerson: 'ME' | 'OTHER';
  selectedSafePoint: SafePoint | null;
  onSelectSafePoint: (safePoint: SafePoint) => void;
  safePoints: SafePoint[];
}

declare global {
  interface Window {
    google?: any;
    initGoogleMaps?: () => void;
  }
}

export function HazardMapCanvas({
  mode,
  targetPerson,
  selectedSafePoint,
  onSelectSafePoint,
  safePoints,
}: HazardMapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapType, setMapType] = useState<'terrain' | 'hybrid'>('terrain');

  useEffect(() => {
    // Dynamically inject Google Maps JS script
    const loadGoogleMaps = () => {
      if (window.google?.maps) {
        initMap();
        return;
      }

      const existingScript = document.getElementById('google-maps-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => initMap();
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', () => initMap());
      }
    };

    const initMap = () => {
      if (!mapContainerRef.current || !window.google?.maps) return;

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: DINGBOCHE_COORDINATES[1], lng: DINGBOCHE_COORDINATES[0] },
        zoom: 14,
        mapTypeId: 'terrain',
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
      });

      googleMapRef.current = map;

      // 1. Hazard Inundation Polygon
      const polygonCoords = (
        HAZARD_INUNDATION_GEOJSON.features[0].geometry as any
      ).coordinates[0].map(([lng, lat]: [number, number]) => ({ lat, lng }));

      new window.google.maps.Polygon({
        paths: polygonCoords,
        strokeColor: Colors.alarmRed,
        strokeOpacity: 0.9,
        strokeWeight: 2.5,
        fillColor: Colors.alarmRed,
        fillOpacity: mode === 'EVACUATE' ? 0.35 : 0.2,
        map,
      });

      // 2. Escape Ridge Route Polyline
      const routeCoords = (
        SAFE_ESCAPE_ROUTE_GEOJSON.features[0].geometry as any
      ).coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));

      // White casing
      new window.google.maps.Polyline({
        path: routeCoords,
        strokeColor: '#FFFFFF',
        strokeOpacity: 0.95,
        strokeWeight: 8,
        map,
      });

      // Active teal route
      new window.google.maps.Polyline({
        path: routeCoords,
        strokeColor: Colors.cirqueTeal,
        strokeOpacity: 1.0,
        strokeWeight: 4.5,
        map,
      });

      // 3. User Marker
      new window.google.maps.Marker({
        position: { lat: DINGBOCHE_COORDINATES[1], lng: DINGBOCHE_COORDINATES[0] },
        map,
        title: targetPerson === 'ME' ? 'You • Dingboche (4,410m)' : 'Meena • Dingboche',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: Colors.meltwater,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
      });

      // 4. Safe Point Markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      safePoints.forEach((sp) => {
        const marker = new window.google.maps.Marker({
          position: { lat: sp.coordinates.latitude, lng: sp.coordinates.longitude },
          map,
          title: `${sp.name} (+${sp.elevationGainM}m)`,
          icon: {
            path: 'M 0,-14 L 12,10 L -12,10 Z',
            scale: 0.9,
            fillColor: Colors.cirqueTeal,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
        });

        marker.addListener('click', () => {
          onSelectSafePoint(sp);
        });

        markersRef.current.push(marker);
      });
    };

    loadGoogleMaps();
  }, [mode, targetPerson]);

  // Center on safe point when selected
  useEffect(() => {
    if (selectedSafePoint && googleMapRef.current && window.google?.maps) {
      googleMapRef.current.panTo({
        lat: selectedSafePoint.coordinates.latitude,
        lng: selectedSafePoint.coordinates.longitude,
      });
      googleMapRef.current.setZoom(15);
    }
  }, [selectedSafePoint]);

  // Switch map type
  const handleMapTypeChange = (type: 'terrain' | 'hybrid') => {
    setMapType(type);
    if (googleMapRef.current && window.google?.maps) {
      googleMapRef.current.setMapTypeId(type);
    }
  };

  return (
    <View style={styles.container}>
      {/* HTML container for Google Maps */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Layer switch buttons */}
      <View style={styles.layerSwitcher}>
        <TouchableOpacity
          style={[styles.layerButton, mapType === 'terrain' && styles.layerButtonActive]}
          onPress={() => handleMapTypeChange('terrain')}>
          <Text style={[styles.layerButtonText, mapType === 'terrain' && styles.layerButtonTextActive]}>
            🏔️ Terrain
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layerButton, mapType === 'hybrid' && styles.layerButtonActive]}
          onPress={() => handleMapTypeChange('hybrid')}>
          <Text style={[styles.layerButtonText, mapType === 'hybrid' && styles.layerButtonTextActive]}>
            🛰️ Satellite
          </Text>
        </TouchableOpacity>
      </View>

      {/* Google Maps Attribution Badge */}
      <View style={styles.poweredByBadge}>
        <Text style={styles.poweredByText}>Google Maps API Connected</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 480,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0F1A24',
    overflow: 'hidden',
  },
  layerSwitcher: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    backgroundColor: 'rgba(14, 24, 37, 0.88)',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 30,
  },
  layerButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  layerButtonActive: {
    backgroundColor: Colors.meltwater,
  },
  layerButtonText: {
    color: '#D8EAFF',
    fontSize: 11,
    fontWeight: '600',
  },
  layerButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  poweredByBadge: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    backgroundColor: 'rgba(14, 24, 37, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 30,
  },
  poweredByText: {
    color: '#9ACBE8',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
