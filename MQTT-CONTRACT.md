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
| **Actuator Command** | `aethersense/{device_id}/command` | React Web | ESP32-S3 | 0 | `false` |
| **Dev Discovery** | `aethersense/+/telemetry` | *(Testing only)* | React Web | 0 | `false` |
| **Cmd Discovery** | `aethersense/+/command` | *(Testing only)* | ESP32-S3 | 0 | `false` |

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
  "mq135_raw": 780,
  "mq135_adc_mv": 605,
  "mq135_sensor_mv": 1008.3,
  "air_quality_status": "Normal / Cukup Baik",
  "is_gas_polluted": false,
  "rain_raw": 3950,
  "rain_status": "Kering",
  "is_raining": false,
  "water_distance_cm": 24.5,
  "water_level_cm": 5.5,
  "flood_status": "Aman",
  "is_flood_warning": false,
  "wifi_rssi_dbm": -54,
  "ldr_raw": 1200,
  "ambient_light": "Terang",
  "is_dark": false,
  "lighting_mode": "auto",
  "parking_total_slots": 10,
  "parking_occupied_slots": 3,
  "parking_available_slots": 7,
  "is_parking_full": false,
  "entry_gate_open": false,
  "exit_gate_open": false,
  "ir_entry_detected": false,
  "ir_exit_detected": false,
  "relays": {
    "relay1": false,
    "relay2": false,
    "relay3": false,
    "relay4": false
  },
  "relay1": false,
  "relay2": false,
  "relay3": false,
  "relay4": false
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
| `air_quality_status`| `string` (opt)| — | `Sangat Bersih` (<350), `Normal / Cukup Baik` (<1500), `Polusi Ringan` (<3000), `Tercemar` (>3000) | Human-readable gas air quality classification. |
| `is_gas_polluted`| `boolean` (opt)| — | `true` / `false` | Hazardous gas / smoke contamination flag (>3000 ADC). |
| `rain_raw` | `number` (opt)| ADC count | $0 \dots 4095$ | Raw 12-bit analog reading from Rain Sensor (Pin 8, lower = wetter). |
| `rain_status` | `string` (opt)| — | `Kering`, `Gerimis`, `Hujan Sedang`, `Hujan Lebat` | Human-readable precipitation classification. |
| `is_raining` | `boolean` (opt)| — | `true` / `false` | Precipitation presence flag based on threshold. |
| `water_distance_cm` | `number` (opt)| cm | $0.0 \dots 30.0$ | Jarak pantul ultrasonik (Trig 13, Echo 12) ke permukaan air (Maks 30 cm, makin kecil = makin banjir). |
| `water_level_cm` | `number` (opt)| cm | $0.0 \dots 30.0$ | Ketinggian muka air banjir ($30.0 - \text{water\_distance\_cm}$). |
| `flood_status` | `string` (opt)| — | `Aman`, `Waspada`, `Siaga`, `Bahaya Banjir` | River flood risk classification. |
| `is_flood_warning` | `boolean` (opt)| — | `true` / `false` | Critical flood risk indicator. |
| `ldr_raw` | `number` (opt)| ADC count | $0 \dots 4095$ | Raw 12-bit analog reading from LDR Sensor (Pin 9 ADC1, lower = brighter). |
| `ambient_light` | `string` (opt)| — | `Terang` (<3000 ADC), `Gelap` (>3000 ADC) | Human-readable ambient lighting classification (2 kondisi: <3000 mati/terang, >3000 menyala/gelap). |
| `is_dark` | `boolean` (opt)| — | `true` (>3000 ADC) / `false` (<=3000 ADC) | Flag kondisi gelap untuk pemicu otomatis relay lampu (Menyala jika true). |
| `lighting_mode` | `string` (opt)| — | `auto` / `manual` | Mode operasi penerangan kota (Auto LDR vs Manual Web). |
| `parking_total_slots` | `number` (opt)| slot | $1 \dots 100$ | Total kuota kapasitas lahan parkir (default 10 slot). |
| `parking_occupied_slots`| `number` (opt)| slot | $0 \dots 100$ | Jumlah kendaraan terparkir saat ini. |
| `parking_available_slots`| `number` (opt)| slot | $0 \dots 100$ | Sisa kuota lahan parkir kosong. |
| `is_parking_full` | `boolean` (opt)| — | `true` / `false` | Status kapasitas penuh (palang masuk otomatis terkunci). |
| `entry_gate_open` | `boolean` (opt)| — | `true` (90°) / `false` (0°) | Status posisi palang servo masuk (GPIO 21). |
| `exit_gate_open` | `boolean` (opt)| — | `true` (90°) / `false` (0°) | Status posisi palang servo keluar (GPIO 47). |
| `ir_entry_detected` | `boolean` (opt)| — | `true` / `false` | Deteksi rintangan kendaraan pada sensor IR masuk (GPIO 1). |
| `ir_exit_detected` | `boolean` (opt)| — | `true` / `false` | Deteksi rintangan kendaraan pada sensor IR keluar (GPIO 2). |
| `wifi_rssi_dbm` | `number` | dBm | $-100 \dots 0$ | Wi-Fi Received Signal Strength Indicator. |
| `relays` | `object` (opt)| — | `{ relay1..4: boolean }` | Status aktif/padam seluruh 4 kanal relay LED kota. |
| `relay1` | `boolean` (opt)| — | `true` (ON) / `false` (OFF) | Sektor 01: Kawasan Alun-Alun & Monumen (IN1 -> GPIO 38). |
| `relay2` | `boolean` (opt)| — | `true` (ON) / `false` (OFF) | Sektor 02: Koridor Jl. KH Wahid Hasyim (IN2 -> GPIO 39). |
| `relay3` | `boolean` (opt)| — | `true` (ON) / `false` (OFF) | Sektor 03: RTH & Jalur Sepeda (IN3 -> GPIO 40). |
| `relay4` | `boolean` (opt)| — | `true` (ON) / `false` (OFF) | Sektor 04: Saluran Drainase & Tanggul (IN4 -> GPIO 41). |

