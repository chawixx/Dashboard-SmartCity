import React from 'react';

interface TechnicalFrameProps {
  children: React.ReactNode;
  tag?: string;
  className?: string;
  style?: React.CSSProperties;
  borderColor?: string;
}

export function TechnicalFrame({
  children,
  tag,
  className = '',
  style,
  borderColor,
}: TechnicalFrameProps) {
  return (
    <div
      className={`glass-panel ${className}`}
      style={{
        borderRadius: 'var(--radius-card)',
        position: 'relative',
        ...style,
        ...(borderColor ? { borderColor } : {}),
      }}
    >
      {tag && (
        <div
          style={{
            position: 'absolute',
            top: '-11px',
            right: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.68rem',
            fontWeight: 600,
            background: 'var(--brand-deep)',
            color: 'var(--brand-light)',
            padding: '2px 10px',
            border: '1px solid rgba(87, 144, 230, 0.4)',
            borderRadius: 'var(--radius-pill)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            zIndex: 2,
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: 'var(--brand-light)',
              display: 'inline-block',
            }}
          />
          <span>{tag}</span>
        </div>
      )}
      {children}
    </div>
  );
}
