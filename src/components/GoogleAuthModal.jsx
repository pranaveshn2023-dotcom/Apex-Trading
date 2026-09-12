import React, { useState, useEffect } from 'react';
import { X, LogOut, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

export default function GoogleAuthModal({ isOpen, onClose, currentUser, onLoginSuccess, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '869967589999-4t07kdod7foj6i934queg7juguh9ofhj.apps.googleusercontent.com';

  useEffect(() => {
    if (!isOpen || currentUser) return;

    // Load Google Identity Services script
    if (!window.google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleClient();
      };
      document.body.appendChild(script);
    } else {
      initGoogleClient();
    }
  }, [isOpen, currentUser, googleClientId]);

  const initGoogleClient = () => {
    if (!window.google?.accounts?.id || !googleClientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      const container = document.getElementById('googleModalSignInButton');
      if (container) {
        container.innerHTML = '';
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        });
      }
    } catch (err) {
      console.warn('Google client init notice:', err);
    }
  };

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
        onClose();
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(8px)', background: 'rgba(4, 7, 13, 0.75)' }}>
      <div 
        style={{
          width: '420px',
          maxWidth: '92vw',
          background: 'linear-gradient(180deg, #0e1524 0%, #070b13 100%)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '20px',
          padding: '32px 28px',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.85), 0 0 50px rgba(16, 185, 129, 0.12)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow Effect */}
        <div 
          style={{
            position: 'absolute',
            top: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '240px',
            height: '100px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(56, 189, 248, 0.15) 50%, transparent 80%)',
            filter: 'blur(20px)',
            pointerEvents: 'none'
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          <X size={16} />
        </button>

        {currentUser ? (
          /* Profile & Logout View */
          <div style={{ textAlign: 'center', paddingTop: '10px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              margin: '0 auto 16px auto',
              overflow: 'hidden',
              border: '2px solid #10b981',
              boxShadow: '0 0 24px rgba(16, 185, 129, 0.4)'
            }}>
              <img src={currentUser.picture} alt={currentUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
              {currentUser.name}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 24px 0' }}>
              {currentUser.email}
            </p>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              style={{
                width: '100%',
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#f43f5e',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.12)';
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          /* High-End Sign In with Google Card */
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            
            {/* Logo with Soft Glow */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              margin: '0 auto 16px auto',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(16, 185, 129, 0.45)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              background: '#0a101d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img src="/logo.png" alt="Apex Trading" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            {/* Headers */}
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', margin: '0 0 6px 0', letterSpacing: '-0.025em' }}>
              Sign in to Apex Trading
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 24px 0', lineHeight: 1.4 }}>
              Continue with your Google account to access your terminal and portfolio
            </p>

            {/* Error message */}
            {error && (
              <div style={{ 
                background: 'rgba(244, 63, 94, 0.12)', 
                border: '1px solid rgba(244, 63, 94, 0.35)', 
                color: '#fda4af', 
                padding: '10px 14px', 
                borderRadius: '10px', 
                fontSize: '0.8rem', 
                marginBottom: '18px' 
              }}>
                {error}
              </div>
            )}

            {/* High-End, Premium Google Button */}
            <div id="googleModalSignInButton" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={loading}
              style={{
                width: '100%',
                background: '#ffffff',
                color: '#1f2937',
                border: 'none',
                padding: '13px 20px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.96rem',
                fontFamily: "'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, sans-serif",
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0,0,0,0.2)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 255, 255, 0.15), 0 4px 12px rgba(0,0,0,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0,0,0,0.2)';
                }
              }}
            >
              {/* Authentic Google Multi-Color G Icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>

              <span style={{ letterSpacing: '-0.01em' }}>
                {loading ? 'Connecting to Google...' : 'Sign in with Google'}
              </span>
            </button>
          </div>

            {/* Subtle App Highlights */}
            <div style={{ 
              marginTop: '24px', 
              paddingTop: '18px', 
              borderTop: '1px solid rgba(255, 255, 255, 0.07)', 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '16px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#64748b' }}>
                <TrendingUp size={13} color="#10b981" />
                <span>Live Markets</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#64748b' }}>
                <Zap size={13} color="#38bdf8" />
                <span>Instant Access</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#64748b' }}>
                <ShieldCheck size={13} color="#a855f7" />
                <span>Secure Session</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
