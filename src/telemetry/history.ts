/**
 * Bounded Ring Buffer & In-Memory Telemetry History
 * Strictly adheres to PRD Section 15, 16, 28, and ARCHITECTURE.md Section 4
 */

import { type TelemetryData, type RelayStates } from './types';

export interface TelemetryHistoryPoint {
  timestamp: number;
  sequence: number;
  temperature_c: number;
  humidity_percent: number;
  mq135_raw: number;
  mq135_adc_mv: number;
  mq135_sensor_mv: number;
  rain_raw?: number;
  rain_status?: string;
  is_raining?: boolean;
  water_level_raw?: number;
  water_level_cm?: number;
  water_distance_cm?: number;
  flood_status?: string;
  is_flood_warning?: boolean;
  relays?: RelayStates;
  relay1?: boolean;
  relay2?: boolean;
  relay3?: boolean;
  relay4?: boolean;
  formattedTime: string;
}

/**
 * High-performance, memory-bounded Circular Ring Buffer.
 * Capped strictly at `capacity` (default 300 samples per PRD Section 16).
 * Ensures O(1) push and zero unbounded heap growth over days of continuous operation.
 */
export class BoundedRingBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0; // index of the oldest element
  private tail: number = 0; // index where the next element will be written
  private count: number = 0;
  private readonly maxCapacity: number;

  constructor(capacity: number = 300) {
    if (capacity <= 0) {
      throw new Error('Capacity must be a positive integer');
    }
    this.maxCapacity = Math.floor(capacity);
    this.buffer = new Array(this.maxCapacity);
  }

  /**
   * Appends an item to the buffer.
   * If capacity is reached, the oldest element is overwritten in O(1) time.
   */
  public push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.maxCapacity;

    if (this.count < this.maxCapacity) {
      this.count++;
    } else {
      // Buffer is full: advance head to discard the overwritten oldest element
      this.head = (this.head + 1) % this.maxCapacity;
    }
  }

  /**
   * Returns all stored items in chronological order (from oldest to newest).
   */
  public toArray(): T[] {
    const result: T[] = new Array(this.count);
    for (let i = 0; i < this.count; i++) {
      const idx = (this.head + i) % this.maxCapacity;
      result[i] = this.buffer[idx] as T;
    }
    return result;
  }

  /**
   * Returns the most recently added item, or undefined if empty.
   */
  public getLatest(): T | undefined {
    if (this.count === 0) return undefined;
    const latestIdx = (this.tail - 1 + this.maxCapacity) % this.maxCapacity;
    return this.buffer[latestIdx];
  }

  /**
   * Returns current element count.
   */
  public size(): number {
    return this.count;
  }

  /**
   * Returns maximum capacity.
   */
  public capacity(): number {
    return this.maxCapacity;
  }

  /**
   * Returns true if buffer reached its capacity cap.
   */
  public isFull(): boolean {
    return this.count >= this.maxCapacity;
  }

  /**
   * Clears the buffer.
   */
  public clear(): void {
    this.buffer = new Array(this.maxCapacity);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }
}

/**
 * Converts a TelemetryData packet into a normalized chart history point.
 */
export function createHistoryPoint(telemetry: TelemetryData): TelemetryHistoryPoint {
  const date = new Date(telemetry.timestamp > 10000000000 ? telemetry.timestamp : telemetry.timestamp * 1000);
  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return {
    timestamp: telemetry.timestamp,
    sequence: telemetry.sequence,
    temperature_c: telemetry.temperature_c,
    humidity_percent: telemetry.humidity_percent,
    mq135_raw: telemetry.mq135_raw,
    mq135_adc_mv: telemetry.mq135_adc_mv,
    mq135_sensor_mv: telemetry.mq135_sensor_mv,
    rain_raw: telemetry.rain_raw,
    rain_status: telemetry.rain_status,
    is_raining: telemetry.is_raining,
    water_level_raw: telemetry.water_level_raw,
    water_level_cm: telemetry.water_level_cm,
    water_distance_cm: telemetry.water_distance_cm,
    flood_status: telemetry.flood_status,
    is_flood_warning: telemetry.is_flood_warning,
    relays: telemetry.relays,
    relay1: telemetry.relay1,
    relay2: telemetry.relay2,
    relay3: telemetry.relay3,
    relay4: telemetry.relay4,
    formattedTime,
  };
}
