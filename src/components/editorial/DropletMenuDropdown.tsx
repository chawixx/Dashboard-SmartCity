import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Activity,
  Compass,
  BarChart3,
  FileText,
  Layers,
  Radio,
  Sparkles,
} from 'lucide-react';

interface DropletMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDiagnostic: () => void;
  connectionState?: string;
}

interface MenuItem {
  num: string;
  label: string;
  desc: string;
  href: string;
  tag: string;
  icon: React.ReactNode;
}

export function DropletMenuDropdown({
  isOpen,
  onClose,
  onOpenDiagnostic,
  connectionState = 'CONNECTED',
}: DropletMenuDropdownProps) {
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setIsClosing(true);
    } else {
      setIsClosing(false);
    }
  }

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        setIsClosing(false);
      }, 290);
      return () => clearTimeout(timer);
    }
  }, [isClosing]);

  const shouldRender = isOpen || isClosing;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const menuItems: MenuItem[] = [
    {
      num: '01',
      label: 'Parameter Telemetri',
      desc: 'Matriks pembacaan sensor DHT22 & MQ-135',
      href: '#matrix',
      tag: 'Live Grid',
      icon: <Activity size={16} style={{ color: 'var(--brand-light)' }} />,
    },
    {
      num: '02',
      label: 'Analisis Mikroklimat',
      desc: 'Grafik tren suhu, kelembapan & korelasi pesisir',
      href: '#analytics',
      tag: 'Waveform',
      icon: <BarChart3 size={16} style={{ color: '#38bdf8' }} />,
    },
    {
      num: '03',
      label: 'Kawasan Observasi',
      desc: '3D spatial deck Rumput, Pancasila & Masjid Agung',
      href: '#zones',
      tag: '3D Deck',
      icon: <Layers size={16} style={{ color: '#0ea5e9' }} />,
    },
    {
      num: '04',
      label: 'Statistik Jaringan',
      desc: 'Metrik paket, latensi sinyal & uptime ESP32',
      href: '#stats',
      tag: 'Hardware',
      icon: <Compass size={16} style={{ color: '#10b981' }} />,
    },
    {
      num: '05',
      label: 'Catatan Lapangan',
      desc: 'Observasi empiris lingkungan pesisir Alun-Alun',
      href: '#logs',
      tag: 'Field Log',
      icon: <FileText size={16} style={{ color: '#f59e0b' }} />,
    },
    {
      num: '06',
      label: 'Informasi & Kontak',
      desc: 'Arsitektur observatorium & spesifikasi node',
      href: '#footer',
      tag: 'Sistem',
      icon: <Radio size={16} style={{ color: 'var(--brand-light)' }} />,
    },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    onClose();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Backdrop Scrim (Tapping outside triggers closing bounce) */}
      <div
        className={`droplet-backdrop ${isClosing ? 'is-closing' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Droplet Dropdown Floating Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigasi Utama Observatorium"
        className={`droplet-dropdown-panel ${isClosing ? 'is-closing' : ''}`}
      >
        {/* Teardrop Stem Pointer pointing to Hamburger Button */}
        <div className="droplet-stem-pointer" />

        {/* Panel Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '0.85rem',
            marginBottom: '0.65rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--brand-light)', display: 'flex' }}>
              <Sparkles size={14} />
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              Observatorium Tegal
            </span>
          </div>

          {/* Mini MQTT Live Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '0.64rem',
              color: 'var(--brand-light)',
            }}
          >
            <span
              className={connectionState === 'CONNECTED' ? 'pulse-indicator' : ''}
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor:
                  connectionState === 'CONNECTED' ? 'var(--state-online)' : 'var(--state-stale)',
              }}
            />
            <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>{connectionState}</span>
          </div>
        </div>

        {/* Staggered Droplet Navigation Items */}
        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
          aria-label="Daftar Bagian Halaman"
        >
          {menuItems.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleLinkClick(e, item.href)}
              className="droplet-menu-item"
              style={{
                animationDelay: `${0.04 + index * 0.045}s`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        color: 'var(--brand-light)',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {item.num}
                    </span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#ffffff' }}>
                      {item.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: 'rgba(255, 255, 255, 0.55)',
                      marginTop: '1px',
                    }}
                  >
                    {item.desc}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '0.58rem',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {item.tag}
                </span>
                <span className="droplet-item-arrow">
                  <ArrowUpRight size={15} />
                </span>
              </div>
            </a>
          ))}
        </nav>

        {/* Panel Action Footer */}
        <div
          style={{
            marginTop: '0.85rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
          }}
        >
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenDiagnostic();
            }}
            className="pill-btn pill-btn-primary"
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>Inspeksi Node &amp; Data Mentah</span>
            <ArrowUpRight size={15} />
          </button>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.62rem',
              color: 'rgba(255, 255, 255, 0.5)',
              padding: '0 4px',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>Node ESP32-S3 • 5s</span>
            <span>Alun-Alun Tegal • 6°52'08"S</span>
          </div>
        </div>
      </div>
    </>
  );
}
