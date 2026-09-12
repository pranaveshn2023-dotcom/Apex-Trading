import React, { useState, useEffect, useRef } from 'react';
import { X, LogOut, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import ApexLogo from './ApexLogo';

export default function GoogleAuthModal({ isOpen, onClose, currentUser, onLoginSuccess, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '869967589999-4t07kdod7foj6i934queg7juguh9ofhj.apps.googleusercontent.com';
  const tokenClientRef = useRef(null);

  useEffect(() => {
    if (!isOpen || currentUser) return;

    const initGoogleClients = () => {
      if (!window.google?.accounts || !googleClientId) return;

      try {
        if (window.google.accounts.id) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });
        }

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
        console.warn('Google client init notice:', err);
      }
    };

    if (!window.google?.accounts) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogleClients;
      document.body.appendChild(script);
    } else {
      initGoogleClients();
    }
  }, [isOpen, currentUser, googleClientId]);

  // Handle Google One-Tap or Sign-In ID Token
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setError('No credential received from Google.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
      });
      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Authentication rejected by terminal server.');
      }
    } catch (err) {
      setError(err.message || 'Network error verifying authentication.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth2 Access Token by fetching user profile from Google UserInfo endpoint
  const handleGoogleAccessToken = async (accessToken) => {
    setLoading(true);
    setError(null);
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!userInfoRes.ok) {
        throw new Error('Failed to fetch user info from Google.');
      }
      const profile = await userInfoRes.json();
      
      const res = await fetch('/api/auth/google-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: profile.sub,
          email: profile.email,
          name: profile.name,
          picture: profile.picture
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Failed to authenticate session with server.');
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate with Google OAuth.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Google Login
  const handleGoogleClick = () => {
    setError(null);
    setLoading(true);

    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.warn('Google One-Tap dismissed, retrying token flow...');
          if (tokenClientRef.current) {
            tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
          } else {
            setLoading(false);
          }
        }
      });
      return;
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleClientId)}&response_type=token&scope=${encodeURIComponent('email profile openid')}&redirect_uri=${encodeURIComponent(window.location.origin)}`;
    window.location.href = authUrl;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(8px)', background: 'rgba(15, 23, 42, 0.32)' }}>
      <div 
        style={{
          width: '420px',
          maxWidth: '92vw',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '32px 28px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#0f172a';
            e.currentTarget.style.background = '#f1f5f9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.background = '#f8fafc';
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
              border: '2.5px solid #059669',
              boxShadow: '0 0 20px rgba(5, 150, 105, 0.25)'
            }}>
              <img src={currentUser.picture} alt={currentUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              {currentUser.name}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 24px 0' }}>
              {currentUser.email}
            </p>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              style={{
                width: '100%',
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#be123c',
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
                e.currentTarget.style.background = '#ffe4e6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff1f2';
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          /* High-End Sign In with Google Card */
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            
            {/* Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <ApexLogo size={64} withGlow={true} />
            </div>

            {/* Headers */}
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.025em' }}>
              Sign in to Apex Trading
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 24px 0', lineHeight: 1.4 }}>
              Sign in to access your real-time terminal and portfolio
            </p>

            {/* Error message */}
            {error && (
              <div style={{ 
                background: '#fff1f2', 
                border: '1px solid #fecdd3', 
                color: '#be123c', 
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
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  padding: '13px 20px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.96rem',
                  fontFamily: "'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, sans-serif",
                  cursor: loading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#059669';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.06)';
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

                <span style={{ letterSpacing: '-0.01em', fontWeight: 700 }}>
                  {loading ? 'Authenticating...' : 'Sign in with Google'}
                </span>
              </button>
            </div>

            {/* Security Footnote */}
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.74rem', color: '#64748b' }}>
              <ShieldCheck size={14} color="#059669" />
              <span>Direct official identity verification. No passwords stored.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
