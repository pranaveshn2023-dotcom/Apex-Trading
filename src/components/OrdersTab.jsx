import React, { useState, useEffect } from 'react';
import { ListOrdered, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { formatINR, formatDate, formatQty } from '../utils/formatters';

export default function OrdersTab({ orders, onRefreshPortfolio }) {
  const [filter, setFilter] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);
  const [localOrders, setLocalOrders] = useState(orders || []);

  useEffect(() => {
    setLocalOrders(orders || []);
  }, [orders]);

  const filteredOrders = (localOrders || []).filter(o => {
    if (filter === 'ALL') return true;
    if (filter === 'AMO') return o.status === 'AMO';
    if (filter === 'PENDING') return o.status === 'PENDING' || o.status === 'AMO';
    return o.status === filter;
  });

  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);

    // Instant optimistic update
    setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED', cancelledAt: new Date().toISOString() } : o));

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        if (data.portfolio && onRefreshPortfolio) {
          onRefreshPortfolio(data.portfolio);
        } else if (onRefreshPortfolio) {
          onRefreshPortfolio();
        }
      } else {
        // Revert on failure
        setLocalOrders(orders || []);
        alert(data.error || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Cancel order error:', err);
      setLocalOrders(orders || []);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '16px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Order Book & History ({orders?.length || 0})
          </h2>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Simulated Indian & US Exchange Order Executions
          </div>
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '4px', background: '#f8fafc', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto', maxWidth: '100%' }}>
          {['ALL', 'EXECUTED', 'AMO', 'PENDING', 'CANCELLED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? '#ecfdf5' : 'transparent',
                color: filter === f ? '#047857' : '#64748b',
                border: filter === f ? '1px solid #a7f3d0' : '1px solid transparent',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
          No orders found matching the filter.
        </div>
      ) : (
        <>
          {/* Mobile Cards View (< 768px) */}
          <div className="mobile-card-list">
            {filteredOrders.map(o => {
              const isBuy = o.action === 'BUY';
              const isAMO = o.status === 'AMO';
              const isPending = o.status === 'PENDING';
              const canCancel = isAMO || isPending;

              return (
                <div
                  key={`mob-order-${o.id}`}
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
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ 
                          fontSize: '0.68rem', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontWeight: 700,
                          background: isBuy ? '#ecfdf5' : '#fff1f2',
                          color: isBuy ? '#059669' : '#e11d48',
                          border: isBuy ? '1px solid #a7f3d0' : '1px solid #fecdd3'
                        }}>
                          {o.action}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                          {o.symbol.replace('.NS', '')}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px' }}>
                          {o.product} • {o.orderType}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>
                        {formatDate(o.timestamp)}
                      </div>
                    </div>

                    <div>
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem', 
                        padding: '2px 8px', 
                        borderRadius: '10px', 
                        fontWeight: 700,
                        background: o.status === 'EXECUTED' 
                          ? '#ecfdf5' 
                          : isAMO 
                            ? '#f3e8ff'
                            : isPending 
                              ? '#fef3c7' 
                              : '#fff1f2',
                        color: o.status === 'EXECUTED' 
                          ? '#059669' 
                          : isAMO 
                            ? '#7e22ce'
                            : isPending 
                              ? '#d97706' 
                              : '#e11d48',
                        border: isAMO ? '1px solid #d8b4fe' : (o.status === 'EXECUTED' ? '1px solid #a7f3d0' : 'none')
                      }}>
                        {o.status === 'EXECUTED' && <CheckCircle2 size={11} />}
                        {(isAMO || isPending) && <Clock size={11} />}
                        {isAMO ? 'AMO (Queued)' : o.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '8px 0', fontSize: '0.75rem' }}>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.68rem' }}>Qty:</div>
                      <div className="font-mono" style={{ fontWeight: 700, color: '#0f172a' }}>{formatQty(o.qty)}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.68rem' }}>Req. Price:</div>
                      <div className="font-mono" style={{ fontWeight: 600, color: '#0f172a' }}>{formatINR(o.price)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#64748b', fontSize: '0.68rem' }}>Executed:</div>
                      <div className="font-mono" style={{ fontWeight: 700, color: '#059669' }}>
                        {o.executedPrice ? formatINR(o.executedPrice) : '-'}
                      </div>
                    </div>
                  </div>

                  {canCancel && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelOrder(o.id);
                        }}
                        disabled={cancellingId === o.id}
                        className="btn-ghost"
                        style={{
                          background: '#fff1f2',
                          borderColor: '#fecdd3',
                          color: '#be123c',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: cancellingId === o.id ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <XCircle size={13} />
                        {cancellingId === o.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= 769px) */}
          <div className="desktop-table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
            <table className="terminal-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Order ID</th>
                <th>Instrument</th>
                <th>Action</th>
                <th>Product</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Executed Price</th>
                <th>Charges</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => {
                const isBuy = o.action === 'BUY';
                const isAMO = o.status === 'AMO';
                const isPending = o.status === 'PENDING';
                const canCancel = isAMO || isPending;

                return (
                  <tr key={o.id}>
                    <td style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {formatDate(o.timestamp)}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {o.id.split('-').slice(0, 2).join('-')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {o.symbol.replace('.NS', '')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {o.name}
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.72rem', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontWeight: 700,
                        background: isBuy ? '#ecfdf5' : '#fff1f2',
                        color: isBuy ? '#059669' : '#e11d48',
                        border: isBuy ? '1px solid #a7f3d0' : '1px solid #fecdd3'
                      }}>
                        {o.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                        {o.product}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                      {o.orderType}
                    </td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>
                      {formatQty(o.qty)}
                    </td>
                    <td className="font-mono">
                      {formatINR(o.price)}
                    </td>
                    <td className="font-mono" style={{ fontWeight: 700, color: '#059669' }}>
                      {o.executedPrice ? formatINR(o.executedPrice) : '-'}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {formatINR(o.charges || 0)}
                    </td>
                    <td>
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem', 
                        padding: '2px 8px', 
                        borderRadius: '10px', 
                        fontWeight: 700,
                        background: o.status === 'EXECUTED' 
                          ? '#ecfdf5' 
                          : isAMO 
                            ? '#f3e8ff'
                            : isPending 
                              ? '#fef3c7' 
                              : '#fff1f2',
                        color: o.status === 'EXECUTED' 
                          ? '#059669' 
                          : isAMO 
                            ? '#7e22ce'
                            : isPending 
                              ? '#d97706' 
                              : '#e11d48',
                        border: isAMO ? '1px solid #d8b4fe' : (o.status === 'EXECUTED' ? '1px solid #a7f3d0' : 'none')
                      }}
                      title={isAMO ? 'After-Market Order: Queued for market open' : undefined}
                      >
                        {o.status === 'EXECUTED' && <CheckCircle2 size={11} />}
                        {(isAMO || isPending) && <Clock size={11} />}
                        {isAMO ? 'AMO (Queued)' : o.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {canCancel ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelOrder(o.id);
                          }}
                          disabled={cancellingId === o.id}
                          className="btn-ghost"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#be123c',
                            borderColor: '#fecdd3',
                            background: '#fff1f2',
                            cursor: cancellingId === o.id ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <XCircle size={11} />
                          {cancellingId === o.id ? '...' : 'Cancel'}
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>-</span>
                      )}
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
  );
}
