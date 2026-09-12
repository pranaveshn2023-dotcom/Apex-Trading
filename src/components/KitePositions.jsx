import React, { useState } from 'react';
import { Layers, ShieldAlert, Target, X, CheckCircle, Clock } from 'lucide-react';
import { formatINR, formatPercent, formatDate } from '../utils/formatters';

export default function KitePositions({ 
  positions, 
  onClosePosition, 
  onSelectStock, 
  onNavigate 
}) {
  const [closingPos, setClosingPos] = useState(null);
  const [exitReason, setExitReason] = useState('');
  const [loading, setLoading] = useState(false);

  const totalPositionsPnl = (positions || []).reduce((acc, p) => acc + (p.pnl || 0), 0);

  const handleConfirmClose = async () => {
    if (!closingPos) return;
    setLoading(true);
    try {
      await onClosePosition(closingPos.id, exitReason);
      setClosingPos(null);
      setExitReason('');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner (Zerodha Kite Positions Summary) */}
      <div className="glass-panel" style={{ padding: '18px 20px', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers size={20} color="#059669" />
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Positions ({positions?.length || 0})
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Intraday MIS (5x) & Open Trades
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>
            Total MTM P&L
          </div>
          <div className={`font-mono ${totalPositionsPnl >= 0 ? 'profit-text' : 'loss-text'}`} style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', fontWeight: 800 }}>
            {formatINR(totalPositionsPnl, true)}
          </div>
        </div>
      </div>

      {/* Positions Section */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        {(!positions || positions.length === 0) ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#64748b' }}>
            <Clock size={36} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '4px' }}>No Active Open Positions</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Place an Intraday MIS order from the marketwatch or terminal to trade live positions.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View (< 768px) */}
            <div className="mobile-card-list">
              {positions.map(p => {
                const isPnlUp = p.pnl >= 0;
                return (
                  <div
                    key={`pos-mob-${p.id}`}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div 
                        onClick={() => {
                          onSelectStock(p.symbol);
                          onNavigate('terminal');
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            fontSize: '0.68rem', 
                            padding: '1px 5px', 
                            borderRadius: '3px', 
                            background: p.product === 'MIS' ? '#fef3c7' : '#ecfdf5',
                            color: p.product === 'MIS' ? '#d97706' : '#059669',
                            fontWeight: 700
                          }}>
                            {p.product}
                          </span>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                            {p.symbol.replace('.NS', '').replace('.BO', '')}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          {p.name}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div className={`font-mono ${isPnlUp ? 'profit-text' : 'loss-text'}`} style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                          {formatINR(p.pnl, true)}
                        </div>
                        <div className={`font-mono ${isPnlUp ? 'profit-text' : 'loss-text'}`} style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                          {formatPercent(p.pnlPct)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '8px 0', fontSize: '0.75rem' }}>
                      <div>
                        <div style={{ color: '#64748b', fontSize: '0.68rem' }}>Qty:</div>
                        <div className="font-mono" style={{ fontWeight: 700, color: '#0f172a' }}>{p.qty}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', fontSize: '0.68rem' }}>Entry:</div>
                        <div className="font-mono" style={{ fontWeight: 600, color: '#0f172a' }}>{formatINR(p.entryPrice)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#64748b', fontSize: '0.68rem' }}>LTP:</div>
                        <div className="font-mono" style={{ fontWeight: 700, color: '#059669' }}>{formatINR(p.currentPrice)}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {p.stopLoss && <span style={{ color: '#e11d48', marginRight: '8px' }}>SL: ₹{p.stopLoss}</span>}
                        {p.target && <span style={{ color: '#059669' }}>Tgt: ₹{p.target}</span>}
                      </div>

                      <button
                        onClick={() => setClosingPos(p)}
                        className="btn-ghost"
                        style={{
                          background: '#fff1f2',
                          borderColor: '#fecdd3',
                          color: '#be123c',
                          padding: '4px 14px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        Exit Position
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= 769px) */}
            <div className="desktop-table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
              <table className="terminal-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Instrument</th>
                    <th>Qty.</th>
                    <th>Avg. Price</th>
                    <th>LTP</th>
                    <th>P&L (₹)</th>
                    <th>Chg. %</th>
                    <th>SL / Target</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map(p => {
                    const isPnlUp = p.pnl >= 0;
                    return (
                      <tr key={p.id}>
                        <td>
                          <span style={{ 
                            fontSize: '0.72rem', 
                            padding: '2px 6px', 
                            borderRadius: '3px', 
                            background: p.product === 'MIS' ? '#fef3c7' : '#ecfdf5',
                            color: p.product === 'MIS' ? '#d97706' : '#059669',
                            fontWeight: 700
                          }}>
                            {p.product}
                          </span>
                        </td>

                        <td>
                          <div 
                            onClick={() => {
                              onSelectStock(p.symbol);
                              onNavigate('terminal');
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>
                              {p.symbol.replace('.NS', '').replace('.BO', '')}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {p.name}
                            </div>
                          </div>
                        </td>

                        <td className="font-mono" style={{ fontWeight: 600 }}>
                          {p.qty}
                        </td>

                        <td className="font-mono">
                          {formatINR(p.entryPrice)}
                        </td>

                        <td className="font-mono" style={{ fontWeight: 700, color: '#059669' }}>
                          {formatINR(p.currentPrice)}
                        </td>

                        <td>
                          <div className={`font-mono ${isPnlUp ? 'profit-text' : 'loss-text'}`} style={{ fontWeight: 700 }}>
                            {formatINR(p.pnl, true)}
                          </div>
                        </td>

                        <td>
                          <span className={`font-mono ${isPnlUp ? 'profit-text' : 'loss-text'}`} style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            {formatPercent(p.pnlPct)}
                          </span>
                        </td>

                        <td style={{ fontSize: '0.75rem' }}>
                          <div className="font-mono" style={{ color: '#e11d48' }}>
                            SL: {p.stopLoss ? `₹${p.stopLoss}` : '-'}
                          </div>
                          <div className="font-mono" style={{ color: '#059669' }}>
                            Tgt: {p.target ? `₹${p.target}` : '-'}
                          </div>
                        </td>

                        <td>
                          <button
                            onClick={() => setClosingPos(p)}
                            style={{
                              background: '#e11d48',
                              color: '#fff',
                              border: 'none',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Exit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Exit Modal */}
      {closingPos && (
        <div className="modal-overlay" onClick={() => setClosingPos(null)}>
          <div 
            style={{ width: 'min(420px, 95vw)', padding: '20px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Square Off Position
              </h3>
              <button 
                onClick={() => setClosingPos(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Stock:</span>
                <b style={{ color: '#0f172a' }}>{closingPos.symbol.replace('.NS', '')} ({closingPos.qty} shares)</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>LTP:</span>
                <span className="font-mono" style={{ color: '#059669', fontWeight: 700 }}>{formatINR(closingPos.currentPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '6px' }}>
                <span style={{ color: '#64748b' }}>Estimated P&L:</span>
                <span className={`font-mono ${closingPos.pnl >= 0 ? 'profit-text' : 'loss-text'}`} style={{ fontWeight: 800 }}>
                  {formatINR(closingPos.pnl, true)} ({formatPercent(closingPos.pnlPct)})
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setClosingPos(null)}
                className="btn-ghost"
                style={{ flex: 1, padding: '8px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmClose}
                style={{ flex: 1, padding: '8px', background: '#e11d48', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
              >
                {loading ? 'Exiting...' : 'Confirm Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
