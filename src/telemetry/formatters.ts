/**
 * Formatting and Display Utilities for Environmental Telemetry
 * Strictly adheres to PRD Section 12, 14, 23, and DESIGN.md
 */

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
