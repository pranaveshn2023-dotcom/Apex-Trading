// api/orders/cancel.js — POST /api/orders/:id/cancel
import { loadUserPortfolio, savePortfolioBalance, cancelOrderInStore, initD1Tables } from '../_d1.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const userId = req.headers['x-user-id'] || 'default';
    await initD1Tables();
    const orderId = req.body?.id || req.body?.orderId || req.query?.id || (req.url ? req.url.split('?')[0].split('/').filter(Boolean).slice(-2, -1)[0] : null);

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId is required' });
    }

    const portfolio = await loadUserPortfolio(userId);
    const order = (portfolio?.orders || []).find(o => o.id === orderId);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Order is already cancelled' });
    }

    // Refund blocked margin on BUY orders if applicable
    if ((order.type === 'BUY' || order.action === 'BUY') && (order.status === 'PENDING' || order.status === 'AMO')) {
      const blocked = (order.price || order.executedPrice || 0) * (order.qty || 1) + (order.charges || 0);
      portfolio.cashBalance = +(portfolio.cashBalance + blocked).toFixed(2);
      await savePortfolioBalance(userId, portfolio.cashBalance, portfolio.initialCapital || 0, portfolio.realizedPnl || 0);
    }

    await cancelOrderInStore(userId, orderId);

    const updatedPortfolio = await loadUserPortfolio(userId);
    const updatedOrder = (updatedPortfolio?.orders || []).find(o => o.id === orderId) || { ...order, status: 'CANCELLED' };

    res.json({ success: true, data: updatedOrder, portfolio: updatedPortfolio });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}
