import { Thermometer } from 'lucide-react';

interface TemperatureCardProps {
  value: number | null;
  isStale?: boolean;
}

export function TemperatureCard({ value, isStale }: TemperatureCardProps) {
  return (
    <div
      className="glass-panel glow-temp"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '2px solid var(--signal-temp)',
        opacity: isStale ? 0.75 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="eyebrow">
          <span className="eyebrow-dot" style={{ background: 'var(--signal-temp)', boxShadow: '0 0 8px var(--signal-temp)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Temperature</span>
        </div>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(249, 115, 22, 0.15)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--signal-temp)',
          }}
        >
          <Thermometer size={16} />
        </div>
      </div>

      {/* Main Metric Value */}
      <div style={{ marginTop: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span
            className="mono-text"
            style={{
              fontSize: '2.8rem',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1,
              letterSpacing: '-0.03em',
            }}
          >
            {value !== null ? value.toFixed(2) : '--.--'}
          </span>
          <span
            className="mono-text"
            style={{
              fontSize: '1.25rem',
              color: 'var(--signal-temp)',
              fontWeight: 600,
            }}
          >
            °C
          </span>
        </div>
      </div>

      {/* Footer Details */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.74rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          paddingTop: '12px',
        }}
      >
        <span>DHT22 Digital Probe</span>
        <span className="mono-text" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
          {value !== null ? `${(value * 1.8 + 32).toFixed(1)} °F` : '-- °F'}
        </span>
      </div>
    </div>
  );
}
