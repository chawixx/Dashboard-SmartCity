import { ArrowUpRight } from 'lucide-react';

interface SiteFooterProps {
  onOpenDiagnostic: () => void;
}

export function SiteFooter({ onOpenDiagnostic }: SiteFooterProps) {
  return (
    <footer
      id="footer"
      className="editorial-section"
      style={{
        backgroundColor: 'var(--brand-deep)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 24px 60px -15px rgba(4, 12, 23, 0.7)',
      }}
    >
      {/* Top CTA Band */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          paddingBottom: 'clamp(2rem, 4vw, 3.5rem)',
        }}
      >
        <div>
          <div className="eyebrow eyebrow-light">
            <span className="eyebrow-dot" />
            <span>Keterbukaan Informasi Publik</span>
          </div>
          <p
            style={{
              fontSize: 'clamp(1.6rem, 4.8vw, 2.8rem)',
              fontWeight: 500,
              textTransform: 'uppercase',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              margin: '1rem 0 0',
            }}
          >
            Akses Data Terbuka
            <br />
            Lingkungan Tegal
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenDiagnostic}
          className="pill-btn pill-btn-light"
          style={{
            padding: '0.85rem 2rem',
            fontSize: '0.85rem',
          }}
        >
          <span>Inspeksi Node / Data Mentah</span>
          <ArrowUpRight size={16} />
        </button>
      </div>

      {/* 4-Column Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
          gap: '2rem',
          padding: 'clamp(2rem, 4vw, 3.5rem) 0',
        }}
      >
        {/* Brand Column */}
        <div style={{ maxWidth: '20rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(56, 189, 248, 0.3)',
                border: '1px solid var(--brand-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-light)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9"/>
                <path d="M4.8 5.6A9 9 0 0 0 4.8 18.4"/>
                <path d="M19.2 5.6a9 9 0 0 1 0 12.8"/>
              </svg>
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Tegal EcoSense
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6 }}>
            Observatorium telemetri iklim mikro Alun-Alun Kota Tegal berbasis mikrokontroler ESP32-S3 dan sensor lingkungan nirkabel.
          </p>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '1rem', lineHeight: 1.5 }}>
            Jalan Pancasila No. 1, Mangkukusuman, Kota Tegal, Jawa Tengah 52121
          </div>
        </div>

        {/* Column 2: Parameters */}
        <div>
          <h5 style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-light)', marginBottom: '1.2rem' }}>
            Parameter
          </h5>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <li><a href="#matrix" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Temperatur Udara (°C)</a></li>
            <li><a href="#matrix" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Kelembaban Relatif (% RH)</a></li>
            <li><a href="#matrix" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Kualitas Gas MQ135 (ADC)</a></li>
            <li><a href="#matrix" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Kekuatan Sinyal (RSSI)</a></li>
          </ul>
        </div>

        {/* Column 3: Navigasi */}
        <div>
          <h5 style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-light)', marginBottom: '1.2rem' }}>
            Navigasi
          </h5>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <li><a href="#zones" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Kawasan Alun-Alun</a></li>
            <li><a href="#matrix" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Matriks Pengukuran</a></li>
            <li><a href="#analytics" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Analisis &amp; Tren</a></li>
            <li><a href="#logs" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Catatan Lapangan</a></li>
          </ul>
        </div>

        {/* Column 4: Protokol IoT */}
        <div>
          <h5 style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-light)', marginBottom: '1.2rem' }}>
            Protokol IoT
          </h5>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <li><span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>HiveMQ Broker (Port 8000/1883)</span></li>
            <li><span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>ESP32-S3 Dual-Core SoC</span></li>
            <li><span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>DHT22 Digital Humidity &amp; Temp</span></li>
            <li><span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>MQ135 Hazardous Air Sensor</span></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          paddingTop: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.78rem',
          color: 'rgba(255, 255, 255, 0.55)',
        }}
      >
        <span>© 2026 Tegal EcoSense Observatory. Hak cipta dilindungi.</span>
        <span className="mono-text" style={{ color: 'var(--brand-light)' }}>
          Alun-Alun Kota Tegal • 6°52'08.2"S 109°08'18.8"E
        </span>
      </div>
    </footer>
  );
}
