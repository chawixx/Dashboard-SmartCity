export function StatsSection() {
  const stats = [
    {
      value: '300',
      unit: 'pts',
      label: 'Buffer Sampel In-Memory',
      sub: 'Memory-safe $O(1)$ ring buffer',
    },
    {
      value: '<1s',
      unit: 'latency',
      label: 'Latensi Telemetri MQTT',
      sub: 'Transmisi instan broker HiveMQ',
    },
    {
      value: '24/7',
      unit: 'uptime',
      label: 'Pemantauan Nirhenti',
      sub: 'Stasiun IoT Alun-Alun Tegal',
    },
    {
      value: '6°52\'S',
      unit: 'coord',
      label: 'Titik Presisi Geografis',
      sub: 'Kawasan publik pesisir Pantura',
    },
  ];

  return (
    <section
      id="stats"
      className="editorial-section"
      style={{
        backgroundColor: 'var(--brand-deep)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 24px 60px -15px rgba(4, 12, 23, 0.7)',
      }}
    >
      {/* Header */}
      <div>
        <div className="eyebrow eyebrow-light">
          <span className="eyebrow-dot" />
          <span>Statistik Observatorium</span>
        </div>
        <h2
          className="editorial-heading"
          style={{
            marginTop: '1rem',
            marginRight: 0,
            marginBottom: 0,
            marginLeft: 0,
          }}
        >
          Instrumen Presisi
          <br />
          Kota Cerdas
        </h2>
      </div>

      {/* Grid */}
      <div
        className="stats-grid"
        style={{
          marginTop: 'clamp(2rem, 5vw, 4rem)',
        }}
      >
        {stats.map((stat, i) => (
          <div
            key={i}
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.18)',
              paddingTop: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span
                className="mono-text stats-value"
                style={{
                  fontWeight: 600,
                  color: '#ffffff',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                }}
              >
                {stat.value}
              </span>
            </div>
            <h4
              className="stats-title"
              style={{
                fontWeight: 500,
                color: '#ffffff',
                marginBottom: '4px',
              }}
            >
              {stat.label}
            </h4>
            <p
              className="stats-sub"
              style={{
                color: 'rgba(255, 255, 255, 0.65)',
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {stat.sub}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
