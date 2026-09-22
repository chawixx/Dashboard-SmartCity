import { useState, useEffect } from 'react';
import { type TelemetryData } from '../../telemetry/types';
import { Thermometer, Droplets, Wind, Cpu, Wifi, AlertTriangle, CloudRain, Waves } from 'lucide-react';
import { AtmosphericCanvas } from '../3d/AtmosphericCanvas';

interface HeroSectionProps {
  telemetry: TelemetryData | null;
  formattedUptime: string;
  isReady: boolean;
  isHazard?: boolean;
}

export function HeroSection({
  telemetry,
  formattedUptime,
  isReady,
  isHazard = false,
}: HeroSectionProps) {
  // Auto-advancing telemetry card slider (3.8s interval per PRD)
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      label: 'DHT22 SENSOR',
      title: 'Suhu Udara',
      value: telemetry ? `${telemetry.temperature_c.toFixed(1)}°C` : '--.-°C',
      sub: 'Termal Pantura',
      icon: <Thermometer size={16} color="var(--signal-temp)" />,
      color: 'var(--signal-temp)',
    },
    {
      label: 'DHT22 SENSOR',
      title: 'Kelembaban',
      value: telemetry ? `${telemetry.humidity_percent.toFixed(1)}%` : '--.-%',
      sub: 'Uap Air Relatif',
      icon: <Droplets size={16} color="var(--brand-light)" />,
      color: 'var(--brand-light)',
    },
    {
      label: 'MQ135 ANALOG',
      title: 'Kualitas Gas',
      value: telemetry ? `${telemetry.mq135_raw} ADC` : '---- ADC',
      sub: telemetry ? `${telemetry.mq135_sensor_mv.toFixed(0)} mV` : '-- mV',
      icon: <Wind size={16} color="var(--brand)" />,
      color: 'var(--brand)',
    },
    {
      label: 'RAIN SENSOR (PIN 8)',
      title: 'Presipitasi Hujan',
      value: telemetry?.rain_status ?? (telemetry?.rain_raw !== undefined ? (telemetry.is_raining ? 'Hujan' : 'Kering') : '--'),
      sub: telemetry?.rain_raw !== undefined ? `${telemetry.rain_raw} ADC` : '-- ADC',
      icon: <CloudRain size={16} color="var(--brand-light)" />,
      color: 'var(--brand-light)',
    },
    {
      label: 'WATER LEVEL (PIN 10)',
      title: 'Level Air Sungai',
      value: telemetry?.flood_status ?? (telemetry?.water_level_cm !== undefined ? `${telemetry.water_level_cm.toFixed(1)} cm` : '--'),
      sub: telemetry?.water_level_cm !== undefined ? `${telemetry.water_level_cm.toFixed(1)} cm (${telemetry.water_level_raw ?? '--'} ADC)` : '-- ADC',
      icon: <Waves size={16} color={telemetry?.flood_status === 'Bahaya Banjir' || telemetry?.flood_status === 'Siaga' ? '#f43f5e' : 'var(--brand-light)'} />,
      color: telemetry?.flood_status === 'Bahaya Banjir' || telemetry?.flood_status === 'Siaga' ? '#f43f5e' : 'var(--brand-light)',
    },
  ];

  useEffect(() => {
    if (!isReady) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isReady, slides.length]);

  const currentSlide = slides[activeSlide];

  return (
    <section
      className="hero-container"
      style={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        backgroundColor: 'var(--brand-deep)',
        color: '#ffffff',
        borderRadius: 'var(--radius-card-lg)',
        boxShadow: isHazard
          ? '0 24px 60px -15px rgba(244, 63, 94, 0.35), 0 0 40px rgba(251, 146, 60, 0.2)'
          : '0 24px 60px -15px rgba(4, 12, 23, 0.7)',
        border: isHazard ? '1.5px solid rgba(251, 146, 60, 0.65)' : 'none',
        transition: 'border 0.5s ease, box-shadow 0.5s ease',
      }}
    >
      {/* Background Plate with Gradient */}
      <img
        src="/assets/tegal/hero-alun-alun.jpeg"
        alt="Alun-Alun Tegal Atmospheric Background"
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
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 40%',
          zIndex: -10,
          transform: 'scale(1.04)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: -9,
          background: 'linear-gradient(to bottom, rgba(8, 25, 46, 0.65) 0%, rgba(8, 25, 46, 0.40) 50%, rgba(8, 25, 46, 0.88) 100%)',
        }}
      />

      {/* 3D Atmospheric Maritime Particle Flow Field (Three.js) */}
      <AtmosphericCanvas
        temperature={telemetry?.temperature_c}
        humidity={telemetry?.humidity_percent}
        mq135Raw={telemetry?.mq135_raw}
        isHazard={isHazard}
      />

      {/* Spacer for Top Header */}
      <div className="hero-top-spacer" />

      {/* Giant Kinetic Title */}
      <div className="hero-title-container">
        <h1
          id="hero-title"
          className="hero-title-text"
          style={{
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            margin: 0,
            color: '#ffffff',
            opacity: isReady ? 1 : 0,
            transform: isReady ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 1s ease 0.2s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
          }}
        >
          Nafas Kota Bahari
        </h1>
      </div>

      {/* Bottom Row */}
      <div className="hero-bottom-row">
        {/* Left Tagline */}
        <div
          style={{
            opacity: isReady ? 1 : 0,
            transform: isReady ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.9s ease 0.4s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
          }}
        >
          <p
            className="hero-tagline-text"
            style={{
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
            }}
          >
            Ruang Terbuka,
            <br />
            Data Realtime
          </p>
          <div className="eyebrow" style={{ marginTop: '0.8rem', color: isHazard ? '#fb923c' : 'var(--brand-light)' }}>
            <span className="eyebrow-dot" style={{ background: isHazard ? '#f43f5e' : 'var(--brand-light)' }} />
            {isHazard ? (
              <span style={{ color: '#fb923c', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <AlertTriangle size={12} color="#f43f5e" />
                PERINGATAN AMBANG BATAS SENSOR AKTIF
              </span>
            ) : (
              <span>Alun-Alun Kota Tegal • 6°52'S 109°08'E</span>
            )}
          </div>
        </div>

        {/* Right Cluster: Auto-Advancing Telemetry Card + Station Health */}
        <div
          className="hero-cards-cluster"
          style={{
            opacity: isReady ? 1 : 0,
            transform: isReady ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.9s ease 0.6s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.6s',
          }}
        >
          {/* Live Telemetry Slider Card */}
          <div
            className="hero-telemetry-card"
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-card)',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.12em', color: currentSlide.color, textTransform: 'uppercase' }}>
                {currentSlide.label}
              </span>
              <div style={{ width: '24px', height: '24px', borderRadius: 'var(--radius-pill)', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentSlide.icon}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', display: 'block' }}>
                  {currentSlide.title}
                </span>
                <span className="mono-text" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ffffff' }}>
                  {currentSlide.value}
                </span>
              </div>
              <span className="mono-text" style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                {currentSlide.sub}
              </span>
            </div>

            {/* Carousel Dots */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  style={{
                    height: '4px',
                    width: activeSlide === idx ? '18px' : '6px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: activeSlide === idx ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Hardware Health Card */}
          <div
            className="hero-health-card"
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-card)',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Cpu size={14} color="var(--brand-light)" />
                <span style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.7)' }}>
                  ESP32-S3 Node
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <Wifi size={12} color="var(--state-online)" />
                <span className="mono-text" style={{ fontSize: '0.86rem', fontWeight: 600, color: '#ffffff' }}>
                  {telemetry ? `${telemetry.wifi_rssi_dbm} dBm` : '-- dBm'}
                </span>
              </div>
              <span className="mono-text" style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)', display: 'block', marginTop: '2px' }}>
                Up: {formattedUptime}
              </span>
            </div>

            {/* Avatar Dots & Mini Node Thumbnail */}
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-xl)',
                background: 'rgba(4, 12, 23, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src="/assets/tegal/sensor-node.webp"
                alt="ESP32-S3 Node Enclosure"
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
          </div>
        </div>
      </div>
    </section>
  );
}
