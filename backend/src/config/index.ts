import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/raha_db',
  awsWebhookSecret: process.env.AWS_WEBHOOK_SECRET || 'raha_internal_sagemaker_sync_secret_key_2026',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  // SMS & Real SOS Dispatch Configuration
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  textbeltApiKey: process.env.TEXTBELT_API_KEY || 'textbelt',
  emergencyWebhookUrl: process.env.EMERGENCY_WEBHOOK_URL || '',
  // Supabase Integration
  supabaseUrl: process.env.SUPABASE_URL || 'https://lrlfbmqmquooctzeiplz.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};
