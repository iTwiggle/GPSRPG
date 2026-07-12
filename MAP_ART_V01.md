# Authored fantasy map v0.1

## Intent

Replace the retired green debug grid with a readable fantasy overworld surface. Orna-like game-map readability is the minimum reference class for this pass; final GPSRPG art direction can become more distinctive later.

## Hard lessons from PR #34

Do not render one deterministic world cell as one visible shape.

Do not attempt to imply terrain by changing squares into circles, rounded blobs, ellipses, or larger seeded masses.

Do not draw scanner lines over the world.

The world coordinate lattice may seed placement and persistence, but the lattice must not be visually legible.

## Visual contract

The base geography remains real and navigable. Roads and water geometry are useful world structure, not debugging artifacts.

The presentation layer should make that geography read as a game overworld:

- dark desaturated ground instead of standard OSM colors
- roads as muted old-world paths
- water as deep ink-blue terrain
- authored top-down fantasy motifs with recognizable silhouettes
- grove: clustered tree/canopy marks
- settlement: roof/stone/road marks
- industrial: broken wall/ruin/gear marks
- water: reeds/waves/shore marks
- generic wilds: grass/rock/scrub marks
- shrine context: rune/standing-stone marks

Motifs are authored assets/primitives placed as sparse map decoration. They are not a continuous procedural fill and must not reveal the seed grid.

## Layer order

1. Real geography tile source, visually transformed into a subdued fantasy base.
2. Authored terrain-decoration layer.
3. Persistent exploration fog from PR #38.
4. Explore radius.
5. POI markers and player marker.
6. Reward/game-feel overlays.

## Acceptance test

A Pixel screenshot with all labels and controls ignored should read as a fantasy mobile game map before the viewer is told what the project is.

Failure descriptions include:

- green squares
- colored circles
- dim oblong spheroids
- scanner/debug grid
- standard Leaflet/OSM with a dark filter
- one uniform biome tint across the whole viewport

## Scope

This PR is map art only. It does not replace the player marker, redesign POI markers, add memory decay, or change gameplay/world-generation rules.
