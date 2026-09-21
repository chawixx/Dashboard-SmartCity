# AetherSense — System Architecture & Technical Audit

## Document Metadata
* **Project:** AetherSense — ESP32-S3 Environmental Telemetry Dashboard
* **Phase:** Phase 0 — Architecture Audit
* **Version:** 1.0.0
* **Date:** 2026-09-21
* **Status:** Approved Baseline

---

## 1. Executive Architecture Summary

AetherSense is an end-to-end telemetry system designed to ingest, process, and render realtime microclimate and ambient gas sensor readings. It bridges resource-constrained embedded edge hardware (**ESP32-S3**) with an ambient web interface (**React SPA**) via a low-latency public MQTT broker (**HiveMQ Public Broker**).

### High-Level Topology

```text
[DHT22 (GPIO6)]  ── Temp / Humidity ──┐
                                      ├──► [ESP32-S3 Firmware]
[MQ135 (GPIO7)]  ── Analog ADC (mV) ──┘           │
                                                   │ MQTT TCP (Port 1883)
                                                   ▼
                                     ┌─────────────────────────────┐
                                     │    HiveMQ Public Broker     │
                                     │     broker.hivemq.com       │
                                     └──────────────┬──────────────┘
                                                    │ MQTT WebSocket (Port 8000)
                                                    │ ws://.../mqtt
                                                    ▼
                                     ┌─────────────────────────────┐
                                     │   React SPA (AetherSense)   │
                                     │  • MQTT WebSocket Client    │
                                     │  • Safe Parser & Validator  │
                                     │  • Bounded Ring Buffer      │
                                     │  • Living Ambient UI        │
                                     └─────────────────────────────┘
```

---

## 2. Technology Stack & Architectural Decisions

### 2.1 Frontend Stack Audit
| Layer | Technology Selected | Rationale & Trade-offs |
| :--- | :--- | :--- |
| **Runtime & Build** | Vite + React 18/19 + TypeScript | Instant HMR, minimal bundle overhead, strict static typing for telemetry schema safety. |
| **MQTT Client** | `mqtt` (MQTT.js WebSocket build) | Mature MQTT v3.1.1/v5 client with native WebSocket transport in modern browser environments. Configurable keep-alive and event-driven architecture. |
| **State Management** | Lightweight Reactive Store (`zustand` or React external store) | Decouples high-frequency telemetry ingestion (1-2 Hz) from full component tree re-renders. Component subscribers update surgically. |
| **Data Buffering** | Custom Bounded Ring Buffer | Prevents browser memory leakage during long dashboard sessions by capping timeseries history at 300 data points ($O(1)$ push/shift). |
| **Charts & Graphics** | Lightweight SVG / Canvas Time-Series | High-performance rendering with dark ambient styling, series toggling, tooltips, and zero unbounded layout thrashing. |
| **Styling & Tokens** | CSS Modules / Vanilla CSS Tokens + Tailwind CSS | High fidelity technical aesthetic: subtle glows, fine grids, ambient gradients, and strict `@media (prefers-reduced-motion: reduce)` support. |

### 2.2 Embedded Firmware Edge (ESP32-S3)
* **Microcontroller:** ESP32-S3 (Dual-core Xtensa LX7, 2.4 GHz Wi-Fi 802.11 b/g/n).
* **Sensors:**
  * **DHT22 (AM2302):** Digital temperature & relative humidity on `GPIO6`.
  * **MQ135:** Analog air quality/gas sensor connected to internal ADC1 channel on `GPIO7`.
* **Transport:** MQTT client publishing over TCP port `1883` to `broker.hivemq.com`.
* **Reliability Features:** MQTT Last Will & Testament (LWT) for automatic status transition to `offline` upon ungraceful power loss or Wi-Fi disconnection.

---

## 3. Subsystem Architecture & Data Flow

