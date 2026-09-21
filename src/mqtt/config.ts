/**
 * AetherSense MQTT Configuration
 * Strictly adheres to PRD Sections 3, 4, 6, 19, and MQTT-CONTRACT.md
 */

export interface MqttConfig {
  brokerUrl: string;
  defaultDeviceId: string;
  clientId: string;
  telemetryTopic: string;
  statusTopic: string;
  keepalive: number;
  connectTimeout: number;
  reconnectBaseDelay: number;
  reconnectMaxDelay: number;
}

/**
 * Generate a unique client ID for the React Dashboard session.
 * Format: aethersense-web-{random-id}
 * Strictly avoids collision with ESP32 edge clients (PRD Section 6).
 */
export function generateWebClientId(): string {
  const randomSuffix = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).substring(2, 10);
  return `aethersense-web-${randomSuffix}`;
}

const defaultDeviceId = import.meta.env.VITE_DEFAULT_DEVICE_ID || 'auto';
const brokerUrl = import.meta.env.VITE_MQTT_URL || 'ws://broker.hivemq.com:8000/mqtt';

export const mqttConfig: MqttConfig = {
  brokerUrl,
  defaultDeviceId,
  clientId: generateWebClientId(),
  telemetryTopic: import.meta.env.VITE_MQTT_TELEMETRY_TOPIC || 'aethersense/+/telemetry',
  statusTopic: import.meta.env.VITE_MQTT_STATUS_TOPIC || 'aethersense/+/status',
  keepalive: 60,
  connectTimeout: 10000,
  reconnectBaseDelay: 1000, // 1 second base
  reconnectMaxDelay: 30000, // 30 seconds max backoff (PRD Section 21)
};
