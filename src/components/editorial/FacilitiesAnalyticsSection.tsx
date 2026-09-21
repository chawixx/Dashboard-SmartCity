import { useState, useMemo, useRef, type PointerEvent } from 'react';
import { type TelemetryHistoryPoint } from '../../telemetry/history';
import { type TelemetryData } from '../../telemetry/types';
import { Activity, Wind } from 'lucide-react';

// SVG Chart Dimensions
const CHART_WIDTH = 520;
const CHART_HEIGHT = 260;
const PAD = { top: 20, right: 20, bottom: 30, left: 45 };
const INNER_W = CHART_WIDTH - PAD.left - PAD.right;
const INNER_H = CHART_HEIGHT - PAD.top - PAD.bottom;

interface FacilitiesAnalyticsSectionProps {
  history: TelemetryHistoryPoint[];
  telemetry: TelemetryData | null;
}

export function FacilitiesAnalyticsSection({
  history,
  telemetry,
}: FacilitiesAnalyticsSectionProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Temperature & Humidity Scales
  const scales = useMemo(() => {
    if (history.length === 0) {
      return { tempMin: 20, tempMax: 35, humidMin: 40, humidMax: 90 };
    }
    const temps = history.map((p) => p.temperature_c);
    const humids = history.map((p) => p.humidity_percent);
    return {
      tempMin: Math.floor(Math.min(...temps) - 1),
      tempMax: Math.ceil(Math.max(...temps) + 1),
      humidMin: Math.floor(Math.min(...humids) - 2),
      humidMax: Math.ceil(Math.max(...humids) + 2),
    };
  }, [history]);

  const tempPath = useMemo(() => {
    if (history.length < 2) return '';
    const range = Math.max(scales.tempMax - scales.tempMin, 1);
    return history
      .map((p, i) => {
        const x = PAD.left + (i / (history.length - 1)) * INNER_W;
        const y = PAD.top + INNER_H - ((p.temperature_c - scales.tempMin) / range) * INNER_H;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [history, scales]);

  const humidPath = useMemo(() => {
    if (history.length < 2) return '';
    const range = Math.max(scales.humidMax - scales.humidMin, 1);
    return history
      .map((p, i) => {
        const x = PAD.left + (i / (history.length - 1)) * INNER_W;
        const y = PAD.top + INNER_H - ((p.humidity_percent - scales.humidMin) / range) * INNER_H;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [history, scales]);

  const gasPath = useMemo(() => {
    if (history.length < 2) return '';
    const rawVals = history.map((p) => p.mq135_raw);
    const minVal = Math.min(...rawVals);
    const maxVal = Math.max(...rawVals);
    const range = Math.max(maxVal - minVal, 100);

    return history
      .map((p, i) => {
        const x = PAD.left + (i / (history.length - 1)) * INNER_W;
        const y = PAD.top + INNER_H - ((p.mq135_raw - minVal) / range) * INNER_H;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [history]);

  const handlePointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || history.length < 2) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relX = (clientX / rect.width) * CHART_WIDTH;
    const boundedX = Math.max(PAD.left, Math.min(PAD.left + INNER_W, relX));
    const ratio = (boundedX - PAD.left) / INNER_W;
    const idx = Math.round(ratio * (history.length - 1));
    setHoverIndex(Math.max(0, Math.min(history.length - 1, idx)));
  };

  const hoveredPoint = hoverIndex !== null ? history[hoverIndex] : null;

  return (
    <section
      id="analytics"
      className="editorial-section"
      style={{
        backgroundColor: '#ffffff',
        marginTop: '-2.5rem',
        zIndex: 10,
        boxShadow: '0 -16px 40px rgba(0, 0, 0, 0.03)',
        border: '1px solid var(--hairline)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))',
          gap: 'clamp(1.75rem, 4vw, 3rem)',
          alignItems: 'flex-start',
        }}
      >
        {/* Left Column: Intro Story */}
        <div style={{ maxWidth: '28rem' }}>
          <div
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: 'var(--radius-card)',
              overflow: 'hidden',
              background: 'var(--brand-deep)',
              border: '1px solid var(--hairline)',
              marginBottom: '1.5rem',
              boxShadow: '0 8px 24px rgba(8, 25, 46, 0.15)',
            }}
          >
            <img
              src="/assets/tegal/sensor-node.webp"
              alt="ESP32 Sensor Hardware"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.endsWith('.webp')) {
                  target.src = target.src.replace('.webp', '.jpeg');
                } else if (target.src.endsWith('.jpeg')) {
                  target.src = target.src.replace('.jpeg', '.png');
                } else if (target.src.endsWith('.png')) {
                  target.src = target.src.replace('.png', '.jpg');
                } else if (target.src.endsWith('.jpg')) {
                  target.src = target.src.replace('.jpg', '.svg');
                }
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div className="eyebrow" style={{ color: 'var(--brand)' }}>
            <span className="eyebrow-dot" style={{ background: 'var(--brand)' }} />
            <span>Observasi Lapangan</span>
          </div>

          <h2
            className="editorial-heading"
            style={{
              color: 'var(--ink)',
              marginTop: '1rem',
            }}
          >
            Jelajahi
            <br />
            Dinamika
            <br />
            Udara
          </h2>

          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--ink-soft)',
              lineHeight: 1.7,
              marginTop: '1.5rem',
            }}
          >
            Observatorium lingkungan Alun-Alun Kota Tegal mengukur interaksi maritim Laut Jawa dengan aktivitas perkotaan pesisir secara transparan dan tanpa jeda.
          </p>

          {/* Quick Stat Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--hairline)',
              marginTop: '2rem',
            }}
          >
            <Activity size={14} color="var(--brand)" />
            <span className="mono-text" style={{ fontSize: '0.78rem', color: 'var(--ink)', fontWeight: 600 }}>
              {history.length} / 300 Titik Sampel Aktif
            </span>
          </div>
        </div>

        {/* Right Column: 2 Staggered Chart Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Card 1: Temperature & Humidity Timeseries */}
          <div
            style={{
              backgroundColor: 'var(--brand-deep)',
              color: '#ffffff',
              borderRadius: 'var(--radius-card)',
              padding: 'clamp(1.15rem, 3.5vw, 1.8rem)',
              boxShadow: '0 20px 45px -10px rgba(8, 25, 46, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand-light)', fontWeight: 600 }}>
                  CHRONO BUFFER • 300 SAMPEL
                </span>
                <h3 style={{ fontSize: 'clamp(1.05rem, 3.2vw, 1.2rem)', fontWeight: 600, color: '#ffffff', margin: '2px 0 0' }}>
                  Fluktuasi Suhu &amp; Kelembaban
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--signal-temp)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ● {telemetry ? `${telemetry.temperature_c.toFixed(1)}°C` : '--'}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--brand-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ● {telemetry ? `${telemetry.humidity_percent.toFixed(1)}%` : '--'}
                </span>
              </div>
            </div>

            {/* SVG Chart */}
            <div style={{ width: '100%', overflow: 'hidden', borderRadius: 'var(--radius-xl)', background: 'rgba(4, 12, 23, 0.6)' }}>
              {history.length < 2 ? (
                <div style={{ height: `${CHART_HEIGHT}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '0.8rem' }}>Menunggu data telemetri ESP32 ({history.length}/2)...</p>
                </div>
              ) : (
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                  style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
                  onPointerMove={handlePointerMove}
                  onPointerLeave={() => setHoverIndex(null)}
                >
                  {/* Grid Lines */}
                  {[0, 0.33, 0.66, 1].map((r) => (
                    <line
                      key={r}
                      x1={PAD.left}
                      y1={PAD.top + INNER_H * r}
                      x2={PAD.left + INNER_W}
                      y2={PAD.top + INNER_H * r}
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Lines */}
                  <path d={tempPath} fill="none" stroke="var(--signal-temp)" strokeWidth="2.2" />
                  <path d={humidPath} fill="none" stroke="var(--brand-light)" strokeWidth="2.2" />

                  {/* Hover Marker */}
                  {hoveredPoint && hoverIndex !== null && (
                    <line
                      x1={PAD.left + (hoverIndex / (history.length - 1)) * INNER_W}
                      y1={PAD.top}
                      x2={PAD.left + (hoverIndex / (history.length - 1)) * INNER_W}
                      y2={PAD.top + INNER_H}
                      stroke="#ffffff"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                </svg>
              )}
            </div>
          </div>

          {/* Card 2: MQ135 Gas Dynamic Waveform */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-card)',
              padding: 'clamp(1.15rem, 3.5vw, 1.8rem)',
              border: '1px solid var(--hairline)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand)', fontWeight: 600 }}>
                  MQ135 SENSOR RESISTANSI
                </span>
                <h3 style={{ fontSize: 'clamp(1.05rem, 3.2vw, 1.2rem)', fontWeight: 600, color: 'var(--ink)', margin: '2px 0 0' }}>
                  Gelombang Kualitas Gas &amp; Emisi
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wind size={16} color="var(--brand)" />
                <span className="mono-text" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand)' }}>
                  {telemetry ? `${telemetry.mq135_raw} ADC` : '----'}
                </span>
              </div>
            </div>

            {/* Waveform SVG */}
            <div style={{ width: '100%', overflow: 'hidden', borderRadius: 'var(--radius-xl)', background: '#ffffff', border: '1px solid var(--hairline)' }}>
              {history.length < 2 ? (
                <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}>
                  <p style={{ fontSize: '0.8rem' }}>Menunggu aliran gelombang gas...</p>
                </div>
              ) : (
                <svg viewBox={`0 0 ${CHART_WIDTH} 160`} style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}>
                  <path d={gasPath} fill="none" stroke="var(--brand)" strokeWidth="2" />
                </svg>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', fontSize: '0.72rem', color: 'var(--ink-soft)', marginTop: '10px' }}>
              <span>Tegangan Sensor: {telemetry ? `${telemetry.mq135_sensor_mv.toFixed(1)} mV` : '--'}</span>
              <span>Kalibrasi Fisik Diperlukan</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
