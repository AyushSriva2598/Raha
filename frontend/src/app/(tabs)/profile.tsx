import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '@/constants/tokens';
import { useAppStore } from '@/store/useAppStore';
import { AddEmergencyContactModal } from '@/components/add-contact-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Languages,
  AlertTriangle,
  UserPlus,
  Sliders,
  DownloadCloud,
  Radio,
  RadioReceiver,
  LogOut,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Users,
} from 'lucide-react-native';
import { LanguageCode } from '@/i18n/translations';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    userProfile,
    language,
    setLanguage,
    toggleContact,
    openAddContactModal,
    t,
  } = useAppStore();

  const [isUpdatingMaps, setIsUpdatingMaps] = useState(false);
  const strings = t();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 36 : 16);

  const handleSignOut = () => {
    Alert.alert(
      'Disconnect Telemetry Node?',
      'Offline terrain maps and emergency routes will remain cached on device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Signed Out', 'Telemetry monitoring disconnected.');
          },
        },
      ]
    );
  };

  const handleUpdateMaps = () => {
    setIsUpdatingMaps(true);
    setTimeout(() => {
      setIsUpdatingMaps(false);
      Alert.alert(
        'Offline Cache Synced',
        'Successfully downloaded 48 MB of offline vector tiles and safe elevation contours for Dudh Koshi Valley.'
      );
    }, 1200);
  };

  const handleStationClick = (stationName: string, freq: string) => {
    Alert.alert(
      `${stationName} Station`,
      `Status: Online (Nominal)\nAcoustic Radar Frequency: ${freq}\nLast Heartbeat: 2 min ago\nSatellite Link: Active via Iridium`
    );
  };

  const languages: { code: LanguageCode; native: string; english: string }[] = [
    { code: 'en', native: 'English', english: 'English' },
    { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
    { code: 'ne', native: 'नेपाली', english: 'Nepali' },
  ];

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding, paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Top Header with proper safe area inset */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.headerTitle}>{strings.appName}</Text>
            <Text style={styles.headerSub}>Profile & Node Telemetry</Text>
          </View>
        </View>

        {/* User Identity Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80',
                }}
                style={styles.avatarImage}
              />
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={11} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.profileInfoCol}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {userProfile?.name || 'Pasang Lhamu Sherpa'}
                </Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{strings.profile.resident}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <MapPin size={13} color={Colors.slateFog} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {userProfile?.homeLocationName || 'Dingboche, Solukhumbu, Nepal'}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Phone size={13} color={Colors.slateFog} />
                <Text style={styles.metaText}>{userProfile?.phone || '+977 9841-582910'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.altitudeFooter}>
            <Text style={styles.altitudeText}>
              Telemetry Synced • High Altitude Zone
            </Text>
            <View style={styles.altitudePill}>
              <View style={styles.tealDot} />
              <Text style={styles.altitudePillText}>
                {userProfile?.elevationM || 4410}m Elev.
              </Text>
            </View>
          </View>
        </View>

        {/* Regional Language Selection Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Languages size={18} color={Colors.meltwater} />
              <Text style={styles.sectionTitle}>{strings.profile.languageTitle}</Text>
            </View>
            <Text style={styles.sectionMeta}>{strings.profile.languageSubtitle}</Text>
          </View>

          <Text style={styles.sectionExplainer}>
            {strings.profile.languageNotice}
          </Text>

          {/* Language Selector Tabs */}
          <View style={styles.languageTabsContainer}>
            {languages.map((item) => {
              const isActive = language === item.code;
              return (
                <Pressable
                  key={item.code}
                  style={[
                    styles.langTab,
                    isActive && styles.langTabActive,
                  ]}
                  onPress={() => setLanguage(item.code)}>
                  <Text
                    style={[
                      styles.langNative,
                      isActive && styles.langTextActive,
                    ]}>
                    {item.native}
                  </Text>
                  <Text
                    style={[
                      styles.langEnglish,
                      isActive && styles.langTextActive,
                    ]}>
                    {item.english}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* SOS Emergency Contacts */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <AlertTriangle size={18} color={Colors.alarmRed} />
              <Text style={styles.sectionTitle}>
                {strings.profile.sosContactsTitle}
              </Text>
            </View>
            <Text style={styles.sectionMeta}>
              {(userProfile?.contacts || []).filter((c) => c.isActive).length}{' '}
              {strings.profile.activeContactsCount}
            </Text>
          </View>

          <Text style={styles.sectionExplainer}>
            {strings.profile.sosContactsSubtitle}
          </Text>

          {/* Contact Items */}
          <View style={styles.contactsList}>
            {(userProfile?.contacts || []).map((contact) => (
              <View key={contact.contactId} style={styles.contactItemCard}>
                <View style={styles.contactItemLeft}>
                  <View style={styles.contactIconCircle}>
                    <Users size={16} color={Colors.moraineInk} />
                  </View>
                  <View>
                    <View style={styles.contactNameRow}>
                      <Text style={styles.contactItemName}>{contact.name}</Text>
                      <Text style={styles.contactItemRelation}>
                        ({contact.relation})
                      </Text>
                    </View>
                    <Text style={styles.contactItemPhone}>{contact.phone}</Text>
                  </View>
                </View>

                <Switch
                  value={contact.isActive}
                  onValueChange={() => toggleContact(contact.contactId)}
                  trackColor={{
                    false: Colors.borderSubtle,
                    true: Colors.cirqueTeal,
                  }}
                />
              </View>
            ))}

            {/* Add Contact Action Button */}
            <Pressable
              style={({ pressed }) => [
                styles.addContactButton,
                pressed && styles.pressed,
              ]}
              onPress={() => openAddContactModal(true)}>
              <UserPlus size={16} color={Colors.meltwater} />
              <Text style={styles.addContactButtonText}>
                {strings.profile.addContact}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* System & Safety Preferences */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Sliders size={18} color={Colors.slateFog} />
              <Text style={styles.sectionTitle}>
                {strings.profile.preferencesTitle}
              </Text>
            </View>
          </View>

          {/* Offline Maps Item */}
          <View style={styles.prefItem}>
            <View style={styles.prefItemLeft}>
              <View style={styles.prefIconBox}>
                <DownloadCloud size={18} color={Colors.meltwater} />
              </View>
              <View>
                <Text style={styles.prefTitle}>
                  {strings.profile.offlineMapsTitle}
                </Text>
                <View style={styles.offlineMetaRow}>
                  <CheckCircle2 size={12} color={Colors.cirqueTeal} />
                  <Text style={styles.offlineMetaText}>
                    {strings.profile.offlineMapsStatus}
                  </Text>
                </View>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.prefActionBtn, pressed && styles.pressed]}
              onPress={handleUpdateMaps}>
              {isUpdatingMaps ? (
                <ActivityIndicator size="small" color={Colors.moraineInk} />
              ) : (
                <Text style={styles.prefActionBtnText}>
                  {strings.profile.updateMaps}
                </Text>
              )}
            </Pressable>
          </View>

          {/* SMS Fallback */}
          <View style={styles.prefItem}>
            <View style={styles.prefItemLeft}>
              <View style={styles.prefIconBox}>
                <Radio size={18} color={Colors.warning} />
              </View>
              <View>
                <Text style={styles.prefTitle}>
                  {strings.profile.smsFallbackTitle}
                </Text>
                <Text style={styles.prefSub}>
                  {strings.profile.smsFallbackStatus}
                </Text>
              </View>
            </View>
            <View style={styles.enabledPill}>
              <Text style={styles.enabledPillText}>Enabled</Text>
            </View>
          </View>

          {/* Himalayan Telemetry Stations */}
          <View style={styles.stationsCard}>
            <View style={styles.stationsHeader}>
              <View style={styles.stationsTitleRow}>
                <View style={styles.prefIconBox}>
                  <RadioReceiver size={18} color={Colors.cirqueTeal} />
                </View>
                <View>
                  <Text style={styles.prefTitle}>
                    {strings.profile.telemetryTitle}
                  </Text>
                  <Text style={styles.prefSub}>
                    {strings.profile.telemetrySubtitle}
                  </Text>
                </View>
              </View>
              <Text style={styles.stationsCountText}>
                {strings.profile.liveStationsCount}
              </Text>
            </View>

            <View style={styles.stationChipsRow}>
              <Pressable
                style={styles.stationChip}
                onPress={() => handleStationClick('Imja Tsho', '146.520 MHz')}>
                <View style={styles.tealDot} />
                <Text style={styles.stationChipText}>Imja Tsho</Text>
              </Pressable>
              <Pressable
                style={styles.stationChip}
                onPress={() => handleStationClick('Tsho Rolpa', '148.150 MHz')}>
                <View style={styles.tealDot} />
                <Text style={styles.stationChipText}>Tsho Rolpa</Text>
              </Pressable>
              <Pressable
                style={styles.stationChip}
                onPress={() => handleStationClick('South Lhonak', '150.220 MHz')}>
                <View style={styles.tealDot} />
                <Text style={styles.stationChipText}>South Lhonak</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Sign Out Button & Firmware Footer */}
        <View style={styles.footerCol}>
          <Pressable
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.pressed,
            ]}
            onPress={handleSignOut}>
            <LogOut size={16} color={Colors.slateFog} />
            <Text style={styles.signOutText}>{strings.profile.signOut}</Text>
          </Pressable>

          <Text style={styles.privacyNoticeText}>
            {strings.profile.privacyNotice}
          </Text>

          <Text style={styles.firmwareText}>
            Firmware Build 2.14.8-GLOF • High-Altitude Node SOL-09
          </Text>
        </View>
      </ScrollView>

      {/* Add Contact Modal */}
      <AddEmergencyContactModal />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.firn,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    gap: Spacing.md,
  },
  topHeader: {
    paddingHorizontal: Spacing.marginMobile,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.firn,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.moraineInk,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.slateFog,
    fontWeight: '600',
  },
  profileCard: {
    marginHorizontal: Spacing.marginMobile,
    backgroundColor: Colors.glacierMist,
    borderRadius: Radii.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: Spacing.md,
    ...Shadows.subtle,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
    width: 62,
    height: 62,
  },
  avatarImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: Colors.borderSubtle,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.cirqueTeal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  profileInfoCol: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.moraineInk,
    flex: 1,
  },
  roleBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.meltwater,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 11,
    color: Colors.slateFog,
    fontWeight: '500',
    flex: 1,
  },
  altitudeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  altitudeText: {
    fontSize: 11,
    color: Colors.slateFog,
    fontWeight: '500',
  },
  altitudePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tealDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.cirqueTeal,
  },
  altitudePillText: {
    fontSize: 11,
    color: Colors.cirqueTeal,
    fontWeight: '700',
  },
  sectionCard: {
    marginHorizontal: Spacing.marginMobile,
    backgroundColor: Colors.glacierMist,
    borderRadius: Radii.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.moraineInk,
  },
  sectionMeta: {
    fontSize: 11,
    color: Colors.slateFog,
    fontWeight: '600',
  },
  sectionExplainer: {
    fontSize: 12,
    color: Colors.slateFog,
    lineHeight: 16,
  },
  languageTabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.firn,
    borderRadius: Radii.button,
    padding: 3,
    gap: 4,
    marginTop: 4,
  },
  langTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
  },
  langTabActive: {
    backgroundColor: Colors.meltwater,
    ...Shadows.subtle,
  },
  langNative: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.moraineInk,
  },
  langEnglish: {
    fontSize: 10,
    color: Colors.slateFog,
    marginTop: 1,
  },
  langTextActive: {
    color: '#FFFFFF',
  },
  contactsList: {
    gap: 8,
    marginTop: 4,
  },
  contactItemCard: {
    backgroundColor: Colors.firn,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  contactIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.moraineInk,
  },
  contactItemRelation: {
    fontSize: 11,
    color: Colors.slateFog,
  },
  contactItemPhone: {
    fontSize: 11,
    color: Colors.slateFog,
    marginTop: 1,
  },
  addContactButton: {
    height: 44,
    borderRadius: Radii.button,
    backgroundColor: Colors.glacierMist,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  addContactButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.moraineInk,
  },
  prefItem: {
    backgroundColor: Colors.firn,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  prefItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  prefIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.moraineInk,
  },
  offlineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  offlineMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.cirqueTeal,
  },
  prefSub: {
    fontSize: 11,
    color: Colors.slateFog,
    marginTop: 1,
  },
  prefActionBtn: {
    backgroundColor: Colors.glacierMist,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  prefActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.moraineInk,
  },
  enabledPill: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  enabledPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.meltwater,
  },
  stationsCard: {
    backgroundColor: Colors.firn,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 8,
  },
  stationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stationsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  stationsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.cirqueTeal,
  },
  stationChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingLeft: 44,
  },
  stationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.glacierMist,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  stationChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.moraineInk,
  },
  footerCol: {
    alignItems: 'center',
    gap: 8,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.marginMobile,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slateFog,
  },
  privacyNoticeText: {
    fontSize: 11,
    color: Colors.slateFog,
    textAlign: 'center',
    lineHeight: 15,
  },
  firmwareText: {
    fontSize: 10,
    color: Colors.slateFog,
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
