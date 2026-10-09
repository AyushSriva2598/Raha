import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { Colors, Radii, Spacing } from '@/constants/tokens';
import { AlertLevel, LakeAssessment } from '@/types';
import { CheckCircle2, Eye, AlertTriangle, AlertOctagon, Compass } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WaterlineHeroProps {
  assessment: LakeAssessment | null;
  alertLevel: AlertLevel;
  tTitle: string;
  tSubtitle: string;
}

export function WaterlineHero({
  assessment,
  alertLevel,
  tTitle,
  tSubtitle,
}: WaterlineHeroProps) {
  const isEvacuate = alertLevel === 'EVACUATE';
  const isWarning = alertLevel === 'WARNING';
  const isWatch = alertLevel === 'WATCH';
  const isClear = alertLevel === 'CLEAR';

  if (isEvacuate) {
    return (
      <View style={styles.evacuateContainer}>
        {/* Layered flood wave crests */}
        <Svg
          style={StyleSheet.absoluteFill}
          viewBox="0 0 390 280"
          preserveAspectRatio="none">
          <G opacity={0.35}>
            <Path
              d="M0,90 C70,125 150,65 240,110 C310,145 355,80 390,95 L390,280 L0,280 Z"
              fill={Colors.warning}
              fillOpacity={0.65}
            />
            <Path
              d="M0,135 C80,165 170,115 260,150 C320,172 360,130 390,140 L390,280 L0,280 Z"
              fill={Colors.alarmRed}
              fillOpacity={0.85}
            />
            <Path
              d="M0,170 C95,195 180,155 275,185 C330,202 365,180 390,188 L390,280 L0,280 Z"
              fill={Colors.alarmRedHeader}
            />
          </G>
        </Svg>

        <View style={styles.heroContent}>
          {/* Status Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.evacuatePill}>
              <AlertTriangle size={15} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.evacuatePillText}>Live Threat Level: High</Text>
            </View>
            <View style={[styles.badgePill, { backgroundColor: Colors.alarmRed }]}>
              <AlertOctagon size={14} color="#FFFFFF" />
              <Text style={styles.badgePillText}>EVACUATE</Text>
            </View>
          </View>

          {/* Urgent Headline */}
          <View style={styles.textStack}>
            <Text style={styles.urgentTitle}>{tTitle || 'Leave now. Move to higher ground.'}</Text>
            <Text style={styles.urgentSubtitle}>
              {tSubtitle || 'A flood may reach you in about 2 to 4 hours.'}
            </Text>
          </View>

          {/* Telemetry Status Line */}
          <View style={styles.telemetryRowEvacuate}>
            <View style={styles.beaconDot}>
              <View style={styles.beaconInner} />
            </View>
            <Text style={styles.telemetryTextEvacuate}>
              Imja Tsho moraine breach detected • {assessment?.dataAge || 'Updated 2 min ago'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Clear, Watch, and Warning rendering
  const getBadgeConfig = () => {
    if (isWarning) {
      return {
        bg: '#FCECE6',
        border: '#F8CEBE',
        text: Colors.warning,
        label: 'Warning',
        icon: <AlertTriangle size={16} color={Colors.warning} />,
      };
    }
    if (isWatch) {
      return {
        bg: '#FEF8EA',
        border: '#F9E6B8',
        text: Colors.watch,
        label: 'Watch',
        icon: <Eye size={16} color={Colors.watch} />,
      };
    }
    return {
      bg: '#EAF4FB',
      border: '#D3E3EE',
      text: Colors.cirqueTeal,
      label: 'Clear',
      icon: <CheckCircle2 size={16} color={Colors.cirqueTeal} />,
    };
  };

  const badge = getBadgeConfig();

  return (
    <View style={styles.container}>
      {/* Dynamic Waterline Wave Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg
          width={SCREEN_WIDTH}
          height={180}
          viewBox="0 0 400 160"
          preserveAspectRatio="none"
          style={styles.waterlineSvg}>
          <Path
            d="M0,90 C120,60 240,120 360,85 C420,70 480,95 500,88 L500,160 L0,160 Z"
            fill={isWarning ? '#FADFD3' : isWatch ? '#FDF0D5' : '#DCEEFA'}
            fillOpacity={0.65}
          />
          <Path
            d="M0,115 C140,80 270,140 400,105 C460,90 520,115 540,110 L540,160 L0,160 Z"
            fill={isWarning ? '#F8CEBE' : isWatch ? '#FCE6B8' : '#C7E4F6'}
            fillOpacity={0.45}
          />
          <Path
            d="M0,135 C100,120 220,150 340,130 C440,110 500,140 520,135 L520,160 L0,160 Z"
            fill={isWarning ? '#F4B7A0' : isWatch ? '#F9DC9B' : '#B8DCF2'}
            fillOpacity={0.3}
          />
        </Svg>
      </View>

      <View style={styles.heroContent}>
        {/* Status Pill Badge */}
        <View style={[styles.badgePill, { backgroundColor: badge.bg, borderColor: badge.border }]}>
          {badge.icon}
          <Text style={[styles.badgePillText, { color: badge.text }]}>{badge.label}</Text>
        </View>

        {/* Hero Title & Subtitle */}
        <View style={styles.textStack}>
          <Text
            style={[
              isClear ? styles.statementClear : styles.statementUrgent,
              isWarning && { color: Colors.warning },
              isWatch && { color: Colors.moraineInk },
            ]}>
            {tTitle || (isClear ? 'No threat near you.' : 'Elevated lake inflow detected.')}
          </Text>
          <Text style={styles.statementSubtitle}>
            {tSubtitle ||
              (isClear
                ? 'All monitored glacial lakes are stable.'
                : 'A risk factor is trending the wrong way.')}
          </Text>
        </View>

        {/* Telemetry info */}
        <View style={styles.telemetryRow}>
          <Compass size={14} color={isWarning ? Colors.warning : Colors.cirqueTeal} />
          <Text style={styles.telemetryText}>
            Imja Tsho & Dudh Koshi River basin • {assessment?.dataAge || 'Updated 14 min ago'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.marginMobile,
    backgroundColor: Colors.firn,
    position: 'relative',
    overflow: 'hidden',
  },
  waterlineSvg: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
  },
  evacuateContainer: {
    width: '100%',
    backgroundColor: Colors.alarmRedHeader,
    borderBottomLeftRadius: Radii.sheet,
    borderBottomRightRadius: Radii.sheet,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.marginMobile,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: Colors.alarmRed,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  heroContent: {
    zIndex: 10,
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  evacuatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  evacuatePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  badgePillText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  textStack: {
    marginTop: 4,
    gap: 4,
  },
  statementClear: {
    fontSize: 34,
    color: Colors.moraineInk,
    fontWeight: '500',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  statementUrgent: {
    fontSize: 28,
    color: Colors.moraineInk,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  statementSubtitle: {
    fontSize: 16,
    color: Colors.slateFog,
    fontWeight: '500',
    lineHeight: 22,
  },
  urgentTitle: {
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  urgentSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '500',
    lineHeight: 22,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  telemetryText: {
    fontSize: 12,
    color: Colors.slateFog,
    fontWeight: '500',
  },
  telemetryRowEvacuate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
    width: '100%',
  },
  beaconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaconInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.alarmRed,
  },
  telemetryTextEvacuate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.88)',
    fontWeight: '500',
  },
});
