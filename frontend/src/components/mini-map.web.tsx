import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Colors, Radii, Spacing, Shadows } from '@/constants/tokens';
import { Maximize2 } from 'lucide-react-native';
import { router } from 'expo-router';
import {
  DINGBOCHE_COORDINATES,
  MAP_CONFIG,
  HAZARD_INUNDATION_GEOJSON,
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
  const mapRef = useRef<maplibregl.Map | null>(null);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/map' as any);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_CONFIG.styleUrl,
      center: DINGBOCHE_COORDINATES,
      zoom: 12.2,
      pitch: 35,
      interactive: false,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      map.addSource('hazard-mini', {
        type: 'geojson',
        data: HAZARD_INUNDATION_GEOJSON,
      });

      map.addLayer({
        id: 'hazard-mini-fill',
        type: 'fill',
        source: 'hazard-mini',
        paint: {
          'fill-color': Colors.warning,
          'fill-opacity': 0.35,
        },
      });

      // User pin
      const userEl = document.createElement('div');
      userEl.style.width = '14px';
      userEl.style.height = '14px';
      userEl.style.borderRadius = '50%';
      userEl.style.backgroundColor = Colors.meltwater;
      userEl.style.border = '2.5px solid #FFFFFF';
      userEl.style.boxShadow = '0 0 8px rgba(32,138,239,0.9)';

      new maplibregl.Marker({ element: userEl })
        .setLngLat(DINGBOCHE_COORDINATES)
        .addTo(map);
    });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}>
      {/* Real Mini Map Canvas */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </View>

      {/* Header Info Overlay */}
      <View style={styles.headerRow}>
        <View style={styles.titleBadge}>
          <Text style={styles.basinTitleText}>{basinTitle}</Text>
        </View>
        <View style={styles.maximizeButton}>
          <Maximize2 size={13} color={Colors.moraineInk} />
          <Text style={styles.tapToExpandText}>Expand Map</Text>
        </View>
      </View>

      {/* Bottom Footer Info Pill */}
      <View style={styles.footerRow}>
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
    borderWidth: 1.5,
    borderColor: 'rgba(205, 219, 228, 0.8)',
    position: 'relative',
    backgroundColor: '#0F1A24',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    ...Shadows.subtle,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  titleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.full,
    ...Shadows.subtle,
  },
  basinTitleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.moraineInk,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  maximizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.full,
    gap: 4,
    ...Shadows.subtle,
  },
  tapToExpandText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.moraineInk,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  userLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 24, 37, 0.9)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.full,
    gap: 6,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.cirqueTeal,
  },
  userLocationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  distanceBadge: {
    backgroundColor: 'rgba(14, 24, 37, 0.9)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
  },
});
