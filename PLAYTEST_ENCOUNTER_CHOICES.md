# Encounter Choice v0.1 playtest

## Goal

Prove that reaching a fantasy site creates a real player decision before rewards
resolve, without disrupting the existing exploration, progression, or save loop.

## Choice flow

1. Select an unvisited site and enter exploration range.
2. Tap **Explore**, or tap the selected in-range marker a second time.
3. Confirm the site is not immediately marked visited and no XP, loot, Camp
   charge, Codex entry, contract progress, or Journey event is awarded yet.
4. Confirm the choice dialog names the site, repeats its flavor, and presents:
   - one blue **Measured approach** with dependable XP and restrained loot;
   - one amber **Bold approach** with a higher loot ceiling and a real chance of
     coming up thin.
5. Tap **Back to map**. Reopen the same site and confirm it remains available.
6. Choose an approach and confirm the existing Field Report appears with the
   chosen approach named above the result.

## Site identity

Open several different site types. Their verbs should match the place rather
than showing generic buttons. Examples include:

- Shrine: **Read the signs** / **Break the seal**
- Camp: **Scout the perimeter** / **Raid the tents**
- Grove: **Read the tracks** / **Enter the thicket**
- Well: **Listen at the rim** / **Lower the rope**

## Outcome contract

- Measured outcomes always grant at least 15 encounter XP and no more than one
  site-generated loot roll.
- Bold outcomes either come up thin with no site-generated loot or pay off with
  at least one roll and a higher possible ceiling.
- Camp perks may add their existing XP or loot after either outcome; their
  behavior is unchanged.
- Reopening the same site and choosing the same approach produces the same base
  result. The POI id plus approach locks the seed.
- A rapid double tap on an approach resolves only once.

## Regression sanity

- The POI is marked visited only after a choice resolves.
- XP, loot, Codex discoveries/sets, Field Contracts, Camp charges, Field Report,
  Journey events, sound, haptics, rare treatment, and level-up feedback all run
  through the existing post-encounter pipeline.
- Out-of-range and already-visited sites remain blocked in normal play.
- **Simulate visit** opens the same choice flow for Demo testing.
- Choice state is transient. Reloading before choosing does not spend the site.
- Keyboard focus enters the first choice; both choices and **Back to map** are
  reachable and clearly labeled.

## Intentional v0.1 boundary

There is no health, combat turn, injury, equipment stat, or failure penalty in
this slice. The bold downside is reward variance. This tests whether choosing
how to approach a discovered place makes exploration more engaging before a
larger combat system is justified.
