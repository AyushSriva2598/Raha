import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lrlfbmqmquooctzeiplz.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybGZibXFtcXVvb2N0emVpcGx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1OTE1OTMsImV4cCI6MjEwNzE2NzU5M30.cPnthB9ZIvRdigTLVFGFnWkNnvpe5g2yK5boiQA_kUY';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
