import {
  Lightbulb,
  Power,
  Zap,
  MapPin,
  Cpu,
  Radio,
  Sun,
  Moon,
  Sliders,
} from 'lucide-react';
import { type TelemetryData, type RelayStates, type LightingMode } from '../../telemetry/types';
import {
  SECTOR_LIGHTING_CONFIGS,
  calculateLightingStats,
  getAmbientLightGrade,
  type SectorLightingConfig,
} from '../../telemetry/formatters';

interface SectorLightingControlSectionProps {
  telemetry: TelemetryData | null;
  relayStates: RelayStates;
  lightingMode?: LightingMode;
  onSetLightingMode?: (mode: LightingMode) => void;
  onToggleRelay: (relayId: 1 | 2 | 3 | 4, nextState: boolean) => void;
  onToggleAllRelays: (nextState: boolean) => void;
  targetDeviceId: string;
  isMqttConnected: boolean;
}

export function SectorLightingControlSection({
  telemetry,
  relayStates,
  lightingMode,
  onSetLightingMode,
  onToggleRelay,
  onToggleAllRelays,
  targetDeviceId,
  isMqttConnected,
}: SectorLightingControlSectionProps) {
  const stats = calculateLightingStats(relayStates);
  const currentMode: LightingMode = lightingMode || telemetry?.lighting_mode || 'auto';
  const ambientGrade = getAmbientLightGrade(telemetry?.ldr_raw, telemetry?.ambient_light);

  const handleToggle = (sector: SectorLightingConfig) => {
    // If in auto mode and user clicks manual relay button, switch to manual mode automatically
    if (currentMode === 'auto' && onSetLightingMode) {
      onSetLightingMode('manual');
    }
    const currentState = !!relayStates[sector.key];
    const nextState = !currentState;
    onToggleRelay(sector.id, nextState);
  };

  const handleAll = (turnOn: boolean) => {
    if (currentMode === 'auto' && onSetLightingMode) {
      onSetLightingMode('manual');
    }
    onToggleAllRelays(turnOn);
  };

  const handleModeSwitch = (mode: LightingMode) => {
    if (onSetLightingMode) {
      onSetLightingMode(mode);
    }
  };

  return (
    <section
      id="lighting-control"
      className="editorial-section"
      style={{
        backgroundColor: '#ffffff',
        position: 'relative',
      }}
    >
      {/* Section Header */}
      <div>
        <div className="eyebrow" style={{ color: 'var(--brand)' }}>
          <span
            className="eyebrow-dot pulse-indicator"
            style={{
              background: stats.activeCount > 0 ? 'var(--state-online)' : 'var(--brand)',
              boxShadow: stats.activeCount > 0 ? '0 0 10px var(--state-online)' : '0 0 8px var(--brand)',
            }}
          />
          <span>Kendali Aktuator Smart City</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '1.5rem',
            marginTop: '0.85rem',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h2
              className="editorial-heading"
              style={{
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              Penerangan & Relay 4 Sektor
            </h2>
            <p
              style={{
                color: 'var(--ink-soft)',
                marginTop: '0.5rem',
                maxWidth: '640px',
                fontSize: '0.98rem',
                lineHeight: 1.6,
              }}
            >
              Sistem kendali dan monitoring telemetri aktif untuk 4 zona penerangan kota mandiri
              Alun-Alun Tegal. Terhubung langsung ke modul <strong>Relay 4-Channel optocoupler</strong> melalui
              GPIO mikrokontroler ESP32-S3.
            </p>
          </div>

          {/* Target Node Connection Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 16px',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--hairline)',
              fontSize: '0.8rem',
            }}
          >
            <Radio
              size={15}
              style={{
                color: isMqttConnected ? 'var(--state-online)' : 'var(--state-stale)',
              }}
            />
            <span style={{ color: 'var(--ink-soft)' }}>Node Target:</span>
            <code
              style={{
                fontWeight: 600,
                color: 'var(--ink)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {targetDeviceId}
              {telemetry ? ` (Seq #${telemetry.sequence})` : ''}
            </code>
          </div>
        </div>
      </div>

      {/* Dual Mode Switch & LDR Ambient Lighting Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(8, 25, 46, 0.03), rgba(6, 182, 212, 0.05))',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--hairline)',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          alignItems: 'center',
        }}
      >
        {/* Left: Mode Selection Switcher */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sliders size={18} style={{ color: 'var(--brand)' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)' }}>
              Mode Kontrol Penerangan
            </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px 0' }}>
            {currentMode === 'auto' ? 'Mode Otomatis (Sensor LDR)' : 'Mode Manual (Operator Web)'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
            {currentMode === 'auto'
              ? 'Lampu menyala/padam otomatis sesuai resistansi sensor cahaya LDR (GPIO 9). Ambien gelap menyalakan semua sektor, ambien terang memadamkan lampu.'
              : 'Sensor LDR di-bypass. Operator memegang kendali penuh mengaktifkan sakelar relay per sektor melalui tombol website di bawah ini.'}
          </p>

          {/* Segmented Switch Buttons */}
          <div
            style={{
              display: 'inline-flex',
              padding: '4px',
              backgroundColor: 'rgba(8, 25, 46, 0.08)',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--hairline)',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => handleModeSwitch('auto')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: currentMode === 'auto' ? '#10b981' : 'transparent',
                color: currentMode === 'auto' ? '#ffffff' : 'var(--ink-soft)',
                boxShadow: currentMode === 'auto' ? '0 2px 8px rgba(16, 185, 129, 0.35)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Sun size={15} />
              <span>☀️ Mode Otomatis (LDR)</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeSwitch('manual')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: currentMode === 'manual' ? '#0f172a' : 'transparent',
                color: currentMode === 'manual' ? '#ffffff' : 'var(--ink-soft)',
                boxShadow: currentMode === 'manual' ? '0 2px 8px rgba(15, 23, 42, 0.35)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Power size={15} />
              <span>🎛️ Mode Manual (Web)</span>
            </button>
          </div>
        </div>

        {/* Right: Real-time LDR Ambient Light Gauge */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            border: `1px solid ${ambientGrade.borderColor}`,
            padding: '1.25rem 1.5rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: ambientGrade.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: ambientGrade.color,
                }}
              >
                {ambientGrade.isDark ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-soft)' }}>
                  Sensor Cahaya Ambien
                </span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: ambientGrade.color }}>
                  {ambientGrade.label}
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: ambientGrade.bgColor,
                color: ambientGrade.color,
                border: `1px solid ${ambientGrade.borderColor}`,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {ambientGrade.badgeText}
            </span>
          </div>

          {/* Progress / Brightness Bar */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Tingkat Kecerahan:</span>
              <span style={{ fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
                {ambientGrade.percent}% ({telemetry?.ldr_raw ?? 1000} ADC)
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0, 0, 0, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${ambientGrade.percent}%`,
                  height: '100%',
                  backgroundColor: ambientGrade.color,
                  transition: 'width 0.4s ease, background-color 0.4s ease',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
            <span>Pin: <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink)' }}>GPIO 9 (ADC1)</code></span>
            <span>Threshold: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>&gt;3000 Menyala | &lt;3000 Mati</code></span>
          </div>
        </div>
      </div>

      {/* Master Control & Monitoring Overview Bar */}
      <div
        style={{
          background: 'var(--brand-deep)',
          borderRadius: 'var(--radius-card)',
          padding: '1.75rem 2rem',
          color: '#ffffff',
          marginBottom: '2rem',
          boxShadow: '0 12px 36px rgba(8, 25, 46, 0.12)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        {/* Left: Summary Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '1.5rem',
            flex: '1 1 400px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '4px',
              }}
            >
              Status Sektor
            </div>
            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                color: stats.activeCount > 0 ? 'var(--brand-light)' : '#ffffff',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>
                {stats.activeCount} <span style={{ fontSize: '1rem', opacity: 0.5 }}>/ 4 ON</span>
              </span>
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '4px',
              }}
            >
              Total Beban Daya
            </div>
            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                color: stats.activeCount > 0 ? '#fbbf24' : 'rgba(255, 255, 255, 0.7)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {stats.totalWatt}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.6)' }}>
                Watt
              </span>
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '4px',
              }}
            >
              Titik Lampu
            </div>
            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {stats.totalFixtures}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.6)' }}>
                Fixtures
              </span>
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '4px',
              }}
            >
              Bus Relay Modul
            </div>
            <div
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#ffffff',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Cpu size={15} style={{ color: 'var(--brand-light)' }} />
              <span>4-CH Opto Isolated</span>
            </div>
          </div>
        </div>

        {/* Right: Master Control Actions */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={() => handleAll(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '10px 20px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.35)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(14, 165, 233, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.35)';
            }}
          >
            <Lightbulb size={16} />
            <span>Nyalakan Semua</span>
          </button>

          <button
            type="button"
            onClick={() => handleAll(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: 'var(--radius-pill)',
              padding: '10px 20px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            <Power size={16} />
            <span>Matikan Semua</span>
          </button>
        </div>
      </div>

      {/* 4 Sector Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {SECTOR_LIGHTING_CONFIGS.map((sector) => {
          const isOn = !!relayStates[sector.key];

          return (
            <div
              key={sector.id}
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-card)',
                border: isOn
                  ? `2px solid ${sector.color}`
                  : '1px solid var(--hairline)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isOn
                  ? `0 14px 34px ${sector.accentGlow}`
                  : '0 4px 16px rgba(0, 0, 0, 0.03)',
              }}
            >
              {/* Subtle top indicator bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: isOn ? sector.color : 'transparent',
                  transition: 'background-color 0.3s ease',
                }}
              />

              <div>
                {/* Header Tag & Pin Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-soft)',
                    }}
                  >
                    {sector.sectorTag}
                  </span>

                  {/* Mode & Hardware Pin Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        backgroundColor: currentMode === 'auto' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(15, 23, 42, 0.08)',
                        color: currentMode === 'auto' ? '#059669' : '#334155',
                        border: currentMode === 'auto' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(15, 23, 42, 0.15)',
                      }}
                    >
                      {currentMode === 'auto' ? '🤖 AUTO' : '👤 MANUAL'}
                    </span>

                    {/* Hardware Pin Badge */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: isOn ? 'rgba(8, 25, 46, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--ink)',
                        border: '1px solid var(--hairline)',
                      }}
                    >
                      <Zap size={12} style={{ color: sector.color }} />
                      <span>
                        {sector.pinName} &gt; GPIO {sector.gpio}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Light Lens Graphic & Status Indicator */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '1.25rem',
                  }}
                >
                  {/* Glowing LED Orb */}
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isOn ? sector.color : '#e2e8f0',
                      boxShadow: isOn
                        ? `0 0 24px ${sector.color}, 0 0 48px ${sector.accentGlow}`
                        : 'inset 0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.35s ease',
                      flexShrink: 0,
                    }}
                  >
                    <Lightbulb
                      size={28}
                      style={{
                        color: isOn ? '#ffffff' : '#94a3b8',
                        filter: isOn ? 'drop-shadow(0 0 6px #ffffff)' : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  </div>

                  <div>
                    <h3
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: 'var(--ink)',
                        lineHeight: 1.3,
                        marginBottom: '4px',
                      }}
                    >
                      {sector.name}
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.78rem',
                        color: 'var(--ink-soft)',
                      }}
                    >
                      <MapPin size={13} style={{ color: 'var(--brand)' }} />
                      <span>{sector.areaName}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: '0.84rem',
                    lineHeight: 1.55,
                    color: 'var(--ink-soft)',
                    marginBottom: '1.25rem',
                  }}
                >
                  {sector.description}
                </p>

                {/* Fixture & Lighting Type Info */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--hairline)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '10px 14px',
                    marginBottom: '1.5rem',
                    fontSize: '0.78rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-soft)' }}>Armatur:</span>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{sector.lightingType}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-soft)' }}>Beban Daya:</span>
                    <span style={{ fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
                      {sector.unitWattage} Watt ({sector.fixtureCount} titik)
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Live Status & Tactile Button */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>Status Relay:</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      backgroundColor: isOn
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(100, 116, 139, 0.1)',
                      color: isOn ? '#059669' : '#64748b',
                      border: isOn
                        ? '1px solid rgba(16, 185, 129, 0.35)'
                        : '1px solid rgba(100, 116, 139, 0.2)',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: isOn ? '#10b981' : '#94a3b8',
                        boxShadow: isOn ? '0 0 6px #10b981' : 'none',
                      }}
                    />
                    <span>{isOn ? 'MENYALA (AKTIF)' : 'PADAM (STANDBY)'}</span>
                  </span>
                </div>

                {/* Tactile Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleToggle(sector)}
                  aria-pressed={isOn}
                  aria-label={`Ubah status ${sector.name} ke ${isOn ? 'Mati' : 'Nyala'}`}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-xl)',
                    border: 'none',
                    background: isOn
                      ? 'linear-gradient(135deg, #0f172a, #1e293b)'
                      : 'linear-gradient(135deg, #0284c7, #0369a1)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: isOn
                      ? '0 4px 12px rgba(15, 23, 42, 0.25)'
                      : '0 4px 14px rgba(2, 132, 199, 0.35)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Power size={16} style={{ color: isOn ? '#f43f5e' : '#38bdf8' }} />
                    <span>{isOn ? 'Matikan Sektor Ini' : 'Nyalakan Sektor Ini'}</span>
                  </span>

                  {/* Switch Pill Graphic */}
                  <span
                    style={{
                      width: '38px',
                      height: '20px',
                      borderRadius: '10px',
                      backgroundColor: isOn ? '#10b981' : 'rgba(255, 255, 255, 0.25)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px',
                      boxSizing: 'border-box',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        transform: isOn ? 'translateX(18px)' : 'translateX(0)',
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}
                    />
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
