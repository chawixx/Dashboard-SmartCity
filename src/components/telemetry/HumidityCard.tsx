import { Droplets } from 'lucide-react';

interface HumidityCardProps {
  value: number | null;
  isStale?: boolean;
}

export function HumidityCard({ value, isStale }: HumidityCardProps) {
  return (
    <div
      className="glass-panel glow-humid"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '2px solid var(--signal-humid)',
        opacity: isStale ? 0.75 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="eyebrow">
          <span className="eyebrow-dot" style={{ background: 'var(--signal-humid)', boxShadow: '0 0 8px var(--signal-humid)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Humidity</span>
        </div>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(87, 144, 230, 0.15)',
            border: '1px solid rgba(87, 144, 230, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--signal-humid)',
          }}
        >
          <Droplets size={16} />
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
              color: 'var(--signal-humid)',
              fontWeight: 600,
            }}
          >
            % RH
          </span>
        </div>
      </div>

      {/* Footer Details with Pill Assessment */}
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
        <span>DHT22 Moisture Gauge</span>
        <span
          style={{
            padding: '2px 10px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(87, 144, 230, 0.12)',
            border: '1px solid rgba(87, 144, 230, 0.25)',
            color: '#ffffff',
            fontWeight: 500,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {value !== null ? (value > 70 ? 'High Moisture' : value < 40 ? 'Dry' : 'Optimal Zone') : '--'}
        </span>
      </div>
    </div>
  );
}
