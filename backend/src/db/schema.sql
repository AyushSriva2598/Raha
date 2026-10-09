-- Raha Glacial Threat Early Warning System
-- PostgreSQL + PostGIS Database Schema
-- Matches implementation_plan_backend.md Section 2.4 & PRD v2.0

-- Enable PostGIS spatial extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Glacial Lakes
CREATE TABLE IF NOT EXISTS lakes (
    id TEXT PRIMARY KEY, -- e.g. 'imja-tsho', 'tsho-rolpa', 'south-lhonak'
    name TEXT NOT NULL,
    basin TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Nepal',
    elevation_m INT NOT NULL,
    coordinates GEOMETRY(Point, 4326) NOT NULL,
    volume_million_m3 NUMERIC(6,2),
    last_satellite_pass TIMESTAMPTZ,
    satellite_sources TEXT[] DEFAULT ARRAY['Sentinel-2', 'Sentinel-1 SAR', 'Landsat-9'],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lakes_geo ON lakes USING GIST(coordinates);

-- 2. Downstream Inundation Hazard Zones
CREATE TABLE IF NOT EXISTS zones (
    id TEXT PRIMARY KEY, -- e.g. 'dingboche-zone', 'namche-zone-1', 'chungthang-core'
    lake_id TEXT REFERENCES lakes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    basin TEXT NOT NULL,
    elevation_m INT NOT NULL,
    distance_from_lake_km NUMERIC(5,2),
    population_estimate INT,
    geometry GEOMETRY(Polygon, 4326),
    arrival_window_min INT NOT NULL, -- Minimum minutes from dam breach to surge front arrival
    arrival_window_max INT NOT NULL, -- Maximum estimated minutes
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_zones_geo ON zones USING GIST(geometry);

-- 3. Safe Points & High Ground Evacuation Shelters
CREATE TABLE IF NOT EXISTS safe_points (
    id TEXT PRIMARY KEY,
    zone_id TEXT REFERENCES zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'high_ground', 'medical_shelter', 'community_hall', 'ridge_camp'
    location GEOMETRY(Point, 4326) NOT NULL,
    elevation_m INT NOT NULL,
    elevation_gain_m INT NOT NULL,
    walking_time_minutes INT NOT NULL,
    capacity INT NOT NULL,
    contact_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_safepoints_geo ON safe_points USING GIST(location);

-- 4. User Profiles & Legal Consent (India DPDP Act & Nepal Disaster Risk Reduction Act)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'resident', -- 'resident', 'authority', 'operator'
    language TEXT NOT NULL DEFAULT 'en', -- 'en', 'hi', 'ne'
    home_zone_id TEXT REFERENCES zones(id),
    elevation_m INT,
    sms_fallback_enabled BOOLEAN DEFAULT TRUE,
    offline_maps_cached BOOLEAN DEFAULT FALSE,
    cached_map_size_mb NUMERIC(5,2) DEFAULT 0,
    consent_flags JSONB DEFAULT '{"emergency_sms": true, "location_tracking": true, "data_sharing_drr": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SOS Emergency Contacts (up to 5 per user)
CREATE TABLE IF NOT EXISTS sos_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    relationship TEXT NOT NULL, -- 'Sister', 'Brother', 'Mother', 'Father', 'Village Elder', 'Neighbor'
    is_active BOOLEAN DEFAULT TRUE,
    notify_on_risk BOOLEAN DEFAULT TRUE,
    opt_in_status TEXT DEFAULT 'CONFIRMED', -- 'PENDING', 'CONFIRMED', 'OPTED_OUT'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Realtime Glacial Lake Assessments (Updated via AWS ML Bridge Webhook)
CREATE TABLE IF NOT EXISTS lake_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lake_id TEXT REFERENCES lakes(id) ON DELETE CASCADE,
    level TEXT NOT NULL, -- 'CLEAR', 'WATCH', 'WARNING', 'EVACUATE'
    headline TEXT NOT NULL,
    instruction TEXT NOT NULL,
    arrival_window TEXT NOT NULL,
    outflow_rate_m3s NUMERIC(8,2) DEFAULT 0,
    lake_area_change_pct NUMERIC(5,2) DEFAULT 0,
    sar_backscatter_change_db NUMERIC(5,2) DEFAULT 0,
    temp_anomaly_celsius NUMERIC(5,2) DEFAULT 0,
    contributing_factors TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    summary_text TEXT NOT NULL,
    data_age_min INT NOT NULL DEFAULT 15,
    model_version TEXT NOT NULL DEFAULT 'chronos-v2.1+xgb-himalaya',
    authority_broadcast_code TEXT,
    is_simulated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lake_assessments_level ON lake_assessments(lake_id, created_at DESC);

-- 7. Audit Log of Telemetry & Assessment Events
CREATE TABLE IF NOT EXISTS event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lake_id TEXT REFERENCES lakes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    source TEXT NOT NULL, -- 'Sentinel-2 STAC', 'Sentinel-1 SAR', 'DHM Nepal Acoustic Gauge', 'AWS Bedrock'
    type TEXT NOT NULL, -- 'gauge', 'sar', 'satellite', 'authority', 'weather'
    level TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SOS Emergency Broadcast Dispatches
CREATE TABLE IF NOT EXISTS sos_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    location GEOMETRY(Point, 4326),
    elevation_m INT,
    battery_pct INT,
    network_status TEXT,
    alert_level TEXT NOT NULL,
    sms_count INT NOT NULL DEFAULT 0,
    satellite_relay_sent BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'DELIVERED', -- 'DELIVERED', 'QUEUED', 'FALLBACK_SMS'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
