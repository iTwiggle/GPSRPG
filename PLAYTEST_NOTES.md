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
- **Procedural POI flavor** — names, descriptors, encounters, and loot themes are generated fantasy. They may be **lightly biased** by approximate nearby OpenStreetMap context (experimental v0.1), but they are **not** tied to specific real-world landmarks or exact map features.
- **OSM-aware theming (experimental)** — the client may query the public Overpass API with an approximate ~400 m cell bounding box to infer a coarse area mood (e.g. Grove, Water, Cemetery). This is approximate, optional, and not required for gameplay. Queries may fail, time out, or rate-limit; the app falls back to generic procedural flavor. Only the coarse category is cached locally — not raw OSM data.
- **POI grid cells (~400 m)** — POIs are keyed to a meter-based ~400 m grid around your position. Crossing a cell boundary regenerates all 8 nearby POIs with new IDs. At highway speeds this reduces marker churn compared to the old ~111 m cells; walking pace remains the intended experience. OSM context is also fetched at most once per cell (cached ~7 days on success, ~15 minutes on failure).
- **POI anchoring** — POI coordinates are anchored to the stable **cell center** (same grid seed as IDs), not your live GPS position. Moving within a cell does not drag markers; returning to a previous cell reproduces the same POIs at the same world coordinates.
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

## OSM context privacy (experimental)

- The app sends an **approximate map-cell bounding box** (~400 m) to the public [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) when entering a new cell. It does **not** upload a GPS trail or store raw map features.
- Only a **coarse category** (e.g. Grove, Water, Cemetery) is cached in `localStorage` under `gpsrpg-osm-context-v1`.
- If Overpass is unavailable, POIs remain fully playable with generic procedural flavor.

## Next candidate improvements

Small, in-scope follow-ups (not committed in this pass):

1. **Sticky POI anchor** — regenerate only after moving N meters from the anchor, not on every cell edge.
2. **GPS accuracy display** in the HUD when `accuracy` is available.
3. **“Nearest POI” hint** when no marker is selected — helps at walking pace.
4. **Offline / PWA shell** for installed home-screen testing.
5. **Encounter cooldown or daily cap** if farming Simulate visit becomes too generous in dev builds.

## Site Approach / Navigation HUD v0.1

Test selecting a POI and moving toward it (Demo Mode nudge or live GPS):

| Check | Expected |
|-------|----------|
| Approach readout | Sites panel shows **Site approach** block when a POI is selected |
| Distance | Live distance updates as position changes |
| Status: Far | Greater than 250 m from selected site |
| Status: Nearby | Between 150 m (explore range) and 250 m |
| Status: In range | At or below 150 m explore radius |
| Progress bar | Fills as you close in; 100% when in range |
| Bearing | Arrow glyph + cardinal direction (e.g. North-East) |
| Selected marker | Amber outline pulse; stronger green/gold pulse when in range |
| Explore button | Disabled with **Out of range (Xm)** when beyond 150 m; helper text below |
| Simulate visit | Still works without proximity; unchanged dev affordance |

**Demo Mode:** Select a POI, nudge toward it (~40 m per tap), watch status shift Far → Nearby → In range and the Explore button unlock.

**Known limitations (v0.1):** Bearing is a flat compass hint only (no map rotation or turn-by-turn). Progress uses `exploreRadius / distance` — it does not account for GPS accuracy. Only the selected marker gets in-range glow.

## Session Recap / Field Report v0.1

Test exploring several sites, then open the **Journey** tab (mobile) or scroll the sidebar (desktop):

| Check | Expected |
|-------|----------|
| Field Report panel | Appears above Activity Log in Journey |
| Started | Shows today + time when the current report began |
| Sites explored | Increments on each Explore / Simulate visit |
| XP gained | Includes encounter XP and contract reward XP |
| Items found | Counts loot drops this report |
| Best find | Shows rarest item this report (rarity tie-break by name) |
| POI types | Comma-separated labels for unique site types visited |
| Tasks completed | Increments when a Field Contract fulfills during this report |
| Start New Report | Resets counters; archives prior summary to Activity Log if any progress |
| Old saves | Missing `fieldReport` defaults to a fresh report on load |

**Demo Mode:** Explore 3–4 sites with Simulate visit, confirm counters update, tap **Start New Report**, verify Activity Log shows archive + new report lines.

**Known limitations (v0.1):** One active report per save — no history list of past reports. Report persists across browser sessions until reset. No GPS trail or path data is stored.

## Fantasy Grid Overlay v0.1

Test the biome-driven fantasy tile surface over the existing Leaflet map:

