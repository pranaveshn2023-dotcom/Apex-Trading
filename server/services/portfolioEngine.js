import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getQuote } from './marketData.js';
import { syncStateToD1, loadStateFromD1, isD1Configured } from './d1Client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const PORTFOLIO_FILE = process.env.VERCEL
  ? path.join('/tmp', 'portfolio.json')
  : path.join(DATA_DIR, 'portfolio.json');

const INITIAL_CAPITAL = 0; // Starts fresh at ₹0

let state = {
  initialCapital: INITIAL_CAPITAL,
  cashBalance: INITIAL_CAPITAL,
  realizedPnl: 0,
  settings: {
    enableCharges: true,
    defaultProduct: 'CNC', // 'CNC' (Delivery) or 'MIS' (Intraday)
    slippagePct: 0.05, // 0.05%
  },
  holdings: [], // Delivery portfolio { symbol, name, sector, qty, avgPrice, totalInvested }
  positions: [], // Active open positions { id, symbol, name, sector, type: 'BUY'|'SELL', product: 'MIS'|'CNC', qty, entryPrice, stopLoss, target, timestamp, thesis, journalNotes }
  orders: [], // History of all orders { id, symbol, name, type: 'BUY'|'SELL', orderType: 'MARKET'|'LIMIT'|'SL', product, qty, price, executedPrice, status: 'EXECUTED'|'PENDING'|'CANCELLED'|'REJECTED', charges, timestamp, thesis }
  journal: [], // In-depth trade journal entries { id, orderId, symbol, entryDate, exitDate, tradeType, entryPrice, exitPrice, qty, pnl, pnlPct, thesis, strategy, rating, lessons, tags }
  watchlists: [
    { id: 'default', name: 'Watchlist 1', symbols: ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'TATAMOTORS.NS'] },
    { id: 'wl-2', name: 'Watchlist 2', symbols: [] },
    { id: 'wl-3', name: 'Watchlist 3', symbols: [] },
    { id: 'wl-4', name: 'Watchlist 4', symbols: [] },
    { id: 'wl-5', name: 'Watchlist 5', symbols: [] }
  ]
};

// Load saved portfolio from disk and sync with Cloudflare D1
export async function initPortfolio() {
  try {
    if (!fs.existsSync(DATA_DIR) && !process.env.VERCEL) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {}

  const sourceFile = fs.existsSync(PORTFOLIO_FILE)
    ? PORTFOLIO_FILE
    : path.join(DATA_DIR, 'portfolio.json');

  if (fs.existsSync(sourceFile)) {
    try {
      const data = fs.readFileSync(sourceFile, 'utf-8');
      state = { ...state, ...JSON.parse(data) };
      console.log('Portfolio state loaded successfully from disk.');
    } catch (err) {
      console.error('Error loading portfolio state:', err);
    }
  }

  // If Cloudflare D1 is configured, synchronize with Cloudflare D1
  if (isD1Configured()) {
    try {
      const d1State = await loadStateFromD1();
      if (d1State && (d1State.initialCapital > 0 || d1State.orders.length > 0 || d1State.watchlists.some(w => w.symbols.length > 0))) {
        state = { ...state, ...d1State };
        console.log('Portfolio state successfully synchronized from Cloudflare D1 (axtrade-db)!');
        fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(state, null, 2), 'utf-8');
      } else {
        await syncStateToD1(state);
        console.log('Connected to Cloudflare D1 (axtrade-db). Initialized remote tables.');
      }
    } catch (err) {
      console.error('Cloudflare D1 initialization error:', err.message);
    }
  }
}

function savePortfolio() {
  try {
    fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving portfolio:', err);
  }

  // Asynchronously sync to Cloudflare D1
  if (isD1Configured()) {
    syncStateToD1(state).catch(err => console.error('Cloudflare D1 sync error:', err.message));
  }
}

