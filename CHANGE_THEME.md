# Product Requirement Document (PRD) v2.0

# Tegal EcoSense Observatory (Alun-Alun Kota Tegal)

**Konsep:** *High-End Editorial Urban Observatory & Real-Time Environmental Telemetry*

**Arsitektur:** React (Vite) + Tailwind CSS + Lenis Smooth Scroll + MQTT.js (HiveMQ)

---

## 1. Executive Summary & Alasan Rombak Total

Dashboard lama masih terlihat seperti panel admin standar (grid kartu kaku, sidebar generik, dan tampilan dashboard bootstrap/SaaS biasa).

PRD v2.0 ini adalah **rombak total paradigma visual**:

1. **Bukan Admin Panel Biasa:** Mengadopsi struktur *editorial luxury landing page* (persis layout *Baseline*): full-bleed typography, parallax backdrop, kinetic mask reveals, rounded card insets, dan micro-interaction spring animations.
2. **Telemetry Inside Storytelling:** Fungsi inti IoT (ESP32-S3, DHT22, MQ135, dan HiveMQ) **tidak diubah logikanya**, melainkan disuntikkan secara dinamis ke dalam elemen editorial: headline dinamis, ticker kartu kaca, live matrix, dan grafik interaktif berbasis bounded buffer.
3. **Identitas Alun-Alun Kota Tegal:** Menggantikan seluruh elemen tenis dengan identitas ruang publik pesisir Tegal (zona rumput sintetis, koridor Masjid Agung Kota Tegal, jalur pedestrian Jalan Pancasila, dan iklim maritim Pantura).

---

## 2. Arsitektur Data & Kontrak IoT (Dipertahankan Penuh)

Logika koneksi dan data stream dari PRD awal tetap berjalan 100% tanpa mengubah firmware ESP32:

```text
  [ESP32-S3 @ Alun-Alun Tegal]
     ├── DHT22 (GPIO6) -> Suhu & Kelembaban
     └── MQ135 (GPIO7) -> Analog ADC & Tegangan
           │
           ▼ MQTT TCP (:1883)
  [HiveMQ Public Broker: broker.hivemq.com]
           │
           ▼ MQTT WebSocket (ws://broker.hivemq.com:8000/mqtt)
  [React + Vite (Tegal EcoSense)]
     ├── Hook `useMqtt`: Koneksi, reconnect backoff, state (Connected/Reconnecting/Offline)
     ├── Store `telemetryStore`: Bounded ring-buffer (maks 300 sampel)
     └── Editorial UI Layer: Lenis scroll, spring animations, telemetry ticker

```

> **Aturan Integritas Data:** Nilai MQ135 hanya ditampilkan sebagai `Raw ADC` (0–4095) dan `Sensor Voltage (mV)`. Tidak boleh menampilkan CO2 ppm atau AQI fiktif sebelum ada kalibrasi laboratorium.

---

## 3. Design System, Tokens, & Layout Shell

### 3.1. Palette Token (`:root`)

```css
:root {
  --background: #ffffff;
  --foreground: #0a0a0a;

  /* Maritime & Urban Tegal Identity */
  --brand: #0284c7;       /* Royal Coastal Cyan */
  --brand-deep: #08192e;  /* Deep Maritime Navy (Warna dasar Hero, Stats, Footer) */
  --brand-light: #38bdf8; /* Light blue accent & focus ring */
  --accent-teal: #0d9488; /* Rona vegetasi ruang terbuka hijau */

  /* Surface & Typography */
  --surface: #f4f5f7;     /* Off-white section background */
  --surface-card: #ffffff;
  --ink: #0a0e17;         /* Near-black headings */
  --ink-soft: #64748b;    /* Muted body / technical subtext */
  --ghost: #cbd5e1;       /* Oversized ghost typography */
  --hairline: #e2e8f0;    /* Subtle technical borders */
  --on-brand: #ffffff;    /* Text on navy */

  /* Radii */
  --radius-card: 1.5rem;
  --radius-card-lg: 2rem;
  --radius-pill: 62.5rem;
}

```

### 3.2. Adaptive Rem Grid & Frame

* **Font Utama:** Google Font **Onest** (weights 400, 500).
* **Smooth Scroll:** **Lenis** (`smoothWheel: true`) diintegrasikan via `requestAnimationFrame`.
* **Page Inset:** Seluruh halaman berada di dalam `<main>` dengan padding `0.5rem` (mobile) / `0.75rem` (desktop). Latar belakang body `#ffffff`, sehingga seluruh section tampil seperti rounded card framing raksasa.
* **Adaptive Font Size:**
```css
html { font-size: 16px; }
@media (max-width: 1920px) { html { font-size: 0.833333vw; } }
@media (max-width: 1440px) { html { font-size: 1.111111vw; } }
@media (max-width: 1024px) { html { font-size: 1.5625vw;  } }
@media (max-width: 640px)  { html { font-size: 4.444444vw; } }

```