```text
MQTT WebSocket Stream (ws://broker.hivemq.com:8000/mqtt)
                        │
                        ▼
             [ 1. Transport Layer ]
             (src/mqtt/client.ts)
             • Exponential Backoff Reconnection
             • Connection State Machine
                        │
                        ▼ Raw String Message
             [ 2. Ingestion & Parser Layer ]
             (src/mqtt/parser.ts)
             • JSON.parse inside try/catch
             • Runtime Schema Validation
             • Payload Integrity Check (NaN / missing fields)
                        │
                        ▼ Validated TelemetryData
             [ 3. State & Memory Store Layer ]
             (src/telemetry/store.ts & history.ts)
             • Circular Buffer (capacity: 300)
             • Stale Data Watchdog (>15s timer)
             • Latest Metrics Cache
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
[ 4. Metric Display Panel ]   [ 5. Realtime Charts ]
• Temperature & Humidity      • Temperature Curve
• MQ135 Raw & mV              • Humidity Curve
• Device Health & RSSI        • MQ135 ADC Curve
```

### 3.1 Connection State Machine
The frontend maintains an explicit 5-state connection lifecycle:
1. `DISCONNECTED`: Initial state or user-initiated disconnection.
2. `CONNECTING`: WebSocket handshake initiated.
3. `CONNECTED`: MQTT `CONNACK` received with Return Code 0.
4. `RECONNECTING`: Network dropped or broker closed socket; exponential backoff active.
5. `ERROR`: Irrecoverable socket error or protocol violation.

> **UI Contract:** Connection status is always communicated via text label and visual token (e.g., `MQTT ● CONNECTED`), adhering to accessibility standards (non-color-exclusive signaling).

### 3.2 Device Status & Stale Detection
The system separates transport connectivity from device activity:
* **`ONLINE`:** Received via topic `aethersense/{device_id}/status` with payload `online`.
* **`OFFLINE`:** Received via topic `aethersense/{device_id}/status` with payload `offline` (published by ESP32 LWT or graceful disconnect).
* **`STALE`:** Triggered when the MQTT client is `CONNECTED`, but no telemetry packet is received for $> 15\text{ s}$. The UI displays `STALE TELEMETRY` warning badge while preserving the last known values.

---

## 4. Memory Management: Bounded Ring Buffer

Uncontrolled array concatenation in high-frequency realtime web applications causes memory bloat and garbage collection spikes. 

### Ring Buffer Specification:
* **Default Capacity:** 300 samples (at 1 packet/sec, stores 5 minutes of telemetry).
* **Behavior:**
  * When size $< 300$: $O(1)$ append.
  * When size $= 300$: Oldest sample removed ($O(1)$ deque/pointer shift), newest sample inserted.
* **Storage Footprint:** $< 100\text{ KB}$ heap memory in steady state.

---

## 5. Security & Public Broker Constraints

1. **Shared Namespace Hazard:** `broker.hivemq.com` is public. Anyone can publish/subscribe.
   * *Mitigation:* Strict topic namespacing: `aethersense/{device_id}/telemetry`. Generic topics like `sensor/data` are strictly prohibited.
2. **Client ID Conflicts:** If two clients connect with identical Client IDs, the broker drops the older connection in a continuous cycle.
   * *Mitigation:* React client generates `aethersense-web-${crypto.randomUUID().slice(0, 8)}`. Firmware uses its unique MAC address `esp32s3-${MAC}`.
3. **Confidentiality:** No credentials, Wi-Fi keys, personal data, or private tokens are placed in payloads.
4. **Mixed Content:** The public broker endpoint `ws://` is non-TLS. When served over `http://localhost`, browsers permit it. For HTTPS deployments, a WSS endpoint or private MQTT broker with TLS must be provisioned.

---

## 6. Verification & Acceptance Mapping
This architecture addresses all acceptance criteria defined in [PRD.md](file:///home/narr/Projects/SmartCity/PRD.md) Section 31, ensuring isolation, fault tolerance, and uncompromised UI performance.
