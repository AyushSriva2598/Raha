import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize MapLibre GL instance
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_CONFIG.styleUrl,
      center: DINGBOCHE_COORDINATES,
      zoom: MAP_CONFIG.defaultZoom,
      pitch: 45, // 3D mountain topography pitch
      bearing: 15,
      attributionControl: false,
    });

    mapRef.current = map;

    // Add navigation controls (Zoom + 3D Compass)
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    map.on('load', () => {
      // 1. Add GLOF Inundation Hazard Polygon Layer
      map.addSource('hazard-inundation', {
        type: 'geojson',
        data: HAZARD_INUNDATION_GEOJSON,
      });

      map.addLayer({
        id: 'hazard-inundation-fill',
        type: 'fill',
        source: 'hazard-inundation',
        paint: {
          'fill-color': Colors.alarmRed,
          'fill-opacity': 0.25,
        },
      });

      map.addLayer({
        id: 'hazard-inundation-line',
        type: 'line',
        source: 'hazard-inundation',
        paint: {
          'line-color': Colors.alarmRed,
          'line-width': 2.5,
          'line-dasharray': [3, 2],
        },
      });

      // 2. Add Safe Evacuation Escape Route Layer
      map.addSource('safe-escape-route', {
        type: 'geojson',
        data: SAFE_ESCAPE_ROUTE_GEOJSON,
      });

      // White underlay casing for high visibility over mountain terrain
      map.addLayer({
        id: 'safe-route-casing',
        type: 'line',
        source: 'safe-escape-route',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 8,
        },
      });

      // Active teal escape line
      map.addLayer({
        id: 'safe-route-line',
        type: 'line',
        source: 'safe-escape-route',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': Colors.cirqueTeal,
          'line-width': 4.5,
        },
      });
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
    };
  }, []);

  // Update Hazard Inundation style when mode changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getLayer('hazard-inundation-fill')) return;

    map.setPaintProperty(
      'hazard-inundation-fill',
      'fill-opacity',
      mode === 'EVACUATE' ? 0.35 : 0.18
    );
  }, [mode]);

  // Update Markers (Resident + Safe Shelters)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 1. User Location Marker
    const userEl = document.createElement('div');
    userEl.className = 'raha-user-marker';
    userEl.style.display = 'flex';
    userEl.style.flexDirection = 'column';
    userEl.style.alignItems = 'center';
    userEl.style.cursor = 'pointer';
    userEl.innerHTML = `
      <div style="background-color: ${Colors.meltwater}; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 0 10px rgba(32,138,239,0.8);"></div>
      <div style="background: rgba(14,24,37,0.85); color: #FFFFFF; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 12px; margin-top: 4px; border: 1px solid rgba(255,255,255,0.2); white-space: nowrap;">
        ${targetPerson === 'ME' ? 'You • Dingboche (4,410m)' : 'Meena • Dingboche (4,410m)'}
      </div>
    `;

    const userMarker = new maplibregl.Marker({ element: userEl })
      .setLngLat(DINGBOCHE_COORDINATES)
      .addTo(map);
    markersRef.current.push(userMarker);

    // 2. Safe Point Markers
    safePoints.forEach((sp) => {
      const isSelected = selectedSafePoint?.pointId === sp.pointId;
      const el = document.createElement('div');
      el.className = 'raha-safepoint-marker';
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.alignItems = 'center';
      el.style.cursor = 'pointer';

      const badgeColor = isSelected ? Colors.cirqueTeal : '#0F6CBD';
      const scale = isSelected ? 'scale(1.15)' : 'scale(1.0)';

      el.innerHTML = `
        <div style="transform: ${scale}; transition: transform 0.2s ease; background-color: ${badgeColor}; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: bold; font-size: 12px;">
          ▲
        </div>
        <div style="background: rgba(14,24,37,0.9); color: #FFFFFF; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 8px; margin-top: 4px; border: 1px solid ${badgeColor}; white-space: nowrap;">
          ${sp.name} (+${sp.elevationGainM}m)
        </div>
      `;

      el.addEventListener('click', () => {
        onSelectSafePoint(sp);
        map.flyTo({
          center: [sp.coordinates.longitude, sp.coordinates.latitude],
          zoom: 15.2,
          speed: 1.2,
        });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([sp.coordinates.longitude, sp.coordinates.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [safePoints, selectedSafePoint, targetPerson, onSelectSafePoint]);

  // Fly to selected safe point when selection changes externally
  useEffect(() => {
    if (!mapRef.current || !selectedSafePoint) return;
    mapRef.current.flyTo({
      center: [selectedSafePoint.coordinates.longitude, selectedSafePoint.coordinates.latitude],
      zoom: 15,
      speed: 1.2,
    });
  }, [selectedSafePoint]);

  return (
    <View style={styles.container}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
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
});
