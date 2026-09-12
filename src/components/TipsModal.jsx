import React from 'react';
import { X, Lightbulb, Shield, TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';

export default function TipsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const tipSections = [
    {
      title: '1. CNC vs MIS (Order Types)',
      badge: 'Basics',
      color: '#059669',
      content: [
        'CNC (Cash & Carry): Delivery trades. You own the shares, can hold for days/months/years, zero leverage, zero automatic square-off.',
        'MIS (Margin Intraday Square-off): Day trading with 5x leverage. Requires smaller capital, but auto-squares off at 3:15 PM IST before market closes.'
      ]
    },
    {
      title: '2. The 1% Risk Rule',
      badge: 'Risk Management',
      color: '#0284c7',
      content: [
        'Never risk losing more than 1% of your total account capital on any single stock trade.',
        'If your virtual account has ₹1,00,000, your maximum stop-loss dollar loss should not exceed ₹1,000.',
        'Position Size Formula: (Account Capital × 1%) ÷ (Entry Price - Stop Loss Price).'
      ]
    },
    {
      title: '3. Technical Indicators (EMA 20 & 50)',
      badge: 'Charting',
      color: '#d97706',
      content: [
        'EMA 20 (Cyan/Green): 20-period Exponential Moving Average. Gauges immediate short-term trend momentum.',
        'EMA 50 (Orange): 50-period Exponential Moving Average. Key baseline institutional support/resistance.',
        'Bullish Trend: Price stays above both EMA 20 and EMA 50 with EMA 20 slope pointing upward.'
      ]
    },
    {
      title: '4. Non-Market Hours (AMO)',
      badge: 'Market Hours',
      color: '#7c3aed',
      content: [
        'Indian Exchanges (NSE/BSE) trade Monday to Friday from 9:15 AM to 3:30 PM IST.',
        'During closed hours or weekends, placing a trade queues an After-Market Order (AMO). It is safely recorded and executes once the market opens.'
      ]
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        style={{
          width: '620px',
          maxWidth: '92vw',
          maxHeight: '88vh',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Lightbulb size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Beginner Trading Guide & Quick Tips
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Essential market rules and execution strategies
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
          {tipSections.map((sec, idx) => (
            <div 
              key={idx}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: sec.color }}>
                  {sec.title}
                </span>
                <span style={{ fontSize: '0.65rem', background: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  {sec.badge}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sec.content.map((c, i) => (
                  <p key={i} style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                    • {c}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
