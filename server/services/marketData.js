import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple paths so it works locally AND in Vercel serverless bundle
const STOCK_FILE_CANDIDATES = [
  path.join(__dirname, '../data/indianStocks.json'),       // local dev
  path.join(process.cwd(), 'server/data/indianStocks.json'), // Vercel CWD
  path.join(process.cwd(), 'indianStocks.json')              // fallback
];

let masterStocks = [];
for (const candidate of STOCK_FILE_CANDIDATES) {
  try {
    if (fs.existsSync(candidate)) {
      masterStocks = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
      break;
    }
  } catch (err) {
    // try next path
  }
}

// In-memory cache for live quotes and candles (short TTL = near real-time)
const quoteCache = new Map();
const chartCache = new Map();
const staticMetaCache = new Map(); // Long-lived cache for names, sectors, exchange
const CACHE_TTL_MS = 3000;      // 3s — quotes refresh almost live
const CHART_TTL_MS = 20000;     // 20s — candle data refresh

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Standard Proper Names & Metadata for Key Benchmarks and Popular Instruments
 */
export const PROPER_NAMES = {
  '^NSEI': { name: 'NIFTY 50', shortName: 'Nifty 50', sector: 'Indian Benchmark Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^NSEBANK': { name: 'NIFTY BANK', shortName: 'Bank Nifty', sector: 'Banking & Financials Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^BSESN': { name: 'S&P BSE SENSEX', shortName: 'Sensex', sector: 'BSE Benchmark Index', type: 'INDEX', exchange: 'BSE', currency: 'INR' },
  '^NSMIDCP': { name: 'NIFTY NEXT 50', shortName: 'Nifty Next 50', sector: 'Large Cap Benchmark', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  'NIFTY_MIDCAP_100.NS': { name: 'NIFTY MIDCAP 100', shortName: 'Nifty Midcap 100', sector: 'Midcap Benchmark', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^NSEMDCP50': { name: 'NIFTY MIDCAP 50', shortName: 'Nifty Midcap 50', sector: 'Midcap Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CRSLDX': { name: 'NIFTY 500', shortName: 'Nifty 500', sector: 'Broad Market Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CNX100': { name: 'NIFTY 100', shortName: 'Nifty 100', sector: 'Broad Market Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CNXSC': { name: 'NIFTY SMALLCAP 100', shortName: 'Nifty Smallcap 100', sector: 'Smallcap Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CNXIT': { name: 'NIFTY IT', shortName: 'Nifty IT', sector: 'Information Technology Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CNXAUTO': { name: 'NIFTY AUTO', shortName: 'Nifty Auto', sector: 'Automobile Sector Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CNXPHARMA': { name: 'NIFTY PHARMA', shortName: 'Nifty Pharma', sector: 'Pharmaceuticals Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CNXFMCG': { name: 'NIFTY FMCG', shortName: 'Nifty FMCG', sector: 'Fast Moving Consumer Goods', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CNXENERGY': { name: 'NIFTY ENERGY', shortName: 'Nifty Energy', sector: 'Energy & Oil Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CNXREALTY': { name: 'NIFTY REALTY', shortName: 'Nifty Realty', sector: 'Real Estate Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CNXMETAL': { name: 'NIFTY METAL', shortName: 'Nifty Metal', sector: 'Metals & Mining Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CNXINFRA': { name: 'NIFTY INFRASTRUCTURE', shortName: 'Nifty Infra', sector: 'Infrastructure Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CNXFIN': { name: 'NIFTY FINANCIAL SERVICES', shortName: 'Fin Nifty', sector: 'Financial Services Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CNXPSUBANK': { name: 'NIFTY PSU BANK', shortName: 'Nifty PSU Bank', sector: 'Public Sector Banking Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CNXCONSUM': { name: 'NIFTY INDIA CONSUMPTION', shortName: 'Nifty Consumption', sector: 'Consumption Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CNXSERVICE': { name: 'NIFTY SERVICES SECTOR', shortName: 'Nifty Services', sector: 'Services Sector Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CNXMEDIA': { name: 'NIFTY MEDIA', shortName: 'Nifty Media', sector: 'Media Sector Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^CNXPSE': { name: 'NIFTY PSE', shortName: 'Nifty PSE', sector: 'Public Sector Enterprises', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  '^INDIAVIX': { name: 'INDIA VIX', shortName: 'India VIX', sector: 'Market Volatility Index', type: 'INDEX', exchange: 'NSE', currency: 'INR' },
  // Global Benchmarks
  '^GSPC': { name: 'S&P 500', shortName: 'S&P 500', sector: 'US Benchmark Index', type: 'INDEX', exchange: 'SNP', currency: 'USD' },
  '^IXIC': { name: 'NASDAQ COMPOSITE', shortName: 'Nasdaq', sector: 'US Tech Index', type: 'INDEX', exchange: 'NASDAQ', currency: 'USD' },
  '^DJI': { name: 'DOW JONES INDUSTRIAL AVERAGE', shortName: 'Dow Jones', sector: 'US Benchmark Index', type: 'INDEX', exchange: 'DJI', currency: 'USD' },
  '^FTSE': { name: 'FTSE 100', shortName: 'FTSE 100', sector: 'UK Benchmark Index', type: 'INDEX', exchange: 'LSE', currency: 'GBP' },
  '^N225': { name: 'NIKKEI 225', shortName: 'Nikkei 225', sector: 'Japan Benchmark Index', type: 'INDEX', exchange: 'OSE', currency: 'JPY' },
  '^GDAXI': { name: 'DAX PERFORMANCE-INDEX', shortName: 'DAX 40', sector: 'Germany Benchmark Index', type: 'INDEX', exchange: 'XETRA', currency: 'EUR' },
  // Key Stocks / ETFs with Corporate Updates
  'TMPV.NS': { name: 'Tata Motors Passenger Vehicles Ltd', shortName: 'TMPV', sector: 'Automobile', type: 'EQUITY', exchange: 'NSE', currency: 'INR' },
  'TMCV.NS': { name: 'Tata Motors Commercial Vehicles Ltd', shortName: 'TMCV', sector: 'Automobile', type: 'EQUITY', exchange: 'NSE', currency: 'INR' },
  'ETERNAL.NS': { name: 'Eternal Limited (formerly Zomato)', shortName: 'Eternal (Zomato)', sector: 'Consumer Digital', type: 'EQUITY', exchange: 'NSE', currency: 'INR' },
  'NIFTYBEES.NS': { name: 'Nippon India Nifty 50 BeES ETF', shortName: 'NIFTYBEES', sector: 'Index ETF', type: 'ETF', exchange: 'NSE', currency: 'INR' },
  'BANKBEES.NS': { name: 'Nippon India Bank BeES ETF', shortName: 'BANKBEES', sector: 'Index ETF', type: 'ETF', exchange: 'NSE', currency: 'INR' },
  'GOLDBEES.NS': { name: 'Nippon India Gold BeES ETF', shortName: 'GOLDBEES', sector: 'Commodity ETF', type: 'ETF', exchange: 'NSE', currency: 'INR' },
  // Global Equities
  'AAPL': { name: 'Apple Inc.', shortName: 'Apple', sector: 'Consumer Electronics & Tech', type: 'EQUITY', exchange: 'NASDAQ', currency: 'USD' },
  'TSLA': { name: 'Tesla, Inc.', shortName: 'Tesla', sector: 'Electric Vehicles & Clean Energy', type: 'EQUITY', exchange: 'NASDAQ', currency: 'USD' },
  'MSFT': { name: 'Microsoft Corporation', shortName: 'Microsoft', sector: 'Software & Cloud', type: 'EQUITY', exchange: 'NASDAQ', currency: 'USD' },
  'NVDA': { name: 'NVIDIA Corporation', shortName: 'Nvidia', sector: 'Semiconductors & AI', type: 'EQUITY', exchange: 'NASDAQ', currency: 'USD' },
  'AMZN': { name: 'Amazon.com, Inc.', shortName: 'Amazon', sector: 'E-Commerce & Cloud', type: 'EQUITY', exchange: 'NASDAQ', currency: 'USD' },
  'GOOGL': { name: 'Alphabet Inc. (Google)', shortName: 'Google', sector: 'Internet & Search', type: 'EQUITY', exchange: 'NASDAQ', currency: 'USD' },
  'META': { name: 'Meta Platforms, Inc.', shortName: 'Meta', sector: 'Social Media & Tech', type: 'EQUITY', exchange: 'NASDAQ', currency: 'USD' },
};

/**
 * Common User-Friendly Aliases to Canonical Market Tickers
 */
export const SYMBOL_ALIASES = {
  'APPLE': 'AAPL',
  'AAPL': 'AAPL',
  'TESLA': 'TSLA',
  'TSLA': 'TSLA',
  'MICROSOFT': 'MSFT',
  'MSFT': 'MSFT',
  'GOOGLE': 'GOOGL',
  'GOOGL': 'GOOGL',
  'AMAZON': 'AMZN',
  'AMZN': 'AMZN',
  'NVIDIA': 'NVDA',
  'NVDA': 'NVDA',
  'META': 'META',
  'NIFTY': '^NSEI',
  'NIFTY50': '^NSEI',
  'NIFTY 50': '^NSEI',
  'BANKNIFTY': '^NSEBANK',
  'BANK NIFTY': '^NSEBANK',
  'NIFTYBANK': '^NSEBANK',
  'SENSEX': '^BSESN',
  'BSE SENSEX': '^BSESN',
  'FINNIFTY': '^CNXFIN',
  'FIN NIFTY': '^CNXFIN',
  'NIFTYFIN': '^CNXFIN',
  'MIDCPNIFTY': 'NIFTY_MIDCAP_100.NS',
  'NIFTYMIDCAP': 'NIFTY_MIDCAP_100.NS',
  'NIFTYMIDCAP100': 'NIFTY_MIDCAP_100.NS',
  'NIFTY MIDCAP': 'NIFTY_MIDCAP_100.NS',
  'NIFTY500': '^CRSLDX',
  'NIFTY 500': '^CRSLDX',
  'NIFTY100': '^CNX100',
  'NIFTY 100': '^CNX100',
  'NIFTYNEXT50': '^NSMIDCP',
  'NIFTY NEXT 50': '^NSMIDCP',
  'NIFTYIT': '^CNXIT',
  'NIFTY IT': '^CNXIT',
  'NIFTYAUTO': '^CNXAUTO',
  'NIFTY AUTO': '^CNXAUTO',
  'NIFTYPHARMA': '^CNXPHARMA',
  'NIFTY FMCG': '^CNXFMCG',
  'NIFTYFMCG': '^CNXFMCG',
  'NIFTYENERGY': '^CNXENERGY',
  'NIFTYMETAL': '^CNXMETAL',
  'NIFTYREALTY': '^CNXREALTY',
  'INDIAVIX': '^INDIAVIX',
  'INDIA VIX': '^INDIAVIX',
  'VIX': '^INDIAVIX',
  'SP500': '^GSPC',
  'S&P 500': '^GSPC',
  'SPX': '^GSPC',
  'NASDAQ': '^IXIC',
  'DOW': '^DJI',
  'DJIA': '^DJI',
  'DOW JONES': '^DJI',
  'FTSE': '^FTSE',
  'NIKKEI': '^N225',
  'DAX': '^GDAXI',
  'TATAMOTORS': 'TMPV.NS',
  'TATAMOTORS.NS': 'TMPV.NS',
  'TATA MOTORS': 'TMPV.NS',
  'ZOMATO': 'ETERNAL.NS',
  'ZOMATO.NS': 'ETERNAL.NS',
  'ETERNAL': 'ETERNAL.NS',
  'GOLD': 'GC=F',
  'CRUDE': 'CL=F',
  'CRUDE OIL': 'CL=F',
  'BITCOIN': 'BTC-USD',
  'BTC': 'BTC-USD',
  'ETH': 'ETH-USD',
  'ETHEREUM': 'ETH-USD'
};

/**
 * Format and normalize symbol to canonical exchange ticker
 */
export function normalizeSymbol(rawSymbol) {
  if (!rawSymbol) return 'RELIANCE.NS';
  const clean = rawSymbol.trim().toUpperCase();
  if (SYMBOL_ALIASES[clean]) {
    return SYMBOL_ALIASES[clean];
  }
  // Already has explicit exchange or instrument prefix/suffix
  if (clean.startsWith('^') || clean.endsWith('.NS') || clean.endsWith('.BO') || clean.includes('=') || clean.includes('-')) {
    return clean;
  }
  // Default to NSE for bare symbols
  return `${clean}.NS`;
}

/**
 * Generate candidate symbols to query when a bare symbol is requested
 */
export function getCandidateSymbols(rawSymbol) {
  if (!rawSymbol) return ['RELIANCE.NS'];
  const clean = rawSymbol.trim().toUpperCase();
  if (SYMBOL_ALIASES[clean]) {
    return [SYMBOL_ALIASES[clean]];
  }
  if (clean.startsWith('^') || clean.endsWith('.NS') || clean.endsWith('.BO') || clean.includes('=') || clean.includes('-')) {
    return [clean];
  }
  // Try Indian NSE (.NS), then global ticker (e.g. AAPL, TSLA), then BSE (.BO)
  return [`${clean}.NS`, clean, `${clean}.BO`];
}

/**
 * Clean up names for human readability
 */
export function getCleanName(symbol, meta = {}) {
  if (PROPER_NAMES[symbol]) {
    return PROPER_NAMES[symbol];
  }
  const long = meta.longName || '';
  const short = meta.shortName || '';
  let name = long || short || symbol;
  let shortName = short || long || symbol.replace('.NS', '').replace('.BO', '');

  // Strip redundant suffixes like "LTD", "LIMITED", "INC" from shortName
  shortName = shortName
    .replace(/\s+(LIMITED|LTD\.?|INC\.?|CORP\.?|CORPORATION)$/i, '')
    .trim();

  let sector = 'Equities';
  if (symbol.startsWith('^')) sector = 'Index';
  else if (symbol.endsWith('BEES.NS') || symbol === 'SPY' || symbol === 'QQQ') sector = 'Index ETF';
  else if (symbol.includes('=F')) sector = 'Commodities';
  else if (symbol.includes('-USD')) sector = 'Cryptocurrency';

  return {
    name: name.trim() || symbol,
    shortName: shortName || symbol,
    sector,
    type: symbol.startsWith('^') ? 'INDEX' : (sector === 'Index ETF' ? 'ETF' : 'EQUITY'),
    exchange: meta.fullExchangeName || meta.exchangeName || (symbol.endsWith('.NS') ? 'NSE' : (symbol.endsWith('.BO') ? 'BSE' : 'Exchange')),
    currency: meta.currency || 'INR'
  };
}

/**
 * Fetch 100% REAL quote from Yahoo Finance v8 chart API.
 * Never invents synthetic prices or random walks.
 */
async function fetchSingleRealQuote(sym) {
  const hosts = [
    'https://query1.finance.yahoo.com',
    'https://query2.finance.yahoo.com',
  ];

  for (const host of hosts) {
    try {
      const url = `${host}/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`;
      const res = await axios.get(url, { headers: HEADERS, timeout: 5000 });
      const result = res.data?.chart?.result?.[0];

      if (result && result.meta) {
        const meta = result.meta;
        const ltp = meta.regularMarketPrice ?? meta.chartPreviousClose;
        if (ltp == null) continue;

        // Use official exchange change & percent directly (e.g. -41.00 / -0.17% matching NSE/Groww)
        const officialChange = meta.regularMarketChange ?? meta.fulldayChange;
        const officialChangePercent = meta.regularMarketChangePercent ?? meta.fulldayChangePercent;

        let change, changePercent, prevClose;
        if (officialChange != null && officialChangePercent != null) {
          change = +Number(officialChange).toFixed(2);
          changePercent = +Number(officialChangePercent).toFixed(2);
          prevClose = +(ltp - change).toFixed(2);
        } else {
          prevClose = meta.chartPreviousClose ?? meta.previousClose ?? ltp;
          change = +(ltp - prevClose).toFixed(2);
          changePercent = prevClose > 0 ? +((change / prevClose) * 100).toFixed(2) : 0;
        }

        const high = meta.regularMarketDayHigh ?? meta.dayHigh ?? ltp;
        const low = meta.regularMarketDayLow ?? meta.dayLow ?? ltp;
        const open = meta.regularMarketDayOpen ?? prevClose;
        const volume = meta.regularMarketVolume ?? 0;
        const fiftyTwoWeekHigh = meta.fiftyTwoWeekHigh ?? high;
        const fiftyTwoWeekLow = meta.fiftyTwoWeekLow ?? low;

        let cleanInfo = staticMetaCache.get(sym);
        if (!cleanInfo) {
          cleanInfo = getCleanName(sym, meta);
          staticMetaCache.set(sym, cleanInfo);
        }

        return {
          symbol: sym,
          name: cleanInfo.name,
          shortName: cleanInfo.shortName,
          sector: cleanInfo.sector,
          type: cleanInfo.type,
          exchange: cleanInfo.exchange,
          currency: cleanInfo.currency,
          price: +ltp.toFixed(2),
          prevClose: +prevClose.toFixed(2),
          change,
          changePercent,
          high: +high.toFixed(2),
          low: +low.toFixed(2),
          open: +open.toFixed(2),
          volume,
          fiftyTwoWeekHigh: +fiftyTwoWeekHigh.toFixed(2),
          fiftyTwoWeekLow: +fiftyTwoWeekLow.toFixed(2),
          marketTime: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
          isLive: true,
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (err) {
      // Continue to next host or return null
    }
  }
  return null;
}

/**
 * Fetch real quote for ANY stock or index worldwide.
 * Resolves candidate tickers if needed.
 */
export async function getQuote(rawSymbol) {
  const candidates = getCandidateSymbols(rawSymbol);

  for (const sym of candidates) {
    const cached = quoteCache.get(sym);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const realQuote = await fetchSingleRealQuote(sym);
    if (realQuote) {
      quoteCache.set(sym, { timestamp: Date.now(), data: realQuote });
      // Cache under raw input as well if it differed
      if (rawSymbol.toUpperCase() !== sym) {
        quoteCache.set(rawSymbol.toUpperCase(), { timestamp: Date.now(), data: realQuote });
      }
      return realQuote;
    }
  }

  // Symbol not found on exchange — throw informative error (never fabricate fake prices!)
  throw new Error(`Real market quote for "${rawSymbol}" could not be retrieved from the exchange. Please check the ticker symbol.`);
}

/**
 * Fetch batch quotes in parallel
 */
export async function getQuotesBatch(symbols = []) {
  const promises = symbols.map(s => 
    getQuote(s)
      .then(q => (q ? { ...q, requestedSymbol: s } : null))
      .catch(err => {
        console.warn(`Quote failed for ${s}:`, err.message);
        return null;
      })
  );
  const results = await Promise.all(promises);
  return results.filter(Boolean);
}

/**
 * Fetch 100% REAL historical OHLCV candles for charts.
 * Strictly checks that data is chronological, deduplicated, and contains real values.
 */
export async function getHistoricalCandles(rawSymbol, range = '1mo', interval = '1d') {
  const candidates = getCandidateSymbols(rawSymbol);

  for (const sym of candidates) {
    const cacheKey = `${sym}_${range}_${interval}`;
    const cached = chartCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CHART_TTL_MS) {
      return cached.data;
    }

    const hosts = [
      'https://query1.finance.yahoo.com',
      'https://query2.finance.yahoo.com',
    ];

    for (const host of hosts) {
      try {
        const url = `${host}/v8/finance/chart/${encodeURIComponent(sym)}?interval=${interval}&range=${range}`;
        const res = await axios.get(url, { headers: HEADERS, timeout: 6000 });
        const result = res.data?.chart?.result?.[0];

        if (result && result.timestamp && result.indicators?.quote?.[0]) {
          const timestamps = result.timestamp;
          const quotes = result.indicators.quote[0];
          const candles = [];
          const seenTimes = new Set();

          for (let i = 0; i < timestamps.length; i++) {
            const time = timestamps[i];
            const o = quotes.open?.[i];
            const h = quotes.high?.[i];
            const l = quotes.low?.[i];
            const c = quotes.close?.[i];
            const v = quotes.volume?.[i] || 0;

            if (time != null && o != null && h != null && l != null && c != null && !seenTimes.has(time)) {
              seenTimes.add(time);
              candles.push({
                time,
                open: +o.toFixed(2),
                high: +h.toFixed(2),
                low: +l.toFixed(2),
                close: +c.toFixed(2),
                volume: Math.round(v),
              });
            }
          }

          // Sort strictly in ascending chronological order for lightweight-charts
          candles.sort((a, b) => a.time - b.time);

          if (candles.length > 0) {
            chartCache.set(cacheKey, { timestamp: Date.now(), data: candles });
            return candles;
          }
        }
      } catch (err) {
        // Try next host
      }
    }
  }

  // Return empty array if exchange has no historical data for this range (never synthetic!)
  return [];
}

/**
 * Universal Search across ALL Equities, Indices, ETFs, Commodities worldwide
 */
export async function searchStocks(query) {
  if (!query || query.trim() === '') {
    // Return key benchmarks and top active Indian stocks
    const topIndices = Object.keys(PROPER_NAMES).map(sym => ({
      symbol: sym,
      ...PROPER_NAMES[sym],
      basePrice: null
    }));
    return topIndices.slice(0, 25);
  }

  const q = query.trim().toLowerCase();
  const matches = [];
  const seen = new Set();

  // 1. Check curated proper names and benchmarks first
  for (const [sym, info] of Object.entries(PROPER_NAMES)) {
    if (
      sym.toLowerCase().includes(q) ||
      info.name.toLowerCase().includes(q) ||
      info.shortName.toLowerCase().includes(q) ||
      info.sector.toLowerCase().includes(q)
    ) {
      matches.push({
        symbol: sym,
        name: info.name,
        shortName: info.shortName,
        sector: info.sector,
        type: info.type,
        exchange: info.exchange,
        currency: info.currency
      });
      seen.add(sym);
    }
  }

  // 2. Check alias matches
  for (const [alias, targetSym] of Object.entries(SYMBOL_ALIASES)) {
    if (alias.toLowerCase().includes(q) && !seen.has(targetSym)) {
      const info = PROPER_NAMES[targetSym] || {
        name: alias,
        shortName: alias,
        sector: targetSym.startsWith('^') ? 'Index' : 'Equities',
        type: targetSym.startsWith('^') ? 'INDEX' : 'EQUITY',
        exchange: targetSym.startsWith('^BS') ? 'BSE' : 'NSE',
        currency: 'INR'
      };
      matches.push({
        symbol: targetSym,
        ...info
      });
      seen.add(targetSym);
    }
  }

  // 3. Check local database
  for (const s of masterStocks) {
    if (seen.has(s.symbol)) continue;
    if (
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.shortName.toLowerCase().includes(q) ||
      (s.sector && s.sector.toLowerCase().includes(q))
    ) {
      matches.push(s);
      seen.add(s.symbol);
      if (matches.length >= 30) break;
    }
  }

  // 4. Query live Yahoo Finance search API for ANY stock/index worldwide
  if (matches.length < 20 && q.length >= 2) {
    try {
      const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0`;
      const res = await axios.get(searchUrl, { headers: HEADERS, timeout: 3500 });
      const onlineQuotes = res.data?.quotes || [];

      for (const item of onlineQuotes) {
        if (!item.symbol || seen.has(item.symbol)) continue;

        const isIndex = item.quoteType === 'INDEX' || item.symbol.startsWith('^');
        const isETF = item.quoteType === 'ETF' || item.symbol.endsWith('BEES.NS');
        const type = isIndex ? 'INDEX' : (isETF ? 'ETF' : (item.quoteType || 'EQUITY'));

        let sector = item.sector || (isIndex ? 'Index' : (isETF ? 'ETF' : 'Equities'));
        let exchange = item.exchDisp || item.exchange || 'Exchange';
        if (item.symbol.endsWith('.NS')) exchange = 'NSE';
        else if (item.symbol.endsWith('.BO')) exchange = 'BSE';

        const cleanInfo = getCleanName(item.symbol, {
          longName: item.longname,
          shortName: item.shortname,
          fullExchangeName: exchange
        });

        matches.push({
          symbol: item.symbol,
          name: cleanInfo.name,
          shortName: cleanInfo.shortName,
          sector,
          type,
          exchange,
          currency: item.symbol.endsWith('.NS') || item.symbol.endsWith('.BO') || item.symbol.startsWith('^NSE') || item.symbol.startsWith('^BSE') ? 'INR' : 'USD'
        });
        seen.add(item.symbol);
      }
    } catch (err) {
      // Ignore network timeout in live search
    }
  }

  return matches.slice(0, 35);
}

export function getAllStocks() {
  return masterStocks;
}
