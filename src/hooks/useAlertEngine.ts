import { useState, useEffect, useRef } from 'react';
import { type TelemetryData } from '../telemetry/types';

export interface AlertItem {
  id: string;
  type: 'temperature' | 'humidity' | 'gas' | 'stale' | 'rain' | 'flood';
  level: 'warning' | 'danger';
  title: string;
  message: string;
  metricValue: string;
  triggeredAt: number;
}

interface UseAlertEngineOptions {
  telemetry: TelemetryData | null;
  isStale: boolean;
  persistenceSeconds?: number; // Duration sensor must violate limit before triggering alert (default 6s)
}

export type ViolationInfo = {
  level: 'warning' | 'danger';
  title: string;
  message: string;
  metricValue: string;
  type: AlertItem['type'];
};

export function evaluateTelemetryViolations(
  telemetry: TelemetryData | null,
  isStale: boolean
): Record<string, ViolationInfo> {
  const violations: Record<string, ViolationInfo> = {};

  // 1. Check Temperature
  if (telemetry) {
    if (telemetry.temperature_c >= 36.5) {
      violations['temp_high'] = {
        type: 'temperature',
        level: telemetry.temperature_c >= 38.0 ? 'danger' : 'warning',
        title: 'Peringatan Termal Tinggi',
        message: `Suhu udara ruang terbuka Alun-Alun mencapai ${telemetry.temperature_c.toFixed(1)}°C, melampaui ambang batas kenyamanan termal publik.`,
        metricValue: `${telemetry.temperature_c.toFixed(1)}°C`,
      };
    } else if (telemetry.temperature_c <= 18.0) {
      violations['temp_low'] = {
        type: 'temperature',
        level: 'warning',
        title: 'Suhu Tidak Wajar Rendah',
        message: `Suhu terdeteksi turun ke ${telemetry.temperature_c.toFixed(1)}°C.`,
        metricValue: `${telemetry.temperature_c.toFixed(1)}°C`,
      };
    }

    // 2. Check Humidity
    if (telemetry.humidity_percent >= 88.0) {
      violations['humid_high'] = {
        type: 'humidity',
        level: 'warning',
        title: 'Kelembaban Sangat Tinggi',
        message: `Kelembaban relatif mencapai ${telemetry.humidity_percent.toFixed(1)}%, potensi kabut laut pekat atau presipitasi udara Pantura.`,
        metricValue: `${telemetry.humidity_percent.toFixed(1)}%`,
      };
    }

    // 3. Check MQ135 Gas / Smoke
    if (telemetry.mq135_raw >= 3400) {
      violations['gas_high'] = {
        type: 'gas',
        level: telemetry.mq135_raw >= 3950 ? 'danger' : 'warning',
        title: 'Akumulasi Gas / Asap Terdeteksi',
        message: `Pembacaan analog MQ135 mencapai ${telemetry.mq135_raw} ADC (${telemetry.mq135_sensor_mv.toFixed(0)} mV), menunjukkan konsentrasi emisi atau asap tinggi di area stasiun.`,
        metricValue: `${telemetry.mq135_raw} ADC`,
      };
    }

    // 4. Check Rain Sensor (Pin 8)
    if (telemetry.is_raining || (telemetry.rain_raw !== undefined && telemetry.rain_raw <= 3500)) {
      const isHeavy = telemetry.rain_raw !== undefined && telemetry.rain_raw <= 1500;
      const isModerate = telemetry.rain_raw !== undefined && telemetry.rain_raw <= 2500;
      violations['rain_alert'] = {
        type: 'rain',
        level: isHeavy ? 'danger' : 'warning',
        title: isHeavy ? 'Presipitasi Hujan Lebat' : isModerate ? 'Hujan Sedang Terdeteksi' : 'Gerimis Terdeteksi',
        message: `Sensor hujan (Pin 8) mendeteksi presipitasi (${telemetry.rain_status || 'Hujan'}, ${telemetry.rain_raw ?? '--'} ADC). Waspada permukaan rumput sintetis dan trotoar Alun-Alun menjadi licin.`,
        metricValue: telemetry.rain_status ?? (telemetry.rain_raw ? `${telemetry.rain_raw} ADC` : 'HUJAN'),
      };
    }

    // 5. Check Ultrasonic Flood Sensor (Trig Pin 13, Echo Pin 12)
    if (
      telemetry.is_flood_warning ||
      (telemetry.water_distance_cm !== undefined && telemetry.water_distance_cm <= 12.0) ||
      (telemetry.water_level_cm !== undefined && telemetry.water_level_cm >= 18.0) ||
      (telemetry.water_level_raw !== undefined && telemetry.water_level_raw >= 1500) ||
      telemetry.flood_status === 'Siaga' ||
      telemetry.flood_status === 'Bahaya Banjir'
    ) {
      const isCritical =
        (telemetry.water_distance_cm !== undefined && telemetry.water_distance_cm <= 6.0) ||
        (telemetry.water_level_cm !== undefined && telemetry.water_level_cm >= 24.0) ||
        (telemetry.water_level_raw !== undefined && telemetry.water_level_raw >= 3300) ||
        telemetry.flood_status === 'Bahaya Banjir';
      const isSiaga =
        (telemetry.water_distance_cm !== undefined && telemetry.water_distance_cm <= 12.0) ||
        (telemetry.water_level_cm !== undefined && telemetry.water_level_cm >= 18.0) ||
        (telemetry.water_level_raw !== undefined && telemetry.water_level_raw >= 2600) ||
        telemetry.flood_status === 'Siaga';

      const distText = telemetry.water_distance_cm !== undefined ? `Jarak pantul: ${telemetry.water_distance_cm.toFixed(1)} cm` : '';
      const levelText = telemetry.water_level_cm !== undefined ? `Tinggi muka air: ${telemetry.water_level_cm.toFixed(1)} cm` : '';
      const detailText = [distText, levelText].filter(Boolean).join(' · ');

      violations['flood_alert'] = {
        type: 'flood',
        level: isCritical ? 'danger' : isSiaga ? 'danger' : 'warning',
        title: isCritical
          ? 'Bahaya Banjir: Muka Air Sungai Meluap!'
          : isSiaga
          ? 'Siaga Banjir: Aliran Sungai Alun-Alun Kritis'
          : 'Waspada: Peningkatan Debit Air Sungai',
        message: `Sensor ultrasonik (Pin 13 & 12) mendeteksi kenaikan air sungai (${detailText || `${telemetry.water_level_raw ?? '--'} ADC`}). Waspada potensi luapan saluran drainase Alun-Alun.`,
        metricValue: telemetry.flood_status ?? (telemetry.water_level_cm !== undefined ? `${telemetry.water_level_cm.toFixed(1)} cm` : 'BANJIR'),
      };
    }
  }

  // 4. Check Stale Telemetry (>15s watchdog)
  if (isStale) {
    violations['stale_node'] = {
      type: 'stale',
      level: 'warning',
      title: 'Transmisi Node Terhenti',
      message: 'Tidak ada paket telemetri baru dari ESP32-S3 selama lebih dari 15 detik.',
      metricValue: 'STALE',
    };
  }

  return violations;
}

