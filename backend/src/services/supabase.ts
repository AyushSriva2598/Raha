import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  if (config.supabaseUrl && config.supabaseServiceRoleKey) {
    try {
      supabaseClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      return supabaseClient;
    } catch (e) {
      console.warn('⚠️ [Supabase] Failed to initialize Supabase client:', (e as Error).message);
    }
  }
  return null;
}

export const supabaseAdmin = getSupabaseAdmin();
