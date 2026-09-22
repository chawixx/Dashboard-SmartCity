# 🏛️ AetherSense / Tegal EcoSense Project Vault
## Arsip Komprehensif Perubahan & Rekam Jejak Arsitektur Proyek (Checkpoint Awal s/d Terkini)

> **Status:** Production-Ready Checkpoint  
> **Tanggal Pembuatan:** 21 September 2026  
> **Cabang Git:** `master`  
> **Versi Rilis:** `0.2.0-observatory`  
> **Teknologi Utama:** React 19, TypeScript 5.8+, Vite 8, Three.js, Lenis Smooth Scroll, MQTT.js WebSocket, Oxlint, Vitest  

---

## 📑 Daftar Isi
1. [Ringkasan Eksekutif Proyek](#1-ringkasan-eksekutif-proyek)
2. [Kronologi Perubahan: Dari Nol Menuju Titik Terkini](#2-kronologi-perubahan-dari-nol-menuju-titik-terkini)
   - [Epoch I: Fondasi IoT & Protokol Telemetri (Fase 0 – 10)](#epoch-i-fondasi-iot--protokol-telemetri-fase-0--10)
   - [Epoch II: Transformasi Urban Observatory (Redesain Editorial PRD v2.0)](#epoch-ii-transformasi-urban-observatory-redesain-editorial-prd-v20)
   - [Epoch III: Optimasi Mobile, Asset Fotografi & Rantai Multi-Format](#epoch-iii-optimasi-mobile-asset-fotografi--rantai-multi-format)
   - [Epoch IV: Interaktivitas 3D Spatial Deck & Menu Hamburger "Air Menetes"](#epoch-iv-interaktivitas-3d-spatial-deck--menu-hamburger-air-menetes)
   - [Epoch V: Integrasi Rain Sensor (GPIO 8 / ADC1) & Sistem Peringatan Presipitasi](#epoch-v-integrasi-rain-sensor-gpio-8--adc1--sistem-peringatan-presipitasi)
3. [Manifestasi Struktur Berkas Proyek](#3-manifestasi-struktur-berkas-proyek)
4. [Matriks Verifikasi, Keamanan & Pengujian Kualitas](#4-matriks-verifikasi-keamanan--pengujian-kualitas)
5. [Spesifikasi Hardware & Kontrak Komunikasi Edge](#5-spesifikasi-hardware--kontrak-komunikasi-edge)

---

## 1. Ringkasan Eksekutif Proyek

**AetherSense (Tegal EcoSense)** dirancang dan dibangun dari awal sebagai sistem observatorium iklim mikro perkotaan modern untuk kawasan publik sentral **Alun-Alun Kota Tegal, Jawa Tengah**. Sistem ini menjembatani perangkat keras sensor edge nirkabel berbasis **ESP32-S3** (yang mengukur suhu udara DHT22, kelembapan relatif DHT22, dan kualitas gas MQ-135) dengan antarmuka web observatorium bervisual sinematik, berestetika maritim pesisir (*Deep Maritime Navy & Royal Coastal Cyan*), dan memiliki ketahanan data tinggi (*fault-tolerant realtime ingestion*).

Seluruh sistem dikembangkan dengan standar rekayasa perangkat lunak ketat:
- **Zero Raw Payload Crashes**: Parser payload non-throwing dengan validasi batas fisik sensor.
- **Zero Fabrication**: Tidak ada kalkulasi fiktif CO₂ PPM atau persentase AQI palsu dari sensor semikonduktor analog MQ-135.
- **Zero Credential Leaks**: Arsitektur keamanan transparan untuk broker MQTT publik tanpa rahasia sensitif.
- **Fluid Micro-Interactions**: Menggunakan akselerasi GPU 60 FPS untuk simulasi fisika tetesan air dan dek spasial 3D.
- **Comprehensive Quality Gates**: 100% tes unit & integrasi lulus (40/40 tests) dan 0 peringatan pada linter Oxlint.

---

## 2. Kronologi Perubahan: Dari Nol Menuju Titik Terkini

### Epoch I: Fondasi IoT & Protokol Telemetri (Fase 0 – 10)

1. **Fase 0 — Audit Arsitektur & Spesifikasi Dokumen Inti:**
   - Menyusun dokumen spesifikasi arsitektur menyeluruh dalam [`ARCHITECTURE.md`](file:///home/narr/Projects/SmartCity/ARCHITECTURE.md).
   - Mendefinisikan kontrak komunikasi MQTT, struktur topik hirarkis, dan format JSON payload dalam [`MQTT-CONTRACT.md`](file:///home/narr/Projects/SmartCity/MQTT-CONTRACT.md).
   - Menyusun aturan desain living ambient dan aksesibilitas dalam [`DESIGN.md`](file:///home/narr/Projects/SmartCity/DESIGN.md).
   - Menetapkan Product Requirement Document dalam [`PRD.md`](file:///home/narr/Projects/SmartCity/PRD.md).

2. **Fase 1 — Inisialisasi Ekosistem React 19 + TypeScript + Vite:**
   - Scaffolding proyek menggunakan Vite dan React 19 dengan TypeScript strict mode.
   - Pemasangan dependensi inti (`mqtt`, `lucide-react`, `three`, `lenis`).
   - Penataan struktur modular: `src/mqtt/`, `src/telemetry/`, `src/components/`, `src/hooks/`, `src/styles/`.
   - Konfigurasi token desain pada `tokens.css`, utilitas global pada `global.css`, dan efek visual pada `effects.css`.

3. **Fase 2 — Lapisan Transport MQTT over WebSocket:**
   - Pembuatan `src/mqtt/config.ts` untuk resolusi lingkungan broker dan pembangkitan ID klien unik (`aethersense-web-{random}`).
   - Pembuatan `src/mqtt/topics.ts` untuk builder topik `aethersense/{device_id}/telemetry` dan `aethersense/{device_id}/status`.
   - Pembuatan klien handal `src/mqtt/client.ts` (`AetherMqttClient`) dengan mesin status eksplisit 5-kondisi (`DISCONNECTED`, `CONNECTING`, `CONNECTED`, `RECONNECTING`, `ERROR`).
   - Implementasi hook `src/hooks/useMqtt.ts` untuk reaktivitas React.

4. **Fase 3 — Parser Telemetri Aman & Anti-Crash:**
   - Pembuatan `src/telemetry/types.ts` dengan interface `TelemetryData`, `TELEMETRY_LIMITS`, dan tipe `ParseResult<T>`.
   - Pembuatan parser aman `src/mqtt/parser.ts` (`parseTelemetryPayload`) yang tidak pernah melempar exception saat menerima paket korup atau format JSON cacat.
   - Penambahan unit test `src/mqtt/parser.test.ts` (12 tes lulus).

5. **Fase 4 — Reactive Telemetry Store & Watchdog Timer:**
   - Pembuatan `src/telemetry/store.ts` (`TelemetryStore`) yang memproses paket masuk, mendeteksi paket duplikat, dan mengawasi data stale dengan timer watchdog 15 detik.
   - Pembuatan kartu sensor metrik: `TemperatureCard.tsx`, `HumidityCard.tsx`, `GasCard.tsx` (dengan disclaimer kalibrasi raw ADC), dan `DeviceHealthCard.tsx`.
   - Penambahan unit test `src/telemetry/store.test.ts` (8 tes lulus).

6. **Fase 5 — Timeseries Bounded Ring Buffer & Visualisasi Grafik:**
   - Pembuatan struktur data in-memory `BoundedRingBuffer<T>` di `src/telemetry/history.ts` dengan batas maksimal 300 sampel berkecepatan $O(1)$.
   - Komponen grafik responsif SVG multi-series di `src/components/charts/RealtimeTelemetryChart.tsx` tanpa dependensi charting berat.
   - Penambahan unit test `src/telemetry/history.test.ts` (5 tes lulus).

7. **Fase 6 — Living Ambient Canvas (Generatif 30 FPS):**
   - Pembuatan `src/components/ambient/LivingAmbientCanvas.tsx` yang menerjemahkan pembacaan cuaca mikro menjadi atmosfer generatif dan partikel udara pesisir.
   - Pembatasan loop animasi pada 30 FPS untuk menjaga beban CPU mendekati 0%.
   - Kepatuhan penuh terhadap preferensi `@media (prefers-reduced-motion: reduce)`.

8. **Fase 7 — Responsivitas Layar & Aksesibilitas (WCAG 2.1 AA):**
   - Breakpoint responsif untuk mobile (<768px), tablet (768px–1199px), dan desktop (≥1200px).
   - Dukungan keyboard skip-link dan atribut ARIA eksplisit pada seluruh kontrol.

9. **Fase 8 — Ketahanan Jaringan & Exponential Backoff:**
   - Algoritma reconnect exponential backoff dengan random jitter (1s base, 30s ceiling) di `src/mqtt/client.ts`.
   - Listener browser event `online` dan `offline` untuk pemulihan instan saat koneksi internet pulih.
   - Deteksi paket tertunda (>60 detik delta timestamp).

10. **Fase 9 — Audit Keamanan Broker Publik:**
    - Penyusunan panduan mitigasi ancaman dalam [`SECURITY.md`](file:///home/narr/Projects/SmartCity/SECURITY.md).
    - Uji sanitasi prototipe, whitelisting properti, dan isolasi identitas node edge.
    - Penambahan suite uji keamanan di `src/security.test.ts` (5 tes lulus).

11. **Fase 10 — Validasi Formal & Penandatanganan Penerimaan:**
    - Evaluasi 20 butir kriteria penerimaan di [`VALIDATION.md`](file:///home/narr/Projects/SmartCity/VALIDATION.md) dengan status 100% lolos.

---

### Epoch II: Transformasi Urban Observatory (Redesain Editorial PRD v2.0)

Berdasarkan dokumen arahan [`CHANGE_THEME.md`](file:///home/narr/Projects/SmartCity/CHANGE_THEME.md), platform bertransformasi dari antarmuka dashboard sensor konvensional menjadi publikasi observatorium editorial bertaraf internasional:

1. **Intro Curtain Loader (`IntroLoader.tsx`):**
   - Tirai pembuka sinematik dengan tipografi besar dan progress bar inisialisasi node sebelum menyibak ke atas (`curtain-exit`).
2. **Hero Section Editorial & Atmospheric 3D Canvas (`HeroSection.tsx`, `AtmosphericCanvas.tsx`):**
   - Latar belakang Three.js partikel 3D interaktif yang menyimulasikan partikulat pesisir utara Tegal.
   - Tipografi dinamis mikro-iklim, status koneksi MQTT, serta pill penunjuk koordinat Alun-Alun.
3. **Telemetry Matrix Section (`TelemetryMatrixSection.tsx`):**
   - Tata letak matriks parameter lingkungan dengan micro-interaction panah lingkar (`arrow-circle`), angka tabular, dan navigasi anchor halus.
4. **Microclimate Facilities & Waveform Analytics (`FacilitiesAnalyticsSection.tsx`):**
   - Analisis korelasi kelembapan angin laut dan retensi termal rumput sintetis dengan visualisasi gelombang SVG dinamis.
5. **Big Stats Section (`StatsSection.tsx`):**
   - Grid metrik berukuran besar: 5 detik frekuensi pengiriman, 100% transmisi paket, resolusi 12-bit ADC, dan 24/7 pemantauan lapangan.
6. **Field Environmental Observations (`FieldLogsSection.tsx`):**
   - Rekam catatan log observasi empiris dari tim lapangan mengenai dinamika hembusan angin Laut Jawa dan mikroklimat alun-alun.
7. **Editorial Footer (`SiteFooter.tsx`):**
   - Penutup bertema navy dengan identitas koordinat geodesi Alun-Alun Kota Tegal serta tautan inspeksi diagnostik.
8. **Telemetry Stream Diagnostics & Simulation Modal (`TelemetryDiagnosticModal.tsx`):**
   - Panel diagnostik teknis lengkap yang memungkinkan pergantian node, pengujian burst data, injeksi paket rusak/duplikat/tertunda untuk keperluan pengujian dan demonstrasi langsung.
9. **Engine Peringatan & Deteksi Bahaya Real-Time (`useAlertEngine.ts`, `AlertToastContainer.tsx`):**
   - Deteksi otomatis anomali suhu ekstrem (>38°C), kelembapan tinggi (>85%), dan lonjakan gas MQ-135 dengan sistem toast alert yang tidak mengganggu.
   - Penambahan unit test `src/hooks/useAlertEngine.test.ts` (7 tes lulus).

---

### Epoch III: Optimasi Mobile, Asset Fotografi & Rantai Multi-Format

1. **Penyempurnaan Proporsi Mobile:**
   - Perbaikan masalah scaling font mobile: mengganti root rem `4.44vw` pada layar kecil menjadi standar proporsional `14px` di `src/styles/global.css`.
   - Mengubah ukuran judul menjadi fluid menggunakan `clamp()`.
   - Grid 2x2 pada bagian statistik saat dibuka di perangkat mobile.
2. **Floating Mobile Telemetry Quick-Bar:**
   - Menambahkan bilah apung telemetri di bagian bawah layar ponsel (`.mobile-telemetry-bar`) yang muncul saat pengguna scroll melewati Hero, lengkap dengan indikator denyut sinyal (*live pulse*).
3. **Integrasi Asset Fotografi Asli & WebP Companions:**
   - Mengintegrasikan 4 foto otentik Kota Tegal format `.jpeg` dari pengguna:
     - `hero-alun-alun.jpeg` (Fasad luas Alun-Alun Kota Tegal)
     - `zona-rumput.jpeg` (Area sentral rumput sintetis)
     - `jalan-pancasila.jpeg` (Pedestrian koridor timur menuju stasiun)
     - `masjid-agung.jpeg` (Fasad barat dan menara ikonik)
   - Membuat companion file format modern `.webp` menggunakan ImageMagick (mengompresi ukuran dari ~3.2 MB menjadi ~500 KB tanpa mengurangi ketajaman visual).
   - Memasang rantai fallback multi-ekstensi yang tangguh pada tag `<picture>` dan `onError`:
     `.jpeg` ➔ `.webp` ➔ `.jpg` ➔ `.png` ➔ `.svg`.
   - Menjaga asset vektor node sensor perangkat keras (`sensor-node.svg`) tetap utuh menunggu foto modul ESP32 fisik dari pengguna.

---

### Epoch IV: Interaktivitas 3D Spatial Deck & Menu Hamburger "Air Menetes"

1. **3D Stacked Spatial Deck (`ZoneTrustSection.tsx`, `effects.css`):**
   - Mengubah tampilan foto kawasan yang sebelumnya statis menjadi susunan multi-kartu 3D bertingkat (*spatial stacked deck* dengan `perspective: 1200px`).
   - Kartu aktif berada di depan (`scale(1)`), sedangkan 2 kartu lainnya mengintip di belakang kanan dan kiri (`scale(0.92)` dan `scale(0.84)`).
   - Mendukung **Spatial Peeling**: pengguna dapat mengklik langsung kartu yang mengintip di belakang untuk membawanya ke depan.
   - Navigasi 1-klik melalui tab pill zona di bagian atas.
2. **Holographic Mouse-Tilt Physics & Glare Sheen:**
   - Kartu aktif merespons posisi mouse kursor pada desktop dengan kemiringan rotasi 3D real-time (`rotateX`, `rotateY`).
   - Pantulan kilau cahaya holografis dinamis (*specular glare overlay*) yang bergerak melingkar mengikuti kursor.
   - Pada layar sentuh/mobile: mendukung sentuhan geser (*touch drag & swipe*) dengan miringan dinamis sebelum melepaskan kartu.
3. **Live Environmental HUD Overlay:**
   - Radar beacon cyan berkedip (*pulsing GPS radar beacon*) pada koordinat presisi Kota Tegal.
   - Chip telemetri mikroklimat dinamis yang langsung dihitung dari data live ESP32-S3:
     - *Rumput Sintetis:* Eksposur radiasi termal (Hangat Terik / Panas Ekstrem / Optimal).
     - *Jalan Pancasila:* Koridor angin laut pesisir (Semilir Segar / Lembap Pesisir).
     - *Masjid Agung:* Buffer kualitas udara dan akustik (Buffer Bersih / Partikulat).
   - Garis bidik instrumentasi observatorium teknis (`NODE-S3 TARGET`).
4. **Dropdown Hamburger Menu dengan Fisika "Air Menetes & Memantul" (`DropletMenuDropdown.tsx`, `SiteHeader.tsx`):**
   - Menggantikan menu full-screen sebelumnya dengan **floating dropdown menu** yang terhubung langsung ke tombol hamburger.
   - **Fisika Tetesan Air Saat Membuka (Klik 1):**
     - Tombol hamburger terkompresi elastis (*liquid squish* `scale(0.85, 1.2)`).
     - Cincin riak gelombang air cyan memancar keluar (*wave ping*).
     - Dua garis hamburger bertransformasi elastis (*morphing*) menjadi ikon silang 'X'.
     - Menu dropdown jatuh ke bawah dari tombol seperti tetesan air kental yang meregang (*viscous liquid stretch* `scale(0.92, 1.16)` dengan `translateY(14px)`), lalu memantul dengan recoil pegas (*elastic overshoot* `scale(1.05, 0.94)` dengan `translateY(-5px)`), dan stabil di posisi akhir.
     - Item menu di dalamnya menetes turun satu persatu secara *staggered* (jeda 45ms).
   - **Fisika Tetesan Air Saat Menutup (Klik 2):**
     - Ikon 'X' berputar kembali menjadi 2 garis sejajar.
     - Dropdown menu mengalami tarikan tegangan permukaan (*surface tension dip*), lalu tersedot menyusut naik kembali ke dalam tombol hamburger (`scale(0.18, 0.06)` dengan `translateY(-28px)`), dan unmount dengan mulus setelah 290ms.
   - **Responsif Lintas Perangkat:** Berjalan presisi di desktop (`24rem`), tablet (`22rem`), dan mobile (`calc(100vw - 2rem)`).
   - Dilengkapi *backdrop scrim* lembut untuk menutup menu saat mengetuk area luar atau menekan tombol `Escape`.

---

### Epoch V: Integrasi Rain Sensor (GPIO 8 / ADC1) & Sistem Peringatan Presipitasi

1. **Pemilihan Pin Bebas Interferensi Wi-Fi (Hardware ADC1):**
   - Mengalokasikan pin analog **GPIO 8** pada ESP32-S3 yang terhubung langsung ke **ADC1 (`ADC1_CH7`)**.
   - Menghindari kanal ADC2 (GPIO 11–18) yang mengalami tabrakan sinyal/disabilitas saat radio Wi-Fi aktif melakukan transmisi paket MQTT.
2. **Implementasi Firmware ESP32-S3 (`SmartCIty-ESP32.ino`):**
   - Menambahkan `#define RAIN_PIN 8` dengan konfigurasi `pinMode(RAIN_PIN, INPUT)` dan `analogSetPinAttenuation(RAIN_PIN, ADC_11db)`.
   - Mengimplementasikan fungsi `readRainSensor()` dengan teknik *10-sample oversampling* (jeda 500µs) untuk memfilter fluktuasi riak tegangan analog.
   - Mengonversi resistansi invers pelat sensor LM393 menjadi status cuaca terstandardisasi:
     - `> 3500 ADC`: `"Kering"` (`is_raining: false`)
     - `2500 – 3500 ADC`: `"Gerimis"` (`is_raining: true`)
     - `1500 – 2500 ADC`: `"Hujan Sedang"` (`is_raining: true`)
     - `<= 1500 ADC`: `"Hujan Lebat"` (`is_raining: true`)
   - Memasukkan `"rain_raw"`, `"rain_status"`, dan `"is_raining"` ke payload JSON telemetri MQTT.
3. **Pembaruan Kontrak Data & Parser Toleran:**
   - Memperbarui [`MQTT-CONTRACT.md`](file:///home/narr/Projects/SmartCity/MQTT-CONTRACT.md) dan `src/telemetry/types.ts` dengan interface `RainStatus` dan batasan 12-bit (`0..4095`).
   - Parser aman di `src/mqtt/parser.ts` mendukung *backward-compatibility* penuh (data lama tanpa sensor hujan tetap diterima tanpa error).
4. **Engine Peringatan Dini & Dashboard Observatorium:**
   - Menambahkan evaluator bahaya presipitasi di `src/hooks/useAlertEngine.ts` untuk memicu peringatan waspada permukaan licin saat hujan terdeteksi.
   - Menambahkan ikon `CloudRain` pada toast notifikasi di `src/components/alerts/AlertToastContainer.tsx`.
   - Menambahkan baris `#04: Presipitasi & Curah Hujan (Pin 8)` pada `TelemetryMatrixSection.tsx`.
   - Menambahkan slide ke-4 otomatis pada hero telemetry card di `HeroSection.tsx`.
   - Memperbarui simulator manual & burst generator di `src/App.tsx`.

---

## 3. Manifestasi Struktur Berkas Proyek

```
SmartCity/
├── .env.example                               # Template konfigurasi environment (Broker WebSocket)
├── .gitignore                                 # Aturan pengabaian berkas sensitif, log, & build
├── .oxlintrc.json                             # Konfigurasi linter JavaScript/TypeScript berkecepatan tinggi
├── ARCHITECTURE.md                            # Spesifikasi arsitektur teknis lengkap sistem
├── CHANGELOG.md                               # Catatan riwayat rilis formal
├── CHANGE_THEME.md                            # Panduan transformasi tema Tegal EcoSense Observatory
├── DESIGN.md                                  # Spesifikasi token visual & desain living ambient
├── MQTT-CONTRACT.md                           # Kontrak komunikasi protokol MQTT & spesifikasi payload
├── PRD.md                                     # Product Requirements Document induk
├── PROJECT_VAULT.md                           # Berkas vault rekam jejak historis ini
├── README.md                                  # Dokumentasi pengantar proyek & instruksi eksekusi
├── SECURITY.md                                # Analisis ancaman, audit kebocoran data & kebijakan privasi
├── VALIDATION.md                              # Lembar validasi penerimaan 20 kriteria produksi
├── package.json                               # Definisi paket, skrip build, dependensi runtime & dev
├── tsconfig.json                              # Konfigurasi induk TypeScript compiler
├── vite.config.ts                             # Konfigurasi bundler Vite
│
├── SmartCIty-ESP32/                           # Firmware mikrokontroler edge
│   └── SmartCIty-ESP32.ino                    # Source code Arduino/C++ ESP32-S3 + DHT22 + MQ135
│
├── public/                                    # Asset statis publik
│   ├── favicon.svg                            # Favicon bertema maritime cyan
│   ├── icons.svg                              # SVG sprite ikon sistem
│   └── assets/tegal/                          # Asset visual kawasan Alun-Alun Tegal
│       ├── hero-alun-alun.jpeg (.webp, .svg)  # Foto lanskap utama Alun-Alun
│       ├── zona-rumput.jpeg (.webp, .svg)     # Foto zona rumput sintetis
│       ├── jalan-pancasila.jpeg (.webp, .svg) # Foto koridor pedestrian Jl. Pancasila
│       ├── masjid-agung.jpeg (.webp, .svg)    # Foto fasad Masjid Agung Tegal
│       └── sensor-node.svg (.webp)            # Mockup vektor perangkat keras sensor ESP32
│
└── src/                                       # Source code aplikasi React
    ├── App.tsx                                # Shell aplikasi utama & orkestrasi hook telemetri
    ├── main.tsx                               # Entrypoint React 19 DOM
    │
    ├── components/
    │   ├── 3d/
    │   │   └── AtmosphericCanvas.tsx          # Latar Three.js partikel partikulat atmosfer 3D
    │   ├── alerts/
    │   │   └── AlertToastContainer.tsx        # Toast notifikasi peringatan suhu/gas/hazard
    │   ├── ambient/
    │   │   └── LivingAmbientCanvas.tsx        # Kanvas generatif microclimate 30 FPS
    │   ├── charts/
    │   │   └── RealtimeTelemetryChart.tsx     # Grafik kurva timeseries SVG multi-series
    │   ├── dashboard/
    │   │   └── DashboardHeader.tsx            # Header teknis ringkas
    │   ├── device/
    │   │   └── DeviceHealthCard.tsx           # Kartu status kesehatan node, RSSI & sequence
    │   ├── editorial/
    │   │   ├── DropletMenuDropdown.tsx        # Menu dropdown dengan fisika air menetes & memantul
    │   │   ├── FacilitiesAnalyticsSection.tsx # Seksi analisis korelasi mikroklimat & gelombang
    │   │   ├── FieldLogsSection.tsx           # Seksi catatan lapangan observatorium
    │   │   ├── FullscreenMenuOverlay.tsx      # Kompatibilitas re-export menu
    │   │   ├── HeroSection.tsx                # Hero editorial utama dengan metrik headline
    │   │   ├── IntroLoader.tsx                # Tirai pembuka animasi selamat datang
    │   │   ├── SiteFooter.tsx                 # Footer editorial observatorium
    │   │   ├── SiteHeader.tsx                 # Header navigasi & tombol hamburger droplet
    │   │   ├── StatsSection.tsx               # Grid statistik performa & transmisi data
    │   │   ├── TelemetryDiagnosticModal.tsx   # Modal kontrol diagnostik & simulator data mentah
    │   │   ├── TelemetryMatrixSection.tsx     # Matriks baris pembacaan parameter telemetri
    │   │   └── ZoneTrustSection.tsx           # 3D spatial deck kawasan & live environmental HUD
    │   ├── telemetry/
    │   │   ├── GasCard.tsx                    # Kartu metrik sensor gas MQ-135
    │   │   ├── HumidityCard.tsx               # Kartu metrik sensor kelembapan DHT22
    │   │   └── TemperatureCard.tsx            # Kartu metrik sensor suhu DHT22
    │   └── ui/
    │       ├── MqttStateBadge.tsx             # Badge status konektivitas broker
    │       └── TechnicalFrame.tsx             # Bingkai sudut reticle saintifik
    │
    ├── hooks/
    │   ├── useAlertEngine.ts                  # Engine evaluasi ambang batas bahaya & stale
    │   ├── useAlertEngine.test.ts             # Pengujian unit engine peringatan
    │   ├── useMqtt.ts                         # Hook integrasi siklus hidup MQTT WebSocket
    │   └── useTelemetry.ts                    # Hook konsolidasi telemetri & watchdog
    │
    ├── mqtt/
    │   ├── client.ts                          # Klien MQTT WebSocket handal ber-exponential backoff
    │   ├── client.test.ts                     # Pengujian unit koneksi & backoff
    │   ├── config.ts                          # Konfigurasi broker & ID generator unik
    │   ├── parser.ts                          # Parser telemetri anti-crash & normalizer LWT
    │   ├── parser.test.ts                     # Pengujian unit parser & validasi rentang fisik
    │   └── topics.ts                          # Builder topik MQTT standar
    │
    ├── styles/
    │   ├── effects.css                        # Animasi keyframes, 3D transform, glassmorphism, droplet
    │   ├── global.css                         # CSS reset, skala tipografi rem responsif, layout
    │   └── tokens.css                         # Variabel CSS warna, radius, & rona maritim Tegal
    │
    └── telemetry/
        ├── formatters.ts                      # Formatter uptime & grading kualitas RSSI
        ├── history.ts                         # Timeseries BoundedRingBuffer (300 sampel)
        ├── history.test.ts                    # Pengujian unit ring buffer
        ├── store.ts                           # Store reaktif penyimpan paket & detektor duplikat
        ├── store.test.ts                      # Pengujian unit store & watchdog
        └── types.ts                           # Interface TypeScript TelemetryData & TELEMETRY_LIMITS
```

---

## 4. Matriks Verifikasi, Keamanan & Pengujian Kualitas

| Kategori Pengujian | Instrumen | Hasil / Status | Keterangan |
|---|---|---|---|
| **Pemeriksaan Linter** | `oxlint` (116 rules) | **0 Warning, 0 Error** | Diuji pada 43 berkas dalam 149ms |
| **Kompilasi TypeScript** | `tsc -b` | **0 Error** | Mode ketat (*strict mode*) aktif tanpa tipe implisit `any` |
| **Unit Testing: Parser** | `vitest` | **14 / 14 Lulus** | Menguji JSON korup, batas suhu, kelembapan, gas, & rain sensor |
| **Unit Testing: Store** | `vitest` | **8 / 8 Lulus** | Menguji paket duplikat, watchdog 15s, counter |
| **Unit Testing: Ring Buffer** | `vitest` | **5 / 5 Lulus** | Menguji batas 300 sampel, $O(1)$ eviction |
| **Unit Testing: MQTT Client** | `vitest` | **3 / 3 Lulus** | Menguji backoff reconnect, status transisi |
| **Unit Testing: Security** | `vitest` | **5 / 5 Lulus** | Menguji sanitasi prototype pollution & data fiktif |
| **Unit Testing: Alert Engine**| `vitest` | **8 / 8 Lulus** | Menguji persistensi alert, ambang batas bahaya, & presipitasi hujan |
| **Total Test Suite** | `vitest run` | **43 / 43 Lulus (100%)** | Durasi eksekusi ~1.34 detik |
| **Production Build** | `vite build` | **Sukses (1.89s)** | Menghasilkan bundel teroptimasi di direktori `dist/` |

---

## 5. Spesifikasi Hardware & Kontrak Komunikasi Edge

Antarmuka ini terhubung dengan firmware mikrokontroler di direktori [`SmartCIty-ESP32/SmartCIty-ESP32.ino`](file:///home/narr/Projects/SmartCity/SmartCIty-ESP32/SmartCIty-ESP32.ino):

- **Mikrokontroler:** Espressif ESP32-S3 (Wi-Fi 2.4GHz 802.11 b/g/n)
- **Sensor Suhu & Kelembapan:** Aosong DHT22 (AM2302) pada Pin GPIO 6
- **Sensor Kualitas Udara:** Winsen MQ-135 pada Pin Analog GPIO 7 (ADC 12-bit ADC1, attenuasi 11dB, voltage divider 10k/15k)
- **Sensor Hujan (Presipitasi):** LM393 Rain Plate pada Pin Analog GPIO 8 (ADC1 Channel 7, attenuasi 11dB)
- **Topik MQTT Telemetri:** `aethersense/{device_id}/telemetry` (QoS 0, frekuensi interval 5000ms)
- **Topik Status LWT:** `aethersense/{device_id}/status` (QoS 1, retain: true, LWT: `"offline"`)
- **Struktur Payload Telemetri Standar:**
  ```json
  {
    "device_id": "esp32s3-E8A851858428",
    "sequence": 1420,
    "timestamp": 1726934400,
    "uptime_s": 7100,
    "temperature_c": 31.4,
    "humidity_percent": 68.2,
    "mq135_raw": 1142,
    "mq135_adc_mv": 920,
    "mq135_sensor_mv": 1380,
    "rain_raw": 3950,
    "rain_status": "Kering",
    "is_raining": false,
    "wifi_rssi_dbm": -64
  }
  ```

---
*Dokumen vault ini diarsip dan dilacak secara permanen dalam repositori Git proyek AetherSense Tegal EcoSense.*
