# GPSRPG — Playtest Notes

Companion app / overworld prototype playtest log. This is **not** the main 3D extraction RPG.

## What has been validated

Tested on the deployed Vercel HTTPS build from a phone (passenger, highway speeds):

| Area | Result |
|------|--------|
| Real GPS tracking | Accurate; player marker follows live position |
| POI appearance while moving | POIs generate and appear on the map as position updates |
| Explore | Works when within 150 m explore radius |
| Simulate visit | Bypasses distance check for desktop/demo testing |
| Loot drops | Items roll and appear in inventory |
| Rarity colors | Common / uncommon / rare styling works in inventory |
| XP gain | XP increments after encounters |
| Level-up | Reaching level 2 works via XP threshold |

Desktop **Demo Mode** (fixed Demo Location, nudge controls) remains the primary path for local iteration without GPS.

## Safe testing

**Passenger or walking only. Do not interact with the app while driving.**

- Have a passenger operate the phone, or stop and pull over before tapping POIs.
- Highway passenger testing is useful for GPS accuracy and marker churn, but exploration UI is designed for walking pace.
- This prototype has no hands-free or voice controls.

## Mobile GPS testing notes

- Browsers require **HTTPS** (or `localhost` on the same device) for real geolocation. Use the Vercel preview/production URL on a phone — not `http://<lan-ip>:3000`.
- Allow location permission when prompted.
- `enableHighAccuracy: true` with `maximumAge: 5s` — expect periodic GPS updates, not continuous sub-second tracking.
- If permission is denied or GPS is unavailable, the app falls back to **Demo Location** (amber banner) — that is not live GPS.

## Known limitations

- **No backend** — game state lives in `localStorage` on this device/browser only.
- **No combat, cards, multiplayer, AR, or persistence sync** — out of prototype scope.
- **POI grid cells (~400 m)** — POIs are keyed to a meter-based ~400 m grid around your position. Crossing a cell boundary regenerates all 8 nearby POIs with new IDs. At highway speeds this reduces marker churn compared to the old ~111 m cells; walking pace remains the intended experience.
- **150 m explore radius** — you must be close enough to tap **Explore**; brief drive-by range at speed is expected but not ideal for interaction.
- **Visited POI IDs are cell-scoped** — revisiting the same real-world spot after a large move may show fresh POIs (new cell, new IDs).
- **Simulate visit** is a dev/playtest affordance — it does not require proximity and can be used on already-visited POIs only once per POI id (re-explore blocked after first real explore).
- **Demo Mode vs live GPS** — Demo Location uses fixed coordinates and nudge controls; it must not be mistaken for real-world validation.

## Demo Mode vs live GPS

| | Live GPS | Demo Mode |
|---|----------|-----------|
| Indicator | “GPS live” badge (indigo) | Amber banner: “Demo Location — demo fallback, not your real GPS” |
| Position source | Browser Geolocation API | Fixed Demo Location or nudge offsets |
| Best for | Mobile field testing | Desktop / denied-permission fallback |
| Movement | You move in the real world | Nudge buttons (~40 m per tap) |

## Next candidate improvements

Small, in-scope follow-ups (not committed in this pass):

1. **Sticky POI anchor** — regenerate only after moving N meters from the anchor, not on every cell edge.
2. **GPS accuracy display** in the HUD when `accuracy` is available.
3. **“Nearest POI” hint** when no marker is selected — helps at walking pace.
4. **Offline / PWA shell** for installed home-screen testing.
5. **Encounter cooldown or daily cap** if farming Simulate visit becomes too generous in dev builds.

## Commands

```bash
npm run build
npm run lint
```
