# Fantasy cartography v0.1 playtest

## Goal

Validate that the overworld reads as dark fantasy cartography under a moving player instead of a visible debug lattice or repeated one-cell blobs.

## Visual read

1. Open the branch preview on mobile with Fantasy grid enabled.
2. Confirm the map no longer reads as repeated bordered green squares or a field of small green circles.
3. Confirm large terrain washes overlap across multiple underlying grid cells so the 40 m coordinate lattice is not visually obvious.
4. Confirm contour-style linework gives the surface an illustrated map read rather than a tiled board read.
5. Confirm the current biome has recognizable sparse ink marks:
   - Wilds: grass / brush strokes
   - Grove: stylized tree marks
   - Water: wave marks
   - Stone: broken ruin marks
   - Settlement: road / structure marks
   - Shrine: triangular rune marks
6. Confirm a dark field veil closes around the outer map while the player's nearby area stays readable.
7. Move in Live GPS or use Demo Mode nudges and confirm the readable field remains centered on the live player position.
8. Pan / zoom and confirm the canvas redraws without obvious seams, blank areas, or stale veil positioning.

## Random terrain sampling

1. In Demo Mode open Dev tools.
2. Tap **Random nearby** several times.
3. Confirm each jump stays within roughly 1 km of the fixed demo origin rather than drifting farther on repeated taps.
4. Use the jumps to sample different OSM context / fantasy biome classifications and compare whether their cartographic marks are visually distinct.
5. Reset demo position and confirm the player returns to the fixed demo origin.

## Street reference

1. In Demo Mode open Dev tools.
2. Turn Street reference on.
3. Confirm OSM roads become more legible without removing the fantasy surface.
4. Turn Street reference off and confirm the fantasy treatment returns to full strength.

## Regression sanity

- Player marker remains visible and tappable.
- POI markers remain visible and tappable.
- First tap identifies a POI; second eligible tap explores it.
- Explore radius remains visible.
- XP / reward feedback still anchors to the player marker.
- GPS recentering and Demo Mode nudges still work.
- No save, encounter, inventory, codex, or balance behavior changes.

## Scope note

This pass is a visual field veil, not persistent exploration-memory fog. The revealed area follows the player. Persisting revealed geography across sessions should be a separate gameplay/state iteration if the visual language passes field testing.

The current POI field still regenerates wholesale after the anchor refresh threshold. That continuity problem is intentionally not hidden inside this visual PR; it should be addressed as a separate world-generation iteration.
