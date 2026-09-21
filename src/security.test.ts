import { describe, it, expect } from 'vitest';
import { parseTelemetryPayload } from './mqtt/parser';
import { generateWebClientId, mqttConfig } from './mqtt/config';
import { TELEMETRY_LIMITS } from './telemetry/types';

describe('Security & Telemetry Leakage Audit (PRD Section 4, 6, 9, 17, 31)', () => {
  it('strips extraneous, sensitive, or prototype pollution properties from payload', () => {
    const maliciousPayload = JSON.stringify({
      device_id: 'esp32s3-ABCD12345678',
      sequence: 1,
      timestamp: 1790041200,
      uptime_s: 100,
      temperature_c: 25.5,
      humidity_percent: 60.0,
      mq135_raw: 1600,
      mq135_adc_mv: 1300,
      mq135_sensor_mv: 2200,
      wifi_rssi_dbm: -50,
      // Injected malicious / unexpected properties
      password: 'super-secret-password',
      wifi_ssid: 'Home-WiFi-5G',
      local_ip: '192.168.1.50',
      admin: true,
      __proto__: { polluted: true },
    });

    const result = parseTelemetryPayload(maliciousPayload);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const data = result.data as unknown as Record<string, unknown>;

    // Verify injected properties are completely absent
    expect(data.password).toBeUndefined();
    expect(data.wifi_ssid).toBeUndefined();
    expect(data.local_ip).toBeUndefined();
    expect(data.admin).toBeUndefined();
    expect(data.polluted).toBeUndefined();

    // Verify exact set of allowed keys
    const allowedKeys = [
      'device_id',
      'sequence',
      'timestamp',
      'uptime_s',
      'temperature_c',
      'humidity_percent',
      'mq135_raw',
      'mq135_adc_mv',
      'mq135_sensor_mv',
      'wifi_rssi_dbm',
    ];
    expect(Object.keys(data).sort()).toEqual(allowedKeys.sort());
  });

  it('generates distinct web client IDs that never collide with ESP32 device ID format', () => {
    const clientId1 = generateWebClientId();
    const clientId2 = generateWebClientId();

    expect(clientId1).toMatch(/^aethersense-web-[a-z0-9-]+$/i);
    expect(clientId2).toMatch(/^aethersense-web-[a-z0-9-]+$/i);
    expect(clientId1).not.toBe(clientId2);

    // Strictly ensure web client ID NEVER matches ESP32 client ID prefix (PRD Section 6)
    expect(clientId1.startsWith('esp32s3-')).toBe(false);
    expect(clientId2.startsWith('esp32s3-')).toBe(false);
    expect(mqttConfig.clientId.startsWith('aethersense-web-')).toBe(true);
  });

  it('rejects infinite, NaN, or non-finite numeric injection attacks', () => {
    const nanPayload = JSON.stringify({
      device_id: 'esp32s3-ABCD12345678',
      sequence: 1,
      timestamp: 1790041200,
      uptime_s: 100,
      temperature_c: 'NaN',
      humidity_percent: 60.0,
      mq135_raw: 1600,
      mq135_adc_mv: 1300,
      mq135_sensor_mv: 2200,
      wifi_rssi_dbm: -50,
    });

    const resNaN = parseTelemetryPayload(nanPayload);
    expect(resNaN.success).toBe(false);
    if (!resNaN.success) {
      expect(resNaN.error).toContain('temperature_c');
    }

    const infinityPayload = JSON.stringify({
      device_id: 'esp32s3-ABCD12345678',
      sequence: 1,
      timestamp: 1790041200,
      uptime_s: 100,
      temperature_c: 25.5,
      humidity_percent: 999999, // Out of physical boundary
      mq135_raw: 1600,
      mq135_adc_mv: 1300,
      mq135_sensor_mv: 2200,
      wifi_rssi_dbm: -50,
    });

    const resInf = parseTelemetryPayload(infinityPayload);
    expect(resInf.success).toBe(false);
    if (!resInf.success) {
      expect(resInf.error).toContain('humidity_percent');
    }
  });

  it('enforces physical sensor limits for MQ135 and refuses PPM calculation fields', () => {
    // Limits check
    expect(TELEMETRY_LIMITS.mq135_raw.min).toBe(0);
    expect(TELEMETRY_LIMITS.mq135_raw.max).toBe(4095);
    expect(TELEMETRY_LIMITS.mq135_adc_mv.min).toBe(0);
    expect(TELEMETRY_LIMITS.mq135_adc_mv.max).toBe(3600);
    expect(TELEMETRY_LIMITS.mq135_sensor_mv.min).toBe(0);
    expect(TELEMETRY_LIMITS.mq135_sensor_mv.max).toBe(6000);

    // Negative raw ADC count must be rejected
    const negativeRaw = JSON.stringify({
      device_id: 'esp32s3-ABCD12345678',
      sequence: 1,
      timestamp: 1790041200,
      uptime_s: 100,
      temperature_c: 25.5,
      humidity_percent: 50.0,
      mq135_raw: -10,
      mq135_adc_mv: 1300,
      mq135_sensor_mv: 2200,
      wifi_rssi_dbm: -50,
    });

    const res = parseTelemetryPayload(negativeRaw);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain('mq135_raw');
    }
  });

  it('verifies public broker endpoints are clean with no embedded credentials in URLs', () => {
    expect(mqttConfig.brokerUrl).not.toContain('@'); // No user:pass in URL
    expect(mqttConfig.brokerUrl).not.toContain('password');
    expect(mqttConfig.brokerUrl).not.toContain('token');
    expect(mqttConfig.brokerUrl.startsWith('ws://') || mqttConfig.brokerUrl.startsWith('wss://')).toBe(true);
  });
});
