import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from './config.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';
import geminiRoutes from './routes/gemini.js';
import entriesRoutes from './routes/entries.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin || config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

app.use(express.json({ limit: config.MAX_BODY_BYTES }));
app.use(express.urlencoded({ extended: false, limit: config.MAX_BODY_BYTES }));

const apiLimiter = rateLimit({
  windowMs: config.API_RATE_LIMIT_WINDOW_MS,
  limit: config.API_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again shortly.' }
});

const aiLimiter = rateLimit({
  windowMs: config.AI_RATE_LIMIT_WINDOW_MS,
  limit: config.AI_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.uid || req.ip,
  message: { error: 'AI request limit reached. Please wait before generating more reflections.' }
});

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'personal-gemini-journal-server',
    model: config.GEMINI_MODEL,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/me', requireAuth, apiLimiter, (req, res) => {
  res.json({ user: req.user });
});

app.use('/api/gemini', requireAuth, aiLimiter, geminiRoutes);
app.use('/api/entries', requireAuth, apiLimiter, entriesRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Personal Gemini Journal server listening on port ${config.PORT}`);
  console.log(`Model: ${config.GEMINI_MODEL}`);
  console.log(`Google Cloud project: ${config.GOOGLE_CLOUD_PROJECT}`);
});