---

## 4. Rekonstruksi Struktur Halaman (1:1 dengan Template Baseline)

Urutan komponen di dalam `<main>`:

**Intro Loader → Header → Hero → Zone Trust → Telemetry Matrix → Facilities/Analytics → Stats Band → Field Logs → Footer**

```text
Page Shell (<main> dengan padding inset 0.75rem)
│
├── 0. Navy Intro Curtain Loader (Wordmark + progress bar + slide-up reveal)
│
├── 1. Site Header (Transparan di dalam Hero)
│     ├── Navigasi: #matrix (Telemetri), #analytics (Analisis Grafik), #zones (Zona)
│     ├── Center Brand: Logo Menara/Sinyal + "TEGAL ECOSENSE"
│     └── Right: Live MQTT Dot (Online/Offline) + Tombol "Data Mentah" + Burger Icon
│
├── 2. Hero Section (Deep Navy Card)
│     ├── Parallax Background: Foto Lanskap Alun-Alun Kota Tegal
│     ├── Giant Title: Clip-mask reveal "NAFAS IKLIM BAHARI" (12.5vw)
│     ├── Bottom Row Tagline: "ALUN-ALUN KOTA," / "MONITORING AKTIF"
│     └── Right Cluster:
│           ├── Live Telemetry Slider (Card berotasi: Suhu, Humiditas, MQ135)
│           └── Station Health Card (Uptime, RSSI Wi-Fi, Avatar status sensor)
│
├── 3. Zone Trust Section (Katalog Wilayah & Sinyal)
│     ├── Percentage Badge: "100%" - Uptime Stasiun Pemantau
│     ├── Oversized Ghost Heading (8.2vw) dengan Parallax X berlawanan:
│     │     ["SENSOR", "AKTIF", "JANTUNG", "KOTA"]  (Kata "JANTUNG" warna --ink)
│     ├── Center Tilt Card (6deg): Foto sudut Alun-Alun Tegal dengan glass caption
│     └── Controls: Prev/Next Arrow Button + Active Carousel Dots
│
├── 4. Telemetry Matrix (Pengganti Program List)
│     ├── Eyebrow: "Parameter Pengukuran" + Title "Data Terbuka" / "Ruang Publik"
│     └── 4 Baris List Interaktif (Border Hairline + Arrow Spring Hover):
│           ├── 01 Temperatur Udara (DHT22) -> Tampilkan °C live
│           ├── 02 Kelembaban Relatif (DHT22) -> Tampilkan % live
│           ├── 03 Sensor Kualitas Gas (MQ135 Raw ADC & mV) -> Tampilkan nilai live
│           └── 04 Integritas Jaringan (ESP32 RSSI & Uptime) -> Tampilkan dBm
│
├── 5. Facilities & Analytics Section (-mt-10 overlap rounded card)
│     ├── Kolom Kiri: Deskripsi iklim mikro Alun-Alun Tegal + icon preview
│     └── Kolom Kanan: 2 Kartu Berdampingan (Staggered baseline)
│           ├── Kartu 1: Real-time Interactive Temperature & Humidity Chart
│           └── Kartu 2: MQ135 Gas Dynamic Waveform Chart
│
├── 6. Stats Section (Deep Navy Card, 4-Up Grid)
│     ├── 300 Sampel (Ring Buffer) · <1s Latensi MQTT · 24/7 Monitoring · 6°52'S Koordinat
│
├── 7. Field Logs & Environmental Notes (Pengganti Testimonials)
│     └── 3 Kartu Review Lapangan (Quote glyph raksasa + hover lift -8px)
│
├── 8. Footer (Deep Navy Card)
│     ├── CTA Band: "Siap Eksplorasi Data?" + Pill Button "Buka Konsol"
│     ├── Grid 4 Kolom: Brand Tegal EcoSense, Parameter, Navigasi, Kontak Alun-Alun
│     └── Bottom Bar: Copyright 2026 + Legal + Koordinat Presisi Alun-Alun Tegal
│
└── Portals:
      ├── Telemetry Diagnostic Modal (Formulir inspeksi payload, device info, reconnect)
      └── Fullscreen Navigation Overlay (Menu burger layar penuh)

```

---

## 5. Detail Spesifikasi Setiap Section

### 5.1. Intro Curtain Loader

