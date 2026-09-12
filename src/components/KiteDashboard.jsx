import React from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Briefcase, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart, 
  Plus, 
  Activity, 
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { formatINR, formatPercent } from '../utils/formatters';

export default function KiteDashboard({ 
  portfolio, 
  indices, 
  onNavigate, 
  onSelectStock, 
  onOpenFunds 
}) {
  const cashBalance = portfolio?.cashBalance || 1000000;
  const totalValue = portfolio?.totalPortfolioValue || 1000000;
  const totalInvested = portfolio?.totalInvested || 0;
  const totalHoldingsValue = portfolio?.totalHoldingsValue || 0;
  const totalReturn = portfolio?.totalReturn || 0;
  const totalReturnPct = portfolio?.totalReturnPct || 0;
  const holdings = portfolio?.holdings || [];
  const positions = portfolio?.positions || [];

  const nifty = indices?.find(i => i.symbol === '^NSEI');
  const bankNifty = indices?.find(i => i.symbol === '^NSEBANK');
  const sensex = indices?.find(i => i.symbol === '^BSESN');

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Welcome Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Hi, Paper Trader! <span style={{ fontSize: '1.1rem' }}>👋</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
            NSE & BSE Indian Equities Virtual Trading Account (₹ INR)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenFunds}
            className="btn-primary"
            style={{ fontSize: '0.825rem', padding: '8px 16px' }}
          >
            <Plus size={15} /> Add Virtual Funds
          </button>
          <button
            onClick={() => onNavigate('terminal')}
            className="btn-ghost"
            style={{ fontSize: '0.825rem', padding: '8px 16px' }}
          >
            Open Terminal <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Two Column Cards Grid (Zerodha Kite Layout, collapses on mobile) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
        
        {/* Card 1: Equity Margin / Funds (Zerodha Style) */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={18} color="#059669" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Equity Margin
              </h2>
            </div>
            <button
              onClick={() => onNavigate('funds')}
              style={{ background: 'transparent', border: 'none', color: '#059669', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
            >
              View Statement & Funds →
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Available Cash Margin
            </div>
            <div className="font-mono" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
              {formatINR(cashBalance)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Used Margin (Holdings)</div>
              <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                {formatINR(totalInvested)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Account Value</div>
              <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#059669' }}>
                {formatINR(totalValue)}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Holdings & Returns Overview (Zerodha Style) */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={18} color="#059669" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Holdings ({holdings.length})
              </h2>
            </div>
            <button
              onClick={() => onNavigate('holdings')}
              style={{ background: 'transparent', border: 'none', color: '#059669', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
            >
              View All Holdings →
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Portfolio P&L
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '2px', flexWrap: 'wrap' }}>
              <div className={`font-mono ${totalReturn >= 0 ? 'profit-text' : 'loss-text'}`} style={{ fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', fontWeight: 800 }}>
                {formatINR(totalReturn, true)}
              </div>
              <span className={`font-mono ${totalReturn >= 0 ? 'profit-bg' : 'loss-bg'}`} style={{ fontSize: '0.85rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                {formatPercent(totalReturnPct)}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Investment</div>
              <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                {formatINR(totalInvested)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Current Value</div>
              <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#059669' }}>
                {formatINR(totalHoldingsValue)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Market Overview Bar */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} color="#059669" /> Key Benchmark Indices
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '14px' }}>
          {indices?.map(idx => {
            const isUp = (idx.change || 0) >= 0;
            return (
              <div
                key={idx.symbol}
                onClick={() => {
                  onSelectStock(idx.symbol);
                  onNavigate('terminal');
                }}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ecfdf5';
                  e.currentTarget.style.borderColor = '#a7f3d0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {idx.shortName || idx.name}
                </div>
                <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  ₹{idx.price?.toLocaleString('en-IN')}
                </div>
                <div 
                  className={`font-mono ${isUp ? 'profit-text' : 'loss-text'}`}
                  style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}
                >
                  {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {isUp ? `+${idx.change}` : idx.change} ({formatPercent(idx.changePercent)})
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
