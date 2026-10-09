import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
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
  const webViewRef = useRef<WebView>(null);

  // Generate self-contained MapLibre HTML page
  const htmlContent = useMemo(() => {
    const inundationJson = JSON.stringify(HAZARD_INUNDATION_GEOJSON);
    const escapeRouteJson = JSON.stringify(SAFE_ESCAPE_ROUTE_GEOJSON);
    const safePointsJson = JSON.stringify(safePoints);
    const userLabel = targetPerson === 'ME' ? 'You • Dingboche (4,410m)' : 'Meena • Dingboche (4,410m)';
    const initialOpacity = mode === 'EVACUATE' ? 0.35 : 0.2;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Raha Hazard Map</title>
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
  <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0F1A24; overflow: hidden; }
    .raha-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      -webkit-user-select: none;
      user-select: none;
    }
    .user-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: ${Colors.meltwater};
      border: 3px solid #FFFFFF;
      box-shadow: 0 0 10px rgba(32,138,239,0.8);
    }
    .user-pill {
      background: rgba(14,24,37,0.85);
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 12px;
      margin-top: 4px;
      border: 1px solid rgba(255,255,255,0.2);
      white-space: nowrap;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .sp-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #0F6CBD;
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-weight: bold;
      font-size: 12px;
      transition: transform 0.2s ease, background-color 0.2s ease;
    }
    .sp-badge.selected {
      background: ${Colors.cirqueTeal};
      transform: scale(1.18);
    }
    .sp-pill {
      background: rgba(14,24,37,0.9);
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 8px;
      margin-top: 4px;
      border: 1px solid #0F6CBD;
      white-space: nowrap;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .sp-pill.selected {
      border-color: ${Colors.cirqueTeal};
    }
    .maplibregl-ctrl-bottom-right {
      bottom: 24px;
      right: 12px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const safePoints = ${safePointsJson};
    const centerCoords = [${DINGBOCHE_COORDINATES[0]}, ${DINGBOCHE_COORDINATES[1]}];
    let selectedPointId = ${selectedSafePoint ? JSON.stringify(selectedSafePoint.pointId) : 'null'};
    const spMarkers = {};

    const map = new maplibregl.Map({
      container: 'map',
      style: '${MAP_CONFIG.styleUrl}',
      center: centerCoords,
      zoom: ${MAP_CONFIG.defaultZoom},
      pitch: 45,
      bearing: 15,
      attributionControl: false
    });

    window.map = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    map.on('load', function() {
      // 1. Hazard Inundation Corridor
      map.addSource('hazard-inundation', {
        type: 'geojson',
        data: ${inundationJson}
      });

      map.addLayer({
        id: 'hazard-inundation-fill',
        type: 'fill',
        source: 'hazard-inundation',
        paint: {
          'fill-color': '${Colors.alarmRed}',
          'fill-opacity': ${initialOpacity}
        }
      });

      map.addLayer({
        id: 'hazard-inundation-line',
        type: 'line',
        source: 'hazard-inundation',
        paint: {
          'line-color': '${Colors.alarmRed}',
          'line-width': 2.5,
          'line-dasharray': [3, 2]
        }
      });

      // 2. Safe Evacuation Escape Route
      map.addSource('safe-escape-route', {
        type: 'geojson',
        data: ${escapeRouteJson}
      });

      map.addLayer({
        id: 'safe-route-casing',
        type: 'line',
        source: 'safe-escape-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 8
        }
      });

      map.addLayer({
        id: 'safe-route-line',
        type: 'line',
        source: 'safe-escape-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '${Colors.cirqueTeal}',
          'line-width': 4.5
        }
      });

      // 3. User Location Marker
      const userEl = document.createElement('div');
      userEl.className = 'raha-marker';
      userEl.innerHTML = '<div class="user-dot"></div><div class="user-pill">${userLabel}</div>';
      new maplibregl.Marker({ element: userEl })
        .setLngLat(centerCoords)
        .addTo(map);

      // 4. Safe Point Markers
      safePoints.forEach(function(sp) {
        const el = document.createElement('div');
        el.className = 'raha-marker';
        const isSel = selectedPointId === sp.pointId;
        el.innerHTML = '<div class="sp-badge ' + (isSel ? 'selected' : '') + '">▲</div>' +
          '<div class="sp-pill ' + (isSel ? 'selected' : '') + '">' + sp.name + ' (+' + sp.elevationGainM + 'm)</div>';

        el.addEventListener('click', function() {
          selectPoint(sp.pointId);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SELECT_SAFE_POINT',
              pointId: sp.pointId
            }));
          }
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([sp.coordinates.longitude, sp.coordinates.latitude])
          .addTo(map);

        spMarkers[sp.pointId] = { marker: marker, el: el, sp: sp };
      });
    });

    function selectPoint(pointId) {
      selectedPointId = pointId;
      Object.keys(spMarkers).forEach(function(id) {
        const item = spMarkers[id];
        const isSel = id === pointId;
        const badge = item.el.querySelector('.sp-badge');
        const pill = item.el.querySelector('.sp-pill');
        if (badge) badge.className = 'sp-badge ' + (isSel ? 'selected' : '');
        if (pill) pill.className = 'sp-pill ' + (isSel ? 'selected' : '');
      });
      if (spMarkers[pointId]) {
        const coords = [spMarkers[pointId].sp.coordinates.longitude, spMarkers[pointId].sp.coordinates.latitude];
        map.flyTo({ center: coords, zoom: 15.2, speed: 1.2 });
      }
    }

    window.selectSafePointExternal = function(pointId) {
      selectPoint(pointId);
    };

    window.updateMode = function(newMode) {
      if (map && map.getLayer('hazard-inundation-fill')) {
        map.setPaintProperty('hazard-inundation-fill', 'fill-opacity', newMode === 'EVACUATE' ? 0.35 : 0.18);
      }
    };
  </script>
</body>
</html>`;
  }, [mode, targetPerson, safePoints, selectedSafePoint]);

  // When selectedSafePoint changes from React Native props, sync into WebView
  useEffect(() => {
    if (!selectedSafePoint) return;
    const js = `window.selectSafePointExternal && window.selectSafePointExternal(${JSON.stringify(selectedSafePoint.pointId)}); true;`;
    webViewRef.current?.injectJavaScript(js);
  }, [selectedSafePoint]);

  // When mode changes, sync into WebView
  useEffect(() => {
    const js = `window.updateMode && window.updateMode(${JSON.stringify(mode)}); true;`;
    webViewRef.current?.injectJavaScript(js);
  }, [mode]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_SAFE_POINT') {
        const sp = safePoints.find((p) => p.pointId === data.pointId);
        if (sp) {
          onSelectSafePoint(sp);
        }
      }
    } catch {
      // Ignore parse errors
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        containerStyle={styles.webViewContainer}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.cirqueTeal} />
          </View>
        )}
        scalesPageToFit={Platform.OS === 'android'}
        scrollEnabled={false}
        overScrollMode="never"
        bounces={false}
      />
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
  webViewContainer: {
    backgroundColor: '#0F1A24',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0F1A24',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1A24',
  },
});
