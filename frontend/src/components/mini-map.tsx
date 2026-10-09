import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
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
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/map' as any);
    }
  };

  const miniHtml = useMemo(() => {
    const inundationJson = JSON.stringify(HAZARD_INUNDATION_GEOJSON);
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
  <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0F1A24; overflow: hidden; }
    .mini-user-pin {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: ${Colors.meltwater};
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 0 8px rgba(32,138,239,0.9);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const m = new maplibregl.Map({
      container: 'map',
      style: '${MAP_CONFIG.styleUrl}',
      center: [${DINGBOCHE_COORDINATES[0]}, ${DINGBOCHE_COORDINATES[1]}],
      zoom: 12.2,
      pitch: 35,
      interactive: false,
      attributionControl: false
    });
    m.on('load', function() {
      m.addSource('hazard-mini-source', {
        type: 'geojson',
        data: ${inundationJson}
      });
      m.addLayer({
        id: 'hazard-mini-fill',
        type: 'fill',
        source: 'hazard-mini-source',
        paint: {
          'fill-color': '${Colors.warning}',
          'fill-opacity': 0.35
        }
      });
      const el = document.createElement('div');
      el.className = 'mini-user-pin';
      new maplibregl.Marker({ element: el })
        .setLngLat([${DINGBOCHE_COORDINATES[0]}, ${DINGBOCHE_COORDINATES[1]}])
        .addTo(m);
    });
  </script>
</body>
</html>`;
  }, []);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}>
      {/* Real MapLibre Mini Map Canvas via WebView */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <WebView
          originWhitelist={['*']}
          source={{ html: miniHtml }}
          style={styles.webView}
          scrollEnabled={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          overScrollMode="never"
        />
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
    borderWidth: 1.5,
    borderColor: 'rgba(205, 219, 228, 0.8)',
    position: 'relative',
    backgroundColor: '#0F1A24',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    ...Shadows.subtle,
  },
  webView: {
    flex: 1,
    backgroundColor: '#0F1A24',
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
