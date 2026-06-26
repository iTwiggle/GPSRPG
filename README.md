# GPSRPG — Companion App / Overworld Prototype

A tiny browser-based **companion app / overworld prototype** for GPSRPG. This is **not** the main 3D extraction RPG, a production mobile app, an MMO, or a full standalone game.

## Core loop (prototype)

GPS position → procedural nearby fantasy POIs → visit/explore POI → roll encounter reward → gain XP/loot → inventory and character state persist in `localStorage`.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Leaflet + OpenStreetMap
- Browser Geolocation API
- `localStorage` persistence (no backend)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

On a phone, allow location for the overworld map. On desktop without GPS, use **Demo mode** (falls back to a fixed **Demo Location**, not your real position). Use nudge controls to simulate movement. **Simulate visit** bypasses the 150 m explore radius for testing.

## Scripts

```bash
npm run dev    # development server
npm run build  # production build
npm run start  # run production build
npm run lint   # ESLint
```

## Scope (prototype)

No backend, auth, database, blockchain, BLE/NFC, React Native, multiplayer, 3D, AR, or real-money rewards.
