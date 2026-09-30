/**
 * Formatting and Display Utilities for Environmental Telemetry
 * Strictly adheres to PRD Section 12, 14, 23, and DESIGN.md
 */

import { type AirQualityStatus, type RelayStates, type TelemetryData } from './types';

/**
 * Formats seconds into HH:MM:SS string.
 * Example: 381 -> "00:06:21" (PRD Section 12)
 */
export function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00:00';
  }

  const sec = Math.floor(seconds % 60);
  const min = Math.floor((seconds / 60) % 60);
  const hrs = Math.floor(seconds / 3600);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hrs)}:${pad(min)}:${pad(sec)}`;
}

export interface RssiQuality {
  label: string;
  bars: number;
  color: string;
}

/**
 * Returns Wi-Fi signal quality tier and visual bar count.
 */
export function getRssiQuality(rssi: number): RssiQuality {
  if (rssi >= -60) {
    return { label: 'Excellent', bars: 4, color: 'var(--state-online)' };
  }
  if (rssi >= -70) {
    return { label: 'Good', bars: 3, color: 'var(--signal-humid)' };
  }
  if (rssi >= -85) {
    return { label: 'Fair', bars: 2, color: 'var(--state-stale)' };
  }
  return { label: 'Weak', bars: 1, color: 'var(--state-offline)' };
}

export interface AirQualityGrade {
  status: AirQualityStatus;
  label: string;
  badgeText: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  isPolluted: boolean;
}

/**
 * Evaluates MQ-135 raw reading or explicit status into human-readable air quality indicators.
 */
export function getAirQualityGrade(
  raw: number | null | undefined,
  explicitStatus?: AirQualityStatus
): AirQualityGrade {
  if (explicitStatus) {
    switch (explicitStatus) {
      case 'Sangat Bersih':
      case 'Udara Bersih':
        return {
          status: 'Sangat Bersih',
          label: 'Sangat Bersih',
          badgeText: 'SANGAT BERSIH',
          color: 'var(--state-online)',
          bgColor: 'rgba(16, 185, 129, 0.12)',
          borderColor: 'rgba(16, 185, 129, 0.35)',
          description: 'Kondisi udara ruang terbuka Alun-Alun sangat bersih, segar, dan bebas polusi.',
          isPolluted: false,
        };
      case 'Normal / Cukup Baik':
      case 'Sedang':
        return {
          status: 'Normal / Cukup Baik',
          label: 'Normal / Cukup Baik',
          badgeText: 'NORMAL / BAIK',
          color: 'var(--brand-light)',
          bgColor: 'rgba(6, 182, 212, 0.12)',
          borderColor: 'rgba(6, 182, 212, 0.35)',
          description: 'Kualitas udara dalam batas wajar dan aman di kawasan publik.',
          isPolluted: false,
        };
      case 'Polusi Ringan':
        return {
          status: 'Polusi Ringan',
          label: 'Polusi Ringan',
          badgeText: 'POLUSI RINGAN',
          color: 'var(--state-stale)',
          bgColor: 'rgba(245, 158, 11, 0.15)',
          borderColor: 'rgba(245, 158, 11, 0.45)',
          description: 'Terdeteksi peningkatan emisi gas buang atau asap tipis di sekitar kawasan.',
          isPolluted: false,
        };
      case 'Tercemar':
      case 'Tercemar Gas':
      case 'Sangat Tercemar':
        return {
          status: 'Tercemar',
          label: 'Tercemar',
          badgeText: 'TERCEMAR GAS',
          color: 'var(--state-offline)',
          bgColor: 'rgba(244, 63, 94, 0.15)',
          borderColor: 'rgba(244, 63, 94, 0.45)',
          description: 'Konsentrasi gas buang atau asap terdeteksi tinggi melampaui batas aman (>3000 ADC).',
          isPolluted: true,
        };
    }
  }

  // Fallback to evaluating raw ADC if explicitStatus is not present
  if (raw === null || raw === undefined) {
    return {
      status: 'Normal / Cukup Baik',
      label: 'Menunggu Data',
      badgeText: 'DATA TIDAK TERSEDIA',
      color: 'var(--text-muted)',
      bgColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.12)',
      description: 'Sensor sedang menginisialisasi pembacaan resistansi analog.',
      isPolluted: false,
    };
  }

  // User-defined Thresholds:
  // Sangat Bersih < 350
  // Normal / Cukup Baik < 1500
  // Polusi Ringan <= 3000
  // Tercemar > 3000
  if (raw < 350) {
    return {
      status: 'Sangat Bersih',
      label: 'Sangat Bersih',
      badgeText: 'SANGAT BERSIH',
      color: 'var(--state-online)',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      description: 'Kondisi udara ruang terbuka Alun-Alun sangat bersih, segar, dan bebas polusi (<350 ADC).',
      isPolluted: false,
    };
  }

  if (raw < 1500) {
    return {
      status: 'Normal / Cukup Baik',
      label: 'Normal / Cukup Baik',
      badgeText: 'NORMAL / BAIK',
      color: 'var(--brand-light)',
      bgColor: 'rgba(6, 182, 212, 0.12)',
      borderColor: 'rgba(6, 182, 212, 0.35)',
      description: 'Kualitas udara dalam batas wajar dan aman di kawasan publik (<1500 ADC).',
      isPolluted: false,
    };
  }

  if (raw <= 3000) {
    return {
      status: 'Polusi Ringan',
      label: 'Polusi Ringan',
      badgeText: 'POLUSI RINGAN',
      color: 'var(--state-stale)',
      bgColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.45)',
      description: 'Terdeteksi peningkatan emisi gas buang atau asap tipis di sekitar kawasan (<3000 ADC).',
      isPolluted: false,
    };
  }

  return {
    status: 'Tercemar',
    label: 'Tercemar',
    badgeText: 'TERCEMAR GAS',
    color: 'var(--state-offline)',
    bgColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.45)',
    description: 'Konsentrasi gas buang atau asap terdeteksi tinggi melampaui batas aman (>3000 ADC).',
    isPolluted: true,
  };
}

export interface SectorLightingConfig {
  id: 1 | 2 | 3 | 4;
  key: keyof RelayStates;
  pinName: string;
  gpio: number;
  name: string;
  sectorTag: string;
  areaName: string;
  description: string;
  lightingType: string;
  fixtureCount: number;
  unitWattage: number; // Watt
  color: string;
  accentGlow: string;
}

export const SECTOR_LIGHTING_CONFIGS: SectorLightingConfig[] = [
  {
    id: 1,
    key: 'relay1',
    pinName: 'IN1',
    gpio: 38,
    name: 'Sektor 01 — Kawasan Alun-Alun & Monumen Bahari',
    sectorTag: 'SEKTOR 01 / CENTRALE',
    areaName: 'Plaza Sentral & Monumen Bahari',
    description: 'Penerangan pedestrian taman utama, lingkar air mancur, dan ornamen tiang maritim Alun-Alun Tegal.',
    lightingType: 'Smart Pole LED 4000K & Ornamen Maritim',
    fixtureCount: 16,
    unitWattage: 45,
    color: '#38bdf8', // Sky Cyan
    accentGlow: 'rgba(56, 189, 248, 0.45)',
  },
  {
    id: 2,
    key: 'relay2',
    pinName: 'IN2',
    gpio: 39,
    name: 'Sektor 02 — Koridor Jl. KH Wahid Hasyim',
    sectorTag: 'SEKTOR 02 / KOMERSIAL',
    areaName: 'Koridor Bisnis & Sentra Kuliner Barat',
    description: 'Penerangan jalan umum (PJU) trotoar komersial, pertokoan barat, dan area parkir kuliner malam.',
    lightingType: 'PJU High-Lumen 5000K & Trotoar Publik',
    fixtureCount: 22,
    unitWattage: 60,
    color: '#0ea5e9', // Royal Blue
    accentGlow: 'rgba(14, 165, 233, 0.45)',
  },
  {
    id: 3,
    key: 'relay3',
    pinName: 'IN3',
    gpio: 40,
    name: 'Sektor 03 — RTH & Jalur Sepeda Bahari',
    sectorTag: 'SEKTOR 03 / VEGETASI',
    areaName: 'Taman Edukasi & Track Sepeda Selatan',
    description: 'Tata cahaya hemat energi sepanjang vegetasi peneduh, area rumput terbuka, dan jalur pesepeda.',
    lightingType: 'Bollard Eco-LED 3000K Warm Ambient',
    fixtureCount: 18,
    unitWattage: 35,
    color: '#10b981', // Emerald Teal
    accentGlow: 'rgba(16, 185, 129, 0.45)',
  },
  {
    id: 4,
    key: 'relay4',
    pinName: 'IN4',
    gpio: 41,
    name: 'Sektor 04 — Saluran Drainase & Tanggul Pesisir',
    sectorTag: 'SEKTOR 04 / VITAL INFRA',
    areaName: 'Stasiun Pompa & Pintu Air Muara',
    description: 'Pencahayaan sorot operasional pemantauan elevasi banjir (ultrasonik) dan inspeksi dinding tanggul.',
    lightingType: 'Floodlight Sorot Inspeksi Tanggul 5700K',
    fixtureCount: 8,
    unitWattage: 70,
    color: '#f59e0b', // Amber Alert
    accentGlow: 'rgba(245, 158, 11, 0.45)',
  },
];

/**
 * Extracts the boolean state of a sector from telemetry or fallback state
 */
export function getSectorRelayState(
  telemetry: TelemetryData | null | undefined,
  sectorId: 1 | 2 | 3 | 4,
  fallbackStates?: RelayStates
): boolean {
  const key = `relay${sectorId}` as keyof RelayStates;
  if (telemetry?.relays && typeof telemetry.relays[key] === 'boolean') {
    return telemetry.relays[key];
  }
  if (telemetry && typeof telemetry[key] === 'boolean') {
    return !!telemetry[key];
  }
  if (fallbackStates && typeof fallbackStates[key] === 'boolean') {
    return fallbackStates[key];
  }
  return false;
}

/**
 * Calculates total power and active sector count
 */
export function calculateLightingStats(states: RelayStates) {
  let activeCount = 0;
  let totalWatt = 0;
  let totalFixtures = 0;

  SECTOR_LIGHTING_CONFIGS.forEach((sec) => {
    if (states[sec.key]) {
      activeCount++;
      totalWatt += sec.unitWattage;
      totalFixtures += sec.fixtureCount;
    }
  });

  return {
    activeCount,
    totalCount: SECTOR_LIGHTING_CONFIGS.length,
    totalWatt,
    totalFixtures,
    powerKwhEquivalent: +(totalWatt / 1000).toFixed(2),
  };
}

export interface AmbientLightGrade {
  status: string;
  label: string;
  badgeText: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  isDark: boolean;
  percent: number;
}

/**
 * Evaluates LDR sensor reading into 2 binary conditions:
 * < 3000: Terang / Mati (banyak cahaya terbaca sensor)
 * > 3000: Menyala / Gelap (sedikit cahaya terbaca sensor)
 */
export function getAmbientLightGrade(
  raw?: number | null,
  explicitStatus?: string
): AmbientLightGrade {
  if (explicitStatus) {
    if (explicitStatus.includes('Gelap') || explicitStatus.includes('Menyala')) {
      const clampedRaw = raw !== null && raw !== undefined ? Math.max(0, Math.min(4095, raw)) : 3500;
      const brightnessPercent = Math.max(0, Math.min(100, Math.round(((4095 - clampedRaw) / 4095) * 100)));
      return {
        status: explicitStatus,
        label: explicitStatus.includes('Menyala') ? explicitStatus : `${explicitStatus} (Lampu Menyala)`,
        badgeText: 'GELAP (MENYALA)',
        color: '#818cf8',
        bgColor: 'rgba(99, 102, 241, 0.15)',
        borderColor: 'rgba(99, 102, 241, 0.40)',
        description: 'Sedikit cahaya terbaca sensor (>3000 ADC). Mode Auto menyalakan lampu.',
        isDark: true,
        percent: brightnessPercent,
      };
    }
    if (explicitStatus.includes('Terang') || explicitStatus.includes('Mati')) {
      const clampedRaw = raw !== null && raw !== undefined ? Math.max(0, Math.min(4095, raw)) : 1200;
      const brightnessPercent = Math.max(0, Math.min(100, Math.round(((4095 - clampedRaw) / 4095) * 100)));
      return {
        status: explicitStatus,
        label: explicitStatus.includes('Padam') || explicitStatus.includes('Mati') ? explicitStatus : `${explicitStatus} (Lampu Padam)`,
        badgeText: 'TERANG (MATI)',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.35)',
        description: 'Banyak cahaya terbaca sensor (<3000 ADC). Mode Auto memadamkan lampu.',
        isDark: false,
        percent: brightnessPercent,
      };
    }
  }

  if (raw === null || raw === undefined) {
    return {
      status: 'Terang',
      label: 'Terang (Lampu Padam)',
      badgeText: 'TERANG (MATI)',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      description: 'Banyak cahaya terbaca sensor (<3000 ADC). Mode Auto memadamkan lampu.',
      isDark: false,
      percent: 85,
    };
  }

  const clampedRaw = Math.max(0, Math.min(4095, raw));
  const brightnessPercent = Math.max(0, Math.min(100, Math.round(((4095 - clampedRaw) / 4095) * 100)));

  // Binary LDR Threshold:
  // > 3000 : Menyala (sedikit cahaya terbaca sensor)
  // < 3000 : Mati (banyak cahaya terbaca sensor)
  if (clampedRaw > 3000) {
    return {
      status: 'Gelap',
      label: 'Gelap (Lampu Menyala)',
      badgeText: 'GELAP (MENYALA)',
      color: '#818cf8',
      bgColor: 'rgba(99, 102, 241, 0.15)',
      borderColor: 'rgba(99, 102, 241, 0.40)',
      description: 'Sedikit cahaya terbaca sensor (>3000 ADC). Mode Auto menyalakan lampu.',
      isDark: true,
      percent: brightnessPercent,
    };
  }

  return {
    status: 'Terang',
    label: 'Terang (Lampu Padam)',
    badgeText: 'TERANG (MATI)',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    description: 'Banyak cahaya terbaca sensor (<3000 ADC). Mode Auto memadamkan lampu.',
    isDark: false,
    percent: brightnessPercent,
  };
}

export interface ParkingStatusGrade {
  status: 'Tersedia' | 'Hampir Penuh' | 'Penuh';
  label: string;
  badgeText: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  isFull: boolean;
  occupancyPercent: number;
}

/**
 * Evaluates parking slot vacancy into human-readable occupancy tier.
 */
export function getParkingStatusGrade(
  availableSlots: number = 10,
  totalSlots: number = 10
): ParkingStatusGrade {
  const safeTotal = Math.max(1, totalSlots);
  const safeAvailable = Math.max(0, Math.min(safeTotal, availableSlots));
  const occupied = safeTotal - safeAvailable;
  const occupancyPercent = Math.round((occupied / safeTotal) * 100);

  if (safeAvailable === 0) {
    return {
      status: 'Penuh',
      label: 'Kapasitas Penuh (Gate Locked)',
      badgeText: 'PARKIR PENUH',
      color: '#f43f5e',
      bgColor: 'rgba(244, 63, 94, 0.15)',
      borderColor: 'rgba(244, 63, 94, 0.45)',
      description: 'Seluruh 10 slot parkir terisi. Palang masuk otomatis ditutup hingga ada kendaraan keluar.',
      isFull: true,
      occupancyPercent: 100,
    };
  }

  if (safeAvailable <= 2) {
    return {
      status: 'Hampir Penuh',
      label: 'Hampir Penuh',
      badgeText: 'HAMPIR PENUH',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.45)',
      description: `Hanya tersisa ${safeAvailable} slot parkir kosong. Disarankan mencari alternatif jika arus tinggi.`,
      isFull: false,
      occupancyPercent,
    };
  }

  return {
    status: 'Tersedia',
    label: 'Tersedia',
    badgeText: 'SLOT TERSEDIA',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    description: `${safeAvailable} dari ${safeTotal} slot parkir siap digunakan pengunjung kawasan Alun-Alun Tegal.`,
    isFull: false,
    occupancyPercent,
  };
}
