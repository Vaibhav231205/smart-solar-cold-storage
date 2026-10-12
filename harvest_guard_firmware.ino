/*
 * Harvest Guard — ESP32 Firmware
 * -------------------------------------------------------------
 * Hardware: DHT11 (temp/humidity), single relay switching a
 * TEC1-12706 Peltier + 12V fan together, INA219 (voltage/current/
 * power, wired on the SOLAR CHARGING LINE ONLY — never in series
 * with the ~6A Peltier line), buzzer for local alerts, 12V 7Ah
 * battery, solar panel + charge controller.
 *
 * Talks to the Harvest Guard backend over REST:
 *   GET  /api/target    -> { targetC }
 *   GET  /api/cooling   -> { mode: "auto"|"manual", coolingOn }
 *   POST /api/readings  -> sends this device's sensor data (needs x-api-key)
 *
 * Libraries required (Arduino IDE > Tools > Manage Libraries):
 *   - "DHT sensor library" by Adafruit  (+ "Adafruit Unified Sensor")
 *   - "Adafruit INA219" by Adafruit     (only needed if INA219_ENABLED)
 *
 * Board package (Tools > Boards Manager, if not already installed):
 *   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
 * Board: "ESP32 Dev Module"
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_INA219.h>

// ==================== EDIT THESE ====================
const char* WIFI_SSID      = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD  = "YOUR_WIFI_PASSWORD";

// Your backend's LAN IP (run `ipconfig`/`ifconfig` on the machine running
// the backend). "localhost" will NOT work here — this is a different device.
const char* BACKEND_HOST   = "http://192.168.1.50:5000";

// Must exactly match DEVICE_API_KEY in backend/.env
const char* DEVICE_API_KEY = "change-this-to-a-long-random-string";
// =====================================================

// ---------- pin map ----------
#define DHT_PIN         4      // DHT11 data pin
#define DHT_TYPE        DHT11
#define RELAY_PIN       25     // switches Peltier + fan together
#define BUZZER_PIN      26     // active buzzer module

// Most cheap 1-channel relay modules are "active LOW": driving the IN pin
// LOW turns the relay ON. Verify yours with a multimeter before trusting
// this — flip the constant below if it's backwards.
const bool RELAY_ACTIVE_LOW = true;

// ---------- INA219 configuration ----------
// IMPORTANT: a standard INA219 breakout's shunt is typically rated for
// ~3.2A continuous. A TEC1-12706 can draw up to ~6.4A — well past that
// rating. This firmware wires the INA219 in series with the SOLAR
// CHARGING line only (between the charge controller's battery-output
// terminal and the actual battery terminal), where current is always
// well under 1A for a 10W panel. Its bus-voltage reading is still an
// accurate battery voltage, because that node sits directly on the
// battery terminal.
//
// Do NOT move the INA219 in series with the Peltier/relay line unless
// you have confirmed your exact module's shunt is rated for the current
// it will see there.
const bool  INA219_ENABLED             = true;
const float INA219_MAX_SAFE_CURRENT_A  = 3.2;   // <-- EDIT to match your exact module's rating
const bool  INA219_REPORT_CURRENT_POWER = true; // safe to leave true given the wiring above

Adafruit_INA219 ina219;
bool ina219Ready = false;

// ---------- control parameters ----------
const float HYSTERESIS_ON              = 0.6;  // turn cooling ON this many °C above target
const float HYSTERESIS_OFF             = 0.4;  // turn cooling OFF this many °C below target
const float LOW_BATTERY_CUTOFF_V       = 11.0; // stop cooling below this, to protect the battery — applies even in manual mode
const float CHARGING_VOLTAGE_THRESHOLD = 13.0; // above this bus voltage, assume the panel is actively charging

// Local buzzer alert thresholds — mirror the backend's own thresholds
// (see backend/src/server.js) so on-device alerts agree with the dashboard.
const float BUZZER_HIGH_TEMP_MARGIN_C = 2.0;
const float BUZZER_LOW_BATTERY_PERCENT = 25.0;

DHT dht(DHT_PIN, DHT_TYPE);

float targetC = 6.0;
String coolingMode = "auto";     // "auto" | "manual", from backend
bool coolingOverrideOn = false;  // only used when coolingMode == "manual"
bool coolingOn = false;          // actual relay state, reported back to the backend

unsigned long lastPostMs = 0;
const unsigned long POST_INTERVAL_MS = 3000;

unsigned long lastBuzzMs = 0;
bool buzzerState = false;

// ---------- relay helper (handles active-low modules) ----------
void setCooling(bool on) {
  coolingOn = on;
  bool pinLevel = RELAY_ACTIVE_LOW ? !on : on;
  digitalWrite(RELAY_PIN, pinLevel ? HIGH : LOW);
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(400);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected. IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi connection failed — will keep retrying in the main loop.");
  }
}

// Extremely small hand-rolled parser for the two simple JSON shapes this
// firmware needs to read. Fine for a fixed, known response shape; if you
// extend the API, switch to the ArduinoJson library instead.
float extractNumberField(const String& body, const String& key) {
  int keyIdx = body.indexOf("\"" + key + "\"");
  if (keyIdx == -1) return NAN;
  int colonIdx = body.indexOf(':', keyIdx);
  if (colonIdx == -1) return NAN;
  int endIdx = body.indexOf(',', colonIdx);
  int braceIdx = body.indexOf('}', colonIdx);
  if (endIdx == -1 || (braceIdx != -1 && braceIdx < endIdx)) endIdx = braceIdx;
  String numPart = body.substring(colonIdx + 1, endIdx);
  numPart.trim();
  return numPart.toFloat();
}

bool extractBoolField(const String& body, const String& key) {
  int keyIdx = body.indexOf("\"" + key + "\"");
  if (keyIdx == -1) return false;
  int colonIdx = body.indexOf(':', keyIdx);
  return body.indexOf("true", colonIdx) != -1 && body.indexOf("true", colonIdx) < colonIdx + 8;
}

String extractStringField(const String& body, const String& key) {
  int keyIdx = body.indexOf("\"" + key + "\"");
  if (keyIdx == -1) return "";
  int firstQuote = body.indexOf('"', body.indexOf(':', keyIdx));
  int secondQuote = body.indexOf('"', firstQuote + 1);
  if (firstQuote == -1 || secondQuote == -1) return "";
  return body.substring(firstQuote + 1, secondQuote);
}

void fetchTargetAndCoolingMode() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(String(BACKEND_HOST) + "/api/target");
  http.setTimeout(3000);
  if (http.GET() == 200) {
    float parsed = extractNumberField(http.getString(), "targetC");
    if (!isnan(parsed)) targetC = parsed;
  }
  http.end();

  http.begin(String(BACKEND_HOST) + "/api/cooling");
  http.setTimeout(3000);
  if (http.GET() == 200) {
    String body = http.getString();
    coolingMode = extractStringField(body, "mode");
    coolingOverrideOn = extractBoolField(body, "coolingOn");
  }
  http.end();
}

void postReading(float tempC, float humidity, float batteryVoltage, float batteryPct,
                  float currentA, float powerW, const char* powerSource) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(String(BACKEND_HOST) + "/api/readings");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", DEVICE_API_KEY);

  String body = "{";
  body += "\"tempC\":" + String(tempC, 1) + ",";
  body += "\"humidity\":" + String(humidity, 1) + ",";
  body += "\"battery\":" + (isnan(batteryPct) ? String("null") : String(batteryPct, 1)) + ",";
  body += "\"batteryVoltage\":" + (isnan(batteryVoltage) ? String("null") : String(batteryVoltage, 2)) + ",";
  body += "\"current\":" + (isnan(currentA) ? String("null") : String(currentA, 3)) + ",";
  body += "\"power\":" + (isnan(powerW) ? String("null") : String(powerW, 2)) + ",";
  body += String("\"coolingOn\":") + (coolingOn ? "true" : "false") + ",";
  body += "\"powerSource\":\"" + String(powerSource) + "\"";
  body += "}";

  int code = http.POST(body);
  Serial.println("POST /api/readings -> " + String(code));
  http.end();
}

// Rough estimate for a 12V lead-acid/SLA battery's charge percentage.
// This is NOT a proper fuel gauge — good enough for a dashboard
// indicator on a prototype. For accuracy, add a dedicated fuel-gauge IC.
float estimateBatteryPercent(float voltage) {
  float pct = (voltage - 11.0) / (12.9 - 11.0) * 100.0;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

void updateBuzzer(float tempC, float batteryPct) {
  bool highTemp = tempC > targetC + BUZZER_HIGH_TEMP_MARGIN_C;
  bool lowBattery = !isnan(batteryPct) && batteryPct < BUZZER_LOW_BATTERY_PERCENT;
  bool shouldAlert = highTemp || lowBattery;

  if (!shouldAlert) {
    digitalWrite(BUZZER_PIN, LOW);
    buzzerState = false;
    return;
  }

  // Non-blocking beep pattern: 200ms on, repeating every 3s — audible
  // but not relentless, and never delays the WiFi/sensor loop.
  unsigned long now = millis();
  if (!buzzerState && now - lastBuzzMs > 3000) {
    digitalWrite(BUZZER_PIN, HIGH);
    buzzerState = true;
    lastBuzzMs = now;
  } else if (buzzerState && now - lastBuzzMs > 200) {
    digitalWrite(BUZZER_PIN, LOW);
    buzzerState = false;
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();

  pinMode(RELAY_PIN, OUTPUT);
  setCooling(false); // start with cooling off
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  if (INA219_ENABLED) {
    Wire.begin(); // default ESP32 I2C pins: SDA=21, SCL=22
    ina219Ready = ina219.begin();
    if (!ina219Ready) {
      Serial.println("INA219 not detected — check wiring. Voltage/current/power will be omitted.");
    }
  }

  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  float humidity = dht.readHumidity();
  float tempC = dht.readTemperature();

  if (isnan(humidity) || isnan(tempC)) {
    Serial.println("DHT11 read failed — skipping this cycle.");
    delay(2000);
    return;
  }

  // ---- INA219: voltage always if present; current/power only if
  // configured safe AND within the configured safe current rating ----
  float batteryVoltage = NAN, currentA = NAN, powerW = NAN;
  if (INA219_ENABLED && ina219Ready) {
    float busVoltage = ina219.getBusVoltage_V();
    float shuntVoltage_mV = ina219.getShuntVoltage_mV();
    batteryVoltage = busVoltage + (shuntVoltage_mV / 1000.0); // load-side + shunt drop ≈ battery terminal voltage

    if (INA219_REPORT_CURRENT_POWER) {
      float rawCurrentA = ina219.getCurrent_mA() / 1000.0;
      if (fabs(rawCurrentA) <= INA219_MAX_SAFE_CURRENT_A) {
        currentA = rawCurrentA;
        powerW = ina219.getPower_mW() / 1000.0;
      } else {
        Serial.println("WARNING: INA219 current exceeds configured safe rating — "
                        "omitting current/power this cycle. Check wiring/placement.");
      }
    }
  }

  float batteryPct = isnan(batteryVoltage) ? NAN : estimateBatteryPercent(batteryVoltage);
  const char* powerSource =
    isnan(batteryVoltage) ? "Unknown" :
    (batteryVoltage > CHARGING_VOLTAGE_THRESHOLD) ? "Solar" :
    (batteryVoltage > LOW_BATTERY_CUTOFF_V) ? "Battery" : "Critical";

  fetchTargetAndCoolingMode();

  // Low-battery protection always wins, even in manual mode — this is a
  // hardware safety limit, not a user preference.
  bool canCool = isnan(batteryVoltage) || batteryVoltage > LOW_BATTERY_CUTOFF_V;

  if (coolingMode == "manual") {
    setCooling(coolingOverrideOn && canCool);
  } else {
    bool nextCoolingOn = coolingOn;
    if (tempC > targetC + HYSTERESIS_ON && canCool) nextCoolingOn = true;
    if (tempC <= targetC - HYSTERESIS_OFF || !canCool) nextCoolingOn = false;
    setCooling(nextCoolingOn);
  }

  updateBuzzer(tempC, batteryPct);

  Serial.printf(
    "Temp: %.1fC  Humidity: %.1f%%  Battery: %s  Cooling: %s (%s)  Target: %.1fC\n",
    tempC, humidity,
    isnan(batteryVoltage) ? "n/a" : String(batteryVoltage, 2).c_str(),
    coolingOn ? "ON" : "OFF", coolingMode.c_str(), targetC
  );

  if (millis() - lastPostMs > POST_INTERVAL_MS) {
    postReading(tempC, humidity, batteryVoltage, batteryPct, currentA, powerW, powerSource);
    lastPostMs = millis();
  }

  delay(2000);
}
