/**
 * React Hook for Telemetry State and Ingestion
 * Strictly adheres to PRD Sections 12, 14, 18, 23
 */

import { useState, useEffect } from 'react';
import { type TelemetryData, type DeviceStatus } from '../telemetry/types';
import { defaultTelemetryStore, TelemetryStore } from '../telemetry/store';
import { defaultAetherClient, AetherMqttClient } from '../mqtt/client';
import { formatUptime, getRssiQuality, type RssiQuality } from '../telemetry/formatters';

export interface UseTelemetryOptions {
  store?: TelemetryStore;
  client?: AetherMqttClient;
  expectedDeviceId?: string;
}

export interface UseTelemetryReturn {
  telemetry: TelemetryData | null;
  deviceStatus: DeviceStatus;
  isStale: boolean;
  lastReceivedAt: number | null;
  packetCount: number;
  errorCount: number;
  duplicateCount: number;
  delayedCount: number;
  lastError: string | null;
  formattedUptime: string;
  rssiQuality: RssiQuality | null;
  history: import('../telemetry/history').TelemetryHistoryPoint[];
}

export function useTelemetry(options: UseTelemetryOptions = {}): UseTelemetryReturn {
  const store = options.store || defaultTelemetryStore;
  const client = options.client || defaultAetherClient;
  const expectedDeviceId = options.expectedDeviceId;

  const [state, setState] = useState(store.getState());

  useEffect(() => {
    // 1. Subscribe to local store changes
    const unsubStore = store.subscribe((newState) => {
      setState(newState);
    });

    // 2. Wire MQTT messages to the telemetry store
    const unsubMqtt = client.onMessage((topic, payload) => {
      store.ingestMessage(topic, payload, expectedDeviceId);
    });

    return () => {
      unsubStore();
      unsubMqtt();
    };
  }, [store, client, expectedDeviceId]);

  const telemetry = state.latestTelemetry;
  const formattedUptime = telemetry ? formatUptime(telemetry.uptime_s) : '--:--:--';
  const rssiQuality = telemetry ? getRssiQuality(telemetry.wifi_rssi_dbm) : null;

  return {
    telemetry,
    deviceStatus: state.deviceStatus,
    isStale: state.isStale,
    lastReceivedAt: state.lastReceivedAt,
    packetCount: state.packetCount,
    errorCount: state.errorCount,
    duplicateCount: state.duplicateCount,
    delayedCount: state.delayedCount,
    lastError: state.lastError,
    formattedUptime,
    rssiQuality,
    history: state.history,
  };
}
