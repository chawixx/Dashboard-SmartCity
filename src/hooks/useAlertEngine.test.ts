import { describe, it, expect } from 'vitest';
import { evaluateTelemetryViolations } from './useAlertEngine';
import { type TelemetryData } from '../telemetry/types';

describe('useAlertEngine Threshold & Hazard Rules', () => {
  const normalTelemetry: TelemetryData = {
    device_id: 'esp32s3-E8A851858428',
    sequence: 1,
    timestamp: 1790000000,
    uptime_s: 100,
    temperature_c: 28.5,
    humidity_percent: 65.0,
    mq135_raw: 1600,
    mq135_adc_mv: 1300,
    mq135_sensor_mv: 2200,
    wifi_rssi_dbm: -55,
  };

  it('produces zero violations for normal environmental ranges', () => {
    const violations = evaluateTelemetryViolations(normalTelemetry, false);
    expect(Object.keys(violations)).toHaveLength(0);
  });

  it('detects high temperature violation when temperature exceeds 36.5°C', () => {
    const highTempTelemetry: TelemetryData = {
      ...normalTelemetry,
      temperature_c: 37.2,
    };

    const violations = evaluateTelemetryViolations(highTempTelemetry, false);
    expect(violations['temp_high']).toBeDefined();
    expect(violations['temp_high'].level).toBe('warning');
    expect(violations['temp_high'].type).toBe('temperature');
    expect(violations['temp_high'].title).toBe('Peringatan Termal Tinggi');
  });

  it('elevates to danger level for extreme temperature >= 38.0°C', () => {
    const extremeTempTelemetry: TelemetryData = {
      ...normalTelemetry,
      temperature_c: 38.5,
    };

    const violations = evaluateTelemetryViolations(extremeTempTelemetry, false);
    expect(violations['temp_high']).toBeDefined();
    expect(violations['temp_high'].level).toBe('danger');
  });

  it('detects abnormal low temperature <= 18.0°C', () => {
    const lowTempTelemetry: TelemetryData = {
      ...normalTelemetry,
      temperature_c: 16.5,
    };

    const violations = evaluateTelemetryViolations(lowTempTelemetry, false);
    expect(violations['temp_low']).toBeDefined();
    expect(violations['temp_low'].title).toBe('Suhu Tidak Wajar Rendah');
  });

  it('detects excessive humidity >= 88%', () => {
    const highHumidTelemetry: TelemetryData = {
      ...normalTelemetry,
      humidity_percent: 91.5,
    };

    const violations = evaluateTelemetryViolations(highHumidTelemetry, false);
    expect(violations['humid_high']).toBeDefined();
    expect(violations['humid_high'].type).toBe('humidity');
    expect(violations['humid_high'].title).toBe('Kelembaban Sangat Tinggi');
  });

  it('detects high gas concentration / smoke on MQ135 >= 3400 ADC', () => {
    const highGasTelemetry: TelemetryData = {
      ...normalTelemetry,
      mq135_raw: 3600,
      mq135_sensor_mv: 4800,
    };

    const violations = evaluateTelemetryViolations(highGasTelemetry, false);
    expect(violations['gas_high']).toBeDefined();
    expect(violations['gas_high'].type).toBe('gas');
    expect(violations['gas_high'].title).toContain('Gas / Asap');
  });

  it('detects watchdog stale condition when node is silent >15s', () => {
    const violations = evaluateTelemetryViolations(normalTelemetry, true);
    expect(violations['stale_node']).toBeDefined();
    expect(violations['stale_node'].type).toBe('stale');
    expect(violations['stale_node'].metricValue).toBe('STALE');
  });
});
