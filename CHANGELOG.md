# Changelog

All notable changes to the **AetherSense** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-09-21

### Added
- **Phase 0 Architecture Audit Complete:**
  - Audited full project scope, system boundaries, and hardware interface (ESP32-S3 + DHT22 + MQ135).
  - Drafted comprehensive System Architecture Specification in `ARCHITECTURE.md`.
  - Defined strict MQTT topic conventions, LWT semantics, and JSON payload contracts in `MQTT-CONTRACT.md`.
  - Established Living Ambient Interface visual design tokens and accessibility guidelines in `DESIGN.md`.
  - Prepared project roadmap covering all 11 phases (Phase 0 through Phase 10).

- **Phase 1 React Initialization Complete:**
  - Scaffolding of React 19 + TypeScript + Vite project.
  - Installed dependencies (`mqtt`, `lucide-react`).
  - Created directory architecture per PRD Section 18 (`mqtt/`, `telemetry/`, `components/`, `hooks/`, `styles/`, `app/`).
  - Configured environment files (`.env`, `.env.example`) with HiveMQ public broker parameters.
  - Implemented design tokens, atmospheric styling, and accessibility utilities (`tokens.css`, `global.css`, `effects.css`).
  - Verified production build and strict TypeScript compilation.

- **Phase 2 MQTT WebSocket Layer Complete:**
  - Implemented `src/mqtt/config.ts` with environment variable resolution and session-unique client ID generation (`aethersense-web-{random-id}`).
  - Implemented `src/mqtt/topics.ts` with namespace builders (`aethersense/{device_id}/telemetry`, `aethersense/{device_id}/status`) and validation matchers.
  - Implemented `src/mqtt/client.ts` (`AetherMqttClient`) managing WebSocket transport to `ws://broker.hivemq.com:8000/mqtt`, explicit 5-state lifecycle (`DISCONNECTED`, `CONNECTING`, `CONNECTED`, `RECONNECTING`, `ERROR`), and exponential backoff retry (1s–30s).
  - Implemented `src/hooks/useMqtt.ts` for clean React lifecycle integration with auto-connect and auto-subscription management.
  - Implemented `src/components/ui/MqttStateBadge.tsx` with accessible non-color-only text state indication.
  - Integrated live incoming packet monitor and simulation publish trigger in `src/App.tsx`.

- **Phase 3 Telemetry Parser, Safe Validator & Error Handling Complete:**
  - Implemented `src/telemetry/types.ts` defining `TelemetryData`, `DeviceStatus`, `ParseResult<T>`, and physical constraints (`TELEMETRY_LIMITS`).
  - Implemented `src/mqtt/parser.ts` with `parseTelemetryPayload` non-throwing parser, preventing React application crashes on malformed or unexpected MQTT payloads (PRD Section 17 & 22).
  - Implemented `parseDeviceStatus` normalizing LWT online/offline semantics.
  - Integrated `vitest` unit test suite in `src/mqtt/parser.test.ts` (10/10 tests passing) covering malformed JSON, out-of-range sensor readings, missing attributes, and device ID mismatches.

- **Phase 4 Dashboard Metrics & Device Health Components Complete:**
  - Implemented `src/telemetry/store.ts` (`TelemetryStore`) maintaining latest readings, packet/error metrics, and a 15-second stale data watchdog timer (PRD Section 23).
  - Implemented `src/telemetry/formatters.ts` providing `formatUptime` (HH:MM:SS) and `getRssiQuality` signal grading.
  - Implemented `src/hooks/useTelemetry.ts` binding MQTT ingestion to reactive state.
  - Implemented `src/components/telemetry/TemperatureCard.tsx` and `HumidityCard.tsx` with ambient glows and tabular figures.
  - Implemented `src/components/telemetry/GasCard.tsx` strictly displaying MQ135 Raw, ADC mV, and Sensor mV with explicit calibration disclaimer (PRD Section 9).
  - Implemented `src/components/device/DeviceHealthCard.tsx` rendering node status, Wi-Fi RSSI quality, device uptime clock, and sequence counter.
  - Implemented `src/components/dashboard/DashboardHeader.tsx` displaying AETHERsense branding, chip ID, and explicit stale warning badges.
  - Expanded unit test coverage in `src/telemetry/store.test.ts` (15/15 total tests passing).

