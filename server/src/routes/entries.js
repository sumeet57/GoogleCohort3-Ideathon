import { Router } from 'express';
import { z } from 'zod';
import { deleteEntry, getEntry, listEntries, saveEntry, toggleFavorite, updateTitle } from '../services/entries.js';

const router = Router();
const idSchema = z.string().regex(/^[A-Za-z0-9_-]{1,150}$/);

router.get('/', async (req, res, next) => {
  try {
    const entries = await listEntries(req.user.uid);
    res.json({ entries });
  } catch (error) {
    next(error);
  }
});

router.get('/:entryId', async (req, res, next) => {
  try {
    const entryId = idSchema.parse(req.params.entryId);
    const entry = await getEntry(req.user.uid, entryId);
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    return res.json({ entry });
  } catch (error) {
    next(error);
  }
});

router.put('/:entryId', async (req, res, next) => {
  try {
    const entryId = idSchema.parse(req.params.entryId);
    const entry = await saveEntry(req.user.uid, entryId, req.body || {});
    res.json({ entry });
  } catch (error) {
    next(error);
  }
});

router.patch('/:entryId/favorite', async (req, res, next) => {
  try {
    const entryId = idSchema.parse(req.params.entryId);
    const entry = await toggleFavorite(req.user.uid, entryId);
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    return res.json({ entry });
  } catch (error) {
    next(error);
  }
});

router.patch('/:entryId/title', async (req, res, next) => {
  try {
    const entryId = idSchema.parse(req.params.entryId);
    const title = z.string().trim().min(1).max(300).parse(req.body?.title);
    const entry = await updateTitle(req.user.uid, entryId, title);
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    return res.json({ entry });
  } catch (error) {
    next(error);
  }
});

router.delete('/:entryId', async (req, res, next) => {
  try {
    const entryId = idSchema.parse(req.params.entryId);
    await deleteEntry(req.user.uid, entryId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
