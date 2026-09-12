import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronDown, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Zap, 
  BarChart2, 
  Sliders, 
  Info, 
  ArrowUpRight, 
  ArrowDownRight,
  ArrowRight
} from 'lucide-react';
import { 
  INDEX_F_AND_O_SPECS, 
  getExpiryDates, 
  generateFullOptionChain 
} from '../utils/optionPricing';
import { formatCurrency, formatPercent } from '../utils/formatters';

export default function OptionChain({ 
  indices = [], 
  onSelectOptionTrade = null, 
  onBackToTerminal = null 
}) {
  const [selectedIndex, setSelectedIndex] = useState('NIFTY');
  const [selectedExpiryIdx, setSelectedExpiryIdx] = useState(0);
  const [showGreeks, setShowGreeks] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);

  const expiries = useMemo(() => getExpiryDates(), []);
  const activeExpiry = expiries[selectedExpiryIdx] || expiries[0];

  // Look up live index spot price from actual feed
  const activeSpec = INDEX_F_AND_O_SPECS[selectedIndex] || INDEX_F_AND_O_SPECS['NIFTY'];
  const liveIndexData = indices?.find(i => i.symbol === activeSpec.symbol);

  // Use real-time live spot price, fallback to benchmark defaults if loading
  const spotPrice = liveIndexData?.price || (selectedIndex === 'NIFTY' ? 23400 : (selectedIndex === 'BANKNIFTY' ? 50200 : (selectedIndex === 'SENSEX' ? 77100 : 23100)));
  const spotChange = liveIndexData?.change || -79.70;
  const spotChangePercent = liveIndexData?.changePercent || -0.34;

  // Generate full live option chain
  const chainData = useMemo(() => {
    return generateFullOptionChain(
      selectedIndex,
      spotPrice,
      spotChange,
      spotChangePercent,
      activeExpiry
    );
  }, [selectedIndex, spotPrice, spotChange, spotChangePercent, activeExpiry]);

  // Max OI for comparative horizontal bar normalization
  const maxOI = useMemo(() => {
    let max = 1;
    chainData.rows.forEach(r => {
      if (r.callOI > max) max = r.callOI;
      if (r.putOI > max) max = r.putOI;
    });
    return max;
  }, [chainData]);

  // Find exact index where spot line should sit
  const spotDividerIndex = useMemo(() => {
    for (let i = 0; i < chainData.rows.length; i++) {
      if (chainData.rows[i].strike >= spotPrice) {
        return i;
      }
    }
    return Math.floor(chainData.rows.length / 2);
  }, [chainData.rows, spotPrice]);

  const handleTradeClick = (row, type) => {
    if (!onSelectOptionTrade) return;

    const isCall = type === 'CALL';
    const ltp = isCall ? row.callLTP : row.putLTP;
    const ticker = `${selectedIndex}${activeExpiry.dateStr.replace(' ', '').toUpperCase()}${row.strike}${isCall ? 'CE' : 'PE'}`;
    const friendlyName = `${activeSpec.name} ${activeExpiry.dateStr} ${row.strike} ${isCall ? 'CALL' : 'PUT'}`;

    onSelectOptionTrade({
      symbol: ticker,
      name: friendlyName,
      shortName: `${row.strike} ${isCall ? 'CE' : 'PE'}`,
      price: ltp,
      lotSize: chainData.lotSize,
      strike: row.strike,
      optionType: isCall ? 'CE' : 'PE',
      expiry: activeExpiry.fullDate,
      isOption: true,
      exchange: activeSpec.exchange,
      currency: 'INR'
    });
  };

  return (
    <div style={{
      maxWidth: '1440px',
      margin: '0 auto',
      background: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none'
    }}>
      
      {/* 1. Header Toolbar: Index Tabs, Expiry Dropdown, Live Spot */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e2e8f0',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        
        {/* Left: F&O Title & Index Selector Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#059669',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex'
            }}>
              <Layers size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Exchange F&O
              </div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Option Chain
              </h1>
            </div>
          </div>

          {/* Index Selector Pills (Nifty, Bank Nifty, Sensex, Fin Nifty) - Horizontal scroll on mobile */}
          <div style={{
            display: 'flex',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '3px',
            borderRadius: '10px',
            gap: '3px',
            overflowX: 'auto',
            maxWidth: '100%',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none'
          }}>
            {Object.keys(INDEX_F_AND_O_SPECS).map(idxKey => {
              const isSelected = selectedIndex === idxKey;
              return (
                <button
                  key={idxKey}
                  onClick={() => setSelectedIndex(idxKey)}
                  style={{
                    background: isSelected ? '#ffffff' : 'transparent',
                    color: isSelected ? '#059669' : '#64748b',
                    border: 'none',
                    borderRadius: '7px',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {INDEX_F_AND_O_SPECS[idxKey].name.replace('NIFTY FINANCIAL SERVICES', 'FIN NIFTY')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center/Right: Expiry Selector & Live Spot Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
          
          {/* Expiry Dropdown Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Expiry:</span>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedExpiryIdx}
                onChange={(e) => setSelectedExpiryIdx(Number(e.target.value))}
                style={{
                  appearance: 'none',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '7px 28px 7px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {expiries.map((exp, idx) => (
                  <option key={exp.dateStr} value={idx}>
                    {exp.dateStr} {exp.isMonthly ? '(Monthly)' : '(Weekly)'}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }} />
            </div>
          </div>

          {/* Real-Time Spot Price Pill */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Spot:</span>
            <span className="font-mono" style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
              ₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`font-mono ${spotChange >= 0 ? 'profit-text' : 'loss-text'}`} style={{ fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
              {spotChange >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {spotChange > 0 ? `+${spotChange.toFixed(2)}` : spotChange.toFixed(2)} ({formatPercent(spotChangePercent)})
            </span>
          </div>

          {/* PCR & Lot Size Badges */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              background: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
              padding: '4px 8px',
              borderRadius: '6px',
              whiteSpace: 'nowrap'
            }}>
              PCR: {chainData.pcr}
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
              padding: '4px 8px',
              borderRadius: '6px',
              whiteSpace: 'nowrap'
            }}>
              1 Lot = {chainData.lotSize}
            </span>
          </div>

        </div>
      </div>

      {/* 2. Main Option Chain Table */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
        <table 
          className="option-chain-table"
          style={{
            minWidth: showGreeks ? '680px' : '420px',
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.82rem',
            textAlign: 'center'
          }}
        >
          <thead>
            {/* Super Header: CALLS | STRIKE | PUTS */}
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th colSpan={showGreeks ? 5 : 2} style={{ padding: '8px', color: '#059669', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Calls (CE)
              </th>
              <th style={{ padding: '8px', color: '#0f172a', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: '140px' }}>
                Strike Price
              </th>
              <th colSpan={showGreeks ? 5 : 2} style={{ padding: '8px', color: '#e11d48', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Puts (PE)
              </th>
            </tr>

            {/* Column Headers */}
            <tr style={{ background: '#ffffff', borderBottom: '2px solid #e2e8f0', fontSize: '0.72rem', color: '#64748b' }}>
              {showGreeks && <th style={{ padding: '8px 10px' }}>Delta</th>}
              {showGreeks && <th style={{ padding: '8px 10px' }}>Theta</th>}
              {showGreeks && <th style={{ padding: '8px 10px' }}>IV %</th>}
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Call OI</th>
              <th style={{ padding: '8px 14px', textAlign: 'right', color: '#059669', fontWeight: 800 }}>Call LTP</th>
              <th style={{ padding: '8px 14px', fontWeight: 800, color: '#0f172a' }}>Strike</th>
              <th style={{ padding: '8px 14px', textAlign: 'left', color: '#e11d48', fontWeight: 800 }}>Put LTP</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Put OI</th>
              {showGreeks && <th style={{ padding: '8px 10px' }}>IV %</th>}
              {showGreeks && <th style={{ padding: '8px 10px' }}>Theta</th>}
              {showGreeks && <th style={{ padding: '8px 10px' }}>Delta</th>}
            </tr>
          </thead>

          <tbody>
            {chainData.rows.map((row, idx) => {
              const isHovered = hoveredRow === row.strike;
              const isAboveSpot = row.strike < spotPrice;
              const isBelowSpot = row.strike > spotPrice;

              // ITM shading: Call ITM (spot > strike), Put ITM (strike > spot)
              const callBg = row.isCallITM ? '#f0fdf4' : '#ffffff';
              const putBg = row.isPutITM ? '#f0fdf4' : '#ffffff';

              // Visual OI Bar calculation
              const callOIWidth = Math.min(100, Math.round((row.callOI / maxOI) * 100));
              const putOIWidth = Math.min(100, Math.round((row.putOI / maxOI) * 100));

              return (
                <React.Fragment key={row.strike}>
                  
                  {/* Spot Price Live Divider Line: rendered between strikes */}
                  {idx === spotDividerIndex && (
                    <tr style={{ background: '#f8fafc' }}>
                      <td 
                        colSpan={showGreeks ? 11 : 5}
                        style={{
                          padding: 0,
                          position: 'relative'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          height: '28px',
                          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.15) 50%, rgba(16, 185, 129, 0.05) 100%)',
                          borderTop: '1.5px dashed #10b981',
                          borderBottom: '1.5px dashed #10b981'
                        }}>
                          <div style={{
                            background: '#059669',
                            color: '#ffffff',
                            padding: '2px 12px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                          }}>
                            <span>Spot: ₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            <span style={{ opacity: 0.9 }}>| {spotChange > 0 ? `+${spotChange.toFixed(2)}` : spotChange.toFixed(2)} ({formatPercent(spotChangePercent)})</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Standard Option Strike Row */}
                  <tr
                    onMouseEnter={() => setHoveredRow(row.strike)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.1s ease',
                      background: isHovered ? '#f1f5f9' : 'transparent'
                    }}
                  >
                    
                    {/* CALL GREEKS */}
                    {showGreeks && (
                      <td style={{ padding: '8px 10px', background: callBg, color: '#475569', fontSize: '0.75rem' }} className="font-mono">
                        {row.callGreeks.delta}
                      </td>
                    )}
                    {showGreeks && (
                      <td style={{ padding: '8px 10px', background: callBg, color: '#e11d48', fontSize: '0.75rem' }} className="font-mono">
                        {row.callGreeks.theta}
                      </td>
                    )}
                    {showGreeks && (
                      <td style={{ padding: '8px 10px', background: callBg, color: '#64748b', fontSize: '0.75rem' }} className="font-mono">
                        {row.callGreeks.iv}%
                      </td>
                    )}

                    {/* CALL OI */}
                    <td style={{ padding: '8px 10px', background: callBg, textAlign: 'right' }}>
                      <div className="font-mono" style={{ fontWeight: 600, color: '#0f172a' }}>
                        {row.callOI.toLocaleString('en-IN')}
                      </div>
                      <div className={`font-mono ${row.callOiChangePct >= 0 ? 'profit-text' : 'loss-text'}`} style={{ fontSize: '0.66rem' }}>
                        {row.callOiChangePct > 0 ? `+${row.callOiChangePct}%` : `${row.callOiChangePct}%`}
                      </div>
                    </td>

                    {/* CALL LTP (Clickable to Trade) */}
                    <td 
                      onClick={() => handleTradeClick(row, 'CALL')}
                      style={{
                        padding: '8px 14px',
                        background: callBg,
                        textAlign: 'right',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      title={`Click to trade ${selectedIndex} ${row.strike} CALL`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <div>
                          <div className="font-mono" style={{ fontWeight: 800, fontSize: '0.88rem', color: '#059669' }}>
                            ₹{row.callLTP.toFixed(2)}
                          </div>
                          <div className={`font-mono ${row.callChange >= 0 ? 'profit-text' : 'loss-text'}`} style={{ fontSize: '0.66rem' }}>
                            {row.callChange > 0 ? `+${row.callChange.toFixed(2)}` : row.callChange.toFixed(2)}
                          </div>
                        </div>

                        {/* Quick Buy Button on Hover */}
                        {isHovered && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleTradeClick(row, 'CALL'); }}
                            style={{
                              background: '#059669',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            B
                          </button>
                        )}
                      </div>
                    </td>

                    {/* CENTER: STRIKE PRICE + COMPARATIVE OI BARS */}
                    <td style={{
                      padding: '6px 12px',
                      background: '#ffffff',
                      borderLeft: '1px solid #e2e8f0',
                      borderRight: '1px solid #e2e8f0',
                      position: 'relative',
                      minWidth: '120px'
                    }}>
                      <div className="font-mono" style={{
                        fontWeight: row.isATM ? 900 : 700,
                        fontSize: row.isATM ? '0.95rem' : '0.88rem',
                        color: row.isATM ? '#059669' : '#0f172a'
                      }}>
                        {row.strike.toLocaleString('en-IN')}
                      </div>

                      {/* Visual OI Mini-Bars: Orange (Call) vs Cyan/Green (Put) */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        height: '4px',
                        marginTop: '3px',
                        padding: '0 4px'
                      }}>
                        {/* Call OI Bar (right-aligned to center) */}
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', height: '100%' }}>
                          <div style={{
                            width: `${callOIWidth}%`,
                            height: '100%',
                            background: '#f97316',
                            borderRadius: '2px 0 0 2px'
                          }} />
                        </div>
                        {/* Center Separator */}
                        <div style={{ width: '1px', height: '6px', background: '#cbd5e1' }} />
                        {/* Put OI Bar (left-aligned from center) */}
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', height: '100%' }}>
                          <div style={{
                            width: `${putOIWidth}%`,
                            height: '100%',
                            background: '#10b981',
                            borderRadius: '0 2px 2px 0'
                          }} />
                        </div>
                      </div>
                    </td>

                    {/* PUT LTP (Clickable to Trade) */}
                    <td 
                      onClick={() => handleTradeClick(row, 'PUT')}
                      style={{
                        padding: '8px 14px',
                        background: putBg,
                        textAlign: 'left',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      title={`Click to trade ${selectedIndex} ${row.strike} PUT`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '6px' }}>
                        {/* Quick Buy Button on Hover */}
                        {isHovered && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleTradeClick(row, 'PUT'); }}
                            style={{
                              background: '#059669',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            B
                          </button>
                        )}

                        <div>
                          <div className="font-mono" style={{ fontWeight: 800, fontSize: '0.88rem', color: '#e11d48' }}>
                            ₹{row.putLTP.toFixed(2)}
                          </div>
                          <div className={`font-mono ${row.putChange >= 0 ? 'profit-text' : 'loss-text'}`} style={{ fontSize: '0.66rem' }}>
                            {row.putChange > 0 ? `+${row.putChange.toFixed(2)}` : row.putChange.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* PUT OI */}
                    <td style={{ padding: '8px 10px', background: putBg, textAlign: 'left' }}>
                      <div className="font-mono" style={{ fontWeight: 600, color: '#0f172a' }}>
                        {row.putOI.toLocaleString('en-IN')}
                      </div>
                      <div className={`font-mono ${row.putOiChangePct >= 0 ? 'profit-text' : 'loss-text'}`} style={{ fontSize: '0.66rem' }}>
                        {row.putOiChangePct > 0 ? `+${row.putOiChangePct}%` : `${row.putOiChangePct}%`}
                      </div>
                    </td>

                    {/* PUT GREEKS */}
                    {showGreeks && (
                      <td style={{ padding: '8px 10px', background: putBg, color: '#64748b', fontSize: '0.75rem' }} className="font-mono">
                        {row.putGreeks.iv}%
                      </td>
                    )}
                    {showGreeks && (
                      <td style={{ padding: '8px 10px', background: putBg, color: '#e11d48', fontSize: '0.75rem' }} className="font-mono">
                        {row.putGreeks.theta}
                      </td>
                    )}
                    {showGreeks && (
                      <td style={{ padding: '8px 10px', background: putBg, color: '#475569', fontSize: '0.75rem' }} className="font-mono">
                        {row.putGreeks.delta}
                      </td>
                    )}

                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Bottom Controls: Greeks Toggle, Max Pain, Back to Chart */}
      <div style={{
        padding: '12px 18px',
        borderTop: '1px solid #e2e8f0',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        
        {/* Greeks Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowGreeks(!showGreeks)}
            style={{
              background: showGreeks ? '#ecfdf5' : '#ffffff',
              border: `1px solid ${showGreeks ? '#a7f3d0' : '#cbd5e1'}`,
              color: showGreeks ? '#047857' : '#475569',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Sliders size={14} />
            <span>{showGreeks ? 'Hide Greeks' : 'Show Greeks (Δ, θ, IV)'}</span>
          </button>

          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Click any <b>Call LTP</b> or <b>Put LTP</b> to place an option trade.
          </div>
        </div>

        {/* Quick Back to Chart Terminal button if requested */}
        {onBackToTerminal && (
          <button
            type="button"
            onClick={onBackToTerminal}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#059669',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>Back to Candlestick Chart</span>
            <ArrowRight size={14} />
          </button>
        )}

      </div>
    </div>
  );
}
