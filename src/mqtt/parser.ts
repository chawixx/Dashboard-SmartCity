/**
 * Safe Ingestion & Telemetry Parser Layer
 * Strictly adheres to PRD Section 17, 22, and ARCHITECTURE.md Section 3
 */

import {
  type TelemetryData,
  type DeviceStatus,
  type ParseResult,
  type RainStatus,
  type FloodStatus,
  TELEMETRY_LIMITS,
} from '../telemetry/types';

/**
 * Validates whether a value is a finite number and within [min, max]
 */
function isValidNumber(val: unknown, min: number, max: number): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val >= min && val <= max;
}

/**
 * Safely parses and validates a raw telemetry JSON string.
 * This function NEVER throws, guaranteeing zero React crashes from malformed packets (PRD Section 17).
 *
 * @param raw - The raw string message received from MQTT
 * @param expectedDeviceId - Optional device ID to filter or enforce
 * @returns ParseResult<TelemetryData> with either validated data or descriptive failure reason
 */
export function parseTelemetryPayload(
  raw: string,
  expectedDeviceId?: string
): ParseResult<TelemetryData> {
  if (!raw || typeof raw !== 'string') {
    return {
      success: false,
      error: 'Empty or non-string payload received',
      rawPayload: String(raw),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Invalid JSON syntax';
    console.warn(`[Telemetry Parser] Malformed JSON: ${errorMsg}. Payload preview: ${raw.slice(0, 80)}`);
    return {
      success: false,
      error: `Malformed JSON: ${errorMsg}`,
      rawPayload: raw,
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    console.warn('[Telemetry Parser] Payload must be a non-null JSON object');
    return {
      success: false,
      error: 'Payload is not a JSON object',
      rawPayload: raw,
    };
  }

  const obj = parsed as Record<string, unknown>;

  // 1. Validate device_id
  if (typeof obj.device_id !== 'string' || obj.device_id.trim().length === 0) {
    return {
      success: false,
      error: 'Missing or invalid "device_id" string',
      rawPayload: raw,
    };
  }

  const deviceId = obj.device_id.trim();
  if (expectedDeviceId && expectedDeviceId !== 'auto' && deviceId !== expectedDeviceId) {
    return {
      success: false,
      error: `Device ID mismatch (expected "${expectedDeviceId}", got "${deviceId}")`,
      rawPayload: raw,
    };
  }

  // 2. Validate sequence & timing numbers
  if (typeof obj.sequence !== 'number' || !Number.isFinite(obj.sequence) || obj.sequence < 0) {
    return {
      success: false,
      error: 'Invalid "sequence" (must be non-negative integer)',
      rawPayload: raw,
    };
  }

  // Timestamp: if <= 0 (e.g. ESP32 NTP still syncing), fallback to client unix timestamp
  if (typeof obj.timestamp !== 'number' || !Number.isFinite(obj.timestamp)) {
    return {
      success: false,
      error: 'Invalid "timestamp" (must be a valid number)',
      rawPayload: raw,
    };
  }

  const resolvedTimestamp = obj.timestamp > 0 ? Math.floor(obj.timestamp) : Math.floor(Date.now() / 1000);

  if (typeof obj.uptime_s !== 'number' || !Number.isFinite(obj.uptime_s) || obj.uptime_s < 0) {
    return {
      success: false,
      error: 'Invalid "uptime_s" (must be non-negative number)',
      rawPayload: raw,
    };
  }

  // 3. Validate sensor readings against physical constraints
  if (!isValidNumber(obj.temperature_c, TELEMETRY_LIMITS.temperature_c.min, TELEMETRY_LIMITS.temperature_c.max)) {
    return {
      success: false,
      error: `Invalid "temperature_c": ${obj.temperature_c} (expected ${TELEMETRY_LIMITS.temperature_c.min}..${TELEMETRY_LIMITS.temperature_c.max} °C)`,
      rawPayload: raw,
    };
  }

  if (!isValidNumber(obj.humidity_percent, TELEMETRY_LIMITS.humidity_percent.min, TELEMETRY_LIMITS.humidity_percent.max)) {
    return {
      success: false,
      error: `Invalid "humidity_percent": ${obj.humidity_percent} (expected ${TELEMETRY_LIMITS.humidity_percent.min}..${TELEMETRY_LIMITS.humidity_percent.max} %)`,
      rawPayload: raw,
    };
  }

  if (!isValidNumber(obj.mq135_raw, TELEMETRY_LIMITS.mq135_raw.min, TELEMETRY_LIMITS.mq135_raw.max)) {
    return {
      success: false,
      error: `Invalid "mq135_raw": ${obj.mq135_raw} (expected 0..4095 ADC count)`,
      rawPayload: raw,
    };
  }

  if (!isValidNumber(obj.mq135_adc_mv, TELEMETRY_LIMITS.mq135_adc_mv.min, TELEMETRY_LIMITS.mq135_adc_mv.max)) {
    return {
      success: false,
      error: `Invalid "mq135_adc_mv": ${obj.mq135_adc_mv} (expected ${TELEMETRY_LIMITS.mq135_adc_mv.min}..${TELEMETRY_LIMITS.mq135_adc_mv.max} mV)`,
      rawPayload: raw,
    };
  }

  if (!isValidNumber(obj.mq135_sensor_mv, TELEMETRY_LIMITS.mq135_sensor_mv.min, TELEMETRY_LIMITS.mq135_sensor_mv.max)) {
    return {
      success: false,
      error: `Invalid "mq135_sensor_mv": ${obj.mq135_sensor_mv} (expected ${TELEMETRY_LIMITS.mq135_sensor_mv.min}..${TELEMETRY_LIMITS.mq135_sensor_mv.max} mV)`,
      rawPayload: raw,
    };
  }

  if (!isValidNumber(obj.wifi_rssi_dbm, TELEMETRY_LIMITS.wifi_rssi_dbm.min, TELEMETRY_LIMITS.wifi_rssi_dbm.max)) {
    return {
      success: false,
      error: `Invalid "wifi_rssi_dbm": ${obj.wifi_rssi_dbm} (expected -120..0 dBm)`,
      rawPayload: raw,
    };
  }

  // 4. Validate optional rain sensor readings (Pin 8)
  if (obj.rain_raw !== undefined) {
    if (!isValidNumber(obj.rain_raw, TELEMETRY_LIMITS.rain_raw.min, TELEMETRY_LIMITS.rain_raw.max)) {
      return {
        success: false,
        error: `Invalid "rain_raw": ${obj.rain_raw} (expected ${TELEMETRY_LIMITS.rain_raw.min}..${TELEMETRY_LIMITS.rain_raw.max} ADC count)`,
        rawPayload: raw,
      };
    }
  }

  // 5. Validate optional water level sensor readings (Pin 10)
  if (obj.water_level_raw !== undefined) {
    if (!isValidNumber(obj.water_level_raw, TELEMETRY_LIMITS.water_level_raw.min, TELEMETRY_LIMITS.water_level_raw.max)) {
      return {
        success: false,
        error: `Invalid "water_level_raw": ${obj.water_level_raw} (expected ${TELEMETRY_LIMITS.water_level_raw.min}..${TELEMETRY_LIMITS.water_level_raw.max} ADC count)`,
        rawPayload: raw,
      };
    }
  }

  if (obj.water_level_cm !== undefined) {
    if (!isValidNumber(obj.water_level_cm, TELEMETRY_LIMITS.water_level_cm.min, TELEMETRY_LIMITS.water_level_cm.max)) {
      return {
        success: false,
        error: `Invalid "water_level_cm": ${obj.water_level_cm} (expected ${TELEMETRY_LIMITS.water_level_cm.min}..${TELEMETRY_LIMITS.water_level_cm.max} cm)`,
        rawPayload: raw,
      };
    }
  }

  // Construct typed and clean TelemetryData object
  const validTelemetry: TelemetryData = {
    device_id: deviceId,
    sequence: Math.floor(obj.sequence),
    timestamp: resolvedTimestamp,
    uptime_s: Math.round(obj.uptime_s * 100) / 100,
    temperature_c: Math.round(obj.temperature_c * 100) / 100,
    humidity_percent: Math.round(obj.humidity_percent * 100) / 100,
    mq135_raw: Math.floor(obj.mq135_raw),
    mq135_adc_mv: Math.round(obj.mq135_adc_mv * 100) / 100,
    mq135_sensor_mv: Math.round(obj.mq135_sensor_mv * 100) / 100,
    wifi_rssi_dbm: Math.floor(obj.wifi_rssi_dbm),
  };

  if (obj.rain_raw !== undefined) {
    validTelemetry.rain_raw = Math.floor(obj.rain_raw as number);
  }

  if (typeof obj.rain_status === 'string' && obj.rain_status.trim().length > 0) {
    validTelemetry.rain_status = obj.rain_status.trim() as RainStatus;
  }

  if (typeof obj.is_raining === 'boolean') {
    validTelemetry.is_raining = obj.is_raining;
  }

  if (obj.water_level_raw !== undefined) {
    validTelemetry.water_level_raw = Math.floor(obj.water_level_raw as number);
  }

  if (obj.water_level_cm !== undefined) {
    validTelemetry.water_level_cm = Math.round((obj.water_level_cm as number) * 10) / 10;
  }

  if (typeof obj.flood_status === 'string' && obj.flood_status.trim().length > 0) {
    validTelemetry.flood_status = obj.flood_status.trim() as FloodStatus;
  }

  if (typeof obj.is_flood_warning === 'boolean') {
    validTelemetry.is_flood_warning = obj.is_flood_warning;
  }

  return {
    success: true,
    data: validTelemetry,
  };
}

/**
 * Safely parses the LWT / device status payload string.
 * Format: "online" | "offline"
 */
export function parseDeviceStatus(raw: string): DeviceStatus {
  if (!raw || typeof raw !== 'string') {
    return 'unknown';
  }

  const normalized = raw.trim().toLowerCase();
  if (normalized === 'online') {
    return 'online';
  }
  if (normalized === 'offline') {
    return 'offline';
  }

  return 'unknown';
}
