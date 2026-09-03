import { firebaseAuth } from '../firebase.js';

export async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({ error: 'Missing Firebase ID token.' });
  }

  try {
    const decoded = await firebaseAuth.verifyIdToken(match[1]);
    req.user = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
      isAnonymous: decoded.firebase?.sign_in_provider === 'anonymous'
    };
    return next();
  } catch (error) {
    console.warn('[Auth] Invalid Firebase ID token:', error?.code || error?.message);
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}
