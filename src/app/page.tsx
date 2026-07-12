"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import BaseCampPanel from "@/components/BaseCampPanel";
import FeedbackProvider from "@/components/feedback/FeedbackProvider";
import ActivityLogPanel from "@/components/ActivityLogPanel";
import CharacterHUD from "@/components/CharacterHUD";
import CodexPanel from "@/components/CodexPanel";
import DevControls from "@/components/DevControls";
import EncounterModal from "@/components/EncounterModal";
import FieldReportPanel from "@/components/FieldReportPanel";
import FieldTasksPanel from "@/components/FieldTasksPanel";
import InventoryPanel from "@/components/InventoryPanel";
import MobilePanelNav, {
  type MobilePanelSection,
} from "@/components/MobilePanelNav";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import POIPanel from "@/components/POIPanel";
import SiteFooter from "@/components/SiteFooter";
import { useGameState } from "@/hooks/useGameState";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useOsmContext } from "@/hooks/useOsmContext";
import { useStickyPois } from "@/hooks/useStickyPois";
import { countReadyDepotDoors } from "@/lib/base-camp";
import { POI_ANCHOR_REGENERATE_METERS } from "@/lib/poi-anchor";
import { formatDistance } from "@/lib/distance";
import { canExplorePoi } from "@/lib/explore-validation";
import {
  FANTASY_GRID_SESSION_KEY,
  STREET_REF_SESSION_KEY,
} from "@/lib/fantasy-grid-surface";
import { getMapPoiTapAction } from "@/lib/map-poi-interaction";
import { DEV_TOOLS_ENABLED } from "@/lib/runtime-flags";
import { DEMO_LOCATION_LABEL, type POI } from "@/lib/types";

const GameMap = dynamic(() => import("@/components/GameMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl bg-slate-900 text-sm text-slate-400">
      Loading overworld map…
    </div>
  ),
});