- **Phase 5 Realtime Charts & 300-Sample Bounded Ring Buffer Complete:**
  - Implemented `src/telemetry/history.ts` (`BoundedRingBuffer<T>`) capping in-memory timeseries history strictly at 300 samples with $O(1)$ eviction (PRD Section 16 & 28).
  - Integrated bounded ring buffer with `TelemetryStore` and `useTelemetry` hook.
  - Implemented `src/components/charts/RealtimeTelemetryChart.tsx` featuring:
    - Multi-series curves for Temperature (°C), Humidity (% RH), and MQ135 Raw ADC count.
    - Independent series toggle controls with active latest-value readouts (PRD Section 15).
    - Interactive pointer crosshair with floating tooltip displaying precise values and timestamps.
    - Dynamic responsive SVG rendering with zero heavy dependencies or layout thrashing.
  - Added unit test suite in `src/telemetry/history.test.ts` (20/20 total tests passing).
  - Integrated rapid burst stream simulation (10 samples) in dashboard diagnostics.

- **Phase 6 Abstract Ambient Design System Complete:**
  - Implemented `src/components/ambient/LivingAmbientCanvas.tsx` translating microclimate data (temperature, humidity, air gas) into dynamic generative visual haze, chromatic thermal shifting, and subtle particle dispersion (PRD Section 1, 10, 11).
  - Implemented `src/components/ui/TechnicalFrame.tsx` adding scientific reticle corners, technical channel tags, and clean dividers.
  - Enhanced `src/styles/effects.css` with ambient atmospheric layers, corner reticles, and WCAG AA non-distracting visual accents.
  - Strictly respected `@media (prefers-reduced-motion: reduce)` by disabling particle movement and using tranquil static gradients (PRD Section 27).
  - Capped canvas animation loop to 30 fps to ensure virtually 0% CPU consumption and zero layout thrashing (PRD Section 28).

- **Phase 7 Responsive Layouts & Accessibility (a11y) Complete:**
  - Implemented responsive fluid breakpoints in `src/styles/global.css`: mobile single-column (<768px), tablet balanced 2-column (768px–1199px), and desktop expansive multi-column (≥1200px) layout (PRD Section 26).
  - Integrated accessible keyboard skip link (`.skip-link`) pointing to `#main-telemetry-content` for direct navigation (WCAG 2.1 AA).
  - Implemented accessible ARIA roles, `aria-pressed`, `aria-label`, and screen-reader telemetry summary (`.sr-only`) in SVG charts and interactive controls (PRD Section 27).
  - Ensured high-contrast ratios (>7:1) across all metrics, tabular numerals, and text-based connection indicators.

- **Phase 8 Resilience, Exponential Backoff & Reconnection Complete:**
  - Implemented bounded exponential backoff retry policy (1s base, 2x multiplier, 30s ceiling, +20% jitter) in `src/mqtt/client.ts` (PRD Section 24).
  - Integrated browser `window.addEventListener('online')` and `window.addEventListener('offline')` events for immediate network reconnection and backoff reset.
  - Implemented sequence duplication detection and out-of-order sequence logging in `src/telemetry/store.ts` (PRD Section 17 & 28).
  - Implemented delayed packet monitoring (>60s delta between packet timestamp and client clock) in `src/telemetry/store.ts`.
  - Added "Retry Now" immediate reconnection bypass to `MqttStateBadge` and `DashboardHeader` when in `RECONNECTING` or `ERROR` state.
  - Exposed duplicate dropped and delayed packet counters alongside buffer capacity and corrupt packet rejection in the diagnostics control panel (`src/App.tsx`).
  - Added simulation triggers for duplicate packet sequence and delayed payload (>60s) verification.
  - Comprehensive unit test suite in `src/mqtt/client.test.ts` (26/26 tests passing).

