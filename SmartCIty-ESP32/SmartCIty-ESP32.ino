#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <time.h>
#include <ESP32Servo.h>

// ============================================================
// SENSOR CONFIGURATION
// ============================================================

#define DHT_PIN 6
#define DHT_TYPE DHT22

#define MQ135_PIN 7
#define RAIN_PIN 8
#define TRIG_PIN 13
#define ECHO_PIN 12
const float MAX_RIVER_DEPTH_CM = 30.0f;

// ============================================================
// LDR LIGHT SENSOR CONFIGURATION (AUTO LIGHTING)
// GPIO 9 (ADC1 Channel 8 pada ESP32-S3)
// 2 Kondisi Ambien:
// < 3000 : Terang / Mati (banyak cahaya terbaca sensor)
// > 3000 : Menyala / Gelap (sedikit cahaya terbaca sensor)
// ============================================================
#define LDR_PIN 9
const uint16_t LDR_THRESHOLD = 3000;

// ============================================================
// SMART PARKING SYSTEM CONFIGURATION (10 SLOTS)
// IR Sensors: Active LOW (LOW saat mendeteksi mobil, HIGH saat kosong)
// Servos: 0 deg = Palang Tutup (Closed), 90 deg = Palang Buka (Open)
// ============================================================
#define IR_ENTRY_PIN 1
#define IR_EXIT_PIN 2
#define SERVO_ENTRY_PIN 21
#define SERVO_EXIT_PIN 47

const int SERVO_CLOSED_ANGLE = 0;
const int SERVO_OPEN_ANGLE = 90;
const unsigned long GATE_PASS_TIMEOUT_MS = 1500; // Waktu jeda aman mobil lewat sebelum palang turun

// ============================================================
// 4-CHANNEL RELAY ACTUATOR CONFIGURATION (SECTOR LIGHTING)
// IN1 -> GPIO 38 (Sektor 01: Kawasan Alun-Alun & Monumen Bahari)
// IN2 -> GPIO 39 (Sektor 02: Koridor Jl. KH Wahid Hasyim)
// IN3 -> GPIO 40 (Sektor 03: RTH & Jalur Sepeda Bahari)
// IN4 -> GPIO 41 (Sektor 04: Saluran Drainase & Tanggul Pesisir)
// ============================================================

#define RELAY1_PIN 38
#define RELAY2_PIN 39
#define RELAY3_PIN 40
#define RELAY4_PIN 41

// Konfigurasi level logika relay untuk LED:
// Berdasarkan pengujian hardware, LED menyala pada level HIGH dan padam pada level LOW:
// HIGH = Relay ON (Kontak terhubung, LED menyala)
// LOW  = Relay OFF (Kontak terbuka, LED padam)
#define RELAY_ACTIVE_LEVEL   HIGH
#define RELAY_INACTIVE_LEVEL LOW

// ============================================================
// WIFI CONFIGURATION
// ============================================================

const char* WIFI_SSID = "Doktor Tije Digital";
const char* WIFI_PASSWORD = "doktortj2025";

// ============================================================
// HIVEMQ PUBLIC BROKER
// ============================================================

const char* MQTT_HOST = "broker.hivemq.com";
const uint16_t MQTT_PORT = 1883;

// Public broker:
// no username/password
//
// WARNING:
// This broker is shared publicly.
// Do not publish sensitive information.

// ============================================================
// DEVICE
// ============================================================

String deviceId;
String topicRoot;
String telemetryTopic;
String statusTopic;
String commandTopic;

// ============================================================
// NTP
// WIB = UTC+7
// ============================================================

const long GMT_OFFSET_SEC = 7 * 60 * 60;
const int DAYLIGHT_OFFSET_SEC = 0;

// ============================================================
// PUBLISH INTERVAL
// ============================================================

const unsigned long SENSOR_INTERVAL_MS = 5000;

// ============================================================
// RECONNECT INTERVALS
// ============================================================

const unsigned long WIFI_RETRY_INTERVAL_MS = 10000;
const unsigned long MQTT_RETRY_INTERVAL_MS = 5000;

// ============================================================
// MQ135 VOLTAGE DIVIDER
//
// MQ135 AO
//   |
//  10k
//   |
//   +------ GPIO7
//   |
//  15k
//   |
//  GND
//
// Vgpio = Vin * R2 / (R1 + R2)
// ============================================================

const float MQ135_R1 = 10000.0f;
const float MQ135_R2 = 15000.0f;

// ============================================================
// GLOBAL OBJECTS
// ============================================================

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
DHT dht(DHT_PIN, DHT_TYPE);
Servo servoEntry;
Servo servoExit;

// Forward declaration
void publishTelemetry();
void readLDR();
void handleParkingSystem();

// ============================================================
// STATE
// ============================================================

unsigned long lastSensorPublish = 0;
unsigned long lastWiFiAttempt = 0;
unsigned long lastMQTTAttempt = 0;

unsigned long sampleSequence = 0;

// ============================================================
// SENSOR VALUES
// ============================================================

float temperatureC = 28.5f;
float humidityPercent = 65.0f;

uint16_t mq135Raw = 0;
uint32_t mq135AdcMv = 0;
float mq135SensorMv = 0.0f;
String airQualityStatus = "Normal / Cukup Baik";
bool isGasPolluted = false;

uint16_t rainRaw = 4095;
bool isRaining = false;
String rainStatus = "Kering";

float waterDistanceCm = 30.0f;
float waterLevelCm = 0.0f;
String floodStatus = "Aman";
bool isFloodWarning = false;

