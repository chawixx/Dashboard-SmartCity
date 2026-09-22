#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <time.h>

// ============================================================
// SENSOR CONFIGURATION
// ============================================================

#define DHT_PIN 6
#define DHT_TYPE DHT22

#define MQ135_PIN 7
#define RAIN_PIN 8
#define WATER_LEVEL_PIN 10

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

float temperatureC = NAN;
float humidityPercent = NAN;

uint16_t mq135Raw = 0;
uint32_t mq135AdcMv = 0;
float mq135SensorMv = 0.0f;

uint16_t rainRaw = 4095;
bool isRaining = false;
String rainStatus = "Kering";

uint16_t waterLevelRaw = 0;
float waterLevelCm = 0.0f;
String floodStatus = "Aman";
bool isFloodWarning = false;

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
// READ WATER LEVEL SENSOR (Pin 10 / ADC1 - River Flood Monitoring)
// ============================================================

void readWaterLevelSensor() {
    const int samples = 10;
    uint32_t rawSum = 0;

    for (int i = 0; i < samples; i++) {
        rawSum += analogRead(WATER_LEVEL_PIN);
        delayMicroseconds(500);
    }

    waterLevelRaw = rawSum / samples;

    // Resistive Copper Trace Sensor:
    // Immersion depth ranges roughly 0 - 4.0 cm on standard 40mm PCB strip
    // ADC 0 - ~400: Kering (Sensor di atas muka air)
    // ADC 400 - 1500: Normal (0.5 - 1.5 cm)
    // ADC 1500 - 2600: Waspada (1.5 - 2.8 cm)
    // ADC 2600 - 3300: Siaga (2.8 - 3.5 cm)
    // ADC > 3300: Bahaya Banjir (> 3.5 cm / Terendam Penuh)

    if (waterLevelRaw < 400) {
        waterLevelCm = 0.0f;
        floodStatus = "Aman";
        isFloodWarning = false;
    } else {
        waterLevelCm = ((float)(waterLevelRaw - 400) / 3200.0f) * 4.0f;
        if (waterLevelCm > 4.5f) waterLevelCm = 4.5f;

        if (waterLevelRaw >= 3300) {
            floodStatus = "Bahaya Banjir";
            isFloodWarning = true;
        } else if (waterLevelRaw >= 2600) {
            floodStatus = "Siaga";
            isFloodWarning = true;
        } else if (waterLevelRaw >= 1500) {
            floodStatus = "Waspada";
            isFloodWarning = false;
        } else {
            floodStatus = "Aman";
            isFloodWarning = false;
        }
    }
}

// ============================================================
// READ DHT22 + MQ135 + RAIN SENSOR + WATER LEVEL
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

        Serial.println(
            "ERROR: DHT22 read failed."
        );

        return false;
    }

    humidityPercent =
        newHumidity;

    temperatureC =
        newTemperature;

    readMQ135();
    readRainSensor();
    readWaterLevelSensor();

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

    payload.reserve(768);

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

    payload += "\"water_level_raw\":";
    payload += String(
        waterLevelRaw
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
    pinMode(WATER_LEVEL_PIN, INPUT);

    analogSetPinAttenuation(
        MQ135_PIN,
        ADC_11db
    );

    analogSetPinAttenuation(
        RAIN_PIN,
        ADC_11db
    );

    analogSetPinAttenuation(
        WATER_LEVEL_PIN,
        ADC_11db
    );

    // --------------------------------------------------------
    // MQTT
    // --------------------------------------------------------

    mqttClient.setServer(
        MQTT_HOST,
        MQTT_PORT
    );

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