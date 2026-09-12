import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import KiteNavbar from './components/KiteNavbar';
import KiteMarketwatch from './components/KiteMarketwatch';
import KiteOrderModal from './components/KiteOrderModal';
import KiteDashboard from './components/KiteDashboard';
import KiteHoldings from './components/KiteHoldings';
import KitePositions from './components/KitePositions';
import KiteFunds from './components/KiteFunds';
import StockHeader from './components/StockHeader';
import TradingChart from './components/TradingChart';
import OrderTicket from './components/OrderTicket';
import MarketDepth from './components/MarketDepth';
import OrdersTab from './components/OrdersTab';
import JournalTab from './components/JournalTab';
import AnalyticsTab from './components/AnalyticsTab';
import StockSearchModal from './components/StockSearchModal';
import LearnAcademy from './components/LearnAcademy';
import MobileNav from './components/MobileNav';
import InitialFundsModal from './components/InitialFundsModal';
import TipsModal from './components/TipsModal';
import MobileMenuDrawer from './components/MobileMenuDrawer';
import GoogleAuthModal from './components/GoogleAuthModal';
import LoginPage from './components/LoginPage';
import ScreenLockModal from './components/ScreenLockModal';
import ProfileTab from './components/ProfileTab';
import { isAnyMarketOpen, shouldPollSymbol } from './utils/marketHours';

// Safe fetch helper that resists non-JSON / error responses
const safeFetchJson = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return { success: false, status: res.status };
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    return { success: false, error: 'Non-JSON response' };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// Responsive hook: true when viewport is mobile/tablet width
function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

