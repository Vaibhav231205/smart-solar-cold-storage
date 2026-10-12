# Harvest Guard Backend

Node.js + Express API sitting between the ESP32 and the existing React
dashboard. Every route and response shape here matches
`src/api/endpoints.js` in the frontend exactly — no frontend changes were
needed beyond the one described in the root README.

Data is stored in a local `data.json` file (created automatically) — no
database server or native compilation required, so it installs cleanly
on any machine.

## Run it

```bash
cd backend
npm install
cp .env.example .env      # then edit DEVICE_API_KEY to something private
npm start
```

Runs on **port 5000** by default — this matters, because `vite.config.js`
in the frontend already proxies `/api/*` to `http://localhost:5000`. As
long as the backend runs on 5000, the dashboard needs zero configuration
changes in dev.

## Try the full stack before your hardware is ready

```bash
npm run simulate
```

Pretends to be the ESP32 — posts a realistic reading every 3 seconds and
correctly obeys the manual cooling override, so you can exercise the
whole dashboard (charts, alerts, cooling toggle) with no hardware at all.

## API reference

### Frontend-facing (polled/called by the React app)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/target` | `{ targetC }` |
| PUT | `/api/target` | body `{ targetC }` |
| GET | `/api/readings/latest` | full reading object, or literal `null` if none yet |
| GET | `/api/readings/history?range=1h\|24h\|7d` | `{ history: [...] }` |
| GET | `/api/alerts` | `{ alerts: [{id, type, severity, message, timestamp, resolved}] }` |
| GET/PUT | `/api/cooling` | `{ mode: "auto"\|"manual", coolingOn }` — manual override |
| GET/PUT | `/api/produce` | `{ cropType, quantity, storageDate }` |

### Device-facing (called only by the ESP32)

**`POST /api/readings`** — requires header `x-api-key: <DEVICE_API_KEY>`

```json
{
  "tempC": 7.2,
  "humidity": 88,
  "battery": 85,
  "batteryVoltage": 12.6,
  "current": 0.42,
  "power": 5.3,
  "coolingOn": true,
  "powerSource": "Solar"
}
```

`battery`, `batteryVoltage`, `current`, and `power` are all nullable —
send `null` for any your hardware doesn't measure. In particular,
`current`/`power` should stay `null` unless your INA219 is wired
somewhere its shunt is actually rated to measure safely (see firmware
comments in `esp32_firmware/harvest_guard_firmware.ino`).

The ESP32 also **reads** `GET /api/target` and `GET /api/cooling` (same
routes the frontend uses) to know what temperature to hold and whether a
manual override is active.

## Alert engine

Alerts are computed server-side (not just trusted from the device), so
alert history persists even across dashboard reloads. Thresholds
intentionally mirror `src/utils/alerts.js` on the frontend — same
`+2°C` over target, same `85%` humidity ceiling, same `25%` low-battery
line — so the backend-confirmed alerts and the frontend's own
locally-derived alerts never disagree.

A background check runs every 5 seconds independent of incoming
readings, specifically so `esp32_offline` still fires even if the device
stops sending data entirely (30-second timeout, matching
`staleAfterMs` in `useLatestReading.js`).

## Manual cooling override

`PUT /api/cooling` with `{"mode":"manual","coolingOn":true}` forces
cooling on regardless of temperature, until cleared back to `"auto"`
(the frontend's "Follow live sensor state" button does this). The ESP32
polls this every cycle and obeys it — **except** the low-battery safety
cutoff always wins even in manual mode, since that's a hardware
protection limit, not a user preference.

## Deploying

Any Node host works. Make sure it gives you a persistent disk for
`data.json` — most free tiers reset the filesystem on redeploy, wiping
history. Set `VITE_API_BASE_URL` in the frontend's `.env` to point at the
deployed backend's URL once it's not running on localhost.