// LDR Ambient Light Variables (2 Kondisi: < 3000 Mati / Terang, > 3000 Menyala / Gelap)
uint16_t ldrRaw = 1200;
String ambientLight = "Terang";
bool isDark = false;

// Smart Parking System Variables (10 Slots Kapasitas)
const int TOTAL_PARKING_SLOTS = 10;
int occupiedParkingSlots = 0;
int availableParkingSlots = 10;
bool isParkingFull = false;

bool isIrEntryDetected = false;
bool isIrExitDetected = false;
bool isEntryGateOpen = false;
bool isExitGateOpen = false;

enum ParkingGateState {
    PARK_IDLE,
    PARK_WAIT_PASS,
    PARK_CLOSING
};

ParkingGateState entryGateState = PARK_IDLE;
ParkingGateState exitGateState = PARK_IDLE;

unsigned long entryClearTime = 0;
unsigned long exitClearTime = 0;

// Lighting Control Mode: "auto" (Sensor LDR) atau "manual" (Web Dashboard)
String lightingMode = "auto";

// 4-Channel Relay States (true = ON / Terhubung, false = OFF / Terbuka)
bool relay1State = false;
bool relay2State = false;
bool relay3State = false;
bool relay4State = false;

// ============================================================
// CREATE UNIQUE DEVICE ID
// ============================================================

String createDeviceId() {
    uint64_t chipId = ESP.getEfuseMac();

    char idBuffer[32];

    snprintf(
        idBuffer,
        sizeof(idBuffer),
        "esp32s3-%04X%08X",
        (uint16_t)(chipId >> 32),
        (uint32_t)chipId
    );

    return String(idBuffer);
}

// ============================================================
// CREATE MQTT TOPICS
// ============================================================

void createMQTTTopics() {

    deviceId = createDeviceId();

    /*
       Example:

       deviceId:
       esp32s3-ABCD12345678

       topicRoot:
       aethersense/esp32s3-ABCD12345678
    */

    topicRoot =
        String("aethersense/") +
        deviceId;

    telemetryTopic =
        topicRoot +
        "/telemetry";

    statusTopic =
        topicRoot +
        "/status";

    commandTopic =
        topicRoot +
        "/command";
}

// ============================================================
// RELAY CONTROL HELPERS
// ============================================================

void applyRelayState(int relayNum, bool state) {
    uint8_t pin;
    switch (relayNum) {
        case 1: pin = RELAY1_PIN; relay1State = state; break;
        case 2: pin = RELAY2_PIN; relay2State = state; break;
        case 3: pin = RELAY3_PIN; relay3State = state; break;
        case 4: pin = RELAY4_PIN; relay4State = state; break;
        default: return;
    }
    digitalWrite(pin, state ? RELAY_ACTIVE_LEVEL : RELAY_INACTIVE_LEVEL);
    Serial.print("[RELAY] Sektor ");
    Serial.print(relayNum);
    Serial.print(" (IN");
    Serial.print(relayNum);
    Serial.print(" / GPIO ");
    Serial.print(pin);
    Serial.print(") -> ");
    Serial.println(state ? "ON (MENYALA)" : "OFF (PADAM)");
}

void setAllRelays(bool state) {
    for (int i = 1; i <= 4; i++) {
        applyRelayState(i, state);
    }
}

// ============================================================
// MQTT INCOMING COMMAND CALLBACK (ACTUATOR DISPATCHER)
// ============================================================

