// Clean, decoupled API service client for Glacial Threat Early Warning
// Designed for seamless transition from mock/offline to AWS AppSync (GraphQL) & REST backend

import {
  AlertLevel,
  EventLog,
  Lake,
  LakeAssessment,
  NavigationRouteOption,
  SafePoint,
  SosBroadcastPayload,
  SosContact,
  SosResponse,
  UserProfile,
} from '@/types';
import {
  ASSESSMENTS_BY_LEVEL,
  MOCK_EVENT_LOGS,
  MOCK_NAVIGATION_ROUTES,
  MOCK_SAFE_POINTS,
  MOCK_USER_PROFILE,
  POC_LAKES,
} from './mockData';

export interface IGlacialThreatApiClient {
  getActiveAssessment(zoneId?: string): Promise<LakeAssessment>;
  getLakes(): Promise<Lake[]>;
  getSafePoints(zoneId?: string): Promise<SafePoint[]>;
  getEventLogs(level?: AlertLevel): Promise<EventLog[]>;
  getUserProfile(): Promise<UserProfile>;
  updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile>;
  toggleContactDispatch(contactId: string, isActive: boolean): Promise<SosContact>;
  addEmergencyContact(contact: Omit<SosContact, 'contactId'>): Promise<SosContact>;
  triggerEmergencySos(payload: SosBroadcastPayload): Promise<SosResponse>;
  setDemoScenarioLevel(level: AlertLevel): Promise<LakeAssessment>;
  calculateRoute(
    origin: string,
    destination: string,
    avoidHazards?: boolean
  ): Promise<NavigationRouteOption[]>;
}

class MockGlacialThreatApiClient implements IGlacialThreatApiClient {
  private currentLevel: AlertLevel = 'CLEAR';
  private userProfile: UserProfile = { ...MOCK_USER_PROFILE };
  private activeAssessment: LakeAssessment = { ...ASSESSMENTS_BY_LEVEL.CLEAR };

  async getActiveAssessment(_zoneId?: string): Promise<LakeAssessment> {
    return { ...this.activeAssessment };
  }

  async getLakes(): Promise<Lake[]> {
    return [...POC_LAKES];
  }

  async getSafePoints(_zoneId?: string): Promise<SafePoint[]> {
    return [...MOCK_SAFE_POINTS];
  }

  async getEventLogs(level?: AlertLevel): Promise<EventLog[]> {
    const targetLevel = level || this.currentLevel;
    return [...(MOCK_EVENT_LOGS[targetLevel] || MOCK_EVENT_LOGS.CLEAR)];
  }

  async getUserProfile(): Promise<UserProfile> {
    return { ...this.userProfile };
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    this.userProfile = {
      ...this.userProfile,
      ...updates,
    };
    return { ...this.userProfile };
  }

  async toggleContactDispatch(contactId: string, isActive: boolean): Promise<SosContact> {
    const contact = this.userProfile.contacts.find((c) => c.contactId === contactId);
    if (!contact) {
      throw new Error(`Contact with ID ${contactId} not found`);
    }
    contact.isActive = isActive;
    return { ...contact };
  }

  async addEmergencyContact(contactData: Omit<SosContact, 'contactId'>): Promise<SosContact> {
    const newContact: SosContact = {
      ...contactData,
      contactId: `c-${Date.now().toString(36)}`,
    };
    this.userProfile.contacts.push(newContact);
    return newContact;
  }

  async triggerEmergencySos(payload: SosBroadcastPayload): Promise<SosResponse> {
    // Simulates AWS SNS Topic Fanout & SQS delivery tracking (Section 14 & 16)
    return {
      broadcastId: `bcast-${Date.now().toString(36)}`,
      dispatchedAt: new Date().toISOString(),
      smsCount: payload.recipientContactIds.length,
      satelliteRelaySent: true,
      status: 'DELIVERED',
    };
  }

  async setDemoScenarioLevel(level: AlertLevel): Promise<LakeAssessment> {
    this.currentLevel = level;
    this.activeAssessment = {
      ...ASSESSMENTS_BY_LEVEL[level],
      timestamp: new Date().toISOString(),
    };
    return { ...this.activeAssessment };
  }

  async calculateRoute(
    _origin: string,
    _destination: string,
    _avoidHazards = true
  ): Promise<NavigationRouteOption[]> {
    return [...MOCK_NAVIGATION_ROUTES];
  }
}

// AWS AppSync / GraphQL / REST Client Adapter skeleton for future backend integration
class RemoteGlacialThreatApiClient implements IGlacialThreatApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getActiveAssessment(zoneId = 'dingboche-zone'): Promise<LakeAssessment> {
    const res = await fetch(`${this.baseUrl}/api/assessments/active?zoneId=${zoneId}`);
    return res.json();
  }

  async getLakes(): Promise<Lake[]> {
    const res = await fetch(`${this.baseUrl}/api/lakes`);
    return res.json();
  }

  async getSafePoints(zoneId = 'dingboche-zone'): Promise<SafePoint[]> {
    const res = await fetch(`${this.baseUrl}/api/safe-points?zoneId=${zoneId}`);
    return res.json();
  }

  async getEventLogs(level?: AlertLevel): Promise<EventLog[]> {
    const query = level ? `?level=${level}` : '';
    const res = await fetch(`${this.baseUrl}/api/events${query}`);
    return res.json();
  }

  async getUserProfile(): Promise<UserProfile> {
    const res = await fetch(`${this.baseUrl}/api/user/profile`);
    return res.json();
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`${this.baseUrl}/api/user/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  }

  async toggleContactDispatch(contactId: string, isActive: boolean): Promise<SosContact> {
    const res = await fetch(`${this.baseUrl}/api/user/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });
    return res.json();
  }

  async addEmergencyContact(contactData: Omit<SosContact, 'contactId'>): Promise<SosContact> {
    const res = await fetch(`${this.baseUrl}/api/user/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData),
    });
    return res.json();
  }

  async triggerEmergencySos(payload: SosBroadcastPayload): Promise<SosResponse> {
    const res = await fetch(`${this.baseUrl}/api/alerts/sos-broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async setDemoScenarioLevel(level: AlertLevel): Promise<LakeAssessment> {
    const res = await fetch(`${this.baseUrl}/api/scenario/set-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level }),
    });
    return res.json();
  }

  async calculateRoute(
    origin: string,
    destination: string,
    avoidHazards = true
  ): Promise<NavigationRouteOption[]> {
    const res = await fetch(`${this.baseUrl}/api/routes/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, avoidHazards }),
    });
    return res.json();
  }
}

// Export singleton instance based on environment variable
const remoteUrl = process.env.EXPO_PUBLIC_API_URL;
export const apiClient: IGlacialThreatApiClient = remoteUrl
  ? new RemoteGlacialThreatApiClient(remoteUrl)
  : new MockGlacialThreatApiClient();
