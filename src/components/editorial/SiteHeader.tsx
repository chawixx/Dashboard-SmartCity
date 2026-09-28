import { type MqttConnectionState } from '../../mqtt/client';
import { DropletMenuDropdown } from './DropletMenuDropdown';

interface SiteHeaderProps {
  connectionState: MqttConnectionState;
  onOpenDiagnostic: () => void;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
}

export function SiteHeader({
  connectionState,
  onOpenDiagnostic,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
}: SiteHeaderProps) {
  const getStatusDotColor = () => {
    switch (connectionState) {
      case 'CONNECTED':
        return 'var(--state-online)';
      case 'CONNECTING':
      case 'RECONNECTING':
        return 'var(--state-stale)';
      case 'ERROR':
      case 'DISCONNECTED':
      default:
        return 'var(--state-offline)';
    }
  };

  return (
    <header
      className="site-header"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '1.5rem 1.5rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: isMenuOpen ? 95 : 20,
        color: '#ffffff',
      }}
    >
      {/* Left Navigation Links (Hidden on small mobile) */}
      <nav
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          fontSize: '0.78rem',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
        className="header-left-nav"
      >
        <a
          href="#matrix"
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')}
        >
          Parameter
        </a>
        <a
          href="#lighting-control"
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')}
        >
          Penerangan
        </a>
        <a
          href="#analytics"
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')}
        >
          Analisis
        </a>
        <a
          href="#zones"
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')}
        >
          Kawasan
        </a>
      </nav>

      {/* Center Brand Identity */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(56, 189, 248, 0.2)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-light)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M4.8 5.6A9 9 0 0 0 4.8 18.4"/>
            <path d="M19.2 5.6a9 9 0 0 1 0 12.8"/>
          </svg>
        </div>
        <span
          className="site-brand-text"
          style={{
            fontSize: 'clamp(0.78rem, 2.5vw, 0.95rem)',
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#ffffff',
            whiteSpace: 'nowrap',
          }}
        >
          TEGAL ECOSENSE
        </span>
      </div>

      {/* Right Controls: MQTT Pill + Raw Data button + Water Droplet Burger Button */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '1rem',
          position: 'relative',
        }}
      >
        {/* Live MQTT Dot Pill */}
        <div
          style={{
            padding: '5px 12px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.74rem',
          }}
        >
          <span
            className={connectionState === 'CONNECTED' ? 'pulse-indicator' : ''}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: getStatusDotColor(),
              boxShadow: `0 0 8px ${getStatusDotColor()}`,
            }}
          />
          <span
            className="mono-text"
            style={{
              color: '#ffffff',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            {connectionState}
          </span>
        </div>

        {/* "Data Mentah" (Diagnostic Trigger) */}
        <button
          type="button"
          onClick={onOpenDiagnostic}
          className="pill-btn pill-btn-outline header-data-btn"
          style={{
            padding: '6px 14px',
            fontSize: '0.74rem',
            border: '1px solid rgba(255, 255, 255, 0.25)',
          }}
        >
          Data Mentah
        </button>

        {/* Water Droplet Hamburger Button (Click 1 opens, Click 2 closes) */}
        <button
          type="button"
          onClick={onToggleMenu}
          aria-label={isMenuOpen ? 'Tutup Navigasi Menu' : 'Buka Navigasi Utama'}
          aria-expanded={isMenuOpen}
          className={`droplet-burger-btn ${isMenuOpen ? 'is-open' : ''}`}
        >
          <span className="droplet-pulse-ring" />
          <span className="droplet-burger-line line-top" />
          <span className="droplet-burger-line line-bottom" />
        </button>

        {/* Droplet Dropdown Menu (Air Menetes & Memantul) */}
        <DropletMenuDropdown
          isOpen={isMenuOpen}
          onClose={onCloseMenu}
          onOpenDiagnostic={onOpenDiagnostic}
          connectionState={connectionState}
        />
      </div>
    </header>
  );
}
