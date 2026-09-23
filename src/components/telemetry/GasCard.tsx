import { Wind, AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { type AirQualityStatus } from '../../telemetry/types';
import { getAirQualityGrade } from '../../telemetry/formatters';

interface GasCardProps {
  raw: number | null;
  adcMv: number | null;
  sensorMv: number | null;
  airQualityStatus?: AirQualityStatus;
  isGasPolluted?: boolean;
  isStale?: boolean;
}

export function GasCard({ raw, adcMv, sensorMv, airQualityStatus, isStale }: GasCardProps) {
  const grade = getAirQualityGrade(raw, airQualityStatus);

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
        borderTop: `2px solid ${grade.color}`,
        opacity: isStale ? 0.75 : 1,
        transition: 'opacity 0.3s ease, border-color 0.4s ease',
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="eyebrow">
          <span className="eyebrow-dot" style={{ background: grade.color, boxShadow: `0 0 8px ${grade.color}` }} />
          <span style={{ color: 'var(--text-secondary)' }}>Kualitas Udara &amp; Gas (MQ135)</span>
        </div>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-pill)',
            background: grade.bgColor,
            border: `1px solid ${grade.borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: grade.color,
          }}
        >
          <Wind size={16} />
        </div>
      </div>

      {/* Human-Readable Air Quality Indicator (User Request) */}
      <div
        style={{
          marginTop: '16px',
          marginBottom: '16px',
          padding: '12px 14px',
          borderRadius: 'var(--radius-xl)',
          background: grade.bgColor,
          border: `1px solid ${grade.borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {grade.isPolluted ? (
              <AlertTriangle size={18} color={grade.color} />
            ) : (
              <ShieldCheck size={18} color={grade.color} />
            )}
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: grade.color,
                letterSpacing: '-0.01em',
              }}
            >
              {grade.label}
            </span>
          </div>
          <span
            className="mono-text"
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(0, 0, 0, 0.25)',
              color: grade.color,
              border: `1px solid ${grade.borderColor}`,
            }}
          >
            {grade.badgeText}
          </span>
        </div>
        <p
          style={{
            fontSize: '0.78rem',
            color: 'rgba(255, 255, 255, 0.85)',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {grade.description}
        </p>
      </div>

      {/* Main Raw Metric Value & Breakdown */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span
            className="mono-text"
            style={{
              fontSize: '2.4rem',
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

      {/* Voltage Readouts */}
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

      {/* Calibration & Interpretation Notice */}
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
        <AlertCircle size={13} color={grade.color} />
        <span>Indikator gas alam/asap empiris (Udara Bersih vs Tercemar Gas)</span>
      </div>
    </div>
  );
}
