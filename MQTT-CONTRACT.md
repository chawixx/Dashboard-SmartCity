# AetherSense — MQTT Protocol Contract Specification

## Document Metadata
* **Project:** AetherSense — ESP32-S3 Environmental Telemetry Dashboard
* **Phase:** Phase 0 — Architecture Audit
* **Version:** 1.0.0
* **Date:** 2026-09-21
* **Status:** Strict Protocol Standard

---

## 1. Broker Specification

| Parameter | Embedded Edge (ESP32-S3) | Web Dashboard (React SPA) |
| :--- | :--- | :--- |
| **Broker Host** | `broker.hivemq.com` | `broker.hivemq.com` |
| **Protocol** | MQTT over TCP | MQTT over WebSockets (`ws://`) |
| **Port** | `1883` | `8000` |
| **Path / Mount** | N/A | `/mqtt` |
| **Full URI** | `mqtt://broker.hivemq.com:1883` | `ws://broker.hivemq.com:8000/mqtt` |
| **TLS / SSL** | None (Cleartext) | None (Cleartext) |
| **Authentication** | Anonymous (No Username/Password) | Anonymous (No Username/Password) |
| **Keep Alive** | 60 seconds | 60 seconds |
| **Clean Session**| `true` | `true` |

> [!WARNING]
> Because `broker.hivemq.com` is a public testing broker, all published packets are world-readable. Absolutely **no sensitive data, passwords, credentials, or private internal network identifiers** may be sent over this transport.

---

## 2. Client Identifier Rules

Every connected client must provide a unique `clientId` upon connection. Duplicate IDs will cause the broker to terminate previous connections.

* **ESP32-S3 Edge Client:**
  * Format: `esp32s3-{chip_identifier}`
  * Chip identifier is derived from the hardware MAC address (hexadecimal without colons).
  * Example: `esp32s3-ABCD12345678`
* **React Web Client:**
  * Format: `aethersense-web-{random_id}`
  * Random identifier generated per session (`crypto.randomUUID().slice(0, 8)`).
  * Example: `aethersense-web-e89a1f2b`

---

## 3. Topic Structure & Subscriptions

### 3.1 Topic Definitions

| Function | Topic Pattern | Publisher | Subscriber | QoS | Retain |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **Telemetry** | `aethersense/{device_id}/telemetry` | ESP32-S3 | React Web | 0 | `false` |
| **Device Status** | `aethersense/{device_id}/status` | ESP32-S3 | React Web | 1 | `true` |
| **Dev Discovery** | `aethersense/+/telemetry` | *(Testing only)* | React Web | 0 | `false` |

### 3.2 Last Will and Testament (LWT)
When the ESP32-S3 connects, it registers an LWT configuration with the broker:
* **Topic:** `aethersense/{device_id}/status`
* **Payload:** `offline`
* **QoS:** `1`
* **Retain:** `true`

Upon successful initialization, the firmware immediately publishes:
* **Topic:** `aethersense/{device_id}/status`
* **Payload:** `online`
* **QoS:** `1`
* **Retain:** `true`

When the ESP32 shuts down gracefully, it publishes `offline` before disconnecting. If power or Wi-Fi drops ungracefully, the HiveMQ broker automatically emits the retained `offline` message to subscribers.

---

## 4. Telemetry Payload Contract

### 4.1 Topic
```text
aethersense/{device_id}/telemetry
```

### 4.2 Payload Format (JSON)
```json
{
  "device_id": "esp32s3-ABCD12345678",
  "sequence": 42,
  "timestamp": 1790041200,
  "uptime_s": 381,
  "temperature_c": 28.43,
  "humidity_percent": 71.20,
  "mq135_raw": 1852,
  "mq135_adc_mv": 1478,
  "mq135_sensor_mv": 2463.33,
  "rain_raw": 3950,
  "rain_status": "Kering",
  "is_raining": false,
  "wifi_rssi_dbm": -54
}
```

### 4.3 Field Schema & Semantics

| Field Name | Type | Unit | Range / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `device_id` | `string` | — | Non-empty, matches topic | Unique hardware ID of the transmitting node. |
| `sequence` | `number` | integer | $0 \dots 2^{32}-1$ | Monotonically incrementing packet index. |
| `timestamp` | `number` | Unix (sec) | $> 0$ | Epoch timestamp from NTP or edge timer. |
| `uptime_s` | `number` | seconds | $\ge 0$ | Cumulative device uptime since last boot. |
| `temperature_c` | `number` | °C | $-40.0 \dots +80.0$ | Ambient temperature measured by DHT22. |
| `humidity_percent`| `number` | % RH | $0.0 \dots 100.0$ | Relative humidity measured by DHT22. |
| `mq135_raw` | `number` | ADC count | $0 \dots 4095$ | Raw 12-bit analog reading from ESP32 ADC1. |
| `mq135_adc_mv` | `number` | mV | $0 \dots 3300$ | Calibrated voltage at ESP32 input pin. |
| `mq135_sensor_mv`| `number` | mV | $0 \dots 5000$ | Inferred voltage at MQ-135 sensor output. |
| `rain_raw` | `number` (opt)| ADC count | $0 \dots 4095$ | Raw 12-bit analog reading from Rain Sensor (Pin 8, lower = wetter). |
| `rain_status` | `string` (opt)| — | `Kering`, `Gerimis`, `Hujan Sedang`, `Hujan Lebat` | Human-readable precipitation classification. |
| `is_raining` | `boolean` (opt)| — | `true` / `false` | Precipitation presence flag based on threshold. |
| `wifi_rssi_dbm` | `number` | dBm | $-100 \dots 0$ | Wi-Fi Received Signal Strength Indicator. |

### 4.4 TypeScript Interface
```typescript
export type RainStatus = 'Kering' | 'Gerimis' | 'Hujan Sedang' | 'Hujan Lebat';

export interface TelemetryData {
  device_id: string;
  sequence: number;
  timestamp: number;
  uptime_s: number;
  temperature_c: number;
  humidity_percent: number;
  mq135_raw: number;
  mq135_adc_mv: number;
  mq135_sensor_mv: number;
  wifi_rssi_dbm: number;
  rain_raw?: number;
  rain_status?: RainStatus;
  is_raining?: boolean;
}

export type DeviceStatusPayload = 'online' | 'offline';
```

---

## 5. Strict Sensor Interpretation Rules

> [!CAUTION]
> **MQ135 Gas Sensor Display Restriction:**
> * The frontend **MUST ONLY** display:
>   1. `MQ135 RAW` (Raw ADC count)
>   2. `MQ135 ADC` (ADC voltage in mV)
>   3. `MQ135 SENSOR VOLTAGE` (Sensor voltage in mV)
> * The frontend **IS STRICTLY FORBIDDEN** from calculating or displaying:
>   - `CO2 ppm`
>   - `AQI` (Air Quality Index)
>   - `Air Quality %`
>
> *Rationale:* The MQ-135 is a metal oxide semiconductor (MOS) sensor that requires controlled burn-in, temperature/humidity baseline compensation, and laboratory gas calibration curves. Uncalibrated conversions produce misleading figures.

---

## 6. Parsing & Error Handling Standards

1. **Non-Throwing Parser:** All MQTT messages must be processed inside try/catch blocks. Malformed JSON packets must be dropped silently or logged with rate-limited debugging warnings.
2. **Type Enforcement:** If any numerical field is `NaN`, `null`, `undefined`, or outside acceptable physical limits, the packet is flagged invalid and discarded.
3. **Immutability:** Field names in the contract cannot be changed without incrementing the protocol version and documenting in `CHANGELOG.md`.
