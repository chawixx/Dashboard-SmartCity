import { useState, useEffect, useMemo, useRef } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useMqtt } from './hooks/useMqtt';
import { useTelemetry } from './hooks/useTelemetry';
import { mqttConfig } from './mqtt/config';
import { extractDeviceIdFromTopic, getTelemetryTopic, getStatusTopic, getCommandTopic } from './mqtt/topics';
import { type RelayStates } from './telemetry/types';

// Editorial Components (PRD v2.0 - Tegal EcoSense Observatory)
import { IntroLoader } from './components/editorial/IntroLoader';
import { SiteHeader } from './components/editorial/SiteHeader';
import { HeroSection } from './components/editorial/HeroSection';
import { ZoneTrustSection } from './components/editorial/ZoneTrustSection';
import { TelemetryMatrixSection } from './components/editorial/TelemetryMatrixSection';
import { SectorLightingControlSection } from './components/editorial/SectorLightingControlSection';
import { FacilitiesAnalyticsSection } from './components/editorial/FacilitiesAnalyticsSection';
import { StatsSection } from './components/editorial/StatsSection';
import { FieldLogsSection } from './components/editorial/FieldLogsSection';
import { SiteFooter } from './components/editorial/SiteFooter';
import { TelemetryDiagnosticModal } from './components/editorial/TelemetryDiagnosticModal';
import { useAlertEngine } from './hooks/useAlertEngine';
import { AlertToastContainer } from './components/alerts/AlertToastContainer';

