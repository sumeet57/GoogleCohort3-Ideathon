import { firestore } from '../firebase.js';
import { config } from '../config.js';

const collectionFor = (uid) => firestore.collection('users').doc(uid).collection('entries');

function sanitizeEntry(entry, uid, entryId) {
  const now = Date.now();
  const clean = {
    id: entryId,
    userId: uid,
    title: typeof entry.title === 'string' ? entry.title.trim().slice(0, 300) : 'Untitled Reflection',
    initialThought: typeof entry.initialThought === 'string' ? entry.initialThought.slice(0, config.MAX_ENTRY_TEXT_CHARS) : '',
    messages: Array.isArray(entry.messages) ? entry.messages.slice(-100).map((m) => ({
      id: String(m?.id || `msg-${now}-${Math.random().toString(36).slice(2)}`).slice(0, 200),
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      text: String(m?.text || '').slice(0, 20000),
      timestamp: Number.isFinite(Number(m?.timestamp)) ? Number(m.timestamp) : now,
      ...(m?.mode ? { mode: String(m.mode).slice(0, 30) } : {}),
      ...(m?.modelUsed ? { modelUsed: String(m.modelUsed).slice(0, 100) } : {})
    })) : [],
    synthesis: entry.synthesis && typeof entry.synthesis === 'object' ? {
      title: String(entry.synthesis.title || '').slice(0, 300),
      summary: String(entry.synthesis.summary || '').slice(0, 10000),
      insights: Array.isArray(entry.synthesis.insights) ? entry.synthesis.insights.slice(0, 30).map(String) : [],
      actionItems: Array.isArray(entry.synthesis.actionItems) ? entry.synthesis.actionItems.slice(0, 30).map(String) : [],
      dominantMood: String(entry.synthesis.dominantMood || '').slice(0, 100),
      tags: Array.isArray(entry.synthesis.tags) ? entry.synthesis.tags.slice(0, 30).map((x) => String(x).slice(0, 80)) : []
    } : null,
    mood: entry.mood ? String(entry.mood).slice(0, 100) : null,
    tags: Array.isArray(entry.tags) ? entry.tags.slice(0, 30).map((x) => String(x).slice(0, 80)) : [],
    wordCount: Number.isFinite(Number(entry.wordCount)) ? Math.max(0, Math.min(1000000, Number(entry.wordCount))) : 0,
    createdAt: Number.isFinite(Number(entry.createdAt)) ? Number(entry.createdAt) : now,
    updatedAt: now,
    isFavorite: Boolean(entry.isFavorite)
  };

  return clean;
}

export async function listEntries(uid) {
  const snapshot = await collectionFor(uid).orderBy('updatedAt', 'desc').get();
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
}

export async function getEntry(uid, entryId) {
  const doc = await collectionFor(uid).doc(entryId).get();
  if (!doc.exists) return null;
  return { ...doc.data(), id: doc.id };
}

export async function saveEntry(uid, entryId, entry) {
  const ref = collectionFor(uid).doc(entryId);
  const existing = await ref.get();
  const clean = sanitizeEntry(entry, uid, entryId);
  if (existing.exists) clean.createdAt = existing.data().createdAt ?? clean.createdAt;
  await ref.set(clean, { merge: true });
  return getEntry(uid, entryId);
}

export async function deleteEntry(uid, entryId) {
  await collectionFor(uid).doc(entryId).delete();
}

export async function toggleFavorite(uid, entryId) {
  const ref = collectionFor(uid).doc(entryId);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const next = !Boolean(doc.data().isFavorite);
  await ref.update({ isFavorite: next, updatedAt: Date.now() });
  return getEntry(uid, entryId);
}

export async function updateTitle(uid, entryId, title) {
  const ref = collectionFor(uid).doc(entryId);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update({ title: String(title).trim().slice(0, 300), updatedAt: Date.now() });
  return getEntry(uid, entryId);
}
