# Immersive viewfinder shell v0.1 playtest

## Acceptance target

The overworld should read as the game surface, not as a map card embedded in a
web page. HUD, navigation, and secondary systems should feel like lightweight
equipment layered over the world and disappear when they are not needed.

## Core phone pass

1. Launch in Live GPS and Demo Mode. Confirm the map fills the entire viewport
   with no page scroll, blank edge, or rounded map-card frame.
2. Confirm the player HUD remains compact and readable without hiding the map
   center. On a device with a notch or home indicator, verify the HUD and dock
   stay inside the safe areas.
3. Open and close Sites, Tasks, Bag, Codex, Camp, and Journey from the bottom
   dock. Tapping the active item again should also close its sheet.
4. Confirm each sheet scrolls internally while the map remains behind it. The
   existing actions and data in every section should behave exactly as before.
5. Rotate once and resize once. The mobile bottom sheet should become a right
   drawer on a wide viewport without losing the active section.

## POI interaction pass

1. Tap an unvisited POI once. Its compact bubble must sit completely above the
   authored world-object sprite; the marker itself must remain visible.
2. For an in-range selected POI, confirm the bubble says **Tap marker again**.
   Tap the visible marker and verify the encounter resolves exactly once.
3. Select an out-of-range and visited POI. Confirm their short status copy is
   readable without expanding into the old flavor-card popup.
4. Pan or zoom with a bubble open. It should remain attached to the POI without
   blocking the map or creating a second popup.

## Layering and regression pass

- Demo notice does not cover zoom controls.
- Map attribution remains visible above the dock.
- XP and pickup feedback still originate at the Wayfarer.
- Reward modal, level-up treatment, save warnings, and install prompt render
  above the map and remain operable.
- Fog, discovered terrain, authored atlas art, marker accessibility, two-tap
  exploration, persistence, rewards, and progression are unchanged.

## Intentional boundary

This pass changes presentation and interaction layering only. It does not decide
whether Camp, Journey, Tasks, Bag, or Codex should later be combined, renamed,
trimmed, or expanded.
