import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Radii, Shadows, Spacing } from '@/constants/tokens';
import { SafePoint } from '@/types';
import { ShieldCheck, Cross, Compass, Navigation, Mountain } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = 460;

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
  const isNavigateMode = mode === 'NAVIGATE';
  const primarySafePoint = selectedSafePoint || safePoints[0];

  const isOther = targetPerson === 'OTHER';
  // Coordinates based on who is selected
  const userPinX = isOther ? 130 : 96;
  const userPinY = isOther ? 320 : 260;

  return (
    <View style={styles.container}>
      {/* SVG Cartographic Layer */}
      <Svg
        width={SCREEN_WIDTH}
        height={MAP_HEIGHT}
        viewBox="0 0 390 540"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="floodGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Colors.warning} stopOpacity={0.18} />
            <Stop offset="1" stopColor={Colors.alarmRed} stopOpacity={0.24} />
          </LinearGradient>
          <LinearGradient id="safeRouteGrad" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={Colors.cirqueTeal} />
            <Stop offset="1" stopColor="#1EAF9D" />
          </LinearGradient>
        </Defs>

        {/* Topographic Contour Lines - fill="none" prevents black fills */}
        <G stroke="#CDDBE4" strokeWidth={1.5} strokeDasharray="4 4" fill="none">
          <Path d="M -50 180 Q 90 200 210 160 T 450 200" fill="none" />
          <Path d="M -50 240 Q 120 270 240 220 T 450 260" fill="none" />
          <Path d="M -50 310 Q 80 340 220 280 T 450 330" fill="none" />
          <Path d="M -50 110 Q 140 140 270 90 T 450 130" fill="none" />
          <Path d="M -50 400 Q 110 430 250 380 T 450 420" fill="none" />
          <Path d="M -50 480 Q 130 500 260 450 T 450 490" fill="none" />
        </G>

        {/* Dudh Koshi River Trunk Bed */}
        <Path
          d="M 60 550 C 90 440, 110 370, 140 310 C 170 250, 205 180, 240 70 C 255 20, 260 -10, 265 -50"
          stroke={Colors.mapWater}
          strokeWidth={28}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M 60 550 C 90 440, 110 370, 140 310 C 170 250, 205 180, 240 70 C 255 20, 260 -10, 265 -50"
          stroke="#70B2DC"
          strokeWidth={8}
          strokeLinecap="round"
          fill="none"
        />

        {/* River Water Ripple accents */}
        <Path d="M 125 330 Q 130 315 135 305" stroke="#FFFFFF" strokeWidth={2} opacity={0.8} fill="none" />
        <Path d="M 180 230 Q 185 215 190 205" stroke="#FFFFFF" strokeWidth={2} opacity={0.8} fill="none" />
        <Path d="M 230 110 Q 234 98 237 90" stroke="#FFFFFF" strokeWidth={2} opacity={0.8} fill="none" />

        {/* GLOF Hazard Flood Inundation Buffer Zone */}
        <Path
          d="M 20 550 C 60 430, 80 370, 105 310 C 135 240, 165 170, 205 60 C 220 20, 230 -20, 235 -50 L 300 -50 C 290 20, 275 90, 245 190 C 215 280, 180 340, 155 420 C 130 480, 115 520, 105 550 Z"
          fill="url(#floodGrad)"
        />

        {/* Hazard Perimeter Casing (Dashed Alarm Red) */}
        <Path
          d="M 105 310 C 135 240, 165 170, 205 60"
          stroke={Colors.alarmRed}
          strokeWidth={1.8}
          strokeDasharray="5 4"
          opacity={0.7}
          fill="none"
        />

        {/* Safe Evacuation Route Casing (White Underlay 10pt) */}
        <Path
          d={
            isOther
              ? 'M 140 330 C 160 300, 190 290, 220 250 C 250 210, 280 180, 310 120'
              : 'M 108 270 C 125 250, 160 260, 195 240 C 230 220, 265 195, 305 110'
          }
          stroke="#FFFFFF"
          strokeWidth={10}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Safe Evacuation Route Active Line (Cirque Teal 6pt) */}
        <Path
          d={
            isOther
              ? 'M 140 330 C 160 300, 190 290, 220 250 C 250 210, 280 180, 310 120'
              : 'M 108 270 C 125 250, 160 260, 195 240 C 230 220, 265 195, 305 110'
          }
          stroke={isNavigateMode ? Colors.meltwater : 'url(#safeRouteGrad)'}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Waypoint Markers along Safe Ridge */}
        <Circle cx={195} cy={240} r={3.5} fill="#FFFFFF" />
        <Circle cx={265} cy={195} r={3.5} fill="#FFFFFF" />
      </Svg>

      {/* River Annotation */}
      <View style={styles.riverLabelContainer}>
        <Text style={styles.riverLabelText}>Dudh Koshi River ➔</Text>
      </View>

      {/* Live User Pin */}
      <View style={[styles.userPin, { left: userPinX, top: userPinY }]}>
        <View style={styles.userPinRing} />
        <View style={styles.userPinDot} />
        <View style={styles.userPinBadge}>
          <Text style={styles.userPinText}>
            {targetPerson === 'ME' ? 'You are here (2,680m)' : 'Meena (2,710m)'}
          </Text>
        </View>
      </View>

      {/* Destination Marker 1: Namche Health Post Safe Point */}
      <Pressable
        style={styles.destinationPin}
        onPress={() => safePoints[0] && onSelectSafePoint(safePoints[0])}>
        <View
          style={[
            styles.destinationIconCircle,
            primarySafePoint?.pointId === safePoints[0]?.pointId &&
              styles.selectedPinCircle,
          ]}>
          <Cross size={18} color="#FFFFFF" strokeWidth={3} />
        </View>
        <View style={styles.destinationPointer} />

        {/* Floating Dossier Label */}
        <View style={styles.destinationCard}>
          <Text style={styles.destinationCardTitle} numberOfLines={1}>
            Namche Health Post
          </Text>
          <View style={styles.destinationCardRow}>
            <ShieldCheck size={12} color={Colors.cirqueTeal} />
            <Text style={styles.destinationCardSub}>Safe Point • +210m</Text>
          </View>
          <Text style={styles.destinationCardWalk}>42 min uphill</Text>
        </View>
      </Pressable>

      {/* Destination Marker 2: Dingboche Upper Ridge Gompa */}
      {safePoints[1] && (
        <Pressable
          style={styles.secondaryPin}
          onPress={() => onSelectSafePoint(safePoints[1])}>
          <View
            style={[
              styles.secondaryIconCircle,
              primarySafePoint?.pointId === safePoints[1]?.pointId &&
                styles.selectedSecondaryPinCircle,
            ]}>
            <Mountain size={14} color="#FFFFFF" />
          </View>
          <View style={styles.secondaryBadge}>
            <Text style={styles.secondaryText}>Upper Ridge Gompa</Text>
            <Text style={styles.secondarySubText}>+180m • 31 min</Text>
          </View>
        </Pressable>
      )}

      {/* Destination Marker 3: Nangkarshang Peak Camp */}
      {safePoints[2] && (
        <Pressable
          style={styles.thirdPin}
          onPress={() => onSelectSafePoint(safePoints[2])}>
          <View
            style={[
              styles.thirdIconCircle,
              primarySafePoint?.pointId === safePoints[2]?.pointId &&
                styles.selectedSecondaryPinCircle,
            ]}>
            <Navigation size={12} color="#FFFFFF" />
          </View>
          <View style={styles.thirdBadge}>
            <Text style={styles.secondaryText}>Nangkarshang Camp</Text>
          </View>
        </Pressable>
      )}

      {/* Compass / Recenter Control Button */}
      <Pressable style={styles.recenterButton}>
        <Compass size={22} color={Colors.meltwater} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: MAP_HEIGHT,
    backgroundColor: '#EEF3F5',
    position: 'relative',
    overflow: 'hidden',
  },
  riverLabelContainer: {
    position: 'absolute',
    left: 45,
    bottom: 120,
    transform: [{ rotate: '-52deg' }],
    opacity: 0.75,
  },
  riverLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.meltwater,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  userPin: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 20,
  },
  userPinRing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(30, 120, 184, 0.25)',
    position: 'absolute',
    top: -8,
  },
  userPinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.meltwater,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    ...Shadows.subtle,
  },
  userPinBadge: {
    marginTop: 4,
    backgroundColor: Colors.moraineInk,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    ...Shadows.subtle,
  },
  userPinText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  destinationPin: {
    position: 'absolute',
    right: 18,
    top: 24,
    alignItems: 'center',
    zIndex: 25,
  },
  destinationIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cirqueTeal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Shadows.card,
  },
  selectedPinCircle: {
    borderColor: '#FAD02C',
    borderWidth: 3.5,
    transform: [{ scale: 1.08 }],
  },
  destinationPointer: {
    width: 8,
    height: 8,
    backgroundColor: Colors.cirqueTeal,
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
  },
  destinationCard: {
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    maxWidth: 160,
    ...Shadows.card,
  },
  destinationCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.moraineInk,
    textAlign: 'center',
  },
  destinationCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  destinationCardSub: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.cirqueTeal,
  },
  destinationCardWalk: {
    fontSize: 9,
    color: Colors.slateFog,
    marginTop: 1,
  },
  secondaryPin: {
    position: 'absolute',
    left: 24,
    top: 60,
    alignItems: 'center',
    zIndex: 20,
  },
  secondaryIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.meltwater,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Shadows.subtle,
  },
  selectedSecondaryPinCircle: {
    borderColor: '#FAD02C',
    borderWidth: 3,
  },
  secondaryBadge: {
    marginTop: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.moraineInk,
  },
  secondarySubText: {
    fontSize: 8,
    color: Colors.cirqueTeal,
    fontWeight: '600',
  },
  thirdPin: {
    position: 'absolute',
    right: 30,
    bottom: 90,
    alignItems: 'center',
    zIndex: 20,
  },
  thirdIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  thirdBadge: {
    marginTop: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  recenterButton: {
    position: 'absolute',
    right: Spacing.marginMobile,
    bottom: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    zIndex: 30,
    ...Shadows.card,
  },
});
