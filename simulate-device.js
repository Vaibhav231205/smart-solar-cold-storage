// Pretends to be the ESP32: posts a new reading every few seconds, and
// obeys the manual cooling override the same way the real firmware does.
// Run with: npm run simulate

require("dotenv").config();

const API_BASE = process.env.API_BASE || `http://127.0.0.1:${process.env.PORT || 5000}`;
const API_KEY = process.env.DEVICE_API_KEY || "dev-key-change-me";

let tempC = 8.5;
let humidity = 90;
let batteryVoltage = 12.6;
let virtualHour = 9;
let coolingOn = false;
let targetC = 6;

function batteryPercentFromVoltage(v) {
  return Math.max(0, Math.min(100, ((v - 11.0) / (12.9 - 11.0)) * 100));
}

async function tick() {
  let mode = "auto";
  let overrideOn = false;

  try {
    const [targetRes, coolingRes] = await Promise.all([
      fetch(`${API_BASE}/api/target`),
      fetch(`${API_BASE}/api/cooling`),
    ]);
    const targetData = await targetRes.json();
    const coolingData = await coolingRes.json();
    targetC = targetData.targetC;
    mode = coolingData.mode;
    overrideOn = coolingData.coolingOn;
  } catch (e) {
    console.error("Could not fetch target/cooling settings:", e.message);
  }

  virtualHour = (virtualHour + 7 / 60) % 24;
  const daylight = virtualHour > 6 && virtualHour < 18;
  const irradiance = daylight ? Math.sin(((virtualHour - 6) / 12) * Math.PI) : 0;

  // INA219 is wired on the solar-charging line only (safe, <1A for a 10W
  // panel) — never in series with the ~6A Peltier line.
  const solarCurrentA = Math.max(0, irradiance * 0.7 + (Math.random() - 0.5) * 0.05);
  const solarPowerW = Math.round(solarCurrentA * batteryVoltage * 10) / 10;

  const peltierDemandW = coolingOn ? 60 : 0;
  batteryVoltage = Math.max(10.8, Math.min(13.2, batteryVoltage + (solarPowerW - peltierDemandW) * 0.0006));
  const battery = Math.round(batteryPercentFromVoltage(batteryVoltage) * 10) / 10;
  const powerSource = solarCurrentA > 0.05 ? "Solar" : batteryVoltage > 11 ? "Battery" : "Critical";

  const ambient = 27 + Math.sin((virtualHour / 24) * Math.PI * 2) * 3;
  const canCool = batteryVoltage > 11.0;

  if (mode === "manual") {
    coolingOn = overrideOn && canCool; // safety cutoff still applies even in manual mode
  } else {
    if (tempC > targetC + 0.6 && canCool) coolingOn = true;
    if (tempC <= targetC - 0.4 || !canCool) coolingOn = false;
  }

  tempC += (coolingOn ? -0.35 : (ambient - tempC) * 0.02) + (Math.random() - 0.5) * 0.15;
  tempC = Math.round(tempC * 10) / 10;

  humidity += (78 - humidity) * 0.05 + (Math.random() - 0.5) * 2.2;
  humidity = Math.round(Math.max(50, Math.min(99, humidity)) * 10) / 10;

  const body = {
    tempC, humidity, battery,
    batteryVoltage: Math.round(batteryVoltage * 100) / 100,
    current: Math.round(solarCurrentA * 1000) / 1000,
    power: solarPowerW,
    coolingOn, powerSource,
  };

  try {
    const res = await fetch(`${API_BASE}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log("Posted reading:", body);
  } catch (e) {
    console.error("Failed to post reading:", e.message);
  }
}

console.log(`Simulating device -> ${API_BASE}`);
tick();
setInterval(tick, 3000);
