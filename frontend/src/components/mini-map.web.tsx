import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Radii, Shadows } from '@/constants/tokens';
import { Maximize2 } from 'lucide-react-native';
import { router } from 'expo-router';
import {
  DINGBOCHE_COORDINATES,
  HAZARD_INUNDATION_GEOJSON,
  GOOGLE_MAPS_API_KEY,
} from '@/constants/geoData';

interface MiniMapCardProps {
  onPress?: () => void;
  basinTitle?: string;
  userLocationText?: string;
  lakeDistText?: string;
}

export function MiniMapCard({
  onPress,
  basinTitle = 'Basin Hydrology View',
  userLocationText = 'You • Dingboche (4,410m)',
  lakeDistText = 'Lake dist: 7.2 km',
}: MiniMapCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/map' as any);
    }
  };

  useEffect(() => {
    const initGoogleMiniMap = () => {
      if (!containerRef.current || !window.google?.maps) return;

      const map = new window.google.maps.Map(containerRef.current, {
        center: { lat: DINGBOCHE_COORDINATES[1], lng: DINGBOCHE_COORDINATES[0] },
        zoom: 12.5,
        mapTypeId: 'terrain',
        disableDefaultUI: true,
        gestureHandling: 'none',
        keyboardShortcuts: false,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
      });

      mapRef.current = map;

      // Hazard Polygon Corridor
      const polygonCoords = (
        HAZARD_INUNDATION_GEOJSON.features[0].geometry as any
      ).coordinates[0].map(([lng, lat]: [number, number]) => ({ lat, lng }));

      new window.google.maps.Polygon({
        paths: polygonCoords,
        strokeColor: Colors.warning,
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: '#F59E0B',
        fillOpacity: 0.35,
        map,
      });

      // User pin
      new window.google.maps.Marker({
        position: { lat: DINGBOCHE_COORDINATES[1], lng: DINGBOCHE_COORDINATES[0] },
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: Colors.meltwater,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5,
        },
      });
    };

    if (window.google?.maps) {
      initGoogleMiniMap();
    } else {
      const existingScript = document.getElementById('google-maps-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => initGoogleMiniMap();
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', () => initGoogleMiniMap());
      }
    }
  }, []);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}>
      {/* Real Google Maps Container */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Header Info Overlay */}
      <View style={styles.headerRow} pointerEvents="none">
        <View style={styles.titleBadge}>
          <Text style={styles.basinTitleText}>{basinTitle}</Text>
        </View>
        <View style={styles.maximizeButton}>
          <Maximize2 size={13} color={Colors.moraineInk} />
          <Text style={styles.tapToExpandText}>Expand Map</Text>
        </View>
      </View>

      {/* Bottom Footer Info Pill */}
      <View style={styles.footerRow} pointerEvents="none">
        <View style={styles.userLocationPill}>
          <View style={styles.livePulseDot} />
          <Text style={styles.userLocationText}>{userLocationText}</Text>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceBadgeText}>{lakeDistText}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 180,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Shadows.sm,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  headerRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  titleBadge: {
    backgroundColor: 'rgba(15, 26, 36, 0.85)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  basinTitleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F0F9FF',
    letterSpacing: 0.2,
  },
  maximizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    ...Shadows.sm,
  },
  tapToExpandText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.moraineInk,
  },
  footerRow: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  userLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 26, 36, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.meltwater,
  },
  userLocationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  distanceBadge: {
    backgroundColor: 'rgba(15, 26, 36, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  distanceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ACBE8',
  },
});
