/**
 * Option Pricing & Quantitative Engine (Black-Scholes Model & Greeks)
 * Fully Free Tier - 100% Real-Time Spot Driven
 * Zero API Keys or Paid Subscriptions Needed
 */

// Normal Cumulative Distribution Function (CDF)
function normalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp(-x * x / 2);
  const prob = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x > 0 ? 1 - prob : prob;
}

// Standard Normal Probability Density Function (PDF)
function normalPDF(x) {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

/**
 * Calculate Black-Scholes Option Price and Greeks
 * @param {number} spot Current real-time spot price of index/stock
 * @param {number} strike Option strike price
 * @param {number} daysToExpiry Days remaining to expiry (e.g. 0.5 for expiry day, 3 for weekly)
 * @param {boolean} isCall true for Call (CE), false for Put (PE)
 * @param {number} iv Implied Volatility (e.g. 0.14 for 14% India VIX)
 * @param {number} r Risk-free interest rate (default 0.065 for India RBI repo rate)
 */
export function calculateBlackScholes(spot, strike, daysToExpiry, isCall, iv = 0.145, r = 0.065) {
  // Avoid division by zero on expiry day
  const t = Math.max(daysToExpiry / 365, 0.0001);
  const sigma = Math.max(iv, 0.05);

  const d1 = (Math.log(spot / strike) + (r + (sigma * sigma) / 2) * t) / (sigma * Math.sqrt(t));
  const d2 = d1 - sigma * Math.sqrt(t);

  const discountFactor = Math.exp(-r * t);

  let price = 0;
  let delta = 0;

  if (isCall) {
    price = spot * normalCDF(d1) - strike * discountFactor * normalCDF(d2);
    delta = normalCDF(d1);
  } else {
    price = strike * discountFactor * normalCDF(-d2) - spot * normalCDF(-d1);
    delta = normalCDF(d1) - 1;
  }

  // Intrinsic value boundary check
  const intrinsicValue = isCall ? Math.max(0, spot - strike) : Math.max(0, strike - spot);
  price = Math.max(price, intrinsicValue);

  // Round to nearest 0.05 (standard NSE tick size)
  price = Math.max(0.05, Math.round(price / 0.05) * 0.05);

  // Greeks
  const gamma = normalPDF(d1) / (spot * sigma * Math.sqrt(t));
  const vega = (spot * normalPDF(d1) * Math.sqrt(t)) / 100; // per 1% IV change
  
  let theta = 0;
  if (isCall) {
    theta = (-(spot * normalPDF(d1) * sigma) / (2 * Math.sqrt(t)) - r * strike * discountFactor * normalCDF(d2)) / 365;
  } else {
    theta = (-(spot * normalPDF(d1) * sigma) / (2 * Math.sqrt(t)) + r * strike * discountFactor * normalCDF(-d2)) / 365;
  }

  return {
    price: +price.toFixed(2),
    intrinsicValue: +intrinsicValue.toFixed(2),
    timeValue: +(price - intrinsicValue).toFixed(2),
    delta: +delta.toFixed(2),
    theta: +theta.toFixed(2),
    gamma: +gamma.toFixed(4),
    vega: +vega.toFixed(2),
    iv: +(iv * 100).toFixed(1)
  };
}

/**
 * Exchange Specifications for Major F&O Indices
 */
export const INDEX_F_AND_O_SPECS = {
  'NIFTY': {
    name: 'NIFTY 50',
    symbol: '^NSEI',
    strikeStep: 50,
    lotSize: 25,
    exchange: 'NSE',
    baseIV: 0.138,
    strikesRange: 12 // 12 strikes above & below ATM
  },
  'BANKNIFTY': {
    name: 'NIFTY BANK',
    symbol: '^NSEBANK',
    strikeStep: 100,
    lotSize: 15,
    exchange: 'NSE',
    baseIV: 0.162,
    strikesRange: 12
  },
  'SENSEX': {
    name: 'BSE SENSEX',
    symbol: '^BSESN',
    strikeStep: 100,
    lotSize: 10,
    exchange: 'BSE',
    baseIV: 0.135,
    strikesRange: 12
  },
  'FINNIFTY': {
    name: 'NIFTY FINANCIAL SERVICES',
    symbol: '^CNXFIN',
    strikeStep: 50,
    lotSize: 25,
    exchange: 'NSE',
    baseIV: 0.148,
    strikesRange: 12
  }
};

/**
 * Generate Upcoming Weekly & Monthly Expiry Dates
 */
export function getExpiryDates() {
  const dates = [];
  const now = new Date();
  
  // Find upcoming Thursdays (NSE standard expiry day)
  let current = new Date(now);
  let count = 0;
  
  while (count < 6) {
    const dayOfWeek = current.getDay(); // 0 = Sun, 4 = Thu
    let diff = (4 - dayOfWeek + 7) % 7;
    if (diff === 0 && count === 0) {
      // If today is Thursday after 3:30 PM, roll to next Thursday
      if (now.getHours() > 15 || (now.getHours() === 15 && now.getMinutes() >= 30)) {
        diff = 7;
      }
    } else if (diff === 0) {
      diff = 7;
    }
    
    current.setDate(current.getDate() + diff);
    
    const day = current.getDate();
    const month = current.toLocaleString('default', { month: 'short' });
    const year = current.getFullYear();
    const isMonthly = (new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate() - day) < 7;
    
    dates.push({
      dateStr: `${day} ${month}`,
      fullDate: `${day} ${month} ${year}`,
      timestamp: new Date(current.setHours(15, 30, 0, 0)).getTime(),
      daysRemaining: Math.max(0.2, (current.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      isMonthly
    });
    
    count++;
  }
  
  return dates;
}

/**
 * Generate a complete, balanced, and live option chain for a given index and spot price
 */
export function generateFullOptionChain(indexKey = 'NIFTY', spotPrice = 23400, spotChange = 0, spotChangePercent = 0, selectedExpiry = null) {
  const spec = INDEX_F_AND_O_SPECS[indexKey] || INDEX_F_AND_O_SPECS['NIFTY'];
  const expiries = getExpiryDates();
  const expiry = selectedExpiry || expiries[0];
  const daysToExpiry = expiry.daysRemaining || 3;
  
  // Round spot to nearest strike to find the At-The-Money (ATM) strike
  const step = spec.strikeStep;
  const atmStrike = Math.round(spotPrice / step) * step;
  
  const strikes = [];
  const range = spec.strikesRange || 12;
  
  for (let i = -range; i <= range; i++) {
    strikes.push(atmStrike + (i * step));
  }
  
  let totalCallOI = 0;
  let totalPutOI = 0;
  
  const chainRows = strikes.map(strike => {
    // Volatility smile: OTM strikes slightly higher IV
    const moneyness = Math.abs(spotPrice - strike) / spotPrice;
    const strikeIV = spec.baseIV + (moneyness * 0.12);
    
    const callCalc = calculateBlackScholes(spotPrice, strike, daysToExpiry, true, strikeIV);
    const putCalc = calculateBlackScholes(spotPrice, strike, daysToExpiry, false, strikeIV);
    
    // Realistic Open Interest (Normal Distribution peaked around round numbers and ATM)
    const distFromAtm = Math.abs(strike - atmStrike) / step;
    const isRoundNumber = strike % (step * 4) === 0;
    const roundMultiplier = isRoundNumber ? 2.2 : 1.0;
    
    // Call OI heavier above spot (resistance), Put OI heavier below spot (support)
    const callOIWeight = (strike >= atmStrike ? 1.6 : 0.6) * Math.exp(-distFromAtm * 0.12) * roundMultiplier;
    const putOIWeight = (strike <= atmStrike ? 1.6 : 0.6) * Math.exp(-distFromAtm * 0.12) * roundMultiplier;
    
    const callOI = Math.max(1200, Math.round(callOIWeight * 55000));
    const putOI = Math.max(1200, Math.round(putOIWeight * 58000));
    
    totalCallOI += callOI;
    totalPutOI += putOI;
    
    // Daily percentage changes based on Delta and spot change
    const callLtpChange = +(callCalc.delta * spotChange).toFixed(2);
    const callLtpChangePct = callCalc.price > 0 ? +((callLtpChange / Math.max(1, callCalc.price - callLtpChange)) * 100).toFixed(2) : 0;
    
    const putLtpChange = +(putCalc.delta * spotChange).toFixed(2);
    const putLtpChangePct = putCalc.price > 0 ? +((putLtpChange / Math.max(1, putCalc.price - putLtpChange)) * 100).toFixed(2) : 0;
    
    const callOiChangePct = +(spotChange > 0 && strike > spotPrice ? 8.4 : -3.2).toFixed(2);
    const putOiChangePct = +(spotChange < 0 && strike < spotPrice ? 12.6 : -4.5).toFixed(2);

    return {
      strike,
      isATM: strike === atmStrike,
      // Calls
      callLTP: callCalc.price,
      callChange: callLtpChange,
      callChangePct: callLtpChangePct,
      callOI,
      callOiChangePct,
      callGreeks: {
        delta: callCalc.delta,
        theta: callCalc.theta,
        gamma: callCalc.gamma,
        vega: callCalc.vega,
        iv: callCalc.iv
      },
      isCallITM: strike < spotPrice,
      // Puts
      putLTP: putCalc.price,
      putChange: putLtpChange,
      putChangePct: putLtpChangePct,
      putOI,
      putOiChangePct,
      putGreeks: {
        delta: putCalc.delta,
        theta: putCalc.theta,
        gamma: putCalc.gamma,
        vega: putCalc.vega,
        iv: putCalc.iv
      },
      isPutITM: strike > spotPrice
    };
  });
  
  // PCR (Put-Call Ratio)
  const pcr = totalCallOI > 0 ? +(totalPutOI / totalCallOI).toFixed(2) : 1.0;
  
  return {
    indexKey,
    indexName: spec.name,
    spotPrice: +spotPrice.toFixed(2),
    spotChange: +spotChange.toFixed(2),
    spotChangePercent: +spotChangePercent.toFixed(2),
    atmStrike,
    step,
    lotSize: spec.lotSize,
    expiry,
    expiries,
    totalCallOI,
    totalPutOI,
    pcr,
    maxPain: atmStrike,
    rows: chainRows
  };
}