- **Phase 9 Security & Telemetry Leakage Audit Complete:**
  - Authored comprehensive `SECURITY.md` specifying public broker threat model, zero-credential rules, payload whitelisting, sensor data ethics, and private broker migration roadmap (PRD Section 4, 6, 9, 31, 32).
  - Audited full repository for sensitive credentials, API keys, passwords, and private IP addresses (0 leaks found).
  - Hardened `.gitignore` to explicitly ignore `.env`, `.env.local`, `.env.*.local`, and cryptographic certificates (`*.pem`, `*.key`, `*.cert`), while tracking sanitized `.env.example`.
  - Verified prototype pollution defense and strict property whitelisting in `src/mqtt/parser.ts`.
  - Verified unique client ID generator (`aethersense-web-{random-id}`) in `src/mqtt/config.ts` preventing collision loops with ESP32 edge clients (`esp32s3-{chip_id}`).
  - Confirmed strict compliance with PRD Section 9: zero fabricated CO2 PPM, AQI, or Air Quality % calculations.
  - Added automated security test suite in `src/security.test.ts` (31/31 tests passing across 5 test suites).

- **Phase 10 Production Validation & Acceptance Sign-off Complete:**
  - Conducted full audit across all 20 Acceptance Criteria in PRD Section 31 (100% verified and approved).
  - Authored formal validation and acceptance sign-off document in `VALIDATION.md`.
  - Verified end-to-end automated test execution (31/31 passing unit & integration tests across 5 suites).
  - Verified production build (`tsc -b && vite build`) generating optimized HTML, CSS, and JS bundles in `dist/` with 0 warnings or errors.
  - Finalized full documentation suite (`PRD.md`, `ARCHITECTURE.md`, `MQTT-CONTRACT.md`, `DESIGN.md`, `SECURITY.md`, `VALIDATION.md`, `CHANGELOG.md`, `README.md`).

---

## [0.2.0] - 2026-09-21

### Added
- **Tegal EcoSense Urban Observatory Redesign (CHANGE_THEME.md):**
  - Migrated UI theme to Maritime Coastline aesthetic (Deep Navy `#08192e`, Royal Coastal Cyan `#0284c7`, Ghost typography `#cbd5e1`).
  - Added cinematic `IntroLoader.tsx` with smooth uncurtaining exit animation.
  - Added editorial `HeroSection.tsx` with live headline typography and Three.js `AtmosphericCanvas.tsx` 3D coastal particulate haze.
  - Added `TelemetryMatrixSection.tsx` parameter row layout with hover micro-interactions (`arrow-circle`).
  - Added `FacilitiesAnalyticsSection.tsx` with SVG wave telemetry charts and microclimate facilities correlation.
  - Added `StatsSection.tsx` with oversized observatory figures (5s telemetry frequency, 100% transmission, 12-bit ADC, 24/7).
  - Added `FieldLogsSection.tsx` documenting empirical observation logs in Alun-Alun Tegal.
  - Added `SiteFooter.tsx` with maritime branding, coordinates, and diagnostic trigger.
  - Added `TelemetryDiagnosticModal.tsx` for real-time node switching, burst tests, and payload simulation.
  - Added automated hazard alert engine in `useAlertEngine.ts` and `AlertToastContainer.tsx` (7 unit tests in `useAlertEngine.test.ts`).

- **3D Spatial Deck & Live Environmental HUD:**
  - Upgraded `ZoneTrustSection.tsx` to render all 3 cards in a 3D perspective deck (`perspective: 1200px`) with spatial peeling and direct background card click selection.
  - Added real-time 3D holographic mouse-tilt physics and specular glare sheen responding to cursor movement on desktop and touch drag on mobile.
  - Embedded Live Environmental HUD with pulsing GPS radar beacon (`6°52'08"S 109°08'E`) and microclimate metrics calculated from live ESP32-S3 telemetry.
  - Added 1-click zone pill tabs selector.

