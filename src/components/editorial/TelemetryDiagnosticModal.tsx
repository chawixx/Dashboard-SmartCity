import { useEffect } from 'react';
import { X, Send, FastForward, Power, ShieldAlert, Copy, Clock, CheckCircle2, Cpu, RotateCcw } from 'lucide-react';
import { type MqttConnectionState } from '../../mqtt/client';
import { type DeviceStatus } from '../../telemetry/types';

interface TelemetryDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionState: MqttConnectionState;
  selectedDeviceId: string;
  discoveredDevices: string[];
  onSelectDevice: (id: string) => void;
  activeDeviceId: string;
  packetCount: number;
  errorCount: number;
  duplicateCount: number;
  delayedCount: number;
  isStale: boolean;
  bufferLength: number;
  lastError: string | null;
  lastMessage: { topic: string; payload: string; receivedAt: number } | null;
  onSendSample: () => void;
  onSendBurst: () => void;
  onToggleStatus: () => void;
  deviceStatus: DeviceStatus;
  onSendCorrupt: () => void;
  onSendDuplicate: () => void;
  onSendDelayed: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onRetryNow: () => void;
}

export function TelemetryDiagnosticModal({
  isOpen,
  onClose,
  connectionState,
  selectedDeviceId,
  discoveredDevices,
  onSelectDevice,
  activeDeviceId,
  packetCount,
  errorCount,
  duplicateCount,
  delayedCount,
  isStale,
  bufferLength,
  lastError,
  lastMessage,
  onSendSample,
  onSendBurst,
  onToggleStatus,
  deviceStatus,
  onSendCorrupt,
  onSendDuplicate,
  onSendDelayed,
  onConnect,
  onDisconnect,
  onRetryNow,
}: TelemetryDiagnosticModalProps) {
  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(0.5rem, 2.5vw, 1.5rem)',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(4, 12, 23, 0.75)',
          backdropFilter: 'blur(12px)',
        }}
      />

      {/* Modal Panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '52rem',
          maxHeight: '92svh',
          overflowY: 'auto',
          backgroundColor: 'var(--brand-deep)',
          color: '#ffffff',
          borderRadius: 'var(--radius-card)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.8)',
          padding: 'clamp(1.2rem, 3.5vw, 2.5rem)',
          zIndex: 10,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <div className="eyebrow eyebrow-light">
              <span className="eyebrow-dot" />
              <span>Inspeksi Node &amp; Payload</span>
            </div>
            <h2
              style={{
                fontSize: 'clamp(1.35rem, 4.5vw, 2rem)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '-0.01em',
                lineHeight: 1.05,
                margin: '8px 0 0',
              }}
            >
              Data Mentah
              <br />
              Stasiun Telemetri
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Modal"
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(90deg)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'rotate(0deg)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Node Device Selector Bar */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-xl)',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={16} color="var(--brand-light)" />
            <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Target Node:
            </span>
            <select
              value={selectedDeviceId}
              onChange={(e) => onSelectDevice(e.target.value)}
              aria-label="Target ESP32-S3 Node"
              className="mono-text"
              style={{
                background: 'var(--brand-deep)',
                border: '1px solid var(--brand-light)',
                color: '#ffffff',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 12px',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="auto">
                ⚡ Auto-Detect ({activeDeviceId})
              </option>
              {discoveredDevices.map((id) => (
                <option key={id} value={id}>
                  📡 {id}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>Status MQTT:</span>
            <span
              className="mono-text"
              style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                background: connectionState === 'CONNECTED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                color: connectionState === 'CONNECTED' ? 'var(--state-online)' : 'var(--state-offline)',
                fontSize: '0.74rem',
                fontWeight: 600,
              }}
            >
              {connectionState}
            </span>
            <button
              type="button"
              onClick={connectionState === 'CONNECTED' ? onDisconnect : onConnect}
              className="pill-btn"
              style={{
                padding: '4px 12px',
                fontSize: '0.72rem',
                color: connectionState === 'CONNECTED' ? '#f43f5e' : '#10b981',
                border: `1px solid ${connectionState === 'CONNECTED' ? '#f43f5e' : '#10b981'}`,
                background: 'transparent',
              }}
            >
              <Power size={12} />
              <span>{connectionState === 'CONNECTED' ? 'Putuskan' : 'Hubungkan'}</span>
            </button>
            {(connectionState === 'ERROR' || connectionState === 'DISCONNECTED') && (
              <button
                type="button"
                onClick={onRetryNow}
                className="pill-btn"
                style={{
                  padding: '4px 12px',
                  fontSize: '0.72rem',
                  color: 'var(--brand-light)',
                  border: '1px solid var(--brand-light)',
                  background: 'transparent',
                }}
              >
                <RotateCcw size={12} />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Triggers Grid */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand-light)', marginBottom: '0.8rem' }}>
            Simulasi Paket &amp; Uji Resiliensi
          </h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onSendSample}
              disabled={connectionState !== 'CONNECTED'}
              className="pill-btn pill-btn-outline"
              style={{ fontSize: '0.75rem', padding: '6px 14px', color: 'var(--state-online)', borderColor: 'rgba(16, 185, 129, 0.4)' }}
            >
              <Send size={12} />
              <span>Publish 1 Sampel</span>
            </button>

            <button
              type="button"
              onClick={onSendBurst}
              disabled={connectionState !== 'CONNECTED'}
              className="pill-btn pill-btn-primary"
              style={{ fontSize: '0.75rem', padding: '6px 14px' }}
            >
              <FastForward size={12} />
              <span>Stream 10 Sampel</span>
            </button>

            <button
              type="button"
              onClick={onToggleStatus}
              disabled={connectionState !== 'CONNECTED'}
              className="pill-btn pill-btn-outline"
              style={{ fontSize: '0.75rem', padding: '6px 14px' }}
            >
              Toggle Status: {deviceStatus.toUpperCase()}
            </button>

            <button
              type="button"
              onClick={onSendCorrupt}
              disabled={connectionState !== 'CONNECTED'}
              className="pill-btn pill-btn-outline"
              style={{ fontSize: '0.75rem', padding: '6px 14px', color: 'var(--state-stale)', borderColor: 'rgba(234, 179, 8, 0.4)' }}
            >
              <ShieldAlert size={12} />
              <span>Uji Corrupt JSON</span>
            </button>

            <button
              type="button"
              onClick={onSendDuplicate}
              disabled={connectionState !== 'CONNECTED'}
              className="pill-btn pill-btn-outline"
              style={{ fontSize: '0.75rem', padding: '6px 14px' }}
            >
              <Copy size={12} />
              <span>Uji Duplikasi Sequence</span>
            </button>

            <button
              type="button"
              onClick={onSendDelayed}
              disabled={connectionState !== 'CONNECTED'}
              className="pill-btn pill-btn-outline"
              style={{ fontSize: '0.75rem', padding: '6px 14px', color: 'var(--state-stale)', borderColor: 'rgba(234, 179, 8, 0.4)' }}
            >
              <Clock size={12} />
              <span>Uji Paket Delayed (&gt;60s)</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Metrics Tiles */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
            marginBottom: '2rem',
          }}
        >
          <div style={{ padding: '12px', background: 'rgba(4, 12, 23, 0.6)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>Buffer Ring</span>
            <p className="mono-text" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-light)', margin: '2px 0 0' }}>
              {bufferLength} / 300
            </p>
          </div>

          <div style={{ padding: '12px', background: 'rgba(4, 12, 23, 0.6)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>Total Ingest</span>
            <p className="mono-text" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--state-online)', margin: '2px 0 0' }}>
              {packetCount}
            </p>
          </div>

          <div style={{ padding: '12px', background: 'rgba(4, 12, 23, 0.6)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>Corrupt Drop</span>
            <p className="mono-text" style={{ fontSize: '1.1rem', fontWeight: 700, color: errorCount > 0 ? 'var(--state-offline)' : 'rgba(255, 255, 255, 0.6)', margin: '2px 0 0' }}>
              {errorCount}
            </p>
          </div>

          <div style={{ padding: '12px', background: 'rgba(4, 12, 23, 0.6)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>Duplikat</span>
            <p className="mono-text" style={{ fontSize: '1.1rem', fontWeight: 700, color: duplicateCount > 0 ? 'var(--state-stale)' : 'rgba(255, 255, 255, 0.6)', margin: '2px 0 0' }}>
              {duplicateCount}
            </p>
          </div>

          <div style={{ padding: '12px', background: 'rgba(4, 12, 23, 0.6)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>Delayed (&gt;60s)</span>
            <p className="mono-text" style={{ fontSize: '1.1rem', fontWeight: 700, color: delayedCount > 0 ? 'var(--state-stale)' : 'rgba(255, 255, 255, 0.6)', margin: '2px 0 0' }}>
              {delayedCount}
            </p>
          </div>

          <div style={{ padding: '12px', background: 'rgba(4, 12, 23, 0.6)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>Watchdog</span>
            <p className="mono-text" style={{ fontSize: '1.1rem', fontWeight: 700, color: isStale ? 'var(--state-stale)' : 'var(--state-online)', margin: '2px 0 0' }}>
              {isStale ? 'STALE' : 'AKTIF'}
            </p>
          </div>
        </div>

        {/* Controlled Parser Error Banner if any */}
        {lastError && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              borderRadius: 'var(--radius-xl)',
              fontSize: '0.78rem',
              color: 'var(--state-offline)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '1.5rem',
            }}
          >
            <ShieldAlert size={15} />
            <span>Terkendali: {lastError}</span>
          </div>
        )}

        {/* Raw Message Stream Payload */}
        {lastMessage && (
          <div
            style={{
              padding: '14px 18px',
              background: 'rgba(4, 12, 23, 0.8)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--brand-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={13} color="var(--brand-light)" />
                RAW MQTT TOPIC: <span className="mono-text" style={{ color: '#ffffff', fontWeight: 600 }}>{lastMessage.topic}</span>
              </span>
              <span className="mono-text" style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                {new Date(lastMessage.receivedAt).toLocaleTimeString()}
              </span>
            </div>
            <pre
              className="mono-text"
              style={{
                fontSize: '0.78rem',
                color: '#ffffff',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                margin: 0,
              }}
            >
              {lastMessage.payload}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
