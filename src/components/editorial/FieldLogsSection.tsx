export function FieldLogsSection() {
  const logs = [
    {
      quote:
        'Suhu terukur stabil dengan penurunan bertahap saat angin laut Pantura berhembus masuk ke ruang publik di sore hari.',
      author: 'Log Stasiun Maritim',
      role: 'Pesisir Pantura Tegal',
    },
    {
      quote:
        'Respon analog MQ135 menunjukkan kenaikan resistansi saat volume kendaraan meningkat di sepanjang pedestrian Jalan Pancasila.',
      author: 'Observasi Mobilitas Warga',
      role: 'Pedestrian Koridor Timur',
    },
    {
      quote:
        'Transmisi paket telemetri ESP32-S3 mencatat tingkat packet loss 0% dan reliabilitas stream stabil pada broker publik HiveMQ.',
      author: 'Laporan Jaringan Stasiun',
      role: 'Node Gateway Hardware',
    },
  ];

  return (
    <section
      id="logs"
      className="editorial-section"
      style={{
        backgroundColor: 'var(--surface)',
      }}
    >
      {/* Header */}
      <div>
        <div className="eyebrow" style={{ color: 'var(--brand)' }}>
          <span className="eyebrow-dot" style={{ background: 'var(--brand)' }} />
          <span>Catatan Lingkungan</span>
        </div>
        <h2
          className="editorial-heading"
          style={{
            color: 'var(--ink)',
            marginTop: '1rem',
          }}
        >
          Observasi
          <br />
          Di Lapangan
        </h2>
      </div>

      {/* 3 Review Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 'clamp(1rem, 3vw, 1.5rem)',
          marginTop: 'clamp(2rem, 5vw, 3.5rem)',
        }}
      >
        {logs.map((log, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-card)',
              padding: 'clamp(1.25rem, 3.5vw, 2rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '1px solid var(--hairline)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 16px 36px rgba(2, 132, 199, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.03)';
            }}
          >
            {/* Quote Icon */}
            <span
              style={{
                fontSize: '3rem',
                lineHeight: 1,
                fontWeight: 700,
                color: 'var(--brand)',
                fontFamily: 'serif',
                display: 'block',
              }}
            >
              “
            </span>

            {/* Quote Text */}
            <p
              style={{
                fontSize: '1.05rem',
                color: 'var(--ink)',
                lineHeight: 1.6,
                margin: '1rem 0 2rem',
                fontStyle: 'normal',
              }}
            >
              {log.quote}
            </p>

            {/* Author Footer */}
            <div
              style={{
                borderTop: '1px solid var(--hairline)',
                paddingTop: '1rem',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                {log.author}
              </h4>
              <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '2px', display: 'block' }}>
                {log.role}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
