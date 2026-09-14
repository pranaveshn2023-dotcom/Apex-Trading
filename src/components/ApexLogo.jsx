import React from 'react';

/**
 * ApexLogo – Renders the 3D glossy AX trading logo from /logo.png.
 * 
 * Props:
 *  - size (number): Width & height in px. Default 48.
 *  - withGlow (bool): Adds an emerald glow drop-shadow. Default true.
 *  - style (object): Extra inline styles merged onto the wrapper.
 *  - className (string): Extra CSS class(es).
 */
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
          ? 'drop-shadow(0 4px 14px rgba(5, 150, 105, 0.35)) drop-shadow(0 2px 6px rgba(16, 185, 129, 0.2))'
          : 'none',
        ...style
      }}
    >
      <img
        src="/logo.png"
        alt="Apex Trading"
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: `${borderRadius}px`,
          objectFit: 'cover',
          display: 'block',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