export default function App() {
  const [activeSymbol, setActiveSymbol] = useState(null);
  const [currentQuote, setCurrentQuote] = useState(null);
  const [indices, setIndices] = useState([]);
  const [timeframe, setTimeframe] = useState({ label: '5m', range: '5d', interval: '5m', title: '5 Minutes' });
  const [candles, setCandles] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [portfolio, setPortfolio] = useState(null);

  // Active Navigation Tab: 'terminal' | 'dashboard' | 'orders' | 'holdings' | 'positions' | 'funds' | 'journal' | 'learn'
  const [activeTab, setActiveTab] = useState('terminal');

  // Responsive + mobile drawers
  const isMobile = useIsMobile();
  const [showMobileWatchlist, setShowMobileWatchlist] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator?.standalone === true;
  });

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install Apex Trading:\n\nChrome/Edge: Click the install icon in your address bar.\niOS Safari: Tap Share -> "Add to Home Screen".\nAndroid: Tap browser menu -> "Install App".');
    }
  }, [deferredPrompt]);

  // Beginner Mode (persisted)
  const [beginnerMode, setBeginnerMode] = useState(() => localStorage.getItem('bt-beginner-mode') === '1');
  const toggleBeginnerMode = () => {
    setBeginnerMode(prev => {
      localStorage.setItem('bt-beginner-mode', prev ? '0' : '1');
      return !prev;
    });
  };

  // Modals & Auth
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showInitialFundsModal, setShowInitialFundsModal] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ax_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Verify session on mount
  useEffect(() => {
    safeFetchJson('/api/auth/me')
      .then(res => {
        if (res && res.success && res.user) {
          setCurrentUser(res.user);
          localStorage.setItem('ax_current_user', JSON.stringify(res.user));
        } else if (!localStorage.getItem('ax_current_user')) {
          setCurrentUser(null);
        }
      })
      .catch(() => {});
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('ax_current_user', JSON.stringify(user));
    } catch {}
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('ax_current_user');
    localStorage.removeItem('ax_auth_token');
    sessionStorage.removeItem('ax_screen_locked');
    setCurrentUser(null);
    setIsAuthOpen(false);
    setIsScreenLocked(false);
  };

  // Terminal Screen Lock State
  const [isScreenLocked, setIsScreenLocked] = useState(() => {
    return sessionStorage.getItem('ax_screen_locked') === 'true';
  });

  const handleLockScreen = useCallback(() => {
    setIsScreenLocked(true);
    sessionStorage.setItem('ax_screen_locked', 'true');
  }, []);

  const handleUnlockScreen = useCallback(() => {
    setIsScreenLocked(false);
    sessionStorage.removeItem('ax_screen_locked');
  }, []);

  // Keyboard shortcut: Ctrl+L or Cmd+L to quickly lock/unlock terminal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        if (currentUser) {
          setIsScreenLocked(prev => {
            const next = !prev;
            if (next) {
              sessionStorage.setItem('ax_screen_locked', 'true');
            } else {
              sessionStorage.removeItem('ax_screen_locked');
            }
            return next;
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser]);

  const [orderModalConfig, setOrderModalConfig] = useState({
    isOpen: false,
    quote: null,
    action: 'BUY'
  });

  // Fetch Live Indices
  const fetchIndices = useCallback(() => {
    safeFetchJson('/api/market/indices')
      .then(res => {
        if (res && res.success && res.data) setIndices(res.data);
      })
      .catch(console.error);
  }, []);

  // Fetch Current Stock Quote
  const fetchQuote = useCallback((symbol) => {
    if (!symbol) return;
    safeFetchJson(`/api/market/quote/${encodeURIComponent(symbol)}`)
      .then(res => {
        if (res && res.success && res.data) {
          setCurrentQuote(res.data);
          if (res.data.symbol && res.data.symbol !== symbol) {
            setActiveSymbol(res.data.symbol);
          }
        }
      })
      .catch(console.error);
  }, []);

  // Fetch Candlestick History
  const fetchCandles = useCallback((symbol, tf, silent = false) => {
    if (!symbol) return;
    if (!silent) setLoadingChart(true);
    safeFetchJson(`/api/market/history/${encodeURIComponent(symbol)}?range=${tf.range}&interval=${tf.interval}`)
      .then(res => {
        if (res && res.success && res.data) setCandles(res.data);
      })
      .catch(console.error)
      .finally(() => { if (!silent) setLoadingChart(false); });
  }, []);

  // Fetch Portfolio Summary
  const fetchPortfolio = useCallback(() => {
    safeFetchJson('/api/portfolio')
      .then(res => {
        if (res && res.success && res.data) {
          setPortfolio(res.data);
        }
      })
      .catch(console.error);
  }, []);

  // Initial Capital check and auto-selecting first stock if available
  useEffect(() => {
    if (portfolio) {
      if (portfolio.initialCapital === 0 || portfolio.cashBalance === 0) {
        setShowInitialFundsModal(true);
      }
      if (!activeSymbol && portfolio.watchlists?.[0]?.symbols?.length > 0) {
        handleSelectStock(portfolio.watchlists[0].symbols[0]);
      }
    }
  }, [portfolio, activeSymbol]);

  // Initial Load & Smart Polling (Pauses on Market Close & Tab Hide)
  useEffect(() => {
    fetchIndices();
    fetchPortfolio();
    if (activeSymbol) {
      fetchQuote(activeSymbol);
      fetchCandles(activeSymbol, timeframe);
    }

    const intervalId = setInterval(() => {
      // RULE 1: Never poll if tab is backgrounded / minimized
      if (document.hidden) return;

      // RULE 2: Pause indices polling if all markets are closed
      if (isAnyMarketOpen()) {
        fetchIndices();
      }

      // RULE 1 & 2: Only poll the actively visible symbol if its exchange is open
      if (activeSymbol && shouldPollSymbol(activeSymbol)) {
        fetchQuote(activeSymbol);
        fetchCandles(activeSymbol, timeframe, true);
      }
    }, 5000);

    // Refresh immediately when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (isAnyMarketOpen()) fetchIndices();
        if (activeSymbol && shouldPollSymbol(activeSymbol)) {
          fetchQuote(activeSymbol);
          fetchCandles(activeSymbol, timeframe, true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeSymbol, timeframe, fetchIndices, fetchQuote, fetchCandles, fetchPortfolio]);

  // When timeframe changes, reload chart
  useEffect(() => {
    if (activeSymbol) {
      fetchCandles(activeSymbol, timeframe);
    }
  }, [timeframe, activeSymbol, fetchCandles]);

  // Global Keyboard Shortcuts (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Select Stock
  const handleSelectStock = (symbol) => {
    setActiveSymbol(symbol);
    fetchQuote(symbol);
    fetchCandles(symbol, timeframe);
  };

  // Open Order Modal
  const handleOpenOrderModal = (stockQuote, action = 'BUY') => {
    setOrderModalConfig({
      isOpen: true,
      quote: stockQuote,
      action
    });
  };

  // Watchlist Actions
  const handleAddToWatchlist = async (watchlistId, symbol) => {
    try {
      const res = await fetch('/api/watchlists/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlistId, symbol })
      });
      const data = await res.json();
      if (data.success) {
        setPortfolio(prev => ({ ...prev, watchlists: data.data }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFromWatchlist = async (watchlistId, symbol) => {
    try {
      const res = await fetch('/api/watchlists/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlistId, symbol })
      });
      const data = await res.json();
      if (data.success) {
        setPortfolio(prev => ({ ...prev, watchlists: data.data }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Close Position
  const handleClosePosition = async (id, exitThesis) => {
    const res = await fetch(`/api/positions/${id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exitThesis })
    });
    const data = await res.json();
    if (data.success) {
      setPortfolio(data.portfolio);
    } else {
      throw new Error(data.error || 'Failed to close position');
    }
  };

  // Update Funds
  const handleUpdateFunds = async (amount) => {
    const res = await fetch('/api/portfolio/update-funds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    const data = await res.json();
    if (data.success) {
      setPortfolio(data.data);
    } else {
      throw new Error(data.error || 'Failed to update funds');
    }
  };

  // Reset Portfolio
  const handleResetPortfolio = async (capital) => {
    const res = await fetch('/api/portfolio/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capital })
    });
    const data = await res.json();
    if (data.success) {
      setPortfolio(data.data);
    } else {
      throw new Error(data.error || 'Failed to reset portfolio');
    }
  };

  // Update Journal Entry
  const handleUpdateJournal = async (id, updates) => {
    const res = await fetch(`/api/journal/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (data.success) {
      fetchPortfolio();
    }
  };

  const isInWatchlist = activeSymbol && portfolio?.watchlists?.[0]?.symbols?.includes(activeSymbol);

  // MANDATORY AUTH GATE: No user enters the terminal without logging in
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onInstallApp={handleInstallPwa}
        isAppInstalled={isPwaInstalled}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#090d16' }}>
      
      {/* Apex Trading Top Navigation */}
      <KiteNavbar
        portfolio={portfolio}
        indices={indices}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenFunds={() => setActiveTab('funds')}
        onSelectStock={handleSelectStock}
        isMobile={isMobile}
        beginnerMode={beginnerMode}
        onOpenTips={() => setIsTipsOpen(true)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onToggleWatchlist={() => setShowMobileWatchlist(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLockScreen={handleLockScreen}
        onInstallApp={handleInstallPwa}
        isAppInstalled={isPwaInstalled}
      />

      {/* Main Body with 2-Column Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', flex: 1, minHeight: isMobile ? 'auto' : 'calc(100vh - 62px)' }}>

        {/* Left Column: Marketwatch (desktop sidebar) */}
        {!isMobile && (
          <aside>
            <KiteMarketwatch
              watchlists={portfolio?.watchlists}
              activeSymbol={activeSymbol}
              onSelectSymbol={(sym) => {
                handleSelectStock(sym);
                if (activeTab !== 'terminal') setActiveTab('terminal');
              }}
              onOpenOrderModal={handleOpenOrderModal}
              onRemoveSymbol={handleRemoveFromWatchlist}
              onOpenSearch={() => setIsSearchOpen(true)}
            />
          </aside>
        )}

        {/* Mobile Watchlist Slide-over Drawer */}
        {isMobile && showMobileWatchlist && (
          <div className="mobile-drawer-overlay" onClick={() => setShowMobileWatchlist(false)}>
            <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
              <KiteMarketwatch
                watchlists={portfolio?.watchlists}
                activeSymbol={activeSymbol}
                onSelectSymbol={(sym) => {
                  handleSelectStock(sym);
                  setShowMobileWatchlist(false);
                  if (activeTab !== 'terminal') setActiveTab('terminal');
                }}
                onOpenOrderModal={handleOpenOrderModal}
                onRemoveSymbol={handleRemoveFromWatchlist}
                onOpenSearch={() => setIsSearchOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Right Column: Dynamic View Container */}
        <main style={{ padding: isMobile ? '14px 12px 90px 12px' : '20px 24px', overflowY: 'auto' }}>
          
          {/* TAB 1: TRADING TERMINAL */}
          {activeTab === 'terminal' && (
            !activeSymbol || !currentQuote ? (
              <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '750px', margin: '40px auto' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  margin: '0 auto 16px auto',
                  overflow: 'hidden',
                  boxShadow: '0 0 24px rgba(16, 185, 129, 0.4)',
                  border: '1px solid rgba(16, 185, 129, 0.5)'
                }}>
                  <img src="/logo.png" alt="Apex Trading" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#fff', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                  Apex Trading Terminal
                </h2>
                <p style={{ fontSize: '0.88rem', color: '#94a3b8', maxWidth: '500px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
                  Everything starts clean and fresh with 100% real live market data. No preloaded stocks. Search and add any stock or index to get started.
                </p>

                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="btn-primary"
                  style={{ padding: '12px 24px', fontSize: '0.95rem', margin: '0 auto 28px auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Search size={18} /> Search Any Stock or Index (Ctrl+K)
                </button>

                <div style={{ borderTop: '1px solid #1e293b', paddingTop: '20px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Or select a benchmark to load:
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[
                      { label: 'NIFTY 50', symbol: '^NSEI' },
                      { label: 'BANK NIFTY', symbol: '^NSEBANK' },
                      { label: 'SENSEX', symbol: '^BSESN' },
                      { label: 'RELIANCE', symbol: 'RELIANCE.NS' },
                      { label: 'S&P 500', symbol: '^GSPC' },
                      { label: 'NASDAQ', symbol: '^IXIC' },
                      { label: 'APPLE', symbol: 'AAPL' }
                    ].map(p => (
                      <button
                        key={p.symbol}
                        onClick={() => handleSelectStock(p.symbol)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          color: '#cbd5e1',
                          border: '1px solid #1e293b',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#10b981';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#1e293b';
                          e.currentTarget.style.color = '#cbd5e1';
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <StockHeader
                  quote={currentQuote}
                  isInWatchlist={isInWatchlist}
                  onToggleWatchlist={() => {
                    const defaultWl = portfolio?.watchlists?.[0];
                    if (!defaultWl) return;
                    if (defaultWl.symbols.includes(activeSymbol)) {
                      handleRemoveFromWatchlist(defaultWl.id, activeSymbol);
                    } else {
                      handleAddToWatchlist(defaultWl.id, activeSymbol);
                    }
                  }}
                />

                {/* Beginner Mode: plain-language tip strip */}
                {beginnerMode && (
                  <div className="glass-panel" style={{ padding: '12px 16px', marginBottom: '14px', background: 'rgba(245, 158, 11, 0.06)', borderColor: 'rgba(245, 158, 11, 0.3)', fontSize: '0.82rem', color: '#fcd34d', lineHeight: 1.5 }}>
                    <b>Beginner tip:</b> CNC means you buy shares for delivery (truly yours, hold for years, zero brokerage).
                    MIS is intraday leverage that must be squared off today — riskier. Start with small CNC buys on
                    large caps. Set a Stop Loss (SL) order so you exit automatically if the trade goes wrong.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: '16px', alignItems: 'start' }}>
                  {/* Center: Chart & Market Depth */}
                  <div>
                    <TradingChart
                      symbol={activeSymbol}
                      timeframe={timeframe}
                      setTimeframe={setTimeframe}
                      candles={candles}
                      loading={loadingChart}
                      currentPrice={currentQuote?.price}
                      currency={currentQuote?.currency || 'INR'}
                    />
                    <MarketDepth quote={currentQuote} onSelectStock={handleSelectStock} />
                  </div>

                  {/* Right: Quick Order Ticket Panel */}
                  <div style={{ minHeight: isMobile ? 'auto' : '560px' }}>
                    <OrderTicket
                      quote={currentQuote}
                      portfolio={portfolio}
                      beginnerMode={beginnerMode}
                      onOrderPlaced={(res) => {
                        if (res.portfolio) setPortfolio(res.portfolio);
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          )}

          {/* TAB 2: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <KiteDashboard
              portfolio={portfolio}
              indices={indices}
              onNavigate={setActiveTab}
              onSelectStock={handleSelectStock}
              onOpenFunds={() => setActiveTab('funds')}
            />
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <OrdersTab orders={portfolio?.orders} />
          )}

          {/* TAB 4: HOLDINGS */}
          {activeTab === 'holdings' && (
            <KiteHoldings
              portfolio={portfolio}
              onSelectStock={handleSelectStock}
              onOpenOrderModal={handleOpenOrderModal}
              onNavigate={setActiveTab}
            />
          )}

          {/* TAB 5: POSITIONS */}
          {activeTab === 'positions' && (
            <KitePositions
              positions={portfolio?.positions}
              onClosePosition={handleClosePosition}
              onSelectStock={handleSelectStock}
              onNavigate={setActiveTab}
            />
          )}

          {/* TAB 6: PROFILE & ACCOUNT HUB (Includes Funds, Security, Preferences) */}
          {(activeTab === 'profile' || activeTab === 'funds' || activeTab === 'settings') && (
            <ProfileTab
              currentUser={currentUser}
              portfolio={portfolio}
              onUpdateFunds={handleUpdateFunds}
              onResetPortfolio={handleResetPortfolio}
              onLogout={handleLogout}
              onLockScreen={handleLockScreen}
              beginnerMode={beginnerMode}
              setBeginnerMode={setBeginnerMode}
              onOpenTips={() => setIsTipsOpen(true)}
            />
          )}

          {/* TAB 7: CONSOLE & JOURNAL */}
          {activeTab === 'journal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <AnalyticsTab portfolio={portfolio} />
              <JournalTab
                journal={portfolio?.journal}
                onUpdateJournal={handleUpdateJournal}
              />
            </div>
          )}

          {/* TAB 8: LEARN ACADEMY */}
          {activeTab === 'learn' && (
            <LearnAcademy onNavigate={setActiveTab} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenWatchlist={() => setShowMobileWatchlist(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      )}

      {/* Order Modal */}
      <KiteOrderModal
        isOpen={orderModalConfig.isOpen}
        onClose={() => setOrderModalConfig(prev => ({ ...prev, isOpen: false }))}
        quote={orderModalConfig.quote || currentQuote}
        defaultAction={orderModalConfig.action}
        portfolio={portfolio}
        beginnerMode={beginnerMode}
        onOrderPlaced={(res) => {
          if (res.portfolio) setPortfolio(res.portfolio);
        }}
      />

      {/* Global Universal Stock Search Modal (Ctrl+K) */}
      <StockSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectStock={(sym) => {
          handleSelectStock(sym);
          if (activeTab !== 'terminal') setActiveTab('terminal');
        }}
      />

      {/* Initial Starting Funds Setup Modal */}
      <InitialFundsModal
        isOpen={showInitialFundsModal}
        onClose={() => setShowInitialFundsModal(false)}
        onSetCapital={async (capital) => {
          await handleResetPortfolio(capital);
        }}
      />

      {/* Interactive Beginner Trading Tips Modal */}
      <TipsModal
        isOpen={isTipsOpen}
        onClose={() => setIsTipsOpen(false)}
      />

      {/* Mobile All Features Menu Drawer */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenTips={() => setIsTipsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onInstallPWA={handleInstallPwa}
        indices={indices}
        onSelectStock={handleSelectStock}
        portfolio={portfolio}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Google OAuth & Account Modal */}
      <GoogleAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* Screen Lock Privacy Modal */}
      <ScreenLockModal
        isOpen={isScreenLocked}
        onUnlock={handleUnlockScreen}
        currentUser={currentUser}
        onLogout={handleLogout}
        indices={indices}
      />
    </div>
  );
}
