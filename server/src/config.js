import 'dotenv/config';
import { z } from 'zod';

const csv = (value) => value.split(',').map((v) => v.trim()).filter(Boolean);

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  GOOGLE_CLOUD_PROJECT: z.string().min(1),
  GOOGLE_CLOUD_LOCATION: z.string().default('global'),
  GEMINI_API_KEY_SECRET_ID: z.string().min(1).default('gemini-api-key'),
  GEMINI_API_KEY_SECRET_VERSION: z.string().min(1).default('latest'),
  GEMINI_MODEL: z.string().min(1).default('gemini-3.7-flash'),
  GEMINI_THINKING_LEVEL: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  MAX_BODY_BYTES: z.string().default('256kb'),
  MAX_HISTORY_MESSAGES: z.coerce.number().int().min(1).max(100).default(24),
  MAX_HISTORY_CHARS: z.coerce.number().int().min(1000).max(200000).default(30000),
  MAX_ENTRY_TEXT_CHARS: z.coerce.number().int().min(1000).max(500000).default(50000),
  MAX_PROMPT_CHARS: z.coerce.number().int().min(100).max(50000).default(8000),
  AI_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  AI_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120)
});

const env = envSchema.parse(process.env);

export const config = {
  ...env,
  corsOrigins: csv(env.CORS_ORIGINS)
};
