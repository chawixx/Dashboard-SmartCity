import React, { useState, useMemo, useRef } from 'react';
import { type TelemetryHistoryPoint } from '../../telemetry/history';
import { Activity, Eye, EyeOff } from 'lucide-react';

interface RealtimeTelemetryChartProps {
  history: TelemetryHistoryPoint[];
  capacity?: number;
}

type SeriesKey = 'temperature_c' | 'humidity_percent' | 'mq135_raw';

interface SeriesConfig {
  key: SeriesKey;
  label: string;
  unit: string;
  color: string;
  glowColor: string;
  defaultMin: number;
  defaultMax: number;
}

const SERIES_DEFS: SeriesConfig[] = [
  {
    key: 'temperature_c',
    label: 'Temperature',
    unit: '°C',
    color: 'var(--signal-temp)',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    defaultMin: 15,
    defaultMax: 45,
  },
  {
    key: 'humidity_percent',
    label: 'Humidity',
    unit: '% RH',
    color: 'var(--signal-humid)',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    defaultMin: 20,
    defaultMax: 100,
  },
  {
    key: 'mq135_raw',
    label: 'MQ135 Raw ADC',
    unit: 'ADC',
    color: 'var(--signal-gas)',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    defaultMin: 0,
    defaultMax: 4095,
  },
];

