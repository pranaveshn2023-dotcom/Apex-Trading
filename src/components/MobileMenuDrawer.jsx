import React from 'react';
import {
  X,
  LayoutDashboard,
  BarChart3,
  ListOrdered,
  Briefcase,
  Layers,
  CreditCard,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Smartphone,
  Search,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { getIndianMarketStatus, getUSMarketStatus } from '../utils/marketHours';
import ApexLogo from './ApexLogo';

export default function MobileMenuDrawer({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onOpenTips,
  onOpenSearch,
  onInstallPWA,
  indices,
  onSelectStock,
  portfolio,
  currentUser = null,
  onOpenAuth,
  isAppInstalled = false
}) {
  if (!isOpen) return null;

  const isInstalled = isAppInstalled || (typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator?.standalone === true ||
    localStorage.getItem('apex_pwa_installed') === 'true'
  ));

  const navItems = [
    { id: 'terminal', label: 'Terminal', desc: 'Live charts, real-time depth & trading', icon: BarChart3, color: '#059669' },
    { id: 'option-chain', label: 'Option Chain (F&O)', desc: 'Live NIFTY strikes, Greeks & open interest', icon: Layers, color: '#10b981' },
    { id: 'dashboard', label: 'Dashboard', desc: 'Overview, market stats & allocations', icon: LayoutDashboard, color: '#0284c7' },
    { id: 'orders', label: 'Orders', desc: 'Order book, executions & pending orders', icon: ListOrdered, color: '#7c3aed' },
    { id: 'holdings', label: 'Holdings', desc: 'Delivery equity & long-term Demat portfolio', icon: Briefcase, color: '#d97706' },
    { id: 'positions', label: 'Positions', desc: 'Active intraday MIS positions & P&L', icon: Layers, color: '#db2777' },
    { id: 'funds', label: 'Funds & Capital', desc: 'Manage margin, deposit or reset capital', icon: CreditCard, color: '#0891b2' },
    { id: 'journal', label: 'Trading Journal', desc: 'Performance review, notes & trade psychology', icon: BookOpen, color: '#4f46e5' },
    { id: 'learn', label: 'Learn Academy', desc: 'Trading lessons, strategies & definitions', icon: GraduationCap, color: '#0d9488' }
  ];

  const handleNav = (id) => {
    onSelectTab(id);
    onClose();
  };

  const handlePickIndex = (sym) => {
    onSelectStock(sym);
    onSelectTab('terminal');
    onClose();
  };

  return (
    <div className="mobile-drawer-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="mobile-drawer"
        style={{
          width: 'min(86vw, 360px)',
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ApexLogo size={32} withGlow={false} />
            <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f172a' }}>
              APEX<span style={{ color: '#059669', marginLeft: '3px' }}>TRADING</span>
            </span>

            {/* Dynamic Market Status Badge */}
            {(() => {
              const market = getIndianMarketStatus();
              return (
                <span style={{ 
                  fontSize: '0.55rem', 
                  background: market.bg, 
                  color: market.color, 
                  border: `1px solid ${market.borderColor}`,
                  padding: '1px 5px', 
                  borderRadius: '3px', 
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: market.isOpen ? '#059669' : '#94a3b8' }} />
                  {market.label}
                </span>
              );
            })()}
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Account / Google Login Banner */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
          {currentUser ? (
            <div 
              onClick={() => { onOpenAuth(); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #059669' }}>
                  <img src={currentUser.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{currentUser.name}</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{currentUser.email}</div>
                </div>
              </div>
              <ChevronRight size={16} color="#64748b" />
            </div>
          ) : (
            <button
              onClick={() => { onOpenAuth(); onClose(); }}
              style={{
                width: '100%',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                padding: '9px 12px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in</span>
            </button>
          )}
        </div>

        {/* Quick Actions (Search, Tips) */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={() => { onOpenSearch(); onClose(); }}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#059669',
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Search size={14} />
            <span>Search</span>
          </button>

          <button
            onClick={() => { onOpenTips(); onClose(); }}
            style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#d97706',
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Lightbulb size={14} />
            <span>Trading Tips</span>
          </button>
        </div>

        {/* Major Benchmarks Strip */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Live Benchmarks
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {(indices || []).slice(0, 4).map(idx => (
              <div
                key={idx.symbol}
                onClick={() => handlePickIndex(idx.symbol)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {idx.name}
                </div>
                <div className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {formatCurrency(idx.price, idx.currency)}
                </div>
                <div className={`font-mono ${idx.change >= 0 ? 'profit-text' : 'loss-text'}`} style={{ fontSize: '0.64rem', fontWeight: 600 }}>
                  ({formatPercent(idx.changePercent)})
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All App Navigation Sections */}
        <div style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '4px 8px', marginBottom: '2px' }}>
            All Modules & Functions
          </div>
          {navItems.map(({ id, label, desc, icon: Icon, color }) => {
            const isActive = activeTab === id;
            return (
              <div
                key={id}
                onClick={() => handleNav(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: isActive ? '#ecfdf5' : 'transparent',
                  border: `1px solid ${isActive ? '#a7f3d0' : 'transparent'}`,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ color: isActive ? '#059669' : color }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: isActive ? '#059669' : '#0f172a' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      {desc}
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} color="#94a3b8" />
              </div>
            );
          })}
        </div>

        {/* Footer: PWA Install & Margin */}
        <div style={{ padding: '14px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
          {!isInstalled && (
            <button
              onClick={() => { onInstallPWA(); onClose(); }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                border: 'none',
                color: '#ffffff',
                padding: '9px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginBottom: '10px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Smartphone size={15} />
              <span>Install Apex Trading App</span>
            </button>
          )}

          <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center' }}>
            Margin: <b className="font-mono" style={{ color: '#059669' }}>₹{(portfolio?.cashBalance || 0).toLocaleString('en-IN')}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
