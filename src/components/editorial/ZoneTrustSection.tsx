import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Radio, Compass, Sparkles, MapPin } from 'lucide-react';
import type { TelemetryData } from '../../telemetry/types';
import { getAirQualityGrade } from '../../telemetry/formatters';

interface ZoneTrustSectionProps {
  lastReceivedAt: number | null;
  telemetry?: TelemetryData | null;
}

interface ZoneInfo {
  id: number;
  name: string;
  subtitle: string;
  tag: string;
  image: string;
  desc: string;
  coordinates: string;
  hudMetric: {
    label: string;
    getValue: (t: TelemetryData | null | undefined) => string;
    status: (t: TelemetryData | null | undefined) => string;
    accent: string;
  };
  features: string[];
}

export function ZoneTrustSection({ lastReceivedAt, telemetry }: ZoneTrustSectionProps) {
  const [activeZoneIndex, setActiveZoneIndex] = useState(0);
  const [tilt, setTilt] = useState({ rotX: 0, rotY: 0, glareX: 50, glareY: 50, isHovered: false });
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const zones: ZoneInfo[] = [
    {
      id: 1,
      name: 'Zona Rumput Sintetis',
      subtitle: 'Plaza Publik Alun-Alun',
      tag: 'PLAZA SENTRAL',
      image: '/assets/tegal/zona-rumput.jpeg',
      desc: 'Area sentral interaksi warga dengan eksposur langsung radiasi termal matahari dan dinamika angin pesisir utara.',
      coordinates: "6°52'08\"S 109°08'02\"E",
      hudMetric: {
        label: 'Eksposur Termal',
        getValue: (t) => (t ? `${t.temperature_c.toFixed(1)}°C` : '31.4°C'),
        status: (t) => {
          if (!t) return 'Hangat Terik';
          return t.temperature_c > 33 ? 'Panas Ekstrem' : t.temperature_c > 30 ? 'Hangat Terik' : 'Optimal';
        },
        accent: '#f59e0b',
      },
      features: ['Retensi Termal Rumput', 'Bebas Hambatan Udara', 'Pusat Keramaian Warga'],
    },
    {
      id: 2,
      name: 'Jalan Pancasila',
      subtitle: 'Pedestrian Koridor Timur',
      tag: 'KORIDOR HIJAU',
      image: '/assets/tegal/jalan-pancasila.jpeg',
      desc: 'Koridor hijau pejalan kaki penghubung Stasiun Tegal dan Alun-Alun yang mengalirkan sirkulasi angin laut.',
      coordinates: "6°52'02\"S 109°08'24\"E",
      hudMetric: {
        label: 'Koridor Angin Laut',
        getValue: (t) => (t ? `${t.humidity_percent.toFixed(0)}% RH` : '68% RH'),
        status: (t) => {
          if (!t) return 'Semilir Segar';
          return t.humidity_percent > 75 ? 'Lembap Pesisir' : t.humidity_percent > 55 ? 'Semilir Segar' : 'Sejuk Normal';
        },
        accent: '#0ea5e9',
      },
      features: ['Vektor Angin Utara-Selatan', 'Kanopi Peneduh Rindang', 'Akses Stasiun KA'],
    },
    {
      id: 3,
      name: 'Masjid Agung Kota Tegal',
      subtitle: 'Fasad Barat & Menara Ikonik',
      tag: 'PENYANGGA BARAT',
      image: '/assets/tegal/masjid-agung.jpeg',
      desc: 'Ikon historis religi kota yang menjadi penyangga angin darat dan ruang teduh peribadatan publik barat.',
      coordinates: "6°52'07\"S 109°07'52\"E",
      hudMetric: {
        label: 'Kualitas Udara & Akustik',
        getValue: (t) => (t ? `${getAirQualityGrade(t.mq135_raw, t.air_quality_status).label} (${t.mq135_raw} ADC)` : 'Udara Bersih (1120 ADC)'),
        status: (t) => {
          if (!t) return 'Buffer Bersih';
          const grade = getAirQualityGrade(t.mq135_raw, t.air_quality_status);
          return grade.isPolluted ? 'Tercemar Gas' : 'Buffer Bersih';
        },
        accent: '#10b981',
      },
      features: ['Zona Buffer Emisi', 'Sirkulasi Plafon Tinggi', 'Penyangga Angin Darat'],
    },
    {
      id: 4,
      name: 'Saluran Sungai Alun-Alun',
      subtitle: 'Kanal Drainase & Mitigasi Banjir',
      tag: 'KONTROL BANJIR',
      image: '/assets/tegal/hero-alun-alun.jpeg',
      desc: 'Saluran aliran air dan drainase primer kawasan Alun-Alun Kota Tegal untuk pengawasan luapan debit air rob dan hujan lebat.',
      coordinates: "6°52'12\"S 109°08'10\"E",
      hudMetric: {
        label: 'Debit & Muka Air Sungai',
        getValue: (t) =>
          t?.water_level_cm !== undefined
            ? `${t.water_level_cm.toFixed(1)} cm`
            : t?.water_distance_cm !== undefined
            ? `Jarak ${t.water_distance_cm.toFixed(1)} cm`
            : '0.0 cm',
        status: (t) => (t?.flood_status ? t.flood_status : 'Aman Normal'),
        accent: '#06b6d4',
      },
      features: ['Sensor Ultrasonik Pin 13/12', 'Early Warning Rob & Banjir', 'Kapasitas Tampung Kanal'],
    },
  ];

  const currentZone = zones[activeZoneIndex];

  const handlePrev = useCallback(() => {
    setActiveZoneIndex((prev) => (prev === 0 ? zones.length - 1 : prev - 1));
  }, [zones.length]);

  const handleNext = useCallback(() => {
    setActiveZoneIndex((prev) => (prev === zones.length - 1 ? 0 : prev + 1));
  }, [zones.length]);

  // Mouse tilt physics for active card
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotX = (y - 0.5) * -16;
    const rotY = (x - 0.5) * 16;
    setTilt({
      rotX,
      rotY,
      glareX: Math.round(x * 100),
      glareY: Math.round(y * 100),
      isHovered: true,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rotX: 0, rotY: 0, glareX: 50, glareY: 50, isHovered: false });
  };

  // Touch drag & swipe physics
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - touchStartX.current;
    setTouchDeltaX(Math.max(-45, Math.min(45, deltaX)));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    setTouchDeltaX(0);
    if (deltaX > 45) {
      handlePrev();
    } else if (deltaX < -45) {
      handleNext();
    }
  };

  return (
    <section
      id="zones"
      className="editorial-section"
      style={{
        backgroundColor: 'var(--background)',
        isolation: 'isolate',
        border: '1px solid var(--hairline)',
      }}
    >
      {/* Top Badges Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '2rem',
          position: 'relative',
          zIndex: 20,
        }}
      >
        {/* Percentage Badge */}
        <div
          style={{
            width: '7.5rem',
            height: '7.5rem',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--hairline)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '1rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
          }}
        >
          <span style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>
            100%
          </span>
          <span
            style={{
              fontSize: '0.62rem',
              color: 'var(--ink-soft)',
              marginTop: '4px',
              lineHeight: 1.2,
              maxWidth: '7em',
            }}
          >
            Transmisi Paket Sinyal
          </span>
        </div>

        {/* Index Badge Card */}
        <article
          style={{
            maxWidth: '26rem',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-card)',
            padding: '1.5rem',
            border: '1px solid var(--hairline)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                padding: '4px 12px',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--brand)',
                border: '1px solid var(--hairline)',
              }}
            >
              #01
            </span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
              Jantung Kota Tegal
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', lineHeight: 1.6, margin: 0 }}>
            Dari koridor Masjid Agung hingga pedestrian Jalan Pancasila, observasi iklim mikro pesisir terpantau presisi
            setiap 5 detik melalui jaringan nirkabel ESP32-S3.
          </p>
        </article>
      </div>

      {/* Zone Pill Tabs: 1-Click Direct Selector */}
      <nav className="zone-pill-tabs" aria-label="Pilihan Zona Observasi">
        {zones.map((zone, idx) => {
          const isActive = activeZoneIndex === idx;
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => setActiveZoneIndex(idx)}
              className={`zone-pill-tab ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'true' : 'false'}
            >
              <span className="zone-tab-num">0{idx + 1}</span>
              <span>{zone.name}</span>
              {isActive && <Sparkles size={13} style={{ color: 'var(--brand-light)' }} />}
            </button>
          );
        })}
      </nav>

      {/* 3D Spatial Deck Stage Framed by Oversized Ghost Typography */}
      <div className="zone-deck-stage">
        {/* Row 1 Ghost Text Background */}
        <div
          className="zone-ghost-text"
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 600,
            textTransform: 'uppercase',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <span style={{ color: 'var(--ghost)' }}>MONITORING</span>
          <span style={{ color: 'var(--ghost)' }}>PRESISI</span>
        </div>

        {/* 3D Multi-Card Stacked Deck */}
        {zones.map((zone, idx) => {
          const offset = (idx - activeZoneIndex + zones.length) % zones.length;
          const isActive = offset === 0;
          const isNext = offset === 1;
          const isPrev = offset === 2;

          let transformStyle = '';
          let zIndex = 10;
          let opacity = 0.7;
          let filter = 'brightness(0.68)';

          if (isActive) {
            zIndex = 30;
            opacity = 1;
            filter = 'none';
            if (tilt.isHovered) {
              transformStyle = `translate3d(0, 0, 0) scale(1) rotateX(${tilt.rotX}deg) rotateY(${tilt.rotY}deg)`;
            } else if (touchDeltaX !== 0) {
              transformStyle = `translate3d(${touchDeltaX}px, 0, 0) scale(1) rotate(${touchDeltaX * 0.12}deg)`;
            } else {
              transformStyle = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
            }
          } else if (isNext) {
            zIndex = 20;
            opacity = 0.86;
            filter = 'brightness(0.82)';
            transformStyle = 'translate3d(32px, -14px, -60px) scale(0.92) rotate(-3.5deg)';
          } else if (isPrev) {
            zIndex = 10;
            opacity = 0.72;
            filter = 'brightness(0.68)';
            transformStyle = 'translate3d(-32px, -24px, -120px) scale(0.84) rotate(4deg)';
          }

          return (
            <figure
              key={zone.id}
              className={`zone-deck-card ${isActive ? 'is-active' : isNext ? 'is-peeking-next' : 'is-peeking-prev'}`}
              onClick={() => {
                if (!isActive) {
                  setActiveZoneIndex(idx);
                }
              }}
              onMouseMove={isActive ? handleMouseMove : undefined}
              onMouseLeave={isActive ? handleMouseLeave : undefined}
              onTouchStart={isActive ? handleTouchStart : undefined}
              onTouchMove={isActive ? handleTouchMove : undefined}
              onTouchEnd={isActive ? handleTouchEnd : undefined}
              style={{
                transform: transformStyle,
                zIndex,
                opacity,
                filter,
                margin: 0,
              }}
              aria-label={`Kartu Observasi ${zone.name}`}
            >
              {/* Photo Image Layer with multi-extension fallbacks */}
              <picture style={{ width: '100%', height: '100%', display: 'block' }}>
                <source srcSet={zone.image.replace('.jpeg', '.webp')} type="image/webp" />
                <img
                  src={zone.image}
                  alt={zone.name}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.endsWith('.jpeg')) {
                      target.src = target.src.replace('.jpeg', '.webp');
                    } else if (target.src.endsWith('.webp')) {
                      target.src = target.src.replace('.webp', '.jpg');
                    } else if (target.src.endsWith('.jpg')) {
                      target.src = target.src.replace('.jpg', '.png');
                    } else if (target.src.endsWith('.png')) {
                      target.src = target.src.replace('.png', '.svg');
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </picture>

              {/* Scrim Contrast Gradients */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(8, 25, 46, 0.72) 0%, transparent 34%, transparent 56%, rgba(8, 25, 46, 0.92) 100%)',
                  pointerEvents: 'none',
                  zIndex: 5,
                }}
              />

              {/* Peeking Direct Switch Badges (for background cards) */}
              {!isActive && (
                <div
                  className="zone-peeking-badge"
                  style={{
                    left: isPrev ? '0.75rem' : 'auto',
                    right: isNext ? '0.75rem' : 'auto',
                  }}
                >
                  {isPrev && <ArrowLeft size={12} />}
                  <span>{isNext ? 'Berikutnya' : 'Sebelumnya'}</span>
                  {isNext && <ArrowRight size={12} />}
                </div>
              )}

              {/* Active Card Environmental HUD Overlay */}
              {isActive && (
                <>
                  {/* Top HUD Row: Live Beacon & Telemetry Sensor Metric */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      right: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '8px',
                      zIndex: 18,
                      pointerEvents: 'none',
                    }}
                  >
                    {/* Live Beacon Pill */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(8, 25, 46, 0.82)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        color: '#ffffff',
                        fontSize: '0.62rem',
                        fontWeight: 600,
                        letterSpacing: '0.03em',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                      }}
                    >
                      <span className="beacon-radar-pulse" />
                      <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>BEACON</span>
                    </div>

                    {/* Microclimate Telemetry Chip */}
                    <div
                      style={{
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-xl)',
                        background: 'rgba(8, 25, 46, 0.85)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: `1px solid ${zone.hudMetric.accent}55`,
                        boxShadow: `0 4px 16px ${zone.hudMetric.accent}25`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.55rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: zone.hudMetric.accent,
                          fontWeight: 700,
                        }}
                      >
                        {zone.hudMetric.label}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono, monospace)',
                            color: '#ffffff',
                            lineHeight: 1,
                          }}
                        >
                          {zone.hudMetric.getValue(telemetry)}
                        </span>
                        <span
                          style={{
                            fontSize: '0.56rem',
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-pill)',
                            background: `${zone.hudMetric.accent}30`,
                            color: zone.hudMetric.accent,
                            fontWeight: 600,
                          }}
                        >
                          {zone.hudMetric.status(telemetry)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center Node Target Reticle (Subtle Instrument Aesthetic) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '46%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 16,
                      pointerEvents: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      border: '1px dashed rgba(255, 255, 255, 0.25)',
                      background: 'rgba(8, 25, 46, 0.45)',
                      backdropFilter: 'blur(4px)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.58rem',
                      letterSpacing: '0.06em',
                      fontFamily: 'var(--font-mono, monospace)',
                      opacity: tilt.isHovered ? 0.95 : 0.45,
                      transition: 'opacity 0.3s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Compass size={11} style={{ color: 'var(--brand-light)' }} />
                    <span>NODE-S3 • {zone.coordinates}</span>
                  </div>

                  {/* Holographic Specular Glare Layer */}
                  <div
                    className="zone-card-glare"
                    style={{
                      opacity: tilt.isHovered ? 0.75 : 0,
                      background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.12) 35%, transparent 70%)`,
                    }}
                  />

                  {/* Holographic Prismatic Sheen */}
                  <div
                    className="zone-card-sheen"
                    style={{
                      opacity: tilt.isHovered ? 0.7 : 0.25,
                    }}
                  />

                  {/* Bottom Glass Telemetry Capsule */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 'auto 10px 10px 10px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-card)',
                      background: 'rgba(8, 25, 46, 0.85)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      color: '#ffffff',
                      zIndex: 18,
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          color: 'var(--brand-light)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {zone.tag}
                      </span>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          color: 'rgba(255, 255, 255, 0.65)',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 600,
                        }}
                      >
                        {`0${zone.id} / 03`}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#ffffff', lineHeight: 1.25 }}>
                      {zone.name}
                    </div>

                    <p
                      style={{
                        fontSize: '0.72rem',
                        color: 'rgba(255, 255, 255, 0.78)',
                        lineHeight: 1.45,
                        margin: '5px 0 8px 0',
                      }}
                    >
                      {zone.desc}
                    </p>

                    {/* Features Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                      {zone.features.map((feat) => (
                        <span
                          key={feat}
                          style={{
                            fontSize: '0.58rem',
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-pill)',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: 'rgba(255, 255, 255, 0.85)',
                          }}
                        >
                          {feat}
                        </span>
                      ))}
                    </div>

                    {/* Node Stream Status Footnote */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '6px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                        fontSize: '0.62rem',
                        color: 'var(--brand-light)',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Radio size={11} className="pulse-indicator" />
                        <span>{lastReceivedAt ? `Update: ${new Date(lastReceivedAt).toLocaleTimeString()}` : 'Node Aktif 5s'}</span>
                      </span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.6rem' }}>
                        Interaktif 3D
                      </span>
                    </div>
                  </div>
                </>
              )}
            </figure>
          );
        })}

        {/* Row 2 Ghost Text Background */}
        <div
          className="zone-ghost-text"
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 600,
            textTransform: 'uppercase',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <span style={{ color: 'var(--ink)' }}>UDARA</span>
          <span style={{ color: 'var(--ghost)' }}>PESISIR</span>
        </div>
      </div>

      {/* Mobile Swipe / Interaction Hint */}
      <div className="mobile-swipe-hint">
        ↔ Geser foto atau ketuk kartu di belakang untuk beralih zona
      </div>

      {/* Carousel Controls Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '3rem',
          position: 'relative',
          zIndex: 20,
        }}
      >
        {/* Prev Arrow */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Zona Sebelumnya"
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--hairline)',
            background: '#ffffff',
            color: 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--ink)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--hairline)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ArrowLeft size={18} />
        </button>

        {/* Center Zone Title & Counter */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--ink)', fontWeight: 600 }}>
            <MapPin size={13} style={{ color: 'var(--brand)' }} />
            <span>{currentZone.name}</span>
          </div>

          {/* Dots Indicator */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {zones.map((zone, idx) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => setActiveZoneIndex(idx)}
                aria-label={`Pilih ${zone.name}`}
                style={{
                  height: '6px',
                  width: activeZoneIndex === idx ? '26px' : '6px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: activeZoneIndex === idx ? 'var(--brand)' : 'var(--ghost)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Next Arrow */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Zona Berikutnya"
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--ink)',
            background: 'var(--ink)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--brand-deep)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--ink)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}