export function RealtimeTelemetryChart({
  history,
  capacity = 300,
}: RealtimeTelemetryChartProps) {
  // Toggle visibility of each series (PRD Section 15)
  const [activeSeries, setActiveSeries] = useState<Record<SeriesKey, boolean>>({
    temperature_c: true,
    humidity_percent: true,
    mq135_raw: true,
  });

  // Hovered index for interactive scrubbing crosshair tooltip
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const toggleSeries = (key: SeriesKey) => {
    setActiveSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const chartWidth = 960;
  const chartHeight = 260;
  const padding = { top: 20, right: 30, bottom: 35, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Compute normalized scales for each series independently
  const seriesScales = useMemo(() => {
    const scales: Record<SeriesKey, { min: number; max: number; range: number }> = {
      temperature_c: { min: 15, max: 40, range: 25 },
      humidity_percent: { min: 20, max: 100, range: 80 },
      mq135_raw: { min: 0, max: 4095, range: 4095 },
    };

    if (history.length > 0) {
      SERIES_DEFS.forEach((s) => {
        const values = history.map((p) => p[s.key]);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const paddingMargin = (maxVal - minVal) * 0.1 || 2;
        const computedMin = Math.floor(Math.min(s.defaultMin, minVal - paddingMargin));
        const computedMax = Math.ceil(Math.max(s.defaultMax, maxVal + paddingMargin));
        scales[s.key] = {
          min: computedMin,
          max: computedMax,
          range: Math.max(computedMax - computedMin, 1),
        };
      });
    }

    return scales;
  }, [history]);

  // Generate SVG polyline points
  const seriesPaths = useMemo(() => {
    if (history.length < 2) return {};

    const paths: Partial<Record<SeriesKey, string>> = {};
    const count = history.length;

    SERIES_DEFS.forEach((s) => {
      if (!activeSeries[s.key]) return;

      const scale = seriesScales[s.key];
      const points = history.map((point, i) => {
        const x = padding.left + (i / (count - 1)) * innerWidth;
        const normalizedVal = (point[s.key] - scale.min) / scale.range;
        const y = padding.top + innerHeight - normalizedVal * innerHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });

      paths[s.key] = points.join(' ');
    });

    return paths;
  }, [history, activeSeries, seriesScales, innerWidth, innerHeight, padding.left, padding.top]);

  // Handle pointer hover / scrubbing
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || history.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * chartWidth;

    if (svgX < padding.left || svgX > padding.left + innerWidth) {
      setHoverIndex(null);
      return;
    }

    const ratio = (svgX - padding.left) / innerWidth;
    const index = Math.min(
      Math.max(0, Math.round(ratio * (history.length - 1))),
      history.length - 1
    );
    setHoverIndex(index);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  const latestPoint = history[history.length - 1];
  const hoveredPoint = hoverIndex !== null ? history[hoverIndex] : null;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        borderTop: '2px solid var(--border-glow-active)',
      }}
    >
      {/* Chart Top Header & Legend Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            <span style={{ color: 'var(--text-secondary)' }}>Chrono Buffer</span>
          </div>
          <h3
            style={{
              fontSize: '0.92rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#ffffff',
            }}
          >
            Realtime Telemetry Timeseries
          </h3>
          <span
            className="mono-text"
            style={{
              padding: '3px 12px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '0.7rem',
              color: history.length >= capacity ? 'var(--state-stale)' : 'var(--text-muted)',
              fontWeight: 500,
            }}
          >
            {history.length} / {capacity} SAMPLES (BOUNDED BUFFER)
          </span>
        </div>

        {/* Series Toggles with Latest Values (PRD Section 15) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {SERIES_DEFS.map((s) => {
            const isActive = activeSeries[s.key];
            const latestVal = latestPoint ? latestPoint[s.key] : null;

            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggleSeries(s.key)}
                aria-pressed={isActive}
                aria-label={`Toggle ${s.label} series visibility`}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isActive ? 'rgba(15, 47, 99, 0.9)' : 'rgba(7, 21, 43, 0.5)',
                  border: `1px solid ${isActive ? s.color : 'rgba(255, 255, 255, 0.15)'}`,
                  opacity: isActive ? 1 : 0.45,
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 12px -2px ${s.glowColor}` : 'none',
                }}
              >
                {isActive ? <Eye size={13} color={s.color} /> : <EyeOff size={13} color="var(--text-dim)" />}
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isActive ? s.color : 'var(--text-muted)' }}>
                  {s.label}:
                </span>
                <span className="mono-text" style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 700 }}>
                  {latestVal !== null ? (typeof latestVal === 'number' && latestVal % 1 !== 0 ? latestVal.toFixed(1) : latestVal) : '--'}
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '3px' }}>{s.unit}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Timeseries Visualizer */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          background: 'rgba(7, 21, 43, 0.70)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          overflow: 'hidden',
        }}
      >
        {history.length < 2 ? (
          <div
            style={{
              height: `${chartHeight}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--text-muted)',
            }}
          >
            <Activity size={24} className="pulse-indicator" color="var(--signal-humid)" />
            <p style={{ fontSize: '0.82rem' }}>Awaiting realtime stream data points ({history.length}/2)...</p>
          </div>
        ) : (
          <>
            <div className="sr-only">
              Realtime telemetry timeseries line chart with {history.length} samples.
              {latestPoint && (
                <span>
                  Latest readings: Temperature {latestPoint.temperature_c}°C,
                  Humidity {latestPoint.humidity_percent}%,
                  MQ135 Raw {latestPoint.mq135_raw}.
                </span>
              )}
            </div>
            <svg
              ref={svgRef}
              role="img"
              aria-label={`Realtime telemetry timeseries chart showing ${history.length} data samples`}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
            >
            <defs>
              <linearGradient id="grid-fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(56, 96, 140, 0.15)" />
                <stop offset="100%" stopColor="rgba(56, 96, 140, 0.02)" />
              </linearGradient>
            </defs>

            {/* Background Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padding.top + innerHeight * ratio;
              return (
                <line
                  key={`grid-y-${ratio}`}
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerWidth}
                  y2={y}
                  stroke="rgba(56, 96, 140, 0.12)"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Vertical Time Guides */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const x = padding.left + innerWidth * ratio;
              const pointIdx = Math.floor(ratio * (history.length - 1));
              const pt = history[pointIdx];
              return (
                <g key={`grid-x-${ratio}`}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + innerHeight}
                    stroke="rgba(56, 96, 140, 0.08)"
                  />
                  {pt && (
                    <text
                      x={x}
                      y={chartHeight - 12}
                      fill="var(--text-dim)"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      textAnchor={ratio === 0 ? 'start' : ratio === 1 ? 'end' : 'middle'}
                    >
                      {pt.formattedTime}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Active Telemetry Polylines */}
            {SERIES_DEFS.map((s) => {
              const points = seriesPaths[s.key];
              if (!points) return null;

              return (
                <g key={`path-${s.key}`}>
                  {/* Subtle blur glow underlay */}
                  <polyline
                    points={points}
                    fill="none"
                    stroke={s.glowColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.4"
                  />
                  {/* Crisp precision signal line */}
                  <polyline
                    points={points}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}

            {/* Interactive Scrubbing Crosshair & Tooltip */}
            {hoveredPoint && hoverIndex !== null && (
              <g>
                {/* Vertical Crosshair Needle */}
                {(() => {
                  const x = padding.left + (hoverIndex / (history.length - 1)) * innerWidth;
                  return (
                    <>
                      <line
                        x1={x}
                        y1={padding.top}
                        x2={x}
                        y2={padding.top + innerHeight}
                        stroke="rgba(255, 255, 255, 0.5)"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                      {/* Active points circles */}
                      {SERIES_DEFS.map((s) => {
                        if (!activeSeries[s.key]) return null;
                        const scale = seriesScales[s.key];
                        const val = hoveredPoint[s.key];
                        const y = padding.top + innerHeight - ((val - scale.min) / scale.range) * innerHeight;
                        return (
                          <circle
                            key={`circle-${s.key}`}
                            cx={x}
                            cy={y}
                            r="4"
                            fill={s.color}
                            stroke="var(--bg-abyss)"
                            strokeWidth="2"
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </g>
            )}
          </svg>
          </>
        )}

        {/* Floating Tooltip Box */}
        {hoveredPoint && hoverIndex !== null && (
          <div
            className="glass-panel"
            style={{
              position: 'absolute',
              top: '12px',
              left: `${Math.min(
                Math.max(12, (hoverIndex / (history.length - 1)) * 80 + 10),
                70
              )}%`,
              padding: '8px 12px',
              background: 'rgba(6, 8, 12, 0.92)',
              border: '1px solid var(--border-glow-active)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
              pointerEvents: 'none',
              zIndex: 10,
              minWidth: '170px',
            }}
          >
            <div
              style={{
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                marginBottom: '4px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span className="mono-text">{hoveredPoint.formattedTime}</span>
              <span className="mono-text">#{hoveredPoint.sequence}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {activeSeries.temperature_c && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--signal-temp)' }}>Temperature:</span>
                  <span className="mono-text" style={{ fontWeight: 700 }}>
                    {hoveredPoint.temperature_c.toFixed(2)} °C
                  </span>
                </div>
              )}
              {activeSeries.humidity_percent && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--signal-humid)' }}>Humidity:</span>
                  <span className="mono-text" style={{ fontWeight: 700 }}>
                    {hoveredPoint.humidity_percent.toFixed(2)} %
                  </span>
                </div>
              )}
              {activeSeries.mq135_raw && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--signal-gas)' }}>MQ135 ADC:</span>
                  <span className="mono-text" style={{ fontWeight: 700 }}>
                    {hoveredPoint.mq135_raw}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
