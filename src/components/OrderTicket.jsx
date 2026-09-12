import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, ShieldAlert, Target, Info, Sparkles, CheckCircle2, Calculator, Percent, Scale, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCurrency, formatINR } from '../utils/formatters';
import { getMarketStatusForSymbol } from '../utils/marketHours';

export default function OrderTicket({ 
  quote, 
  portfolio, 
  onOrderPlaced,
  beginnerMode = false
}) {
  const isIndex = quote?.type === 'INDEX' || quote?.symbol?.startsWith('^');
  const currency = quote?.currency || 'INR';
  const [action, setAction] = useState('BUY'); // 'BUY' | 'SELL'
  const [product, setProduct] = useState('CNC'); // 'CNC' (Delivery) | 'MIS' (Intraday)
  const [orderType, setOrderType] = useState('MARKET'); // 'MARKET' | 'LIMIT' | 'SL'
  const [qty, setQty] = useState(10);
  const [limitPrice, setLimitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [target, setTarget] = useState('');
  const [thesis, setThesis] = useState('');
  const [selectedTag, setSelectedTag] = useState('Technical Breakout');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [charges, setCharges] = useState(null);

  const ltp = quote?.price || 1000;
  const cashBalance = portfolio?.cashBalance || 0;
  const marketStatus = getMarketStatusForSymbol(quote?.symbol);
  
  // Existing holding for this stock if any
  const existingHolding = portfolio?.holdings?.find(h => h.symbol === quote?.symbol);
  const existingQty = existingHolding?.qty || 0;

  // Reset price inputs when user switches to a different stock
  useEffect(() => {
    setLimitPrice('');
    setStopLoss('');
    setTarget('');
    setError(null);
    setSuccessMsg(null);
  }, [quote?.symbol]);

  useEffect(() => {
    if (orderType === 'LIMIT' && !limitPrice && ltp) {
      setLimitPrice(ltp.toString());
    }
    if (orderType === 'SL' && !stopLoss && ltp) {
      setStopLoss((ltp * 0.97).toFixed(1));
    }
  }, [orderType, ltp]);

  // Fetch estimated charges
  useEffect(() => {
    const effectivePrice = orderType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : ltp;
    const effectiveQty = parseInt(qty, 10) || 0;
    if (effectiveQty > 0) {
      fetch('/api/orders/calculate-charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          action,
          price: effectivePrice,
          qty: effectiveQty
        })
      })
      .then(res => res.json())
      .then(res => {
        if (res.success) setCharges(res.data);
      })
      .catch(() => {});
    }
  }, [product, action, ltp, limitPrice, qty, orderType]);

  const [riskPercent, setRiskPercent] = useState(1); // 1% Total Wallet Risk Rule
  const [isTotalAmountMode, setIsTotalAmountMode] = useState(false); // Per-Share vs Total Position Mode

  const effectivePrice = orderType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : ltp;
  const currentQty = parseInt(qty, 10) || 0;
  const orderValue = effectivePrice * currentQty;
  const totalRequired = orderValue + (charges?.total || 0);

  // Parse Stop Loss & Target whether user typed Per-Share price or Total Position Amount (amt * qty)
  let slPerShare = null;
  let slTotalAmount = null;
  if (stopLoss && !isNaN(parseFloat(stopLoss))) {
    const rawSL = parseFloat(stopLoss);
    if (isTotalAmountMode || (currentQty > 0 && rawSL > effectivePrice * 1.5)) {
      slTotalAmount = rawSL;
      slPerShare = currentQty > 0 ? +(rawSL / currentQty).toFixed(2) : rawSL;
    } else {
      slPerShare = rawSL;
      slTotalAmount = +(rawSL * currentQty).toFixed(2);
    }
  }

  let tgtPerShare = null;
  let tgtTotalAmount = null;
  if (target && !isNaN(parseFloat(target))) {
    const rawTgt = parseFloat(target);
    if (isTotalAmountMode || (currentQty > 0 && rawTgt > effectivePrice * 1.5)) {
      tgtTotalAmount = rawTgt;
      tgtPerShare = currentQty > 0 ? +(rawTgt / currentQty).toFixed(2) : rawTgt;
    } else {
      tgtPerShare = rawTgt;
      tgtTotalAmount = +(rawTgt * currentQty).toFixed(2);
    }
  }

  // Calculate 1% Risk Metrics based on user's trading wallet
  const totalWallet = cashBalance > 0 ? cashBalance : 100000;
  const riskPerShare = slPerShare ? Math.abs(effectivePrice - slPerShare) : null;
  const totalRisk = riskPerShare && currentQty > 0 ? +(riskPerShare * currentQty).toFixed(2) : null;
  const walletRiskPct = totalRisk ? +((totalRisk / totalWallet) * 100).toFixed(1) : null;

  const rewardPerShare = tgtPerShare ? Math.abs(tgtPerShare - effectivePrice) : null;
  const totalReward = rewardPerShare && currentQty > 0 ? +(rewardPerShare * currentQty).toFixed(2) : null;
  const walletRewardPct = totalReward ? +((totalReward / totalWallet) * 100).toFixed(1) : null;

  const riskRewardRatio = riskPerShare && rewardPerShare && riskPerShare > 0 ? (rewardPerShare / riskPerShare).toFixed(1) : null;

  // Apply 1% Total Wallet Risk Rule to auto-size quantity and calculate 1:2 Target
  const applyRiskRule = (rulePct = 1) => {
    if (!effectivePrice || effectivePrice <= 0) return;
    setRiskPercent(rulePct);
    const maxTotalRisk = totalWallet * (rulePct / 100);

    // If no Stop Loss set, use logical 2% stop loss
    let sl = slPerShare;
    if (!sl) {
      sl = action === 'BUY' ? +(effectivePrice * 0.98).toFixed(2) : +(effectivePrice * 1.02).toFixed(2);
      setStopLoss(isTotalAmountMode ? (sl * (currentQty || 10)).toFixed(0) : sl.toString());
    }

    const rps = Math.abs(effectivePrice - sl);
    if (rps > 0) {
      const calculatedQty = Math.max(1, Math.floor(maxTotalRisk / rps));
      setQty(calculatedQty);

      // 1:2 Risk to Reward target
      const tgt = action === 'BUY' ? +(effectivePrice + rps * 2).toFixed(2) : +(effectivePrice - rps * 2).toFixed(2);
      setTarget(isTotalAmountMode ? (tgt * calculatedQty).toFixed(0) : tgt.toString());
    }
  };

  // Quick allocation buttons
  const handlePercentAlloc = (pct) => {
    if (!ltp || ltp <= 0) return;
    const budget = cashBalance * (pct / 100);
    const calculatedQty = Math.max(1, Math.floor(budget / ltp));
    setQty(calculatedQty);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: quote.symbol,
          name: quote.name,
          sector: quote.sector,
          action,
          product,
          orderType,
          qty: parseInt(qty, 10),
          limitPrice: orderType === 'LIMIT' ? parseFloat(limitPrice) : null,
          stopLoss: slPerShare != null ? slPerShare : null,
          target: tgtPerShare != null ? tgtPerShare : null,
          thesis: thesis.trim() || `${selectedTag} setup on ${quote.shortName || quote.symbol}`,
          tags: [selectedTag, product, quote.sector]
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to execute order');
      }

      // Success confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });

      if (data.data?.status === 'AMO') {
        setSuccessMsg(`After-Market Order (AMO) placed! Market is currently closed. Your order for ${qty} shares has been received and queued (not executed) until market opens.`);
      } else {
        setSuccessMsg(`Order placed successfully! Executed ${qty} shares of ${quote.shortName || quote.symbol} at ₹${effectivePrice.toLocaleString('en-IN')}`);
      }
      setThesis('');
      if (onOrderPlaced) onOrderPlaced(data);

      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const strategyTags = [
    'Technical Breakout',
    'Value / Fundamentals',
    'Momentum Swing',
    'Dip Buying',
    'Sector Rotation',
    'Earnings Play'
  ];

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Beginner Mode explainer */}
      {beginnerMode && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '0.75rem', color: '#b45309', lineHeight: 1.5 }}>
          <b>How to place your first trade:</b> choose BUY, keep product as <b>CNC</b> (shares are delivered to
          your Demat — truly yours), pick a small quantity, and press the green button. Watch the
          “Total Required” line below — it includes real-world charges like STT and stamp duty.
        </div>
      )}

      {/* Index Contract Notice */}
      {isIndex && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '0.75rem', color: '#b45309', lineHeight: 1.4 }}>
          <b>Index Contract Paper Trade:</b> Trading units on benchmark {quote?.shortName || quote?.symbol}. Indices cannot be delivered to Demat; for delivery holdings, consider trading index ETFs like NIFTYBEES.
        </div>
      )}
      {/* Header Tabs: BUY / SELL */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => { setAction('BUY'); setError(null); }}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            background: action === 'BUY' ? 'linear-gradient(135deg, #059669, #10b981)' : '#f1f5f9',
            color: action === 'BUY' ? '#fff' : '#64748b',
            boxShadow: action === 'BUY' ? '0 4px 14px rgba(16, 185, 129, 0.3)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          BUY (LONG)
        </button>
        <button
          type="button"
          onClick={() => { setAction('SELL'); setError(null); }}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            background: action === 'SELL' ? 'linear-gradient(135deg, #e11d48, #f43f5e)' : '#f1f5f9',
            color: action === 'SELL' ? '#fff' : '#64748b',
            boxShadow: action === 'SELL' ? '0 4px 14px rgba(244, 63, 94, 0.25)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          SELL (EXIT)
        </button>
      </div>

      {action === 'SELL' && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', padding: '8px 12px', fontSize: '0.8rem', color: '#be123c', marginBottom: '14px' }}>
          Available CNC Holding: <b className="font-mono">{existingQty} shares</b>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
        {/* Product Type: Delivery (CNC) vs Intraday (MIS) */}
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            PRODUCT TYPE
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setProduct('CNC')}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: `1px solid ${product === 'CNC' ? '#059669' : '#e2e8f0'}`,
                background: product === 'CNC' ? '#ecfdf5' : '#ffffff',
                color: product === 'CNC' ? '#047857' : '#64748b',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              CNC (Delivery)
            </button>
            <button
              type="button"
              onClick={() => setProduct('MIS')}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: `1px solid ${product === 'MIS' ? '#059669' : '#e2e8f0'}`,
                background: product === 'MIS' ? '#ecfdf5' : '#ffffff',
                color: product === 'MIS' ? '#047857' : '#64748b',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              MIS (Intraday)
            </button>
          </div>
        </div>

        {/* Order Type: Market vs Limit vs SL */}
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            ORDER TYPE
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            {['MARKET', 'LIMIT', 'SL'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: `1px solid ${orderType === type ? '#059669' : '#e2e8f0'}`,
                  background: orderType === type ? '#ecfdf5' : '#ffffff',
                  color: orderType === type ? '#047857' : '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity and Quick Percentage Presets */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
              QUANTITY
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[25, 50, 75, 100].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handlePercentAlloc(pct)}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    cursor: 'pointer'
                  }}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            required
            className="font-mono"
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600
            }}
          />
        </div>

        {/* Limit Price Input if LIMIT */}
        {orderType === 'LIMIT' && (
          <div>
            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              LIMIT PRICE (₹)
            </label>
            <input
              type="number"
              step="0.05"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              required
              className="font-mono"
              placeholder={`LTP: ₹${ltp}`}
              style={{
                width: '100%',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600
              }}
            />
          </div>
        )}

        {/* Risk Management & 1% Wallet Risk Calculator */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Header with 1% Rule Sizer and Mode Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Scale size={13} color="#059669" />
              <span style={{ fontSize: '0.72rem', color: '#334155', fontWeight: 700, letterSpacing: '0.3px' }}>
                1% WALLET RISK SIZER
              </span>
            </div>

            {/* Per-Share vs Total Position Toggle */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '4px', padding: '2px', border: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setIsTotalAmountMode(false)}
                style={{
                  background: !isTotalAmountMode ? '#ffffff' : 'transparent',
                  color: !isTotalAmountMode ? '#059669' : '#64748b',
                  border: 'none',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: !isTotalAmountMode ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
                title="Enter price per share (Standard Broker Style)"
              >
                Per Share (₹)
              </button>
              <button
                type="button"
                onClick={() => setIsTotalAmountMode(true)}
                style={{
                  background: isTotalAmountMode ? '#ffffff' : 'transparent',
                  color: isTotalAmountMode ? '#059669' : '#64748b',
                  border: 'none',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: isTotalAmountMode ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
                title="Enter total amount (amt * qty)"
              >
                Total Amt (₹)
              </button>
            </div>
          </div>

          {/* Quick Risk Buttons: 0.5%, 1% (Rule), 2% */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
              Max Risk: <b style={{ color: '#0f172a' }}>{formatCurrency(totalWallet * (riskPercent / 100), currency)}</b> ({riskPercent}%)
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0.5, 1, 2].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => applyRiskRule(pct)}
                  style={{
                    background: riskPercent === pct ? '#ecfdf5' : '#f8fafc',
                    color: riskPercent === pct ? '#047857' : '#64748b',
                    border: `1px solid ${riskPercent === pct ? '#a7f3d0' : '#e2e8f0'}`,
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Auto-calculate quantity based on ${pct}% wallet risk`}
                >
                  {pct}% {pct === 1 ? '⭐' : ''}
                </button>
              ))}
              <button
                type="button"
                onClick={() => applyRiskRule(1)}
                style={{
                  background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                  color: '#059669',
                  border: '1px solid #a7f3d0',
                  borderRadius: '4px',
                  padding: '2px 7px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <Calculator size={10} /> Auto-Size
              </button>
            </div>
          </div>

          {/* Stop Loss & Target Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: '#e11d48', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <ShieldAlert size={12} /> {isTotalAmountMode ? 'STOP LOSS TOTAL (₹)' : 'STOP LOSS / SHARE (₹)'}
              </label>
              <input
                type="number"
                step="0.05"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder={isTotalAmountMode ? `e.g. ${(effectivePrice * currentQty * 0.98).toFixed(0)}` : `e.g. ${(effectivePrice * 0.98).toFixed(1)}`}
                className="font-mono"
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #fecdd3',
                  color: '#e11d48',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}
              />
              {slPerShare && (
                <span style={{ fontSize: '0.62rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                  {isTotalAmountMode ? `Trigger: ₹${slPerShare}/sh` : `Total: ₹${slTotalAmount}`}
                  {totalRisk ? ` • Loss: -₹${totalRisk}` : ''}
                </span>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Target size={12} /> {isTotalAmountMode ? 'TARGET TOTAL (₹)' : 'TARGET / SHARE (₹)'}
              </label>
              <input
                type="number"
                step="0.05"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={isTotalAmountMode ? `e.g. ${(effectivePrice * currentQty * 1.04).toFixed(0)}` : `e.g. ${(effectivePrice * 1.04).toFixed(1)}`}
                className="font-mono"
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #a7f3d0',
                  color: '#059669',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}
              />
              {tgtPerShare && (
                <span style={{ fontSize: '0.62rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                  {isTotalAmountMode ? `Target: ₹${tgtPerShare}/sh` : `Total: ₹${tgtTotalAmount}`}
                  {totalReward ? ` • Profit: +₹${totalReward}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Dynamic 1:2 Risk to Reward Summary Card */}
          {(totalRisk || totalReward) && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 8px', fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#e11d48' }}>Max Loss: <b>-₹{totalRisk || 0}</b></span>
                {walletRiskPct && <span style={{ color: '#64748b', fontSize: '0.62rem' }}> ({walletRiskPct}% wallet)</span>}
              </div>
              {riskRewardRatio && (
                <div style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 5px', borderRadius: '4px', fontWeight: 700, fontSize: '0.65rem' }}>
                  1:{riskRewardRatio} R:R
                </div>
              )}
              <div>
                <span style={{ color: '#059669' }}>Est. Gain: <b>+₹{totalReward || 0}</b></span>
                {walletRewardPct && <span style={{ color: '#64748b', fontSize: '0.62rem' }}> (+{walletRewardPct}% wallet)</span>}
              </div>
            </div>
          )}
        </div>

        {/* Stock Picking Thesis / Reason For Trade */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={13} /> TRADE THESIS & RATIONALE
            </label>
          </div>

          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
            {strategyTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                style={{
                  background: selectedTag === tag ? '#ecfdf5' : '#f8fafc',
                  color: selectedTag === tag ? '#047857' : '#64748b',
                  border: `1px solid ${selectedTag === tag ? '#a7f3d0' : '#e2e8f0'}`,
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '0.68rem',
                  cursor: 'pointer'
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          <textarea
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            rows={2}
            placeholder="Why are you picking this stock? (e.g. 50 EMA bounce, strong Q3 quarterly results, high volume breakout)"
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              resize: 'none'
            }}
          />
        </div>

        {/* Charges & Margin Breakdown */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', fontSize: '0.78rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#64748b' }}>Order Value:</span>
            <span className="font-mono" style={{ color: '#0f172a', fontWeight: 700 }}>{formatCurrency(orderValue, currency)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Est. Brokerage & Taxes:</span>
            <span className="font-mono" style={{ color: '#64748b' }}>{formatCurrency(charges?.total || 0, currency)}</span>
          </div>
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span style={{ color: '#334155' }}>Total Required:</span>
            <span className="font-mono" style={{ color: '#059669', fontSize: '0.9rem' }}>{formatCurrency(totalRequired, currency)}</span>
          </div>
        </div>

        {/* Error / Success feedback */}
        {error && (
          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}

        {/* Non-Market Hours (AMO) Explainer Banner */}
        {!marketStatus.isOpen && (
          <div style={{
            background: '#faf5ff',
            border: '1px solid #d8b4fe',
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: '#581c87',
            lineHeight: 1.4
          }}>
            <Clock size={16} style={{ flexShrink: 0, color: '#7e22ce' }} />
            <span>
              <strong>Market Closed (AMO Active):</strong> Order will be taken and queued. It will <strong>not be processed to buy or sell</strong> until the market opens.
            </span>
          </div>
        )}

        {/* Submit Execution Button */}
        <button
          type="submit"
          disabled={loading}
          className={action === 'BUY' ? 'btn-buy' : 'btn-sell'}
          style={{ 
            width: '100%', 
            marginTop: 'auto', 
            padding: '12px', 
            fontSize: '0.95rem',
            background: !marketStatus.isOpen 
              ? (action === 'BUY' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)')
              : undefined,
            boxShadow: !marketStatus.isOpen ? '0 4px 14px rgba(5, 150, 105, 0.25)' : undefined
          }}
        >
          {loading 
            ? 'Submitting...' 
            : !marketStatus.isOpen 
              ? `Queue AMO ${action} (${qty} shares @ ${formatCurrency(effectivePrice, currency)})`
              : `${action} ${qty} ${quote?.shortName || quote?.symbol} @ ${formatCurrency(effectivePrice, currency)}`
          }
        </button>
      </form>
    </div>
  );
}
