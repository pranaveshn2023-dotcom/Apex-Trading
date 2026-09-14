// api/auth/google.js — POST /api/auth/google & /api/auth/google-oauth
import { createSecureSession } from '../../server/services/sessionSecurity.js';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { credential, token, accessToken, profile, googleId, email, name, picture } = req.body || {};
    let user = null;

    const idToken = credential || token;

    // Path 1: Google One-Tap / ID Token
    if (idToken) {
      try {
        const verifyRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, { timeout: 6000 });
        if (verifyRes.data?.sub && verifyRes.data?.email) {
          user = {
            id: verifyRes.data.sub,
            email: verifyRes.data.email,
            name: verifyRes.data.name || verifyRes.data.email.split('@')[0],
            picture: verifyRes.data.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${verifyRes.data.email}`,
            role: 'trader'
          };
        }
      } catch {
        try {
          const base64Url = idToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
          const decoded = JSON.parse(jsonPayload);
          user = {
            id: decoded.sub,
            name: decoded.name || decoded.email?.split('@')[0],
            email: decoded.email,
            picture: decoded.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${decoded.email}`,
            role: 'trader'
          };
        } catch (e) {
          console.error('JWT decode error:', e.message);
        }
      }
    }

    // Path 2: OAuth Access Token
    if (!user && accessToken) {
      try {
        const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 8000
        });
        if (userInfoRes.data?.email) {
          const info = userInfoRes.data;
          user = {
            id: info.sub,
            email: info.email,
            name: info.name || info.email.split('@')[0],
            picture: info.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${info.email}`,
            role: 'trader'
          };
        }
      } catch (err) {
        console.error('Failed to fetch user info with accessToken:', err.message);
      }
    }

    // Path 3: Direct Profile Payload
    if (!user && (profile?.email || email)) {
      const userEmail = profile?.email || email;
      const sub = profile?.sub || profile?.id || googleId || `usr_${Buffer.from(userEmail).toString('base64').replace(/=/g, '').substring(0, 12)}`;
      user = {
        id: sub,
        name: profile?.name || name || userEmail.split('@')[0],
        email: userEmail,
        picture: profile?.picture || picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${userEmail}`,
        role: 'trader'
      };
    }

    if (!user) {
      return res.status(400).json({ success: false, error: 'Unable to identify user from Google authentication payload' });
    }

    try {
      await createSecureSession(req, res, user);
    } catch (e) {
      console.warn('createSecureSession warning:', e.message);
    }

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    res.json({
      success: true,
      user,
      data: {
        user,
        sessionId
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}
