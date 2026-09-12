import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Zap, BarChart3, Smartphone } from 'lucide-react';
import { getIndianMarketStatus, getUSMarketStatus } from '../utils/marketHours';
import ApexLogo from './ApexLogo';

export default function LoginPage({ onLoginSuccess, onInstallApp, isAppInstalled = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '869967589999-4t07kdod7foj6i934queg7juguh9ofhj.apps.googleusercontent.com';
  const tokenClientRef = useRef(null);

  const [marketStatus, setMarketStatus] = useState(() => ({
    indian: getIndianMarketStatus(),
    us: getUSMarketStatus()
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setMarketStatus({
        indian: getIndianMarketStatus(),
        us: getUSMarketStatus()
      });
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Initialize official Google Authentication clients
  useEffect(() => {
    const initClients = () => {
      if (!window.google?.accounts || !googleClientId) return;

      try {
        // 1. Initialize Google Identity Services (ID Token flow)
        if (window.google.accounts.id) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });
        }

        // 2. Initialize OAuth2 Token Client (for custom bold button)
        if (window.google.accounts.oauth2) {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: 'email profile openid',
            callback: async (tokenResponse) => {
              if (tokenResponse.error) {
                setError('Authentication failed. Please try again.');
                setLoading(false);
                return;
              }
              if (tokenResponse.access_token) {
                await handleGoogleAccessToken(tokenResponse.access_token);
              }
            },
            error_callback: (err) => {
              console.warn('Google sign-in dialog closed or error:', err);
              setLoading(false);
            }
          });
        }
      } catch (err) {
        console.warn('Google auth client init notice:', err);
      }
    };

    if (!window.google?.accounts) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initClients;
      document.body.appendChild(script);
    } else {
      initClients();
    }
  }, [googleClientId]);

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      const data = await res.json();
      if (data.success && data.data?.user) {
        onLoginSuccess(data.data.user);
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAccessToken = async (accessToken) => {
    console.log('[LoginPage] Forwarding access token to /api/auth/google...');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken })
      });
      const data = await res.json();
      console.log('[LoginPage] Response from /api/auth/google:', data);
      if (data.success && data.data?.user) {
        console.log('[LoginPage] Invoking onLoginSuccess with:', data.data.user.email);
        onLoginSuccess(data.data.user);
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error('[LoginPage] Authentication error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setLoading(true);
    setError(null);
    try {
      if (!tokenClientRef.current && window.google?.accounts?.oauth2) {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            console.log('[LoginPage] Google OAuth tokenResponse:', tokenResponse);
            if (tokenResponse.error) {
              console.error('[LoginPage] tokenResponse error:', tokenResponse.error);
              setError('Authentication failed. Please try again.');
              setLoading(false);
              return;
            }
            if (tokenResponse.access_token) {
              await handleGoogleAccessToken(tokenResponse.access_token);
            }
          },
          error_callback: (err) => {
            console.warn('[LoginPage] Google sign-in closed or error:', err);
            setLoading(false);
          }
        });
      }

      if (tokenClientRef.current) {
        console.log('[LoginPage] Triggering requestAccessToken...');
        tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
      } else {
        setError('Authentication service is initializing. Please wait a moment and try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('[LoginPage] Sign-in initiation error:', err);
      setError('Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f8fafc',
      color: '#0f172a',
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Top Navbar */}
      <header style={{
        height: '64px',
        borderBottom: '1px solid #e2e8f0',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ApexLogo size={36} withGlow={false} />
          <span style={{ fontWeight: 900, fontSize: '1.18rem', color: '#0f172a', letterSpacing: '-0.03em' }}>
            APEX<span style={{ color: '#059669', fontSize: '0.9rem', fontWeight: 800, marginLeft: '3px' }}>TRADING</span>
          </span>
        </div>

        {/* Live Market Hours Status & PWA Install */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isAppInstalled && onInstallApp && (
            <button
              onClick={onInstallApp}
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '4px 9px',
                borderRadius: '6px',
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
              title="Install Apex Trading PWA"
            >
              <Smartphone size={12} color="#059669" />
              <span>Install App</span>
            </button>
          )}

          {/* NSE Status */}
          <span
            title={marketStatus.indian.tooltip}
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '5px',
              background: marketStatus.indian.bg,
              color: marketStatus.indian.color,
              border: `1px solid ${marketStatus.indian.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: marketStatus.indian.isOpen ? '#059669' : '#94a3b8' }} />
            NSE {marketStatus.indian.label}
          </span>

          {/* US Status */}
          <span
            title={marketStatus.us.tooltip}
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '5px',
              background: marketStatus.us.bg,
              color: marketStatus.us.color,
              border: `1px solid ${marketStatus.us.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: marketStatus.us.isOpen ? '#059669' : '#94a3b8' }} />
            US {marketStatus.us.isOpen ? 'LIVE' : 'CLOSED'}
          </span>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          width: '440px',
          maxWidth: '100%',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '24px',
          padding: '44px 32px',
          boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.12), 0 10px 25px rgba(0, 0, 0, 0.05)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>

          {/* Eye-catching Big AX Brand Logo */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '22px',
            position: 'relative'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <ApexLogo size={110} withGlow={true} />
            </div>
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.03em' }}>
            Sign in to Apex Trading
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 28px 0', lineHeight: 1.5 }}>
            Practice real-time equities & derivatives trading with live market feeds.
          </p>

          {error && (
            <div style={{
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#e11d48',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          {/* Bold, Eye-Catching Google Sign-In Button */}
          <div style={{ width: '100%', position: 'relative' }}>
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              style={{
                width: '100%',
                height: '52px',
                background: '#ffffff',
                color: '#0f172a',
                border: '1.5px solid #cbd5e1',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '1.04rem',
                fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                letterSpacing: '-0.01em',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.06)';
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span style={{ fontWeight: 800, fontSize: '1.04rem', letterSpacing: '-0.01em' }}>
                {loading ? 'Authenticating...' : 'Sign in with Google'}
              </span>
            </button>

            {/* Hidden/Fallback Google GSI Button mount */}
            <div id="googleSignInFallbackContainer" style={{ display: 'none' }} />
          </div>

          {/* Value Pillars List */}
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#334155' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={13} color="#059669" />
              </div>
              <span><strong>Zero-Risk Paper Trading:</strong> Practice with virtual capital and realistic execution</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#334155' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={13} color="#0284c7" />
              </div>
              <span><strong>Real Market Feeds:</strong> Live NSE, BSE & US exchange price quotes</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#334155' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={13} color="#7c3aed" />
              </div>
              <span><strong>Execution Simulator:</strong> Limit, Market & SL orders with real slippage & charges</span>
            </div>
          </div>

          <div style={{ marginTop: '24px', fontSize: '0.72rem', color: '#64748b' }}>
            Powered by ValarchiX
          </div>
        </div>
      </main>
    </div>
  );
}