### 4.4 TypeScript Interface
```typescript
export type RainStatus = 'Kering' | 'Gerimis' | 'Hujan Sedang' | 'Hujan Lebat';
export type FloodStatus = 'Aman' | 'Waspada' | 'Siaga' | 'Bahaya Banjir';

export interface RelayStates {
  relay1: boolean;
  relay2: boolean;
  relay3: boolean;
  relay4: boolean;
}

export interface ParkingData {
  total_slots: number;
  occupied_slots: number;
  available_slots: number;
  is_full: boolean;
  entry_gate_open: boolean;
  exit_gate_open: boolean;
  ir_entry_detected: boolean;
  ir_exit_detected: boolean;
}

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
  water_distance_cm?: number;
  water_level_cm?: number;
  flood_status?: FloodStatus;
  is_flood_warning?: boolean;
  ldr_raw?: number;
  ambient_light?: string;
  is_dark?: boolean;
  lighting_mode?: 'auto' | 'manual';
  parking_total_slots?: number;
  parking_occupied_slots?: number;
  parking_available_slots?: number;
  is_parking_full?: boolean;
  entry_gate_open?: boolean;
  exit_gate_open?: boolean;
  ir_entry_detected?: boolean;
  ir_exit_detected?: boolean;
  parking?: ParkingData;
  relays?: RelayStates;
  relay1?: boolean;
  relay2?: boolean;
  relay3?: boolean;
  relay4?: boolean;
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

---

## 7. Actuator & Relay Command Protocol (4 Sektor Lighting)

### 7.1 Topic
```text
aethersense/{device_id}/command
```
*(Also accepts global broadcast on `aethersense/command` or `aethersense/+/command`)*

### 7.2 Hardware Pin Mapping (4-Channel Optocoupler Relay)
| Channel | ESP32-S3 GPIO | Sektor Penamaan | Peruntukan / Lokasi | Logika Aktif |
| :--- | :--- | :--- | :--- | :--- |
| **IN1** | **GPIO 38** | Sektor 01: Kawasan Alun-Alun & Monumen Bahari | Smart Pole Pedestrian & Air Mancur Sentral | `HIGH` = ON, `LOW` = OFF |
| **IN2** | **GPIO 39** | Sektor 02: Koridor Jl. KH Wahid Hasyim | Penerangan Jalan Umum (PJU) & Sentra Kuliner Barat | `HIGH` = ON, `LOW` = OFF |
| **IN3** | **GPIO 40** | Sektor 03: RTH & Jalur Sepeda Bahari | Eco-Lighting Bollard Vegetasi Pesisir | `HIGH` = ON, `LOW` = OFF |
| **IN4** | **GPIO 41** | Sektor 04: Saluran Drainase & Tanggul Pesisir | Floodlight Sorot Inspeksi Pintu Air & Tanggul | `HIGH` = ON, `LOW` = OFF |

### 7.3 Individual Sector Command Payload (JSON)
```json
{
  "type": "relay",
  "relay": 1,
  "sector": 1,
  "state": true,
  "timestamp": 1790041250
}
```

### 7.4 Master All-Sectors Command Payload (JSON)
```json
{
  "type": "relay_all",
  "relay": "all",
  "state": false,
  "timestamp": 1790041255
}
```

### 7.5 Dual-Mode Lighting Command Payload (JSON)
Switch between autonomous LDR light automation and manual web dashboard control:
```json
{
  "type": "lighting_mode",
  "action": "set_mode",
  "mode": "auto",
  "timestamp": 1790041260
}
```
* `mode`: `"auto"` (Sensor LDR aktif, menyalakan relay saat gelap dan mematikan saat terang) atau `"manual"` (Sensor LDR di-bypass, operator memegang kendali relay penuh).

### 7.6 Direct Fallback Text Commands
The firmware also supports plain ASCII text commands for testing via CLI / terminal:
* `MODE_AUTO` / `MODE_MANUAL` (Beralih mode otomatis LDR / manual web)
* `RELAY1_ON` / `RELAY1_OFF` (Sektor 1 / GPIO 38)
* `RELAY2_ON` / `RELAY2_OFF` (Sektor 2 / GPIO 39)
* `RELAY3_ON` / `RELAY3_OFF` (Sektor 3 / GPIO 40)
* `RELAY4_ON` / `RELAY4_OFF` (Sektor 4 / GPIO 41)
* `ALL_ON` / `ALL_OFF` (Seluruh 4 Sektor)

---

## 8. Smart Parking System Protocol (10 Slots & Dual-Gate Optical Barrier)

### 8.1 Hardware Pin Mapping & Logic
| Periferal | ESP32-S3 GPIO | Tipe Sinyal | Logika & Karakteristik |
| :--- | :--- | :--- | :--- |
| **IR Obstacle Masuk** | **GPIO 1** | Digital Input (`INPUT_PULLUP`) | `LOW` = Objek/Mobil Terdeteksi, `HIGH` = Bebas/Clear |
| **IR Obstacle Keluar** | **GPIO 2** | Digital Input (`INPUT_PULLUP`) | `LOW` = Objek/Mobil Terdeteksi, `HIGH` = Bebas/Clear |
| **Servo Palang Masuk** | **GPIO 21** | PWM Output (ESP32Servo 50Hz) | `0°` = Palang Tertutup, `90°` = Palang Terbuka |
| **Servo Palang Keluar**| **GPIO 47** | PWM Output (ESP32Servo 50Hz) | `0°` = Palang Tertutup, `90°` = Palang Terbuka |

> [!IMPORTANT]
> **Power Supply Servo:** 2 unit servo SG90 wajib diberi daya dari regulator 5V eksternal mandiri (arus puncak ~800mA) dengan ground terhubung (*common ground*) ke ESP32-S3 untuk menghindari brownout reset pada mikrokontroler.

### 8.2 Otomatisasi Palang & Logika Kuota (Non-Blocking State Machine)
1. **Kendaraan Masuk:**
   * Deteksi `IR_ENTRY_PIN == LOW`.
   * Jika kuota parkir masih tersedia (`occupiedParkingSlots < TOTAL_PARKING_SLOTS`), palang masuk membuka ke 90° (`servoEntry.write(90)`).
   * Jika kuota penuh (10/10), palang tetap terkunci di 0° dan indikator penolakan aktif.
   * Saat kendaraan selesai melintasi sensor (`IR_ENTRY_PIN == HIGH`) ditambah jeda lintasan aman 1500ms, palang masuk menutup kembali (`0°`), jumlah slot terisi bertambah 1 (`occupied++`), dan telemetri langsung dipublikasikan.
2. **Kendaraan Keluar:**
   * Deteksi `IR_EXIT_PIN == LOW`.
   * Palang keluar otomatis membuka ke 90° (`servoExit.write(90)`).
   * Saat kendaraan selesai melintasi sensor ditambah jeda lintasan 1500ms, palang keluar menutup kembali (`0°`), jumlah slot terisi berkurang 1 (minimum 0), dan telemetri langsung dipublikasikan.

### 8.3 Reset Kuota Slot Command (Kalibrasi / Testing Manual)
Perintah reset kuota dikirim dari tombol web dashboard ke topic command:
```text
aethersense/{device_id}/command
```

**Payload JSON:**
```json
{
  "type": "parking_reset",
  "occupied": 0,
  "timestamp": 1790041270
}
```

**Direct Fallback Text Command:**
```text
PARK_RESET
```
Saat diterima oleh firmware, `occupiedParkingSlots` diatur kembali ke `0`, kedua servo dipastikan tertutup (`0°`), dan data telemetri mutakhir langsung dipancarkan ke broker MQTT.



