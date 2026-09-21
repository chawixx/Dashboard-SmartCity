# AetherSense — Security & Telemetry Leakage Audit Specification

**Document Version:** 1.0.0  
**Phase:** Phase 9 (Security & Telemetry Leakage Audit)  
**Status:** Approved & Verified  
**Target Systems:** ESP32-S3 Edge Firmware, HiveMQ Public MQTT Broker, React Single Page Application Dashboard  

---

## 1. Threat Model & Public Broker Constraints

The AetherSense telemetry pipeline utilizes the public HiveMQ MQTT broker (`broker.hivemq.com:8000/mqtt` for WebSockets and `broker.hivemq.com:1883` for TCP edge transport) during development and prototyping.

### 1.1 Public Broker Characteristics
* **World-Readable:** Any client globally connected to the HiveMQ public broker can subscribe to any topic without authentication.
* **Anonymous Access:** Non-TLS transport with no usernames, passwords, or certificate validation required.
* **Shared Namespace:** Potential for topic collision if generic topic names are used.

### 1.2 Core Security Rules (PRD Section 4 & 6)
1. **NO Credentials or Secrets in Payloads:**
   - Wi-Fi SSIDs and passwords must NEVER appear in MQTT payloads or source code.
   - API keys, tokens, auth headers, and private keys are strictly forbidden across all topics.
2. **NO Internal Network Identifiers:**
   - Microcontroller local IP addresses (`192.168.x.x`, `10.x.x.x`), MAC addresses, gateway IPs, and BSSIDs must NEVER be transmitted.
   - Device identity is confined strictly to a non-sensitive identifier (e.g., `esp32s3-ABCD12345678`).
3. **Unique Client ID Separation:**
   - React clients generate session-unique IDs with prefix `aethersense-web-{random-id}`.
   - ESP32 microcontrollers use hardware chip ID prefix `esp32s3-{chip_id}`.
   - Distinct prefixes guarantee zero client ID collision, eliminating connection drop-loops caused by MQTT protocol client eviction (PRD Section 6).
4. **Hierarchical Namespace Isolation:**
   - All topics are scoped under `aethersense/{device_id}/` (e.g., `aethersense/esp32s3-ABCD12345678/telemetry`).
   - Generic topics (e.g., `sensor/data`, `temperature`) are strictly prohibited.

---

## 2. Secrets & Repository Leakage Audit

A comprehensive automated and manual security scan was conducted across the entire codebase.

### 2.1 Audit Results Summary

| Category | Scan Target | Result | Status |
| :--- | :--- | :--- | :--- |
| **API Keys & Tokens** | All source files (`src/**`), configs, and docs | 0 found | PASSED |
| **Passwords & Credentials** | Environment files and source code | 0 found | PASSED |
| **Internal IP Addresses** | Private ranges (`192.168.*`, `10.*`, `172.16-31.*`) | 0 found | PASSED |
| **Private Keys & Certs** | `*.pem`, `*.key`, `*.cert`, `*.pfx` | 0 found | PASSED |
| **Git Tracking Check** | `.gitignore` rules for `.env` and `.env.*.local` | Verified ignored | PASSED |
| **Documentation Check** | `.env.example` sanitization | No real credentials | PASSED |

### 2.2 Git Ignore Safeguards
The repository `.gitignore` explicitly enforces exclusion of sensitive environment files:
```gitignore
# Environment variables and secrets
.env
.env.local
.env.*.local
!.env.example

# Security & Credentials
*.pem
*.key
*.crt
*.cert
*.pfx
```

---

## 3. Payload Whitelisting & Prototype Pollution Defense

### 3.1 Strict Field Whitelisting
The non-throwing parser (`src/mqtt/parser.ts`) uses strict field extraction. Incoming JSON payloads are not passed directly into React state. Instead, only validated attributes are mapped to a pristine `TelemetryData` object:

```typescript
const validTelemetry: TelemetryData = {
  device_id: deviceId,
  sequence: Math.floor(obj.sequence),
  timestamp: Math.floor(obj.timestamp),
  uptime_s: Math.round(obj.uptime_s * 100) / 100,
  temperature_c: Math.round(obj.temperature_c * 100) / 100,
  humidity_percent: Math.round(obj.humidity_percent * 100) / 100,
  mq135_raw: Math.floor(obj.mq135_raw),
  mq135_adc_mv: Math.round(obj.mq135_adc_mv * 100) / 100,
  mq135_sensor_mv: Math.round(obj.mq135_sensor_mv * 100) / 100,
  wifi_rssi_dbm: Math.floor(obj.wifi_rssi_dbm),
};
```

