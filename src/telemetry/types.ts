/**
 * Telemetry Data Types and Validation Interfaces
 * Strictly adheres to PRD Sections 7, 8, 14, 17, and MQTT-CONTRACT.md Section 4
 */

export type RainStatus = 'Kering' | 'Gerimis' | 'Hujan Sedang' | 'Hujan Lebat';
export type FloodStatus = 'Aman' | 'Waspada' | 'Siaga' | 'Bahaya Banjir';
export type AirQualityStatus = 'Udara Bersih' | 'Sedang' | 'Tercemar Gas' | 'Sangat Tercemar';

export interface TelemetryData {
  device_id: string;
  sequence: number;
  timestamp: number;
  uptime_s: number;
  temperature_c: number;
  humidity_percent: number;
  mq135_raw: number;
  mq135_adc_mv: number;
  mq135_sensor_mv: number;
  air_quality_status?: AirQualityStatus;
  is_gas_polluted?: boolean;
  wifi_rssi_dbm: number;
  rain_raw?: number;
  rain_status?: RainStatus;
  is_raining?: boolean;
  water_level_raw?: number;
  water_level_cm?: number;
  water_distance_cm?: number;
  flood_status?: FloodStatus;
  is_flood_warning?: boolean;
}

export type DeviceStatus = 'online' | 'offline' | 'unknown';

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; rawPayload: string };

/**
 * Acceptable physical validation limits for hardware telemetry
 */
export const TELEMETRY_LIMITS = {
  temperature_c: { min: -40, max: 85 },
  humidity_percent: { min: 0, max: 100 },
  mq135_raw: { min: 0, max: 4095 },
  mq135_adc_mv: { min: 0, max: 3600 },
  mq135_sensor_mv: { min: 0, max: 6000 },
  wifi_rssi_dbm: { min: -120, max: 0 },
  rain_raw: { min: 0, max: 4095 },
  water_level_raw: { min: 0, max: 4095 },
  water_level_cm: { min: 0, max: 500 },
  water_distance_cm: { min: 0, max: 500 },
} as const;
