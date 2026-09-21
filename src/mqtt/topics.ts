/**
 * AetherSense MQTT Topic Definitions & Matchers
 * Strictly adheres to PRD Section 5, 20, and MQTT-CONTRACT.md Section 3
 */

export const MQTT_ROOT = 'aethersense';

/**
 * Builds the telemetry topic for a specific device.
 * Format: aethersense/{device_id}/telemetry
 */
export function getTelemetryTopic(deviceId: string): string {
  const sanitizedId = deviceId.trim();
  return `${MQTT_ROOT}/${sanitizedId}/telemetry`;
}

/**
 * Builds the device status topic for a specific device.
 * Format: aethersense/{device_id}/status
 */
export function getStatusTopic(deviceId: string): string {
  const sanitizedId = deviceId.trim();
  return `${MQTT_ROOT}/${sanitizedId}/status`;
}

/**
 * Builds the wildcard telemetry discovery topic.
 * Format: aethersense/+/telemetry (PRD Section 20)
 */
export function getDiscoveryTopic(): string {
  return `${MQTT_ROOT}/+/telemetry`;
}

/**
 * Builds the wildcard status discovery topic.
 * Format: aethersense/+/status (PRD Section 20)
 */
export function getStatusDiscoveryTopic(): string {
  return `${MQTT_ROOT}/+/status`;
}

/**
 * Extracts device ID from a valid AetherSense topic string.
 * Example: 'aethersense/esp32s3-ABCD12345678/telemetry' -> 'esp32s3-ABCD12345678'
 */
export function extractDeviceIdFromTopic(topic: string): string | null {
  const parts = topic.split('/');
  if (parts.length === 3 && parts[0] === MQTT_ROOT && parts[1]) {
    return parts[1];
  }
  return null;
}

/**
 * Checks if a given topic matches telemetry pattern.
 */
export function isTelemetryTopic(topic: string, specificDeviceId?: string): boolean {
  if (specificDeviceId && specificDeviceId !== 'auto') {
    return topic === getTelemetryTopic(specificDeviceId);
  }
  const parts = topic.split('/');
  return parts.length === 3 && parts[0] === MQTT_ROOT && parts[2] === 'telemetry';
}

/**
 * Checks if a given topic matches device status pattern.
 */
export function isStatusTopic(topic: string, specificDeviceId?: string): boolean {
  if (specificDeviceId && specificDeviceId !== 'auto') {
    return topic === getStatusTopic(specificDeviceId);
  }
  const parts = topic.split('/');
  return parts.length === 3 && parts[0] === MQTT_ROOT && parts[2] === 'status';
}
