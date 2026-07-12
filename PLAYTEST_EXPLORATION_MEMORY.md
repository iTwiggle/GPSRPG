# Exploration memory v0.1 playtest

## Goal

Prove that walking reveals geography and the map remembers the traversed route instead of behaving like a permanent moving flashlight.

## Demo Mode route memory

1. Open the stacked branch preview in Demo Mode with Fantasy grid enabled and Street reference off.
2. Observe the current player vicinity: it should be the clearest area while distant map space remains strongly obscured.
3. Open Dev and nudge North repeatedly for 400–800 m.
4. Watch the fog mask while moving. A traversed corridor should remain visibly known behind the player.
5. Reverse direction and nudge South back toward the start.
6. Confirm the previous route remains revealed/dim-known instead of returning to full darkness.
7. Move East or West from the route. Untraversed territory should still be strongly obscured.

## Persistence

1. Build a visible route with Demo nudges.
2. Fully close the preview/PWA tab.
3. Reopen the same origin.
4. Confirm the previously revealed route is still known.
5. Use Reset save.
6. Confirm exploration memory clears and the map returns to unrevealed fog outside the current vicinity.

## Separation from POI state

- Walking reveals map cells without exploring a POI.
- Exploring a POI does not reveal arbitrary distant geography.
- Visited POI state remains intact independently of the fog mask.

## Regression sanity

- Player marker remains visible.
- Explore radius remains visible above the fog.
- POI markers remain visible/tappable for navigation.
- First tap identifies and second eligible tap explores.
- Rolling POI field continuity from #35 remains intact.
- Street reference disables the fog mask for map debugging.
- XP, loot, inventory, codex, tasks, and Base Camp behavior remain unchanged.
