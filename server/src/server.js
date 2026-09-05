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
    project: config.GOOGLE_CLOUD_PROJECT,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/me', requireAuth, apiLimiter, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/location/geocode', requireAuth, apiLimiter, async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid lat and lng parameters are required.' });
    }

    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY || config.GOOGLE_MAPS_API_KEY;
    if (!mapsApiKey) {
      return res.json({
        placeName: `Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
        address: ''
      });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${mapsApiKey}`
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const topResult = data.results[0];
      const address = topResult.formatted_address;
      const placeName = data.results[1]?.address_components[0]?.long_name || address.split(',')[0];

      return res.json({ address, placeName });
    }

    res.json({ placeName: `Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`, address: '' });
  } catch (error) {
    console.error('[Geocoding Error]', error);
    res.status(500).json({ error: 'Failed to reverse geocode coordinates.' });
  }
});

app.use('/api/gemini', requireAuth, aiLimiter, geminiRoutes);
app.use('/api/entries', requireAuth, apiLimiter, entriesRoutes);

app.use(notFound);
app.use(errorHandler);
const PORT = Number(process.env.PORT || config.PORT || 8080);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Personal Gemini Journal server listening on port ${PORT}`);
  console.log(`Model: ${config.GEMINI_MODEL}`);
  console.log(`Google Cloud project: ${config.GOOGLE_CLOUD_PROJECT}`);
});
