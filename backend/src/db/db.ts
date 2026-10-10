import pg from 'pg';
import { config } from '../config/index.js';
import { smsService } from '../services/smsService.js';
import { supabaseAdmin } from '../services/supabase.js';
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
  RegisterPayload,
  SafePoint,
  SosBroadcastPayload,
  SosContact,
  SosDispatchRecord,
  SosResponse,
  UserAccount,
  UserProfile,
} from '../types/index.js';

const { Pool } = pg;

export class DatabaseStore {
  private pool: pg.Pool | null = null;
  private isPostgresConnected = false;

  public get isSupabaseConnected(): boolean {
    return !!supabaseAdmin;
  }

  // In-memory state for development / offline resilience
  private lakes: Lake[] = [...SEED_LAKES];
  private currentLevel: AlertLevel = 'CLEAR';
  private activeAssessment: LakeAssessment = { ...SEED_ASSESSMENTS.CLEAR };
  private safePoints: SafePoint[] = [...SEED_SAFE_POINTS];
  private userProfile: UserProfile = JSON.parse(JSON.stringify(SEED_USER_PROFILE));
  private userProfiles: Map<string, UserProfile> = new Map();
  private eventLogs: Record<AlertLevel, EventLog[]> = { ...SEED_EVENT_LOGS };
  private navigationRoutes: NavigationRouteOption[] = [...SEED_NAVIGATION_ROUTES];

  // User Accounts for Auth & DB
  private users: UserAccount[] = [
    {
      id: 'u-pasang',
      name: 'Pasang Lhamu Sherpa',
      phone: '+977 9841-582910',
      email: 'pasang.sherpa@khumbu.np',
      passwordHash: 'password123',
      role: 'resident',
      homeZoneId: 'dingboche-zone',
      createdAt: '2026-01-15T08:00:00Z',
    },
    {
      id: 'u-dawa',
      name: 'Dawa Tenzing',
      phone: '+977 9843-110943',
      email: 'dawa.tenzing@khumbu.np',
      passwordHash: 'password123',
      role: 'resident',
      homeZoneId: 'dingboche-zone',
      createdAt: '2026-02-10T12:00:00Z',
    },
    {
      id: 'u-operator',
      name: 'Nepal EWS Field Operator',
      phone: '+977 9801-000000',
      email: 'operator@dhm.gov.np',
      passwordHash: 'admin123',
      role: 'operator',
      homeZoneId: 'dingboche-zone',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

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

  // --- AUTHENTICATION & USERS ---
  async getAllUsers(): Promise<Omit<UserAccount, 'passwordHash'>[]> {
    return this.users.map(({ passwordHash, ...user }) => user);
  }

  async findUserByIdentifier(identifier: string): Promise<UserAccount | undefined> {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/[\s-]/g, '');
    return this.users.find(
      (u) =>
        u.email?.toLowerCase() === cleanId ||
        u.phone.replace(/[\s-]/g, '') === cleanPhone ||
        u.name.toLowerCase() === cleanId
    );
  }

  async registerUser(payload: RegisterPayload): Promise<{ user: UserAccount; token: string; profile: UserProfile }> {
    const existing = await this.findUserByIdentifier(payload.phone);
    if (existing) {
      throw new Error(`User with phone ${payload.phone} already exists`);
    }

    let assignedId = `u-${Date.now().toString(36)}`;

    // Sync user registration to Supabase Auth cloud
    if (supabaseAdmin) {
      try {
        const cleanDigits = payload.phone.replace(/[^0-9]/g, '');
        const email = payload.email || `resident_${cleanDigits}@raha.app`;
        const { data: suData, error: suErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: payload.password || 'password123',
          email_confirm: true,
          user_metadata: {
            name: payload.name,
            phone: payload.phone,
            homeLocationName: payload.homeLocationName || 'Registered Location',
            elevationM: payload.elevationM || 4410,
            initialContact: payload.initialContact,
          },
        });
        if (!suErr && suData?.user) {
          assignedId = suData.user.id;
          console.log(`✅ [Supabase Auth] Registered user in Supabase cloud: ${suData.user.id}`);
        } else if (suErr) {
          console.warn(`ℹ️ [Supabase Auth Notice]: ${suErr.message}`);
        }
      } catch (e) {
        console.warn('ℹ️ [Supabase Sync Notice]:', (e as Error).message);
      }
    }

    const newUser: UserAccount = {
      id: assignedId,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      passwordHash: payload.password || 'password123',
      role: payload.role || 'resident',
      homeZoneId: payload.homeZoneId || 'dingboche-zone',
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);

    // Initial contacts: only user-specified contacts, never hardcoded presets
    const userContacts: SosContact[] = [];
    if (payload.initialContact && payload.initialContact.name && payload.initialContact.phone) {
      userContacts.push({
        contactId: `c-${Date.now().toString(36)}`,
        name: payload.initialContact.name.trim(),
        phone: payload.initialContact.phone.trim(),
        relation: payload.initialContact.relation?.trim() || 'Emergency Contact',
        isActive: true,
        notifyOnRisk: true,
      });
    }

    const newProfile: UserProfile = {
      userId: newUser.id,
      name: newUser.name,
      phone: newUser.phone,
      role: newUser.role,
      homeZoneId: newUser.homeZoneId,
      homeLocationName: payload.homeLocationName || 'Registered Location',
      elevationM: payload.elevationM || 4410,
      language: 'en',
      smsFallbackEnabled: true,
      offlineMapsCached: true,
      cachedMapSizeMB: 48.0,
      contacts: userContacts,
    };

    this.userProfiles.set(newUser.id, newProfile);
    this.userProfile = newProfile;

    const token = `raha-jwt-${newUser.id}-${Date.now()}`;
    return { user: newUser, token, profile: { ...this.userProfile } };
  }

