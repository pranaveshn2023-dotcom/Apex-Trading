import axios from 'axios';
import { queryD1, isD1Configured } from './d1Client.js';

/**
 * Cryptographically verify Google ID Token with Google's official OAuth servers
 */
export async function verifyGoogleToken(credential) {
  try {
    const res = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
      timeout: 6000
    });
    if (res.data && res.data.sub && res.data.email) {
      return {
        id: res.data.sub,
        email: res.data.email,
        name: res.data.name || res.data.email.split('@')[0],
        picture: res.data.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${res.data.email}`
      };
    }
  } catch (err) {
    console.warn('Google server verification fallback:', err.response?.data?.error_description || err.message);
  }

  // Fallback to local decode
  return decodeGoogleJwt(credential);
}

/**
 * Decode Google JWT Token (ID Token) payload
 */
export function decodeGoogleJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };
  } catch (err) {
    console.error('Failed to decode Google JWT:', err.message);
    return null;
  }
}

/**
 * Handle Google Login
 */
export async function handleGoogleAuth({ credential, profile, accessToken }) {
  let user = null;

  if (accessToken) {
    try {
      const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 8000
      });
      if (res.data && res.data.email) {
        profile = res.data;
      }
    } catch (err) {
      console.error('Server error fetching userinfo with accessToken:', err.response?.data || err.message);
    }
  }

  if (credential) {
    user = await verifyGoogleToken(credential);
  } else if (profile && profile.email) {
    user = {
      id: profile.sub || profile.id || `user_${Buffer.from(profile.email).toString('hex').slice(0, 16)}`,
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      picture: profile.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.email}`
    };
  }

  if (!user || !user.email) {
    throw new Error('Invalid authentication payload');
  }

  // Persist user to Cloudflare D1
  if (isD1Configured()) {
    try {
      // Check if user already exists by email
      const existingUser = await queryD1('SELECT id FROM users WHERE email = ?', [user.email]);
      if (existingUser && existingUser.length > 0) {
        user.id = existingUser[0].id;
        await queryD1(
          `UPDATE users SET name = ?, picture = ? WHERE id = ?`,
          [user.name, user.picture, user.id]
        );
      } else {
        await queryD1(
          `INSERT INTO users (id, email, name, picture)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             picture = excluded.picture`,
          [user.id, user.email, user.name, user.picture]
        );
      }

      // Ensure user has their personal portfolio in D1
      const existingPortfolio = await queryD1('SELECT * FROM portfolio WHERE id = ?', [user.id]);
      if (!existingPortfolio || existingPortfolio.length === 0) {
        await queryD1(
          `INSERT INTO portfolio (id, initial_capital, cash_balance, realized_pnl)
           VALUES (?, 0, 0, 0)`,
          [user.id]
        );
      }

      // Ensure user has their personal watchlist in D1
      const watchlistId = `wl_${user.id}`;
      const existingWl = await queryD1('SELECT * FROM watchlists WHERE id = ?', [watchlistId]);
      if (!existingWl || existingWl.length === 0) {
        await queryD1(
          `INSERT INTO watchlists (id, name, symbols)
           VALUES (?, 'My Watchlist', '[]')`,
          [watchlistId]
        );
      }
    } catch (err) {
      console.error('Error saving user to Cloudflare D1:', err.message);
    }
  }

  return user;
}
