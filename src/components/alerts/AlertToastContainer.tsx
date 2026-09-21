import { AlertTriangle, Flame, Droplets, Wind, WifiOff, X } from 'lucide-react';
import { type AlertItem } from '../../hooks/useAlertEngine';

interface AlertToastContainerProps {
  alerts: AlertItem[];
  onDismiss: (id: string) => void;
}

export function AlertToastContainer({ alerts, onDismiss }: AlertToastContainerProps) {
  if (alerts.length === 0) return null;

  const getIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'temperature':
        return <Flame size={16} color="#fb923c" />;
      case 'humidity':
        return <Droplets size={16} color="#38bdf8" />;
      case 'gas':
        return <Wind size={16} color="#f43f5e" />;
      case 'stale':
        return <WifiOff size={16} color="#eab308" />;
      default:
        return <AlertTriangle size={16} color="#f43f5e" />;
    }
  };

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Pemberitahuan Peringatan Lingkungan"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        maxWidth: '24rem',
        width: 'calc(100% - 4rem)',
        pointerEvents: 'none',
      }}
    >
      {alerts.map((alert) => {
        const isDanger = alert.level === 'danger';
        const borderColor = isDanger ? 'rgba(244, 63, 94, 0.65)' : 'rgba(251, 146, 60, 0.65)';
        const glowColor = isDanger ? 'rgba(244, 63, 94, 0.3)' : 'rgba(251, 146, 60, 0.25)';

        return (
          <div
            key={alert.id}
            style={{
              pointerEvents: 'auto',
              backgroundColor: 'rgba(8, 25, 46, 0.95)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1.5px solid ${borderColor}`,
              boxShadow: `0 12px 36px ${glowColor}, 0 4px 12px rgba(0,0,0,0.5)`,
              borderRadius: 'var(--radius-card)',
              padding: '1.2rem',
              color: '#ffffff',
              animation: 'slideInAlert 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: isDanger ? 'rgba(244, 63, 94, 0.18)' : 'rgba(251, 146, 60, 0.18)',
                  }}
                >
                  {getIcon(alert.type)}
                </span>
                <div>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.01em', margin: 0 }}>
                    {alert.title}
                  </h4>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className="mono-text"
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: isDanger ? '#f43f5e' : '#fb923c',
                    color: '#ffffff',
                  }}
                >
                  {alert.metricValue}
                </span>
                <button
                  type="button"
                  onClick={() => onDismiss(alert.id)}
                  aria-label="Tutup notifikasi"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Message Body */}
            <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.5, margin: 0 }}>
              {alert.message}
            </p>
          </div>
        );
      })}

      <style>{`
        @keyframes slideInAlert {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
