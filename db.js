const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_PATH = path.join(__dirname, "..", "data.json");
const MAX_READINGS = 10000;
const MAX_ALERT_HISTORY = 500;

function defaultData() {
  return {
    readings: [], // { ts, tempC, humidity, battery, batteryVoltage, current, power, coolingOn, powerSource }
    settings: {
      targetC: 6,
      coolingMode: "auto",       // "auto" | "manual" — read by the ESP32
      coolingOverrideOn: false,  // only meaningful when coolingMode === "manual"
    },
    alerts: [], // { id, type, severity, message, openedTs, resolvedTs }
    produce: { cropType: "", quantity: "", storageDate: "" },
  };
}

function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    const initial = defaultData();
    fs.writeFileSync(DATA_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    const defaults = defaultData();
    for (const key of Object.keys(defaults)) {
      if (!(key in data)) data[key] = defaults[key];
    }
    return data;
  } catch (e) {
    const initial = defaultData();
    fs.writeFileSync(DATA_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// ---------- readings ----------
function insertReading(reading) {
  const data = loadData();
  data.readings.push(reading);
  if (data.readings.length > MAX_READINGS) {
    data.readings = data.readings.slice(data.readings.length - MAX_READINGS);
  }
  saveData(data);
}

function getLatestReading() {
  const data = loadData();
  if (data.readings.length === 0) return null;
  return data.readings[data.readings.length - 1];
}

function getReadingsSince(sinceTs) {
  const data = loadData();
  return data.readings.filter((r) => r.ts >= sinceTs);
}

// ---------- settings ----------
function getSettings() {
  return loadData().settings;
}

function setSetting(key, value) {
  const data = loadData();
  data.settings[key] = value;
  saveData(data);
  return data.settings;
}

// ---------- alerts ----------
function openAlert(type, severity, message) {
  const data = loadData();
  const existing = data.alerts.find((a) => a.type === type && a.resolvedTs === null);
  if (existing) return existing;
  const alert = {
    id: crypto.randomUUID(),
    type,
    severity,
    message,
    openedTs: Date.now(),
    resolvedTs: null,
  };
  data.alerts.unshift(alert);
  if (data.alerts.length > MAX_ALERT_HISTORY) {
    data.alerts = data.alerts.slice(0, MAX_ALERT_HISTORY);
  }
  saveData(data);
  return alert;
}

function resolveAlert(type) {
  const data = loadData();
  const alert = data.alerts.find((a) => a.type === type && a.resolvedTs === null);
  if (alert) {
    alert.resolvedTs = Date.now();
    saveData(data);
  }
  return alert;
}

function getAlerts() {
  return loadData().alerts;
}

// ---------- produce ----------
function getProduce() {
  return loadData().produce;
}

function setProduce(produce) {
  const data = loadData();
  data.produce = {
    cropType: produce.cropType ?? "",
    quantity: produce.quantity ?? "",
    storageDate: produce.storageDate ?? "",
  };
  saveData(data);
  return data.produce;
}

module.exports = {
  insertReading, getLatestReading, getReadingsSince,
  getSettings, setSetting,
  openAlert, resolveAlert, getAlerts,
  getProduce, setProduce,
};
