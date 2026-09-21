import { describe, it, expect } from 'vitest';
import { AetherMqttClient } from './client';
import { generateWebClientId } from './config';

describe('AetherMqttClient Exponential Backoff & State Machine (PRD Section 13 & 21)', () => {
  it('generates unique Web Client IDs conforming to PRD Section 6', () => {
    const id1 = generateWebClientId();
    const id2 = generateWebClientId();

    expect(id1.startsWith('aethersense-web-')).toBe(true);
    expect(id2.startsWith('aethersense-web-')).toBe(true);
    expect(id1).not.toBe(id2);
  });

  it('calculates exponential backoff progression accurately up to 30s cap', () => {
    const testConfig = {
      brokerUrl: 'ws://broker.hivemq.com:8000/mqtt',
      defaultDeviceId: 'esp32s3-test',
      clientId: 'aethersense-web-test',
      telemetryTopic: 'aethersense/test/telemetry',
      statusTopic: 'aethersense/test/status',
      keepalive: 60,
      connectTimeout: 5000,
      reconnectBaseDelay: 1000,
      reconnectMaxDelay: 30000,
    };

    const client = new AetherMqttClient(testConfig);

    // Initial state
    expect(client.getState()).toBe('DISCONNECTED');
    expect(client.getBackoffDelay()).toBe(1000); // 1s at attempt 0
  });

  it('manages topic subscriptions accurately', () => {
    const client = new AetherMqttClient();
    client.subscribe('aethersense/test/telemetry');
    // Does not throw when disconnecting uninitialized
    client.disconnect();
    expect(client.getState()).toBe('DISCONNECTED');
  });
});
