// api/portfolio/order.js — POST /api/orders
import {
  loadUserPortfolio,
  savePortfolioBalance,
  upsertOrder,
  upsertPosition,
  upsertHolding,
  initD1Tables
} from './_d1.js';
import { getQuote } from '../server/services/marketData.js';

function calculateCharges(product, action, price, qty) {
  const tradeValue = price * qty;
  const brokerage = Math.min(20, tradeValue * 0.0005);
  const stt = product === 'CNC'
    ? tradeValue * 0.001
    : action === 'SELL' ? tradeValue * 0.00025 : 0;
  const exchangeCharge = tradeValue * 0.0000297;
  const sebi = (tradeValue / 10000000) * 10;
  const gst = (brokerage + exchangeCharge + sebi) * 0.18;
  const dpCharge = (product === 'CNC' && action === 'SELL') ? 15.93 : 0;
  return Math.round((brokerage + stt + exchangeCharge + sebi + gst + dpCharge) * 100) / 100;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const userId = req.headers['x-user-id'] || 'default';
    await initD1Tables();
    const portfolio = await loadUserPortfolio(userId) || {
      cashBalance: 0, holdings: [], positions: []
    };

    const { symbol, action, orderType = 'MARKET', qty, price, limitPrice, product = 'CNC', thesis, stopLoss, target } = req.body;
    if (!symbol || !action || !qty) return res.status(400).json({ success: false, error: 'Missing required fields' });

    const sanitizedQty = parseInt(qty, 10);
    if (!Number.isInteger(sanitizedQty) || sanitizedQty <= 0)
      return res.status(400).json({ success: false, error: 'Invalid quantity' });

    // Get live price for market orders
    let executedPrice = parseFloat(price || limitPrice || 0);
    if (orderType === 'MARKET' || !executedPrice) {
      const quote = await getQuote(symbol);
      executedPrice = quote?.price || executedPrice;
    }
    if (!executedPrice || executedPrice <= 0)
      return res.status(400).json({ success: false, error: 'Could not determine execution price' });

    const charges = calculateCharges(product, action, executedPrice, sanitizedQty);
    const tradeValue = executedPrice * sanitizedQty;

    // Validate balance for BUY
    if (action === 'BUY') {
      const totalCost = tradeValue + charges;
      if (portfolio.cashBalance < totalCost)
        return res.status(400).json({ success: false, error: `Insufficient margin. Need ₹${totalCost.toFixed(2)}, Available: ₹${portfolio.cashBalance.toFixed(2)}` });
      portfolio.cashBalance -= totalCost;
    } else {
      // SELL — return value minus charges
      portfolio.cashBalance += (tradeValue - charges);
    }

    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const order = {
      id: orderId,
      symbol,
      name: symbol,
      type: action,
      orderType,
      product,
      qty: sanitizedQty,
      price: executedPrice,
      executedPrice,
      status: 'EXECUTED',
      charges,
      thesis: thesis || '',
      timestamp: new Date().toISOString()
    };

    await upsertOrder(userId, order);

    // Update positions/holdings
    if (product === 'CNC') {
      // Delivery: update holdings
      const existing = (portfolio.holdings || []).find(h => h.symbol === symbol);
      if (action === 'BUY') {
        const newQty = (existing?.qty || 0) + sanitizedQty;
        const newTotalInvested = (existing?.totalInvested || 0) + tradeValue;
        const holding = {
          symbol, name: symbol,
          qty: newQty,
          avgPrice: newTotalInvested / newQty,
          totalInvested: newTotalInvested
        };
        await upsertHolding(userId, holding);
      } else if (existing) {
        const newQty = existing.qty - sanitizedQty;
        const newTotalInvested = existing.totalInvested * (newQty / existing.qty);
        await upsertHolding(userId, { ...existing, qty: newQty, totalInvested: newTotalInvested, avgPrice: existing.avgPrice });
      }
    } else {
      // MIS: update positions
      const posId = `POS_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await upsertPosition(userId, {
        id: posId,
        symbol, name: symbol, type: action, product,
        qty: sanitizedQty, entryPrice: executedPrice,
        stopLoss: stopLoss || 0, target: target || 0,
        thesis: thesis || '', timestamp: new Date().toISOString()
      });
    }

    await savePortfolioBalance(userId, portfolio.cashBalance, portfolio.initialCapital || 0, portfolio.realizedPnl || 0);
    const updatedPortfolio = await loadUserPortfolio(userId);

    res.json({ success: true, data: order, portfolio: updatedPortfolio });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}
