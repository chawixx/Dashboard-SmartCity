import { type TelemetryData } from '../../telemetry/types';
import { ArrowUpRight } from 'lucide-react';

interface TelemetryMatrixSectionProps {
  telemetry: TelemetryData | null;
  formattedUptime: string;
  onSelectParam?: (index: number) => void;
}

export function TelemetryMatrixSection({
  telemetry,
  formattedUptime,
  onSelectParam,
}: TelemetryMatrixSectionProps) {
  const parameters = [
    {
      index: '01',
      title: 'Temperatur Ambien (DHT22)',
      value: telemetry ? `${telemetry.temperature_c.toFixed(2)} °C` : '--.-- °C',
      description: 'Suhu mikro di area terbuka rumput sintetis Alun-Alun Kota Tegal dengan dinamika panas maritim.',
      anchor: '#analytics',
      highlightColor: 'var(--signal-temp)',
    },
    {
      index: '02',
      title: 'Kelembaban Relatif (DHT22)',
      value: telemetry ? `${telemetry.humidity_percent.toFixed(2)} % RH` : '--.-- % RH',
      description: 'Tingkat kejenuhan uap air pesisir utara Jawa yang mempengaruhi kenyamanan termal publik.',
      anchor: '#analytics',
      highlightColor: 'var(--brand-light)',
    },
    {
      index: '03',
      title: 'Sensor Gas & Partikel (MQ135)',
      value: telemetry ? `${telemetry.mq135_raw} ADC (${telemetry.mq135_sensor_mv.toFixed(0)} mV)` : '---- ADC',
      description: 'Pembacaan resistansi analog ruang udara Alun-Alun terhadap asap kendaraan dan emisi sekitar.',
      anchor: '#analytics',
      highlightColor: 'var(--brand)',
    },
    {
      index: '04',
      title: 'Presipitasi & Curah Hujan (Pin 8)',
      value: telemetry?.rain_status
        ? `${telemetry.rain_status} (${telemetry.rain_raw ?? '----'} ADC)`
        : telemetry?.rain_raw !== undefined
        ? `${telemetry.rain_raw} ADC`
        : 'N/A',
      description: 'Deteksi tingkat kebasahan dan tetesan air hujan pada pelat sensor analog GPIO 8 untuk pemantauan cuaca basah Alun-Alun.',
      anchor: '#analytics',
      highlightColor: 'var(--brand-light)',
    },
    {
      index: '05',
      title: 'Ketinggian Air Sungai & Saluran (Pin 10)',
      value: telemetry?.flood_status
        ? `${telemetry.flood_status} (${telemetry.water_level_cm !== undefined ? `${telemetry.water_level_cm.toFixed(1)} cm` : `${telemetry.water_level_raw ?? '--'} ADC`})`
        : telemetry?.water_level_raw !== undefined
        ? `${telemetry.water_level_raw} ADC`
        : 'N/A',
      description: 'Pemantauan debit muka air pada strip konduktif celup GPIO 10 untuk deteksi dini luapan dan mitigasi banjir Alun-Alun.',
      anchor: '#analytics',
      highlightColor: telemetry?.flood_status === 'Bahaya Banjir' || telemetry?.flood_status === 'Siaga' ? '#f43f5e' : 'var(--brand-light)',
    },
    {
      index: '06',
      title: 'Transmisi Node IoT (ESP32-S3)',
      value: telemetry ? `${telemetry.wifi_rssi_dbm} dBm · Up ${formattedUptime}` : '-- dBm',
      description: 'Kekuatan sinyal Wi-Fi transceiver ESP32-S3 dan jam uptime pemrosesan telemetri.',
      anchor: '#stats',
      highlightColor: 'var(--state-online)',
    },
  ];

  return (
    <section
      id="matrix"
      className="editorial-section"
      style={{
        backgroundColor: 'var(--surface)',
      }}
    >
      {/* Section Header */}
      <div>
        <div className="eyebrow" style={{ color: 'var(--brand)' }}>
          <span className="eyebrow-dot" style={{ background: 'var(--brand)', boxShadow: '0 0 8px var(--brand)' }} />
          <span>Parameter Pengukuran</span>
        </div>
        <h2
          className="editorial-heading"
          style={{
            color: 'var(--ink)',
            marginTop: '1rem',
          }}
        >
          Data Terbuka
          <br />
          Ruang Publik
        </h2>
      </div>

      {/* 4 Interactive Rows */}
      <div style={{ marginTop: 'clamp(2rem, 5vw, 3.5rem)' }}>
        {parameters.map((param, idx) => (
          <a
            key={param.index}
            href={param.anchor}
            onClick={() => onSelectParam && onSelectParam(idx)}
            className="matrix-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.25rem',
              padding: '1.5rem 0',
              borderTop: '1px solid var(--hairline)',
              borderBottom: idx === parameters.length - 1 ? '1px solid var(--hairline)' : 'none',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            {/* Number Index */}
            <span
              className="mono-text"
              style={{
                width: '2.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--ink-soft)',
                flexShrink: 0,
              }}
            >
              {param.index}
            </span>

            {/* Title & Description */}
            <div style={{ flex: 1, minWidth: 'min(100%, 12rem)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <h3
                  style={{
                    fontSize: 'clamp(1.05rem, 3.8vw, 1.45rem)',
                    fontWeight: 500,
                    color: 'var(--ink)',
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {param.title}
                </h3>
                <span
                  className="mono-text"
                  style={{
                    fontSize: 'clamp(0.92rem, 3.2vw, 1.15rem)',
                    fontWeight: 700,
                    color: param.highlightColor,
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  {param.value}
                </span>
              </div>
              <p
                style={{
                  fontSize: 'clamp(0.78rem, 2.7vw, 0.84rem)',
                  color: 'var(--ink-soft)',
                  marginTop: '6px',
                  marginBottom: 0,
                  maxWidth: '46rem',
                  lineHeight: 1.5,
                }}
              >
                {param.description}
              </p>
            </div>

            {/* Trailing Arrow Circle */}
            <div className="arrow-circle" style={{ flexShrink: 0 }}>
              <ArrowUpRight size={18} />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
