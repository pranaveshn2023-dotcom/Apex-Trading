import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Trash2, BarChart2, X, Check, ArrowRight } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { isAnyMarketOpen } from '../utils/marketHours';
import { MASTER_INSTRUMENTS } from '../data/masterInstruments';

function filterLocalInstruments(query) {
  if (!query) return [];
  const q = query.trim().toLowerCase();
  const cleanQ = q.replace(/[\^.]/g, '');
  const exact = [];
  const starts = [];
  const contains = [];

  for (const inst of MASTER_INSTRUMENTS) {
    const sym = inst.symbol.toLowerCase();
    const cleanSym = sym.replace(/[\^.]/g, '');
    const name = (inst.name || '').toLowerCase();
    const shortName = (inst.shortName || '').toLowerCase();

    if (sym === q || cleanSym === cleanQ || name === q) {
      exact.push(inst);
    } else if (sym.startsWith(q) || cleanSym.startsWith(cleanQ) || name.startsWith(q) || shortName.startsWith(q)) {
      starts.push(inst);
    } else if (sym.includes(q) || cleanSym.includes(cleanQ) || name.includes(q) || shortName.includes(q)) {
      contains.push(inst);
    }
  }

  return [...exact, ...starts, ...contains].slice(0, 30);
}

export default function KiteMarketwatch({ 
  watchlists = [], 
  activeSymbol, 
  onSelectSymbol, 
  onOpenOrderModal, 
  onRemoveSymbol,
  onAddToWatchlist,
  onOpenSearch
}) {
  const [activeWlIdx, setActiveWlIdx] = useState(0);
  const [quotesMap, setQuotesMap] = useState({});
  const [hoveredSymbol, setHoveredSymbol] = useState(null);
  
  // Inline Broker Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [searchCategory, setSearchCategory] = useState('ALL');
  
  const searchInputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const searchSeqRef = useRef(0);

  const activeWatchlist = watchlists?.[activeWlIdx] || watchlists?.[0];
  const activeSymbols = activeWatchlist?.symbols || [];

  // Fetch Batch Quotes for Active Watchlist
  const fetchBatchQuotes = useCallback(() => {
    if (!activeWatchlist || !activeWatchlist.symbols || activeWatchlist.symbols.length === 0) return;

    fetch('/api/market/batch-quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols: activeWatchlist.symbols })
    })
    .then(res => res.json())
    .then(res => {
      if (res.success && res.data) {
        const map = {};
        res.data.forEach(q => {
          if (q) {
            if (q.symbol) map[q.symbol] = q;
            if (q.requestedSymbol) map[q.requestedSymbol] = q;
          }
        });
        setQuotesMap(prev => ({ ...prev, ...map }));
      }
    })
    .catch(console.error);
  }, [activeWatchlist]);

  // Initial fetch and smart polling (pauses on market close & tab hide)
  useEffect(() => {
    fetchBatchQuotes();

    const timer = setInterval(() => {
      if (document.hidden || !isAnyMarketOpen()) return;
      fetchBatchQuotes();
    }, 5000);

    const handleVisibility = () => {
      if (!document.hidden && isAnyMarketOpen()) {
        fetchBatchQuotes();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchBatchQuotes]);

  // Handle Search Input Changes
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    const trimmed = val.trim();

    if (!trimmed) {
      setSearchResults([]);
      setIsSearchingOnline(false);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      return;
    }

    // 0ms instant match from master catalog
    const localMatches = filterLocalInstruments(trimmed);
    setSearchResults(localMatches);

    // Debounced remote search
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      const currentSeq = ++searchSeqRef.current;
      setIsSearchingOnline(true);
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(trimmed)}`);
        const json = await res.json();
        if (currentSeq !== searchSeqRef.current) return;

        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          const seen = new Set(json.data.map(d => d.symbol));
          const merged = [...json.data];
          for (const m of localMatches) {
            if (!seen.has(m.symbol)) {
              merged.push(m);
              seen.add(m.symbol);
            }
          }
          setSearchResults(merged);
        }
      } catch {
        // Keep local matches
      } finally {
        if (currentSeq === searchSeqRef.current) {
          setIsSearchingOnline(false);
        }
      }
    }, 180);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchingOnline(false);
    searchInputRef.current?.focus();
  };

  // Keyboard shortcut: ESC to clear search
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClearSearch();
    } else if (e.key === 'Enter' && searchResults.length > 0) {
      const first = filteredSearchResults[0] || searchResults[0];
      if (first) {
        onSelectSymbol(first.symbol);
      }
    }
  };

  const isSearchActive = searchQuery.trim().length > 0;

  // Filter search results by category
  const filteredSearchResults = searchResults.filter(item => {
    if (searchCategory === 'ALL') return true;
    if (searchCategory === 'INDEX') return item.type === 'INDEX' || item.sector === 'Index' || item.symbol.startsWith('^');
    if (searchCategory === 'NSE') return item.exchange === 'NSE' && item.type !== 'INDEX';
    if (searchCategory === 'BSE') return item.exchange === 'BSE';
    return true;
  });

  // Check if a symbol is in active watchlist
  const isInActiveWatchlist = (sym) => activeSymbols.includes(sym);

  const handleAddSymbol = (e, sym) => {
    e.stopPropagation();
    if (onAddToWatchlist) {
      onAddToWatchlist(activeWatchlist?.id || 'default', sym);
    }
  };

  return (
    <div style={{ 
      background: '#ffffff', 
      borderRight: '1px solid #e2e8f0', 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      minHeight: 'calc(100vh - 60px)',
      userSelect: 'none'
    }}>
      {/* Broker Search & Add Bar */}
      <div style={{ 
        padding: '10px 14px', 
        borderBottom: '1px solid #e2e8f0', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        background: isSearchActive ? '#f8fafc' : '#ffffff',
        transition: 'background 0.15s ease'
      }}>
        <Search size={15} color="#059669" style={{ flexShrink: 0 }} />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search & add (eg: tata, nifty, infy)..."
          style={{
            background: 'transparent',
            border: 'none',
            color: '#0f172a',
            fontSize: '0.82rem',
            width: '100%',
            outline: 'none',
            fontWeight: 500
          }}
        />

        {isSearchActive ? (
          <button
            onClick={handleClearSearch}
            style={{
              background: '#e2e8f0',
              border: 'none',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
              padding: 0,
              flexShrink: 0
            }}
            title="Clear search (ESC)"
          >
            <X size={12} />
          </button>
        ) : (
          <kbd 
            onClick={onOpenSearch}
            style={{ 
              fontSize: '0.65rem', 
              background: '#f1f5f9', 
              padding: '2px 5px', 
              borderRadius: '4px', 
              color: '#64748b', 
              fontWeight: 700, 
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="Open Universal Search (Ctrl+K)"
          >
            Ctrl+K
          </kbd>
        )}
      </div>

      {/* SEARCH MODE: Display Matching Results In-Place */}
      {isSearchActive ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search Header / Category Filter */}
          <div style={{ 
            padding: '6px 14px', 
            background: '#f8fafc', 
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem'
          }}>
            <span style={{ color: '#475569', fontWeight: 600 }}>
              {isSearchingOnline ? 'Searching markets...' : `${filteredSearchResults.length} instruments`}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['ALL', 'NSE', 'INDEX'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSearchCategory(cat)}
                  style={{
                    background: searchCategory === cat ? '#059669' : 'transparent',
                    color: searchCategory === cat ? '#ffffff' : '#64748b',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '1px 6px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredSearchResults.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontSize: '0.82rem', marginBottom: '8px' }}>
                  No match for "<b>{searchQuery}</b>"
                </p>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Try entering the full ticker symbol or use global search.
                </p>
                {onOpenSearch && (
                  <button
                    onClick={() => onOpenSearch(searchQuery)}
                    style={{
                      marginTop: '12px',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      color: '#059669',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Open Global Search →
                  </button>
                )}
              </div>
            ) : (
              filteredSearchResults.map((item) => {
                const isAdded = isInActiveWatchlist(item.symbol);
                const isSelected = activeSymbol === item.symbol;
                const isIndex = item.type === 'INDEX' || item.symbol.startsWith('^');
                const displayName = item.shortName || item.name || item.symbol.replace('.NS', '').replace('.BO', '');

                return (
                  <div
                    key={item.symbol}
                    onClick={() => onSelectSymbol(item.symbol)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 14px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      background: isSelected ? '#ecfdf5' : '#ffffff',
                      borderLeft: isSelected ? '3px solid #10b981' : '3px solid transparent',
                      transition: 'background 0.1s ease'
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = '#ffffff'; }}
                  >
                    {/* Symbol & Name */}
                    <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          fontSize: '0.84rem', 
                          color: isSelected ? '#047857' : '#0f172a' 
                        }}>
                          {displayName}
                        </span>
                        <span style={{ 
                          fontSize: '0.6rem', 
                          color: isIndex ? '#d97706' : '#64748b',
                          background: isIndex ? '#fef3c7' : '#f1f5f9',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          fontWeight: 700
                        }}>
                          {isIndex ? 'IND' : (item.exchange || 'NSE')}
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '0.68rem', 
                        color: '#64748b', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        marginTop: '1px'
                      }}>
                        {item.name || item.symbol}
                      </div>
                    </div>

                    {/* Action Buttons: Add, Buy, Sell */}
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* ADD / ADDED BUTTON */}
                      {isAdded ? (
                        <span style={{ 
                          fontSize: '0.68rem', 
                          color: '#059669', 
                          background: '#ecfdf5', 
                          border: '1px solid #a7f3d0', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <Check size={10} /> Added
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handleAddSymbol(e, item.symbol)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#059669',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#ecfdf5'; e.currentTarget.style.borderColor = '#10b981'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                          title={`Add ${item.symbol} to ${activeWatchlist?.name || 'Watchlist'}`}
                        >
                          <Plus size={11} /> Add
                        </button>
                      )}

                      {/* QUICK BUY BUTTON */}
                      <button
                        onClick={() => onOpenOrderModal({ symbol: item.symbol, name: displayName, price: item.basePrice || 100 }, 'BUY')}
                        style={{
                          background: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '2px 6px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Buy"
                      >
                        B
                      </button>

                      {/* QUICK SELL BUTTON */}
                      <button
                        onClick={() => onOpenOrderModal({ symbol: item.symbol, name: displayName, price: item.basePrice || 100 }, 'SELL')}
                        style={{
                          background: '#ea580c',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '2px 6px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Sell"
                      >
                        S
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* WATCHLIST MODE: Display Active Watchlist Items */
        <>
          {/* Watchlist Header: Items Count & Name */}
          <div style={{ 
            padding: '6px 14px', 
            fontSize: '0.72rem', 
            color: '#64748b', 
            display: 'flex', 
            justifyContent: 'space-between', 
            background: '#f8fafc', 
            borderBottom: '1px solid #e2e8f0' 
          }}>
            <span>{activeSymbols.length} / 50 items</span>
            <span style={{ color: '#059669', fontWeight: 700 }}>
              {activeWatchlist?.name || `Watchlist ${activeWlIdx + 1}`}
            </span>
          </div>

          {/* Watchlist Stock Items List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeSymbols.length === 0 ? (
              <div style={{ padding: '40px 18px', textAlign: 'center', color: '#64748b' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px', 
                  background: '#ecfdf5', 
                  color: '#059669', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                  border: '1px solid #a7f3d0'
                }}>
                  <Plus size={20} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: '4px' }}>
                  Watchlist is Empty
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4, margin: '0 0 16px 0' }}>
                  Type any stock or index name in the search bar above to monitor live quotes.
                </p>

                {/* Quick 1-Click Suggestions */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Quick Benchmarks:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                    {[
                      { label: '+ NIFTY 50', sym: '^NSEI' },
                      { label: '+ BANK NIFTY', sym: '^NSEBANK' },
                      { label: '+ RELIANCE', sym: 'RELIANCE.NS' },
                      { label: '+ TATA MOTORS', sym: 'TATAMOTORS.NS' }
                    ].map(b => (
                      <button
                        key={b.sym}
                        onClick={() => {
                          if (onAddToWatchlist) onAddToWatchlist(activeWatchlist?.id || 'default', b.sym);
                          onSelectSymbol(b.sym);
                        }}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: '#047857',
                          cursor: 'pointer'
                        }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              activeSymbols.map(sym => {
                const quote = quotesMap[sym];
                const isSelected = activeSymbol === sym;
                const isHovered = hoveredSymbol === sym;
                const isUp = (quote?.change || 0) >= 0;
                const isIndex = sym.startsWith('^') || quote?.type === 'INDEX';
                const isETF = sym.endsWith('BEES.NS') || quote?.type === 'ETF';
                const displayName = quote?.shortName || quote?.name || sym.replace('.NS', '').replace('.BO', '');
                const currency = quote?.currency || 'INR';

                return (
                  <div
                    key={sym}
                    onMouseEnter={() => setHoveredSymbol(sym)}
                    onMouseLeave={() => setHoveredSymbol(null)}
                    onClick={() => onSelectSymbol(sym)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderBottom: '1px solid #f1f5f9',
                      background: isSelected ? '#ecfdf5' : isHovered ? '#f0fdf4' : 'transparent',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.1s ease',
                      borderLeft: isSelected ? '3px solid #10b981' : '3px solid transparent'
                    }}
                  >
                    {/* Left: Stock Name & Exchange */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          fontSize: '0.86rem', 
                          color: isSelected ? '#047857' : '#0f172a' 
                        }}>
                          {displayName}
                        </span>
                        <span style={{ 
                          fontSize: '0.62rem', 
                          color: isIndex ? '#d97706' : (isETF ? '#059669' : '#64748b'),
                          background: isIndex ? '#fef3c7' : (isETF ? '#ecfdf5' : '#f1f5f9'),
                          padding: '1px 5px',
                          borderRadius: '3px',
                          fontWeight: 700
                        }}>
                          {isIndex ? 'IDX' : (isETF ? 'ETF' : (quote?.exchange || 'NSE'))}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                        {sym}
                      </div>
                    </div>

                    {/* Right: Price / Hover Action Buttons */}
                    {isHovered ? (
                      <div 
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* BUY BUTTON */}
                        <button
                          onClick={() => onOpenOrderModal(quote || { symbol: sym, name: displayName, price: quote?.price || 100 }, 'BUY')}
                          style={{
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Buy (B)"
                        >
                          B
                        </button>

                        {/* SELL BUTTON */}
                        <button
                          onClick={() => onOpenOrderModal(quote || { symbol: sym, name: displayName, price: quote?.price || 100 }, 'SELL')}
                          style={{
                            background: '#ea580c',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Sell (S)"
                        >
                          S
                        </button>

                        {/* CHART BUTTON */}
                        <button
                          onClick={() => onSelectSymbol(sym)}
                          style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            padding: '3px 6px',
                            cursor: 'pointer'
                          }}
                          title="View Chart"
                        >
                          <BarChart2 size={12} />
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => onRemoveSymbol(activeWatchlist.id, sym)}
                          style={{
                            background: '#f1f5f9',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            padding: '3px 6px',
                            cursor: 'pointer'
                          }}
                          title="Delete"
                          onMouseEnter={(e) => e.currentTarget.style.color = '#e11d48'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'right' }}>
                        <div className="font-mono" style={{ fontSize: '0.86rem', fontWeight: 700, color: isUp ? '#059669' : '#e11d48' }}>
                          {quote?.price != null ? formatCurrency(quote.price, currency) : '—'}
                        </div>
                        {quote?.change != null && (
                          <div 
                            className="font-mono" 
                            style={{ fontSize: '0.7rem', color: isUp ? '#059669' : '#e11d48' }}
                          >
                            {isUp ? `+${quote.change?.toFixed(2)}` : quote.change?.toFixed(2)} ({formatPercent(quote.changePercent)})
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* 7 Broker Watchlist Tabs (1, 2, 3, 4, 5, 6, 7) */}
      <div style={{ 
        display: 'flex', 
        borderTop: '1px solid #e2e8f0', 
        background: '#ffffff',
        height: '36px',
        alignItems: 'center'
      }}>
        {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
          const wl = watchlists?.[idx];
          const hasSymbols = wl && wl.symbols && wl.symbols.length > 0;
          return (
            <button
              key={idx}
              onClick={() => {
                setActiveWlIdx(idx);
                if (isSearchActive) setSearchQuery('');
              }}
              style={{
                flex: 1,
                height: '100%',
                background: activeWlIdx === idx ? '#ecfdf5' : 'transparent',
                border: 'none',
                borderTop: activeWlIdx === idx ? '2px solid #059669' : '2px solid transparent',
                color: activeWlIdx === idx ? '#059669' : '#64748b',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                position: 'relative'
              }}
              title={wl?.name || `Watchlist ${idx + 1}`}
            >
              {idx + 1}
              {hasSymbols && (
                <span style={{
                  position: 'absolute',
                  top: '5px',
                  right: '6px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: activeWlIdx === idx ? '#059669' : '#94a3b8'
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
