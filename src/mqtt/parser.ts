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
  type AirQualityStatus,
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

  if (obj.water_distance_cm !== undefined) {
    if (!isValidNumber(obj.water_distance_cm, TELEMETRY_LIMITS.water_distance_cm.min, TELEMETRY_LIMITS.water_distance_cm.max)) {
      return {
        success: false,
        error: `Invalid "water_distance_cm": ${obj.water_distance_cm} (expected ${TELEMETRY_LIMITS.water_distance_cm.min}..${TELEMETRY_LIMITS.water_distance_cm.max} cm)`,
        rawPayload: raw,
      };
    }
  }

  if (obj.ldr_raw !== undefined) {
    if (!isValidNumber(obj.ldr_raw, TELEMETRY_LIMITS.ldr_raw.min, TELEMETRY_LIMITS.ldr_raw.max)) {
      return {
        success: false,
        error: `Invalid "ldr_raw": ${obj.ldr_raw} (expected ${TELEMETRY_LIMITS.ldr_raw.min}..${TELEMETRY_LIMITS.ldr_raw.max} ADC count)`,
        rawPayload: raw,
      };
    }
  }

  if (obj.parking_total_slots !== undefined) {
    if (!isValidNumber(obj.parking_total_slots, TELEMETRY_LIMITS.parking_total_slots.min, TELEMETRY_LIMITS.parking_total_slots.max)) {
      return {
        success: false,
        error: `Invalid "parking_total_slots": ${obj.parking_total_slots} (expected ${TELEMETRY_LIMITS.parking_total_slots.min}..${TELEMETRY_LIMITS.parking_total_slots.max})`,
        rawPayload: raw,
      };
    }
  }

  if (obj.parking_occupied_slots !== undefined) {
    if (!isValidNumber(obj.parking_occupied_slots, TELEMETRY_LIMITS.parking_occupied_slots.min, TELEMETRY_LIMITS.parking_occupied_slots.max)) {
      return {
        success: false,
        error: `Invalid "parking_occupied_slots": ${obj.parking_occupied_slots} (expected ${TELEMETRY_LIMITS.parking_occupied_slots.min}..${TELEMETRY_LIMITS.parking_occupied_slots.max})`,
        rawPayload: raw,
      };
    }
  }

  if (obj.parking_available_slots !== undefined) {
    if (!isValidNumber(obj.parking_available_slots, TELEMETRY_LIMITS.parking_available_slots.min, TELEMETRY_LIMITS.parking_available_slots.max)) {
      return {
        success: false,
        error: `Invalid "parking_available_slots": ${obj.parking_available_slots} (expected ${TELEMETRY_LIMITS.parking_available_slots.min}..${TELEMETRY_LIMITS.parking_available_slots.max})`,
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

  if (obj.water_distance_cm !== undefined) {
    validTelemetry.water_distance_cm = Math.round((obj.water_distance_cm as number) * 10) / 10;
  }

  if (typeof obj.flood_status === 'string' && obj.flood_status.trim().length > 0) {
    validTelemetry.flood_status = obj.flood_status.trim() as FloodStatus;
  }

  if (typeof obj.is_flood_warning === 'boolean') {
    validTelemetry.is_flood_warning = obj.is_flood_warning;
  }

  if (typeof obj.air_quality_status === 'string' && obj.air_quality_status.trim().length > 0) {
    validTelemetry.air_quality_status = obj.air_quality_status.trim() as AirQualityStatus;
  }

  if (typeof obj.is_gas_polluted === 'boolean') {
    validTelemetry.is_gas_polluted = obj.is_gas_polluted;
  }

  if (obj.ldr_raw !== undefined) {
    validTelemetry.ldr_raw = Math.floor(obj.ldr_raw as number);
  }

  if (typeof obj.ambient_light === 'string' && obj.ambient_light.trim().length > 0) {
    validTelemetry.ambient_light = obj.ambient_light.trim();
  }

  if (typeof obj.is_dark === 'boolean') {
    validTelemetry.is_dark = obj.is_dark;
  }

  if (typeof obj.lighting_mode === 'string' && (obj.lighting_mode === 'auto' || obj.lighting_mode === 'manual')) {
    validTelemetry.lighting_mode = obj.lighting_mode;
  }

  // 6. Parse optional 4-channel relay states (IN1=38, IN2=39, IN3=40, IN4=41)
  let parsedRelays = {
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false,
  };
  let hasRelayData = false;

  if (obj.relays && typeof obj.relays === 'object' && !Array.isArray(obj.relays)) {
    const rObj = obj.relays as Record<string, unknown>;
    if (typeof rObj.relay1 === 'boolean') { parsedRelays.relay1 = rObj.relay1; hasRelayData = true; }
    if (typeof rObj.relay2 === 'boolean') { parsedRelays.relay2 = rObj.relay2; hasRelayData = true; }
    if (typeof rObj.relay3 === 'boolean') { parsedRelays.relay3 = rObj.relay3; hasRelayData = true; }
    if (typeof rObj.relay4 === 'boolean') { parsedRelays.relay4 = rObj.relay4; hasRelayData = true; }
  }

  if (typeof obj.relay1 === 'boolean') { parsedRelays.relay1 = obj.relay1; hasRelayData = true; }
  if (typeof obj.relay2 === 'boolean') { parsedRelays.relay2 = obj.relay2; hasRelayData = true; }
  if (typeof obj.relay3 === 'boolean') { parsedRelays.relay3 = obj.relay3; hasRelayData = true; }
  if (typeof obj.relay4 === 'boolean') { parsedRelays.relay4 = obj.relay4; hasRelayData = true; }

  if (hasRelayData) {
    validTelemetry.relays = parsedRelays;
    validTelemetry.relay1 = parsedRelays.relay1;
    validTelemetry.relay2 = parsedRelays.relay2;
    validTelemetry.relay3 = parsedRelays.relay3;
    validTelemetry.relay4 = parsedRelays.relay4;
  }

  // Parse Smart Parking Attributes (supporting both flat fields and nested parking object)
  let totalSlots = 10;
  let occupiedSlots = 0;
  let hasParkingData = false;
  let nestedParking: Record<string, unknown> | null = null;

  if (obj.parking && typeof obj.parking === 'object' && !Array.isArray(obj.parking)) {
    nestedParking = obj.parking as Record<string, unknown>;
    if (typeof nestedParking.total_slots === 'number') { totalSlots = Math.floor(nestedParking.total_slots); hasParkingData = true; }
    else if (typeof nestedParking.total === 'number') { totalSlots = Math.floor(nestedParking.total); hasParkingData = true; }
    if (typeof nestedParking.occupied_slots === 'number') { occupiedSlots = Math.floor(nestedParking.occupied_slots); hasParkingData = true; }
    else if (typeof nestedParking.occupied === 'number') { occupiedSlots = Math.floor(nestedParking.occupied); hasParkingData = true; }
  }

  if (typeof obj.parking_total_slots === 'number') {
    totalSlots = Math.floor(obj.parking_total_slots);
    hasParkingData = true;
  }
  if (typeof obj.parking_occupied_slots === 'number') {
    occupiedSlots = Math.floor(obj.parking_occupied_slots);
    hasParkingData = true;
  }

  if (hasParkingData) {
    occupiedSlots = Math.max(0, Math.min(totalSlots, occupiedSlots));
    let availableSlots = totalSlots - occupiedSlots;
    if (typeof obj.parking_available_slots === 'number') {
      availableSlots = Math.floor(obj.parking_available_slots);
    } else if (nestedParking && typeof nestedParking.available_slots === 'number') {
      availableSlots = Math.floor(nestedParking.available_slots);
    }

    const isFull = typeof obj.is_parking_full === 'boolean'
      ? obj.is_parking_full
      : nestedParking && typeof nestedParking.is_full === 'boolean'
        ? nestedParking.is_full
        : (occupiedSlots >= totalSlots);

    const entryGateOpen = typeof obj.entry_gate_open === 'boolean'
      ? obj.entry_gate_open
      : nestedParking && typeof nestedParking.entry_gate_open === 'boolean'
        ? nestedParking.entry_gate_open
        : false;

    const exitGateOpen = typeof obj.exit_gate_open === 'boolean'
      ? obj.exit_gate_open
      : nestedParking && typeof nestedParking.exit_gate_open === 'boolean'
        ? nestedParking.exit_gate_open
        : false;

    const irEntryDetected = typeof obj.ir_entry_detected === 'boolean'
      ? obj.ir_entry_detected
      : nestedParking && typeof nestedParking.ir_entry_detected === 'boolean'
        ? nestedParking.ir_entry_detected
        : false;

    const irExitDetected = typeof obj.ir_exit_detected === 'boolean'
      ? obj.ir_exit_detected
      : nestedParking && typeof nestedParking.ir_exit_detected === 'boolean'
        ? nestedParking.ir_exit_detected
        : false;

    validTelemetry.parking_total_slots = totalSlots;
    validTelemetry.parking_occupied_slots = occupiedSlots;
    validTelemetry.parking_available_slots = availableSlots;
    validTelemetry.is_parking_full = isFull;
    validTelemetry.entry_gate_open = entryGateOpen;
    validTelemetry.exit_gate_open = exitGateOpen;
    validTelemetry.ir_entry_detected = irEntryDetected;
    validTelemetry.ir_exit_detected = irExitDetected;

    validTelemetry.parking = {
      total_slots: totalSlots,
      occupied_slots: occupiedSlots,
      available_slots: availableSlots,
      is_full: isFull,
      entry_gate_open: entryGateOpen,
      exit_gate_open: exitGateOpen,
      ir_entry_detected: irEntryDetected,
      ir_exit_detected: irExitDetected,
    };
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
