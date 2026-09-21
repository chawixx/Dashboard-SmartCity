# PRD

# AetherSense

## ESP32-S3 Environmental Telemetry Dashboard

---

# 1. Project Overview

AetherSense adalah sistem monitoring lingkungan realtime menggunakan:

```text
ESP32-S3
DHT22
MQ135
Wi-Fi
HiveMQ Public MQTT Broker
React Dashboard
```

Tujuan sistem adalah mengirimkan data sensor dari ESP32-S3 ke MQTT broker publik HiveMQ dan menampilkan telemetry secara realtime pada dashboard React.

---

# 2. System Architecture

```text
┌──────────────┐
│    DHT22     │
│ Temp/Humid   │
└──────┬───────┘
       │
       │ GPIO6
       │
┌──────▼────────────────┐
│       ESP32-S3        │
│                       │
│ GPIO6 → DHT22         │
│ GPIO7 → MQ135 ADC     │
│ Wi-Fi                 │
│ MQTT Client           │
└──────────┬────────────┘
           │
           │ MQTT TCP
           │ Port 1883
           ▼
┌────────────────────────────┐
│    HiveMQ Public Broker    │
│   broker.hivemq.com        │
└────────────┬───────────────┘
             │
             │ MQTT WebSocket
             │ Port 8000
             ▼
┌────────────────────────────┐
│      React Dashboard       │
│                            │
│ Temperature                │
│ Humidity                   │
│ MQ135                      │
│ Wi-Fi                      │
│ Device Status              │
│ Realtime Charts            │
└────────────────────────────┘
```

HiveMQ menyediakan public broker untuk testing dan eksperimen, tetapi broker tersebut bersifat shared/public. Data pada topic dapat dibaca oleh pihak lain yang mengetahui topic tersebut.

---

# 3. Broker Configuration

## MQTT TCP

```text
Host:
broker.hivemq.com

Port:
1883

TLS:
No

Username:
None

Password:
None
```

HiveMQ mendokumentasikan port 1883 sebagai MQTT non-TLS standar.

## MQTT WebSocket

```text
Protocol:
ws

Host:
broker.hivemq.com

Port:
8000

Path:
/mqtt
```

Endpoint:

```text
ws://broker.hivemq.com:8000/mqtt
```

HiveMQ mendokumentasikan endpoint WebSocket tersebut secara langsung.

---

# 4. Important Security Model

Public broker tidak memberikan private namespace.

Semua client yang mengetahui topic dapat subscribe topic tersebut.

Karena itu:

### Dilarang

* password
* API key
* token
* private telemetry
* credential
* data pribadi

dimasukkan ke MQTT payload.

### Diwajibkan

Setiap device harus mempunyai namespace topic unik.

Contoh:

```text
aethersense/esp32s3-ABCD12345678/telemetry
```

bukan:

```text
sensor/data
```

atau:

```text
temperature
```

Topic generik sangat mudah bentrok dengan pengguna lain di public broker.

---

# 5. MQTT Namespace

Root:

```text
aethersense/
```

Device:

```text
aethersense/{device_id}/
```

Telemetry:

```text
aethersense/{device_id}/telemetry
```

Status:

```text
aethersense/{device_id}/status
```

Contoh:

```text
aethersense/esp32s3-ABCD12345678/telemetry
aethersense/esp32s3-ABCD12345678/status
```

---

# 6. MQTT Client ID

Client ID harus unik.

ESP32:

```text
esp32s3-{chip_identifier}
```

Contoh:

```text
esp32s3-ABCD12345678
```

React dashboard harus menggunakan client ID berbeda.

Contoh:

```text
aethersense-web-{random-id}
```

Jangan menggunakan:

```text
esp32s3-env-01
```

sebagai Client ID React.

Duplicate MQTT Client ID dapat menyebabkan masalah koneksi karena broker memperlakukan client ID sebagai identitas koneksi.

---

# 7. Telemetry Payload

Topic:

```text
aethersense/{device_id}/telemetry
```

