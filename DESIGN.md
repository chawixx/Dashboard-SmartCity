# AetherSense — Visual Identity & Design System Specification

## Document Metadata
* **Project:** AetherSense — ESP32-S3 Environmental Telemetry Dashboard
* **Phase:** Phase 0 — Architecture Audit
* **Version:** 1.0.0
* **Date:** 2026-09-21
* **Concept:** Living Ambient Interface & Scientific Telemetry

---

## 1. Aesthetic Vision: Living Ambient Interface

AetherSense rejects the boilerplate aesthetics of industrial dashboards (cluttered tabular grids, aggressive borders, and static charts) and avoid excessive neon gaming aesthetics. Instead, it positions itself at the intersection of:

```text
Scientific Visualization  +  Environmental Telemetry  +  Digital Atmosphere
```

The user experience should evoke observing a calm, laboratory-grade atmospheric instrument humming in a darkened observation chamber:
* **Passive Comprehension:** Critical microclimate states are understandable at a glance through atmospheric luminescence, subtle chromatic shifts, and technical typography.
* **Precise Telemetry:** When inspected closely, every metric offers high-precision numerical telemetry and temporal progression.
* **Subtle Motion:** Atmospheric fluid gradients, gentle pulse indicators, and particle dust that respect user accessibility preferences.

---

## 2. Color Palette & Chromatic Shifts

The color system is built on deep cosmic blacks and midnight slates, highlighted by phosphor-like cyan, emerald, amber, and crimson accents.

### 2.1 Core Surface Colors (Dark Matrix)
* **Background Abyss:** `#06080c` (deep atmospheric black)
* **Surface Matrix Level 1:** `rgba(12, 18, 28, 0.75)` (translucent card background with 16px blur)
* **Surface Matrix Level 2:** `rgba(18, 26, 42, 0.85)` (elevated interactive widgets)
* **Technical Border Line:** `rgba(56, 96, 140, 0.22)` (1px crisp, non-distracting dividers)
* **Active Glow Border:** `rgba(34, 211, 238, 0.40)` (subtle luminescent highlight)

### 2.2 Telemetry Signal Colors
| Channel | Color Token | Hex / RGBA | Semantic Meaning |
| :--- | :--- | :--- | :--- |
| **Temperature** | `var(--signal-temp)` | `#f97316` / `#fb923c` | Thermal energy, amber/orange warm gradient |
| **Humidity** | `var(--signal-humid)` | `#38bdf8` / `#0284c7` | Atmospheric moisture, cyan/sky blue gradient |
| **Gas / MQ135** | `var(--signal-gas)` | `#a855f7` / `#c084fc` | Particulate & volatile detection, violet gradient |
| **System Healthy** | `var(--signal-online)` | `#10b981` / `#34d399` | Online / active connection, emerald |
| **Warning / Stale** | `var(--signal-stale)` | `#eab308` / `#fde047` | Telemetry paused $>15$s, amber warning |
| **System Offline** | `var(--signal-offline)`| `#f43f5e` / `#fb7185` | Disconnected / hardware offline, rose crimson |

---

## 3. Typography & Technical Numerals

To reinforce the instrument aesthetic:
* **Primary Sans:** Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto (clean, high legibility for labels and UI controls).
* **Technical Monospace:** JetBrains Mono, SF Mono, "Roboto Mono", Menlo, monospace (used for all numeric metrics, timestamps, coordinates, RSSI, and MQTT connection states).
* **Tabular Figures (`tnum`):** All numerical readings enable tabular figures (`font-variant-numeric: tabular-nums`) to avoid layout jitter during rapid digit updates.

---

## 4. UI Components & Layout Hierarchy

### 4.1 Header Bar
* **Identity:** `AETHERsense` with micro subtitle `ENVIRONMENTAL TELEMETRY INTERFACE`
* **Target Node:** Target device chip identifier (e.g. `ESP32-S3 [ABCD12345678]`)
* **Transport State Badge:** Text label + indicator dot:
  * `MQTT ● CONNECTED`
  * `MQTT ● CONNECTING`
  * `MQTT ● RECONNECTING (2s)`
  * `MQTT ● DISCONNECTED`

### 4.2 Primary Metrics Row
* **Temperature Card:** Current reading in °C, min/max range, subtle thermal halo.
* **Humidity Card:** Current reading in % RH, dew point indicator, moisture halo.
* **MQ135 Gas Telemetry Card:**
  * Displays: `RAW ADC` (e.g. `1852`), `ADC mV` (e.g. `1478 mV`), `SENSOR mV` (e.g. `2463 mV`).
  * Explicit notice: Uncalibrated hardware telemetry (no unverified AQI/PPM).

### 4.3 Device Health & RF Metrics
* **Node Status:** `ONLINE` (green), `OFFLINE` (rose via LWT), or `STALE` (amber $>15$s).
* **Wi-Fi RSSI:** Numeric dBm readout with visual signal bars (-50 dBm Excellent, -85 dBm Weak).
* **Device Uptime:** Formatted human-readable clock (`00:06:21`).
* **Sequence Counter:** Monotonically increasing counter demonstrating packet reception continuity.

### 4.4 Realtime Timeseries Charts
* Visual curves for Temperature, Humidity, and MQ135 ADC.
* Features:
  * 300 data-point bounded window.
  * Synchronized crosshair tooltips with timestamps.
  * Individual channel visibility toggle.
  * Smooth cubic Bezier or precision polyline rendering.
  * Soft vertical gradient fills beneath telemetry traces.

---

## 5. Responsive Grid Breakpoints

* **Desktop ($\ge 1200\text{ px}$):**
  * Grid: 3-4 column layout. Top telemetry metrics, expansive center realtime chart, right-hand device health & packet inspector.
* **Tablet ($768\text{ px} \dots 1199\text{ px}$):**
  * Grid: 2-column balanced layout. Charts scale dynamically to available width.
* **Mobile ($< 768\text{ px}$):**
  * Single-column vertical stack. Touch-friendly tooltips, charts remain fully legible with pinch/pan or horizontal scroll constraints.

---

## 6. Accessibility & Motion Guidelines

* **WCAG 2.1 AA Compliance:** Minimum 4.5:1 contrast ratio for all secondary labels; 7:1 for primary telemetry metrics against dark backgrounds.
* **Non-Color Reliance:** Connection states and alerts always include accompanying plain text (`CONNECTED`, `STALE`, `OFFLINE`).
* **Reduced Motion Support:**
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
  Particles and pulsing glows freeze or become static visual elements when reduced motion is preferred by the operating system.
