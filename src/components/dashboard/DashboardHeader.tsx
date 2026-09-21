import { Cpu, Power, AlertTriangle } from 'lucide-react';
import { MqttStateBadge } from '../ui/MqttStateBadge';
import { type MqttConnectionState } from '../../mqtt/client';

interface DashboardHeaderProps {
  deviceId: string;
  selectedDeviceId?: string;
  discoveredDevices?: string[];
  onSelectDevice?: (id: string) => void;
  connectionState: MqttConnectionState;
  stateDetail?: string;
  isStale: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onRetryNow?: () => void;
}

export function DashboardHeader({
  deviceId,
  selectedDeviceId = 'auto',
  discoveredDevices = [],
  onSelectDevice,
  connectionState,
  stateDetail,
  isStale,
  onConnect,
  onDisconnect,
  onRetryNow,
}: DashboardHeaderProps) {
  return (
    <header
      style={{
        margin: '12px 16px 0 16px',
        borderRadius: 'var(--radius-card)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        background: 'rgba(15, 47, 99, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 16px 40px -10px rgba(7, 21, 43, 0.60)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      {/* Brand Identity with Editorial Mark (from CHANGE_THEME.md) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-pill)',
            background: 'linear-gradient(135deg, rgba(37, 99, 201, 0.4), rgba(87, 144, 230, 0.2))',
            border: '1px solid rgba(87, 144, 230, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-light)',
            boxShadow: '0 0 16px rgba(87, 144, 230, 0.25)',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M4.8 5.6A9 9 0 0 0 4.8 18.4" />
            <path d="M19.2 5.6a9 9 0 0 1 0 12.8" />
          </svg>
        </div>
        <div>
          <div className="eyebrow" style={{ color: 'var(--brand-light)', fontSize: '0.68rem', marginBottom: '2px' }}>
            <span className="eyebrow-dot" />
            <span>Telemetry System</span>
          </div>
          <h1
            style={{
              fontSize: '1.35rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#ffffff',
            }}
          >
            AETHER<span style={{ color: 'var(--brand-light)' }}>SENSE</span>
          </h1>
        </div>
      </div>

      {/* Status Indicators & Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Node Chip ID / Selector (Pill Badge) */}
        <div
          style={{
            padding: '5px 14px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Cpu size={14} color="var(--brand-light)" />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Node:</span>
          {onSelectDevice ? (
            <select
              value={selectedDeviceId}
              onChange={(e) => onSelectDevice(e.target.value)}
              aria-label="Target ESP32-S3 Device ID"
              className="mono-text"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.78rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="auto" style={{ background: 'var(--brand-deep)', color: '#ffffff' }}>
                ⚡ Auto-Detect {deviceId && deviceId !== 'auto' && deviceId !== 'Waiting for ESP32...' ? `(${deviceId})` : '(Any ESP32)'}
              </option>
              {discoveredDevices
                .filter((id) => id !== 'auto')
                .map((id) => (
                  <option key={id} value={id} style={{ background: 'var(--brand-deep)', color: '#ffffff' }}>
                    📡 {id}
                  </option>
                ))}
              {selectedDeviceId !== 'auto' && !discoveredDevices.includes(selectedDeviceId) && (
                <option value={selectedDeviceId} style={{ background: 'var(--brand-deep)', color: '#ffffff' }}>📌 {selectedDeviceId}</option>
              )}
            </select>
          ) : (
            <span className="mono-text" style={{ color: 'var(--text-highlight)', fontWeight: 600 }}>
              {deviceId}
            </span>
          )}
        </div>

        {/* Stale Telemetry Warning Badge */}
        {isStale && connectionState === 'CONNECTED' && (
          <div
            role="alert"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(234, 179, 8, 0.5)',
              background: 'rgba(234, 179, 8, 0.15)',
              boxShadow: '0 0 14px rgba(234, 179, 8, 0.25)',
            }}
          >
            <AlertTriangle size={13} color="var(--state-stale)" />
            <span
              className="mono-text"
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--state-stale)',
                letterSpacing: '0.04em',
              }}
            >
              STALE (&gt;15s)
            </span>
          </div>
        )}

        {/* Connection State Badge */}
        <MqttStateBadge
          state={connectionState}
          detail={stateDetail}
          onReconnect={onConnect}
          onRetryNow={onRetryNow}
        />

        {/* Connect / Disconnect Toggle Button (Pill Button) */}
        <button
          type="button"
          onClick={connectionState === 'CONNECTED' ? onDisconnect : onConnect}
          className="pill-btn"
          aria-label={connectionState === 'CONNECTED' ? 'Disconnect from MQTT Broker' : 'Connect to MQTT Broker'}
          title={connectionState === 'CONNECTED' ? 'Disconnect MQTT' : 'Connect MQTT'}
          style={{
            padding: '6px 16px',
            fontSize: '0.75rem',
            color: connectionState === 'CONNECTED' ? '#f43f5e' : '#10b981',
            background: connectionState === 'CONNECTED' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${connectionState === 'CONNECTED' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Power size={13} />
          <span>{connectionState === 'CONNECTED' ? 'Disconnect' : 'Connect'}</span>
        </button>
      </div>
    </header>
  );
}
