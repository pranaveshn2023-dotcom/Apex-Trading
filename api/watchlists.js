// api/watchlists/index.js — POST /api/watchlists/add and /api/watchlists/remove
import { loadUserPortfolio, upsertWatchlist, initD1Tables } from './_d1.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    const userId = req.headers['x-user-id'] || 'default';
    await initD1Tables();
    const { watchlistId, symbol, action = 'add' } = req.body;
    if (!watchlistId || !symbol) return res.status(400).json({ success: false, error: 'watchlistId and symbol required' });

    const portfolio = await loadUserPortfolio(userId);
    const watchlists = portfolio?.watchlists || [
      { id: 'default', name: 'Watchlist 1', symbols: [] },
      { id: 'wl-2', name: 'Watchlist 2', symbols: [] },
      { id: 'wl-3', name: 'Watchlist 3', symbols: [] },
      { id: 'wl-4', name: 'Watchlist 4', symbols: [] },
      { id: 'wl-5', name: 'Watchlist 5', symbols: [] }
    ];

    const wl = watchlists.find(w => w.id === watchlistId);
    if (!wl) return res.status(404).json({ success: false, error: 'Watchlist not found' });

    if (action === 'add') {
      if (!wl.symbols.includes(symbol)) wl.symbols.push(symbol);
    } else {
      wl.symbols = wl.symbols.filter(s => s !== symbol);
    }

    await upsertWatchlist(userId, wl);
    res.json({ success: true, data: watchlists });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}
