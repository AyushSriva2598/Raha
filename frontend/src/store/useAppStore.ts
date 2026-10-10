// Zustand Global Store for Glacial Threat Early Warning (Raha / Avalon)
import { create } from 'zustand';
import {
  AlertLevel,
  EventLog,
  Lake,
  LakeAssessment,
  SafePoint,
  SosContact,
  SosResponse,
  UserAccount,
  UserProfile,
} from '@/types';
import { apiClient } from '@/services/api';
import { TRANSLATIONS, Translations, LanguageCode } from '@/i18n/translations';

interface AppState {
  // Authentication State
  authToken: string | null;
  isAuthenticated: boolean;
  currentUser: UserAccount | null;

  // Core State
  alertLevel: AlertLevel;
  activeAssessment: LakeAssessment | null;
  lakes: Lake[];
  events: EventLog[];
  safePoints: SafePoint[];
  selectedSafePoint: SafePoint | null;
  userProfile: UserProfile | null;
  language: LanguageCode;
  isLoading: boolean;
  error: string | null;

  // Location State
  userLocation: {
    latitude: number;
    longitude: number;
    elevationM: number;
    address: string;
    shortName: string;
  };

  // UI and Modal State
  mapMode: 'EVACUATE' | 'NAVIGATE';
  targetPerson: 'ME' | 'OTHER';
  isLegendOpen: boolean;
  isSosModalOpen: boolean;
  isAddContactModalOpen: boolean;
  sosBroadcastResult: SosResponse | null;

  // Actions
  setUserLocation: (loc: {
    latitude: number;
    longitude: number;
    elevationM: number;
    address: string;
    shortName: string;
  }) => void;
  init: () => Promise<void>;
  setAuth: (token: string, user?: UserAccount, profile?: UserProfile) => void;
  logout: () => void;
  setAlertLevel: (level: AlertLevel) => Promise<void>;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  setMapMode: (mode: 'EVACUATE' | 'NAVIGATE') => void;
  setTargetPerson: (person: 'ME' | 'OTHER') => void;
  toggleLegend: () => void;
  setSelectedSafePoint: (safePoint: SafePoint | null) => void;
  toggleContact: (contactId: string) => Promise<void>;
  addEmergencyContact: (contact: Omit<SosContact, 'contactId'>) => Promise<void>;
  openSosModal: (open: boolean) => void;
  openAddContactModal: (open: boolean) => void;
  triggerEmergencySos: () => Promise<SosResponse>;
  t: () => Translations;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth default
  authToken: 'demo-initial-token',
  isAuthenticated: true,
  currentUser: {
    id: 'u-pasang',
    name: 'Pasang Lhamu Sherpa',
    phone: '+977 9841-582910',
    email: 'pasang.sherpa@khumbu.np',
    role: 'resident',
    homeZoneId: 'dingboche-zone',
    createdAt: '2026-01-15T08:00:00Z',
  },

  alertLevel: 'CLEAR',
  activeAssessment: null,
  lakes: [],
  events: [],
  safePoints: [],
  selectedSafePoint: null,
  userProfile: null,
  language: 'en',
  isLoading: false,
  error: null,

  userLocation: {
    latitude: 27.8938,
    longitude: 86.8315,
    elevationM: 4410,
    address: 'Dingboche, Solukhumbu, Nepal',
    shortName: 'Dingboche',
  },

  setUserLocation: (loc) => {
    set((state) => ({
      userLocation: loc,
      userProfile: state.userProfile
        ? {
            ...state.userProfile,
            homeLocationName: loc.address,
            elevationM: loc.elevationM,
          }
        : state.userProfile,
    }));
  },

  mapMode: 'EVACUATE',
  targetPerson: 'ME',
  isLegendOpen: false,
  isSosModalOpen: false,
  isAddContactModalOpen: false,
  sosBroadcastResult: null,

