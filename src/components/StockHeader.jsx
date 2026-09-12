import React from 'react';
import { ArrowUpRight, ArrowDownRight, Bookmark, BookmarkCheck } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { getMarketStatusForSymbol } from '../utils/marketHours';

export default function StockHeader({ 
  quote, 
  isInWatchlist, 
  onToggleWatchlist 
}) {
  if (!quote) return null;

  const isUp = (quote.change || 0) >= 0;
  const currency = quote.currency || 'INR';

  const dayRangePct = quote.high > quote.low 
    ? Math.min(100, Math.max(0, ((quote.price - quote.low) / (quote.high - quote.low)) * 100))
    : 50;
  
  const yearRangePct = quote.fiftyTwoWeekHigh > quote.fiftyTwoWeekLow
    ? Math.min(100, Math.max(0, ((quote.price - quote.fiftyTwoWeekLow) / (quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow)) * 100))
    : 50;

  const displayName = quote.shortName || quote.name || quote.symbol;
  const isIndex = quote.type === 'INDEX' || quote.symbol.startsWith('^');

  return (
    <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        {/* Left: Stock Identification & Sector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                {displayName}
              </h1>

              {/* Symbol Tag */}
              <span style={{ 
                fontSize: '0.72rem', 
                fontWeight: 700, 
                padding: '2px 6px', 
                borderRadius: '4px', 
                background: '#f1f5f9', 
                color: '#475569',
                border: '1px solid #e2e8f0'
              }}>
                {quote.symbol}
              </span>

              {/* Exchange Badge */}
              <span style={{ 
                fontSize: '0.7rem', 
                fontWeight: 700, 
                padding: '2px 6px', 
                borderRadius: '4px', 
                background: '#ecfdf5', 
                color: '#059669',
                border: '1px solid #a7f3d0'
              }}>
                {quote.exchange || 'NSE'}
              </span>

              {/* Type Badge */}
              <span style={{ 
                fontSize: '0.68rem', 
                fontWeight: 700, 
                padding: '2px 6px', 
                borderRadius: '4px', 
                background: isIndex ? '#fffbeb' : '#f0fdf4',
                color: isIndex ? '#b45309' : '#047857',
                border: `1px solid ${isIndex ? '#fde68a' : '#a7f3d0'}`
              }}>
                {quote.type || (isIndex ? 'INDEX' : 'EQUITY')}
              </span>

              {/* Dynamic Market Status Badge */}
              {(() => {
                const status = getMarketStatusForSymbol(quote.symbol);
                return (
                  <span 
                    title={status.tooltip}
                    style={{ 
                      fontSize: '0.68rem', 
                      fontWeight: 700, 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      background: status.bg, 
                      color: status.color, 
                      border: `1px solid ${status.borderColor}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span 
                      className={status.isOpen ? "pulse-live" : ""}
                      style={{ 
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: status.isOpen ? '#10b981' : '#94a3b8'
                      }} 
                    />
                    {status.isOpen ? `${status.market} LIVE` : `${status.market} CLOSED`}
                  </span>
                );
              })()}
            </div>

            <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
              {quote.name} • <span style={{ color: '#64748b' }}>{quote.sector || 'Equities'}</span>
            </div>
          </div>

          <button 
            onClick={onToggleWatchlist}
            className="btn-ghost"
            style={{ 
              padding: '8px', 
              borderRadius: '8px', 
              background: isInWatchlist ? '#fef3c7' : '#ffffff',
              borderColor: isInWatchlist ? '#fcd34d' : '#e2e8f0'
            }}
            title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            {isInWatchlist ? (
              <BookmarkCheck size={18} color="#d97706" />
            ) : (
              <Bookmark size={18} color="#64748b" />
            )}
          </button>
        </div>

        {/* Center: Live Price & Day P&L */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
          <div className="font-mono" style={{ fontSize: 'clamp(1.5rem, 4vw, 1.9rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {formatCurrency(quote.price, currency)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span 
              className={`font-mono ${isUp ? 'profit-bg' : 'loss-bg'}`}
              style={{ 
                fontSize: '0.85rem', 
                fontWeight: 700, 
                padding: '3px 8px', 
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {formatCurrency(quote.change, currency, true)} ({formatPercent(quote.changePercent)})
            </span>
          </div>
        </div>

        {/* Right: Day Range & 52-Week Range */}
        <div className="stock-header-ranges" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* Day High / Low */}
          <div style={{ minWidth: '140px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>
              <span>L: <b className="font-mono" style={{ color: '#0f172a' }}>{formatCurrency(quote.low, currency)}</b></span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0 8px', letterSpacing: '0.04em' }}>Day Range</span>
              <span>H: <b className="font-mono" style={{ color: '#0f172a' }}>{formatCurrency(quote.high, currency)}</b></span>
            </div>
            <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', position: 'relative' }}>
              <div style={{ 
                position: 'absolute', 
                left: `${dayRangePct}%`, 
                top: '-3px', 
                width: '11px', 
                height: '11px', 
                borderRadius: '50%', 
                background: '#059669', 
                transform: 'translateX(-50%)',
                boxShadow: '0 0 6px rgba(5, 150, 105, 0.4)'
              }} />
            </div>
          </div>

          {/* 52-Week High / Low */}
          <div style={{ minWidth: '140px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>
              <span>52W L: <b className="font-mono" style={{ color: '#0f172a' }}>{formatCurrency(quote.fiftyTwoWeekLow, currency)}</b></span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0 8px', letterSpacing: '0.04em' }}>52W Range</span>
              <span>52W H: <b className="font-mono" style={{ color: '#0f172a' }}>{formatCurrency(quote.fiftyTwoWeekHigh, currency)}</b></span>
            </div>
            <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', position: 'relative' }}>
              <div style={{ 
                position: 'absolute', 
                left: `${yearRangePct}%`, 
                top: '-3px', 
                width: '11px', 
                height: '11px', 
                borderRadius: '50%', 
                background: '#10b981', 
                transform: 'translateX(-50%)'
              }} />
            </div>
          </div>

          {/* Volume */}
          <div style={{ textAlign: 'right', minWidth: '80px' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Volume</div>
            <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
              {Number(quote.volume || 0).toLocaleString('en-US')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
