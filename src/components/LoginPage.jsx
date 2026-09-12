import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, BarChart3, Smartphone } from 'lucide-react';
import { getIndianMarketStatus, getUSMarketStatus } from '../utils/marketHours';

export default function LoginPage({ onLoginSuccess, onInstallApp, isAppInstalled = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '869967589999-4t07kdod7foj6i934queg7juguh9ofhj.apps.googleusercontent.com';

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

  // Initialize official Google Identity Services
  useEffect(() => {
    const renderGoogleBtn = () => {
      if (window.google?.accounts?.id && googleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          const container = document.getElementById('googleSignInButton');
          if (container) {
            container.innerHTML = '';
            window.google.accounts.id.renderButton(container, {
              theme: 'outline',
              size: 'large',
              width: 360,
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            });
          }

          // Optional: Display One Tap prompt if supported
          window.google.accounts.id.prompt();
        } catch (err) {
          console.warn('Google GSI init notice:', err);
        }
      }
    };

    if (!window.google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleBtn;
      document.body.appendChild(script);
    } else {
      renderGoogleBtn();
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
      setError(err.message || 'Failed to authenticate with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#060a12',
      color: '#f8fafc',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Background Ambient Glows */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '500px',
        background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.12) 0%, rgba(56, 189, 248, 0.05) 50%, transparent 80%)',
        filter: 'blur(70px)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Top Navbar */}
      <header style={{
        height: '64px',
        borderBottom: '1px solid #172131',
        background: 'rgba(9, 14, 24, 0.8)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1.5px solid rgba(16, 185, 129, 0.6)',
            boxShadow: '0 0 14px rgba(16, 185, 129, 0.3)'
          }}>
            <img src="/logo.png" alt="Apex Trading" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#fff', letterSpacing: '-0.03em' }}>
            APEX<span style={{ color: '#10b981', fontSize: '0.88rem', fontWeight: 800, marginLeft: '3px' }}>TRADING</span>
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
                borderRadius: '5px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
              title="Install Apex Trading PWA"
            >
              <Smartphone size={12} color="#818cf8" />
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
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: marketStatus.indian.isOpen ? '#10b981' : '#94a3b8' }} />
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
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: marketStatus.us.isOpen ? '#10b981' : '#94a3b8' }} />
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
          background: 'linear-gradient(180deg, #0e1626 0%, #070c16 100%)',
          border: '1px solid rgba(56, 189, 248, 0.18)',
          borderRadius: '24px',
          padding: '44px 32px',
          boxShadow: '0 30px 100px rgba(0, 0, 0, 0.85), 0 0 60px rgba(16, 185, 129, 0.12)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>

          {/* Subtle Top Card Glow */}
          <div style={{
            position: 'absolute',
            top: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            height: '100px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)',
            filter: 'blur(25px)',
            pointerEvents: 'none'
          }} />

          {/* Logo */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            margin: '0 auto 20px auto',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
            border: '1px solid rgba(16, 185, 129, 0.6)',
            background: '#050912',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src="/logo.png" alt="Apex Trading" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.03em' }}>
            Sign in to Apex Trading
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: '0 0 28px 0', lineHeight: 1.5 }}>
            Practice real-time equities & derivatives trading with live market feeds.
          </p>

          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#fda4af',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          {/* Official Google Sign-In Button Container */}
          <div style={{ display: 'flex', justifyContent: 'center', minHeight: '44px', width: '100%' }}>
            <div id="googleSignInButton" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              {/* Fallback button while Google SDK initializes */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={loading}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  color: '#1f2937',
                  border: 'none',
                  padding: '12px 22px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  fontFamily: "'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, sans-serif",
                  cursor: loading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{loading ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            </div>
          </div>

          {/* Value Pillars List */}
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#cbd5e1' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={13} color="#10b981" />
              </div>
              <span><strong>Zero-Risk Paper Trading:</strong> Practice with virtual capital and realistic execution</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#cbd5e1' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={13} color="#38bdf8" />
              </div>
              <span><strong>Real Market Feeds:</strong> Live NSE, BSE & US exchange price quotes</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#cbd5e1' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={13} color="#a855f7" />
              </div>
              <span><strong>Execution Simulator:</strong> Limit, Market & SL orders with real slippage & charges</span>
            </div>
          </div>

          <div style={{ marginTop: '24px', fontSize: '0.72rem', color: '#475569' }}>
            Protected by Cloudflare & Google Identity • Strict Security Standards
          </div>
        </div>
      </main>
    </div>
  );
}