* **Elemen:** Tirai viewport penuh warna `--brand-deep`.
* **Konten:** Wordmark instrumen + teks **TEGAL ECOSENSE** (`text-2xl`, tracking `0.2em`) dan progress bar `10rem x 1px`.
* **Animasi:** Progress bar mengisi `0% → 100%` selama 1280ms (`easeInOutCubic`).
* **Trigger:** Mengunci scroll Lenis. Setelah 1400ms (atau data pertama MQTT diterima), tirai meluncur ke atas `translateY(0%) → translateY(-105%)` selama 850ms, Lenis aktif, dan memicu animasi entrance teks Hero.

### 5.2. Header Transparan (Di dalam Hero)

* Terletak di posisi absolut atas hero dengan padding `1.5rem` / `2.5rem`.
* **Navigasi Kiri:** Tautan halus `#matrix` (Parameter), `#analytics` (Grafik), `#zones` (Kawasan Alun-Alun).
* **Tengah:** Logo ikonik Menara Alun-Alun/Sinyal IoT + **TEGAL ECOSENSE** (uppercase, tracking `0.2em`).
* **Kanan:**
* Pill status koneksi: Dot hijau/kuning/merah berdenyut bertuliskan `MQTT ● CONNECTED` atau `MQTT ● RECONNECTING`.
* Tombol teks **"Data Mentah"** (membuka Diagnostic Modal).
* Burger button: Tombol bulat `size-10` kaca (`backdrop-blur`, border putih 15%) untuk membuka Fullscreen Overlay.



### 5.3. Hero Section (Parallax & Live Data)

* **Background Plate:** Foto resolusi tinggi lanskap Alun-Alun Kota Tegal (`hero-alun-alun.webp`), diberi efek scroll parallax `translateY(0%) → translateY(12%)`. Dilapisi gradien `rgba(8,25,46,0.7)` ke `rgba(8,25,46,0.85)`.
* **Judul Kinetik Raksasa:** `<h1 id="hero-title">` bertuliskan **"NAFAS KOTA BAHARI"**. Font size `12.5vw`, line-height `0.85`, clip-mask slide-up per kata dengan delay stagger 140ms.
* **Bottom Row:**
* **Tagline Kiri:** Dua baris bertingkat: **"RUANG TERBUKA,"** / **"DATA REALTIME"** (font size `2.4rem`).
* **Cluster Kanan (Live Snapshot):**
* *Mini Auto-Advancing Card:* Kartu kaca berotasi otomatis setiap 3.8 detik menampilkan data aktif:
1. Slide 1: **Suhu Udara** → `{telemetry.temperature_c}°C` (DHT22).
2. Slide 2: **Kelembaban** → `{telemetry.humidity_percent}%` (DHT22).
3. Slide 3: **Kualitas Udara** → `{telemetry.mq135_raw} ADC` (MQ135).


* *Hardware Health Card:* Menampilkan info node ESP32-S3, nilai RSSI Wi-Fi (`{telemetry.wifi_rssi_dbm} dBm`), dan status uptime.





### 5.4. Zone Trust Section (Ghost Parallax Heading)

* **Top Badges:** Lingkaran persentase **"100%"** (*Transmisi Paket Sinyal*) berdampingan dengan kartu index `#01 Jantung Kota Tegal`.
* **Ghost Heading Raksasa:** Font size `8.2vw`, 2 baris teks ghost yang bergeser ke kiri dan kanan secara berlawanan saat scroll:
* Baris 1: `["MONITORING", "PRESISI"]`
* Baris 2: `["UDARA", "PESISIR"]` (Kata "UDARA" berwarna hitam `--ink`, kata lainnya `--ghost`).


* **Kartu Tengah Melayang (6deg Tilt):** Foto zona Alun-Alun Tegal (misal: area rumput sintetis) dengan caption kaca: nama zona dan waktu pembaruan terakhir.

### 5.5. Telemetry Matrix (Pengganti Programs List)

Daftar 4 baris interaktif dengan hairline divider. Saat di-hover, baris merespons dan panah lingkaran di sisi kanan meluncur `x: 0 -> 8px`:

| Index | Nama Parameter | Data Realtime Live | Deskripsi Lapangan |
| --- | --- | --- | --- |
| **01** | **Temperatur Ambien** | `{telemetry.temperature_c} °C` | Suhu mikro di area terbuka rumput sintetis Alun-Alun |
| **02** | **Kelembaban Relatif** | `{telemetry.humidity_percent} %` | Kejenuhan uap air pesisir utara Tegal |
| **03** | **Sensor Gas & Partikel** | `{telemetry.mq135_raw} ADC ({telemetry.mq135_sensor_mv} mV)` | Pembacaan analog resistansi udara MQ135 |
| **04** | **Transmisi Node IoT** | `{telemetry.wifi_rssi_dbm} dBm · {telemetry.uptime_s}s` | Kekuatan sinyal Wi-Fi ESP32-S3 & uptime sistem |

