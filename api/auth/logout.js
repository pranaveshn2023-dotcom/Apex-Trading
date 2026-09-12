// api/auth/logout.js — POST /api/auth/logout
import { destroySession } from '../../server/services/sessionSecurity.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    await destroySession(req, res);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
