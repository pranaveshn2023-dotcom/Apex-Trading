import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Sparkles, ArrowRight, Check } from 'lucide-react';

export default function StockSearchModal({ isOpen, onClose, onSelectStock }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      handleSearch('NIFTY');
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const handleSearch = async (q) => {
    if (!q || q.trim().length === 0) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/market/search?q=${encodeURIComponent(q.trim())}`);
      const res = await response.json();
      if (res && res.success && res.data) {
        setResults(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (val) => {
    setQuery(val);
    if (val.trim().length >= 1) {
      handleSearch(val);
    } else {
      handleSearch('NIFTY');
    }
  };

  if (!isOpen) return null;

  const popularPicks = [
    { label: 'NIFTY 50', symbol: '^NSEI' },
    { label: 'BANK NIFTY', symbol: '^NSEBANK' },
    { label: 'SENSEX', symbol: '^BSESN' },
    { label: 'RELIANCE', symbol: 'RELIANCE.NS' },
    { label: 'TATA MOTORS', symbol: 'TATAMOTORS.NS' },
    { label: 'HDFCBANK', symbol: 'HDFCBANK.NS' },
    { label: 'NIFTY BEES (ETF)', symbol: 'NIFTYBEES.NS' },
    { label: 'S&P 500', symbol: '^GSPC' },
    { label: 'NASDAQ', symbol: '^IXIC' },
    { label: 'APPLE', symbol: 'AAPL' }
  ];

  const categories = [
    { id: 'ALL', label: 'All Instruments' },
    { id: 'NSE', label: 'NSE Equities' },
    { id: 'INDEX', label: 'Indices & Benchmarks' },
    { id: 'ETF', label: 'Index ETFs' },
    { id: 'GLOBAL', label: 'Global (US)' }
  ];

  const filteredResults = results.filter(stock => {
    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'INDEX') return stock.type === 'INDEX' || stock.sector === 'Index' || stock.symbol.startsWith('^');
    if (categoryFilter === 'ETF') return stock.type === 'ETF' || stock.symbol.endsWith('BEES.NS');
    if (categoryFilter === 'NSE') return stock.exchange === 'NSE' && stock.type !== 'INDEX';
    if (categoryFilter === 'GLOBAL') return stock.exchange === 'NASDAQ' || stock.exchange === 'NYSE' || stock.symbol.startsWith('^G') || stock.symbol.startsWith('^IX');
    return true;
  });

  const cleanQuery = query.trim().toUpperCase();
  const directSymbol = cleanQuery;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="glass-panel-elevated"
        style={{ width: '700px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff' }}>
          <Search size={22} color="#059669" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && directSymbol) {
                onSelectStock(directSymbol);
                onClose();
              }
            }}
            placeholder="Search ANY stock or index (e.g. Nifty 50, Bank Nifty, Sensex, Reliance, TMPV, Apple, Tesla, S&P 500)..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#0f172a',
              fontSize: '1.02rem',
              outline: 'none',
              fontWeight: 500
            }}
          />
          {query && (
            <button
              onClick={() => handleInputChange('')}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '6px', cursor: 'pointer', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600 }}
          >
            ESC
          </button>
        </div>

        {/* Popular Quick-Select Chips */}
        <div style={{ padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '6px', overflowX: 'auto', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', marginRight: '4px' }}>
            Trending:
          </span>
          {popularPicks.map(p => (
            <button
              key={p.symbol}
              onClick={() => {
                onSelectStock(p.symbol);
                onClose();
              }}
              style={{
                background: '#ffffff',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#059669';
                e.currentTarget.style.color = '#059669';
                e.currentTarget.style.background = '#ecfdf5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.color = '#334155';
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Category Filters */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '6px', overflowX: 'auto', background: '#ffffff' }}>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              style={{
                background: categoryFilter === c.id ? '#ecfdf5' : 'transparent',
                color: categoryFilter === c.id ? '#047857' : '#64748b',
                border: `1px solid ${categoryFilter === c.id ? '#a7f3d0' : 'transparent'}`,
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Direct Ticker Match Option */}
        {cleanQuery.length >= 2 && (
          <div 
            onClick={() => {
              onSelectStock(directSymbol);
              onClose();
            }}
            style={{
              padding: '12px 20px',
              background: '#ecfdf5',
              borderBottom: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: '#047857',
              fontSize: '0.88rem',
              fontWeight: 600
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} color="#059669" />
              <span>Load Real Live Quote & Chart for <b>{directSymbol}</b> from Exchange</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', background: '#059669', color: '#fff', padding: '3px 8px', borderRadius: '4px' }}>
              <span>Press Enter</span>
              <ArrowRight size={14} />
            </div>
          </div>
        )}

        {/* Results List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px', background: '#ffffff' }}>
          {loading && results.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: '#059669', fontSize: '0.9rem' }}>
              <div className="pulse-live" style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#059669', margin: '0 auto 12px auto' }} />
              Connecting to Live Exchanges...
            </div>
          ) : filteredResults.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              No pre-indexed matches for "{query}". You can press Enter or click the banner above to load <b>{directSymbol}</b> directly.
            </div>
          ) : (
            filteredResults.map(stock => {
              const isIndex = stock.type === 'INDEX' || stock.sector === 'Index' || stock.symbol.startsWith('^');
              const isETF = stock.type === 'ETF' || stock.symbol.endsWith('BEES.NS');

              return (
                <div
                  key={stock.symbol}
                  onClick={() => {
                    onSelectStock(stock.symbol);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    borderBottom: '1px solid #f1f5f9'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '8px', 
                      background: isIndex 
                        ? '#fffbeb' 
                        : (isETF ? '#ecfdf5' : '#f0fdf4'),
                      color: isIndex ? '#b45309' : '#047857',
                      border: `1px solid ${isIndex ? '#fde68a' : '#a7f3d0'}`,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {isIndex ? 'IDX' : (isETF ? 'ETF' : (stock.shortName?.[0] || '₹'))}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                          {stock.shortName || stock.name || stock.symbol}
                        </span>
                        <span style={{ 
                          fontSize: '0.68rem', 
                          fontWeight: 700,
                          color: '#059669', 
                          background: '#ecfdf5', 
                          border: '1px solid #a7f3d0',
                          padding: '1px 6px', 
                          borderRadius: '4px' 
                        }}>
                          {stock.exchange || 'EXCHANGE'}
                        </span>
                        {isIndex && (
                          <span style={{ fontSize: '0.65rem', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                            INDEX
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                        <span style={{ color: '#334155' }}>{stock.name}</span> • <span style={{ color: '#64748b' }}>{stock.sector || 'Equities'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="font-mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>
                      {stock.symbol}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '2px', fontWeight: 700 }}>
                      Click to Chart →
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
