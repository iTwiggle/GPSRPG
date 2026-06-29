# GPSRPG — Companion App / Overworld Prototype

A tiny browser-based **companion app / overworld prototype** for GPSRPG. This is **not** the main 3D extraction RPG, a production mobile app, an MMO, or a full standalone game.

## Core loop (prototype)

GPS position → procedural nearby fantasy POIs → visit/explore POI → roll encounter reward → gain XP/loot → inventory and character state persist in `localStorage`. A **Collection Log / Codex** tracks discovered POIs, loot, and encounters across sessions in the same save. An **Activity Log / Journey Feed** records the latest 50 explore events (POI explored, encounter, XP gained, items found, level-ups, contract fulfillments) as a chronological timeline, also persisted in `localStorage`. **Field Contracts** give three short-term outing goals (explore sites, find loot, earn XP, etc.) that advance when you explore; completing a contract grants a small bonus XP reward.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Leaflet + OpenStreetMap
- Browser Geolocation API
- `localStorage` persistence (no backend)

## Run locally (desktop)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on the **same machine** running the dev server. This is the fastest way to iterate on desktop.

`localhost` only works on that machine — it is not a practical path for testing real GPS on a phone.

## Demo Mode (desktop / local testing)

Most desktops have no GPS. Use **Demo Mode** to load a fixed **Demo Location** (not your real position):

- Click **Use Demo Location** on the startup screen, or
- Let the app fall back automatically when location is denied or unavailable.

In Demo Mode, use the nudge controls to simulate movement. **Simulate visit** bypasses the 150 m explore radius for testing.

Demo Mode is for desktop and local development — not for validating real-world GPS on mobile.

## Mobile GPS testing (HTTPS required)

Browsers only expose real GPS on **secure contexts** (HTTPS, or `localhost` on the same device). Testing from a phone against `http://<your-lan-ip>:3000` often **will not** grant real geolocation.

**Recommended:** deploy a Vercel preview (below) and open the HTTPS preview URL on your phone. Allow location when prompted.

## Deployment status

This app is deployed via [Vercel](https://vercel.com) from the `main` branch. Pushes to `main` trigger automatic production deployments.

## Deploy to Vercel (preview)

No environment variables are required. Vercel auto-detects this Next.js app.

1. Push this repo to GitHub (`iTwiggle/GPSRPG`).
2. In [Vercel](https://vercel.com), **Add New Project** → import `iTwiggle/GPSRPG`.
3. Leave framework preset as **Next.js** and build settings at defaults (`npm run build`, output `.next`).
4. Deploy. Each push to a branch gets an HTTPS preview URL; `main` gets a production URL.
5. On your phone, open the preview URL, allow location, and walk near POIs to test live GPS.

Optional CLI:

```bash
npx vercel          # preview deployment
npx vercel --prod   # production deployment
```

## Scripts

```bash
npm run dev    # development server
npm run build  # production build
npm run start  # run production build
npm run lint   # ESLint
```

## Scope (prototype)

No backend, auth, database, blockchain, BLE/NFC, React Native, multiplayer, 3D, AR, or real-money rewards. Nearby POI names and flavor are **procedural fantasy** with optional, experimental **OSM-aware area theming** (coarse mood only — not real landmark POIs). See `PLAYTEST_NOTES.md` for limitations and privacy notes.
