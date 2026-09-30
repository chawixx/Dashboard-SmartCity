/**
 * Telemetry Data Types and Validation Interfaces
 * Strictly adheres to PRD Sections 7, 8, 14, 17, and MQTT-CONTRACT.md Section 4
 */

export type RainStatus = 'Kering' | 'Gerimis' | 'Hujan Sedang' | 'Hujan Lebat';
export type FloodStatus = 'Aman' | 'Waspada' | 'Siaga' | 'Bahaya Banjir';
export type LightingMode = 'auto' | 'manual';
export type AmbientLightStatus =
  | 'Terang'
  | 'Terang Siang'
  | 'Redup'
  | 'Redup / Mendung'
  | 'Gelap'
  | 'Gelap Malam';

export type AirQualityStatus =
  | 'Sangat Bersih'
  | 'Normal / Cukup Baik'
  | 'Polusi Ringan'
  | 'Tercemar'
  | 'Udara Bersih'
  | 'Sedang'
  | 'Tercemar Gas'
  | 'Sangat Tercemar';

export interface RelayStates {
  relay1: boolean;
  relay2: boolean;
  relay3: boolean;
  relay4: boolean;
}

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
  ldr_raw?: number;
  ambient_light?: string;
  is_dark?: boolean;
  lighting_mode?: LightingMode;
  relays?: RelayStates;
  relay1?: boolean;
  relay2?: boolean;
  relay3?: boolean;
  relay4?: boolean;
  parking_total_slots?: number;
  parking_occupied_slots?: number;
  parking_available_slots?: number;
  is_parking_full?: boolean;
  entry_gate_open?: boolean;
  exit_gate_open?: boolean;
  ir_entry_detected?: boolean;
  ir_exit_detected?: boolean;
  parking?: ParkingData;
}

export interface ParkingData {
  total_slots: number;
  occupied_slots: number;
  available_slots: number;
  is_full: boolean;
  entry_gate_open?: boolean;
  exit_gate_open?: boolean;
  ir_entry_detected?: boolean;
  ir_exit_detected?: boolean;
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
  ldr_raw: { min: 0, max: 4095 },
  parking_total_slots: { min: 1, max: 100 },
  parking_occupied_slots: { min: 0, max: 100 },
  parking_available_slots: { min: 0, max: 100 },
} as const;
