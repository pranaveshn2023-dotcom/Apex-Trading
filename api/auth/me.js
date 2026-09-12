// api/auth/me.js — GET /api/auth/me
import { authenticateSession } from '../../server/services/sessionSecurity.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    await new Promise((resolve) => authenticateSession(req, res, resolve));
    res.json({ success: true, user: req.user || null });
  } catch (err) {
    res.json({ success: true, user: null });
  }
}
