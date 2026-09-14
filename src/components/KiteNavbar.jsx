import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  LayoutDashboard, 
  ListOrdered, 
  Briefcase, 
  Layers, 
  CreditCard, 
  BookOpen, 
  GraduationCap, 
  List, 
  Lightbulb, 
  Plus, 
  Smartphone, 
  Search,
  Menu,
  Lock,
  User
} from 'lucide-react';
import { formatCurrency, formatPercent, isIndianMarketOpen } from '../utils/formatters';
import { getIndianMarketStatus, getUSMarketStatus } from '../utils/marketHours';
import ApexLogo from './ApexLogo';

export default function KiteNavbar({ 
  portfolio = null, 
  indices = null, 
  activeTab = 'terminal', 
  setActiveTab, 
  onOpenSearch, 
  onOpenFunds,
  onSelectStock,
  isMobile = false,
  beginnerMode = false,
  onOpenTips,
  onOpenMobileMenu,
  onToggleWatchlist,
  currentUser = null,
  onOpenAuth,
  onLockScreen,
  onInstallApp,
  isAppInstalled = false,
  isMarketwatchCollapsed = false,
  onToggleCollapseMarketwatch,
  watchlistCount = 0
}) {
  const isMarketOpen = isIndianMarketOpen();
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const isInstalled = isAppInstalled || (typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator?.standalone === true ||
    localStorage.getItem('apex_pwa_installed') === 'true'
  ));

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (onInstallApp) {
      onInstallApp();
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('apex_pwa_installed', 'true');
      }
      setDeferredPrompt(null);
    } else {
      localStorage.setItem('apex_pwa_installed', 'true');
      alert('To install Apex Trading on your device:\n\nTap the install icon in your address bar or browser menu -> "Install App" / "Add to Home Screen".');
    }
  };

  const [marketStatus, setMarketStatus] = useState(() => ({
    indian: getIndianMarketStatus(),
    us: getUSMarketStatus()
  }));

  useEffect(() => {
    const updateMarket = () => {
      setMarketStatus({
        indian: getIndianMarketStatus(),
        us: getUSMarketStatus()
      });
    };
    const timer = setInterval(updateMarket, 15000);
    return () => clearInterval(timer);
  }, []);

  const nifty = indices?.find(i => i.symbol === '^NSEI');
  const sensex = indices?.find(i => i.symbol === '^BSESN');
  const cashBalance = portfolio?.cashBalance || 0;

  const handleIndexClick = (symbol) => {
    if (onSelectStock) {
      onSelectStock(symbol);
    }
    if (activeTab !== 'terminal') {
      setActiveTab('terminal');
    }
  };

  return (
    <header style={{ 
      background: '#ffffff', 
      borderBottom: '1px solid #e2e8f0', 
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      position: 'sticky', 
      top: 0, 
      zIndex: 100,
      userSelect: 'none'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 14px', 
        height: '56px',
        gap: '8px'
      }}>
        
        {/* 1. LEFT: Brand Logo & Interactive Indices */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Logo & Brand */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={() => setActiveTab('terminal')}
            title="Apex Trading Terminal"
          >
            {/* Logo Emblem */}
            <ApexLogo size={32} withGlow={false} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f172a', letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>
                APEX<span style={{ color: '#059669', fontSize: '0.82rem', fontWeight: 800, marginLeft: '3px' }}>TRADING</span>
              </span>

              {/* Dynamic Market Status Badge (NSE/BSE 9:15 AM - 3:30 PM IST) */}
              <span 
                title={marketStatus.indian.tooltip}
                style={{ 
                  fontSize: '0.55rem', 
                  background: marketStatus.indian.bg, 
                  color: marketStatus.indian.color, 
                  border: `1px solid ${marketStatus.indian.borderColor}`,
                  padding: '1px 5px', 
                  borderRadius: '3px', 
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {marketStatus.indian.isOpen ? (
                  <>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    LIVE
                  </>
                ) : (
                  <>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} />
                    CLOSED
                  </>
                )}
              </span>

              {/* US Market Status */}
              {marketStatus.us.isOpen && (
                <span 
                  title={marketStatus.us.tooltip}
                  className="hide-mobile"
                  style={{ 
                    fontSize: '0.52rem', 
                    background: '#ecfdf5', 
                    color: '#059669', 
                    border: '1px solid #a7f3d0',
                    padding: '1px 4px', 
                    borderRadius: '3px', 
                    fontWeight: 700 
                  }}
                >
                  US LIVE
                </span>
              )}
            </div>
          </div>

          <div className="hide-mobile" style={{ height: '20px', width: '1px', background: '#e2e8f0' }} />

          {/* Desktop Indices Pills */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {nifty && (
              <div 
                onClick={() => handleIndexClick(nifty.symbol)}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '5px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
                title="Click to chart NIFTY 50"
              >
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>NIFTY</span>
                <span className="font-mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                  {formatCurrency(nifty.price, nifty.currency)}
                </span>
                <span className={`font-mono ${nifty.change >= 0 ? 'profit-text' : 'loss-text'}`} style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                  ({formatPercent(nifty.changePercent)})
                </span>
              </div>
            )}

            {sensex && (
              <div 
                onClick={() => handleIndexClick(sensex.symbol)}
                className="hide-under-1200"
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '5px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
                title="Click to chart SENSEX"
              >
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>SENSEX</span>
                <span className="font-mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                  {formatCurrency(sensex.price, sensex.currency)}
                </span>
                <span className={`font-mono ${sensex.change >= 0 ? 'profit-text' : 'loss-text'}`} style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                  ({formatPercent(sensex.changePercent)})
                </span>
              </div>
            )}
            {/* Desktop Marketwatch Toggle Button */}
            {onToggleCollapseMarketwatch && (
              <button
                onClick={onToggleCollapseMarketwatch}
                className="hide-under-1024"
                style={{
                  background: isMarketwatchCollapsed ? '#ecfdf5' : '#f8fafc',
                  border: isMarketwatchCollapsed ? '1px solid #a7f3d0' : '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: isMarketwatchCollapsed ? '#047857' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  transition: 'all 0.15s ease'
                }}
                title={isMarketwatchCollapsed ? "Show Marketwatch Sidebar" : "Hide Marketwatch (Expand Chart)"}
              >
                <List size={13} color={isMarketwatchCollapsed ? "#047857" : "#64748b"} />
                <span>{isMarketwatchCollapsed ? "Watchlist" : "Hide"}</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. CENTER: All 8 Navigation Tabs on Desktop (Hidden on mobile & vertical screens in favor of Bottom Nav) */}
        <div 
          className="nav-tabs-desktop hide-vertical nav-tabs-scroll" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '2px', 
            overflowX: 'auto', 
            flexShrink: 1,
            minWidth: 0
          }}
        >
          <button
            className={`nav-tab ${activeTab === 'terminal' ? 'active' : ''}`}
            onClick={() => setActiveTab('terminal')}
            style={{ fontSize: '0.78rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
          >
            <BarChart3 size={13} />
            <span>Terminal</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'option-chain' ? 'active' : ''}`}
            onClick={() => setActiveTab('option-chain')}
            style={{ fontSize: '0.78rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
            title="NSE & BSE Index Option Chain"
          >
            <Layers size={13} />
            <span>Option Chain</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            style={{ fontSize: '0.78rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
          >
            <LayoutDashboard size={13} />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            style={{ fontSize: '0.78rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
          >
            <ListOrdered size={13} />
            <span>Orders</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'holdings' ? 'active' : ''}`}
            onClick={() => setActiveTab('holdings')}
            style={{ fontSize: '0.78rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
          >
            <Briefcase size={13} />
            <span>Holdings</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'positions' ? 'active' : ''}`}
            onClick={() => setActiveTab('positions')}
            style={{ fontSize: '0.78rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
          >
            <Layers size={13} />
            <span>Positions</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'journal' ? 'active' : ''}`}
            onClick={() => setActiveTab('journal')}
            style={{ fontSize: '0.78rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
          >
            <BookOpen size={13} />
            <span>Journal</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'learn' ? 'active' : ''}`}
            onClick={() => setActiveTab('learn')}
            style={{ fontSize: '0.78rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
          >
            <GraduationCap size={13} />
            <span>Learn</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            style={{ fontSize: '0.78rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
          >
            <User size={13} />
            <span>Profile</span>
          </button>
        </div>

        {/* 3. RIGHT: Search, Margin & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* PWA Install Button */}
          {!(isInstalled || isAppInstalled) && (
            <button
              onClick={onInstallApp || handleInstallClick}
              className="btn-ghost"
              style={{
                padding: '5px 9px',
                fontSize: '0.72rem',
                background: '#ecfdf5',
                borderColor: '#a7f3d0',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                fontWeight: 700
              }}
              title="Install Apex Trading App on your device"
            >
              <Smartphone size={13} color="#059669" />
              <span className="hide-mobile">Install App</span>
            </button>
          )}

          {/* Mobile & Tablet Watchlist Drawer Trigger */}
          {onToggleWatchlist && (
            <button
              onClick={onToggleWatchlist}
              className="show-under-1024"
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '5px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '6px 10px',
                color: '#047857',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0
              }}
              title="Open Marketwatch Watchlist"
            >
              <List size={15} color="#059669" />
              <span className="hide-mobile">Watchlist</span>
              {watchlistCount > 0 && (
                <span style={{
                  background: '#059669',
                  color: '#ffffff',
                  borderRadius: '10px',
                  fontSize: '0.62rem',
                  padding: '1px 5px',
                  fontWeight: 800
                }}>
                  {watchlistCount}
                </span>
              )}
            </button>
          )}

          {/* Universal Search Button - Enlarged Desktop Bar */}
          <button
            onClick={onOpenSearch}
            className="navbar-search-btn"
            style={{ 
              padding: '6px 12px', 
              fontSize: '0.8rem', 
              background: '#f8fafc', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '10px', 
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease'
            }}
            title="Search Any Stock or Index (Ctrl+K)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={14} color="#059669" />
              <span className="navbar-search-placeholder" style={{ color: '#64748b', fontWeight: 500 }}>Search stocks, indices...</span>
            </div>
            <kbd style={{ 
              fontSize: '0.66rem', 
              background: '#ffffff', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              color: '#475569', 
              fontWeight: 700, 
              border: '1px solid #cbd5e1',
              fontFamily: 'monospace',
              boxShadow: '0 1px 1px rgba(0,0,0,0.05)'
            }}>
              Ctrl+K
            </kbd>
          </button>

          {/* Margin Badge (Links to Profile & Funds) */}
          <div 
            onClick={() => setActiveTab('profile')}
            className="hide-mobile"
            style={{ 
              cursor: 'pointer', 
              background: '#ecfdf5', 
              border: '1px solid #a7f3d0', 
              borderRadius: '6px', 
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="View Trading Funds & Margin in Profile"
          >
            <div>
              <div style={{ fontSize: '0.55rem', color: '#047857', textTransform: 'uppercase', lineHeight: 1, fontWeight: 700 }}>Margin</div>
              <div className="font-mono" style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669' }}>
                ₹{cashBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <Plus size={11} color="#059669" />
          </div>

          {/* User Account Profile Pill (Avatar Only) */}
          {currentUser ? (
            <div
              onClick={() => setActiveTab('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                background: activeTab === 'profile' ? '#ecfdf5' : '#f8fafc',
                border: activeTab === 'profile' ? '2px solid #10b981' : '1.5px solid #cbd5e1',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
              title={`Account: ${currentUser.name || 'User Profile'}`}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                {currentUser.picture ? (
                  <img src={currentUser.picture} alt={currentUser.name || 'Profile'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                    {(currentUser.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                padding: '5px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}
              title="Sign in to your account"
            >
              <svg width="13" height="13" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="hide-mobile">Sign in</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
