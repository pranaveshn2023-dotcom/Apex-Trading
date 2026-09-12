import React, { useState } from 'react';
import { 
  User, 
  Wallet, 
  Plus, 
  RotateCcw, 
  Lock, 
  KeyRound, 
  LogOut, 
  CheckCircle2, 
  Database, 
  RefreshCw, 
  Sliders, 
  Info, 
  Lightbulb,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { formatINR } from '../utils/formatters';
import confetti from 'canvas-confetti';
import ApexLogo from './ApexLogo';

export default function ProfileTab({
  currentUser,
  portfolio,
  onUpdateFunds,
  onResetPortfolio,
  onLogout,
  onLockScreen,
  beginnerMode,
  setBeginnerMode,
  onOpenTips
}) {
  // Funds state
  const [customAmount, setCustomAmount] = useState('');
  const [fundsLoading, setFundsLoading] = useState(false);
  const [fundsSuccess, setFundsSuccess] = useState(null);

  // Security PIN state
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [pinError, setPinError] = useState('');

  // Cache state
  const [cacheCleared, setCacheCleared] = useState(false);

  const cashBalance = portfolio?.cashBalance || 0;
  const totalInvested = portfolio?.totalInvested || 0;
  const totalValue = portfolio?.totalPortfolioValue || 0;
  const currentPin = localStorage.getItem('ax_terminal_pin') || '1234';

  const quickAdds = [
    { label: '+ ₹50,000', amount: 50000 },
    { label: '+ ₹1 Lakh', amount: 100000 },
    { label: '+ ₹5 Lakhs', amount: 500000 },
    { label: '+ ₹10 Lakhs', amount: 1000000 },
    { label: '+ ₹25 Lakhs', amount: 2500000 },
  ];

  const handleAddQuick = async (amountToAdd) => {
    setFundsLoading(true);
    try {
      const newTotal = cashBalance + amountToAdd;
      await onUpdateFunds(newTotal);
      confetti({ particleCount: 30, spread: 50 });
      setFundsSuccess(`Added ${formatINR(amountToAdd)} virtual trading capital!`);
      setTimeout(() => setFundsSuccess(null), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setFundsLoading(false);
    }
  };

  const handleSetExact = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(customAmount.replace(/,/g, ''));
    if (!parsed || parsed <= 0) return;
    setFundsLoading(true);
    try {
      await onUpdateFunds(parsed);
      confetti({ particleCount: 40, spread: 60 });
      setFundsSuccess(`Trading cash balance set to ${formatINR(parsed)}!`);
      setCustomAmount('');
      setTimeout(() => setFundsSuccess(null), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setFundsLoading(false);
    }
  };

  const handleClearCache = () => {
    const auth = localStorage.getItem('ax_current_user');
    const token = localStorage.getItem('ax_auth_token');
    const pin = localStorage.getItem('ax_terminal_pin');
    const pwa = localStorage.getItem('apex_pwa_installed');

    localStorage.clear();

    // Preserve authentication and pin
    if (auth) localStorage.setItem('ax_current_user', auth);
    if (token) localStorage.setItem('ax_auth_token', token);
    if (pin) localStorage.setItem('ax_terminal_pin', pin);
    if (pwa) localStorage.setItem('apex_pwa_installed', pwa);

    setCacheCleared(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleSavePin = (e) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be exactly 4 numeric digits (0-9).');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match.');
      return;
    }
    localStorage.setItem('ax_terminal_pin', newPin);
    setPinSuccess('Security PIN updated successfully!');
    setPinError('');
    setTimeout(() => {
      setShowPinModal(false);
      setNewPin('');
      setConfirmPin('');
      setPinSuccess('');
    }, 1200);
  };

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '24px 20px 80px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      
      {/* 1. Profile Header Card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 20px -2px rgba(16, 185, 129, 0.05), 0 2px 8px -2px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2.5px solid #059669',
            boxShadow: '0 0 16px rgba(5, 150, 105, 0.25)',
            flexShrink: 0
          }}>
            <img src={currentUser?.picture} alt={currentUser?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                {currentUser?.name || 'Apex Trader'}
              </h1>
              <span style={{
                fontSize: '0.68rem',
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 700
              }}>
                Verified Trader
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '4px 0 0 0' }}>
              {currentUser?.email || 'trader@apex.internal'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          style={{
            background: '#fff1f2',
            color: '#be123c',
            border: '1px solid #fecdd3',
            padding: '9px 18px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ffe4e6';
            e.currentTarget.style.borderColor = '#fda4af';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff1f2';
            e.currentTarget.style.borderColor = '#fecdd3';
          }}
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* 2. Virtual Funds & Margin Hub (Moved into Profile) */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 4px 20px -2px rgba(16, 185, 129, 0.05), 0 2px 8px -2px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#ecfdf5', padding: '6px', borderRadius: '8px', color: '#059669' }}>
              <Wallet size={20} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Virtual Funds & Margin (₹ INR)
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              const entered = window.prompt('Reset entire paper portfolio? Enter starting capital in ₹ (e.g. 100000 or 0):', '100000');
              if (entered !== null) {
                const cap = Math.max(0, parseFloat(entered) || 0);
                onResetPortfolio(cap);
              }
            }}
            style={{
              background: '#ffffff',
              border: '1px solid #fecdd3',
              color: '#be123c',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={13} />
            <span>Reset Account / Set Capital</span>
          </button>
        </div>

        {fundsSuccess && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '10px 14px', borderRadius: '8px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {fundsSuccess}
          </div>
        )}

        {/* 3 Metrics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '14px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', fontWeight: 600 }}>
              Available Cash Margin
            </div>
            <div className="font-mono" style={{ fontSize: 'clamp(1.35rem, 4vw, 1.85rem)', fontWeight: 800, color: '#059669' }}>
              {formatINR(cashBalance)}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
              Free margin ready for CNC / MIS trades
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', fontWeight: 600 }}>
              Used Margin (Holdings & Trades)
            </div>
            <div className="font-mono" style={{ fontSize: 'clamp(1.35rem, 4vw, 1.85rem)', fontWeight: 800, color: '#0f172a' }}>
              {formatINR(totalInvested)}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
              Capital allocated to active stocks
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', fontWeight: 600 }}>
              Total Account Net Worth
            </div>
            <div className="font-mono" style={{ fontSize: 'clamp(1.35rem, 4vw, 1.85rem)', fontWeight: 800, color: '#0284c7' }}>
              {formatINR(totalValue)}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
              Cash + Current Holdings Value
            </div>
          </div>
        </div>

        {/* Deposit Virtual Cash */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #a7f3d0',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} color="#059669" /> Instant Virtual Cash Deposit
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>
              Add paper funds to test aggressive strategies and high-margin sizing. Zero real money involved.
            </p>
          </div>

          {/* Quick Add Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {quickAdds.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleAddQuick(item.amount)}
                disabled={fundsLoading}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#059669';
                  e.currentTarget.style.color = '#059669';
                  e.currentTarget.style.background = '#f0fdf4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.color = '#0f172a';
                  e.currentTarget.style.background = '#ffffff';
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Custom Amount Form */}
          <form onSubmit={handleSetExact} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="number"
              placeholder="Or enter custom cash amount in ₹"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              style={{
                flex: 1,
                minWidth: 'min(220px, 100%)',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                padding: '9px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={fundsLoading || !customAmount}
              style={{
                background: 'linear-gradient(135deg, #059669, #10b981)',
                border: 'none',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
              }}
            >
              Set Exact Balance
            </button>
          </form>
        </div>
      </div>

      {/* 3. Security & Screen Lock */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 4px 20px -2px rgba(16, 185, 129, 0.05), 0 2px 8px -2px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={20} color="#059669" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Screen Lock & Privacy Protection
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Quickly lock your terminal screen when stepping away to protect positions and balance.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onLockScreen}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Lock size={13} />
              <span>Lock Screen (Ctrl+L)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPinModal(true)}
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <KeyRound size={13} />
              <span>Change PIN</span>
            </button>
          </div>
        </div>

        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '0.82rem'
        }}>
          <span style={{ color: '#475569' }}>
            Status: <b style={{ color: '#059669' }}>Active with 4-digit PIN ({currentPin.replace(/./g, '•')})</b>
          </span>
          <span style={{ color: '#64748b' }}>
            Quick Shortcut: <kbd style={{ background: '#e2e8f0', color: '#0f172a', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Ctrl+L</kbd>
          </span>
        </div>
      </div>

      {/* 4. Preferences & Trading Guide */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 4px 20px -2px rgba(16, 185, 129, 0.05), 0 2px 8px -2px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#f5f3ff', padding: '6px', borderRadius: '8px', color: '#7c3aed' }}>
            <Sliders size={18} />
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Trading Guides & Preferences
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Beginner Assistance Mode</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Shows helpful order type explainers, stop-loss guidance, and 1% risk badges.</div>
          </div>
          <input
            type="checkbox"
            checked={beginnerMode}
            onChange={(e) => setBeginnerMode(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: '#059669', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Interactive Trading Tips & Rulebook</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Open institutional risk management and trading rulebook.</div>
          </div>
          <button
            type="button"
            onClick={onOpenTips}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              padding: '6px 14px',
              borderRadius: '7px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Open Guide
          </button>
        </div>
      </div>

      {/* 5. Storage & Clear Cache */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 20px -2px rgba(16, 185, 129, 0.05), 0 2px 8px -2px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={20} color="#d97706" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Cache & Local State
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
              Purges local quotes cache and resets offline buffers while keeping your authentication intact.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearCache}
          disabled={cacheCleared}
          style={{
            background: cacheCleared ? '#059669' : '#fffbeb',
            color: cacheCleared ? '#ffffff' : '#b45309',
            border: cacheCleared ? 'none' : '1px solid #fde68a',
            padding: '9px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={14} />
          <span>{cacheCleared ? 'Cache Cleared! Reloading...' : 'Clear Cache & Reload'}</span>
        </button>
      </div>

      {/* 6. About Apex Trading & Institutional Brokerage Architecture */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxShadow: '0 4px 20px -2px rgba(16, 185, 129, 0.05), 0 2px 8px -2px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header with Emblem */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <ApexLogo size={48} withGlow={true} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  Apex Trading Platform
                </h2>
                <span style={{
                  fontSize: '0.68rem',
                  background: '#f0f9ff',
                  color: '#0284c7',
                  border: '1px solid #bae6fd',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  v2.4.0 Production
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '3px 0 0 0' }}>
                Next-generation simulated market terminal & algorithm training environment.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '0.72rem',
              color: '#059669',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '4px 10px',
              borderRadius: '8px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />
              Live Gateway Active
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
          Apex Trading provides retail and institutional traders with high-fidelity paper trading across Indian and global equity markets. Experience real exchange liquidity, live multi-timeframe candlestick charting, and precision risk management with 100% simulated capital.
        </p>

        {/* Official Brokerage & Fee Rate Card */}
        <div>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Equity & Derivatives Brokerage Schedule
          </h3>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1.2fr 1.2fr 1fr',
              padding: '10px 16px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}>
              <div>Segment</div>
              <div>Brokerage Fee</div>
              <div>Statutory & STT</div>
              <div>Exchange & GST</div>
            </div>

            {[
              {
                segment: 'Equity Delivery (CNC)',
                badge: 'Zero Risk Paper',
                brokerage: '₹20 or 0.05% max',
                subBrokerage: 'Whichever is lower',
                stt: '0.1% on Buy & Sell',
                taxes: '0.00297% NSE + 18% GST'
              },
              {
                segment: 'Equity Intraday (MIS)',
                badge: 'Margin Leverage',
                brokerage: '₹20 or 0.05% max',
                subBrokerage: 'Whichever is lower',
                stt: '0.025% on Sell Side',
                taxes: '0.00297% NSE + 18% GST'
              },
              {
                segment: 'Depository (DP) Charges',
                badge: 'Sell Side Only',
                brokerage: '₹13.50 + 18% GST',
                subBrokerage: 'Flat ₹15.93 per company',
                stt: 'Not Applicable',
                taxes: 'Standard CDSL/NSDL'
              }
            ].map((row, idx) => (
              <div
                key={row.segment}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1.2fr 1.2fr 1fr',
                  padding: '12px 16px',
                  borderBottom: idx < 2 ? '1px solid #f1f5f9' : 'none',
                  fontSize: '0.8rem',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.segment}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{row.badge}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#059669' }}>{row.brokerage}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{row.subBrokerage}</div>
                </div>
                <div>
                  <div style={{ color: '#334155' }}>{row.stt}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>{row.taxes}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Feature Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>⚡ Sub-Second Liquidity</div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Real-time quotes with bid/ask book replication.</div>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>🛡️ 1% Capital Risk Rule</div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Integrated risk-reward & sizing calculations.</div>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>🔒 4-Digit Screen Lock</div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Instant terminal security with biometric shortcuts.</div>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>📊 Interactive Charting</div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>High-resolution candlestick & volume indicators.</div>
          </div>
        </div>

        {/* Regulatory Disclaimer Banner */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px 16px',
          fontSize: '0.75rem',
          color: '#64748b',
          lineHeight: 1.5
        }}>
          <strong style={{ color: '#0f172a' }}>Regulatory & Simulation Notice: </strong>
          Apex Trading is an institutional-grade educational simulation and algorithmic testing terminal. All balances, orders, ledger debits, and profit/loss figures are purely virtual for risk-free strategy evaluation. Live market quotes are streamed via public market gateways for real-world execution practice without capital risk.
        </div>
      </div>

      {/* Change PIN Modal */}
      {showPinModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '20px'
        }}>
          <div style={{
            width: '360px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '28px 24px',
            textAlign: 'center',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
              Change Security PIN
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 20px 0' }}>
              Set a new 4-digit numeric PIN for your screen lock.
            </p>

            {pinError && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', padding: '8px', borderRadius: '8px', fontSize: '0.76rem', marginBottom: '14px' }}>
                {pinError}
              </div>
            )}

            {pinSuccess && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '8px', borderRadius: '8px', fontSize: '0.76rem', marginBottom: '14px' }}>
                {pinSuccess}
              </div>
            )}

            <form onSubmit={handleSavePin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter New 4-Digit PIN"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  padding: '12px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  fontSize: '1rem',
                  letterSpacing: '4px',
                  outline: 'none'
                }}
              />

              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Confirm 4-Digit PIN"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  padding: '12px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  fontSize: '1rem',
                  letterSpacing: '4px',
                  outline: 'none'
                }}
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  style={{
                    flex: 1,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