void handleMqttMessage(char* topic, byte* payload, unsigned int length) {
    char message[length + 1];
    memcpy(message, payload, length);
    message[length] = '\0';

    Serial.println();
    Serial.println("==================================");
    Serial.print("[MQTT CMD] Received on topic: ");
    Serial.println(topic);
    Serial.print("[MQTT CMD] Payload: ");
    Serial.println(message);
    Serial.println("==================================");

    String strMsg = String(message);
    strMsg.trim();

    // Smart Parking Slot Reset Command: {"type": "parking_reset", "occupied": 0} or PARKING_RESET
    if (strMsg.indexOf("\"parking_reset\"") >= 0 ||
        strMsg.indexOf("parking_reset") >= 0 ||
        strMsg.equalsIgnoreCase("PARKING_RESET") ||
        strMsg.equalsIgnoreCase("RESET_PARKING")) {
        occupiedParkingSlots = 0;
        availableParkingSlots = TOTAL_PARKING_SLOTS;
        isParkingFull = false;
        Serial.println("[PARKING] Perintah RESET SLOT diterima. Kuota parkir kembali 10/10 kosong.");
    }
    // 0. Lighting Mode Control: {"type": "lighting_mode", "mode": "auto" | "manual"} or {"action": "set_mode", "mode": ...}
    else if (strMsg.indexOf("\"lighting_mode\"") >= 0 || strMsg.indexOf("\"mode\"") >= 0) {
        if (strMsg.indexOf("\"auto\"") >= 0 || strMsg.indexOf("\"AUTO\"") >= 0) {
            lightingMode = "auto";
            Serial.println("[MODE] Beralih ke Mode OTOMATIS (Sensor LDR aktif)");
            readLDR();
        } else if (strMsg.indexOf("\"manual\"") >= 0 || strMsg.indexOf("\"MANUAL\"") >= 0) {
            lightingMode = "manual";
            Serial.println("[MODE] Beralih ke Mode MANUAL (Web Operator aktif, sensor LDR di-bypass)");
        }
    }
    // 1. JSON format: {"relay": 1, "state": true} or {"relay": "all", "state": false}
    else if (strMsg.indexOf("\"relay\"") >= 0 || strMsg.indexOf("\"sector\"") >= 0) {
        // Auto-switch to manual mode when a manual relay command is received so LDR doesn't revert it
        if (lightingMode.equalsIgnoreCase("auto")) {
            lightingMode = "manual";
            Serial.println("[MODE] Beralih otomatis ke MANUAL karena menerima kontrol tombol relay manual");
        }

        bool targetState = (strMsg.indexOf("\"state\":true") >= 0 ||
                            strMsg.indexOf("\"state\": true") >= 0 ||
                            strMsg.indexOf("\"state\":\"ON\"") >= 0 ||
                            strMsg.indexOf("\"state\": \"ON\"") >= 0 ||
                            strMsg.indexOf("\"action\":\"ON\"") >= 0);

        if (strMsg.indexOf("\"relay\":1") >= 0 || strMsg.indexOf("\"relay\": 1") >= 0 ||
            strMsg.indexOf("\"sector\":1") >= 0 || strMsg.indexOf("\"sector\": 1") >= 0) {
            applyRelayState(1, targetState);
        } else if (strMsg.indexOf("\"relay\":2") >= 0 || strMsg.indexOf("\"relay\": 2") >= 0 ||
                   strMsg.indexOf("\"sector\":2") >= 0 || strMsg.indexOf("\"sector\": 2") >= 0) {
            applyRelayState(2, targetState);
        } else if (strMsg.indexOf("\"relay\":3") >= 0 || strMsg.indexOf("\"relay\": 3") >= 0 ||
                   strMsg.indexOf("\"sector\":3") >= 0 || strMsg.indexOf("\"sector\": 3") >= 0) {
            applyRelayState(3, targetState);
        } else if (strMsg.indexOf("\"relay\":4") >= 0 || strMsg.indexOf("\"relay\": 4") >= 0 ||
                   strMsg.indexOf("\"sector\":4") >= 0 || strMsg.indexOf("\"sector\": 4") >= 0) {
            applyRelayState(4, targetState);
        } else if (strMsg.indexOf("\"relay\":\"all\"") >= 0 || strMsg.indexOf("\"relay\": \"all\"") >= 0) {
            setAllRelays(targetState);
        }
    } else if (strMsg.indexOf("\"type\":\"relay_all\"") >= 0 || strMsg.indexOf("\"type\": \"relay_all\"") >= 0) {
        if (lightingMode.equalsIgnoreCase("auto")) {
            lightingMode = "manual";
            Serial.println("[MODE] Beralih otomatis ke MANUAL karena kontrol relay master");
        }
        bool targetState = (strMsg.indexOf("\"state\":true") >= 0 || strMsg.indexOf("\"state\": true") >= 0);
        setAllRelays(targetState);
    }
    // 2. Direct string commands fallback (e.g. Serial or simple CLI)
    else if (strMsg.equalsIgnoreCase("MODE_AUTO") || strMsg.equalsIgnoreCase("AUTO")) {
        lightingMode = "auto";
        Serial.println("[MODE] Beralih ke Mode OTOMATIS (Sensor LDR aktif)");
        readLDR();
    } else if (strMsg.equalsIgnoreCase("MODE_MANUAL") || strMsg.equalsIgnoreCase("MANUAL")) {
        lightingMode = "manual";
        Serial.println("[MODE] Beralih ke Mode MANUAL (Web Operator aktif)");
    } else if (strMsg.equalsIgnoreCase("ALL_ON") || strMsg.equalsIgnoreCase("ON")) {
        lightingMode = "manual";
        setAllRelays(true);
    } else if (strMsg.equalsIgnoreCase("ALL_OFF") || strMsg.equalsIgnoreCase("OFF")) {
        lightingMode = "manual";
        setAllRelays(false);
    } else if (strMsg.equalsIgnoreCase("RELAY1_ON") || strMsg.equalsIgnoreCase("SEKTOR1_ON")) {
        lightingMode = "manual";
        applyRelayState(1, true);
    } else if (strMsg.equalsIgnoreCase("RELAY1_OFF") || strMsg.equalsIgnoreCase("SEKTOR1_OFF")) {
        lightingMode = "manual";
        applyRelayState(1, false);
    } else if (strMsg.equalsIgnoreCase("RELAY2_ON") || strMsg.equalsIgnoreCase("SEKTOR2_ON")) {
        lightingMode = "manual";
        applyRelayState(2, true);
    } else if (strMsg.equalsIgnoreCase("RELAY2_OFF") || strMsg.equalsIgnoreCase("SEKTOR2_OFF")) {
        lightingMode = "manual";
        applyRelayState(2, false);
    } else if (strMsg.equalsIgnoreCase("RELAY3_ON") || strMsg.equalsIgnoreCase("SEKTOR3_ON")) {
        lightingMode = "manual";
        applyRelayState(3, true);
    } else if (strMsg.equalsIgnoreCase("RELAY3_OFF") || strMsg.equalsIgnoreCase("SEKTOR3_OFF")) {
        lightingMode = "manual";
        applyRelayState(3, false);
    } else if (strMsg.equalsIgnoreCase("RELAY4_ON") || strMsg.equalsIgnoreCase("SEKTOR4_ON")) {
        lightingMode = "manual";
        applyRelayState(4, true);
    } else if (strMsg.equalsIgnoreCase("RELAY4_OFF") || strMsg.equalsIgnoreCase("SEKTOR4_OFF")) {
        lightingMode = "manual";
        applyRelayState(4, false);
    }

    // Immediately publish updated telemetry so web dashboard updates with zero delay
    publishTelemetry();
}

// ============================================================
// WIFI
// ============================================================

