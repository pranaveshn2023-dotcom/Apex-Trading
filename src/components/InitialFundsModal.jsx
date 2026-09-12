import React, { useState } from 'react';
import { Wallet, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { formatINR } from '../utils/formatters';
import confetti from 'canvas-confetti';
import ApexLogo from './ApexLogo';

export default function InitialFundsModal({ isOpen, onClose, onSetInitialFunds }) {
  const [amount, setAmount] = useState('1000000'); // Default ₹10,00,000 (10 Lakhs)
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const presets = [
    { label: '₹1 Lakh', value: 100000, desc: 'Small Account' },
    { label: '₹5 Lakhs', value: 500000, desc: 'Swing Trader' },
    { label: '₹10 Lakhs', value: 1000000, desc: 'Recommended' },
    { label: '₹25 Lakhs', value: 2500000, desc: 'Pro Sizing' },
    { label: '₹1 Crore', value: 10000000, desc: 'Institutional' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(parsed) || parsed < 0) return;

    setLoading(true);
    try {
      await onSetInitialFunds(parsed);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div 
        className="glass-panel-elevated"
        style={{
          width: '520px',
          maxWidth: '92vw',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '28px 24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
        }}
      >
        {/* Header with AX Logo */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <ApexLogo size={54} withGlow={true} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Welcome to Apex Trading!
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
            Everything starts fresh. Set your starting paper trading capital to begin testing strategies with real live market data.
          </p>
        </div>

        {/* Quick Presets */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Choose Starting Amount:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))', gap: '8px' }}>
            {presets.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setAmount(p.value.toString())}
                style={{
                  background: amount === p.value.toString() ? '#ecfdf5' : '#f8fafc',
                  border: `1px solid ${amount === p.value.toString() ? '#059669' : '#e2e8f0'}`,
                  color: amount === p.value.toString() ? '#047857' : '#334155',
                  borderRadius: '8px',
                  padding: '8px 4px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{p.label}</div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Or Enter Custom Amount (₹ INR):
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '14px', fontSize: '1.2rem', fontWeight: 700, color: '#64748b' }}>₹</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="font-mono"
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#059669',
                  padding: '12px 14px 12px 34px',
                  borderRadius: '8px',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <span>{loading ? 'Initializing Terminal...' : `Start Trading with ${formatINR(Number(amount) || 0)}`}</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