  init: async () => {
    try {
      set({ isLoading: true, error: null });
      const [assessment, lakes, events, safePoints, profile] = await Promise.all([
        apiClient.getActiveAssessment(),
        apiClient.getLakes(),
        apiClient.getEventLogs(),
        apiClient.getSafePoints(),
        apiClient.getUserProfile(),
      ]);

      set({
        activeAssessment: assessment,
        alertLevel: assessment.level,
        lakes,
        events,
        safePoints,
        selectedSafePoint: safePoints.find((s) => s.isRecommended) || safePoints[0] || null,
        userProfile: profile,
        language: profile.language || 'en',
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to initialize app',
      });
    }
  },

  setAuth: (token: string, user?: UserAccount, profile?: UserProfile) => {
    set((state) => ({
      authToken: token,
      isAuthenticated: true,
      currentUser: user || state.currentUser,
      userProfile: profile || state.userProfile,
    }));
  },

  logout: () => {
    set({
      authToken: null,
      isAuthenticated: false,
      currentUser: null,
    });
  },

  setAlertLevel: async (level: AlertLevel) => {
    try {
      const assessment = await apiClient.updateThreatLevel(level);
      const events = await apiClient.getEventLogs(level);
      set({
        alertLevel: level,
        activeAssessment: assessment,
        events,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to switch alert level' });
    }
  },

  setLanguage: async (lang: LanguageCode) => {
    set({ language: lang });
    const profile = get().userProfile;
    if (profile) {
      await apiClient.updateUserProfile({ language: lang });
      set({ userProfile: { ...profile, language: lang } });
    }
  },

  setMapMode: (mode: 'EVACUATE' | 'NAVIGATE') => {
    set({ mapMode: mode });
  },

  setTargetPerson: (person: 'ME' | 'OTHER') => {
    set({ targetPerson: person });
  },

  toggleLegend: () => {
    set((state) => ({ isLegendOpen: !state.isLegendOpen }));
  },

  setSelectedSafePoint: (safePoint: SafePoint | null) => {
    set({ selectedSafePoint: safePoint });
  },

  toggleContact: async (contactId: string) => {
    const profile = get().userProfile;
    if (!profile) return;
    const target = profile.contacts.find((c) => c.contactId === contactId);
    if (!target) return;

    const nextState = !target.isActive;
    await apiClient.toggleContactDispatch(contactId, nextState);
    const updatedContacts = profile.contacts.map((c) =>
      c.contactId === contactId ? { ...c, isActive: nextState } : c
    );
    set({ userProfile: { ...profile, contacts: updatedContacts } });
  },

  addEmergencyContact: async (contactData) => {
    const newContact = await apiClient.addEmergencyContact(contactData);
    const profile = get().userProfile;
    if (profile) {
      set({
        userProfile: {
          ...profile,
          contacts: [...profile.contacts, newContact],
        },
        isAddContactModalOpen: false,
      });
    }
  },

  openSosModal: (open: boolean) => {
    set({ isSosModalOpen: open });
  },

  openAddContactModal: (open: boolean) => {
    set({ isAddContactModalOpen: open });
  },

  triggerEmergencySos: async () => {
    const { userProfile, alertLevel, userLocation } = get();
    const activeContactIds = (userProfile?.contacts || [])
      .filter((c) => c.isActive)
      .map((c) => c.contactId);

    const response = await apiClient.triggerEmergencySos({
      userId: userProfile?.userId || 'usr-anonymous',
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      elevationM: userLocation.elevationM,
      batteryPct: 88,
      networkStatus: 'IRIDIUM_SATELLITE_HYBRID',
      alertLevel,
      timestamp: new Date().toISOString(),
      recipientContactIds: activeContactIds,
    });

    set({ sosBroadcastResult: response });
    return response;
  },

  t: () => {
    const lang = get().language;
    return TRANSLATIONS[lang] || TRANSLATIONS.en;
  },
}));