/**
 * Calculate Groww official brokerage and statutory charges (Groww Equity Pricing)
 * - Equity Delivery (CNC): ₹20 or 0.05% per executed order (whichever is lower)
 * - Equity Intraday (MIS): ₹20 or 0.05% per executed order (whichever is lower)
 * - DP Charges: ₹13.50 + 18% GST (₹15.93) per company on sell side (CNC)
 * - STT: 0.1% on Buy & Sell for CNC; 0.025% on Sell for MIS
 * - Exchange Turnover Charges: 0.00297% (NSE)
 * - SEBI Turnover Charges: ₹10 / Crore (0.0001%)
 * - Stamp Duty: 0.015% on Buy for CNC; 0.003% on Buy for MIS
 * - GST: 18% on (Brokerage + Exchange Turnover + SEBI Charges)
 */
export function calculateCharges(product, action, price, qty) {
  if (!state.settings.enableCharges) {
    return { brokerage: 0, stt: 0, exchangeTurnover: 0, gst: 0, sebiCharges: 0, stampDuty: 0, dpCharges: 0, total: 0 };
  }

  const turnover = price * qty;
  
  // Groww Brokerage: ₹20 or 0.05% of trade value (whichever is lower) for both CNC and MIS
  const brokerage = +Math.min(20, turnover * 0.0005).toFixed(2);
  
  let stt = 0;
  let stampDuty = 0;
  let dpCharges = 0;

  if (product === 'CNC') {
    // Delivery: STT 0.1% on buy & sell
    stt = Math.round(turnover * 0.001);
    if (action === 'BUY') {
      stampDuty = Math.round(turnover * 0.00015); // 0.015%
    } else {
      dpCharges = 15.93; // Groww DP Charge: ₹13.50 + 18% GST per company debit
    }
  } else {
    // Intraday (MIS): STT 0.025% on sell side only
    if (action === 'SELL') {
      stt = Math.round(turnover * 0.00025);
    }
    if (action === 'BUY') {
      stampDuty = Math.round(turnover * 0.00003); // 0.003%
    }
  }

  const exchangeTurnover = +(turnover * 0.0000297).toFixed(2); // NSE 0.00297%
  const sebiCharges = +(turnover * 0.000001).toFixed(2); // ₹10 per crore
  const gst = +((brokerage + exchangeTurnover + sebiCharges) * 0.18).toFixed(2); // 18% GST
  const total = +(brokerage + stt + exchangeTurnover + gst + sebiCharges + stampDuty + dpCharges).toFixed(2);

  return {
    brokerage,
    stt,
    exchangeTurnover,
    gst,
    sebiCharges,
    stampDuty,
    dpCharges,
    total
  };
}

/**
 * Check if the exchange is actively open for a given symbol
 * - Indian Equities (NSE/BSE): Mon-Fri 9:15 AM - 3:30 PM IST
 * - US Equities: Mon-Fri 7:00 PM - 1:30 AM IST (or standard 8:00 PM - 2:30 AM IST)
 */
export function isMarketOpenForSymbol(symbol) {
  const now = new Date();
  // Convert to IST (UTC + 5:30)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 3600000 * 5.5);
  
  const day = ist.getDay(); // 0 = Sunday, 6 = Saturday
  const totalMinutes = ist.getHours() * 60 + ist.getMinutes();

  const isUS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', '^GSPC', '^IXIC', '^DJI'].includes(symbol)
    || (!symbol.endsWith('.NS') && !symbol.endsWith('.BO') && !symbol.startsWith('^NSE') && !symbol.startsWith('^BSE') && !symbol.startsWith('^CNX') && !symbol.startsWith('^CRSLDX'));

  if (isUS) {
    const openMinutes = 19 * 60; // 7:00 PM IST
    const closeMinutes = 1 * 60 + 30; // 1:30 AM IST
    if (day >= 1 && day <= 5 && totalMinutes >= openMinutes) return true;
    if (day >= 2 && day <= 6 && totalMinutes < closeMinutes) return true;
    return false;
  }

  // Indian Equities
  if (day === 0 || day === 6) return false;
  return totalMinutes >= (9 * 60 + 15) && totalMinutes < (15 * 60 + 30);
}

