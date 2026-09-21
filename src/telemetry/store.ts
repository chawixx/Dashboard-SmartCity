/**
 * Telemetry State Store & Stale Watchdog with Bounded Ring Buffer & Fault Tolerance
 * Strictly adheres to PRD Section 7, 8, 9, 12, 14, 15, 16, 17, 21, 22, 23, 28
 */

import { type TelemetryData, type DeviceStatus } from './types';
import { BoundedRingBuffer, createHistoryPoint, type TelemetryHistoryPoint } from './history';
import { parseTelemetryPayload, parseDeviceStatus } from '../mqtt/parser';
import { isTelemetryTopic, isStatusTopic } from '../mqtt/topics';

export interface TelemetryState {
  latestTelemetry: TelemetryData | null;
  deviceStatus: DeviceStatus;
  lastReceivedAt: number | null;
  isStale: boolean;
  packetCount: number;
  errorCount: number;
  duplicateCount: number;
  delayedCount: number;
  lastError: string | null;
  history: TelemetryHistoryPoint[];
}

export type TelemetryListener = (state: TelemetryState) => void;

export class TelemetryStore {
  private ringBuffer: BoundedRingBuffer<TelemetryHistoryPoint>;
  private state: TelemetryState;
  private listeners: Set<TelemetryListener> = new Set();
  private watchdogTimer: ReturnType<typeof setInterval> | null = null;
  private readonly STALE_THRESHOLD_MS = 15000; // 15 seconds (PRD Section 23)

  constructor(historyCapacity: number = 300) {
    this.ringBuffer = new BoundedRingBuffer<TelemetryHistoryPoint>(historyCapacity);
    this.state = {
      latestTelemetry: null,
      deviceStatus: 'unknown',
      lastReceivedAt: null,
      isStale: false,
      packetCount: 0,
      errorCount: 0,
      duplicateCount: 0,
      delayedCount: 0,
      lastError: null,
      history: [],
    };
    this.startWatchdog();
  }

  public getState(): TelemetryState {
    return this.state;
  }

  public getHistory(): TelemetryHistoryPoint[] {
    return this.ringBuffer.toArray();
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Processes incoming MQTT message on either telemetry or status topic.
   * Handles malformed JSON, out-of-order packets, duplicates, and stale states (PRD Section 22).
   */
  public ingestMessage(topic: string, rawPayload: string, expectedDeviceId?: string): void {
    if (isStatusTopic(topic, expectedDeviceId)) {
      const status = parseDeviceStatus(rawPayload);
      this.updateState({
        deviceStatus: status,
      });
      return;
    }

    if (isTelemetryTopic(topic, expectedDeviceId)) {
      const parseResult = parseTelemetryPayload(rawPayload, expectedDeviceId);

      if (parseResult.success) {
        const incoming = parseResult.data;
        let isDuplicate = false;
        let isDelayed = false;

        // Duplicate sequence detection (PRD Section 22)
        if (this.state.latestTelemetry && incoming.sequence <= this.state.latestTelemetry.sequence) {
          isDuplicate = true;
        }

        // Delayed packet detection (> 60 seconds delta) (PRD Section 22)
        const nowSec = Math.floor(Date.now() / 1000);
        if (Math.abs(nowSec - incoming.timestamp) > 60) {
          isDelayed = true;
        }

        const historyPoint = createHistoryPoint(incoming);
        this.ringBuffer.push(historyPoint);

        this.updateState({
          latestTelemetry: incoming,
          lastReceivedAt: Date.now(),
          isStale: false,
          packetCount: this.state.packetCount + 1,
          duplicateCount: isDuplicate ? this.state.duplicateCount + 1 : this.state.duplicateCount,
          delayedCount: isDelayed ? this.state.delayedCount + 1 : this.state.delayedCount,
          lastError: null,
          history: this.ringBuffer.toArray(),
          // Infer online if telemetry is actively flowing
          deviceStatus: this.state.deviceStatus === 'offline' ? 'online' : this.state.deviceStatus,
        });
      } else {
        this.updateState({
          errorCount: this.state.errorCount + 1,
          lastError: parseResult.error,
        });
      }
    }
  }

  /**
   * Reset store (e.g. upon intentional disconnect or device switch)
   */
  public reset(): void {
    this.ringBuffer.clear();
    this.updateState({
      latestTelemetry: null,
      deviceStatus: 'unknown',
      lastReceivedAt: null,
      isStale: false,
      packetCount: 0,
      errorCount: 0,
      duplicateCount: 0,
      delayedCount: 0,
      lastError: null,
      history: [],
    });
  }

  public destroy(): void {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    this.listeners.clear();
  }

  private startWatchdog(): void {
    if (this.watchdogTimer) return;

    // Tick every second to evaluate stale telemetry condition
    this.watchdogTimer = setInterval(() => {
      if (this.state.lastReceivedAt && !this.state.isStale) {
        const elapsed = Date.now() - this.state.lastReceivedAt;
        if (elapsed > this.STALE_THRESHOLD_MS) {
          this.updateState({ isStale: true });
        }
      }
    }, 1000);
  }

  private updateState(partial: Partial<TelemetryState>): void {
    this.state = {
      ...this.state,
      ...partial,
    };
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (err) {
        console.error('[TelemetryStore] Error in state listener callback:', err);
      }
    });
  }
}

// Global singleton telemetry store instance
export const defaultTelemetryStore = new TelemetryStore(300);
