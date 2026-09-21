import { Wind, AlertCircle } from 'lucide-react';

interface GasCardProps {
  raw: number | null;
  adcMv: number | null;
  sensorMv: number | null;
  isStale?: boolean;
}

export function GasCard({ raw, adcMv, sensorMv, isStale }: GasCardProps) {
  return (
    <div
      className="glass-panel glow-gas"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '2px solid var(--brand)',
        opacity: isStale ? 0.75 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="eyebrow">
          <span className="eyebrow-dot" style={{ background: 'var(--brand)', boxShadow: '0 0 8px var(--brand)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Air Quality / Gas</span>
        </div>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(37, 99, 201, 0.15)',
            border: '1px solid rgba(37, 99, 201, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-light)',
          }}
        >
          <Wind size={16} />
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
            {raw !== null ? raw : '----'}
          </span>
          <span
            className="mono-text"
            style={{
              fontSize: '0.85rem',
              color: 'var(--brand-light)',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Raw ADC (12-bit)
          </span>
        </div>
      </div>

      {/* Voltage Readouts (PRD Section 9) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          padding: '12px 14px',
          background: 'rgba(7, 21, 43, 0.60)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          marginBottom: '12px',
        }}
      >
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            ADC Voltage
          </span>
          <span className="mono-text" style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>
            {adcMv !== null ? `${adcMv.toFixed(1)} mV` : '-- mV'}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Sensor Voltage
          </span>
          <span className="mono-text" style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>
            {sensorMv !== null ? `${sensorMv.toFixed(1)} mV` : '-- mV'}
          </span>
        </div>
      </div>

      {/* Mandatory Calibration Notice (PRD Section 9) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          paddingTop: '10px',
        }}
      >
        <AlertCircle size={13} color="var(--brand-light)" />
        <span>MQ135 Raw Telemetry (No unverified PPM/AQI)</span>
      </div>
    </div>
  );
}