export default function App() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() => {
    const saved = localStorage.getItem('aethersense_target_device');
    if (saved === 'esp32s3-ABCD12345678' || saved === 'esp32s3-alun-alun-tegal') {
      return 'auto';
    }
    return saved || mqttConfig.defaultDeviceId || 'auto';
  });

  const [discoveredDevices, setDiscoveredDevices] = useState<string[]>([]);
  const [isIntroReady, setIsIntroReady] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis smooth scrolling (CHANGE_THEME.md Section 3.2)
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Lock scroll when diagnostic modal or fullscreen menu is open
  useEffect(() => {
    if (isDiagnosticOpen || isMenuOpen) {
      lenisRef.current?.stop();
      document.documentElement.classList.add('lenis-stopped');
      document.body.style.overflow = 'hidden';
    } else {
      lenisRef.current?.start();
      document.documentElement.classList.remove('lenis-stopped');
      document.body.style.overflow = '';
    }
  }, [isDiagnosticOpen, isMenuOpen]);

  const [showMobileQuickBar, setShowMobileQuickBar] = useState(false);

  // Monitor scroll offset to activate mobile floating quick-bar past hero
  useEffect(() => {
    const handleScroll = () => {
      setShowMobileQuickBar(window.scrollY > 340);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Subscribed topics: wildcard discovery topics (+) and target device if explicitly selected
  const topics = useMemo(() => {
    const list = [mqttConfig.telemetryTopic, mqttConfig.statusTopic];
    if (selectedDeviceId && selectedDeviceId !== 'auto') {
      const specificTelem = getTelemetryTopic(selectedDeviceId);
      const specificStatus = getStatusTopic(selectedDeviceId);
      if (!list.includes(specificTelem)) list.push(specificTelem);
      if (!list.includes(specificStatus)) list.push(specificStatus);
    }
    return list;
  }, [selectedDeviceId]);

  const {
    connectionState,
    lastMessage,
    connect,
    disconnect,
    publish,
    retryNow,
  } = useMqtt({ topics });

  // Dynamically record discovered devices from live MQTT traffic
  useEffect(() => {
    if (!lastMessage) return;
    const fromTopic = extractDeviceIdFromTopic(lastMessage.topic);
    if (fromTopic && fromTopic !== '+' && !discoveredDevices.includes(fromTopic)) {
      queueMicrotask(() => {
        setDiscoveredDevices((prev) => (prev.includes(fromTopic) ? prev : [...prev, fromTopic]));
      });
    }
  }, [lastMessage, discoveredDevices]);

  // Expected device filter (undefined allows auto-ingestion of any active ESP32)
  const expectedDeviceId = selectedDeviceId === 'auto' ? undefined : selectedDeviceId;

  const {
    telemetry,
    deviceStatus,
    isStale,
    lastReceivedAt,
    packetCount,
    errorCount,
    duplicateCount,
    delayedCount,
    lastError,
    formattedUptime,
    history,
  } = useTelemetry({ expectedDeviceId });

  // Threshold alert and hazard detection engine
  const {
    activeAlerts,
    isHazardMode,
    dismissAlert,
  } = useAlertEngine({
    telemetry,
    isStale,
    persistenceSeconds: 6,
  });

  // Update discovered devices if incoming telemetry identifies a node
  useEffect(() => {
    if (telemetry?.device_id && !discoveredDevices.includes(telemetry.device_id)) {
      queueMicrotask(() => {
        setDiscoveredDevices((prev) => (prev.includes(telemetry.device_id) ? prev : [...prev, telemetry.device_id]));
      });
    }
  }, [telemetry?.device_id, discoveredDevices]);

  const handleSelectDevice = (id: string) => {
    setSelectedDeviceId(id);
    localStorage.setItem('aethersense_target_device', id);
  };

  const activeDeviceId =
    telemetry?.device_id ||
    (selectedDeviceId !== 'auto'
      ? selectedDeviceId
      : discoveredDevices[0] || 'esp32s3-E8A851858428');

  const simDeviceId =
    telemetry?.device_id ||
    (selectedDeviceId !== 'auto' ? selectedDeviceId : 'esp32s3-E8A851858428');
  const simTelemetryTopic = getTelemetryTopic(simDeviceId);
  const simStatusTopic = getStatusTopic(simDeviceId);
  const simCommandTopic = getCommandTopic(simDeviceId);

  // Relay 4-Channel local state & hardware sync
  const [relayStates, setRelayStates] = useState<RelayStates>({
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false,
  });

  // Sync relay states when fresh telemetry arrives from ESP32
  useEffect(() => {
    if (telemetry) {
      if (telemetry.relays) {
        const nextRelays = telemetry.relays;
        queueMicrotask(() => {
          setRelayStates(nextRelays);
        });
      } else if (telemetry.relay1 !== undefined) {
        const nextRelays: RelayStates = {
          relay1: !!telemetry.relay1,
          relay2: !!telemetry.relay2,
          relay3: !!telemetry.relay3,
          relay4: !!telemetry.relay4,
        };
        queueMicrotask(() => {
          setRelayStates(nextRelays);
        });
      }
    }
  }, [telemetry]);

  const handleToggleRelay = (relayId: 1 | 2 | 3 | 4, nextState: boolean) => {
    // 1. Optimistic UI update
    setRelayStates((prev) => ({
      ...prev,
      [`relay${relayId}`]: nextState,
    }));

    // 2. Transmit MQTT Command to ESP32-S3
    const payload = JSON.stringify({
      type: 'relay',
      relay: relayId,
      sector: relayId,
      state: nextState,
      timestamp: Math.floor(Date.now() / 1000),
    });
    publish(simCommandTopic, payload);
  };

  const handleToggleAllRelays = (nextState: boolean) => {
    setRelayStates({
      relay1: nextState,
      relay2: nextState,
      relay3: nextState,
      relay4: nextState,
    });

    const payload = JSON.stringify({
      type: 'relay_all',
      relay: 'all',
      state: nextState,
      timestamp: Math.floor(Date.now() / 1000),
    });
    publish(simCommandTopic, payload);
  };

  // Simulation publisher helpers for verification & demonstration
  const handleSendNormalTelemetry = () => {
    const mqVal = Math.floor(750 + (Math.random() * 200 - 100));
    const payload = JSON.stringify({
      device_id: simDeviceId,
      sequence: packetCount + 1,
      timestamp: Math.floor(Date.now() / 1000),
      uptime_s: (telemetry?.uptime_s || 380) + 1,
      temperature_c: +(28.5 + (Math.random() * 3 - 1.5)).toFixed(2),
      humidity_percent: +(68 + (Math.random() * 6 - 3)).toFixed(2),
      mq135_raw: mqVal,
      mq135_adc_mv: +(580 + (Math.random() * 40 - 20)).toFixed(1),
      mq135_sensor_mv: +(966 + (Math.random() * 60 - 30)).toFixed(1),
      air_quality_status: mqVal < 350 ? 'Sangat Bersih' : 'Normal / Cukup Baik',
      is_gas_polluted: false,
      rain_raw: 3850,
      rain_status: 'Kering',
      is_raining: false,
      water_distance_cm: 25.4,
      water_level_cm: 4.6,
      flood_status: 'Aman',
      is_flood_warning: false,
      wifi_rssi_dbm: Math.floor(-56 + (Math.random() * 10 - 5)),
      relays: relayStates,
      relay1: relayStates.relay1,
      relay2: relayStates.relay2,
      relay3: relayStates.relay3,
      relay4: relayStates.relay4,
    });
    publish(simTelemetryTopic, payload);
  };

  const handleSimulateBurst = (count: number = 10) => {
    let currentSeq = packetCount;
    let baseUptime = telemetry?.uptime_s || 380;

    for (let i = 0; i < count; i++) {
      currentSeq++;
      baseUptime += 2;
      const offsetSec = i * 2;
      const isWet = i % 4 >= 2;
      const dist = +(26.0 - (i % 6) * 3.5).toFixed(1);
      const floodH = +(30.0 - dist).toFixed(1);
      const isFlood = dist <= 12.0;
      const isPollutedSample = i % 5 === 4;
      const mqSample = isPollutedSample ? 3400 : Math.floor(500 + (i % 4) * 300);
      const payload = JSON.stringify({
        device_id: simDeviceId,
        sequence: currentSeq,
        timestamp: Math.floor(Date.now() / 1000) - (count - i) * 2,
        uptime_s: baseUptime + offsetSec,
        temperature_c: +(28.0 + Math.sin(i / 2) * 2.2).toFixed(2),
        humidity_percent: +(70.0 + Math.cos(i / 2) * 4.5).toFixed(2),
        mq135_raw: mqSample,
        mq135_adc_mv: +(isPollutedSample ? 2600 : 450 + Math.sin(i) * 80).toFixed(1),
        mq135_sensor_mv: +(isPollutedSample ? 4333.3 : 750 + Math.sin(i) * 120).toFixed(1),
        air_quality_status: isPollutedSample ? 'Tercemar' : mqSample < 350 ? 'Sangat Bersih' : mqSample < 1500 ? 'Normal / Cukup Baik' : 'Polusi Ringan',
        is_gas_polluted: isPollutedSample,
        rain_raw: isWet ? 2200 : 3900,
        rain_status: isWet ? 'Hujan Sedang' : 'Kering',
        is_raining: isWet,
        water_distance_cm: dist,
        water_level_cm: floodH,
        flood_status: dist <= 6.0 ? 'Bahaya Banjir' : dist <= 12.0 ? 'Siaga' : dist <= 20.0 ? 'Waspada' : 'Aman',
        is_flood_warning: isFlood,
        wifi_rssi_dbm: Math.floor(-54 - (i % 3) * 2),
        relays: relayStates,
        relay1: relayStates.relay1,
        relay2: relayStates.relay2,
        relay3: relayStates.relay3,
        relay4: relayStates.relay4,
      });
      publish(simTelemetryTopic, payload);
    }
  };

  const handleToggleStatus = (newStatus: 'online' | 'offline') => {
    publish(simStatusTopic, newStatus, 1);
  };

  const handleSendCorruptTelemetry = () => {
    // Tests non-throwing resilience (PRD Section 17 & 22)
    publish(simTelemetryTopic, '{ "device_id": "esp32s3", corrupt_json: true');
  };

  const handleSendDuplicateTelemetry = () => {
    // Sends packet with current sequence number to test duplicate filter (PRD Section 17 & 28)
    const payload = JSON.stringify({
      device_id: simDeviceId,
      sequence: telemetry?.sequence ?? 1,
      timestamp: Math.floor(Date.now() / 1000),
      uptime_s: telemetry?.uptime_s || 380,
      temperature_c: +(28.2).toFixed(2),
      humidity_percent: +(66.5).toFixed(2),
      mq135_raw: 750,
      mq135_adc_mv: 580.0,
      mq135_sensor_mv: 966.7,
      air_quality_status: 'Normal / Cukup Baik',
      is_gas_polluted: false,
      rain_raw: 3850,
      rain_status: 'Kering',
      is_raining: false,
      water_distance_cm: 25.4,
      water_level_cm: 4.6,
      flood_status: 'Aman',
      is_flood_warning: false,
      wifi_rssi_dbm: -55,
    });
    publish(simTelemetryTopic, payload);
  };

  const handleSendDelayedTelemetry = () => {
    // Sends packet older than 60 seconds to verify delayed packet metric
    const payload = JSON.stringify({
      device_id: simDeviceId,
      sequence: (packetCount || 1) + 999,
      timestamp: Math.floor(Date.now() / 1000) - 120,
      uptime_s: (telemetry?.uptime_s || 380) + 10,
      temperature_c: +(27.8).toFixed(2),
      humidity_percent: +(69.0).toFixed(2),
      mq135_raw: 750,
      mq135_adc_mv: 580.0,
      mq135_sensor_mv: 966.7,
      air_quality_status: 'Normal / Cukup Baik',
      is_gas_polluted: false,
      rain_raw: 3850,
      rain_status: 'Kering',
      is_raining: false,
      water_distance_cm: 25.4,
      water_level_cm: 4.6,
      flood_status: 'Aman',
      is_flood_warning: false,
      wifi_rssi_dbm: -58,
    });
    publish(simTelemetryTopic, payload);
  };

  const handleScrollToParam = () => {
    lenisRef.current?.scrollTo('#analytics');
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', width: '100%' }}>
      {/* Accessible Skip Link (PRD Section 27) */}
      <a href="#matrix" className="skip-link">
        Lewati ke parameter telemetri
      </a>

      {/* Intro Curtain Loader (PRD Section 3.2 & 15.3) */}
      <IntroLoader onReady={() => setIsIntroReady(true)} />

      {/* Main Page Inset Shell */}
      <main className="page-shell">
        {/* Hero Section with nested SiteHeader */}
        <div style={{ position: 'relative' }}>
          <SiteHeader
            connectionState={connectionState}
            onOpenDiagnostic={() => setIsDiagnosticOpen(true)}
            isMenuOpen={isMenuOpen}
            onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
            onCloseMenu={() => setIsMenuOpen(false)}
          />
          <HeroSection
            telemetry={telemetry}
            formattedUptime={formattedUptime}
            isReady={isIntroReady}
            isHazard={isHazardMode}
          />
        </div>

        {/* Section 01: Geographic Horizon & Zone Carousel */}
        <ZoneTrustSection lastReceivedAt={lastReceivedAt} telemetry={telemetry} />

        {/* Section 02: Editorial Telemetry Matrix */}
        <TelemetryMatrixSection
          telemetry={telemetry}
          formattedUptime={formattedUptime}
          onSelectParam={handleScrollToParam}
        />

        {/* Section 03: 4-Channel Relay & Sector Lighting Monitoring and Control */}
        <SectorLightingControlSection
          telemetry={telemetry}
          relayStates={relayStates}
          onToggleRelay={handleToggleRelay}
          onToggleAllRelays={handleToggleAllRelays}
          targetDeviceId={activeDeviceId}
          isMqttConnected={connectionState === 'CONNECTED'}
        />

        {/* Section 04: Microclimate Facilities & SVG Waveform Analytics */}
        <FacilitiesAnalyticsSection
          history={history}
          telemetry={telemetry}
        />

        {/* Section 04: Big Stats Grid */}
        <StatsSection />

        {/* Section 05: Field Environmental Observations */}
        <FieldLogsSection />

        {/* Section 06: Editorial Footer */}
        <SiteFooter onOpenDiagnostic={() => setIsDiagnosticOpen(true)} />
      </main>

      {/* Telemetry Stream Diagnostics & Simulation Modal */}
      <TelemetryDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        connectionState={connectionState}
        selectedDeviceId={selectedDeviceId}
        discoveredDevices={discoveredDevices}
        onSelectDevice={handleSelectDevice}
        activeDeviceId={activeDeviceId}
        packetCount={packetCount}
        errorCount={errorCount}
        duplicateCount={duplicateCount}
        delayedCount={delayedCount}
        isStale={isStale}
        bufferLength={history.length}
        lastError={lastError}
        lastMessage={lastMessage}
        onSendSample={handleSendNormalTelemetry}
        onSendBurst={() => handleSimulateBurst(10)}
        onToggleStatus={() => handleToggleStatus(deviceStatus === 'online' ? 'offline' : 'online')}
        deviceStatus={deviceStatus}
        onSendCorrupt={handleSendCorruptTelemetry}
        onSendDuplicate={handleSendDuplicateTelemetry}
        onSendDelayed={handleSendDelayedTelemetry}
        onConnect={connect}
        onDisconnect={disconnect}
        onRetryNow={retryNow}
      />

      {/* Floating In-App Sensor Warning & Hazard Toast Notifications */}
      <AlertToastContainer alerts={activeAlerts} onDismiss={dismissAlert} />

      {/* Floating Mobile Telemetry Quick-Bar (appears on mobile when scrolled past Hero) */}
      {showMobileQuickBar && (
        <div
          className="mobile-telemetry-bar"
          onClick={() => setIsDiagnosticOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Buka Diagnostik Data Mentah"
          style={{ cursor: 'pointer' }}
        >
          <span
            className={connectionState === 'CONNECTED' ? 'pulse-indicator' : ''}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isHazardMode ? '#f43f5e' : 'var(--state-online)',
              boxShadow: isHazardMode ? '0 0 8px #f43f5e' : '0 0 8px var(--state-online)',
              display: 'inline-block',
            }}
          />
          <span style={{ color: 'var(--signal-temp)', fontWeight: 600 }}>
            {telemetry ? `${telemetry.temperature_c.toFixed(1)}°C` : '--°C'}
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
          <span style={{ color: 'var(--brand-light)', fontWeight: 600 }}>
            {telemetry ? `${telemetry.humidity_percent.toFixed(0)}%` : '--%'}
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
          <span style={{ color: '#ffffff', opacity: 0.85, fontSize: '0.72rem' }}>
            {telemetry ? `${telemetry.mq135_raw} ADC` : '----'}
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>|</span>
          <span style={{ color: 'var(--brand-light)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Data ↗
          </span>
        </div>
      )}
    </div>
  );
}
