import React, { useState } from 'react';
import { Wallet, Plus, RotateCcw, ArrowDownRight, ArrowUpRight, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react';
import { formatINR } from '../utils/formatters';
import confetti from 'canvas-confetti';

export default function KiteFunds({ 
  portfolio, 
  onUpdateFunds, 
  onResetPortfolio 
}) {
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const cashBalance = portfolio?.cashBalance || 0;
  const totalInvested = portfolio?.totalInvested || 0;
  const totalValue = portfolio?.totalPortfolioValue || 0;
  const realizedPnl = portfolio?.realizedPnl || 0;

  const quickAdds = [
    { label: '+ ₹50,000', amount: 50000 },
    { label: '+ ₹1 Lakh', amount: 100000 },
    { label: '+ ₹5 Lakhs', amount: 500000 },
    { label: '+ ₹10 Lakhs', amount: 1000000 },
    { label: '+ ₹25 Lakhs', amount: 2500000 },
  ];

  const handleAddQuick = async (amountToAdd) => {
    setLoading(true);
    try {
      const newTotal = cashBalance + amountToAdd;
      await onUpdateFunds(newTotal);
      confetti({ particleCount: 30, spread: 50 });
      setSuccessMsg(`Added ${formatINR(amountToAdd)} virtual trading capital!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetExact = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(customAmount.replace(/,/g, ''));
    if (!parsed || parsed <= 0) return;
    setLoading(true);
    try {
      await onUpdateFunds(parsed);
      confetti({ particleCount: 40, spread: 60 });
      setSuccessMsg(`Trading cash balance set to ${formatINR(parsed)}!`);
      setCustomAmount('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#ecfdf5', padding: '6px', borderRadius: '8px', color: '#059669', display: 'flex', alignItems: 'center' }}>
              <Wallet size={20} />
            </div>
            Equity Funds & Virtual Margin (₹ INR)
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
            Manage your virtual trading funds. Deposit or adjust capital anytime with zero financial risk.
          </p>
        </div>

        <button
          onClick={() => {
            if (typeof onResetPortfolio === 'function') {
              onResetPortfolio();
            }
          }}
          className="btn-ghost"
          style={{ fontSize: '0.825rem', color: '#be123c', borderColor: '#fecdd3', background: '#fff1f2', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RotateCcw size={14} /> Reset Account
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* Top 3 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', fontWeight: 600 }}>
            Available Cash Margin
          </div>
          <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: '#059669' }}>
            {formatINR(cashBalance)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
            Free margin ready for CNC / MIS trades
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', fontWeight: 600 }}>
            Used Margin (Holdings & Trades)
          </div>
          <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
            {formatINR(totalInvested)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
            Capital allocated to active stocks
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', fontWeight: 600 }}>
            Total Account Net Worth
          </div>
          <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: '#0284c7' }}>
            {formatINR(totalValue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
            Cash + Current Holdings Value
          </div>
        </div>
      </div>

      {/* Two Column Section: Quick Top-Up & Margin Statement */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Left: Instant Add Funds */}
        <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="#059669" /> Instant Virtual Cash Deposit
          </h2>
          <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '16px' }}>
            Add paper funds to test larger trade setups or position sizing. No real money required.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '20px' }}>
            {quickAdds.map(q => (
              <button
                key={q.label}
                disabled={loading}
                onClick={() => handleAddQuick(q.amount)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                  borderRadius: '8px',
                  padding: '10px 8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#059669';
                  e.currentTarget.style.color = '#059669';
                  e.currentTarget.style.background = '#ecfdf5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#0f172a';
                  e.currentTarget.style.background = '#f8fafc';
                }}
              >
                {q.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSetExact} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Or Set Exact Cash Balance (₹)
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="number"
                min="1000"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="e.g. 2500000"
                className="font-mono"
                style={{
                  flex: 1,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={loading || !customAmount}
                className="btn-primary"
                style={{ padding: '10px 20px', fontSize: '0.875rem' }}
              >
                Update Balance
              </button>
            </div>
          </form>
        </div>

        {/* Right: Zerodha Style Margin Breakdown Statement */}
        <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Margin Statement
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Opening Balance</span>
              <span className="font-mono" style={{ color: '#0f172a', fontWeight: 600 }}>{formatINR(portfolio?.initialCapital || 1000000)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Available Cash</span>
              <span className="font-mono" style={{ color: '#059669', fontWeight: 700 }}>{formatINR(cashBalance)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Used Margin (Holdings)</span>
              <span className="font-mono" style={{ color: '#0f172a' }}>{formatINR(totalInvested)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Realized P&L</span>
              <span className={`font-mono ${realizedPnl >= 0 ? 'profit-text' : 'loss-text'}`} style={{ fontWeight: 700 }}>
                {formatINR(realizedPnl, true)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', fontWeight: 700, borderTop: '1px solid #e2e8f0' }}>
              <span style={{ color: '#0284c7' }}>Total Collateral / Net Worth</span>
              <span className="font-mono" style={{ color: '#0284c7', fontSize: '1.05rem' }}>{formatINR(totalValue)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
