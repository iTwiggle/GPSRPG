# Location Data Boundary

GPSRPG is location-native, so location is treated as sensitive gameplay input rather than ordinary save data.

## Boundary rule

Exact GPS coordinates may exist in memory while the app is open because the map, distance checks, fog reveal, POI discovery, and movement delta calculation require a current position.

Exact GPS coordinates must not be persisted in the companion game save or included in the UE5 companion export.

The movement ledger may persist aggregate movement facts such as total meters, today's meters, minutes in motion, outing count, and the timestamp of the last outdoor session. Its exact `lastPosition` and sampling timestamp are runtime-only and are stripped before save serialization. Legacy saves that already contain those fields are scrubbed when loaded.

## Persisted location-derived data

The browser may persist these location-derived values:

- exploration memory cell keys used to remember revealed fog;
- a stable onboarding POI;
- OSM context cache keys representing approximately 400 m world cells plus a coarse area category such as park, water, industrial, or commercial;
- aggregate movement totals and session timestamps;
- visited procedural POI identifiers and visit timestamps.

These values support continuity across launches. They are less precise than a raw GPS sample but can still reveal approximate movement or play-area history and must be treated as location-derived data.

A full player reset clears game state, exploration memory, onboarding POI data, and the OSM context cache. The explicit location consent choice is intentionally retained so reset does not silently change the user's GPS preference.

## External requests

### OpenStreetMap tile service

The Leaflet map requests OpenStreetMap tiles for the visible viewport. Tile coordinates identify the map area being viewed and therefore can reveal an approximate location or viewed area to the tile provider.

### Overpass API

For area flavor, GPSRPG converts the player position to an approximately 400 m cell and sends that cell's bounding box to the public Overpass API. The response is reduced to a coarse local context category and cached by cell key. Raw Overpass elements are not persisted by GPSRPG.

## Data that does not leave through the companion export

`CompanionExportV1` exports player progression, inventory catalog IDs, collection-board progress, aggregate outdoor effort, unlock tokens, and the sanctum scaffold. It must not contain exact GPS coordinates, exploration cell keys, OSM cache keys, or onboarding POI coordinates.

## Future boundary changes

Before adding a backend, account sync, analytics, multiplayer, leaderboards, or automatic UE5 synchronization, explicitly decide:

1. which location-derived fields are authoritative;
2. which fields may leave the device;
3. the minimum spatial precision required;
4. retention duration and deletion behavior;
5. whether a user-visible consent change is required.

Do not treat today's local-storage boundary as permission to upload existing location-derived state later.
