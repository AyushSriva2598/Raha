// Raha Glacial Threat Backend Domain Types
// Compatible with Frontend src/types/index.ts and DB Schema

export type AlertLevel = 'CLEAR' | 'WATCH' | 'WARNING' | 'EVACUATE';

export interface Lake {
  lakeId: string;
  name: string;
  region: string;
  country: string;
  elevationM: number;
  latitude: number;
  longitude: number;
  downstreamBasin: string;
  volumeMillionM3: number;
  lastSatellitePass: string;
  satelliteSources: string[];
}

export interface LakeAssessment {
  lakeId: string;
  timestamp: string;
  level: AlertLevel;
  headline: string;
  instruction: string;
  arrivalWindow: string;
  dataAge: string;
  outflowRateM3s: number;
  lakeAreaChangePct: number;
  sarBackscatterChangeDb: number;
  tempAnomalyCelsius: number;
  contributingFactors: string[];
  modelVersion: string;
  authorityBroadcastCode?: string;
}

export interface DownstreamZone {
  zoneId: string;
  lakeId: string;
  name: string;
  basin: string;
  elevationM: number;
  distanceFromLakeKm: number;
  populationEstimate: number;
  currentLevel: AlertLevel;
  arrivalWindowRange: string;
  isUserZone?: boolean;
}

export type SafePointType = 'high_ground' | 'medical_shelter' | 'community_hall' | 'ridge_camp';

export interface SafePoint {
  pointId: string;
  zoneId: string;
  name: string;
  type: SafePointType;
  elevationGainM: number;
  walkingTimeMinutes: number;
  distanceKm: number;
  capacityPct: number;
  capacityLabel: string;
  gradientLabel: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  contactPhone: string;
  isRecommended: boolean;
  notes: string;
}

export interface EventLog {
  eventId: string;
  lakeId: string;
  title: string;
  source: string;
  timestamp: string;
  type: 'gauge' | 'sar' | 'satellite' | 'authority' | 'weather';
  level: AlertLevel;
  details?: string;
}

export interface SosContact {
  contactId: string;
  name: string;
  relation: string;
  phone: string;
  isActive: boolean;
  notifyOnRisk: boolean;
}

export interface UserProfile {
  userId: string;
  name: string;
  phone: string;
  role: 'resident' | 'authority' | 'operator';
  homeZoneId: string;
  homeLocationName: string;
  elevationM: number;
  language: 'en' | 'hi' | 'ne';
  smsFallbackEnabled: boolean;
  offlineMapsCached: boolean;
  cachedMapSizeMB: number;
  contacts: SosContact[];
}

export interface SosBroadcastPayload {
  userId: string;
  latitude: number;
  longitude: number;
  elevationM: number;
  batteryPct: number;
  networkStatus: string;
  alertLevel: AlertLevel;
  timestamp: string;
  recipientContactIds: string[];
}

export interface SosResponse {
  broadcastId: string;
  dispatchedAt: string;
  smsCount: number;
  satelliteRelaySent: boolean;
  status: 'DELIVERED' | 'QUEUED' | 'FALLBACK_SMS';
}

export interface NavigationRouteOption {
  routeId: string;
  title: string;
  distanceKm: number;
  durationMinutes: number;
  elevationGainM: number;
  hazardAvoided: boolean;
  riskStatus: 'SAFE' | 'AT_RISK';
  summary: string;
}

export interface AssessmentSyncPayload {
  lakeId: string;
  level: AlertLevel;
  headline: string;
  instruction: string;
  arrivalWindow: string;
  outflowRateM3s?: number;
  lakeAreaChangePct?: number;
  sarBackscatterChangeDb?: number;
  tempAnomalyCelsius?: number;
  contributingFactors?: string[];
  summaryText?: string;
  modelVersion?: string;
  authorityBroadcastCode?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  phone: string;
  email?: string;
  passwordHash?: string;
  role: 'resident' | 'authority' | 'operator';
  homeZoneId: string;
  createdAt: string;
}

export interface LoginPayload {
  identifier: string; // phone or email
  password?: string;
  code?: string;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  email?: string;
  password?: string;
  homeZoneId?: string;
  role?: 'resident' | 'authority' | 'operator';
  homeLocationName?: string;
  latitude?: number;
  longitude?: number;
  elevationM?: number;
  initialContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

export interface SosDispatchRecord {
  id: string;
  recipientPhone: string;
  recipientName: string;
  status: 'SENT' | 'SIMULATED' | 'WEBHOOK_DELIVERED' | 'FAILED';
  carrierMessageId?: string;
  timestamp: string;
  messageText: string;
}
