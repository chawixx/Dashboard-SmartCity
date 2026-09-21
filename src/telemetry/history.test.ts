import { describe, it, expect } from 'vitest';
import { BoundedRingBuffer, createHistoryPoint } from './history';
import { type TelemetryData } from './types';

describe('BoundedRingBuffer (PRD Section 16 & 28)', () => {
  it('stores elements up to capacity without eviction', () => {
    const buffer = new BoundedRingBuffer<number>(3);
    expect(buffer.size()).toBe(0);
    expect(buffer.isFull()).toBe(false);

    buffer.push(10);
    buffer.push(20);
    expect(buffer.size()).toBe(2);
    expect(buffer.toArray()).toEqual([10, 20]);
    expect(buffer.isFull()).toBe(false);

    buffer.push(30);
    expect(buffer.size()).toBe(3);
    expect(buffer.toArray()).toEqual([10, 20, 30]);
    expect(buffer.isFull()).toBe(true);
  });

  it('evicts the oldest element in O(1) when capacity is exceeded (sample 301 overwrites sample 1)', () => {
    const buffer = new BoundedRingBuffer<number>(3);
    buffer.push(1);
    buffer.push(2);
    buffer.push(3);

    // 4th element added: 1 should be evicted, [2, 3, 4] remains
    buffer.push(4);
    expect(buffer.size()).toBe(3);
    expect(buffer.toArray()).toEqual([2, 3, 4]);

    // 5th element added: 2 should be evicted, [3, 4, 5] remains
    buffer.push(5);
    expect(buffer.size()).toBe(3);
    expect(buffer.toArray()).toEqual([3, 4, 5]);

    expect(buffer.getLatest()).toBe(5);
  });

  it('handles default capacity of 300 samples correctly', () => {
    const buffer = new BoundedRingBuffer<number>(); // default 300
    expect(buffer.capacity()).toBe(300);

    for (let i = 1; i <= 350; i++) {
      buffer.push(i);
    }

    expect(buffer.size()).toBe(300);
    const array = buffer.toArray();
    expect(array.length).toBe(300);
    expect(array[0]).toBe(51); // Oldest remaining item
    expect(array[299]).toBe(350); // Newest item
    expect(buffer.getLatest()).toBe(350);
  });

  it('clears buffer accurately', () => {
    const buffer = new BoundedRingBuffer<string>(5);
    buffer.push('a');
    buffer.push('b');
    expect(buffer.size()).toBe(2);

    buffer.clear();
    expect(buffer.size()).toBe(0);
    expect(buffer.toArray()).toEqual([]);
    expect(buffer.getLatest()).toBeUndefined();
  });
});

describe('createHistoryPoint helper', () => {
  it('converts TelemetryData packet into normalized history point', () => {
    const sample: TelemetryData = {
      device_id: 'esp32s3-ABCD12345678',
      sequence: 42,
      timestamp: 1790041200,
      uptime_s: 381,
      temperature_c: 28.43,
      humidity_percent: 71.2,
      mq135_raw: 1852,
      mq135_adc_mv: 1478,
      mq135_sensor_mv: 2463.33,
      wifi_rssi_dbm: -54,
    };

    const point = createHistoryPoint(sample);
    expect(point.sequence).toBe(42);
    expect(point.temperature_c).toBe(28.43);
    expect(point.humidity_percent).toBe(71.2);
    expect(point.mq135_raw).toBe(1852);
    expect(point.formattedTime).toBeTruthy();
  });
});