Payload:

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
  "wifi_rssi_dbm": -54
}
```

---

# 8. Telemetry Type

```ts
interface TelemetryData {
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
}
```

---

# 9. Sensor Interpretation

## DHT22

Temperature:

```text
temperature_c
```

Humidity:

```text
humidity_percent
```

## MQ135

Dashboard hanya boleh menampilkan:

```text
MQ135 RAW
MQ135 ADC
MQ135 SENSOR VOLTAGE
```

Jangan menampilkan:

```text
CO2 ppm
AQI
Air Quality %
```

karena data tersebut belum dikalibrasi.

---

# 10. Dashboard Concept

Nama:

```text
AETHERsense
```

Visual identity:

```text
ABSTRACT ENVIRONMENTAL TELEMETRY
```

Dashboard harus terasa seperti:

```text
scientific visualization
+
environmental telemetry
+
digital atmosphere
```

---

# 11. Visual Style

Gunakan:

* dark background
* soft atmospheric gradients
* abstract signal paths
* fine grid
* subtle glow
* translucent surfaces
* waveform-inspired graphics
* data particles
* thin technical borders

Jangan membuat:

* generic admin panel
* generic SaaS dashboard
* RGB gaming UI
* excessive neon
* excessive rounded cards

Visual harus abstrak, tetapi informasi harus tetap mudah dipahami.

---

# 12. Main Dashboard

Header:

```text
AETHERsense
ESP32-S3
MQTT ● CONNECTED
```

Main metrics:

```text
TEMPERATURE
28.43 °C

HUMIDITY
71.20 %

MQ135
1852
```

Device health:

```text
DEVICE
ESP32-S3

STATUS
ONLINE

RSSI
-54 dBm

UPTIME
00:06:21
```

---

# 13. MQTT Connection State

Frontend harus memiliki:

```text
DISCONNECTED
CONNECTING
CONNECTED
RECONNECTING
ERROR
```

Contoh:

```text
MQTT ● CONNECTED
```

atau:

```text
MQTT ● RECONNECTING
```

Status tidak boleh hanya ditunjukkan melalui warna.

---

# 14. Device Status

Subscribe:

```text
aethersense/{device_id}/status
```

Payload:

```text
online
```

atau:

```text
offline
```

ESP32 menggunakan MQTT Last Will untuk status offline.

---

# 15. Realtime Charts

Minimal:

### Temperature

```text
Temperature °C
```

### Humidity

```text
Humidity %
```

### MQ135

```text
Raw ADC
```

Chart harus support:

* realtime update
* fixed sample limit
* toggle series
* tooltip
* latest value
* timestamp

---

# 16. In-Memory History

Default:

```text
300 samples
```

Implementasikan bounded buffer.

Contoh:

```text
sample 1
sample 2
...
sample 300
```

Ketika sample 301 masuk:

```text
sample 1 removed
sample 301 added
```

Tujuan:

mencegah browser memory usage meningkat tanpa batas.

---

# 17. MQTT Parser

Parser harus dipisahkan:

```text
MQTT payload
      ↓
JSON parser
      ↓
schema validation
      ↓
TelemetryData
      ↓
state
      ↓
UI
```

Invalid JSON:

```text
ignore + log controlled error
```

Jangan membuat React crash.

---

# 18. MQTT Client Architecture

```text
src/
├── mqtt/
│   ├── client.ts
│   ├── topics.ts
│   ├── parser.ts
│   └── config.ts
│
├── telemetry/
│   ├── types.ts
│   ├── store.ts
│   └── history.ts
│
├── components/
│   ├── dashboard/
│   ├── telemetry/
│   ├── charts/
│   ├── device/
│   └── ui/
│
├── hooks/
│   ├── useMqtt.ts
│   └── useTelemetry.ts
│
├── styles/
│   ├── tokens.css
│   ├── global.css
│   └── effects.css
│
└── app/
```

---

# 19. React MQTT Configuration

Environment variables:

```env
VITE_MQTT_URL=ws://broker.hivemq.com:8000/mqtt

VITE_MQTT_TELEMETRY_TOPIC=aethersense/YOUR_DEVICE_ID/telemetry

