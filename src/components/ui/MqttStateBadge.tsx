import type { MqttConnectionState } from '../../mqtt/client';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

interface MqttStateBadgeProps {
  state: MqttConnectionState;
  detail?: string;
  onReconnect?: () => void;
  onRetryNow?: () => void;
}

export function MqttStateBadge({ state, detail, onReconnect, onRetryNow }: MqttStateBadgeProps) {
  const getBadgeConfig = () => {
    switch (state) {
      case 'CONNECTED':
        return {
          icon: <Wifi size={13} color="var(--state-online)" />,
          text: 'MQTT ● CONNECTED',
          textColor: 'var(--state-online)',
          borderColor: 'rgba(16, 185, 129, 0.4)',
          glowClass: 'glow-active',
          indicatorColor: 'var(--state-online)',
        };
      case 'CONNECTING':
        return {
          icon: <RefreshCw size={13} color="var(--state-connecting)" className="pulse-indicator" />,
          text: 'MQTT ● CONNECTING...',
          textColor: 'var(--state-connecting)',
          borderColor: 'rgba(87, 144, 230, 0.4)',
          glowClass: '',
          indicatorColor: 'var(--state-connecting)',
        };
      case 'RECONNECTING':
        return {
          icon: <RefreshCw size={13} color="var(--state-stale)" className="pulse-indicator" />,
          text: 'MQTT ● RECONNECTING',
          textColor: 'var(--state-stale)',
          borderColor: 'rgba(234, 179, 8, 0.4)',
          glowClass: '',
          indicatorColor: 'var(--state-stale)',
        };
      case 'ERROR':
        return {
          icon: <AlertCircle size={13} color="var(--state-offline)" />,
          text: 'MQTT ● ERROR',
          textColor: 'var(--state-offline)',
          borderColor: 'rgba(244, 63, 94, 0.4)',
          glowClass: '',
          indicatorColor: 'var(--state-offline)',
        };
      case 'DISCONNECTED':
      default:
        return {
          icon: <WifiOff size={13} color="var(--text-muted)" />,
          text: 'MQTT ● DISCONNECTED',
          textColor: 'var(--text-muted)',
          borderColor: 'var(--border-technical)',
          glowClass: '',
          indicatorColor: 'var(--text-muted)',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <div
        className={`glass-panel ${config.glowClass}`}
        role="status"
        aria-live="polite"
        style={{
          padding: '6px 14px',
          borderRadius: 'var(--radius-pill)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          borderColor: config.borderColor,
          fontSize: '0.78rem',
          background: 'rgba(15, 47, 99, 0.75)',
        }}
      >
        {config.icon}
        <span
          className="mono-text"
          style={{
            color: config.textColor,
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          {config.text}
        </span>
        {detail && (
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
              paddingLeft: '8px',
            }}
          >
            {detail}
          </span>
        )}
      </div>

      {(state === 'RECONNECTING' || state === 'ERROR') && onRetryNow && (
        <button
          type="button"
          onClick={onRetryNow}
          aria-label="Retry MQTT connection immediately bypassing backoff delay"
          className="pill-btn pill-btn-primary"
          style={{
            padding: '6px 14px',
            fontSize: '0.75rem',
          }}
        >
          Retry Now
        </button>
      )}

      {state === 'DISCONNECTED' && onReconnect && (
        <button
          type="button"
          onClick={onReconnect}
          aria-label="Connect to MQTT Broker"
          className="pill-btn pill-btn-outline"
          style={{
            padding: '6px 14px',
            fontSize: '0.75rem',
          }}
        >
          Connect
        </button>
      )}
    </div>
  );
}