/**
 * Cancel an open / pending / AMO order
 */
export async function cancelOrder(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  if (order.status !== 'AMO' && order.status !== 'PENDING') {
    throw new Error(`Cannot cancel order with status: ${order.status}`);
  }
  order.status = 'CANCELLED';
  order.cancelledAt = new Date().toISOString();

  // Refund blocked capital on BUY orders so wallet balance restores immediately
  if ((order.action === 'BUY' || order.type === 'BUY') && order.blockedCapital) {
    state.cashBalance = +(state.cashBalance + order.blockedCapital).toFixed(2);
    order.blockedCapital = 0;
  }

  savePortfolio();
  return order;
}

/**
 * Execute or place an order
 */
export async function placeOrder({
  symbol,
  name,
  sector,
  action, // 'BUY' or 'SELL'
  product = 'CNC', // 'CNC' or 'MIS'
  orderType = 'MARKET', // 'MARKET', 'LIMIT', 'SL'
  qty,
  limitPrice,
  stopLoss,
  target,
  thesis = '',
  tags = []
}) {
  const quote = await getQuote(symbol);
  const marketPrice = quote.price;
  qty = parseInt(qty, 10);

  if (!qty || qty <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  const marketOpen = isMarketOpenForSymbol(symbol);
  let executionPrice = marketPrice;
  let status = 'EXECUTED';

  if (!marketOpen) {
    // Non-market hours constraint:
    // Order is TAKEN and queued as AMO (After-Market Order)
    // BUT NOT PROCESSED to buy or sell stock (funds & positions untouched)
    status = 'AMO';
    executionPrice = limitPrice || marketPrice;

    // Validate that user has necessary resources before taking AMO
    const charges = calculateCharges(product, action, executionPrice, qty);
    const requiredCapital = executionPrice * qty + charges.total;

    if (action === 'BUY' && state.cashBalance < requiredCapital) {
      throw new Error(`Insufficient funds for AMO order. Required: ₹${requiredCapital.toLocaleString('en-IN', { maximumFractionDigits: 2 })}, Available: ₹${state.cashBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
    }

    if (action === 'SELL' && product === 'CNC') {
      const holdingIndex = state.holdings.findIndex(h => h.symbol === symbol);
      const availableQty = holdingIndex >= 0 ? state.holdings[holdingIndex].qty : 0;
      if (availableQty < qty) {
        throw new Error(`Cannot place AMO SELL order. Insufficient holdings: Available ${availableQty}, Attempted ${qty}`);
      }
    }
  } else if (orderType === 'LIMIT') {
    if (!limitPrice || limitPrice <= 0) {
      throw new Error('Limit price is required for LIMIT order');
    }
    if ((action === 'BUY' && limitPrice < marketPrice) || (action === 'SELL' && limitPrice > marketPrice)) {
      status = 'PENDING';
      executionPrice = limitPrice;
    } else {
      executionPrice = limitPrice;
    }
  } else if (orderType === 'SL') {
    if (!stopLoss || stopLoss <= 0) {
      throw new Error('Stop loss trigger price is required');
    }
    status = 'PENDING';
    executionPrice = stopLoss;
  }

  const charges = calculateCharges(product, action, executionPrice, qty);
  const requiredCapital = executionPrice * qty + charges.total;

  const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const orderRecord = {
    id: orderId,
    symbol,
    name: name || quote.name,
    sector: sector || quote.sector,
    action,
    product,
    orderType,
    qty,
    price: limitPrice || stopLoss || marketPrice,
    executedPrice: status === 'EXECUTED' ? executionPrice : null,
    charges: charges.total,
    chargesBreakdown: charges,
    stopLoss: stopLoss || null,
    target: target || null,
    status,
    isAMO: !marketOpen,
    message: !marketOpen ? 'After-Market Order (AMO) placed. Market is closed; order will be queued for market open.' : undefined,
    thesis,
    tags,
    blockedCapital: action === 'BUY' ? requiredCapital : 0,
    timestamp: new Date().toISOString()
  };

  if (action === 'BUY') {
    if (state.cashBalance < requiredCapital) {
      throw new Error(`Insufficient funds. Required: ₹${requiredCapital.toLocaleString('en-IN', { maximumFractionDigits: 2 })}, Available: ₹${state.cashBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
    }

    // Immediately decrease wallet margin so user sees accurate balance after every BUY
    state.cashBalance = +(state.cashBalance - requiredCapital).toFixed(2);

    if (status === 'EXECUTED') {

      if (product === 'CNC') {
        // Add or average down holding
        const existingIndex = state.holdings.findIndex(h => h.symbol === symbol);
        if (existingIndex >= 0) {
          const prev = state.holdings[existingIndex];
          const totalQty = prev.qty + qty;
          const totalCost = (prev.qty * prev.avgPrice) + (qty * executionPrice);
          const newAvgPrice = +(totalCost / totalQty).toFixed(2);
          state.holdings[existingIndex] = {
            ...prev,
            qty: totalQty,
            avgPrice: newAvgPrice,
            totalInvested: +(totalQty * newAvgPrice).toFixed(2)
          };
        } else {
          state.holdings.push({
            symbol,
            name: name || quote.name,
            sector: sector || quote.sector,
            qty,
            avgPrice: executionPrice,
            totalInvested: +(qty * executionPrice).toFixed(2)
          });
        }
      }

      // Add to open positions for tracking & stop-loss management
      state.positions.push({
        id: `POS-${Date.now()}`,
        orderId,
        symbol,
        name: name || quote.name,
        sector: sector || quote.sector,
        action: 'BUY',
        product,
        qty,
        entryPrice: executionPrice,
        stopLoss: stopLoss || null,
        target: target || null,
        thesis,
        tags,
        entryDate: new Date().toISOString()
      });

    } else if (action === 'SELL') {
      if (product === 'CNC') {
        const holdingIndex = state.holdings.findIndex(h => h.symbol === symbol);
        if (holdingIndex < 0 || state.holdings[holdingIndex].qty < qty) {
          throw new Error(`Insufficient holdings to sell. Available: ${holdingIndex >= 0 ? state.holdings[holdingIndex].qty : 0}`);
        }

        const holding = state.holdings[holdingIndex];
        const proceeds = (executionPrice * qty) - charges.total;
        const buyCost = holding.avgPrice * qty;
        const tradePnl = +(proceeds - buyCost).toFixed(2);
        const pnlPct = +(((executionPrice - holding.avgPrice) / holding.avgPrice) * 100).toFixed(2);

        state.cashBalance += proceeds;
        state.realizedPnl += tradePnl;

        if (holding.qty === qty) {
          state.holdings.splice(holdingIndex, 1);
        } else {
          holding.qty -= qty;
          holding.totalInvested = +(holding.qty * holding.avgPrice).toFixed(2);
        }

        // Add to Trade Journal
        state.journal.push({
          id: `JRN-${Date.now()}`,
          orderId,
          symbol,
          name: name || quote.name,
          sector: sector || quote.sector,
          product,
          action: 'SELL',
          qty,
          entryPrice: holding.avgPrice,
          exitPrice: executionPrice,
          pnl: tradePnl,
          pnlPct,
          charges: charges.total,
          thesis: thesis || 'Portfolio Rebalancing',
          tags: tags || ['Delivery', 'Long Term'],
          entryDate: new Date(Date.now() - 86400000).toISOString(),
          exitDate: new Date().toISOString(),
          lessons: ''
        });

      } else {
        // MIS Short / Exit
        const proceeds = (executionPrice * qty) - charges.total;
        state.cashBalance += proceeds;

        // Exit corresponding BUY position if exists
        const posIndex = state.positions.findIndex(p => p.symbol === symbol && p.product === 'MIS' && p.qty >= qty);
        if (posIndex >= 0) {
          const pos = state.positions[posIndex];
          const tradePnl = +((executionPrice - pos.entryPrice) * qty - charges.total).toFixed(2);
          const pnlPct = +(((executionPrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2);
          state.realizedPnl += tradePnl;

          state.journal.push({
            id: `JRN-${Date.now()}`,
            orderId,
            symbol,
            name: name || quote.name,
            sector: sector || quote.sector,
            product: 'MIS',
            action: 'SELL_EXIT',
            qty,
            entryPrice: pos.entryPrice,
            exitPrice: executionPrice,
            pnl: tradePnl,
            pnlPct,
            charges: charges.total,
            thesis: pos.thesis || thesis || 'Intraday Setup',
            tags: pos.tags || tags || ['Intraday'],
            entryDate: pos.entryDate,
            exitDate: new Date().toISOString(),
            lessons: ''
          });

          if (pos.qty === qty) {
            state.positions.splice(posIndex, 1);
          } else {
            pos.qty -= qty;
          }
        }
      }
    }
  }

  state.orders.unshift(orderRecord);
  savePortfolio();

  return orderRecord;
}

/**
 * Square off / exit position
 */
export async function closePosition(positionId, exitThesis = '') {
  const posIndex = state.positions.findIndex(p => p.id === positionId);
  if (posIndex < 0) {
    throw new Error('Position not found');
  }

  const pos = state.positions[posIndex];
  const quote = await getQuote(pos.symbol);
  const exitPrice = quote.price;
  const charges = calculateCharges(pos.product, 'SELL', exitPrice, pos.qty);

  const grossProceeds = exitPrice * pos.qty;
  const netProceeds = grossProceeds - charges.total;
  const cost = pos.entryPrice * pos.qty;
  const tradePnl = +(netProceeds - cost).toFixed(2);
  const pnlPct = +(((exitPrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2);

  state.cashBalance += netProceeds;
  state.realizedPnl += tradePnl;

  if (pos.product === 'CNC') {
    const hIndex = state.holdings.findIndex(h => h.symbol === pos.symbol);
    if (hIndex >= 0) {
      if (state.holdings[hIndex].qty <= pos.qty) {
        state.holdings.splice(hIndex, 1);
      } else {
        state.holdings[hIndex].qty -= pos.qty;
        state.holdings[hIndex].totalInvested = +(state.holdings[hIndex].qty * state.holdings[hIndex].avgPrice).toFixed(2);
      }
    }
  }

  // Remove position
  state.positions.splice(posIndex, 1);

  // Record completed trade in journal
  state.journal.unshift({
    id: `JRN-${Date.now()}`,
    symbol: pos.symbol,
    name: pos.name,
    sector: pos.sector,
    product: pos.product,
    action: 'CLOSE',
    qty: pos.qty,
    entryPrice: pos.entryPrice,
    exitPrice,
    pnl: tradePnl,
    pnlPct,
    charges: charges.total,
    thesis: pos.thesis,
    exitThesis: exitThesis || 'Manual Target / Exit',
    tags: pos.tags || [],
    entryDate: pos.entryDate,
    exitDate: new Date().toISOString(),
    lessons: ''
  });

  // Record sell order
  state.orders.unshift({
    id: `ORD-EXIT-${Date.now()}`,
    symbol: pos.symbol,
    name: pos.name,
    action: 'SELL',
    product: pos.product,
    orderType: 'MARKET',
    qty: pos.qty,
    price: exitPrice,
    executedPrice: exitPrice,
    charges: charges.total,
    chargesBreakdown: charges,
    status: 'EXECUTED',
    thesis: exitThesis || 'Closed Position',
    timestamp: new Date().toISOString()
  });

  savePortfolio();
  return { pnl: tradePnl, pnlPct, exitPrice };
}

/**
 * Check and process pending Limit & Stop Loss orders against current prices
 */
export async function checkPendingOrders() {
  let changed = false;
  for (const order of state.orders) {
    if (order.status === 'PENDING') {
      const quote = await getQuote(order.symbol);
      const ltp = quote.price;

      let trigger = false;
      if (order.orderType === 'LIMIT') {
        if (order.action === 'BUY' && ltp <= order.price) trigger = true;
        if (order.action === 'SELL' && ltp >= order.price) trigger = true;
      } else if (order.orderType === 'SL') {
        if (order.action === 'SELL' && ltp <= order.price) trigger = true;
        if (order.action === 'BUY' && ltp >= order.price) trigger = true;
      }

      if (trigger) {
        order.status = 'EXECUTED';
        order.executedPrice = ltp;
        changed = true;
        // Adjust balance/holdings for executed pending order
        if (order.action === 'BUY') {
          const cost = ltp * order.qty + (order.charges || 0);
          state.cashBalance = Math.max(0, state.cashBalance - cost);
          state.holdings.push({
            symbol: order.symbol,
            name: order.name,
            sector: order.sector,
            qty: order.qty,
            avgPrice: ltp,
            totalInvested: +(order.qty * ltp).toFixed(2)
          });
        }
      }
    }
  }

  if (changed) savePortfolio();
}

/**
 * Get enriched Portfolio Summary with live prices & P&L
 */
export async function getPortfolioSummary() {
  await checkPendingOrders();

  let totalHoldingsValue = 0;
  let totalInvested = 0;

  // Parallel quote fetching for holdings
  const holdingPromises = state.holdings.map(async (h) => {
    let quote;
    try {
      quote = await getQuote(h.symbol);
    } catch {
      quote = { price: h.avgPrice, change: 0, changePercent: 0 };
    }
    const ltp = quote.price ?? h.avgPrice;
    const curValue = +(ltp * h.qty).toFixed(2);
    const pnl = +(curValue - h.totalInvested).toFixed(2);
    const pnlPct = h.avgPrice > 0 ? +(((ltp - h.avgPrice) / h.avgPrice) * 100).toFixed(2) : 0;
    const dayChange = +(((quote.change || 0) * h.qty)).toFixed(2);

    return {
      ...h,
      currentPrice: ltp,
      currentValue: curValue,
      pnl,
      pnlPct,
      dayChange,
      changePercent: quote.changePercent || 0
    };
  });

  const enrichedHoldings = await Promise.all(holdingPromises);
  for (const h of enrichedHoldings) {
    totalHoldingsValue += h.currentValue;
    totalInvested += h.totalInvested;
  }

  // Parallel quote fetching for positions
  const positionPromises = state.positions.map(async (p) => {
    let quote;
    try {
      quote = await getQuote(p.symbol);
    } catch {
      quote = { price: p.entryPrice };
    }
    const ltp = quote.price ?? p.entryPrice;
    const curVal = ltp * p.qty;
    const cost = p.entryPrice * p.qty;
    const pnl = +(curVal - cost).toFixed(2);
    const pnlPct = p.entryPrice > 0 ? +(((ltp - p.entryPrice) / p.entryPrice) * 100).toFixed(2) : 0;

    return {
      ...p,
      currentPrice: ltp,
      currentValue: +curVal.toFixed(2),
      pnl,
      pnlPct
    };
  });

  const enrichedPositions = await Promise.all(positionPromises);
  let positionsUnrealizedPnl = 0;
  for (const p of enrichedPositions) {
    positionsUnrealizedPnl += p.pnl;
  }

  const holdingsUnrealizedPnl = +(totalHoldingsValue - totalInvested).toFixed(2);
  const totalPortfolioValue = +(state.cashBalance + totalHoldingsValue).toFixed(2);
  const totalReturn = +(totalPortfolioValue - state.initialCapital).toFixed(2);
  const totalReturnPct = +(((totalPortfolioValue - state.initialCapital) / state.initialCapital) * 100).toFixed(2);

  // Sector allocation
  const sectorMap = {};
  for (const h of enrichedHoldings) {
    const s = h.sector || 'Others';
    sectorMap[s] = (sectorMap[s] || 0) + h.currentValue;
  }
  const sectorBreakdown = Object.entries(sectorMap).map(([sector, value]) => ({
    sector,
    value: +value.toFixed(2),
    percent: totalHoldingsValue > 0 ? +((value / totalHoldingsValue) * 100).toFixed(1) : 0
  })).sort((a, b) => b.value - a.value);

  // Stock picking analytics
  const completedTrades = state.journal;
  const winTrades = completedTrades.filter(t => t.pnl > 0);
  const lossTrades = completedTrades.filter(t => t.pnl < 0);
  const totalWins = winTrades.reduce((acc, t) => acc + t.pnl, 0);
  const totalLosses = Math.abs(lossTrades.reduce((acc, t) => acc + t.pnl, 0));
  const winRate = completedTrades.length > 0 ? +((winTrades.length / completedTrades.length) * 100).toFixed(1) : 0;
  const profitFactor = totalLosses > 0 ? +(totalWins / totalLosses).toFixed(2) : totalWins > 0 ? 999 : 0;
  const avgWin = winTrades.length > 0 ? +(totalWins / winTrades.length).toFixed(2) : 0;
  const avgLoss = lossTrades.length > 0 ? +(totalLosses / lossTrades.length).toFixed(2) : 0;
  const bestTrade = completedTrades.length > 0 ? completedTrades.reduce((max, t) => t.pnl > max.pnl ? t : max, completedTrades[0]) : null;

  return {
    initialCapital: state.initialCapital,
    cashBalance: +state.cashBalance.toFixed(2),
    totalHoldingsValue: +totalHoldingsValue.toFixed(2),
    totalInvested: +totalInvested.toFixed(2),
    totalPortfolioValue,
    holdingsUnrealizedPnl,
    positionsUnrealizedPnl: +positionsUnrealizedPnl.toFixed(2),
    realizedPnl: +state.realizedPnl.toFixed(2),
    totalReturn,
    totalReturnPct,
    holdings: enrichedHoldings,
    positions: enrichedPositions,
    orders: state.orders,
    journal: state.journal,
    watchlists: state.watchlists,
    settings: state.settings,
    analytics: {
      totalTrades: completedTrades.length,
      winCount: winTrades.length,
      lossCount: lossTrades.length,
      winRate,
      profitFactor,
      avgWin,
      avgLoss,
      bestTrade,
      sectorBreakdown
    }
  };
}

/**
 * Update available cash balance directly (without wiping existing holdings)
 */
export async function updateCashBalance(newCashAmount) {
  const amount = parseFloat(newCashAmount);
  if (isNaN(amount) || amount < 0) {
    throw new Error('Please enter a valid positive INR amount');
  }
  state.cashBalance = amount;
  state.initialCapital = Math.max(state.initialCapital, amount);
  savePortfolio();
  return await getPortfolioSummary();
}

/**
 * Reset portfolio or set custom initial funds
 */
export async function resetPortfolio(customCapital = 0) {
  const cap = (customCapital !== undefined && customCapital !== null && !isNaN(Number(customCapital))) ? Math.max(0, Number(customCapital)) : 0;
  state.initialCapital = cap;
  state.cashBalance = cap;
  state.realizedPnl = 0;
  state.holdings = [];
  state.positions = [];
  state.orders = [];
  state.journal = [];
  savePortfolio();
  return await getPortfolioSummary();
}

/**
 * Update Journal entry notes, thesis or lessons
 */
export function updateJournalEntry(id, updates) {
  const entry = state.journal.find(j => j.id === id);
  if (!entry) throw new Error('Journal entry not found');
  Object.assign(entry, updates);
  savePortfolio();
  return entry;
}

/**
 * Watchlist management
 */
export function addSymbolToWatchlist(watchlistId, symbol) {
  const wl = state.watchlists.find(w => w.id === watchlistId) || state.watchlists[0];
  if (!wl.symbols.includes(symbol)) {
    wl.symbols.push(symbol);
    savePortfolio();
  }
  return state.watchlists;
}

export function removeSymbolFromWatchlist(watchlistId, symbol) {
  const wl = state.watchlists.find(w => w.id === watchlistId);
  if (wl) {
    wl.symbols = wl.symbols.filter(s => s !== symbol);
    savePortfolio();
  }
  return state.watchlists;
}
