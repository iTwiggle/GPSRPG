"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import CharacterHUD from "@/components/CharacterHUD";
import DevControls from "@/components/DevControls";
import EncounterModal from "@/components/EncounterModal";
import InventoryPanel from "@/components/InventoryPanel";
import POIPanel from "@/components/POIPanel";
import { useGameState } from "@/hooks/useGameState";
import { useGeolocation } from "@/hooks/useGeolocation";
import { generateNearbyPOIs } from "@/lib/poi-generator";
import { DEMO_LOCATION_LABEL, type POI } from "@/lib/types";

const GameMap = dynamic(() => import("@/components/GameMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

export default function HomePage() {
  const geo = useGeolocation();
  const { gameState, lastEncounter, explorePoi, clearEncounter, reset, isVisited } =
    useGameState();
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);

  const playerPosition = geo.position;

  const pois = useMemo(() => {
    if (!playerPosition) return [];
    return generateNearbyPOIs(playerPosition.lat, playerPosition.lng);
  }, [playerPosition]);

  const gpsLabel = useMemo(() => {
    switch (geo.status) {
      case "active":
        return "GPS live";
      case "demo":
        return DEMO_LOCATION_LABEL;
      case "requesting":
        return "Locating…";
      case "denied":
        return "Location denied";
      default:
        return "GPS unavailable";
    }
  }, [geo.status]);

  const handleExplore = useCallback(() => {
    if (!selectedPoi) return;
    explorePoi(selectedPoi);
  }, [explorePoi, selectedPoi]);

  const handleSimulateVisit = useCallback(() => {
    if (!selectedPoi) return;
    explorePoi(selectedPoi, { simulate: true });
  }, [explorePoi, selectedPoi]);

  if (!gameState) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-600">
        Loading saved game…
      </main>
    );
  }

  if (!playerPosition) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Companion App / Overworld Prototype
        </p>
        <p className="text-lg font-medium text-slate-800">
          Waiting for your location…
        </p>
        <p className="max-w-md text-sm text-slate-600">
          This prototype needs location permission to place you on the overworld
          map with live GPS. Demo Mode loads a fixed Demo Location instead — for
          desktop testing only, not real-world GPS validation.
        </p>
        <button
          type="button"
          onClick={geo.enableDemoMode}
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100"
        >
          Use Demo Mode (fixed location)
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 p-4 md:p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <header className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
            Companion App / Overworld Prototype
          </p>
          <h1 className="text-2xl font-bold text-slate-900">GPSRPG</h1>
          <p className="text-sm text-slate-600">
            Overworld companion prototype — explore nearby fantasy POIs from your
            real-world position, roll encounters, and track loot locally.
          </p>
        </header>

        {geo.isDemo && (
          <div
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            <p className="font-medium">
              Demo Mode — {DEMO_LOCATION_LABEL}, not your real GPS
            </p>
            <p className="mt-1 text-xs text-amber-800">
              {geo.error
                ? `Location unavailable (${geo.error}). Using a fixed demo map position for desktop testing. Reload and allow location on a phone for live GPS.`
                : "Fixed map position for desktop testing. Use nudge controls or Simulate visit. Reload on a phone with location allowed for live GPS."}
            </p>
          </div>
        )}

        {geo.status === "active" && (
          <div
            className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-xs text-slate-600"
            role="note"
          >
            <p>
              <span className="font-medium text-slate-700">Live GPS.</span> POIs
              refresh as you move. At highway speeds (passenger testing only),
              markers may pass quickly — stop or walk to explore safely. Do not
              use the app while driving.
            </p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="h-[min(42vh,360px)] min-h-[240px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:h-[min(50vh,440px)] sm:min-h-[280px] lg:h-[min(60vh,520px)] lg:min-h-[320px]">
            <GameMap
              playerLat={playerPosition.lat}
              playerLng={playerPosition.lng}
              pois={pois}
              selectedPoiId={selectedPoi?.id ?? null}
              visitedPoiIds={gameState.visitedPOIIds}
              onSelectPoi={setSelectedPoi}
            />
          </div>

          <div className="flex flex-col gap-4">
            <CharacterHUD player={gameState.player} gpsLabel={gpsLabel} />
            <POIPanel
              poi={selectedPoi}
              playerPosition={playerPosition}
              visited={selectedPoi ? isVisited(selectedPoi.id) : false}
              onExplore={handleExplore}
              onSimulateVisit={handleSimulateVisit}
            />
            <InventoryPanel inventory={gameState.player.inventory} />
            <DevControls
              isDemo={geo.isDemo}
              gpsStatus={geo.status}
              onEnableDemo={geo.enableDemoMode}
              onNudge={geo.nudgePosition}
              onReset={reset}
            />
          </div>
        </div>
      </div>

      <EncounterModal encounter={lastEncounter} onClose={clearEncounter} />
    </main>
  );
}
