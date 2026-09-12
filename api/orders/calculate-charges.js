// api/orders/calculate-charges.js — POST /api/orders/calculate-charges
import { calculateCharges } from '../../server/services/portfolioEngine.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { product = 'CNC', action = 'BUY', price = 0, qty = 1 } = req.body || {};
    const charges = calculateCharges(product, action, parseFloat(price) || 0, parseInt(qty, 10) || 1);
    res.json({ success: true, data: charges });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
