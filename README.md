# AetherSense — Abstract Environmental Telemetry Dashboard

[![Project Phase](https://img.shields.io/badge/Phase-Phase%2010%3A%20Production%20Validation%20Complete-brightgreen.svg)](./VALIDATION.md)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![MQTT Transport](https://img.shields.io/badge/MQTT-HiveMQ%20Public%20Broker-orange.svg)](./MQTT-CONTRACT.md)

**AetherSense** is an ambient, realtime environmental telemetry monitoring system that bridges an edge microcontroller (**ESP32-S3**) reading digital microclimate (**DHT22**) and analog air sensors (**MQ135**) with a **React Single Page Application** via the HiveMQ public MQTT broker.

Moving away from rigid industrial grids and generic SaaS layouts, AetherSense embodies a **Living Ambient Interface**—merging scientific precision with digital atmosphere, subtle glows, and bounded telemetry timeseries.

---

## System Architecture

```text
┌──────────────┐
│    DHT22     │ (GPIO6: Temp & Humidity)
└──────┬───────┘
       │
┌──────▼────────────────┐
│       ESP32-S3        │
│ GPIO6 → DHT22         │
│ GPIO7 → MQ135 ADC     │
│ MQTT TCP (Port 1883)  │
└──────────┬────────────┘
           │
           ▼
┌────────────────────────────┐
│    HiveMQ Public Broker    │
│   broker.hivemq.com        │
└──────────┬─────────────────┘
           │
           │ MQTT WebSocket (Port 8000: ws://broker.hivemq.com:8000/mqtt)
           ▼
┌────────────────────────────┐
│   AetherSense Dashboard    │
│ (React + Vite + Tailwind)  │
│                            │
│ • Temperature & Humidity   │
│ • MQ135 Raw ADC & Voltage  │
│ • Device Health & RSSI     │
│ • 300-Sample Ring Buffer   │
│ • Realtime Charts          │
└────────────────────────────┘
```

---

## Documentation Index

| Document | Purpose |
| :--- | :--- |
| [PRD.md](./PRD.md) | Official Product Requirements Document and specifications. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Full technical architecture, data pipeline, and memory management audit. |
| [MQTT-CONTRACT.md](./MQTT-CONTRACT.md) | MQTT protocol standard, topics, JSON payload schemas, and LWT rules. |
| [DESIGN.md](./DESIGN.md) | Visual design tokens, atmospheric aesthetic system, and accessibility guidelines. |
| [SECURITY.md](./SECURITY.md) | Security audit, threat model, payload leakage, and private broker migration roadmap. |
| [VALIDATION.md](./VALIDATION.md) | Full production validation and acceptance sign-off matrix (20/20 criteria verified). |
| [CHANGELOG.md](./CHANGELOG.md) | Version history and phase progression tracking. |

---

## Development Roadmap & Status

| Phase | Description | Status |
| :---: | :--- | :---: |
| **0** | **Architecture Audit & Technical Specifications** | **Completed** |
| **1** | **React Project Initialization (Vite + TS + Tokens)** | **Completed** |
| **2** | **MQTT WebSocket Layer (`broker.hivemq.com:8000`)** | **Completed** |
| **3** | **Telemetry Parser, Safe Validator & Error Handling** | **Completed** |
| **4** | **Dashboard Metrics & Device Health Components** | **Completed** |
| **5** | **Realtime Charts & 300-Sample Bounded Ring Buffer** | **Completed** |
| **6** | **Abstract Ambient Design System Implementation** | **Completed** |
| **7** | **Responsive Layouts & Accessibility (a11y) Audit** | **Completed** |
| **8** | **Resilience, Exponential Backoff & Reconnection** | **Completed** |
| **9** | **Security & Telemetry Leakage Audit** | **Completed** |
| **10** | **Production Validation & Acceptance Sign-off** | **Completed** |

---

## Quick Reference: MQTT Topics

* **Telemetry Stream:** `aethersense/{device_id}/telemetry`
* **Device Lifecycle / LWT:** `aethersense/{device_id}/status`
* **Public WebSocket Endpoint:** `ws://broker.hivemq.com:8000/mqtt`
