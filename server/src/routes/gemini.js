import { Router } from 'express';
import { z } from 'zod';
import { reflect, summarize } from '../services/gemini.js';
import { config } from '../config.js';

const router = Router();

const reflectSchema = z.object({
  prompt: z.string().trim().min(1).max(config.MAX_PROMPT_CHARS),
  history: z.array(z.object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant']),
    text: z.string().max(20000),
    timestamp: z.number().optional(),
    mode: z.string().optional(),
    modelUsed: z.string().optional()
  })).max(100).optional().default([]),
  mode: z.enum(['reflect', 'brainstorm', 'deepen', 'summarize']).optional().default('reflect'),
  entryContext: z.string().max(config.MAX_ENTRY_TEXT_CHARS).optional().default('')
});

const summarizeSchema = z.object({
  text: z.string().trim().min(1).max(config.MAX_ENTRY_TEXT_CHARS),
  title: z.string().max(500).optional().default('')
});

router.post('/reflect', async (req, res, next) => {
  try {
    const body = reflectSchema.parse(req.body);
    const result = await reflect(body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/summarize', async (req, res, next) => {
  try {
    const body = summarizeSchema.parse(req.body);
    const result = await summarize(body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
