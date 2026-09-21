import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TelemetryStore } from './store';
import { formatUptime, getRssiQuality } from './formatters';

describe('Telemetry Formatters (PRD Section 12)', () => {
  it('formats seconds into exact HH:MM:SS format', () => {
    expect(formatUptime(0)).toBe('00:00:00');
    expect(formatUptime(65)).toBe('00:01:05');
    expect(formatUptime(381)).toBe('00:06:21'); // Sample from PRD Section 12
    expect(formatUptime(3665)).toBe('01:01:05');
  });

  it('determines Wi-Fi RSSI quality tiers accurately', () => {
    expect(getRssiQuality(-50).label).toBe('Excellent');
    expect(getRssiQuality(-65).label).toBe('Good');
    expect(getRssiQuality(-75).label).toBe('Fair');
    expect(getRssiQuality(-90).label).toBe('Weak');
  });
});

describe('Telemetry Store & Fault Tolerance (PRD Section 14, 17, 22, 23)', () => {
  let store: TelemetryStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new TelemetryStore();
  });

  afterEach(() => {
    store.destroy();
    vi.useRealTimers();
  });

  it('ingests device status messages on status topic', () => {
    store.ingestMessage('aethersense/esp32s3-ABCD12345678/status', 'online');
    expect(store.getState().deviceStatus).toBe('online');

    store.ingestMessage('aethersense/esp32s3-ABCD12345678/status', 'offline');
    expect(store.getState().deviceStatus).toBe('offline');
  });

  it('ingests valid telemetry and increments packet counter', () => {
    const payload = JSON.stringify({
      device_id: 'esp32s3-ABCD12345678',
      sequence: 1,
      timestamp: Math.floor(Date.now() / 1000),
      uptime_s: 100,
      temperature_c: 28.5,
      humidity_percent: 70.0,
      mq135_raw: 1800,
      mq135_adc_mv: 1400,
      mq135_sensor_mv: 2300,
      wifi_rssi_dbm: -55,
    });

    store.ingestMessage('aethersense/esp32s3-ABCD12345678/telemetry', payload);
    const state = store.getState();

    expect(state.packetCount).toBe(1);
    expect(state.latestTelemetry?.temperature_c).toBe(28.5);
    expect(state.isStale).toBe(false);
  });

  it('detects duplicate sequence packets (PRD Section 22)', () => {
    const payload1 = JSON.stringify({
      device_id: 'esp32s3-ABCD12345678',
      sequence: 5,
      timestamp: Math.floor(Date.now() / 1000),
      uptime_s: 100,
      temperature_c: 28.5,
      humidity_percent: 70.0,
      mq135_raw: 1800,
      mq135_adc_mv: 1400,
      mq135_sensor_mv: 2300,
      wifi_rssi_dbm: -55,
    });

    // Send sequence 5
    store.ingestMessage('aethersense/esp32s3-ABCD12345678/telemetry', payload1);
    expect(store.getState().duplicateCount).toBe(0);

    // Send sequence 5 again (duplicate)
    store.ingestMessage('aethersense/esp32s3-ABCD12345678/telemetry', payload1);
    expect(store.getState().duplicateCount).toBe(1);

    // Send sequence 4 (out-of-order older sequence)
    const payloadOlder = JSON.stringify({
      ...JSON.parse(payload1),
      sequence: 4,
    });
    store.ingestMessage('aethersense/esp32s3-ABCD12345678/telemetry', payloadOlder);
    expect(store.getState().duplicateCount).toBe(2);
  });

  it('detects delayed packets with stale timestamp (PRD Section 22)', () => {
    const currentSec = Math.floor(Date.now() / 1000);
    const delayedPayload = JSON.stringify({
      device_id: 'esp32s3-ABCD12345678',
      sequence: 1,
      timestamp: currentSec - 120, // 2 minutes in the past (> 60s)
      uptime_s: 100,
      temperature_c: 28.5,
      humidity_percent: 70.0,
      mq135_raw: 1800,
      mq135_adc_mv: 1400,
      mq135_sensor_mv: 2300,
      wifi_rssi_dbm: -55,
    });

    store.ingestMessage('aethersense/esp32s3-ABCD12345678/telemetry', delayedPayload);
    expect(store.getState().delayedCount).toBe(1);
  });

  it('triggers stale status when no packet is received for > 15 seconds (PRD Section 23)', () => {
    const payload = JSON.stringify({
      device_id: 'esp32s3-ABCD12345678',
      sequence: 1,
      timestamp: Math.floor(Date.now() / 1000),
      uptime_s: 100,
      temperature_c: 28.5,
      humidity_percent: 70.0,
      mq135_raw: 1800,
      mq135_adc_mv: 1400,
      mq135_sensor_mv: 2300,
      wifi_rssi_dbm: -55,
    });

    store.ingestMessage('aethersense/esp32s3-ABCD12345678/telemetry', payload);
    expect(store.getState().isStale).toBe(false);

    // Fast-forward 10 seconds (still active)
    vi.advanceTimersByTime(10000);
    expect(store.getState().isStale).toBe(false);

    // Fast-forward another 6 seconds (total 16 seconds elapsed > 15 seconds)
    vi.advanceTimersByTime(6000);
    expect(store.getState().isStale).toBe(true);
  });

  it('cleans up state properly on reset()', () => {
    store.ingestMessage('aethersense/esp32s3-ABCD12345678/status', 'online');
    expect(store.getState().deviceStatus).toBe('online');

    store.reset();
    expect(store.getState().deviceStatus).toBe('unknown');
    expect(store.getState().packetCount).toBe(0);
    expect(store.getState().latestTelemetry).toBeNull();
  });
});
