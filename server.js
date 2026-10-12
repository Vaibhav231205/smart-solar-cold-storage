require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000; // matches vite.config.js's proxy target — no frontend config needed
const DEVICE_API_KEY = process.env.DEVICE_API_KEY || "dev-key-change-me";

// A reading is "live" if it arrived within this many seconds — matches
// staleAfterMs (30000ms) in useLatestReading.js on the frontend.
const STALE_AFTER_SECONDS = 30;

// These thresholds intentionally mirror src/utils/alerts.js on the frontend
// (deriveLiveAlerts), so backend-confirmed alerts and the frontend's own
// locally-derived alerts agree on what counts as "unsafe".
const HIGH_TEMP_MARGIN_C = 2;   // matches: tempC > targetC + 2
const HUMIDITY_MAX = 85;        // matches: humidity > 85
const BATTERY_LOW = 25;         // matches: battery < 25

function requireDeviceKey(req, res, next) {
  const key = req.header("x-api-key");
  if (key !== DEVICE_API_KEY) {
    return res.status(401).json({ error: "Invalid or missing x-api-key header." });
  }
  next();
}

function rangeToSeconds(range) {
  switch (range) {
    case "1h": return 60 * 60;
    case "24h": return 24 * 60 * 60;
    case "7d": return 7 * 24 * 60 * 60;
    default: return 24 * 60 * 60;
  }
}

// ---------- alert engine ----------
// Runs after every new reading (for responsiveness) and on a timer (so
// disconnection is caught even when NO new readings ever arrive).
function evaluateAlerts() {
  const latest = db.getLatestReading();
  const { targetC } = db.getSettings();
  const now = Date.now();
  const online = !!latest && (now - latest.ts) / 1000 <= STALE_AFTER_SECONDS;

  function setAlert(type, severity, isActive, message) {
    if (isActive) db.openAlert(type, severity, message);
    else db.resolveAlert(type);
  }

  setAlert(
    "esp32_offline", "critical", !online,
    "No data received from the ESP32 — check its power and WiFi connection."
  );

  if (!latest || !online) {
    setAlert("high_temp", "warning", false, "");
    setAlert("unsafe_humidity", "warning", false, "");
    setAlert("low_battery", "critical", false, "");
    setAlert("power_problem", "critical", false, "");
    return;
  }

  setAlert(
    "high_temp", "warning",
    latest.tempC > targetC + HIGH_TEMP_MARGIN_C,
    `Chamber temperature ${latest.tempC.toFixed(1)}°C exceeds target by more than ${HIGH_TEMP_MARGIN_C}°C.`
  );

  setAlert(
    "unsafe_humidity", "warning",
    latest.humidity > HUMIDITY_MAX,
    `Humidity at ${Math.round(latest.humidity)}% — above safe storage limit.`
  );

  setAlert(
    "low_battery", "critical",
    latest.battery !== null && latest.battery < BATTERY_LOW,
    `Battery at ${Math.round(latest.battery)}% — charge or switch power source soon.`
  );

  setAlert(
    "power_problem", "critical",
    latest.powerSource === "Critical",
    "No power available from solar or battery — cooling may be paused to protect the battery."
  );
}

evaluateAlerts();
setInterval(evaluateAlerts, 5000);

// ======================================================================
// Frontend-facing routes — shapes match src/api/endpoints.js exactly.
// ======================================================================

app.get("/api/health", (req, res) => res.json({ ok: true, time: Date.now() }));

app.get("/api/target", (req, res) => {
  res.json({ targetC: db.getSettings().targetC });
});

app.put("/api/target", (req, res) => {
  const { targetC } = req.body;
  if (typeof targetC !== "number" || targetC < 0 || targetC > 15) {
    return res.status(400).json({ error: "targetC must be a number between 0 and 15." });
  }
  db.setSetting("targetC", targetC);
  evaluateAlerts();
  res.json({ targetC });
});

