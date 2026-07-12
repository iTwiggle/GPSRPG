# Authored fantasy map v0.1 playtest

## The only acceptance question that matters first

Ignore the HUD, tabs, labels, player dot, and POI markers for five seconds.

Does the map itself read as a fantasy game overworld before you are told what the app is?

If the answer is no, this PR stays Draft.

## Pixel visual pass

1. Open the PR preview in Demo Mode.
2. Keep **Fantasy atlas: On** and **Street reference: Off**.
3. Look for recognizable authored world marks rather than abstract terrain shapes:
   - tree/canopy clusters
   - scrub and grass strokes
   - rock clusters
   - reeds and wave marks
   - broken ruin walls
   - hamlet roofs and path stones
   - standing stones / rune marks
   - dead trees
4. Confirm the world lattice is not visually legible. There should be no squares, circles, repeated oval masses, tile borders, or scanner grid.
5. Nudge in 40 m steps. Existing motifs should stay anchored to the same world positions while the map moves.
6. Use **Random nearby** repeatedly. Each jump samples within 1 km of the fixed Demo Location and should expose different motif families / local map character.

## Fog and gameplay regression

- Persistent exploration fog still remembers traversed territory.
- Current vicinity remains readable.
- POIs stream continuously from the rolling world field.
- First tap identifies; second eligible tap explores.
- Explore radius remains visible.
- Player and POI markers remain crisp above map art.
- Street reference fades map art and exposes road geography for debugging.

## Failure language

Any of these is a failed visual pass:

- Green Squares of Death
- colored circles
- oblong spheroids
- visible chunk/tile lattice
- scanner grid
- standard OSM with a dark filter and a few decorative stickers
- random clip-art confetti with no sense of world regions
- motifs teleporting or reshuffling while nudging

Do not merge on a "better than before" verdict. The bar is "reads as a fantasy game map."