| Check | Expected |
|-------|----------|
| Default surface | Fantasy grid visible on load; OSM streets visually secondary beneath tiles |
| Biome mood | Local Aura category maps to grid palette (Grove → green, Water → blue rune tiles, Industrial → stone/ruins, Market/Crossroads/Academy → cobble, Cemetery/Chapel → shrine, generic → wilds) |
| Player marker | Purple/gold glyph remains above grid and readable |
| POI markers | Fantasy glyphs clickable; selected (amber) and in-range (green/gold) pulses unchanged |
| Interaction | Pan, zoom, scroll-wheel, and POI tap/popup work — grid does not block input |
| Attribution | OpenStreetMap attribution remains visible when OSM tiles are loaded |
| Dev: Fantasy grid off | Dev panel toggle hides grid; street map returns to default fantasy CSS filters |
| Dev: Street reference | With grid on, fades overlay (~38% opacity) and brightens OSM for debug comparison |
| Session prefs | Toggle state stored in `sessionStorage` only (not game save) |
| Zoom out | Fantasy grid remains visible (screen-space tile fallback); OSM stays secondary, not bare street map |

**Demo Mode:** Enable Demo Mode, confirm grid tiles render and pan/zoom with the map. Zoom out several levels — grid should stay as biome-colored tiles, not revert to plain OSM. Toggle **Street reference** to compare against underlying roads.

**Performance notes:** Canvas redraws on pan/zoom via `requestAnimationFrame`; capped at 2× DPR. No image assets or external APIs.

**Known limitations (v0.1):** Visual-only 40 m tile grid — not tied to POI cells or authored terrain. Biome comes from coarse OSM category for the current ~400 m cell; loading/generic falls back to wilds. No Tiled/Zest import, no per-city maps, no GPS trail. Tile skew is cosmetic top-down/isometric hint only. At low zoom (world tiles smaller than ~8 px on screen), overlay switches to fixed screen-space tiles so the fantasy surface stays visible when zoomed out.

## Fantasy Cartography Disguise Pass v0.1

Visual/readability check after strengthening the map disguise layer:

| Check | Expected |
|-------|----------|
| First impression | Map reads as a dark fantasy scanner surface, not a default street-map app |
| Street/label readability | Roads, water, parks, and place names remain legible at zoom 15–17 |
| Tile treatment | OSM tiles are darkened, desaturated, and lightly hue-shifted via CSS filters |
| Tile-only overlays | Scanner grid, arcane survey diagonals, and radial haze apply to tiles only (not markers) |
| Frame treatment | Map frame shows vignette edge glow and scanner corner brackets |
| Player marker | Purple/gold glyph remains clearly visible above the disguised surface |
| POI markers | Fantasy glyphs stay dominant; selected (amber) and in-range (green/gold) pulses unchanged |
| Interaction | Zoom, pan, POI tap, and popups work normally |
| Attribution | OpenStreetMap attribution remains visible in bottom-right |
| Mobile | No noticeable scroll/zoom jank; overlay layers are CSS-only (no animations) |

**Demo Mode:** Open the app on desktop, enable Demo Mode, zoom in/out and select POIs — confirm the map feels stylized but still navigable.

**Readability guardrail:** If local testing shows place names or water features becoming too faint, reduce `--fantasy-map-brightness` / `--fantasy-map-saturate` in `globals.css` slightly.

**Known rendering limitations:** CSS `filter` on tile images is applied per-tile by the browser; very old mobile browsers may ignore filters or show a brief flash on tile load. Overlays do not rotate with the map (fixed to the viewport frame) — acceptable for a scanner HUD metaphor.

## Loot Reward Juice v0.1

Test encounter loot feedback after Explore / Simulate visit:

| Check | Expected |
|-------|----------|
| Common drop | Quick fade-in; no sparkle burst; no long delay |
| Uncommon drop | Green shimmer pulse + sparkle burst; modal border may tint green |
| Rare drop | Gold staggered reveal (~480ms+), edge glow, stronger sparkle; modal gold border/glow |
| New item | **New** chip on first Codex discovery for that item name+type |
| No loot | “Your pack is unchanged” — unchanged |
| Continue | Modal dismisses; inventory/Codex/Activity Log still persist correctly |

**Demo Mode:** Use **Simulate visit** on several cache/shrine sites until uncommon and rare loot appear. Compare common vs rare reveal timing — rare should feel unmistakably more exciting.

**Known limitations (v0.1):** CSS-only particles (no sound). Reveal timing is deterministic, not random slot-machine rolls. Loot tables and drop rates unchanged.

## Player Adventurer Sprite v0.1

Test the map player marker after enabling Demo Mode:

| Check | Expected |
|-------|----------|
| Player marker | 0.5D adventurer billboard (hood, cloak, body) replaces blue dot |
| Visibility | Readable above fantasy grid and POI markers |
| Explore radius | Purple dashed circle still centered on player |
| Interaction | Pan/zoom unchanged; player marker follows GPS/demo nudge |

**Known limitations (v0.1):** Static CSS billboard — no facing variants or walk animation yet.

## Commands

```bash
npm run build
npm run lint
```