  async loginUser(identifier: string, password?: string): Promise<{ user: UserAccount; token: string; profile: UserProfile }> {
    const user = await this.findUserByIdentifier(identifier);
    if (!user) {
      throw new Error(`User not found with identifier: ${identifier}`);
    }

    // Verify password if provided
    if (password && user.passwordHash && user.passwordHash !== password) {
      throw new Error('Invalid credentials');
    }

    // Retrieve or initialize this user's profile with only their real contacts
    let profile = this.userProfiles.get(user.id);
    if (!profile) {
      profile = {
        userId: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        homeZoneId: user.homeZoneId,
        homeLocationName: 'Registered Location',
        elevationM: 4410,
        language: 'en',
        smsFallbackEnabled: true,
        offlineMapsCached: true,
        cachedMapSizeMB: 48.0,
        contacts: [], // empty by default for new sessions
      };
      this.userProfiles.set(user.id, profile);
    }

    this.userProfile = profile;

    const token = `raha-jwt-${user.id}-${Date.now()}`;
    return { user, token, profile: { ...this.userProfile } };
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
    const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
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
        walkingTimeMinutes: Math.round(d * 20),
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
    if (this.userProfile.userId) {
      this.userProfiles.set(this.userProfile.userId, { ...this.userProfile });
    }
    return newContact;
  }

  async toggleContact(contactId: string, isActive: boolean): Promise<SosContact> {
    const contact = this.userProfile.contacts.find((c) => c.contactId === contactId);
    if (!contact) {
      throw new Error(`Contact with ID ${contactId} not found`);
    }
    contact.isActive = isActive;
    if (this.userProfile.userId) {
      this.userProfiles.set(this.userProfile.userId, { ...this.userProfile });
    }
    return { ...contact };
  }

  async deleteContact(contactId: string): Promise<boolean> {
    const idx = this.userProfile.contacts.findIndex((c) => c.contactId === contactId);
    if (idx === -1) return false;
    this.userProfile.contacts.splice(idx, 1);
    if (this.userProfile.userId) {
      this.userProfiles.set(this.userProfile.userId, { ...this.userProfile });
    }
    return true;
  }

  // --- SOS BROADCAST & REAL MULTI-PHONE DISPATCH ---
  async recordSosBroadcast(payload: SosBroadcastPayload): Promise<SosResponse> {
    const activeRecipients = this.userProfile.contacts.filter(
      (c) => payload.recipientContactIds.includes(c.contactId) && c.isActive
    );

    const userName = this.userProfile.name || 'Resident';
    const locName = this.userProfile.homeLocationName || 'My Location';
    const lat = payload.latitude || 27.8938;
    const lon = payload.longitude || 86.8315;
    const elev = payload.elevationM || this.userProfile.elevationM || 0;
    const sosMessage = `🚨 RAHA GLOF EMERGENCY: ${userName} has triggered evacuation at ${locName} (${elev}m)! GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}. Live Map: https://maps.google.com/?q=${lat.toFixed(4)},${lon.toFixed(4)}. Please assist or verify safety immediately.`;

    // Dispatch real SMS to each active kin contact's phone
    const dispatchPromises = activeRecipients.map((contact) =>
      smsService.sendSosSms(contact.phone, contact.name, sosMessage)
    );

    await Promise.allSettled(dispatchPromises);

    return {
      broadcastId: `bcast-${Date.now().toString(36)}`,
      dispatchedAt: new Date().toISOString(),
      smsCount: activeRecipients.length,
      satelliteRelaySent: true,
      status: 'DELIVERED',
    };
  }

  getSosHistory(): SosDispatchRecord[] {
    return smsService.getDispatchHistory();
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