void startWiFi() {

    WiFi.mode(WIFI_STA);

    WiFi.begin(
        WIFI_SSID,
        WIFI_PASSWORD
    );

    Serial.println();
    Serial.print("Connecting WiFi: ");
    Serial.println(WIFI_SSID);
}

void maintainWiFi() {

    if (WiFi.status() == WL_CONNECTED) {
        return;
    }

    unsigned long now = millis();

    if (
        now - lastWiFiAttempt <
        WIFI_RETRY_INTERVAL_MS
    ) {
        return;
    }

    lastWiFiAttempt = now;

    Serial.println("Retrying WiFi...");

    WiFi.disconnect();
    WiFi.begin(
        WIFI_SSID,
        WIFI_PASSWORD
    );
}

// ============================================================
// MQTT CONNECT
// ============================================================

void connectMQTT() {

    if (WiFi.status() != WL_CONNECTED) {
        return;
    }

    if (mqttClient.connected()) {
        return;
    }

    unsigned long now = millis();

    if (
        now - lastMQTTAttempt <
        MQTT_RETRY_INTERVAL_MS
    ) {
        return;
    }

    lastMQTTAttempt = now;

    /*
       MQTT Client ID must be unique.
       This is especially important on a shared broker.
    */

    Serial.println();
    Serial.println("==================================");
    Serial.println("Connecting to HiveMQ...");
    Serial.print("Host: ");
    Serial.println(MQTT_HOST);

    Serial.print("Client ID: ");
    Serial.println(deviceId);

    // 1. Resolve DNS or use fallback IPv4
    IPAddress brokerIp;
    bool resolved = WiFi.hostByName(MQTT_HOST, brokerIp);

    if (!resolved || brokerIp == IPAddress(0, 0, 0, 0)) {
        Serial.println("[DNS] Gagal resolve hostname broker.hivemq.com!");
        Serial.println("[DNS] Menggunakan fallback IP HiveMQ: 18.185.214.85");
        brokerIp = IPAddress(18, 185, 214, 85);
    } else {
        Serial.print("[DNS] Ter-resolve ke IP: ");
        Serial.println(brokerIp);
    }

    // Set server directly by IP address to bypass socket DNS lookup failures
    mqttClient.setServer(brokerIp, MQTT_PORT);

    bool connected = mqttClient.connect(
        deviceId.c_str(),

        // Last Will topic
        statusTopic.c_str(),

        // QoS
        0,

        // Retain
        true,

        // Will payload
        "offline"
    );

    if (connected) {

        Serial.println("MQTT connected successfully.");

        // Publish online state
        mqttClient.publish(
            statusTopic.c_str(),
            "online",
            true
        );

        Serial.print("Telemetry topic: ");
        Serial.println(telemetryTopic);

        Serial.print("Status topic: ");
        Serial.println(statusTopic);

        // Subscribe to Actuator / Relay Command Topics
        mqttClient.subscribe(commandTopic.c_str());
        mqttClient.subscribe("aethersense/command");

        Serial.print("Command topic: ");
        Serial.println(commandTopic);

    } else {

        int errState = mqttClient.state();
        Serial.print(
            "MQTT connection failed. State: "
        );
        Serial.println(errState);

        if (errState == -2) {
            Serial.println("----------------------------------");
            Serial.println("CATATAN DIAGNOSA (State -2):");
            Serial.println("1. Handshake TCP ke Port 1883 gagal.");
            Serial.println("2. Sering terjadi karena provider seluler / hotspot memblokir Port 1883.");
            Serial.println("3. Solusi: Coba ganti koneksi hotspot ke HP/provider lain atau Wi-Fi rumah.");
            Serial.println("----------------------------------");
        }
    }
}

// ============================================================
// READ MQ135
// ============================================================

void readMQ135() {

    const int samples = 10;

    uint32_t rawSum = 0;
    uint32_t mvSum = 0;

    for (int i = 0; i < samples; i++) {

        rawSum += analogRead(MQ135_PIN);

        mvSum +=
            analogReadMilliVolts(
                MQ135_PIN
            );

        delayMicroseconds(500);
    }

    mq135Raw =
        rawSum / samples;

    mq135AdcMv =
        mvSum / samples;

    /*
       Recover voltage before voltage divider.

       Vsensor =
       Vgpio * (R1 + R2) / R2
    */

    mq135SensorMv =
        mq135AdcMv *
        ((MQ135_R1 + MQ135_R2) /
         MQ135_R2);

    // Human-readable Air Quality & Gas Pollution Classification
    // Sangat Bersih: < 350
    // Normal / Cukup Baik: < 1500
    // Polusi Ringan: < 3000 (<= 3000)
    // Tercemar: > 3000
    if (mq135Raw < 350) {
        airQualityStatus = "Sangat Bersih";
        isGasPolluted = false;
    } else if (mq135Raw < 1500) {
        airQualityStatus = "Normal / Cukup Baik";
        isGasPolluted = false;
    } else if (mq135Raw <= 3000) {
        airQualityStatus = "Polusi Ringan";
        isGasPolluted = false;
    } else {
        airQualityStatus = "Tercemar";
        isGasPolluted = true;
    }
}

// ============================================================
// READ RAIN SENSOR (Pin 8 / ADC1)
// ============================================================

void readRainSensor() {
    const int samples = 10;
    uint32_t rawSum = 0;

    for (int i = 0; i < samples; i++) {
        rawSum += analogRead(RAIN_PIN);
        delayMicroseconds(500);
    }

    rainRaw = rawSum / samples;

    // LM393 Rain plate: Lower ADC = wetter surface
    if (rainRaw > 3500) {
        rainStatus = "Kering";
        isRaining = false;
    } else if (rainRaw > 2500) {
        rainStatus = "Gerimis";
        isRaining = true;
    } else if (rainRaw > 1500) {
        rainStatus = "Hujan Sedang";
        isRaining = true;
    } else {
        rainStatus = "Hujan Lebat";
        isRaining = true;
    }
}

