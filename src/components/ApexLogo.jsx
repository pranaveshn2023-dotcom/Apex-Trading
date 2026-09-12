import React from 'react';

export default function ApexLogo({ size = 48, withGlow = true, style = {}, className = '' }) {
  const borderRadius = Math.round(size * 0.22);

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
        userSelect: 'none',
        filter: withGlow 
          ? 'drop-shadow(0 0 25px rgba(16, 185, 129, 0.45)) drop-shadow(0 0 50px rgba(6, 182, 212, 0.3))' 
          : 'none',
        ...style
      }}
    >
      <img
        src="/logo.png?v=axclean"
        alt="Apex Trading AX Logo"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          borderRadius: `${borderRadius}px`,
          display: 'block'
        }}
      />
    </div>
  );
}