* Extraneous properties (e.g., `admin: true`, `__proto__`, `constructor`) are silently discarded.
* Prototype pollution and object injection vulnerabilities are mitigated by design.

### 3.2 Finite Numeric & Range Validation
Every numeric field is tested with `Number.isFinite()` and clamped against physical sensor boundaries (`TELEMETRY_LIMITS` in `src/telemetry/types.ts`):
* `temperature_c`: $-40$ to $+80$ °C
* `humidity_percent`: $0$ to $100$ % RH
* `mq135_raw`: $0$ to $4095$ ADC counts
* `mq135_adc_mv`: $0$ to $3300$ mV
* `mq135_sensor_mv`: $0$ to $5000$ mV
* `wifi_rssi_dbm`: $-120$ to $0$ dBm

`NaN`, `Infinity`, or out-of-range values are rejected safely without throwing exceptions or causing runtime crashes.

---

## 4. Sensor Interpretation Ethics (PRD Section 9)

### 4.1 Strict Policy on MQ135 Gas Telemetry
* **NO Fake Metrics:** The MQ135 sensor requires baseline pre-heating, temperature/humidity curve compensation, and laboratory calibration to derive meaningful PPM values.
* **NO Uncalibrated PPM or AQI:** AetherSense strictly displays:
  1. `RAW ADC` ($0–4095$)
  2. `ADC VOLTAGE` ($0–3300\text{ mV}$)
  3. `SENSOR VOLTAGE` ($0–5000\text{ mV}$)
* **NO Fabricated Health Status:** The dashboard never labels raw air readings as "Good", "Hazardous", or "95% Clean Air". An explicit disclaimer is permanently presented in the UI:
  > *"Uncalibrated Raw Telemetry (No PPM/AQI claimed)"*

---

## 5. Denial-of-Service & Client Resilience

1. **Bounded In-Memory Timeseries:**
   - Ingested points are stored in a fixed-size `BoundedRingBuffer` strictly capped at 300 samples ($O(1)$ eviction).
   - Prevents memory leaks and tab crashes even during continuous 24/7 telemetry ingestion.
2. **Exponential Backoff with Jitter:**
   - Reconnection interval scales exponentially ($1\text{s} \to 2\text{s} \to 4\text{s} \dots \to 30\text{s}$) with $+20\%$ random jitter.
   - Prevents reconnect storms and IP throttling on the public MQTT broker.
3. **Duplicate & Stale Watchdogs:**
   - Discards identical sequence duplicates.
   - Alerts on telemetry older than 60 seconds and triggers visual stale warning when no packet arrives for $>15$ seconds.

---

## 6. Private Broker Migration Roadmap (PRD Section 32)

When transitioning AetherSense from the public development broker to a hardened production deployment, the following migration steps must be followed:

```text
Current (Development)                    Target (Production)
┌────────────────────────────┐          ┌────────────────────────────┐
│   HiveMQ Public Broker     │          │   Private EMQX / HiveMQ    │
│   ws://broker.hivemq.com   │          │   wss://mqtt.aethersense.io│
│   Port: 8000 / 1883        │    ───►  │   Port: 8884 (WSS) / 8883  │
│   No TLS / No Auth         │          │   TLS 1.3 + Auth Token/mTLS│
└────────────────────────────┘          └────────────────────────────┘
```

### 6.1 Required Infrastructure Changes
1. **Transport Layer Security (TLS/WSS):**
   - Microcontrollers connect to port `8883` over TLS with server CA verification.
   - React Web Dashboard connects to port `8884` via `wss://` encrypted WebSockets.
2. **Authentication & Authorization (RBAC / ACL):**
   - ESP32 authenticated via client certificates (mTLS) or per-device pre-shared secrets.
   - Dashboard authenticated via short-lived JWTs acquired from an identity provider.
   - Broker Access Control Lists (ACL) restrict write access on `aethersense/{device_id}/*` strictly to that device ID.
3. **Contract Preservation:**
   - The topic structure (`aethersense/{device_id}/telemetry` and `aethersense/{device_id}/status`) and payload JSON schemas remain completely identical.
   - Zero frontend UI components or parsing algorithms need rewriting upon migration.