// ============================================================
// READ ULTRASONIC SENSOR (Trig Pin 13, Echo Pin 12 - Flood Detection)
// Max range: 30.0 cm (smaller distance to water = higher flood level)
// ============================================================

void readUltrasonicSensor() {
    // 1. Trigger ultrasonic burst (10µs pulse)
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    // 2. Measure pulse duration on Echo pin (timeout 25000µs ~ 4.3 meters)
    long duration = pulseIn(ECHO_PIN, HIGH, 25000);

    // Speed of sound: 0.0343 cm/µs; distance = (duration * 0.0343) / 2
    float rawDistance = (duration == 0) ? MAX_RIVER_DEPTH_CM : ((float)duration * 0.0343f) / 2.0f;

    // Filter and clamp within max 30.0 cm
    if (rawDistance > MAX_RIVER_DEPTH_CM || rawDistance <= 0.0f) {
        waterDistanceCm = MAX_RIVER_DEPTH_CM;
    } else {
        waterDistanceCm = rawDistance;
    }

    // Inverted logic: Smaller distance to sensor = higher flood water level
    // waterLevelCm = 30.0 - waterDistanceCm
    waterLevelCm = MAX_RIVER_DEPTH_CM - waterDistanceCm;
    if (waterLevelCm < 0.0f) waterLevelCm = 0.0f;

    // River flood thresholds based on ultrasonic distance to water:
    // Distance > 20 cm (Flood Height < 10 cm): Aman (debit normal / surut)
    // Distance 12 - 20 cm (Flood Height 10 - 18 cm): Waspada (muka air naik)
    // Distance 6 - 12 cm (Flood Height 18 - 24 cm): Siaga (kritis mendekati bibir saluran)
    // Distance <= 6 cm (Flood Height >= 24 cm): Bahaya Banjir (meluap)
    if (waterDistanceCm > 20.0f) {
        floodStatus = "Aman";
        isFloodWarning = false;
    } else if (waterDistanceCm > 12.0f) {
        floodStatus = "Waspada";
        isFloodWarning = false;
    } else if (waterDistanceCm > 6.0f) {
        floodStatus = "Siaga";
        isFloodWarning = true;
    } else {
        floodStatus = "Bahaya Banjir";
        isFloodWarning = true;
    }
}

// ============================================================
// READ LDR LIGHT SENSOR (GPIO 9 / ADC1)
// ============================================================

