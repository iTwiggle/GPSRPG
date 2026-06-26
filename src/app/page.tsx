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
import type { POI } from "@/lib/types";

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
        return "Demo mode";
      case "requesting":
        return "Locating…";
      case "denied":
        return "GPS denied";
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
        <p className="text-lg font-medium text-slate-800">
          Waiting for your location…
        </p>
        <p className="max-w-md text-sm text-slate-600">
          Allow location access to play, or use demo mode for desktop testing.
        </p>
        <button
          type="button"
          onClick={geo.enableDemoMode}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Start demo mode
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 p-4 md:p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">GPSRPG</h1>
          <p className="text-sm text-slate-600">
            Walk the real world. Discover fantasy POIs. Roll encounters. Keep your loot.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="h-[min(60vh,520px)] min-h-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
