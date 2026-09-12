import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Clock, Target, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { getMarketStatusForSymbol } from '../utils/marketHours';

export default function KiteOrderModal({ 
  isOpen, 
  onClose, 
  quote, 
  defaultAction = 'BUY', 
  portfolio, 
  onPlaceOrder,
  beginnerMode = false
}) {
  if (!isOpen || !quote) return null;

  const [action, setAction] = useState(defaultAction); // 'BUY' | 'SELL'
  const [product, setProduct] = useState('CNC'); // 'MIS' (Intraday) | 'CNC' (Longterm)
  const [orderType, setOrderType] = useState('MARKET'); // 'MARKET' | 'LIMIT' | 'SL' | 'SL-M'
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(quote.price || 0);
  const [triggerPrice, setTriggerPrice] = useState(0);
  const [thesis, setThesis] = useState('');
  const [enableGtt, setEnableGtt] = useState(false);
  const [stoplossPct, setStoplossPct] = useState(1.5);
  const [targetPct, setTargetPct] = useState(3.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    setAction(defaultAction);
    setPrice(quote.price || 0);
    setQty(quote.lotSize || 1);
    if (quote.isOption) {
      setProduct('MIS');
    }
    setError(null);
    setSuccessMsg(null);
  }, [defaultAction, quote]);

  const currency = quote.currency || 'INR';
  const ltp = quote.price || 0;
  const isBuy = action === 'BUY';
  const isIndex = quote.type === 'INDEX' || quote.symbol.startsWith('^');
  const marketStatus = getMarketStatusForSymbol(quote.symbol);

  // Zerodha style: Buy = Emerald Green, Sell = Rose Red
  const headerBg = isBuy 
    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' 
    : 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)';

  // Margin calculation: Options premium requires 100% upfront (no 5x intraday multiplier for option buying)
  const executionPrice = (orderType === 'MARKET' || orderType === 'SL-M') ? ltp : Number(price);
  const orderValue = executionPrice * Number(qty);
  const marginMultiplier = quote.isOption ? 1.0 : (product === 'MIS' ? 0.2 : 1.0); // 5x leverage on stock MIS
  const marginRequired = orderValue * marginMultiplier;
  const brokerage = Math.min(20, orderValue * 0.0005);
  const taxes = orderValue * 0.001; // Approximate STT + GST + Stamp
  const totalRequired = marginRequired + brokerage + taxes;

  const cashBalance = portfolio?.cashBalance || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (qty <= 0) {
      setError('Quantity must be at least 1 share.');
      return;
    }

    if (isBuy && totalRequired > cashBalance) {
      setError(`Insufficient margin! Required: ${formatCurrency(totalRequired, currency)}, Available: ${formatCurrency(cashBalance, currency)}`);
      return;
    }

    setLoading(true);

    try {
      await onPlaceOrder({
        symbol: quote.symbol,
        name: quote.shortName || quote.name || quote.symbol,
        action,
        product,
        orderType,
        qty: Number(qty),
        price: executionPrice,
        triggerPrice: (orderType === 'SL' || orderType === 'SL-M') ? Number(triggerPrice) : null,
        thesis,
        gtt: enableGtt ? { stoplossPct, targetPct } : null
      });

      if (marketStatus.isOpen) {
        setSuccessMsg(`Order executed! ${action} ${qty} ${quote.shortName || quote.symbol} @ ${formatCurrency(executionPrice, currency)}`);
      } else {
        setSuccessMsg(`AMO Queued: ${action} ${qty} ${quote.shortName || quote.symbol} (Market Closed)`);
      }

      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        style={{
          width: 'min(460px, 95vw)',
          maxHeight: '90dvh',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Iconic Header Bar */}
        <div style={{ background: headerBg, padding: '14px 20px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
                {action} {quote.shortName || quote.name || quote.symbol}
              </span>
              <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.25)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                {quote.exchange || 'NSE'}
              </span>
              {isIndex && (
                <span style={{ fontSize: '0.65rem', background: 'rgba(255, 255, 255, 0.25)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  INDEX
                </span>
              )}
            </div>
            <div className="font-mono" style={{ fontSize: '0.82rem', opacity: 0.95, marginTop: '2px' }}>
              {formatCurrency(quote.price, currency)} ({formatPercent(quote.changePercent)})
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Switch Buy / Sell Toggle */}
            <div style={{ background: 'rgba(255, 255, 255, 0.25)', borderRadius: '6px', display: 'flex', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setAction('BUY')}
                style={{
                  background: action === 'BUY' ? '#ffffff' : 'transparent',
                  color: action === 'BUY' ? '#047857' : '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                B
              </button>
              <button
                type="button"
                onClick={() => setAction('SELL')}
                style={{
                  background: action === 'SELL' ? '#ffffff' : 'transparent',
                  color: action === 'SELL' ? '#be123c' : '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                S
              </button>
            </div>

            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#ffffff' }}>
          
          {/* Beginner Mode explainer */}
          {beginnerMode && (
            <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '8px 12px', fontSize: '0.75rem', color: '#047857', lineHeight: 1.5 }}>
              <b>Quick guide:</b> <b>CNC</b> = delivery buy (shares are yours, hold for years, zero brokerage).
              <b> MIS</b> = same-day intraday with ~5x leverage (must exit today). MARKET executes now, LIMIT waits for your price.
            </div>
          )}

          {/* Product Types: Intraday MIS vs Longterm CNC */}
          <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: product === 'MIS' ? '#059669' : '#64748b', cursor: 'pointer', fontWeight: 700 }}>
              <input
                type="radio"
                name="product"
                checked={product === 'MIS'}
                onChange={() => setProduct('MIS')}
                style={{ accentColor: '#059669' }}
              />
              <span>Intraday <b style={{ fontSize: '0.72rem', color: '#d97706' }}>MIS 5x</b></span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: product === 'CNC' ? '#059669' : '#64748b', cursor: 'pointer', fontWeight: 700 }}>
              <input
                type="radio"
                name="product"
                checked={product === 'CNC'}
                onChange={() => setProduct('CNC')}
                style={{ accentColor: '#059669' }}
              />
              <span>Longterm <b style={{ fontSize: '0.72rem', color: '#059669' }}>CNC</b></span>
            </label>
          </div>

          {/* Quantity & Price Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Qty. {quote.lotSize ? <span style={{ color: '#059669', fontSize: '0.7rem' }}>({quote.lotSize} shares/lot)</span> : ''}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="font-mono"
                  required
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0f172a',
                    padding: '8px 10px',
                    width: '100%',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Price (₹)
              </label>
              <input
                type="number"
                step="0.05"
                disabled={orderType === 'MARKET' || orderType === 'SL-M'}
                value={orderType === 'MARKET' || orderType === 'SL-M' ? ltp : price}
                onChange={(e) => setPrice(e.target.value)}
                className="font-mono"
                placeholder={ltp.toString()}
                style={{
                  width: '100%',
                  background: (orderType === 'MARKET' || orderType === 'SL-M') ? '#f1f5f9' : '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: (orderType === 'MARKET' || orderType === 'SL-M') ? '#64748b' : '#0f172a',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Trigger Price (if SL / SL-M) */}
          {(orderType === 'SL' || orderType === 'SL-M') && (
            <div>
              <label style={{ fontSize: '0.75rem', color: '#be123c', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Trigger Price (₹)
              </label>
              <input
                type="number"
                step="0.05"
                value={triggerPrice}
                onChange={(e) => setTriggerPrice(e.target.value)}
                className="font-mono"
                required
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#e11d48',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>
          )}

          {/* Order Types: Market, Limit, SL, SL-M */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            {['MARKET', 'LIMIT', 'SL', 'SL-M'].map(type => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: orderType === type ? '#059669' : '#64748b', cursor: 'pointer', fontWeight: 700 }}>
                <input
                  type="radio"
                  name="orderType"
                  checked={orderType === type}
                  onChange={() => setOrderType(type)}
                  style={{ accentColor: '#059669' }}
                />
                <span>{type}</span>
              </label>
            ))}
          </div>

          {/* Zerodha GTT Feature (Stoploss & Target) */}
          <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.8rem', color: '#0f172a', fontWeight: 700 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={15} color="#059669" /> Set GTT Stoploss & Target
              </span>
              <input
                type="checkbox"
                checked={enableGtt}
                onChange={(e) => setEnableGtt(e.target.checked)}
                style={{ accentColor: '#059669' }}
              />
            </label>

            {enableGtt && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#be123c', fontWeight: 700 }}>Stoploss (-{stoplossPct}%)</label>
                  <input
                    type="number"
                    value={stoplossPct}
                    onChange={(e) => setStoplossPct(Number(e.target.value))}
                    className="font-mono"
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #fecdd3', color: '#be123c', padding: '6px 8px', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700 }}>Target (+{targetPct}%)</label>
                  <input
                    type="number"
                    value={targetPct}
                    onChange={(e) => setTargetPct(Number(e.target.value))}
                    className="font-mono"
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #a7f3d0', color: '#047857', padding: '6px 8px', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Trade Thesis / Note */}
          <div>
            <label style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <Sparkles size={13} /> TRADE REASON / JOURNAL THESIS
            </label>
            <input
              type="text"
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              placeholder="e.g. 50 EMA bounce, strong Q3 result, resistance breakout"
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Margin Required & Available Margin Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div>
              <span>Margin required: </span>
              <b className="font-mono" style={{ color: '#0f172a' }}>{formatCurrency(totalRequired, currency)}</b>
            </div>
            <div>
              <span>Available: </span>
              <b className="font-mono" style={{ color: '#059669' }}>₹{cashBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem' }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          {/* Non-Market Hours (AMO) Notice */}
          {!marketStatus.isOpen && (
            <div style={{
              background: '#faf5ff',
              border: '1px solid #d8b4fe',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.78rem',
              color: '#581c87',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              lineHeight: 1.4
            }}>
              <Clock size={16} style={{ flexShrink: 0, color: '#7e22ce' }} />
              <span>
                <strong>Market Closed (AMO Active):</strong> Order will be queued as After-Market Order and <strong>not executed to buy/sell</strong> until the session opens.
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                background: !marketStatus.isOpen 
                  ? (isBuy ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)')
                  : headerBg,
                color: '#ffffff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
              }}
            >
              {loading 
                ? 'Submitting...' 
                : !marketStatus.isOpen 
                  ? `Queue AMO ${isBuy ? 'Buy' : 'Sell'}`
                  : (isBuy ? 'Buy' : 'Sell')
              }
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              style={{ padding: '12px 20px', borderRadius: '8px', fontSize: '0.88rem' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