VITE_MQTT_STATUS_TOPIC=aethersense/YOUR_DEVICE_ID/status
```

Tidak ada:

```env
VITE_MQTT_USERNAME
VITE_MQTT_PASSWORD
```

karena public broker tidak membutuhkan authentication. HiveMQ menyatakan public broker dapat digunakan tanpa username/password.

---

# 20. Device Discovery

MVP tidak menggunakan wildcard sebagai mekanisme utama untuk production-like operation.

Gunakan device ID yang diketahui.

Untuk development, wildcard:

```text
aethersense/+/telemetry
```

dapat digunakan untuk melihat semua device AetherSense.

Namun UI harus tetap melakukan filtering dan validation berdasarkan payload.

---

# 21. Reconnection

Gunakan exponential backoff:

```text
1 s
2 s
4 s
8 s
16 s
30 s
30 s
...
```

Maximum retry delay:

```text
30 seconds
```

Jangan reconnect terus menerus setiap beberapa milidetik.

---

# 22. Error Handling

Handle:

* broker unavailable
* WebSocket failure
* malformed JSON
* missing property
* invalid numeric value
* stale telemetry
* duplicate sequence
* offline device
* delayed packet
* browser refresh

---

# 23. Stale Data

Telemetry dianggap stale jika tidak ada data baru dalam periode tertentu.

Contoh:

```text
> 15 seconds
```

UI:

```text
STALE TELEMETRY
```

Jika status MQTT masih connected tetapi ESP32 berhenti mengirim data, dashboard harus tetap mampu membedakan:

```text
MQTT CONNECTED
```

dengan:

```text
DEVICE TELEMETRY STALE
```

---

# 24. Security Constraints

Karena broker bersifat publik:

* Jangan menyimpan secret pada payload.
* Jangan mengirim Wi-Fi password.
* Jangan mengirim hostname internal sensitif.
* Jangan mengirim private user information.
* Jangan menganggap topic sebagai authentication mechanism.
* Jangan menggunakan dashboard ini untuk data sensitif.

Untuk aplikasi production/private:

gunakan broker dengan authentication + TLS.

HiveMQ sendiri membedakan public broker untuk testing dari broker private seperti HiveMQ Cloud yang menggunakan authentication dan TLS.

---

# 25. HTTPS Deployment Limitation

MVP menggunakan:

```text
ws://broker.hivemq.com:8000/mqtt
```

Ini cocok untuk:

```text
http://localhost
http://LAN-host
```

Namun jika React nantinya disajikan melalui HTTPS, browser dapat memblokir koneksi WebSocket non-TLS sebagai mixed content.

Karena itu production deployment harus menggunakan secure WebSocket endpoint yang mendukung WSS atau berpindah ke broker private dengan TLS.

---

# 26. Responsive Design

Desktop:

```text
header
metrics row
large visualization
device panel
activity panel
```

Tablet:

```text
2-column layout
```

Mobile:

```text
single-column
```

Chart harus tetap usable di layar kecil.

---

# 27. Accessibility

Implementasi:

* semantic HTML
* keyboard navigation
* focus state
* ARIA hanya jika diperlukan
* contrast
* text-based connection status
* chart labels
* reduced motion

Support:

```css
@media (prefers-reduced-motion: reduce)
```

---

# 28. Performance

Target:

* bounded history
* isolated component updates
* minimal rerender
* efficient chart updates
* no unnecessary animation loop
* no memory growth

Abstract visual effects tidak boleh mengalahkan telemetry rendering.

---

# 29. Project Documentation

Repository harus mempunyai:

```text
PRD.md
DESIGN.md
MQTT-CONTRACT.md
ARCHITECTURE.md
CHANGELOG.md
README.md
```

---

# 30. Development Phases

## Phase 0

Architecture audit.

## Phase 1

React initialization.

## Phase 2

MQTT WebSocket.

## Phase 3

Telemetry parser.

## Phase 4

Dashboard metrics.

## Phase 5

Realtime charts.

## Phase 6

Abstract design system.

## Phase 7

Responsive + accessibility.

## Phase 8

Error handling + reconnect.

## Phase 9

Security audit.

## Phase 10

Production validation.

---

# 31. Acceptance Criteria

Project dianggap berhasil apabila:

1. React dapat connect ke HiveMQ.
2. React dapat subscribe telemetry.
3. ESP32 dapat publish telemetry.
4. Device status dapat diterima.
5. Temperature tampil.
6. Humidity tampil.
7. MQ135 raw tampil.
8. MQ135 voltage tampil.
9. RSSI tampil.
10. Uptime tampil.
11. Realtime chart berjalan.
12. MQTT reconnect bekerja.
13. Invalid MQTT payload tidak membuat React crash.
14. History memiliki batas memory.
15. Responsive.
16. Accessible.
17. Abstract design konsisten.
18. Tidak ada secret yang di-commit.
19. MQTT topic sesuai firmware.
20. Production build berhasil.

---

# 32. Future Migration

Public broker hanya digunakan untuk:

```text
development
testing
prototype
```

Ketika sistem sudah membutuhkan privacy:

```text
HiveMQ Public
     ↓
Private MQTT Broker
     ↓
TLS
     ↓
Authentication
     ↓
React
```

MQTT topic contract harus dipertahankan agar frontend tidak perlu ditulis ulang.

---

# 33. Principle

Firmware, MQTT contract, dan frontend harus dianggap sebagai satu sistem.

Jangan mengubah:

```text
topic
payload
field name
device ID
status semantics
```

secara sepihak.

Setiap perubahan protocol harus dicatat dalam:

```text
MQTT-CONTRACT.md
CHANGELOG.md
```

