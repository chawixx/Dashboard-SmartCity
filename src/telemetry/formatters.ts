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
      case 'Udara Bersih':
        return {
          status: 'Udara Bersih',
          label: 'Udara Bersih',
          badgeText: 'BERSIH & SEGAR',
          color: 'var(--state-online)',
          bgColor: 'rgba(16, 185, 129, 0.12)',
          borderColor: 'rgba(16, 185, 129, 0.35)',
          description: 'Kondisi udara ruang terbuka Alun-Alun bersih, tidak terdeteksi gas berbahaya.',
          isPolluted: false,
        };
      case 'Sedang':
        return {
          status: 'Sedang',
          label: 'Kualitas Sedang',
          badgeText: 'NORMAL AMBIEN',
          color: 'var(--brand-light)',
          bgColor: 'rgba(6, 182, 212, 0.12)',
          borderColor: 'rgba(6, 182, 212, 0.35)',
          description: 'Kualitas udara wajar di kawasan perkotaan dengan aktivitas publik normal.',
          isPolluted: false,
        };
      case 'Tercemar Gas':
        return {
          status: 'Tercemar Gas',
          label: 'Tercemar Gas',
          badgeText: 'TERCEMAR GAS',
          color: 'var(--state-stale)',
          bgColor: 'rgba(245, 158, 11, 0.15)',
          borderColor: 'rgba(245, 158, 11, 0.45)',
          description: 'Terdeteksi akumulasi gas buang kendaraan atau asap di sekitar kawasan.',
          isPolluted: true,
        };
      case 'Sangat Tercemar':
        return {
          status: 'Sangat Tercemar',
          label: 'Sangat Tercemar',
          badgeText: 'BAHAYA GAS',
          color: 'var(--state-offline)',
          bgColor: 'rgba(244, 63, 94, 0.15)',
          borderColor: 'rgba(244, 63, 94, 0.45)',
          description: 'Konsentrasi gas atau asap pekat terdeteksi tinggi, potensi bahaya pernapasan.',
          isPolluted: true,
        };
    }
  }

  // Fallback to evaluating raw ADC if explicitStatus is not present
  if (raw === null || raw === undefined) {
    return {
      status: 'Udara Bersih',
      label: 'Menunggu Data',
      badgeText: 'DATA TIDAK TERSEDIA',
      color: 'var(--text-muted)',
      bgColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.12)',
      description: 'Sensor sedang menginisialisasi pembacaan resistansi analog.',
      isPolluted: false,
    };
  }

  if (raw < 1500) {
    return {
      status: 'Udara Bersih',
      label: 'Udara Bersih',
      badgeText: 'BERSIH & SEGAR',
      color: 'var(--state-online)',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      description: 'Kondisi udara ruang terbuka Alun-Alun bersih, tidak terdeteksi gas berbahaya.',
      isPolluted: false,
    };
  }

  if (raw < 2500) {
    return {
      status: 'Sedang',
      label: 'Kualitas Sedang',
      badgeText: 'NORMAL AMBIEN',
      color: 'var(--brand-light)',
      bgColor: 'rgba(6, 182, 212, 0.12)',
      borderColor: 'rgba(6, 182, 212, 0.35)',
      description: 'Kualitas udara wajar di kawasan perkotaan dengan aktivitas publik normal.',
      isPolluted: false,
    };
  }

  if (raw < 3400) {
    return {
      status: 'Tercemar Gas',
      label: 'Tercemar Gas',
      badgeText: 'TERCEMAR GAS',
      color: 'var(--state-stale)',
      bgColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.45)',
      description: 'Terdeteksi akumulasi gas buang kendaraan atau asap di sekitar kawasan.',
      isPolluted: true,
    };
  }

  return {
    status: 'Sangat Tercemar',
    label: 'Sangat Tercemar',
    badgeText: 'BAHAYA GAS',
    color: 'var(--state-offline)',
    bgColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.45)',
    description: 'Konsentrasi gas atau asap pekat terdeteksi tinggi, potensi bahaya pernapasan.',
    isPolluted: true,
  };
}
