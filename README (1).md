# Harvest Guard — Smart Solar Cold Storage Dashboard

A warm, simple React dashboard for the Smart Solar-Powered IoT Mini Cold
Storage project — designed for farmers and collection-centre operators, not
just technicians.

## Stack
- React 19 + Vite
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- `lucide-react` for icons
- Google Fonts: Fredoka (headings) + Nunito (body)

## Getting started
```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend, or leave unset to use the dev proxy
npm run dev
```

## Design notes
- **Palette**: warm cream background, deep leaf green for structure, a
  brighter green for highlights, harvest gold for warnings, soft clay-red for
  critical alerts. All defined as tokens in `src/index.css` (`@theme` block)
  — change them in one place to retheme the whole app.
- **Type**: Fredoka for headings (big, round, friendly — legible at a glance
  outdoors or on a small phone screen), Nunito for body copy and numbers.
- **Plain language over jargon**: cards say "Nice and cool" or "A little
  warm — keep an eye on it" rather than just a bare number, so the dashboard
  is useful even to someone unfamiliar with the electronics.
- **Big, touch-friendly controls**: the target-temperature control uses large
  plus/minus buttons instead of a small numeric field, since this is meant to
  be used on a phone in the field.
- **Leaf motif**: a small set of reusable leaf SVGs (`src/components/common/LeafDecorations.jsx`)
  are the one recurring decorative element — used sparingly as corner accents,
  empty-state illustrations, and a dotted "vine" divider, rather than photos
  or heavy imagery.

## Folder structure

```
src/
├── api/                  # Talks to the backend
│   ├── client.js         # fetch wrapper (base URL, headers, error handling)
│   └── endpoints.js      # One function per backend route:
│                          #   GET  /target
│                          #   PUT  /target
│                          #   GET  /readings/latest
│                          #   GET  /readings/history
│                          #   GET  /alerts
│
├── hooks/                # Data-fetching hooks, each polling on an interval
│   ├── useLatestReading.js   # live temp/humidity/battery/cooling + online status
│   ├── useReadingHistory.js  # data for the history charts
│   └── useAlerts.js          # active + historical alerts
│
├── components/
│   ├── dashboard/        # TemperatureCard (hero), HumidityCard, BatteryCard,
│   │                      # CoolingStatusCard, DeviceStatusBadge,
│   │                      # TargetTemperatureControl
│   ├── charts/           # TemperatureHumidityChart, BatteryHistoryChart
│   │                      # (placeholders — plug in recharts/chart.js etc.)
│   ├── alerts/           # AlertBanner, AlertHistoryList
│   ├── layout/           # Navbar (Sidebar.jsx kept for future multi-device use)
│   └── common/           # LoadingSpinner, ErrorMessage, LeafDecorations
│
├── pages/
│   └── DashboardPage.jsx # Composes everything above into the main screen
│
├── context/              # (empty) for global state if you outgrow hooks-per-page
└── utils/                # (empty) for formatting helpers, constants, etc.
```

## Next steps
- `Sidebar.jsx` is unused for now (kept intentionally simple, single-column)
  but is ready to reintroduce once you support multiple storage units.

## Backend & hardware integration

A backend now lives in `backend/` — see `backend/README.md` for the full
API reference, how to run it, and how to test the full stack (including a
device simulator) before your ESP32 hardware is ready.

ESP32 firmware matching this exact API is in `backend/esp32_firmware/`.

The only frontend change made for the hardware integration: `BatteryCard`
now shows solar-charging current/power as a third stat block, but only
when the device actually reports it (`current`/`power` are nullable —
many builds won't have a safely-rated current sensor wired in). Everything
else in the frontend is unchanged from before the integration.