export function useAlertEngine({
  telemetry,
  isStale,
  persistenceSeconds = 6,
}: UseAlertEngineOptions) {
  const [activeAlerts, setActiveAlerts] = useState<AlertItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Timers to track duration of abnormal conditions
  const conditionStartTimes = useRef<Record<string, number>>({});

  useEffect(() => {
    const evaluate = () => {
      const now = Date.now();
      const persistenceMs = persistenceSeconds * 1000;
      const currentViolations = evaluateTelemetryViolations(telemetry, isStale);

      // Clean up recovered conditions
      for (const key of Object.keys(conditionStartTimes.current)) {
        if (!currentViolations[key]) {
          delete conditionStartTimes.current[key];
        }
      }

      // Evaluate persistence accumulator
      const newAlerts: AlertItem[] = [];
      for (const [key, violation] of Object.entries(currentViolations)) {
        if (!conditionStartTimes.current[key]) {
          conditionStartTimes.current[key] = now;
        }

        const elapsed = now - conditionStartTimes.current[key];
        if (elapsed >= persistenceMs) {
          newAlerts.push({
            id: key,
            type: violation.type,
            level: violation.level,
            title: violation.title,
            message: violation.message,
            metricValue: violation.metricValue,
            triggeredAt: conditionStartTimes.current[key],
          });
        }
      }

      setActiveAlerts((prev) => {
        if (
          prev.length === newAlerts.length &&
          prev.every(
            (p, i) =>
              p.id === newAlerts[i]?.id &&
              p.level === newAlerts[i]?.level &&
              p.metricValue === newAlerts[i]?.metricValue
          )
        ) {
          return prev;
        }
        return newAlerts;
      });
    };

    evaluate();
    const timer = setInterval(evaluate, 1000);
    return () => clearInterval(timer);
  }, [telemetry, isStale, persistenceSeconds]);

  const dismissAlert = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  // Filter out alerts manually dismissed by user
  const visibleAlerts = activeAlerts.filter((a) => !dismissedIds.has(a.id));
  const isHazardMode = activeAlerts.length > 0;
  const highestLevel: 'normal' | 'warning' | 'danger' = activeAlerts.some((a) => a.level === 'danger')
    ? 'danger'
    : isHazardMode
    ? 'warning'
    : 'normal';

  return {
    activeAlerts: visibleAlerts,
    allActiveAlerts: activeAlerts,
    isHazardMode,
    highestLevel,
    dismissAlert,
  };
}