### 5.6. Facilities & Realtime Analytics (-mt-10 Overlapping Section)

Section putih dengan border-radius lengkung yang menumpuk ke atas section sebelumnya (`-mt-10`):

* **Kolom Kiri:** Judul bertumpuk **"Jelajahi"** / **"Dinamika"** / **"Udara"** disertai paragraf analitis iklim mikro Alun-Alun Tegal.
* **Kolom Kanan (Realtime Charts):**
* **Chart Card 1:** Visualisasi grafik garis SVG/Canvas untuk tren Suhu & Kelembaban (mengambil data dari bounded buffer 300 sampel, ter-update tiap paket MQTT masuk).
* **Chart Card 2:** Visualisasi histogram / waveform untuk lonjakan pembacaan sensor gas MQ135.



### 5.7. Stats Section (By The Numbers)

Section warna `--brand-deep` dengan grid 4 kolom:

1. **300** — Buffer Sampel In-Memory (Memory-safe).
2. **<1s** — Latensi Telemetri MQTT via HiveMQ.
3. **24/7** — Pemantauan Nirhenti Kawasan Publik.
4. **6°52'S** — Titik Koordinat Alun-Alun Kota Tegal.

### 5.8. Field Logs (Pengganti Testimonials)

Tiga kartu bertema catatan observasi lapangan di atas latar `--surface`:

1. *"Suhu terukur stabil dengan penurunan bertahap saat angin laut masuk di sore hari."* — **Log Stasiun Maritim**.
2. *"Respon analog MQ135 menunjukkan kenaikan resistansi saat volume kendaraan meningkat di Jalan Pancasila."* — **Observasi Mobilitas Warga**.
3. *"Transmisi paket telemetri ESP32-S3 mencatat packet loss 0% pada jaringan Alun-Alun."* — **Laporan Jaringan Stasiun**.

### 5.9. Footer & Metadata Geografis

* CTA Banner: **"Akses Data Terbuka Lingkungan Tegal"** dengan tombol kapsul putih **"Inspeksi Node"**.
* Grid 4 kolom berisi kontak pos pantau, link dokumentasi HiveMQ, spesifikasi sensor DHT22/MQ135, dan koordinat resmi Alun-Alun Kota Tegal.

---

## 6. Pemetaan Aset Visual Alun-Alun Kota Tegal

Simpan seluruh aset di folder `public/assets/tegal/`:

| Path Aset Baru | Peruntukan di UI | Deskripsi Visual |
| --- | --- | --- |
| `/assets/tegal/hero-alun-alun.webp` | Hero Parallax Background | Lanskap megah Alun-Alun Tegal (Masjid Agung + rumput sintetis senja) |
| `/assets/tegal/zona-rumput.webp` | Hero Slider & Center Tilt Card | Warga beraktivitas di area rumput hijau sintetis |
| `/assets/tegal/jalan-pancasila.webp` | Zone Trust Slide 2 | Koridor pedestrian timur Alun-Alun (Jalan Pancasila) |
| `/assets/tegal/masjid-agung.webp` | Zone Trust Slide 3 | Fasad dan menara Masjid Agung Kota Tegal |
| `/assets/tegal/sensor-node.webp` | Analytics Intro Icon & Modal | Kotak enclosure hardware ESP32-S3 + sensor |

---

## 7. Strategi Implementasi di React + Vite (Anti-Lag & Anti-Crash)

Agar animasi Lenis dan kinetic typography tidak patah-patah saat data MQTT mengalir deras:

1. **Pisahkan State Rendering:** Jangan letakkan state data sensor di root `App.tsx`. Buat konteks atau store terisolasi (`useTelemetryStore`) sehingga saat ada update data tiap detik, hanya angka di dalam kartu yang re-render, bukan seluruh layout halaman.
2. **Pertahankan Bounded History:** Tetap gunakan batas 300 sampel array FIFO (`slice(-300)`) agar konsumsi RAM browser tidak meningkat tanpa batas.
3. **Isolasi Lenis:** Jalankan inisialisasi Lenis di dalam `useEffect` sekali saja pada tingkat halaman utama. Kunci scroll saat Diagnostic Modal atau Fullscreen Menu terbuka.
4. **Hapus Kode Dashboard Lama:** Bersihkan seluruh komponen sidebar, grid admin card Bootstrap/Tailwind lama, dan ganti struktur routing menjadi single-page editorial scroll sesuai PRD ini.
