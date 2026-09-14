import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, Delete, LogOut, CheckCircle2, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';
import ApexLogo from './ApexLogo';

export default function ScreenLockModal({ isOpen, onUnlock, currentUser, onLogout, indices = null }) {
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState('locked'); // 'locked' | 'verifying' | 'unlocked' | 'error' | 'signing_out'
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  // Check if user has already configured a custom PIN
  const storedPin = localStorage.getItem('ax_terminal_pin');
  const [isSetupMode, setIsSetupMode] = useState(!storedPin);
  const [setupStep, setSetupStep] = useState(1); // 1 = choose PIN, 2 = confirm PIN
  const [firstPin, setFirstPin] = useState('');

  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Trader';

  // Reset states whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setStatus('locked');
      setErrorMessage('');
      setShake(false);
      setWrongAttempts(0);
      const hasPin = Boolean(localStorage.getItem('ax_terminal_pin'));
      setIsSetupMode(!hasPin);
      setSetupStep(1);
      setFirstPin('');
    }
  }, [isOpen]);

  const executeSignOut = useCallback(() => {
    setStatus('signing_out');
    sessionStorage.removeItem('ax_screen_locked');
    localStorage.removeItem('ax_screen_locked');
    localStorage.removeItem('ax_terminal_pin'); // Reset PIN so user can re-setup
    setTimeout(() => {
      onUnlock();
      if (onLogout) {
        onLogout();
      }
    }, 400);
  }, [onUnlock, onLogout]);

  const triggerUnlockSequence = useCallback((successText = 'Session Unlocked') => {
    setStatus('verifying');
    setWrongAttempts(0);
    setTimeout(() => {
      setStatus('unlocked');
      setTimeout(() => {
        onUnlock();
      }, 400);
    }, 500);
  }, [onUnlock]);

  const handleSetupPin = useCallback((enteredPin) => {
    if (setupStep === 1) {
      setFirstPin(enteredPin);
      setPin('');
      setSetupStep(2);
      setErrorMessage('');
    } else if (setupStep === 2) {
      if (enteredPin === firstPin) {
        localStorage.setItem('ax_terminal_pin', enteredPin);
        setIsSetupMode(false);
        triggerUnlockSequence('PIN Set Successfully!');
      } else {
        setShake(true);
        setStatus('error');
        setErrorMessage('PINs did not match. Please try again.');
        setTimeout(() => {
          setShake(false);
          setPin('');
          setFirstPin('');
          setSetupStep(1);
          setStatus('locked');
        }, 850);
      }
    }
  }, [setupStep, firstPin, triggerUnlockSequence]);

  const verifyPin = useCallback((enteredPin) => {
    const activePin = localStorage.getItem('ax_terminal_pin');

    // Only accept the user's configured PIN — no backdoors
    if (activePin && enteredPin === activePin) {
      triggerUnlockSequence();
    } else {
      const nextAttempts = wrongAttempts + 1;
      setWrongAttempts(nextAttempts);
      setShake(true);
      setStatus('error');

      if (nextAttempts >= 3) {
        setErrorMessage('Too many incorrect attempts. Resetting PIN & signing out...');
        setTimeout(() => {
          executeSignOut();
        }, 1100);
      } else {
        const remaining = 3 - nextAttempts;
        setErrorMessage(`Incorrect PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before reset.`);
        setTimeout(() => {
          setShake(false);
          setPin('');
          setStatus('locked');
        }, 850);
      }
    }
  }, [wrongAttempts, triggerUnlockSequence, executeSignOut]);

  const handleKeyPress = useCallback((digit) => {
    if (status === 'verifying' || status === 'unlocked' || status === 'signing_out') return;

    setActiveKey(digit);
    setTimeout(() => setActiveKey(null), 150);

    setPin((prev) => {
      if (prev.length >= 4) return prev;
      const next = prev + digit;
      if (next.length === 4) {
        if (isSetupMode) {
          setTimeout(() => handleSetupPin(next), 120);
        } else {
          setTimeout(() => verifyPin(next), 120);
        }
      }
      return next;
    });
  }, [status, isSetupMode, handleSetupPin, verifyPin]);

  const handleDelete = useCallback(() => {
    if (status === 'verifying' || status === 'unlocked' || status === 'signing_out') return;
    setActiveKey('del');
    setTimeout(() => setActiveKey(null), 150);
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  }, [status]);

  // Physical keyboard support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length === 4) {
          if (isSetupMode) {
            handleSetupPin(pin);
          } else {
            verifyPin(pin);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyPress, handleDelete, pin, isSetupMode, handleSetupPin, verifyPin]);

  if (!isOpen) return null;

  // Transition screen: "Securing / Unlocking / Signing Out"
  if (status === 'verifying' || status === 'unlocked' || status === 'signing_out') {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <div style={{
          width: '74px',
          height: '74px',
          borderRadius: '22px',
          background: status === 'signing_out' 
            ? 'radial-gradient(circle, rgba(225, 29, 72, 0.15) 0%, rgba(225, 29, 72, 0.04) 100%)'
            : 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.04) 100%)',
          border: status === 'signing_out'
            ? '1.5px solid rgba(225, 29, 72, 0.4)'
            : '1.5px solid rgba(16, 185, 129, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: status === 'signing_out'
            ? '0 10px 30px rgba(225, 29, 72, 0.2)'
            : '0 10px 30px rgba(16, 185, 129, 0.25)',
          marginBottom: '24px',
          animation: 'pulse 1.2s infinite ease-in-out'
        }}>
          {status === 'signing_out' ? (
            <LogOut size={36} color="#e11d48" />
          ) : status === 'unlocked' ? (
            <CheckCircle2 size={38} color="#059669" />
          ) : (
            <Unlock size={36} color="#059669" />
          )}
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          {status === 'signing_out' ? 'Signing Out...' : isSetupMode ? 'PIN Configured!' : 'Session Unlocked'}
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
          {status === 'signing_out' ? 'Resetting security lock and clearing session' : 'Synchronizing active charts, feeds & order history'}
        </p>
      </div>
    );
  }

  const nifty = indices?.find(i => i.symbol === '^NSEI');

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      background: 'rgba(248, 250, 252, 0.98)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
      animation: 'fadeIn 0.2s ease-out',
      userSelect: 'none',
      overflowY: 'auto'
    }}>
      
      {/* Subtle Background Glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        width: '460px',
        height: '320px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      {/* Main Lock Card */}
      <div style={{
        width: '380px',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
        margin: 'auto 0'
      }}>

        {/* Apex Glowing Brand Emblem */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <ApexLogo size={60} withGlow={true} />
        </div>

        {/* Header Title (Setup vs Unlock) */}
        {isSetupMode ? (
          <>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '12px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#047857',
              fontSize: '0.72rem',
              fontWeight: 700,
              marginBottom: '10px'
            }}>
              <KeyRound size={12} />
              <span>{setupStep === 1 ? 'FIRST-TIME SETUP' : 'STEP 2 OF 2'}</span>
            </div>
            <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
              {setupStep === 1 ? 'Create Your 4-Digit PIN' : 'Confirm Your 4-Digit PIN'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 28px 0', fontWeight: 500 }}>
              {setupStep === 1 ? 'Choose a 4-digit security PIN for Apex Trading' : 'Re-enter your 4 digits to confirm and unlock'}
            </p>
          </>
        ) : (
          <>
            <h2 style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 6px 0',
              letterSpacing: '-0.03em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>Welcome Back, {firstName}</span>
              <span style={{ fontSize: '1.4rem' }}>👋</span>
            </h2>

            <p style={{
              fontSize: '0.86rem',
              color: '#64748b',
              margin: '0 0 28px 0',
              fontWeight: 500
            }}>
              Enter your 4-digit PIN to unlock Apex Trading
            </p>
          </>
        )}

        {/* 4 PIN Dots Matrix */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '18px',
          marginBottom: '28px',
          animation: shake ? 'shake 0.4s ease-in-out' : 'none'
        }}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            const isError = status === 'error';
            return (
              <div
                key={index}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: isFilled ? 'scale(1.25)' : 'scale(1)',
                  background: isError 
                    ? '#e11d48' 
                    : isFilled 
                      ? '#059669' 
                      : '#ffffff',
                  border: isError
                    ? '2px solid #e11d48'
                    : isFilled
                      ? '2px solid #059669'
                      : '2px solid #cbd5e1',
                  boxShadow: isFilled
                    ? '0 0 14px rgba(16, 185, 129, 0.5)'
                    : isError
                      ? '0 0 14px rgba(225, 29, 72, 0.5)'
                      : 'none'
                }}
              />
            );
          })}
        </div>

        {/* Error Feedback Message */}
        {errorMessage && (
          <div style={{
            color: '#e11d48',
            fontSize: '0.78rem',
            fontWeight: 600,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertCircle size={14} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Futuristic 3x4 Touch Keypad (No Biometrics) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px',
          width: '280px',
          marginBottom: '22px'
        }}>
          {[
            '1', '2', '3',
            '4', '5', '6',
            '7', '8', '9',
            'lock_icon', '0', 'del'
          ].map((keyItem) => {
            const isPressed = activeKey === keyItem;

            if (keyItem === 'lock_icon') {
              return (
                <div
                  key="lock_icon"
                  style={{
                    height: '62px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8'
                  }}
                >
                  <Lock size={18} />
                </div>
              );
            }

            if (keyItem === 'del') {
              return (
                <button
                  key="del"
                  type="button"
                  onClick={handleDelete}
                  title="Backspace"
                  style={{
                    height: '62px',
                    borderRadius: '16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    transform: isPressed ? 'scale(0.93)' : 'scale(1)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#0f172a';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.background = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                >
                  <Delete size={20} />
                </button>
              );
            }

            return (
              <button
                key={keyItem}
                type="button"
                onClick={() => handleKeyPress(keyItem)}
                style={{
                  height: '62px',
                  borderRadius: '16px',
                  background: isPressed ? '#ecfdf5' : '#ffffff',
                  border: isPressed ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                  color: '#0f172a',
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.12s cubic-bezier(0.2, 0.8, 0.4, 1)',
                  transform: isPressed ? 'scale(0.94)' : 'scale(1)',
                  boxShadow: isPressed ? '0 0 15px rgba(16, 185, 129, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.03)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0fdf4';
                  e.currentTarget.style.borderColor = '#a7f3d0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                {keyItem}
              </button>
            );
          })}
        </div>

        {/* Notice text */}
        <p style={{
          fontSize: '0.78rem',
          color: '#64748b',
          margin: '0 0 16px 0',
          fontWeight: 500
        }}>
          {isSetupMode 
            ? 'Set a 4-digit PIN you will easily remember' 
            : 'Forgot PIN? Enter incorrectly 3 times to reset'}
        </p>

        {/* Bottom Actions: Ticker / Setup toggle & Sign Out */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '280px',
          paddingTop: '12px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <button
            type="button"
            onClick={() => {
              setIsSetupMode(true);
              setSetupStep(1);
              setPin('');
              setErrorMessage('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#059669',
              cursor: 'pointer',
              padding: 0,
              fontSize: '0.74rem',
              fontWeight: 600,
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#047857'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#059669'}
          >
            {isSetupMode ? 'Cancel' : 'Set / Change PIN'}
          </button>

          {/* Working Sign Out Button */}
          <button
            type="button"
            onClick={executeSignOut}
            title="Sign out of trading account"
            style={{
              background: 'none',
              border: 'none',
              color: '#f43f5e',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0,
              fontWeight: 600,
              fontSize: '0.78rem',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fda4af'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#f43f5e'}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>

      </div>

      {/* Global CSS for animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
      `}</style>

    </div>
  );
}