- **Water Droplet & Elastic Bouncy Dropdown Menu:**
  - Created `DropletMenuDropdown.tsx` replacing the fullscreen takeover with an organic, floating dropdown menu.
  - Implemented water droplet & spring physics:
    - Click 1 (open): Hamburger button squishes, cyan droplet pulse ring waves outward, lines morph to 'X', menu drops down like a viscous liquid drop (`scale(0.92, 1.16) translateY(14px)`) and rebounds into place with elastic overshoot. Staggered dripping item cascade.
    - Click 2 (close): Lines rotate back, dropdown dips with surface tension before retracting upward into the button (`scale(0.18, 0.06) translateY(-28px)`), smoothly unmounting after 290ms.
  - Responsive across desktop (`24rem`), laptop, tablet (`22rem`), and mobile (`calc(100vw - 2rem)`).
  - Added soft backdrop scrim for tap-outside dismiss and keyboard `Escape` support.

- **Mobile Optimization & Asset Fallback Chain:**
  - Fixed mobile root `rem` scaling from `4.44vw` to balanced `14px` in `src/styles/global.css`.
  - Added Floating Mobile Telemetry Quick-Bar with heartbeat indicator when scrolling past Hero.
  - Integrated high-resolution `.jpeg` photographs in `public/assets/tegal/` with companion `.webp` files and robust fallback chain (`.jpeg` ➔ `.webp` ➔ `.jpg` ➔ `.png` ➔ `.svg`).
  - Created comprehensive project vault in `PROJECT_VAULT.md`.

---

## [0.3.0] - 2026-09-28

### Added
- **4-Channel Relay Actuator & Smart City Municipal Lighting Control:**
  - Integrated 4-channel relay actuator system on ESP32-S3 controlling 4 distinct municipal lighting sectors:
    - **IN1 -> GPIO 38:** Sektor 01 — Kawasan Alun-Alun & Monumen Bahari (Smart Pole Pedestrian & Air Mancur Sentral)
    - **IN2 -> GPIO 39:** Sektor 02 — Koridor Jl. KH Wahid Hasyim (PJU Jalan Umum & Sentra Kuliner Barat)
    - **IN3 -> GPIO 40:** Sektor 03 — RTH & Jalur Sepeda Bahari (Eco-Lighting Bollard Vegetasi Pesisir)
    - **IN4 -> GPIO 41:** Sektor 04 — Saluran Drainase & Tanggul Pesisir (Floodlight Sorot Inspeksi Pintu Air)
  - Designed and implemented interactive `SectorLightingControlSection.tsx`:
    - Visual glowing LED orb indicators for each sector with neon bloom animation on active state and metallic lens on inactive state.
    - Tactile individual ON/OFF toggle switch button for each sector.
    - Master control bar with "Nyalakan Semua" (All ON) and "Matikan Semua" (All OFF) actions.
    - Real-time power consumption metrics (Watt) and fixture counter.
    - Optimistic UI updates with instant local feedback and synchronization with incoming hardware telemetry.
  - Implemented MQTT command protocol in `src/mqtt/topics.ts` (`getCommandTopic`, `isCommandTopic`) on `aethersense/{device_id}/command`.
  - Added non-throwing, resilient relay telemetry parsing in `src/mqtt/parser.ts` (supporting both nested `{ relay1..4 }` and flat `relay1..4` schemas).
  - Preserved timeseries ring-buffer compatibility in `src/telemetry/history.ts`.
  - Documented complete protocol, pinouts, and JSON payloads in `MQTT-CONTRACT.md` (Section 3.1, 4.3, 4.4, 7).

### Changed
- **Relay Inversion & Hardware Booting Fix:**
  - Inverted relay logic level to `RELAY_ACTIVE_LEVEL = HIGH` and `RELAY_INACTIVE_LEVEL = LOW` in `SmartCIty-ESP32.ino`.
  - Pins are initialized to `LOW` on boot, ensuring all LEDs remain cleanly **OFF (Padam)** during microcontroller startup.
  - Aligned switch states: "Nyalakan Sektor" sends `HIGH` (turns physical LED ON), "Matikan Sektor" sends `LOW` (turns physical LED OFF).
- **Streamlined UI & Notification Experience:**
  - Removed "Mode Eco" button and references from the master control panel.
  - Removed action feedback notification banner to provide a clean, silent, and seamless tactile control experience.
  - Added "Penerangan" navigation links in `SiteHeader.tsx` and `DropletMenuDropdown.tsx` pointing directly to `#lighting-control`.


