import { type TelemetryData } from '../../telemetry/types';
import { getAirQualityGrade } from '../../telemetry/formatters';
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
  const gasGrade = getAirQualityGrade(telemetry?.mq135_raw, telemetry?.air_quality_status);

  const parameters = [
    {
      index: '01',
      title: 'Suhu Udara Ambien (DHT22)',
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
      title: 'Kualitas Udara & Gas (MQ-135)',
      value: telemetry
        ? `${gasGrade.label} (${telemetry.mq135_raw} ADC · ${telemetry.mq135_sensor_mv.toFixed(0)} mV)`
        : '---- ADC',
      description: telemetry
        ? gasGrade.description
        : 'Indikator deteksi kebersihan udara dan konsentrasi emisi gas ruang terbuka Alun-Alun.',
      anchor: '#analytics',
      highlightColor: gasGrade.color,
    },
    {
      index: '04',
      title: 'Presipitasi & Curah Hujan (Rain Sensor)',
      value: telemetry?.rain_status
        ? `${telemetry.rain_status} (${telemetry.rain_raw ?? '----'} ADC)`
        : telemetry?.rain_raw !== undefined
        ? `${telemetry.rain_raw} ADC`
        : 'N/A',
      description: 'Deteksi tingkat kebasahan dan tetesan air hujan pada modul Rain Sensor untuk pemantauan cuaca basah Alun-Alun.',
      anchor: '#analytics',
      highlightColor: 'var(--brand-light)',
    },
    {
      index: '05',
      title: 'Ketinggian Muka Air Sungai (Ultrasonic Sensor)',
      value: telemetry?.flood_status
        ? `${telemetry.flood_status} (${telemetry.water_level_cm !== undefined ? `${telemetry.water_level_cm.toFixed(1)} cm` : ''}${telemetry.water_distance_cm !== undefined ? ` · Jarak ${telemetry.water_distance_cm.toFixed(1)} cm` : ''})`
        : telemetry?.water_distance_cm !== undefined
        ? `Jarak ${telemetry.water_distance_cm.toFixed(1)} cm`
        : 'N/A',
      description: 'Pengukuran jarak pantul ultrasonik ke muka air sungai Alun-Alun (maks 30 cm). Semakin kecil jaraknya menandakan debit banjir semakin tinggi meluap.',
      anchor: '#analytics',
      highlightColor: telemetry?.flood_status === 'Bahaya Banjir' || telemetry?.flood_status === 'Siaga' ? '#f43f5e' : 'var(--brand-light)',
    },
    {
      index: '06',
      title: 'Intensitas Cahaya Ambien (LDR Sensor)',
      value: telemetry?.ambient_light
        ? `${telemetry.ambient_light} (${telemetry.ldr_raw ?? '----'} ADC)`
        : telemetry?.ldr_raw !== undefined
        ? `${telemetry.ldr_raw} ADC`
        : 'N/A',
      description: 'Intensitas cahaya alami untuk otomatisasi penerangan jalan 4 sektor Alun-Alun (GPIO 9 ADC1).',
      anchor: '#lighting-control',
      highlightColor: '#f59e0b',
    },
    {
      index: '07',
      title: 'Kapasitas Lahan Parkir (Smart Parking 10 Slot)',
      value: telemetry?.parking_available_slots !== undefined
        ? `${telemetry.parking_available_slots} / ${telemetry.parking_total_slots ?? 10} Slot Bebas (${telemetry.is_parking_full ? 'PENUH' : 'TERSEDIA'})`
        : '10 / 10 Slot Bebas (TERSEDIA)',
      description: 'Penghitungan kapasitas slot kosong kawasan parkir Alun-Alun berbasis 2 sensor infrared dan kendali otomatis 2 motor servo palang gerbang.',
      anchor: '#smart-parking',
      highlightColor: telemetry?.is_parking_full ? '#f43f5e' : 'var(--state-online)',
    },
    {
      index: '08',
      title: 'Kekuatan Sinyal & Uptime (ESP32-S3)',
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
