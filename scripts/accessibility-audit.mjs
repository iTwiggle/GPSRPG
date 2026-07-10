#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function runMarkerA11yTests() {
  const result = spawnSync(
    "npx",
    ["vitest", "run", "src/lib/marker-a11y.test.ts"],
    {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        VITEST_ENVIRONMENT: "happy-dom",
      },
    }
  );

  if (result.status !== 0) {
    fail("marker accessibility unit tests failed");
  }
}

function auditMarkerSources() {
  const poiMarkerIcons = read("src/lib/poi-marker-icons.ts");
  const gameMap = read("src/components/GameMap.tsx");
  const markerA11y = read("src/lib/marker-a11y.ts");

  if (!poiMarkerIcons.includes("createPoiMarkerConfig")) {
    fail("poi-marker-icons.ts must expose createPoiMarkerConfig");
  }

  if (!poiMarkerIcons.includes("playerMarkerConfig")) {
    fail("poi-marker-icons.ts must expose playerMarkerConfig");
  }

  if (!gameMap.includes("AccessibleMarker")) {
    fail("GameMap.tsx must render markers through AccessibleMarker");
  }

  if (!gameMap.includes("createPoiMarkerConfig")) {
    fail("GameMap.tsx must use createPoiMarkerConfig for POI markers");
  }

  if (!markerA11y.includes("syncMarkerAccessibility")) {
    fail("marker-a11y.ts must sync attributes on marker.getElement()");
  }

  if (!poiMarkerIcons.includes('aria-hidden="true"')) {
    fail("POI marker glyphs must remain decorative with aria-hidden");
  }

  if (!poiMarkerIcons.includes("poi-marker-glyph")) {
    fail("POI marker icons must keep a decorative poi-marker-glyph child");
  }

  if (!poiMarkerIcons.includes("player-marker-glyph")) {
    fail("Player marker icon must keep a decorative player-marker-glyph child");
  }
}

console.log("Running accessibility audit...");
runMarkerA11yTests();
auditMarkerSources();

if (failures.length > 0) {
  console.error("\nAccessibility audit failed:");
  for (const message of failures) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log("\nAccessibility audit passed.");
