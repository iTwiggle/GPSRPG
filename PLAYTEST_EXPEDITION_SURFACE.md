# Expedition Surface — Field Playtest

This pass consolidates Field Contracts, the current Field Report, and the Trail
Log into one player-facing **Expedition** surface. It changes presentation and
navigation only: contract generation, reward resolution, report counters,
activity persistence, and save shape remain unchanged.

## Mobile acceptance pass

1. Launch with Live GPS or Demo Mode and confirm the dock has one **Expedition**
   control instead of separate Tasks and Journey controls.
2. Open Expedition and verify the sheet shows, in order:
   - current expedition progress and outing totals;
   - Field Contracts;
   - Field Report;
   - Trail Log.
3. Scroll from the summary through the entire Trail Log. Confirm there is one
   continuous scroll surface, no nested scroll trap, and the map remains visible
   behind the glass sheet.
4. Explore a site. Confirm the outing totals, matching contract progress, and
   Trail Log update exactly once.
5. Fulfill a contract. Confirm its existing XP reward still resolves once and
   the aggregate expedition percentage advances.
6. Tap **New outing**. Confirm only the Field Report starts over; Field Contracts,
   player inventory, Codex, and saved Trail Log remain intact.
7. Close and reopen the PWA. Confirm all Expedition data matches the pre-close
   state.

## Layout and accessibility

- At narrow phone widths, all dock controls fit without requiring a horizontal
  hunt for Tasks or Journey.
- At desktop width, Expedition opens in the existing right-side drawer.
- The aggregate progress exposes a named `progressbar` with its current value.
- Buttons remain reachable by keyboard and the panel close control returns the
  player to the unobstructed map.
- In production Live GPS, contract regeneration remains unavailable. Demo/dev
  surfaces may still show **New Contracts** for testing.

## Out of scope

- New task types or rewards
- Save migration or persistence changes
- Camp, inventory, or Codex redesign
- Share cards or cross-player percentile rankings
