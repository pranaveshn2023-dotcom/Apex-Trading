import React from 'react';
import {
  CandlestickChart,
  ListOrdered,
  Briefcase,
  Menu,
  List
} from 'lucide-react';

export default function MobileNav({ activeTab, setActiveTab, onOpenWatchlist, onOpenMenu }) {
  const tabs = [
    { 
      id: 'watchlist-btn', 
      label: 'Watchlist', 
      icon: List, 
      action: onOpenWatchlist 
    },
    { 
      id: 'terminal', 
      label: 'Trade', 
      icon: CandlestickChart, 
      action: () => setActiveTab('terminal') 
    },
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: ListOrdered, 
      action: () => setActiveTab('orders') 
    },
    { 
      id: 'holdings', 
      label: 'Portfolio', 
      icon: Briefcase, 
      action: () => setActiveTab('holdings') 
    },
    { 
      id: 'menu-btn', 
      label: 'Menu', 
      icon: Menu, 
      action: onOpenMenu || (() => setActiveTab('profile')) 
    },
  ];

  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: '#ffffff',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid #e2e8f0',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        userSelect: 'none',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)'
      }}
    >
      {tabs.map(({ id, label, icon: Icon, action }) => {
        const isMenuTab = id === 'menu-btn';
        const isMenuSection = ['profile', 'dashboard', 'funds', 'settings', 'journal', 'learn'].includes(activeTab);
        const isActive = activeTab === id || 
          (id === 'holdings' && ['holdings', 'positions'].includes(activeTab)) ||
          (isMenuTab && isMenuSection);

        return (
          <button
            key={id}
            onClick={action}
            style={{
              background: 'transparent',
              border: 'none',
              borderTop: isActive ? '2px solid #059669' : '2px solid transparent',
              color: isActive ? '#059669' : '#64748b',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '8px 0 6px 0',
              cursor: 'pointer',
              minHeight: '54px',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon size={20} />
            <span style={{ 
              fontSize: '0.68rem', 
              fontWeight: isActive ? 800 : 500,
              letterSpacing: '-0.01em',
              color: isActive ? '#059669' : '#64748b'
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}