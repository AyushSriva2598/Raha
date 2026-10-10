-- ====================================================================
-- RAHA (Avalon) Glacial Threat Early Warning System
-- Supabase PostgreSQL Schema & Security Policies (RLS)
-- ====================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE,
    phone_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'resident',
    language TEXT NOT NULL DEFAULT 'en',
    home_zone_id TEXT DEFAULT 'dingboche-zone',
    home_location_name TEXT DEFAULT 'Dingboche Valley, Solukhumbu',
    elevation_m INT DEFAULT 4410,
    latitude DOUBLE PRECISION DEFAULT 27.8938,
    longitude DOUBLE PRECISION DEFAULT 86.8315,
    sms_fallback_enabled BOOLEAN DEFAULT TRUE,
    offline_maps_cached BOOLEAN DEFAULT TRUE,
    cached_map_size_mb NUMERIC(5,2) DEFAULT 48.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SOS Emergency Contacts (Real Kin Phones)
CREATE TABLE IF NOT EXISTS public.sos_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    relationship TEXT NOT NULL DEFAULT 'Emergency Kin',
    is_active BOOLEAN DEFAULT TRUE,
    notify_on_risk BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SOS Dispatches Audit Log
CREATE TABLE IF NOT EXISTS public.sos_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcast_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    location_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    elevation_m INT NOT NULL,
    alert_level TEXT NOT NULL,
    recipient_count INT NOT NULL,
    recipient_phones TEXT[] DEFAULT ARRAY[]::TEXT[],
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DELIVERED',
    dispatched_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Monitored Glacial Lakes
CREATE TABLE IF NOT EXISTS public.lakes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    basin TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Nepal',
    elevation_m INT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    volume_million_m3 NUMERIC(6,2),
    alert_level TEXT NOT NULL DEFAULT 'CLEAR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Safe Points / Evacuation Shelters
CREATE TABLE IF NOT EXISTS public.safe_points (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    elevation_m INT NOT NULL,
    elevation_gain_m INT NOT NULL,
    walking_time_minutes INT NOT NULL,
    capacity INT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    contact_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_points ENABLE ROW LEVEL SECURITY;

-- Permissive Read Policies for client access (authenticated & anon for early warning safety)
CREATE POLICY "Public read for lakes" ON public.lakes FOR SELECT USING (true);
CREATE POLICY "Public read for safe_points" ON public.safe_points FOR SELECT USING (true);
CREATE POLICY "Allow read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update profiles" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Allow read sos_contacts" ON public.sos_contacts FOR SELECT USING (true);
CREATE POLICY "Allow insert sos_contacts" ON public.sos_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update sos_contacts" ON public.sos_contacts FOR UPDATE USING (true);
CREATE POLICY "Allow read sos_dispatches" ON public.sos_dispatches FOR SELECT USING (true);
CREATE POLICY "Allow insert sos_dispatches" ON public.sos_dispatches FOR INSERT WITH CHECK (true);
