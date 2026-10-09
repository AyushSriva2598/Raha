import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Map,
  Camera,
  GeoJSONSource,
  Layer,
  Marker,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import { Colors } from '@/constants/tokens';
import { SafePoint } from '@/types';
import {
  DINGBOCHE_COORDINATES,
  MAP_CONFIG,
  HAZARD_INUNDATION_GEOJSON,
  SAFE_ESCAPE_ROUTE_GEOJSON,
} from '@/constants/geoData';

interface HazardMapCanvasProps {
  mode: 'EVACUATE' | 'NAVIGATE';
  targetPerson: 'ME' | 'OTHER';
  selectedSafePoint: SafePoint | null;
  onSelectSafePoint: (safePoint: SafePoint) => void;
  safePoints: SafePoint[];
}

export function HazardMapCanvas({
  mode,
  targetPerson,
  selectedSafePoint,
  onSelectSafePoint,
  safePoints,
}: HazardMapCanvasProps) {
  const cameraRef = useRef<CameraRef>(null);

  // Animate camera when selectedSafePoint changes
  useEffect(() => {
    if (selectedSafePoint && cameraRef.current) {
      cameraRef.current.easeTo({
        center: [
          selectedSafePoint.coordinates.longitude,
          selectedSafePoint.coordinates.latitude,
        ],
        zoom: 15.2,
        duration: 1000,
      });
    }
  }, [selectedSafePoint]);

  return (
    <View style={styles.container}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_CONFIG.styleUrl}>
        <Camera
          ref={cameraRef}
          center={DINGBOCHE_COORDINATES}
          zoom={MAP_CONFIG.defaultZoom}
          pitch={40}
        />

        {/* 1. GLOF Inundation Hazard Polygon Layer */}
        <GeoJSONSource id="hazard-inundation-source" data={HAZARD_INUNDATION_GEOJSON}>
          <Layer
            id="hazard-inundation-fill"
            type="fill"
            paint={{
              'fill-color': Colors.alarmRed,
              'fill-opacity': mode === 'EVACUATE' ? 0.35 : 0.2,
            }}
          />
          <Layer
            id="hazard-inundation-line"
            type="line"
            paint={{
              'line-color': Colors.alarmRed,
              'line-width': 2.5,
              'line-dasharray': [3, 2],
            }}
          />
        </GeoJSONSource>

        {/* 2. Safe Evacuation Escape Route Layer */}
        <GeoJSONSource id="safe-route-source" data={SAFE_ESCAPE_ROUTE_GEOJSON}>
          {/* White underlay for contrast */}
          <Layer
            id="safe-route-casing"
            type="line"
            layout={{
              'line-cap': 'round',
              'line-join': 'round',
            }}
            paint={{
              'line-color': '#FFFFFF',
              'line-width': 8,
            }}
          />
          {/* Active teal escape route */}
          <Layer
            id="safe-route-active"
            type="line"
            layout={{
              'line-cap': 'round',
              'line-join': 'round',
            }}
            paint={{
              'line-color': Colors.cirqueTeal,
              'line-width': 4.5,
            }}
          />
        </GeoJSONSource>

        {/* 3. User Location Marker */}
        <Marker id="user-location-pin" lngLat={DINGBOCHE_COORDINATES}>
          <View style={styles.userMarkerContainer}>
            <View style={styles.userMarkerRing} />
            <View style={styles.userMarkerDot} />
            <View style={styles.userBadge}>
              <Text style={styles.userBadgeText}>
                {targetPerson === 'ME'
                  ? 'You • Dingboche (4,410m)'
                  : 'Meena • Dingboche (4,410m)'}
              </Text>
            </View>
          </View>
        </Marker>

        {/* 4. Safe Shelters High Ground Markers */}
        {safePoints.map((sp) => {
          const isSelected = selectedSafePoint?.pointId === sp.pointId;
          const badgeBg = isSelected ? Colors.cirqueTeal : '#0F6CBD';

          return (
            <Marker
              key={sp.pointId}
              id={`safepoint-${sp.pointId}`}
              lngLat={[sp.coordinates.longitude, sp.coordinates.latitude]}>
              <Pressable
                style={styles.shelterMarkerContainer}
                onPress={() => onSelectSafePoint(sp)}>
                <View
                  style={[
                    styles.shelterIcon,
                    { backgroundColor: badgeBg },
                    isSelected && styles.shelterIconSelected,
                  ]}>
                  <Text style={styles.shelterIconText}>▲</Text>
                </View>
                <View style={[styles.shelterBadge, { borderColor: badgeBg }]}>
                  <Text style={styles.shelterBadgeText}>
                    {sp.name} (+{sp.elevationGainM}m)
                  </Text>
                </View>
              </Pressable>
            </Marker>
          );
        })}
      </Map>
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
  userMarkerContainer: {
    alignItems: 'center',
  },
  userMarkerRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(32, 138, 239, 0.3)',
  },
  userMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.meltwater,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginTop: 6,
  },
  userBadge: {
    backgroundColor: 'rgba(14, 24, 37, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 4,
  },
  userBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  shelterMarkerContainer: {
    alignItems: 'center',
  },
  shelterIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  shelterIconSelected: {
    transform: [{ scale: 1.2 }],
    borderColor: '#FFFFFF',
  },
  shelterIconText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  shelterBadge: {
    backgroundColor: 'rgba(14, 24, 37, 0.94)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 3,
  },
  shelterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
