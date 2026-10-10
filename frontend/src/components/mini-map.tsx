import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polygon } from 'react-native-maps';
import { Colors, Radii, Shadows } from '@/constants/tokens';
import { Maximize2 } from 'lucide-react-native';
import { router } from 'expo-router';
import {
  DINGBOCHE_COORDINATES,
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
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/map' as any);
    }
  };

  const hazardCoords = useMemo(() => {
    const feature = HAZARD_INUNDATION_GEOJSON.features[0];
    if (feature && feature.geometry.type === 'Polygon') {
      const ring = feature.geometry.coordinates[0] as [number, number][];
      return ring.map(([lng, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      }));
    }
    return [];
  }, []);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}>
      {/* Real Native MapView Thumbnail powered by Google Maps */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: DINGBOCHE_COORDINATES[1],
            longitude: DINGBOCHE_COORDINATES[0],
            latitudeDelta: 0.045,
            longitudeDelta: 0.045,
          }}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          mapType="terrain">

          {hazardCoords.length > 0 && (
            <Polygon
              coordinates={hazardCoords}
              strokeColor={Colors.warning}
              strokeWidth={2}
              fillColor="rgba(245, 158, 11, 0.35)"
              zIndex={2}
            />
          )}

          <Marker
            coordinate={{
              latitude: DINGBOCHE_COORDINATES[1],
              longitude: DINGBOCHE_COORDINATES[0],
            }}
            zIndex={10}>
            <View style={styles.miniUserPin} />
          </Marker>
        </MapView>
      </View>

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
  miniUserPin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.meltwater,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    elevation: 4,
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
