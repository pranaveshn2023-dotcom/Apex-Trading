import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Sparkles, TrendingUp, ArrowRight, List, X } from 'lucide-react';
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
import OptionChain from './components/OptionChain';
import ApexLogo from './components/ApexLogo';
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

// Responsive viewport hook: provides width, height, and vertical/mobile screen detection
function useViewport() {
  const [viewport, setViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1200, height: 800, isVertical: false, isMobile: false, isTablet: false, isCompact: false };
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isVertical = h > w || w <= 1024;
    return {
      width: w,
      height: h,
      isVertical,
      isMobile: w < 768,
      isTablet: w >= 768 && w <= 1024,
      isCompact: w < 1180,
    };
  });

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isVertical = h > w || w <= 1024;
      setViewport({
        width: w,
        height: h,
        isVertical,
        isMobile: w < 768,
        isTablet: w >= 768 && w <= 1024,
        isCompact: w < 1180,
      });
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  return viewport;
}

export default function App() {
  const [activeSymbol, setActiveSymbol] = useState('^NSEI');
  const [currentQuote, setCurrentQuote] = useState(null);
  const [indices, setIndices] = useState([]);
  const [timeframe, setTimeframe] = useState({ label: '5m', range: '5d', interval: '5m', title: '5 Minutes' });
  const [candles, setCandles] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [portfolio, setPortfolio] = useState(null);

  // Active Navigation Tab: 'terminal' | 'dashboard' | 'orders' | 'holdings' | 'positions' | 'funds' | 'journal' | 'learn'
  const [activeTab, setActiveTab] = useState('terminal');

  // Responsive breakpoints
  const { width: viewportWidth, isMobile, isTablet, isCompact, isVertical } = useViewport();
  const [showMobileWatchlist, setShowMobileWatchlist] = useState(false);
  const [isMarketwatchCollapsed, setIsMarketwatchCollapsed] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator?.standalone === true;
    const isStored = localStorage.getItem('apex_pwa_installed') === 'true';
    return isStandalone || isStored;
  });

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // App is offered to install, meaning it was uninstalled or not yet installed
      localStorage.removeItem('apex_pwa_installed');
      setIsPwaInstalled(false);
    };

    const handleAppInstalled = () => {
      localStorage.setItem('apex_pwa_installed', 'true');
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
        localStorage.setItem('apex_pwa_installed', 'true');
        setIsPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      localStorage.setItem('apex_pwa_installed', 'true');
      setIsPwaInstalled(true);
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
  const [searchInitialQuery, setSearchInitialQuery] = useState('');

  const handleOpenSearch = useCallback((initialQuery = '') => {
    setSearchInitialQuery(typeof initialQuery === 'string' ? initialQuery : '');
    setIsSearchOpen(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchInitialQuery('');
  }, []);

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
      .catch(() => { });
  }, []);

  // -------------------------------------------------------------
  // PIN SECURITY ARCHITECTURE:
  // 1. Mandatory pass key / PIN required on every page refresh / load
  // 2. Active session is kept unlocked during active usage
  // 3. 2 minutes of background inactivity locks terminal immediately
  // 4. Removed Ctrl+L shortcut to avoid intercepting browser address bar
  // -------------------------------------------------------------
  const [isScreenLocked, setIsScreenLocked] = useState(true);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('ax_current_user', JSON.stringify(user));
    } catch { }
    // Require PIN every time user logs into the app
    sessionStorage.setItem('ax_screen_locked', 'true');
    setIsScreenLocked(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { }
    localStorage.removeItem('ax_current_user');
    localStorage.removeItem('ax_auth_token');
    sessionStorage.removeItem('ax_screen_locked');
    sessionStorage.removeItem('ax_bg_timestamp');
    setCurrentUser(null);
    setIsAuthOpen(false);
    setIsScreenLocked(true);
  };

  const handleLockScreen = useCallback(() => {
    setIsScreenLocked(true);
    sessionStorage.setItem('ax_screen_locked', 'true');
  }, []);

  const handleUnlockScreen = useCallback(() => {
    setIsScreenLocked(false);
    sessionStorage.removeItem('ax_screen_locked');
    sessionStorage.removeItem('ax_bg_timestamp');
  }, []);

  // Prompt user to add funds on first visit if balance is 0 and unconfigured
  useEffect(() => {
    if (!isScreenLocked && currentUser && portfolio) {
      const userKey = currentUser.email || currentUser.id || 'default';
      const isConfigured = localStorage.getItem('ax_funds_configured_' + userKey);
      if (!isConfigured && (portfolio.initialCapital === 0 || !portfolio.initialCapital) && (portfolio.cashBalance === 0 || !portfolio.cashBalance) && (!portfolio.orders || portfolio.orders.length === 0)) {
        setShowInitialFundsModal(true);
      }
    }
  }, [isScreenLocked, currentUser, portfolio]);

  // 5-Minute Background Inactivity Guard
  useEffect(() => {
    if (!currentUser) return;

    let bgTimer = null;
    const BACKGROUND_LOCK_DELAY_MS = 300000; // 5 minutes (300 seconds)

    const handleEnterBackground = () => {
      // Record when the app was sent to the background (tab hidden or window blurred/minimized)
      const now = Date.now();
      if (!sessionStorage.getItem('ax_bg_timestamp')) {
        sessionStorage.setItem('ax_bg_timestamp', now.toString());
      }

      if (bgTimer) clearTimeout(bgTimer);
      bgTimer = setTimeout(() => {
        // App kept in background for 5 minutes -> trigger PIN screen lock
        sessionStorage.setItem('ax_screen_locked', 'true');
        setIsScreenLocked(true);
      }, BACKGROUND_LOCK_DELAY_MS);
    };

    const handleReturnForeground = () => {
      // Check if 5 minutes elapsed while in background
      const bgTimeStr = sessionStorage.getItem('ax_bg_timestamp');
      if (bgTimeStr) {
        const elapsed = Date.now() - parseInt(bgTimeStr, 10);
        if (elapsed >= BACKGROUND_LOCK_DELAY_MS) {
          sessionStorage.setItem('ax_screen_locked', 'true');
          setIsScreenLocked(true);
        }
        sessionStorage.removeItem('ax_bg_timestamp');
      }

      if (bgTimer) {
        clearTimeout(bgTimer);
        bgTimer = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleEnterBackground();
      } else {
        handleReturnForeground();
      }
    };

    const onWindowBlur = () => {
      // If window lost focus and document is not focused, trigger background timer
      if (!document.hasFocus()) {
        handleEnterBackground();
      }
    };

    const onWindowFocus = () => {
      handleReturnForeground();
    };

    // Periodic check every second to catch background timeout even if browser throttles timer
    const bgCheckInterval = setInterval(() => {
      const bgTimeStr = sessionStorage.getItem('ax_bg_timestamp');
      if (bgTimeStr && (document.hidden || !document.hasFocus())) {
        const elapsed = Date.now() - parseInt(bgTimeStr, 10);
        if (elapsed >= BACKGROUND_LOCK_DELAY_MS) {
          sessionStorage.setItem('ax_screen_locked', 'true');
          setIsScreenLocked(true);
          sessionStorage.removeItem('ax_bg_timestamp');
        }
      }
    }, 1000);

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('pageshow', onWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('pageshow', onWindowFocus);
      if (bgTimer) clearTimeout(bgTimer);
      clearInterval(bgCheckInterval);
    };
  }, [currentUser]);

  const [orderModalConfig, setOrderModalConfig] = useState({
    isOpen: false,
    quote: null,
    action: 'BUY'
  });

  // Terminal Subview: 'chart' | 'chain'
  const [terminalViewMode, setTerminalViewMode] = useState('chart');

  const handleSelectOptionTrade = useCallback((contract, action = 'BUY') => {
    setOrderModalConfig({
      isOpen: true,
      quote: {
        symbol: contract.symbol,
        name: contract.name,
        shortName: contract.shortName,
        price: contract.price,
        lotSize: contract.lotSize,
        exchange: contract.exchange || 'NSE',
        type: 'OPTION',
        isOption: true,
        currency: 'INR'
      },
      action: action
    });
  }, []);

  // High-Speed In-Memory Client Caches (Stale-While-Revalidate for 0ms transitions)
  const clientQuoteCache = useRef(new Map());
  const clientCandlesCache = useRef(new Map());

  // Fetch Live Indices
  const fetchIndices = useCallback(() => {
    safeFetchJson('/api/market/indices')
      .then(res => {
        if (res && res.success && res.data) setIndices(res.data);
      })
      .catch(console.error);
  }, []);

  // Fetch Current Stock Quote with 0ms Instant Cache Display
  const fetchQuote = useCallback((symbol) => {
    if (!symbol) return;
    const cleanSym = symbol.trim().toUpperCase();
    const cached = clientQuoteCache.current.get(cleanSym);
    if (cached) {
      setCurrentQuote(cached.data);
      if (cached.data.symbol && cached.data.symbol !== symbol) {
        setActiveSymbol(cached.data.symbol);
      }
      if (Date.now() - cached.time < 3500) return;
    }

    safeFetchJson(`/api/market/quote/${encodeURIComponent(symbol)}`)
      .then(res => {
        if (res && res.success && res.data) {
          clientQuoteCache.current.set(cleanSym, { time: Date.now(), data: res.data });
          if (res.data.symbol) clientQuoteCache.current.set(res.data.symbol.toUpperCase(), { time: Date.now(), data: res.data });
          setCurrentQuote(res.data);
          if (res.data.symbol && res.data.symbol !== symbol) {
            setActiveSymbol(res.data.symbol);
          }
        }
      })
      .catch(console.error);
  }, []);

  // Fetch Candlestick History with Instant Cache + Silent Background Refresh
  const fetchCandles = useCallback((symbol, tf, silent = false) => {
    if (!symbol) return;
    const cacheKey = `${symbol.trim().toUpperCase()}_${tf.range}_${tf.interval}`;
    const cached = clientCandlesCache.current.get(cacheKey);

    if (cached) {
      setCandles(cached.data);
      if (Date.now() - cached.time < 12000 && !silent) {
        return;
      }
    } else if (!silent) {
      setLoadingChart(true);
    }

    safeFetchJson(`/api/market/history/${encodeURIComponent(symbol)}?range=${tf.range}&interval=${tf.interval}`)
      .then(res => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          clientCandlesCache.current.set(cacheKey, { time: Date.now(), data: res.data });
          setCandles(res.data);
        }
      })
      .catch(console.error)
      .finally(() => { if (!silent) setLoadingChart(false); });
  }, []);

  // Fetch Portfolio Summary
  const fetchPortfolio = useCallback((directData = null) => {
    if (directData && directData.orders) {
      setPortfolio(directData);
      return;
    }
    safeFetchJson('/api/portfolio')
      .then(res => {
        if (res && res.success && res.data) {
          setPortfolio(res.data);
        }
      })
      .catch(console.error);
  }, []);

  // Auto-selecting first stock if available
  useEffect(() => {
    if (portfolio) {
      if (!activeSymbol && portfolio.watchlists?.[0]?.symbols?.length > 0) {
        handleSelectStock(portfolio.watchlists[0].symbols[0]);
      }
    }
  }, [portfolio, activeSymbol]);

  // Initial Load & Smart Polling (Pauses on Market Close & Tab Hide)
  useEffect(() => {
    fetchIndices();
    fetchPortfolio();
    const symbolToLoad = activeSymbol || localStorage.getItem('ax_active_symbol') || '^NSEI';
    if (!activeSymbol) setActiveSymbol(symbolToLoad);
    fetchQuote(symbolToLoad);
    fetchCandles(symbolToLoad, timeframe);

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
      const isK = e.key === 'k' || e.key === 'K' || e.code === 'KeyK';
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        return;
      }
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleOpenSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpenSearch]);

  // Handle Select Stock
  const handleSelectStock = (symbol) => {
    setActiveSymbol(symbol);
    try {
      localStorage.setItem('ax_active_symbol', symbol);
    } catch { }
    fetchQuote(symbol);
    fetchCandles(symbol, timeframe);
    setActiveTab('terminal');
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
  const handleResetPortfolio = async (capital = 0) => {
    const numCap = Math.max(0, Number(capital) || 0);
    const freshState = {
      initialCapital: numCap,
      cashBalance: numCap,
      totalHoldingsValue: 0,
      totalInvested: 0,
      totalPortfolioValue: numCap,
      holdingsUnrealizedPnl: 0,
      positionsUnrealizedPnl: 0,
      realizedPnl: 0,
      totalReturn: 0,
      totalReturnPct: 0,
      holdings: [],
      positions: [],
      orders: [],
      journal: [],
      watchlists: [
        { id: 'default', name: 'Watchlist 1', symbols: [] },
        { id: 'wl-2', name: 'Watchlist 2', symbols: [] },
        { id: 'wl-3', name: 'Watchlist 3', symbols: [] },
        { id: 'wl-4', name: 'Watchlist 4', symbols: [] },
        { id: 'wl-5', name: 'Watchlist 5', symbols: [] },
        { id: 'wl-6', name: 'Watchlist 6', symbols: [] },
        { id: 'wl-7', name: 'Watchlist 7', symbols: [] }
      ],
      settings: portfolio?.settings || { enableCharges: true, defaultProduct: 'CNC', slippagePct: 0.05 },
      analytics: { totalTrades: 0, winCount: 0, lossCount: 0, winRate: 0, profitFactor: 0, avgWin: 0, avgLoss: 0, bestTrade: null, sectorBreakdown: [] }
    };
    setPortfolio(freshState);

    try {
      const userKey = currentUser?.email || currentUser?.id || 'default';
      localStorage.setItem('ax_funds_configured_' + userKey, 'true');
    } catch { }

    try {
      const res = await fetch('/api/portfolio/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capital: numCap })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPortfolio(data.data);
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to reset portfolio');
      }
    } catch (err) {
      console.error('Failed to reset portfolio on server:', err);
    }
  };

  // Start Fresh Account: Purges all older data and opens the initial amount page
  const handleStartFreshAccount = useCallback(async () => {
    try {
      const userKey = currentUser?.email || currentUser?.id || 'default';
      localStorage.removeItem('ax_funds_configured_' + userKey);
    } catch { }

    try {
      await fetch('/api/portfolio/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capital: 0 })
      });
    } catch (e) {
      console.error('Reset error:', e);
    }

    setPortfolio({
      initialCapital: 0,
      cashBalance: 0,
      totalHoldingsValue: 0,
      totalInvested: 0,
      totalPortfolioValue: 0,
      holdingsUnrealizedPnl: 0,
      positionsUnrealizedPnl: 0,
      realizedPnl: 0,
      totalReturn: 0,
      totalReturnPct: 0,
      holdings: [],
      positions: [],
      orders: [],
      journal: [],
      watchlists: [
        { id: 'default', name: 'Watchlist 1', symbols: [] },
        { id: 'wl-2', name: 'Watchlist 2', symbols: [] },
        { id: 'wl-3', name: 'Watchlist 3', symbols: [] },
        { id: 'wl-4', name: 'Watchlist 4', symbols: [] },
        { id: 'wl-5', name: 'Watchlist 5', symbols: [] },
        { id: 'wl-6', name: 'Watchlist 6', symbols: [] },
        { id: 'wl-7', name: 'Watchlist 7', symbols: [] }
      ],
      settings: { enableCharges: true, defaultProduct: 'CNC', slippagePct: 0.05 },
      analytics: { totalTrades: 0, winCount: 0, lossCount: 0, winRate: 0, profitFactor: 0, avgWin: 0, avgLoss: 0, bestTrade: null, sectorBreakdown: [] }
    });

    setShowInitialFundsModal(true);
  }, []);

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

  // MANDATORY ZERO-LATENCY PIN GATE:
  // Without PIN, the home page and terminal MUST NOT be shown (0ms latency, zero rendering)
  if (isScreenLocked) {
    return (
      <ScreenLockModal
        isOpen={true}
        onUnlock={handleUnlockScreen}
        currentUser={currentUser}
        onLogout={handleLogout}
        indices={indices}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>

      {/* Apex Trading Top Navigation */}
      <KiteNavbar
        portfolio={portfolio}
        indices={indices}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={handleOpenSearch}
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
        isMarketwatchCollapsed={isMarketwatchCollapsed}
        onToggleCollapseMarketwatch={() => setIsMarketwatchCollapsed(p => !p)}
        watchlistCount={portfolio?.watchlists?.[0]?.symbols?.length || 0}
      />

      {/* Main Body with Responsive Adaptive Split Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: (isMobile || isTablet) ? '1fr' : (isMarketwatchCollapsed ? '0px 1fr' : '320px 1fr'),
        flex: 1,
        minHeight: isMobile ? 'auto' : 'calc(100vh - 62px)',
        transition: 'grid-template-columns 0.2s ease'
      }}>

        {/* Left Column: Marketwatch (Desktop sidebar on screens >= 1024px) */}
        {!(isMobile || isTablet) && !isMarketwatchCollapsed && (
          <aside style={{ borderRight: '1px solid #e2e8f0', background: '#ffffff', height: 'calc(100vh - 56px)', position: 'sticky', top: '56px', overflowY: 'auto' }}>
            <KiteMarketwatch
              watchlists={portfolio?.watchlists}
              activeSymbol={activeSymbol}
              onSelectSymbol={(sym) => {
                handleSelectStock(sym);
                if (activeTab !== 'terminal') setActiveTab('terminal');
              }}
              onOpenOrderModal={handleOpenOrderModal}
              onRemoveSymbol={handleRemoveFromWatchlist}
              onAddToWatchlist={handleAddToWatchlist}
              onOpenSearch={handleOpenSearch}
            />
          </aside>
        )}

        {/* Mobile & Tablet Watchlist Slide-over Drawer */}
        {(isMobile || isTablet) && showMobileWatchlist && (
          <div className="mobile-drawer-overlay" onClick={() => setShowMobileWatchlist(false)}>
            <div className="mobile-drawer" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Drawer Header */}
              <div style={{
                padding: '12px 14px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                  <List size={16} color="#059669" />
                  <span>MARKETWATCH</span>
                </div>
                <button
                  onClick={() => setShowMobileWatchlist(false)}
                  style={{
                    background: '#e2e8f0',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#475569'
                  }}
                  title="Close Watchlist"
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
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
                  onAddToWatchlist={handleAddToWatchlist}
                  onOpenSearch={handleOpenSearch}
                />
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Dynamic View Container */}
        <main style={{
          padding: isVertical ? '12px 12px 88px 12px' : '20px 24px',
          overflowY: 'auto',
          minWidth: 0
        }}>

          {/* TAB 1: TRADING TERMINAL */}
          {activeTab === 'terminal' && (
            !activeSymbol ? (
              <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '750px', margin: '40px auto' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <ApexLogo size={72} withGlow={true} />
                </div>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                  Apex Trading Terminal
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#475569', maxWidth: '520px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
                  Everything starts clean and fresh with 100% real live market data. No preloaded stocks. Search and add any stock or index to get started.
                </p>

                <button
                  onClick={() => handleOpenSearch()}
                  className="btn-primary"
                  style={{ padding: '12px 26px', fontSize: '0.95rem', margin: '0 auto 28px auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Search size={18} /> Search Any Stock or Index (Ctrl+K)
                </button>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
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
                          background: '#ffffff',
                          color: '#334155',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '7px 14px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#10b981';
                          e.currentTarget.style.color = '#047857';
                          e.currentTarget.style.background = '#ecfdf5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.color = '#334155';
                          e.currentTarget.style.background = '#ffffff';
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : !currentQuote ? (
              <div className="glass-panel" style={{ padding: '80px 24px', textAlign: 'center', maxWidth: '750px', margin: '40px auto' }}>
                <div className="pulse-live" style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#059669', margin: '0 auto 16px auto' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                  Loading Live Exchange Data for {activeSymbol}...
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Connecting to real-time market gateway. Chart and order ticket will appear momentarily.
                </p>
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
                  <div className="glass-panel" style={{ padding: '12px 16px', marginBottom: '14px', background: '#fffbeb', borderColor: '#fde68a', fontSize: '0.82rem', color: '#b45309', lineHeight: 1.5 }}>
                    <b>Beginner tip:</b> CNC means you buy shares for delivery (truly yours, hold for years, zero brokerage).
                    MIS is intraday leverage that must be squared off today — riskier. Start with small CNC buys on
                    large caps. Set a Stop Loss (SL) order so you exit automatically if the trade goes wrong.
                  </div>
                )}

                {/* Terminal Subview Mode Selector: Candlestick Chart vs Option Chain */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setTerminalViewMode('chart')}
                      style={{
                        background: terminalViewMode === 'chart' ? '#ffffff' : 'transparent',
                        color: terminalViewMode === 'chart' ? '#059669' : '#64748b',
                        border: 'none',
                        padding: '5px 14px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: terminalViewMode === 'chart' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      Candlestick Chart
                    </button>
                    <button
                      type="button"
                      onClick={() => setTerminalViewMode('chain')}
                      style={{
                        background: terminalViewMode === 'chain' ? '#ffffff' : 'transparent',
                        color: terminalViewMode === 'chain' ? '#059669' : '#64748b',
                        border: 'none',
                        padding: '5px 14px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: terminalViewMode === 'chain' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      Option Chain (F&O)
                    </button>
                  </div>
                </div>

                {terminalViewMode === 'chain' ? (
                  <OptionChain
                    indices={indices}
                    onSelectOptionTrade={handleSelectOptionTrade}
                    onBackToTerminal={() => setTerminalViewMode('chart')}
                  />
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isCompact ? '1fr' : '1fr 340px',
                    gap: '16px',
                    alignItems: 'start'
                  }}>
                    {/* Center: Chart & Market Depth */}
                    <div style={{ minWidth: 0, width: '100%' }}>
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
                    <div style={{ minHeight: isCompact ? 'auto' : '560px', width: '100%' }}>
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
                )}

                {/* Mobile Quick Trade Sticky Bar (Zerodha Kite Mobile Style) */}
                {(isMobile || isCompact) && currentQuote && (
                  <div style={{
                    position: 'fixed',
                    bottom: isVertical ? '54px' : '0px',
                    left: 0,
                    right: 0,
                    zIndex: 130,
                    background: 'rgba(255, 255, 255, 0.96)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    borderTop: '1px solid #e2e8f0',
                    padding: '8px 14px',
                    display: 'flex',
                    gap: '10px',
                    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)'
                  }}>
                    <button
                      onClick={() => handleOpenOrderModal(currentQuote, 'BUY')}
                      className="btn-buy"
                      style={{ flex: 1, padding: '11px 0', fontSize: '0.88rem', fontWeight: 800, borderRadius: '8px' }}
                    >
                      BUY (B)
                    </button>
                    <button
                      onClick={() => handleOpenOrderModal(currentQuote, 'SELL')}
                      className="btn-sell"
                      style={{ flex: 1, padding: '11px 0', fontSize: '0.88rem', fontWeight: 800, borderRadius: '8px' }}
                    >
                      SELL (S)
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {/* TAB: DEDICATED OPTION CHAIN */}
          {activeTab === 'option-chain' && (
            <OptionChain
              indices={indices}
              onSelectOptionTrade={handleSelectOptionTrade}
              onBackToTerminal={() => setActiveTab('terminal')}
            />
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
            <OrdersTab orders={portfolio?.orders} onRefreshPortfolio={fetchPortfolio} />
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
              onResetPortfolio={handleStartFreshAccount}
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

      {/* Bottom Navigation for Mobile and All Vertical/Portrait Screens */}
      {isVertical && (
        <MobileNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenWatchlist={() => setShowMobileWatchlist(true)}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
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
        onClose={handleCloseSearch}
        initialQuery={searchInitialQuery}
        onSelectStock={(sym) => {
          handleSelectStock(sym);
          if (activeTab !== 'terminal') setActiveTab('terminal');
        }}
        onAddToWatchlist={(sym) => {
          const defaultWlId = portfolio?.watchlists?.[0]?.id || 'default';
          handleAddToWatchlist(defaultWlId, sym);
        }}
        watchlistSymbols={portfolio?.watchlists?.[0]?.symbols || []}
      />

      {/* Initial Starting Funds Setup Modal */}
      <InitialFundsModal
        isOpen={showInitialFundsModal}
        onClose={() => setShowInitialFundsModal(false)}
        onSetCapital={handleResetPortfolio}
        onSetInitialFunds={handleResetPortfolio}
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
    </div>
  );
}
