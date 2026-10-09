import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/raha_db',
  awsWebhookSecret: process.env.AWS_WEBHOOK_SECRET || 'raha_internal_sagemaker_sync_secret_key_2026',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