void readLDR() {
    const int samples = 10;
    uint32_t rawSum = 0;

    for (int i = 0; i < samples; i++) {
        rawSum += analogRead(LDR_PIN);
        delayMicroseconds(500);
    }

    ldrRaw = rawSum / samples;

    // Evaluasi 2 kondisi ambien:
    // < 3000 : Terang / Mati (banyak cahaya terbaca sensor)
    // > 3000 : Menyala / Gelap (sedikit cahaya terbaca sensor)
    if (ldrRaw > LDR_THRESHOLD) {
        isDark = true;
        ambientLight = "Gelap";
    } else {
        isDark = false;
        ambientLight = "Terang";
    }

    // Jika Mode OTOMATIS aktif, kendalikan relay berdasarkan kondisi LDR
    if (lightingMode.equalsIgnoreCase("auto")) {
        if (isDark) {
            // Ambien Gelap (>3000 ADC) -> Sedikit cahaya terbaca sensor -> Menyalakan semua sektor penerangan
            if (!relay1State || !relay2State || !relay3State || !relay4State) {
                Serial.println("[AUTO LDR] Ambien Gelap (>3000 ADC) -> Menyalakan semua sektor penerangan (LED ON)");
                setAllRelays(true);
            }
        } else {
            // Ambien Terang (<3000 ADC) -> Banyak cahaya terbaca sensor -> Memadamkan semua sektor penerangan
            if (relay1State || relay2State || relay3State || relay4State) {
                Serial.println("[AUTO LDR] Ambien Terang (<3000 ADC) -> Memadamkan semua sektor penerangan (LED OFF)");
                setAllRelays(false);
            }
        }
    }
// ============================================================
// SMART PARKING SYSTEM ENGINE (2x IR + 2x SERVO + 10 SLOTS)
// Non-blocking state machine dengan edge detection & anti-flapping
// ============================================================

void handleParkingSystem() {
    // Sensor IR: Active LOW (LOW = Terdeteksi mobil, HIGH = Bebas)
    bool irEntryRaw = (digitalRead(IR_ENTRY_PIN) == LOW);
    bool irExitRaw = (digitalRead(IR_EXIT_PIN) == LOW);

    isIrEntryDetected = irEntryRaw;
    isIrExitDetected = irExitRaw;

    unsigned long now = millis();
    bool stateChanged = false;

    // --------------------------------------------------------
    // PINTU MASUK (ENTRY GATE)
    // --------------------------------------------------------
    switch (entryGateState) {
        case PARK_IDLE:
            if (irEntryRaw) {
                if (occupiedParkingSlots < TOTAL_PARKING_SLOTS) {
                    servoEntry.write(SERVO_OPEN_ANGLE);
                    isEntryGateOpen = true;
                    entryGateState = PARK_WAIT_PASS;
                    Serial.println("[PARKING] Mobil mendekati Pintu Masuk -> Palang DIBUKA (90°)");
                    stateChanged = true;
                } else {
                    // Parkir Penuh -> Palang TETAP TUTUP (0°)
                    if (isEntryGateOpen) {
                        servoEntry.write(SERVO_CLOSED_ANGLE);
                        isEntryGateOpen = false;
                        stateChanged = true;
                    }
                    Serial.println("[PARKING] Peringatan: Mobil di Pintu Masuk tetapi PARKIR SUDAH PENUH (10/10)!");
                }
            }
            break;

        case PARK_WAIT_PASS:
            // Kendaraan sedang melintas palang. Tunggu sensor IR kembali HIGH (badan mobil selesai lewat)
            if (!irEntryRaw) {
                entryClearTime = now;
                entryGateState = PARK_CLOSING;
            }
            break;

        case PARK_CLOSING:
            // Jika mobil terhalang lagi sebelum palang turun, batalkan penutupan
            if (irEntryRaw) {
                entryGateState = PARK_WAIT_PASS;
            } else if (now - entryClearTime >= GATE_PASS_TIMEOUT_MS) {
                // Turunkan palang masuk
                servoEntry.write(SERVO_CLOSED_ANGLE);
                isEntryGateOpen = false;
                entryGateState = PARK_IDLE;

                if (occupiedParkingSlots < TOTAL_PARKING_SLOTS) {
                    occupiedParkingSlots++;
                }
                availableParkingSlots = TOTAL_PARKING_SLOTS - occupiedParkingSlots;
                isParkingFull = (occupiedParkingSlots >= TOTAL_PARKING_SLOTS);

                Serial.print("[PARKING] Mobil masuk selesai -> Slot Terisi: ");
                Serial.print(occupiedParkingSlots);
                Serial.print("/");
                Serial.println(TOTAL_PARKING_SLOTS);
                stateChanged = true;
            }
            break;

        default:
            entryGateState = PARK_IDLE;
            break;
    }

    // --------------------------------------------------------
    // PINTU KELUAR (EXIT GATE)
    // --------------------------------------------------------
    switch (exitGateState) {
        case PARK_IDLE:
            if (irExitRaw) {
                // Buka palang keluar
                servoExit.write(SERVO_OPEN_ANGLE);
                isExitGateOpen = true;
                exitGateState = PARK_WAIT_PASS;
                Serial.println("[PARKING] Mobil mendekati Pintu Keluar -> Palang DIBUKA (90°)");
                stateChanged = true;
            }
            break;

        case PARK_WAIT_PASS:
            // Kendaraan sedang melintas keluar. Tunggu sensor IR kembali HIGH
            if (!irExitRaw) {
                exitClearTime = now;
                exitGateState = PARK_CLOSING;
            }
            break;

        case PARK_CLOSING:
            if (irExitRaw) {
                exitGateState = PARK_WAIT_PASS;
            } else if (now - exitClearTime >= GATE_PASS_TIMEOUT_MS) {
                // Turunkan palang keluar
                servoExit.write(SERVO_CLOSED_ANGLE);
                isExitGateOpen = false;
                exitGateState = PARK_IDLE;

                if (occupiedParkingSlots > 0) {
                    occupiedParkingSlots--;
                }
                availableParkingSlots = TOTAL_PARKING_SLOTS - occupiedParkingSlots;
                isParkingFull = (occupiedParkingSlots >= TOTAL_PARKING_SLOTS);

                Serial.print("[PARKING] Mobil keluar selesai -> Sisa Slot Terisi: ");
                Serial.print(occupiedParkingSlots);
                Serial.print("/");
                Serial.println(TOTAL_PARKING_SLOTS);
                stateChanged = true;
            }
            break;

        default:
            exitGateState = PARK_IDLE;
            break;
    }

    // Publish telemetri seketika bila terjadi transisi status palang atau slot
    if (stateChanged && mqttClient.connected()) {
        publishTelemetry();
    }
}

// ============================================================
// READ ALL SENSORS (DHT22 + MQ135 + RAIN + ULTRASONIC + LDR)
// Fault-Tolerant: Satu sensor gagal tidak mematikan sensor lain
// ============================================================

bool readSensors() {

    float newHumidity =
        dht.readHumidity();

    float newTemperature =
        dht.readTemperature();

    if (
        isnan(newHumidity) ||
        isnan(newTemperature)
    ) {
        // Jangan batalkan proses! Tetap pertahankan nilai terakhir agar telemetri tidak macet
        Serial.println(
            "WARN: DHT22 pembacaan gagal atau kabel kendor. Mempertahankan nilai terakhir."
        );
    } else {
        humidityPercent =
            newHumidity;
        temperatureC =
            newTemperature;
    }

    readMQ135();
    readRainSensor();
    readUltrasonicSensor();
    readLDR();

    return true;
}

// ============================================================
// UNIX TIMESTAMP
// ============================================================

unsigned long getUnixTimestamp() {

    time_t now;

    time(&now);

    /*
       Prevent publishing invalid NTP time.
    */

    if (now < 1700000000) {
        return 0;
    }

    return (unsigned long)now;
}

// ============================================================
// PUBLISH TELEMETRY
// ============================================================

void publishTelemetry() {

    if (!mqttClient.connected()) {
        return;
    }

    if (!readSensors()) {
        return;
    }

    sampleSequence++;

    unsigned long timestamp =
        getUnixTimestamp();

    String payload;

    payload.reserve(1024);

    payload += "{";

    payload += "\"device_id\":\"";
    payload += deviceId;
    payload += "\",";

    payload += "\"sequence\":";
    payload += String(sampleSequence);
    payload += ",";

    payload += "\"timestamp\":";
    payload += String(timestamp);
    payload += ",";

    payload += "\"uptime_s\":";
    payload += String(millis() / 1000);
    payload += ",";

    payload += "\"temperature_c\":";
    payload += String(
        temperatureC,
        2
    );
    payload += ",";

    payload += "\"humidity_percent\":";
    payload += String(
        humidityPercent,
        2
    );
    payload += ",";

    payload += "\"mq135_raw\":";
    payload += String(
        mq135Raw
    );
    payload += ",";

    payload += "\"mq135_adc_mv\":";
    payload += String(
        mq135AdcMv
    );
    payload += ",";

    payload += "\"mq135_sensor_mv\":";
    payload += String(
        mq135SensorMv,
        2
    );
    payload += ",";

    payload += "\"air_quality_status\":\"";
    payload += airQualityStatus;
    payload += "\",";

    payload += "\"is_gas_polluted\":";
    payload += isGasPolluted ? "true" : "false";
    payload += ",";

    payload += "\"rain_raw\":";
    payload += String(
        rainRaw
    );
    payload += ",";

    payload += "\"rain_status\":\"";
    payload += rainStatus;
    payload += "\",";

    payload += "\"is_raining\":";
    payload += isRaining ? "true" : "false";
    payload += ",";

    payload += "\"water_distance_cm\":";
    payload += String(
        waterDistanceCm,
        1
    );
    payload += ",";

    payload += "\"water_level_cm\":";
    payload += String(
        waterLevelCm,
        1
    );
    payload += ",";

    payload += "\"flood_status\":\"";
    payload += floodStatus;
    payload += "\",";

    payload += "\"is_flood_warning\":";
    payload += isFloodWarning ? "true" : "false";
    payload += ",";

    payload += "\"wifi_rssi_dbm\":";
    payload += String(
        WiFi.RSSI()
    );
    payload += ",";

    // LDR Light Sensor & Lighting Mode Telemetry
    payload += "\"ldr_raw\":";
    payload += String(ldrRaw);
    payload += ",";

    payload += "\"ambient_light\":\"";
    payload += ambientLight;
    payload += "\",";

    payload += "\"is_dark\":";
    payload += isDark ? "true" : "false";
    payload += ",";

    payload += "\"lighting_mode\":\"";
    payload += lightingMode;
    payload += "\",";

    // 4-Channel Relay Actuator States (GPIO 38, 39, 40, 41)
    payload += "\"relays\":{";
    payload += "\"relay1\":"; payload += relay1State ? "true" : "false"; payload += ",";
    payload += "\"relay2\":"; payload += relay2State ? "true" : "false"; payload += ",";
    payload += "\"relay3\":"; payload += relay3State ? "true" : "false"; payload += ",";
    payload += "\"relay4\":"; payload += relay4State ? "true" : "false";
    payload += "},";

    payload += "\"relay1\":"; payload += relay1State ? "true" : "false"; payload += ",";
    payload += "\"relay2\":"; payload += relay2State ? "true" : "false"; payload += ",";
    payload += "\"relay3\":"; payload += relay3State ? "true" : "false"; payload += ",";
    payload += "\"relay4\":"; payload += relay4State ? "true" : "false"; payload += ",";

    // Smart Parking Telemetry (10 Slots Kapasitas)
    payload += "\"parking_total_slots\":"; payload += String(TOTAL_PARKING_SLOTS); payload += ",";
    payload += "\"parking_occupied_slots\":"; payload += String(occupiedParkingSlots); payload += ",";
    payload += "\"parking_available_slots\":"; payload += String(availableParkingSlots); payload += ",";
    payload += "\"is_parking_full\":"; payload += isParkingFull ? "true" : "false"; payload += ",";
    payload += "\"entry_gate_open\":"; payload += isEntryGateOpen ? "true" : "false"; payload += ",";
    payload += "\"exit_gate_open\":"; payload += isExitGateOpen ? "true" : "false"; payload += ",";
    payload += "\"ir_entry_detected\":"; payload += isIrEntryDetected ? "true" : "false"; payload += ",";
    payload += "\"ir_exit_detected\":"; payload += isIrExitDetected ? "true" : "false"; payload += ",";
    payload += "\"parking\":{";
    payload += "\"total_slots\":"; payload += String(TOTAL_PARKING_SLOTS); payload += ",";
    payload += "\"occupied_slots\":"; payload += String(occupiedParkingSlots); payload += ",";
    payload += "\"available_slots\":"; payload += String(availableParkingSlots); payload += ",";
    payload += "\"is_full\":"; payload += isParkingFull ? "true" : "false"; payload += ",";
    payload += "\"entry_gate_open\":"; payload += isEntryGateOpen ? "true" : "false"; payload += ",";
    payload += "\"exit_gate_open\":"; payload += isExitGateOpen ? "true" : "false"; payload += ",";
    payload += "\"ir_entry_detected\":"; payload += isIrEntryDetected ? "true" : "false"; payload += ",";
    payload += "\"ir_exit_detected\":"; payload += isIrExitDetected ? "true" : "false";
    payload += "}";

    payload += "}";

    bool published =
        mqttClient.publish(
            telemetryTopic.c_str(),
            payload.c_str(),
            false
        );

    if (published) {

        Serial.println();
        Serial.println(
            "Telemetry published:"
        );

        Serial.println(payload);

    } else {

        Serial.println(
            "ERROR: MQTT publish failed."
        );
    }
}

// ============================================================
// WIFI STATUS
// ============================================================

void printWiFiStatus() {

    if (
        WiFi.status() !=
        WL_CONNECTED
    ) {
        return;
    }

    Serial.println();
    Serial.println(
        "WiFi connected."
    );

    Serial.print("IP: ");
    Serial.println(
        WiFi.localIP()
    );

    Serial.print("Gateway: ");
    Serial.println(
        WiFi.gatewayIP()
    );

    Serial.print("DNS: ");
    Serial.println(
        WiFi.dnsIP()
    );

    Serial.print("RSSI: ");
    Serial.print(
        WiFi.RSSI()
    );
    Serial.println(" dBm");
}

// ============================================================
// SETUP
// ============================================================

void setup() {

    Serial.begin(115200);

    delay(1000);

    Serial.println();
    Serial.println(
        "=================================="
    );

    Serial.println(
        " AetherSense ESP32-S3"
    );

    Serial.println(
        " HiveMQ Public Broker"
    );

    Serial.println(
        "=================================="
    );

    // --------------------------------------------------------
    // DEVICE ID + MQTT TOPICS
    // --------------------------------------------------------

    createMQTTTopics();

    Serial.print("Device ID: ");
    Serial.println(deviceId);

    Serial.print("Telemetry Topic: ");
    Serial.println(telemetryTopic);

    Serial.print("Status Topic: ");
    Serial.println(statusTopic);

    // --------------------------------------------------------
    // DHT22
    // --------------------------------------------------------

    dht.begin();

    // --------------------------------------------------------
    // ADC & SENSOR PINS
    // --------------------------------------------------------

    analogReadResolution(12);

    pinMode(RAIN_PIN, INPUT);
    pinMode(LDR_PIN, INPUT);

    // Ultrasonic HC-SR04 / JSN-SR04T Pins (Trigger: 13, Echo: 12)
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    digitalWrite(TRIG_PIN, LOW);

    analogSetPinAttenuation(
        MQ135_PIN,
        ADC_11db
    );

    analogSetPinAttenuation(
        RAIN_PIN,
        ADC_11db
    );

    analogSetPinAttenuation(
        LDR_PIN,
        ADC_11db
    );

    // --------------------------------------------------------
    // RELAY 4-CHANNEL PINS (SECTOR LIGHTING ACTUATORS)
    // --------------------------------------------------------

    pinMode(RELAY1_PIN, OUTPUT);
    pinMode(RELAY2_PIN, OUTPUT);
    pinMode(RELAY3_PIN, OUTPUT);
    pinMode(RELAY4_PIN, OUTPUT);

    // Initial state: OFF (LED Padam saat booting)
    digitalWrite(RELAY1_PIN, RELAY_INACTIVE_LEVEL);
    digitalWrite(RELAY2_PIN, RELAY_INACTIVE_LEVEL);
    digitalWrite(RELAY3_PIN, RELAY_INACTIVE_LEVEL);
    digitalWrite(RELAY4_PIN, RELAY_INACTIVE_LEVEL);

    // --------------------------------------------------------
    // SMART PARKING SYSTEM (2x IR SENSORS + 2x SERVOS)
    // --------------------------------------------------------

    pinMode(IR_ENTRY_PIN, INPUT_PULLUP);
    pinMode(IR_EXIT_PIN, INPUT_PULLUP);

    ESP32PWM::allocateTimer(0);
    ESP32PWM::allocateTimer(1);
    ESP32PWM::allocateTimer(2);
    ESP32PWM::allocateTimer(3);

    servoEntry.setPeriodHertz(50);
    servoEntry.attach(SERVO_ENTRY_PIN, 500, 2400);
    servoEntry.write(SERVO_CLOSED_ANGLE);

    servoExit.setPeriodHertz(50);
    servoExit.attach(SERVO_EXIT_PIN, 500, 2400);
    servoExit.write(SERVO_CLOSED_ANGLE);

    // --------------------------------------------------------
    // MQTT
    // --------------------------------------------------------

    mqttClient.setServer(
        MQTT_HOST,
        MQTT_PORT
    );

    mqttClient.setCallback(handleMqttMessage);

    mqttClient.setKeepAlive(30);

    mqttClient.setBufferSize(1024);

    wifiClient.setTimeout(10);

    // --------------------------------------------------------
    // NTP
    // --------------------------------------------------------

    configTime(
        GMT_OFFSET_SEC,
        DAYLIGHT_OFFSET_SEC,
        "pool.ntp.org",
        "time.nist.gov"
    );

    // --------------------------------------------------------
    // WIFI
    // --------------------------------------------------------

    startWiFi();
}

// ============================================================
// LOOP
// ============================================================

void loop() {

    // --------------------------------------------------------
    // Smart Parking Automatic Gate Engine
    // --------------------------------------------------------

    handleParkingSystem();

    // --------------------------------------------------------
    // Maintain WiFi
    // --------------------------------------------------------

    maintainWiFi();

    // --------------------------------------------------------
    // Show WiFi state once
    // --------------------------------------------------------

    static bool wifiWasConnected = false;

    if (
        WiFi.status() ==
        WL_CONNECTED
    ) {

        if (!wifiWasConnected) {

            printWiFiStatus();

            wifiWasConnected = true;
        }

    } else {

        wifiWasConnected = false;
    }

    // --------------------------------------------------------
    // MQTT
    // --------------------------------------------------------

    connectMQTT();

    if (mqttClient.connected()) {

        mqttClient.loop();
    }

    // --------------------------------------------------------
    // Telemetry
    // --------------------------------------------------------

    unsigned long now =
        millis();

    if (
        mqttClient.connected() &&
        now - lastSensorPublish >=
            SENSOR_INTERVAL_MS
    ) {

        lastSensorPublish =
            now;

        publishTelemetry();
    }
}