export default function HomePage() {
  const geo = useGeolocation();
  const { gameState, saveWarning, lastEncounter, explorePoi, refreshFieldTasks, salvageCommonTriplet, claimDepotDoor, markBaseCampVisit, resetFieldReport, clearEncounter, clearSaveWarning, reset, isVisited } =
    useGameState();
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [activeMobileSection, setActiveMobileSection] =
    useState<MobilePanelSection>("poi");
  const [fantasyGridEnabled, setFantasyGridEnabled] = useState(true);
  const [streetReferenceMode, setStreetReferenceMode] = useState(false);

  const playerPosition = geo.position;
  const osmContext = useOsmContext(playerPosition?.lat, playerPosition?.lng);

  const areaContext =
    osmContext.status === "ready" ? osmContext.category : "generic";
  const devToolsEnabled = DEV_TOOLS_ENABLED || geo.isDemo;

  useEffect(() => {
    if (!devToolsEnabled && activeMobileSection === "dev") {
      setActiveMobileSection("poi");
    }
  }, [activeMobileSection, devToolsEnabled]);

  useEffect(() => {
    const gridStored = sessionStorage.getItem(FANTASY_GRID_SESSION_KEY);
    const streetStored = sessionStorage.getItem(STREET_REF_SESSION_KEY);
    if (gridStored !== null) {
      setFantasyGridEnabled(gridStored !== "0");
    }
    if (streetStored !== null) {
      setStreetReferenceMode(streetStored === "1");
    }
  }, []);

  const handleToggleFantasyGrid = useCallback((enabled: boolean) => {
    setFantasyGridEnabled(enabled);
    sessionStorage.setItem(FANTASY_GRID_SESSION_KEY, enabled ? "1" : "0");
    if (!enabled) {
      setStreetReferenceMode(false);
      sessionStorage.setItem(STREET_REF_SESSION_KEY, "0");
    }
  }, []);

  const handleToggleStreetReference = useCallback((enabled: boolean) => {
    setStreetReferenceMode(enabled);
    sessionStorage.setItem(STREET_REF_SESSION_KEY, enabled ? "1" : "0");
  }, []);

  const { pois, metersUntilRefresh } = useStickyPois(
    playerPosition,
    areaContext
  );

  useEffect(() => {
    if (!selectedPoi) return;
    if (!pois.some((poi) => poi.id === selectedPoi.id)) {
      setSelectedPoi(null);
    }
  }, [pois, selectedPoi]);

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
      case "timeout":
        return "GPS timeout";
      default:
        return "GPS unavailable";
    }
  }, [geo.status]);

  const inventoryCount = gameState?.player.inventory.length ?? 0;
  const codexUniqueItems = gameState
    ? Object.keys(gameState.codex.items).length
    : 0;
  const readyDepotDoors =
    gameState != null
      ? countReadyDepotDoors(gameState.codex, gameState.baseCamp)
      : 0;

  const handleMapPoiInteract = useCallback(
    (poi: POI) => {
      if (!gameState || !playerPosition) return;

      const validation = canExplorePoi(
        playerPosition,
        poi,
        gameState.visitedPOIIds
      );
      const action = getMapPoiTapAction(
        selectedPoi?.id ?? null,
        poi.id,
        validation.ok
      );

      if (action === "select") {
        setSelectedPoi(poi);
        return;
      }

      if (action === "explore") {
        explorePoi(poi, playerPosition);
      }
    },
    [explorePoi, gameState, playerPosition, selectedPoi]
  );

  const handleExplore = useCallback(() => {
    if (!selectedPoi || !playerPosition) return;
    explorePoi(selectedPoi, playerPosition);
  }, [explorePoi, playerPosition, selectedPoi]);

  const handleSimulateVisit = useCallback(() => {
    if (!selectedPoi || !playerPosition) return;
    explorePoi(selectedPoi, playerPosition, { simulate: true });
  }, [explorePoi, playerPosition, selectedPoi]);

  if (!gameState) {
    return (
      <main className="app-page--centered flex items-center justify-center bg-slate-950 text-slate-400">
        Loading saved game…
      </main>
    );
  }

  if (!playerPosition) {
    const awaitingConsent = !geo.hasLocationConsent;
    const isRequesting = geo.status === "requesting";

    return (
      <main className="app-page--centered flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-300/80">
          Companion App / Overworld Prototype
        </p>
        <p className="text-lg font-medium text-slate-100">
          {awaitingConsent
            ? "Choose how to explore"
            : isRequesting
              ? "Waiting for your location…"
              : "Location unavailable"}
        </p>
        <p className="max-w-md text-sm text-slate-400">
          {awaitingConsent
            ? "Live GPS places you on the overworld map from your real-world position. Demo Mode uses a fixed demo location for desktop testing — not real-world GPS validation."
            : "This prototype needs location permission to place you on the overworld map with live GPS. Demo Mode loads a fixed Demo Location instead."}
        </p>
        {geo.error && (
          <p className="max-w-md text-xs text-rose-200/80" role="alert">
            Location issue: {geo.error}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          {awaitingConsent ? (
            <button
              type="button"
              onClick={geo.startLiveGps}
              className="rounded-lg border border-sky-400/45 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-100 hover:bg-sky-500/25"
            >
              Use Live GPS
            </button>
          ) : (
            <button
              type="button"
              onClick={geo.retryLiveGps}
              className="rounded-lg border border-sky-400/45 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-100 hover:bg-sky-500/25"
            >
              Retry live GPS
            </button>
          )}
          <button
            type="button"
            onClick={geo.enableDemoMode}
            className="rounded-lg border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/25"
          >
            Use Demo Mode (fixed location)
          </button>
        </div>
        <p className="max-w-md text-xs text-slate-500">
          <Link
            href="/about"
            className="text-violet-300 underline decoration-violet-500/40 underline-offset-2 hover:text-violet-200"
          >
            About, privacy &amp; limitations
          </Link>
        </p>
      </main>
    );
  }

  const mapFrameClass = selectedPoi
    ? "rpg-map-frame rpg-map-frame--focused"
    : "rpg-map-frame";

  return (
    <main className="app-page bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-300/80">
            Companion App / Overworld Prototype
          </p>
          <h1 className="text-2xl font-bold text-slate-50">GPSRPG</h1>
          <p className="text-sm text-slate-400">
            Overworld companion — explore nearby fantasy sites from your
            real-world position, roll encounters, and track loot locally.
          </p>
          {playerPosition && metersUntilRefresh !== null && (
            <p className="text-xs text-slate-500" role="status">
              Sites locked to field anchor · refresh in{" "}
              {formatDistance(metersUntilRefresh)} (or after{" "}
              {POI_ANCHOR_REGENERATE_METERS} m walked)
            </p>
          )}
        </header>

        <PwaInstallPrompt />

        {geo.isDemo && (
          <div
            className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
            role="status"
          >
            <p className="font-medium">
              Demo Mode — {DEMO_LOCATION_LABEL}, not your real GPS
            </p>
            <p className="mt-1 text-xs text-amber-200/80">
              {geo.error
                ? `Location unavailable (${geo.error}). Using a fixed demo map position for desktop testing. You can retry live GPS after changing browser or device location settings.`
                : "Fixed map position for desktop testing. Use nudge controls or Simulate visit. Reload on a phone with location allowed for live GPS."}
            </p>
            <button
              type="button"
              onClick={geo.retryLiveGps}
              className="mt-2 rounded-lg border border-amber-300/45 px-3 py-1.5 text-xs font-medium text-amber-50 hover:bg-amber-400/15"
            >
              Retry live GPS
            </button>
          </div>
        )}

        {geo.status === "active" && (
          <div
            className="rpg-panel px-4 py-2.5 text-xs text-slate-400"
            role="note"
          >
            <p>
              <span className="font-medium text-slate-200">Live GPS.</span> Sites
              refresh as you move. At highway speeds (passenger testing only),
              markers may pass quickly — stop or walk to explore safely. Do not
              use the app while driving.
            </p>
          </div>
        )}

        {saveWarning && (
          <div
            className="rounded-xl border border-rose-400/45 bg-rose-950/55 px-4 py-3 text-sm text-rose-100 shadow-[0_0_22px_rgba(244,63,94,0.14)]"
            role="alert"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold">Save warning</p>
                <p className="mt-1 text-xs leading-relaxed text-rose-100/80">
                  {saveWarning}
                </p>
              </div>
              <button
                type="button"
                onClick={clearSaveWarning}
                className="rounded-lg border border-rose-300/40 px-3 py-1.5 text-xs font-medium text-rose-50 hover:bg-rose-400/15"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div
            className={`relative h-[min(42vh,360px)] min-h-[240px] overflow-hidden sm:h-[min(50vh,440px)] sm:min-h-[280px] lg:h-[min(60vh,520px)] lg:min-h-[320px] ${mapFrameClass}`}
          >
            <div className="rpg-scanner-overlay" aria-hidden="true">
              <span className="rpg-scanner-corner rpg-scanner-corner--tl" />
              <span className="rpg-scanner-corner rpg-scanner-corner--tr" />
              <span className="rpg-scanner-corner rpg-scanner-corner--bl" />
              <span className="rpg-scanner-corner rpg-scanner-corner--br" />
            </div>
            {osmContext.areaFlavorLabel && (
              <div
                className="pointer-events-none absolute left-3 top-3 z-[500]"
                role="status"
                aria-live="polite"
              >
                <div className="rpg-aura-readout">
                  <span className="rpg-aura-readout__label">Scanner readout</span>
                  <span className="rpg-chip rpg-aura-chip">
                    <span className="rpg-chip-dot" aria-hidden="true" />
                    Local Aura · {osmContext.areaFlavorLabel}
                  </span>
                </div>
              </div>
            )}
            <GameMap
              playerLat={playerPosition.lat}
              playerLng={playerPosition.lng}
              pois={pois}
              selectedPoiId={selectedPoi?.id ?? null}
              visitedPoiIds={gameState.visitedPOIIds}
              areaContext={areaContext}
              fantasyGridEnabled={fantasyGridEnabled}
              streetReferenceMode={streetReferenceMode}
              onInteractPoi={handleMapPoiInteract}
            />
          </div>

          <div className="flex flex-col gap-4">
            <CharacterHUD
              player={gameState.player}
              gpsLabel={gpsLabel}
              gpsAccuracyMeters={geo.accuracy}
              showGpsAccuracy={geo.status === "active"}
            />

            <MobilePanelNav
              activeSection={activeMobileSection}
              devToolsEnabled={devToolsEnabled}
              inventoryCount={inventoryCount}
              codexUniqueItems={codexUniqueItems}
              readyDepotDoors={readyDepotDoors}
              onSectionChange={setActiveMobileSection}
            />

            <div className="flex flex-col gap-4 lg:hidden">
              {activeMobileSection === "poi" && (
                <POIPanel
                  poi={selectedPoi}
                  pois={pois}
                  playerPosition={playerPosition}
                  visited={selectedPoi ? isVisited(selectedPoi.id) : false}
                  onExplore={handleExplore}
                  onSelectPoi={setSelectedPoi}
                  onSimulateVisit={
                    devToolsEnabled ? handleSimulateVisit : undefined
                  }
                />
              )}
              {activeMobileSection === "tasks" && (
                <FieldTasksPanel
                  tasks={gameState.fieldTasks}
                  onRefresh={devToolsEnabled ? refreshFieldTasks : undefined}
                />
              )}
              {activeMobileSection === "bag" && (
                <InventoryPanel
                  inventory={gameState.player.inventory}
                  onSalvageCommon={salvageCommonTriplet}
                />
              )}
              {activeMobileSection === "codex" && (
                <CodexPanel codex={gameState.codex} />
              )}
              {activeMobileSection === "camp" && (
                <BaseCampPanel
                  codex={gameState.codex}
                  baseCamp={gameState.baseCamp}
                  fieldReportSites={gameState.fieldReport.sitesExplored}
                  onClaimDoor={claimDepotDoor}
                  onMarkVisit={markBaseCampVisit}
                />
              )}
              {activeMobileSection === "journey" && (
                <>
                  <FieldReportPanel
                    report={gameState.fieldReport}
                    onReset={resetFieldReport}
                  />
                  <ActivityLogPanel events={gameState.activityLog} />
                </>
              )}
              {devToolsEnabled && activeMobileSection === "dev" && (
                <DevControls
                  isDemo={geo.isDemo}
                  gpsStatus={geo.status}
                  fantasyGridEnabled={fantasyGridEnabled}
                  streetReferenceMode={streetReferenceMode}
                  onToggleFantasyGrid={handleToggleFantasyGrid}
                  onToggleStreetReference={handleToggleStreetReference}
                  onEnableDemo={geo.enableDemoMode}
                  onNudge={geo.nudgePosition}
                  onReset={reset}
                  onRefreshTasks={refreshFieldTasks}
                />
              )}
            </div>

            <div className="hidden flex-col gap-4 lg:flex">
              <POIPanel
                poi={selectedPoi}
                pois={pois}
                playerPosition={playerPosition}
                visited={selectedPoi ? isVisited(selectedPoi.id) : false}
                onExplore={handleExplore}
                onSelectPoi={setSelectedPoi}
                onSimulateVisit={
                  devToolsEnabled ? handleSimulateVisit : undefined
                }
              />
              <FieldTasksPanel
                tasks={gameState.fieldTasks}
                onRefresh={devToolsEnabled ? refreshFieldTasks : undefined}
              />
              <InventoryPanel
                inventory={gameState.player.inventory}
                onSalvageCommon={salvageCommonTriplet}
              />
              <CodexPanel codex={gameState.codex} />
              <BaseCampPanel
                codex={gameState.codex}
                baseCamp={gameState.baseCamp}
                fieldReportSites={gameState.fieldReport.sitesExplored}
                onClaimDoor={claimDepotDoor}
                onMarkVisit={markBaseCampVisit}
              />
              <FieldReportPanel
                report={gameState.fieldReport}
                onReset={resetFieldReport}
              />
              <ActivityLogPanel events={gameState.activityLog} />
              {devToolsEnabled && (
                <DevControls
                  isDemo={geo.isDemo}
                  gpsStatus={geo.status}
                  fantasyGridEnabled={fantasyGridEnabled}
                  streetReferenceMode={streetReferenceMode}
                  onToggleFantasyGrid={handleToggleFantasyGrid}
                  onToggleStreetReference={handleToggleStreetReference}
                  onEnableDemo={geo.enableDemoMode}
                  onNudge={geo.nudgePosition}
                  onReset={reset}
                  onRefreshTasks={refreshFieldTasks}
                />
              )}
            </div>
          </div>
        </div>

        <SiteFooter />
      </div>

      <EncounterModal encounter={lastEncounter} onClose={clearEncounter} />
      <FeedbackProvider />
    </main>
  );
}
