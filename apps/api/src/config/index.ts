import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment from project root .env
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config(); // fallback to local directory

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/school_erp?schema=public',
  sessionSecret: process.env.SESSION_SECRET || 'dev-super-secret-session-key-change-in-production-min-32-chars',
  sessionExpiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS || '24', 10),
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'INR',
  defaultCurrencySymbol: process.env.DEFAULT_CURRENCY_SYMBOL || '₹',
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
  uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../../uploads/private'),
};
