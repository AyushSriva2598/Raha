import pg from 'pg';
import { config } from '../config/index.js';
import {
  SEED_LAKES,
  SEED_ASSESSMENTS,
  SEED_SAFE_POINTS,
  SEED_USER_PROFILE,
  SEED_EVENT_LOGS,
  SEED_NAVIGATION_ROUTES,
} from './seedData.js';
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
} from '../types/index.js';

const { Pool } = pg;

export class DatabaseStore {
  private pool: pg.Pool | null = null;
  private isPostgresConnected = false;

  // In-memory state for development / offline resilience
  private lakes: Lake[] = [...SEED_LAKES];
  private currentLevel: AlertLevel = 'CLEAR';
  private activeAssessment: LakeAssessment = { ...SEED_ASSESSMENTS.CLEAR };
  private safePoints: SafePoint[] = [...SEED_SAFE_POINTS];
  private userProfile: UserProfile = JSON.parse(JSON.stringify(SEED_USER_PROFILE));
  private eventLogs: Record<AlertLevel, EventLog[]> = { ...SEED_EVENT_LOGS };
  private navigationRoutes: NavigationRouteOption[] = [...SEED_NAVIGATION_ROUTES];

  constructor() {
    this.initPool();
  }

  private async initPool() {
    try {
      this.pool = new Pool({
        connectionString: config.databaseUrl,
        connectionTimeoutMillis: 2000,
      });

      const client = await this.pool.connect();
      client.release();
      this.isPostgresConnected = true;
      console.log('✅ PostgreSQL / PostGIS connected successfully');
    } catch {
      this.isPostgresConnected = false;
      console.log('ℹ️ Running in resilient in-memory mode (PostgreSQL not connected)');
    }
  }

  public get isConnected(): boolean {
    return this.isPostgresConnected;
  }

  // --- LAKES ---
  async getLakes(): Promise<Lake[]> {
    return [...this.lakes];
  }

  async getLakeById(lakeId: string): Promise<Lake | undefined> {
    return this.lakes.find((l) => l.lakeId === lakeId);
  }

  // --- ASSESSMENTS ---
  async getActiveAssessment(_zoneId?: string): Promise<LakeAssessment> {
    return { ...this.activeAssessment };
  }

  async setAssessmentLevel(level: AlertLevel): Promise<LakeAssessment> {
    this.currentLevel = level;
    this.activeAssessment = {
      ...SEED_ASSESSMENTS[level],
      timestamp: new Date().toISOString(),
    };
    return { ...this.activeAssessment };
  }

  async syncAssessmentFromAws(payload: Partial<LakeAssessment>): Promise<LakeAssessment> {
    const level = payload.level || this.currentLevel;
    this.currentLevel = level;
    this.activeAssessment = {
      ...this.activeAssessment,
      ...payload,
      timestamp: new Date().toISOString(),
    };
    return { ...this.activeAssessment };
  }

  // --- SAFE POINTS & SPATIAL QUERIES ---
  async getSafePoints(zoneId?: string): Promise<SafePoint[]> {
    if (zoneId) {
      return this.safePoints.filter((sp) => sp.zoneId === zoneId);
    }
    return [...this.safePoints];
  }

  async getNearestSafePoints(lat: number, lon: number, limit = 5): Promise<SafePoint[]> {
    // PostGIS Haversine distance calculation fallback
    const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Earth radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const ranked = [...this.safePoints].map((sp) => {
      const d = distanceKm(lat, lon, sp.coordinates.latitude, sp.coordinates.longitude);
      return {
        ...sp,
        distanceKm: Math.round(d * 100) / 100,
        walkingTimeMinutes: Math.round(d * 20), // Approx 20 min per km mountain terrain
      };
    });

    ranked.sort((a, b) => a.distanceKm - b.distanceKm);
    if (ranked.length > 0) {
      ranked[0].isRecommended = true;
    }
    return ranked.slice(0, limit);
  }

  // --- EVENT LOGS ---
  async getEventLogs(level?: AlertLevel): Promise<EventLog[]> {
    const targetLevel = level || this.currentLevel;
    return [...(this.eventLogs[targetLevel] || this.eventLogs.CLEAR)];
  }

  // --- USER PROFILE & SOS CONTACTS ---
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

  async addContact(contactData: Omit<SosContact, 'contactId'>): Promise<SosContact> {
    const newContact: SosContact = {
      ...contactData,
      contactId: `c-${Date.now().toString(36)}`,
    };
    this.userProfile.contacts.push(newContact);
    return newContact;
  }

  async toggleContact(contactId: string, isActive: boolean): Promise<SosContact> {
    const contact = this.userProfile.contacts.find((c) => c.contactId === contactId);
    if (!contact) {
      throw new Error(`Contact with ID ${contactId} not found`);
    }
    contact.isActive = isActive;
    return { ...contact };
  }

  async deleteContact(contactId: string): Promise<boolean> {
    const idx = this.userProfile.contacts.findIndex((c) => c.contactId === contactId);
    if (idx === -1) return false;
    this.userProfile.contacts.splice(idx, 1);
    return true;
  }

  // --- SOS BROADCAST & FANOUT ---
  async recordSosBroadcast(payload: SosBroadcastPayload): Promise<SosResponse> {
    const activeRecipients = this.userProfile.contacts.filter(
      (c) => payload.recipientContactIds.includes(c.contactId) && c.isActive
    );

    return {
      broadcastId: `bcast-${Date.now().toString(36)}`,
      dispatchedAt: new Date().toISOString(),
      smsCount: activeRecipients.length,
      satelliteRelaySent: true,
      status: 'DELIVERED',
    };
  }

  // --- NAVIGATION ROUTES ---
  async calculateRoutes(
    _origin: string,
    _destination: string,
    avoidHazards = true
  ): Promise<NavigationRouteOption[]> {
    if (avoidHazards) {
      return this.navigationRoutes.filter((r) => r.riskStatus === 'SAFE');
    }
    return [...this.navigationRoutes];
  }
}

export const db = new DatabaseStore();
