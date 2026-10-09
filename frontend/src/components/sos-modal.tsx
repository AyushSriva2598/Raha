import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '@/constants/tokens';
import { useAppStore } from '@/store/useAppStore';
import {
  AlertTriangle,
  Radio,
  MapPin,
  BatteryCharging,
  CheckCircle,
  X,
  PhoneCall,
} from 'lucide-react-native';

export function EmergencySosModal() {
  const {
    isSosModalOpen,
    openSosModal,
    triggerEmergencySos,
    userProfile,
    alertLevel,
    t,
  } = useAppStore();

  const [countdown, setCountdown] = useState(5);
  const [isDispatched, setIsDispatched] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const strings = t();

  const handleDispatch = React.useCallback(async () => {
    setIsBroadcasting(true);
    await triggerEmergencySos();
    setIsBroadcasting(false);
    setIsDispatched(true);
  }, [triggerEmergencySos]);

  useEffect(() => {
    if (!isSosModalOpen || isDispatched || isBroadcasting) return;

    const timer = setTimeout(() => {
      if (countdown <= 1) {
        setCountdown(0);
        handleDispatch();
      } else {
        setCountdown((prev) => prev - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isSosModalOpen, countdown, isDispatched, isBroadcasting, handleDispatch]);

  const handleClose = () => {
    openSosModal(false);
    setCountdown(5);
    setIsDispatched(false);
    setIsBroadcasting(false);
  };

  if (!isSosModalOpen) return null;

  const activeContacts = (userProfile?.contacts || []).filter((c) => c.isActive);

  return (
    <Modal visible={isSosModalOpen} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <AlertTriangle size={24} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <X size={20} color={Colors.slateFog} />
            </Pressable>
          </View>

          {!isDispatched ? (
            <View style={styles.contentStack}>
              <Text style={styles.title}>{strings.sos.dialogTitle}</Text>
              <Text style={styles.subtitle}>
                {strings.sos.countdownSubtitle}
              </Text>

              {/* Countdown Dial */}
              <View style={styles.countdownContainer}>
                {isBroadcasting ? (
                  <ActivityIndicator size="large" color={Colors.alarmRed} />
                ) : (
                  <View style={styles.countdownCircle}>
                    <Text style={styles.countdownNumber}>{countdown}</Text>
                    <Text style={styles.countdownSeconds}>seconds</Text>
                  </View>
                )}
              </View>

              {/* Coordinates & Telemetry Box */}
              <View style={styles.telemetryBox}>
                <View style={styles.telemetryItem}>
                  <MapPin size={15} color={Colors.meltwater} />
                  <Text style={styles.telemetryText}>
                    Dingboche (27.892° N, 86.830° E) • 4,410m Elev
                  </Text>
                </View>
                <View style={styles.telemetryItem}>
                  <Radio size={15} color={Colors.cirqueTeal} />
                  <Text style={styles.telemetryText}>
                    Iridium Satellite Relay • VHF 146.52 MHz
                  </Text>
                </View>
                <View style={styles.telemetryItem}>
                  <BatteryCharging size={15} color={Colors.moraineInk} />
                  <Text style={styles.telemetryText}>
                    Battery: 88% • Alert Level: {alertLevel}
                  </Text>
                </View>
              </View>

              {/* Receiving Contacts */}
              <View style={styles.contactsBox}>
                <Text style={styles.contactsHeader}>Contacts Receiving Live Pin:</Text>
                {activeContacts.map((contact) => (
                  <View key={contact.contactId} style={styles.contactRow}>
                    <PhoneCall size={14} color={Colors.slateFog} />
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactRelation}>({contact.relation})</Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  </View>
                ))}
              </View>

              {/* Instant Dispatch or Cancel Buttons */}
              <View style={styles.buttonsStack}>
                <Pressable
                  style={({ pressed }) => [styles.instantButton, pressed && styles.pressed]}
                  onPress={handleDispatch}>
                  <Text style={styles.instantButtonText}>Broadcast Immediately</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
                  onPress={handleClose}>
                  <Text style={styles.cancelButtonText}>{strings.sos.cancelButton}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* Dispatched Confirmation View */
            <View style={styles.dispatchedStack}>
              <View style={styles.successIcon}>
                <CheckCircle size={44} color={Colors.cirqueTeal} />
              </View>
              <Text style={styles.dispatchedTitle}>{strings.sos.broadcastingTitle}</Text>
              <Text style={styles.dispatchedDesc}>{strings.sos.dispatchedNotice}</Text>

              <View style={styles.dispatchedMeta}>
                <Text style={styles.dispatchedMetaText}>✓ SMS dispatched via AWS SNS to 2 numbers</Text>
                <Text style={styles.dispatchedMetaText}>✓ Satellite beacon active on Solukhumbu Repeater</Text>
                <Text style={styles.dispatchedMetaText}>✓ Solukhumbu District Control acknowledged</Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
                onPress={handleClose}>
                <Text style={styles.doneButtonText}>{strings.sos.doneButton}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 26, 40, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.marginMobile,
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    padding: Spacing.lg,
    ...Shadows.urgent,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.alarmRed,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glacierMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentStack: {
    gap: Spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.alarmRed,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.slateFog,
    textAlign: 'center',
  },
  countdownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 110,
  },
  countdownCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.alarmRed,
    backgroundColor: Colors.alarmRedLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.alarmRed,
    lineHeight: 44,
  },
  countdownSeconds: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.alarmRed,
  },
  telemetryBox: {
    backgroundColor: Colors.firn,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 6,
  },
  telemetryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  telemetryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.moraineInk,
    flex: 1,
  },
  contactsBox: {
    backgroundColor: Colors.glacierMist,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    gap: 4,
  },
  contactsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.moraineInk,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.moraineInk,
  },
  contactRelation: {
    fontSize: 11,
    color: Colors.slateFog,
  },
  contactPhone: {
    fontSize: 11,
    color: Colors.slateFog,
    marginLeft: 'auto',
  },
  buttonsStack: {
    gap: 8,
    marginTop: 4,
  },
  instantButton: {
    height: 48,
    backgroundColor: Colors.alarmRed,
    borderRadius: Radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instantButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    height: 44,
    backgroundColor: Colors.glacierMist,
    borderRadius: Radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.moraineInk,
  },
  dispatchedStack: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(18, 165, 155, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dispatchedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.moraineInk,
    textAlign: 'center',
  },
  dispatchedDesc: {
    fontSize: 13,
    color: Colors.slateFog,
    textAlign: 'center',
    lineHeight: 18,
  },
  dispatchedMeta: {
    backgroundColor: Colors.firn,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    width: '100%',
    gap: 6,
  },
  dispatchedMetaText: {
    fontSize: 12,
    color: Colors.cirqueTealDark,
    fontWeight: '600',
  },
  doneButton: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.meltwater,
    borderRadius: Radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
