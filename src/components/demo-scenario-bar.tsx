import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Radii, Shadows } from '@/constants/tokens';
import { useAppStore } from '@/store/useAppStore';
import { AlertLevel } from '@/types';
import { SlidersHorizontal, CheckCircle2, Eye, AlertTriangle, AlertOctagon } from 'lucide-react-native';

export function DemoScenarioBar() {
  const { alertLevel, setAlertLevel } = useAppStore();

  const levels: { level: AlertLevel; label: string; color: string; icon: any }[] = [
    { level: 'CLEAR', label: 'Clear', color: Colors.cirqueTeal, icon: CheckCircle2 },
    { level: 'WATCH', label: 'Watch', color: Colors.watch, icon: Eye },
    { level: 'WARNING', label: 'Warning', color: Colors.warning, icon: AlertTriangle },
    { level: 'EVACUATE', label: 'Evacuate', color: Colors.alarmRed, icon: AlertOctagon },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SlidersHorizontal size={13} color={Colors.slateFog} />
        <Text style={styles.demoLabel}>DEMO SCENARIO REPLAY</Text>
      </View>

      <View style={styles.segmentContainer}>
        {levels.map((item) => {
          const isSelected = alertLevel === item.level;
          const Icon = item.icon;
          return (
            <Pressable
              key={item.level}
              style={[
                styles.segmentItem,
                isSelected && {
                  backgroundColor: item.color,
                  shadowColor: item.color,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ]}
              onPress={() => setAlertLevel(item.level)}>
              <Icon size={12} color={isSelected ? '#FFFFFF' : Colors.slateFog} />
              <Text
                style={[
                  styles.segmentText,
                  isSelected && styles.segmentTextSelected,
                ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  demoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slateFog,
    letterSpacing: 0.8,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.firn,
    borderRadius: Radii.md,
    padding: 3,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: Radii.sm,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slateFog,
  },
  segmentTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
