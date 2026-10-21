import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function required(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

function optionalInt(key: string, fallback: number): number {
  const val = process.env[key];
  return val ? parseInt(val, 10) : fallback;
}

export const config = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: optionalInt('PORT', 3000),
  clientUrl: optional('CLIENT_URL', 'http://localhost:5173'),

  database: {
    url: required('DATABASE_URL'),
    host: optional('DB_HOST', 'localhost'),
    port: optionalInt('DB_PORT', 5432),
    name: optional('DB_NAME', 'estateflow'),
    user: optional('DB_USER', 'estateflow'),
    password: optional('DB_PASSWORD', 'estateflow_dev'),
  },

  jwt: {
    secret: required('JWT_SECRET'),
    accessExpiry: optional('JWT_ACCESS_EXPIRY', '15m'),
    refreshExpiry: optional('JWT_REFRESH_EXPIRY', '7d'),
  },

  bcrypt: {
    rounds: optionalInt('BCRYPT_ROUNDS', 10),
  },

  upload: {
    dir: optional('UPLOAD_DIR', './uploads'),
    maxFileSizeMb: optionalInt('MAX_FILE_SIZE_MB', 10),
    allowedImageTypes: optional('ALLOWED_IMAGE_TYPES', 'image/jpeg,image/png,image/webp').split(','),
  },

  rateLimit: {
    windowMs: optionalInt('RATE_LIMIT_WINDOW_MS', 900000),
    maxRequests: optionalInt('RATE_LIMIT_MAX_REQUESTS', 100),
    authMax: optionalInt('AUTH_RATE_LIMIT_MAX', 20),
    otpMax: optionalInt('OTP_RATE_LIMIT_MAX', 5),
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },

  whatsapp: {
    token: process.env.WHATSAPP_TOKEN || '',
    phoneId: process.env.WHATSAPP_PHONE_ID || '',
  },

  mapbox: {
    token: process.env.MAPBOX_TOKEN || '',
  },
} as const;

export default config;
