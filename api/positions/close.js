// api/positions/close.js — POST /api/positions/close
import {
  loadUserPortfolio,
  savePortfolioBalance,
  deletePosition,
  upsertOrder,
  upsertJournalEntry,
  initD1Tables
} from '../_d1.js';
import { getQuote } from '../../server/services/marketData.js';

function calculateCharges(product, action, price, qty) {
  const tradeValue = price * qty;
  const brokerage = Math.min(20, tradeValue * 0.0005);
  const stt = product === 'CNC'
    ? tradeValue * 0.001
    : action === 'SELL' ? tradeValue * 0.00025 : 0;
  const exchangeCharge = tradeValue * 0.0000297;
  const sebi = (tradeValue / 10000000) * 10;
  const gst = (brokerage + exchangeCharge + sebi) * 0.18;
  return Math.round((brokerage + stt + exchangeCharge + sebi + gst) * 100) / 100;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    const userId = req.headers['x-user-id'] || 'default';
    await initD1Tables();
    const positionId = req.body?.positionId || req.body?.id || req.query?.id || (req.url ? req.url.split('?')[0].split('/').filter(Boolean).slice(-2, -1)[0] : null);
    const exitThesis = req.body?.exitThesis || '';
    if (!positionId) return res.status(400).json({ success: false, error: 'positionId required' });

    const portfolio = await loadUserPortfolio(userId);
    if (!portfolio) return res.status(404).json({ success: false, error: 'Portfolio not found' });

    const pos = (portfolio.positions || []).find(p => p.id === positionId);
    if (!pos) return res.status(404).json({ success: false, error: 'Position not found' });

    const quote = await getQuote(pos.symbol);
    const exitPrice = quote?.price || pos.entryPrice;
    const closeAction = pos.type === 'BUY' ? 'SELL' : 'BUY';
    const charges = calculateCharges(pos.product, closeAction, exitPrice, pos.qty);
    const tradeValue = exitPrice * pos.qty;
    const pnl = pos.type === 'BUY'
      ? (exitPrice - pos.entryPrice) * pos.qty - charges
      : (pos.entryPrice - exitPrice) * pos.qty - charges;

    portfolio.cashBalance += (tradeValue - charges);
    portfolio.realizedPnl = (portfolio.realizedPnl || 0) + pnl;

    const orderId = `ORD_CLOSE_${Date.now()}`;
    await upsertOrder(userId, {
      id: orderId, symbol: pos.symbol, name: pos.name,
      type: closeAction, orderType: 'MARKET', product: pos.product,
      qty: pos.qty, price: exitPrice, executedPrice: exitPrice,
      status: 'EXECUTED', charges, thesis: exitThesis || '', timestamp: new Date().toISOString()
    });

    await upsertJournalEntry(userId, {
      id: `JRN_${Date.now()}`,
      orderId, symbol: pos.symbol,
      entryDate: pos.timestamp, exitDate: new Date().toISOString(),
      entryPrice: pos.entryPrice, exitPrice,
      qty: pos.qty, pnl,
      thesis: exitThesis || pos.thesis, strategy: '', rating: 0, lessons: ''
    });

    await deletePosition(userId, positionId);
    await savePortfolioBalance(userId, portfolio.cashBalance, portfolio.initialCapital || 0, portfolio.realizedPnl);

    const updated = await loadUserPortfolio(userId);
    res.json({ success: true, data: { pnl, exitPrice }, portfolio: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}