app.get("/api/readings/latest", (req, res) => {
  const row = db.getLatestReading();
  if (!row) return res.json(null); // useLatestReading treats null as "no update yet"

  const { targetC } = db.getSettings();
  res.json({
    tempC: row.tempC,
    humidity: row.humidity,
    battery: row.battery,
    batteryVoltage: row.batteryVoltage,
    current: row.current,   // amps, null if not safely measurable on this device
    power: row.power,       // watts, null if not safely measurable on this device
    coolingOn: row.coolingOn,
    powerSource: row.powerSource,
    targetC,
    timestamp: row.ts,
  });
});

app.get("/api/readings/history", (req, res) => {
  const range = req.query.range || "24h";
  const sinceTs = Date.now() - rangeToSeconds(range) * 1000;
  const rows = db.getReadingsSince(sinceTs);
  res.json({
    history: rows.map((r) => ({
      timestamp: r.ts,
      tempC: r.tempC,
      humidity: r.humidity,
      battery: r.battery,
      batteryVoltage: r.batteryVoltage,
    })),
  });
});

app.get("/api/alerts", (req, res) => {
  res.json({
    alerts: db.getAlerts().map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      message: a.message,
      timestamp: a.openedTs,
      resolved: a.resolvedTs !== null,
    })),
  });
});

// Manual cooling override. mode: "auto" | "manual". coolingOn only applies
// when mode === "manual" — the ESP32 polls GET /api/cooling and obeys it.
app.put("/api/cooling", (req, res) => {
  const { mode, coolingOn } = req.body;
  if (mode !== "auto" && mode !== "manual") {
    return res.status(400).json({ error: "mode must be 'auto' or 'manual'." });
  }
  db.setSetting("coolingMode", mode);
  if (mode === "manual") {
    if (typeof coolingOn !== "boolean") {
      return res.status(400).json({ error: "coolingOn (boolean) is required when mode is 'manual'." });
    }
    db.setSetting("coolingOverrideOn", coolingOn);
  }
  const settings = db.getSettings();
  res.json({ mode: settings.coolingMode, coolingOn: settings.coolingOverrideOn });
});

// Device-facing read of the same setting (see below), exposed here too so
// the frontend can optionally read current mode without guessing.
app.get("/api/cooling", (req, res) => {
  const settings = db.getSettings();
  res.json({ mode: settings.coolingMode, coolingOn: settings.coolingOverrideOn });
});

app.get("/api/produce", (req, res) => {
  res.json(db.getProduce());
});

app.put("/api/produce", (req, res) => {
  const { cropType, quantity, storageDate } = req.body;
  const saved = db.setProduce({ cropType, quantity, storageDate });
  res.json(saved);
});

// ======================================================================
// Device-facing route — the ESP32 posts here. Not called by the frontend.
// ======================================================================

app.post("/api/readings", requireDeviceKey, (req, res) => {
  const {
    tempC, humidity, coolingOn, powerSource,
    battery = null, batteryVoltage = null,
    current = null, power = null,
  } = req.body;

  if (
    typeof tempC !== "number" ||
    typeof humidity !== "number" ||
    typeof coolingOn !== "boolean" ||
    typeof powerSource !== "string"
  ) {
    return res.status(400).json({
      error: "Body must include tempC (number), humidity (number), coolingOn (boolean), powerSource (string). " +
             "battery, batteryVoltage, current, power are optional — send null if not measured.",
    });
  }

  const numOrNull = (v) => (typeof v === "number" ? v : null);
  db.insertReading({
    ts: Date.now(),
    tempC, humidity,
    battery: numOrNull(battery),
    batteryVoltage: numOrNull(batteryVoltage),
    current: numOrNull(current),
    power: numOrNull(power),
    coolingOn, powerSource,
  });

  evaluateAlerts();
  res.status(201).json({ ok: true });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Harvest Guard backend running on http://localhost:${PORT}`);
  console.log(`Device API key: ${DEVICE_API_KEY} (set DEVICE_API_KEY in .env to change it)`);
});
