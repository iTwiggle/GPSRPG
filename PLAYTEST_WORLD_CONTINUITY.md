# World continuity v0.1 playtest

## Goal

Prove that movement streams stable POIs through the visible field instead of replacing the whole world at an anchor threshold.

## Demo Mode continuity

1. Open the branch preview and enter Demo Mode.
2. Open Dev and nudge North repeatedly in 40 m steps for at least 800 m.
3. Watch the map continuously while nudging.
4. Confirm nearby POIs keep the same names, marker types, and positions as the player moves.
5. Confirm new POIs enter from the outer field and distant POIs leave without an all-at-once marker reroll.
6. Pay special attention around 240–320 m from the starting position. There must be no old 280 m "whole field changed" moment.
7. Reverse direction and return toward the start. Stable world-cell POIs should return with the same IDs/identity and visited state.

## Onboarding site

1. On an origin that has never stored the onboarding POI, confirm one starter site is generated 70–110 m from the initial position.
2. Move beyond the rolling field radius and continue moving.
3. Confirm a new guaranteed-close site is not injected every time the field changes.

## Interaction / persistence regression

- First tap identifies a POI; second eligible tap explores it.
- Explore radius remains 150 m.
- Visited POIs remain visited when leaving and returning.
- Codex entries continue to reference stable POI IDs.
- XP, loot, encounter, inventory, tasks, and Base Camp behavior remain unchanged.
- Live GPS and Demo Mode both use the same rolling POI field logic.

## Expected visual signature

Movement should look like a camera traveling through one world: most markers remain fixed while only edge sites enter or leave. Any moment where the entire visible set changes together is a failure.
