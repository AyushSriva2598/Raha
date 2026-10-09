import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path, Ellipse, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Radii, Spacing, Shadows } from '@/constants/tokens';
import { Maximize2, Compass } from 'lucide-react-native';
import { router } from 'expo-router';

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

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}>
      {/* Topographic Vector Riverbed & Basin Canvas */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 350 210" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="miniRiverGrad" x1="1" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#70B2DC" />
              <Stop offset="1" stopColor="#BFDDF0" />
            </LinearGradient>
            <LinearGradient id="miniLakeGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#9ACBE8" />
              <Stop offset="1" stopColor="#5CA6D4" />
            </LinearGradient>
          </Defs>

          {/* Topographic contour ripples - fill="none" */}
          <G stroke="#CDDBE4" strokeWidth={1.2} strokeDasharray="4 4" fill="none">
            <Path d="M -20 50 Q 100 30 220 60 T 380 40" fill="none" />
            <Path d="M -20 100 Q 90 120 210 90 T 380 110" fill="none" />
            <Path d="M -20 160 Q 110 180 230 140 T 380 170" fill="none" />
          </G>

          {/* Dudh Koshi River Valley Bed */}
          <Path
            d="M 315 32 C 260 48, 230 80, 180 105 C 130 130, 80 150, 20 180"
            stroke="url(#miniRiverGrad)"
            strokeWidth={22}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Active Safe Hydrological Ridge Line */}
          <Path
            d="M 315 32 C 260 48, 230 80, 180 105 C 130 130, 80 150, 20 180"
            stroke={Colors.cirqueTeal}
            strokeWidth={4}
            strokeDasharray="6 4"
            strokeLinecap="round"
            fill="none"
          />

          {/* Imja Tsho Glacial Lake Headwater */}
          <Ellipse cx={310} cy={34} rx={26} ry={16} fill="url(#miniLakeGrad)" />
          <Ellipse cx={310} cy={34} rx={18} ry={10} fill="#7BBCE0" fillOpacity={0.6} />
          <Circle cx={310} cy={34} r={3} fill="#FFFFFF" />

          {/* Waypoint dots */}
          <Circle cx={180} cy={105} r={3} fill="#FFFFFF" />
          <Circle cx={100} cy={145} r={3} fill="#FFFFFF" />
        </Svg>
      </View>

      {/* Top Header Badge & Expand Control */}
      <View style={styles.topHeader}>
        <View style={styles.badgePill}>
          <View style={styles.tealDot} />
          <Text style={styles.badgeText}>{basinTitle}</Text>
        </View>

        <View style={styles.expandButton}>
          <Maximize2 size={16} color={Colors.moraineInk} />
        </View>
      </View>

      {/* Middle Map Watermark Annotation */}
      <View style={styles.riverAnnotation}>
        <Compass size={12} color={Colors.meltwater} />
        <Text style={styles.riverAnnotationText}>Dudh Koshi Corridor ➔</Text>
      </View>

      {/* Bottom Information Ribbon */}
      <View style={styles.bottomFooter}>
        <View style={styles.locationPill}>
          <View style={styles.pulseContainer}>
            <View style={styles.pulseDot} />
          </View>
          <Text style={styles.locationText}>{userLocationText}</Text>
        </View>

        <View style={styles.distPill}>
          <Text style={styles.distText}>{lakeDistText}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    borderRadius: Radii.card,
    backgroundColor: '#EDF4FF',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: Spacing.md,
    ...Shadows.subtle,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(246, 250, 252, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(211, 227, 238, 0.8)',
    ...Shadows.subtle,
  },
  tealDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.cirqueTeal,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.moraineInk,
    letterSpacing: 0.2,
  },
  expandButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(246, 250, 252, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(211, 227, 238, 0.8)',
    ...Shadows.subtle,
  },
  riverAnnotation: {
    position: 'absolute',
    left: 40,
    top: 95,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    transform: [{ rotate: '-22deg' }],
    opacity: 0.8,
  },
  riverAnnotationText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.meltwater,
    letterSpacing: 1,
  },
  bottomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(246, 250, 252, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(211, 227, 238, 0.8)',
    ...Shadows.subtle,
  },
  pulseContainer: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(30, 120, 184, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.meltwater,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.moraineInk,
  },
  distPill: {
    backgroundColor: 'rgba(246, 250, 252, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(211, 227, 238, 0.8)',
    ...Shadows.subtle,
  },
  distText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.slateFog,
  },
});
