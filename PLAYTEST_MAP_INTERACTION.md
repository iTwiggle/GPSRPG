# Map-first interaction v0.1 playtest

## Goal

Validate the one-thumb map loop before visual terrain work begins.

## Mobile flow

1. Tap a POI once.
   - The current mobile tab should stay selected.
   - The marker should select/highlight.
   - An in-map popup should identify the site, show flavor text, and show distance.
2. For an unvisited site in range, confirm the popup says **Tap again to explore**.
3. Tap the same marker again.
   - The existing encounter/reward flow should run.
   - XP and reward feedback should behave exactly as before.
4. Tap an out-of-range site twice.
   - It must not explore.
   - The popup should say to get within the explore radius.
5. Tap an already explored site twice.
   - It must not explore again.
6. Select one POI, then tap a different POI.
   - The new POI should only become selected on that first tap; it must not immediately explore even if it is in range.

## Demo Mode movement

1. Enter Demo Mode in a Vercel preview or production build.
2. Confirm the **Dev** tab is visible while Demo Mode is active.
3. Open Dev and tap North, West, East, and South.
   - The player position should move about 40 m per tap in the chosen direction.
   - The map should recenter on the simulated position.
4. Tap **Reset demo pos**.
   - The player should return to the fixed demo location.
5. Retry Live GPS.
   - In a normal production build, the Dev tab should disappear again once live GPS is active.

## Regression sanity

- GPS and map recentering still work.
- POI selection/highlight still updates.
- The POI panel Explore button still works when deliberately opened.
- Keyboard marker activation remains routed through the same two-step interaction.
- Demo Mode movement controls remain available without enabling global production dev tools.
- Loot, codex, XP, visited state, and persistence remain unchanged.
