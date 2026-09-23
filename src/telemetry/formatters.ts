/**
 * Formatting and Display Utilities for Environmental Telemetry
 * Strictly adheres to PRD Section 12, 14, 23, and DESIGN.md
 */

import { type AirQualityStatus } from './types';

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
          description: 'Konsentrasi gas buang atau asap terdeteksi tinggi melampaui batas aman (>600 ADC).',
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
  // Sangat Bersih < 150
  // Normal / Cukup Baik < 350
  // Polusi Ringan < 600 (<= 600)
  // Tercemar > 600
  if (raw < 150) {
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
  }

  if (raw < 350) {
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
  }

  if (raw <= 600) {
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
  }

  return {
    status: 'Tercemar',
    label: 'Tercemar',
    badgeText: 'TERCEMAR GAS',
    color: 'var(--state-offline)',
    bgColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.45)',
    description: 'Konsentrasi gas buang atau asap terdeteksi tinggi melampaui batas aman (>600 ADC).',
    isPolluted: true,
  };
}
