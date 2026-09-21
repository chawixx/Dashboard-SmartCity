import { Cpu, Wifi, Clock, Activity, AlertTriangle } from 'lucide-react';
import { type DeviceStatus } from '../../telemetry/types';
import { type RssiQuality } from '../../telemetry/formatters';

interface DeviceHealthCardProps {
  deviceId: string;
  status: DeviceStatus;
  isStale: boolean;
  rssi: number | null;
  rssiQuality: RssiQuality | null;
  uptime: string;
  sequence: number | null;
  lastReceivedAt: number | null;
}

export function DeviceHealthCard({
  deviceId,
  status,
  isStale,
  rssi,
  rssiQuality,
  uptime,
  sequence,
  lastReceivedAt,
}: DeviceHealthCardProps) {
  const getStatusDisplay = () => {
    if (isStale) {
      return {
        label: 'STALE TELEMETRY',
        color: 'var(--state-stale)',
        borderColor: 'rgba(234, 179, 8, 0.4)',
        glow: 'glow-stale',
      };
    }
    if (status === 'online') {
      return {
        label: 'ONLINE',
        color: 'var(--state-online)',
        borderColor: 'rgba(16, 185, 129, 0.4)',
        glow: 'glow-active',
      };
    }
    if (status === 'offline') {
      return {
        label: 'OFFLINE',
        color: 'var(--state-offline)',
        borderColor: 'rgba(244, 63, 94, 0.4)',
        glow: '',
      };
    }
    return {
      label: 'WAITING DATA',
      color: 'var(--text-muted)',
      borderColor: 'var(--border-technical)',
      glow: '',
    };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        borderLeft: `4px solid ${statusDisplay.color}`,
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="eyebrow">
          <span className="eyebrow-dot" style={{ background: 'var(--brand-light)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Hardware Node Health</span>
        </div>

        {/* Pill Status Badge */}
        <div
          style={{
            padding: '5px 14px',
            borderRadius: 'var(--radius-pill)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderColor: statusDisplay.borderColor,
            background: 'rgba(15, 47, 99, 0.85)',
            border: `1px solid ${statusDisplay.borderColor}`,
          }}
        >
          {isStale ? (
            <AlertTriangle size={13} color="var(--state-stale)" />
          ) : (
            <span
              className={status === 'online' ? 'pulse-indicator' : ''}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: statusDisplay.color,
              }}
            />
          )}
          <span
            className="mono-text"
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: statusDisplay.color,
              letterSpacing: '0.04em',
            }}
          >
            {statusDisplay.label}
          </span>
        </div>
      </div>

      {/* Grid of Metric Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Node Identifier */}
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(7, 21, 43, 0.60)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Node ID
            </span>
            <Cpu size={12} color="var(--brand-light)" />
          </div>
          <span
            className="mono-text"
            style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: 600, wordBreak: 'break-all' }}
          >
            {deviceId}
          </span>
        </div>

        {/* Wi-Fi RSSI */}
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(7, 21, 43, 0.60)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Wi-Fi RSSI
            </span>
            <Wifi size={12} color={rssiQuality ? rssiQuality.color : 'var(--text-dim)'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span className="mono-text" style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 600 }}>
              {rssi !== null ? `${rssi} dBm` : '-- dBm'}
            </span>
            {rssiQuality && (
              <span style={{ fontSize: '0.7rem', color: rssiQuality.color, fontWeight: 500 }}>
                ({rssiQuality.label})
              </span>
            )}
          </div>
        </div>

        {/* Device Uptime */}
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(7, 21, 43, 0.60)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Uptime
            </span>
            <Clock size={12} color="var(--brand-light)" />
          </div>
          <p className="mono-text" style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 600 }}>
            {uptime}
          </p>
        </div>

        {/* Sequence Counter */}
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(7, 21, 43, 0.60)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Sequence
            </span>
            <Activity size={12} color="var(--brand-light)" />
          </div>
          <p className="mono-text" style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 600 }}>
            {sequence !== null ? `#${sequence}` : '---'}
          </p>
        </div>
      </div>

      {/* Footer Timestamp */}
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
        <span>Hardware: ESP32-S3 (Xtensa Dual-Core LX7)</span>
        <span className="mono-text" style={{ color: 'var(--text-secondary)' }}>
          {lastReceivedAt
            ? `Updated ${new Date(lastReceivedAt).toLocaleTimeString()}`
            : 'Awaiting first packet'}
        </span>
      </div>
    </div>
  );
}
