import { useState } from 'react';
import {
  Car,
  CheckCircle2,
  RotateCcw,
  Radio,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import type { TelemetryData } from '../../telemetry/types';
import { getParkingStatusGrade } from '../../telemetry/formatters';

interface SmartParkingSectionProps {
  telemetry: TelemetryData | null | undefined;
  targetDeviceId: string;
  isMqttConnected: boolean;
  onResetParking: () => void;
}

export function SmartParkingSection({
  telemetry,
  targetDeviceId,
  isMqttConnected,
  onResetParking,
}: SmartParkingSectionProps) {
  const [isResetting, setIsResetting] = useState(false);

  const totalSlots = telemetry?.parking_total_slots ?? telemetry?.parking?.total_slots ?? 10;
  const occupiedSlots = Math.max(
    0,
    Math.min(
      totalSlots,
      telemetry?.parking_occupied_slots ?? telemetry?.parking?.occupied_slots ?? 0
    )
  );
  const availableSlots = Math.max(
    0,
    telemetry?.parking_available_slots ??
      telemetry?.parking?.available_slots ??
      totalSlots - occupiedSlots
  );

  const isFull = telemetry?.is_parking_full ?? telemetry?.parking?.is_full ?? (occupiedSlots >= totalSlots);
  const isEntryOpen = telemetry?.entry_gate_open ?? telemetry?.parking?.entry_gate_open ?? false;
  const isExitOpen = telemetry?.exit_gate_open ?? telemetry?.parking?.exit_gate_open ?? false;
  const isIrEntryDetected = telemetry?.ir_entry_detected ?? telemetry?.parking?.ir_entry_detected ?? false;
  const isIrExitDetected = telemetry?.ir_exit_detected ?? telemetry?.parking?.ir_exit_detected ?? false;

  const parkingGrade = getParkingStatusGrade(availableSlots, totalSlots);

  const handleResetClick = () => {
    setIsResetting(true);
    onResetParking();
    setTimeout(() => {
      setIsResetting(false);
    }, 800);
  };

  // Generate array of 10 slots
  const slotsArray = Array.from({ length: totalSlots }, (_, i) => {
    const slotNumber = i + 1;
    const isOccupied = slotNumber <= occupiedSlots;
    return {
      id: `P-${slotNumber.toString().padStart(2, '0')}`,
      isOccupied,
      index: slotNumber,
    };
  });

  return (
    <section
      id="smart-parking"
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
              background: isFull ? 'var(--state-offline)' : 'var(--state-online)',
              boxShadow: isFull ? '0 0 10px var(--state-offline)' : '0 0 8px var(--state-online)',
            }}
          />
          <span>Smart Mobility &amp; Parking Hub</span>
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
              Smart Parking 10 Lahan &amp; Palang Otomatis
            </h2>
            <p
              style={{
                color: 'var(--ink-soft)',
                marginTop: '0.5rem',
                maxWidth: '680px',
                fontSize: '0.98rem',
                lineHeight: 1.6,
              }}
            >
              Sistem manajemen parkir mandiri kawasan Alun-Alun Tegal berbasis kendali <strong>2 sensor infrared</strong> (GPIO 1 &amp; GPIO 2)
              dan <strong>2 motor servo</strong> (GPIO 21 &amp; GPIO 47). Sistem menghitung kapasitas kosong dan mengunci palang masuk saat terisi penuh.
            </p>
          </div>

          {/* Node Target Badge */}
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

      {/* Overview Stat Cards Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Available Slots */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-card)',
            border: `1px solid ${parkingGrade.borderColor}`,
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-soft)', letterSpacing: '0.05em' }}>
              Slot Parkir Bebas
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: parkingGrade.bgColor,
                color: parkingGrade.color,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {parkingGrade.badgeText}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: parkingGrade.color, lineHeight: 1 }}>
              {availableSlots}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink-soft)' }}>
              / {totalSlots} Slot
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginTop: '8px', marginBottom: 0 }}>
            {parkingGrade.description}
          </p>
        </div>

        {/* Occupied Slots */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--hairline)',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-soft)', letterSpacing: '0.05em' }}>
              Mobil Terparkir
            </span>
            <Car size={18} style={{ color: 'var(--brand)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--ink)', lineHeight: 1 }}>
              {occupiedSlots}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink-soft)' }}>
              Kendaraan
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginTop: '8px', marginBottom: 0 }}>
            Tingkat keterisian saat ini mencapai <strong>{parkingGrade.occupancyPercent}%</strong>.
          </p>
        </div>

        {/* Gate Operational Status */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--hairline)',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-soft)', letterSpacing: '0.05em' }}>
              Otomasi Gerbang Palang
            </span>
            <ShieldCheck size={18} style={{ color: isFull ? 'var(--state-offline)' : 'var(--state-online)' }} />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: isFull ? 'var(--state-offline)' : 'var(--ink)', marginTop: '4px' }}>
            {isFull ? 'Akses Masuk Terkunci' : 'Gerbang Aktif Normal'}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginTop: '8px', marginBottom: 0 }}>
            {isFull
              ? 'Sensor Masuk tidak akan membuka palang hingga ada kendaraan yang keluar.'
              : 'Palang masuk & keluar membuka otomatis saat kendaraan terdeteksi sensor IR.'}
          </p>
        </div>
      </div>

      {/* Gates & IR Sensors Live Telemetry Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Entry Gate (Pintu Masuk) */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.04), rgba(56, 189, 248, 0.08))',
            borderRadius: 'var(--radius-card)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(6, 182, 212, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand)',
                }}
              >
                <ArrowDownRight size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
                  Pintu Masuk (Entry Gate)
                </h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                  Sensor IR: <code>GPIO 1</code> · Servo: <code>GPIO 21</code>
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: isEntryOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.08)',
                color: isEntryOpen ? '#10b981' : 'var(--ink-soft)',
                border: isEntryOpen ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--hairline)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {isEntryOpen ? 'PALANG TERBUKA (90°)' : 'PALANG TERTUTUP (0°)'}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              backgroundColor: '#ffffff',
              padding: '12px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--hairline)',
              marginBottom: '10px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', display: 'block' }}>Sensor IR Masuk:</span>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: isIrEntryDetected ? '#f43f5e' : 'var(--ink)',
                }}
              >
                {isIrEntryDetected ? '🔴 Terdeteksi Mobil' : '⚪ Bebas / Kosong'}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', display: 'block' }}>Status Palang Masuk:</span>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: isEntryOpen ? '#10b981' : 'var(--ink)',
                }}
              >
                {isEntryOpen ? '🟢 Terangkat (Open)' : '🔒 Tertutup (Closed)'}
              </span>
            </div>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
            {isFull
              ? '⛔ Kapasitas 10/10 telah penuh. Palang masuk otomatis terkunci rapat agar tidak menimbulkan kemacetan di dalam lahan.'
              : 'Otomatis: Saat mobil datang (IR LOW), palang naik ke 90°. Setelah lewat + jeda 1.5s, palang turun ke 0° dan kuota bertambah.'}
          </p>
        </div>

        {/* Exit Gate (Pintu Keluar) */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04), rgba(6, 182, 212, 0.08))',
            borderRadius: 'var(--radius-card)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                }}
              >
                <ArrowUpRight size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
                  Pintu Keluar (Exit Gate)
                </h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                  Sensor IR: <code>GPIO 2</code> · Servo: <code>GPIO 47</code>
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: isExitOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.08)',
                color: isExitOpen ? '#10b981' : 'var(--ink-soft)',
                border: isExitOpen ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--hairline)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {isExitOpen ? 'PALANG TERBUKA (90°)' : 'PALANG TERTUTUP (0°)'}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              backgroundColor: '#ffffff',
              padding: '12px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--hairline)',
              marginBottom: '10px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', display: 'block' }}>Sensor IR Keluar:</span>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: isIrExitDetected ? '#f43f5e' : 'var(--ink)',
                }}
              >
                {isIrExitDetected ? '🔴 Terdeteksi Mobil' : '⚪ Bebas / Kosong'}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', display: 'block' }}>Status Palang Keluar:</span>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: isExitOpen ? '#10b981' : 'var(--ink)',
                }}
              >
                {isExitOpen ? '🟢 Terangkat (Open)' : '🔒 Tertutup (Closed)'}
              </span>
            </div>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
            Otomatis: Saat mobil selesai parkir dan menuju pintu keluar (IR LOW), palang membuka ke 90°.
            Setelah lewat + jeda 1.5s, palang turun ke 0° dan slot parkir kosong bertambah 1.
          </p>
        </div>
      </div>

      {/* 10-Bay Interactive Parking Grid */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--hairline)',
          padding: '1.75rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'var(--brand)' }} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)' }}>
                Denah Virtual 10 Lahan Parkir Alun-Alun
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
              Visualisasi real-time alokasi petak kendaraan masuk dan keluar.
            </p>
          </div>

          {/* Reset Slot Button for Testing */}
          <button
            type="button"
            onClick={handleResetClick}
            disabled={isResetting || !isMqttConnected}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--hairline)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--ink)',
              cursor: isMqttConnected ? 'pointer' : 'not-allowed',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.2s ease',
              opacity: isMqttConnected ? 1 : 0.6,
            }}
            title="Kirim perintah MQTT untuk mereset kuota parkir kembali ke 0 terisi / 10 kosong"
          >
            <RotateCcw
              size={14}
              style={{
                transform: isResetting ? 'rotate(-360deg)' : 'none',
                transition: 'transform 0.6s ease',
                color: 'var(--brand)',
              }}
            />
            <span>{isResetting ? 'Mereset Kuota...' : '↺ Reset Kuota Parkir (Set 0 Terisi)'}</span>
          </button>
        </div>

        {/* Grid 10 Slots */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '12px',
          }}
        >
          {slotsArray.map((slot) => (
            <div
              key={slot.id}
              style={{
                borderRadius: 'var(--radius-lg)',
                border: slot.isOccupied ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid rgba(16, 185, 129, 0.35)',
                backgroundColor: slot.isOccupied ? 'rgba(15, 23, 42, 0.04)' : '#ffffff',
                padding: '14px 12px',
                textAlign: 'center',
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: slot.isOccupied ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.08)',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ink-soft)',
                  marginBottom: '8px',
                }}
              >
                {slot.id}
              </div>

              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  margin: '0 auto 8px',
                  backgroundColor: slot.isOccupied ? 'rgba(15, 23, 42, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: slot.isOccupied ? 'var(--ink-soft)' : '#10b981',
                }}
              >
                {slot.isOccupied ? <Car size={22} /> : <CheckCircle2 size={22} />}
              </div>

              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: slot.isOccupied ? 'rgba(15, 23, 42, 0.08)' : 'rgba(16, 185, 129, 0.15)',
                  color: slot.isOccupied ? 'var(--ink)' : '#10b981',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {slot.isOccupied ? 'TERPARKIR' : 'KOSONG'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
