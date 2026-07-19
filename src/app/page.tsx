"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import BaseCampPanel from "@/components/BaseCampPanel";
import FeedbackProvider from "@/components/feedback/FeedbackProvider";
import CharacterHUD from "@/components/CharacterHUD";
import TravelerSynopsisCard from "@/components/TravelerSynopsisCard";
import CodexPanel from "@/components/CodexPanel";
import DevControls from "@/components/DevControls";
import DemoMovementCompass from "@/components/DemoMovementCompass";
import EncounterModal from "@/components/EncounterModal";
import ExpeditionPanel from "@/components/ExpeditionPanel";
import InventoryPanel from "@/components/InventoryPanel";
import OpenLoopBanner from "@/components/OpenLoopBanner";
import MobilePanelNav, {
  type MobilePanelSection,
} from "@/components/MobilePanelNav";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import POIPanel from "@/components/POIPanel";
import { useGameState } from "@/hooks/useGameState";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useExplorationMemory } from "@/hooks/useExplorationMemory";
import { useOsmContext } from "@/hooks/useOsmContext";
import { useStickyPois } from "@/hooks/useStickyPois";
import { countReadyDepotDoors } from "@/lib/base-camp";
import { canExplorePoi } from "@/lib/explore-validation";
import {
  FANTASY_GRID_SESSION_KEY,
  STREET_REF_SESSION_KEY,
} from "@/lib/fantasy-grid-surface";
import { getMapPoiTapAction } from "@/lib/map-poi-interaction";
import { getDiscoverablePois } from "@/lib/poi-discovery";
import { getTopOpenLoopNudge } from "@/lib/open-loops";
import { buildTravelerSynopsis } from "@/lib/companion/traveler-synopsis";
import { metersToLeagues } from "@/lib/movement/movement-ledger";
import { getTrailMomentumStatus, SCOUTS_EYE_REVEAL_MULTIPLIER } from "@/lib/movement/trail-momentum";
import { EXPLORATION_REVEAL_RADIUS_METERS } from "@/lib/exploration-memory";
import { DEV_TOOLS_ENABLED } from "@/lib/runtime-flags";
import { feedback } from "@/lib/feedback/manager";
import {
  canRefreshFieldTasks,
  isExpeditionComplete,
} from "@/lib/tasks";
import { DEMO_LOCATION_LABEL, type POI } from "@/lib/types";

const GameMap = dynamic(() => import("@/components/GameMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl bg-slate-900 text-sm text-slate-400">
      Loading overworld map…
    </div>
  ),
});

const PANEL_TITLES: Record<MobilePanelSection, string> = {
  poi: "Nearby sites",
  expedition: "Expedition",
  bag: "Inventory",
  codex: "Codex",
  camp: "Base camp",
  dev: "Field controls",
};

export default function HomePage() {
  const geo = useGeolocation();
  const { gameState, saveWarning, lastEncounter, explorePoi, refreshFieldTasks, salvageCommonTriplet, claimDepotDoor, markBaseCampVisit, resetFieldReport, clearEncounter, clearSaveWarning, reset, getPoiVisitStatus, samplePlayerMovement } =
    useGameState();
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [activePanel, setActivePanel] =
    useState<MobilePanelSection | null>(null);
  const [synopsisOpen, setSynopsisOpen] = useState(false);
  const [fantasyGridEnabled, setFantasyGridEnabled] = useState(true);
  const [streetReferenceMode, setStreetReferenceMode] = useState(false);
  const [scoutsEyePreview, setScoutsEyePreview] = useState(false);
  const [, setLocalDayTick] = useState(0);

  const playerPosition = geo.position;
  const playerLat = playerPosition?.lat;
  const playerLng = playerPosition?.lng;
  const explorationMemory = useExplorationMemory(playerPosition);
  const osmContext = useOsmContext(playerLat, playerLng);

  const areaContext =
    osmContext.status === "ready" ? osmContext.category : "generic";
  // Demo Mode is itself a testing surface: its movement controls must remain
  // reachable even when production builds hide the normal developer toolbox.
  const devToolsEnabled = DEV_TOOLS_ENABLED || geo.isDemo;

  useEffect(() => {
    if (!devToolsEnabled && activePanel === "dev") {
      setActivePanel(null);
    }
  }, [activePanel, devToolsEnabled]);

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

  const { pois } = useStickyPois(playerPosition, areaContext);
  const fogOfWarEnabled = fantasyGridEnabled && !streetReferenceMode;
  const trailMomentum = gameState ? getTrailMomentumStatus(gameState.movementLedger) : null;
  const scoutsEyeActive = Boolean(trailMomentum?.scoutsEyeActive || (geo.isDemo && scoutsEyePreview));
  const liveRevealRadiusMeters = scoutsEyeActive
    ? EXPLORATION_REVEAL_RADIUS_METERS * SCOUTS_EYE_REVEAL_MULTIPLIER
    : EXPLORATION_REVEAL_RADIUS_METERS;
  const discoverablePois = useMemo(
    () =>
      playerLat !== undefined && playerLng !== undefined
        ? getDiscoverablePois({
            pois,
            playerPosition: { lat: playerLat, lng: playerLng },
            revealedCellKeys: explorationMemory.revealedCellKeys,
            fogOfWarEnabled,
            liveRevealRadiusMeters,
          })
        : [],
    [
      explorationMemory.revealedCellKeys,
      fogOfWarEnabled,
      playerLat,
      playerLng,
      pois,
      liveRevealRadiusMeters,
    ]
  );

  useEffect(() => {
    if (!selectedPoi) return;
    if (!discoverablePois.some((poi) => poi.id === selectedPoi.id)) {
      setSelectedPoi(null);
    }
  }, [discoverablePois, selectedPoi]);

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

  useEffect(() => {
    if (!playerPosition || geo.status !== "active" || geo.accuracy == null) return;
    samplePlayerMovement(playerPosition, geo.accuracy, "live");
  }, [geo.accuracy, geo.status, playerPosition, samplePlayerMovement]);

  useEffect(() => {
    if (!geo.isDemo) setScoutsEyePreview(false);
  }, [geo.isDemo]);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const timer = window.setTimeout(() => setLocalDayTick((value) => value + 1), Math.max(1_000, nextMidnight.getTime() - now.getTime()));
    return () => window.clearTimeout(timer);
  }, [gameState?.movementLedger.todayDate]);

  const openLoopNudge = useMemo(
    () =>
      gameState
        ? getTopOpenLoopNudge({
            codex: gameState.codex,
            baseCamp: gameState.baseCamp,
            pois: discoverablePois,
            playerPosition,
            visitedPois: gameState.visitedPois,
          })
        : null,
    [discoverablePois, gameState, playerPosition]
  );
  const travelerSynopsis = useMemo(
    () => (gameState ? buildTravelerSynopsis(gameState) : null),
    [gameState]
  );

  const inventoryCount = gameState?.player.inventory.length ?? 0;
  const codexUniqueItems = gameState
    ? Object.keys(gameState.codex.items).length
    : 0;
  const leaguesToday = gameState
    ? metersToLeagues(gameState.movementLedger.todayMeters)
    : 0;
  const readyDepotDoors =
    gameState != null
      ? countReadyDepotDoors(gameState.codex, gameState.baseCamp)
      : 0;

  const expeditionComplete = gameState
    ? isExpeditionComplete(gameState.fieldTasks)
    : false;
  const contractRefreshCheck = gameState
    ? canRefreshFieldTasks(gameState, { bypassDailyLimit: devToolsEnabled })
    : { ok: false as const };
  const contractRefreshDisabled =
    expeditionComplete && !contractRefreshCheck.ok;
  const contractRefreshHint =
    contractRefreshCheck.reason === "already_refreshed_today"
      ? "You already rolled new contracts today. Try again tomorrow, or use field controls in demo/dev."
      : undefined;

  const handleRefreshFieldTasks = useCallback(() => {
    refreshFieldTasks({ bypassDailyLimit: devToolsEnabled });
  }, [devToolsEnabled, refreshFieldTasks]);

  const handlePreviewMovementBoons = useCallback(() => {
    const nextActive = !scoutsEyePreview;
    setScoutsEyePreview(nextActive);
    feedback.emitToast({
      title: `Movement boons ${nextActive ? "enabled" : "disabled"}`,
      subtitle: nextActive
        ? "Scout's Eye + Trail Surge are active for Demo testing"
        : "Demo-only boon overrides cleared",
      rarity: nextActive ? "uncommon" : "common",
      glyph: nextActive ? "⚡" : "○",
    });
  }, [scoutsEyePreview]);

  const handleMapPoiInteract = useCallback(
    (poi: POI) => {
      if (!gameState || !playerPosition) return;

      const validation = canExplorePoi(
        playerPosition,
        poi,
        gameState.visitedPois
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
        explorePoi(poi, playerPosition, {
          trailSurgePreview: geo.isDemo && scoutsEyePreview,
        });
      }
    },
    [explorePoi, gameState, geo.isDemo, playerPosition, scoutsEyePreview, selectedPoi]
  );

  const handleExplore = useCallback(() => {
    if (!selectedPoi || !playerPosition) return;
    explorePoi(selectedPoi, playerPosition, {
      trailSurgePreview: geo.isDemo && scoutsEyePreview,
    });
  }, [explorePoi, geo.isDemo, playerPosition, scoutsEyePreview, selectedPoi]);

  const handleSimulateVisit = useCallback(() => {
    if (!selectedPoi || !playerPosition) return;
    explorePoi(selectedPoi, playerPosition, {
      simulate: true,
      trailSurgePreview: geo.isDemo && scoutsEyePreview,
    });
  }, [explorePoi, geo.isDemo, playerPosition, scoutsEyePreview, selectedPoi]);

  const handlePanelChange = useCallback((section: MobilePanelSection) => {
    setSynopsisOpen(false);
    setActivePanel((current) => (current === section ? null : section));
  }, []);

  const closeActivePanel = useCallback(() => {
    setActivePanel(null);
    setSelectedPoi(null);
  }, []);

  const handleSynopsisOpenChange = useCallback((open: boolean) => {
    setSynopsisOpen(open);
    if (open) {
      setActivePanel(null);
      setSelectedPoi(null);
    }
  }, []);

  useEffect(() => {
    if (!activePanel) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeActivePanel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePanel, closeActivePanel]);

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
    <main
      className={`rpg-viewfinder ${geo.isDemo ? "rpg-viewfinder--demo" : ""}`}
    >
      <div className={`rpg-viewfinder__map ${mapFrameClass}`}>
        <div className="rpg-scanner-overlay" aria-hidden="true">
          <span className="rpg-scanner-corner rpg-scanner-corner--tl" />
          <span className="rpg-scanner-corner rpg-scanner-corner--tr" />
          <span className="rpg-scanner-corner rpg-scanner-corner--bl" />
          <span className="rpg-scanner-corner rpg-scanner-corner--br" />
        </div>
        {osmContext.areaFlavorLabel && (
          <div
            className="rpg-viewfinder__aura"
            role="status"
            aria-live="polite"
          >
            <span className="rpg-chip rpg-aura-chip">
              <span className="rpg-chip-dot" aria-hidden="true" />
              {osmContext.areaFlavorLabel}
            </span>
          </div>
        )}
        <GameMap
          playerLat={playerPosition.lat}
          playerLng={playerPosition.lng}
          pois={discoverablePois}
          selectedPoiId={selectedPoi?.id ?? null}
          visitedPois={gameState.visitedPois}
          revealedCellKeys={explorationMemory.revealedCellKeys}
          fantasyGridEnabled={fantasyGridEnabled}
          streetReferenceMode={streetReferenceMode}
          liveRevealRadiusMeters={liveRevealRadiusMeters}
          onInteractPoi={handleMapPoiInteract}
        />
        {geo.isDemo && !activePanel && !synopsisOpen && (
          <DemoMovementCompass
            onNudge={geo.nudgePosition}
            onResetPosition={geo.enableDemoMode}
          />
        )}
      </div>

      <div className="rpg-viewfinder__hud-row">
        <CharacterHUD
          player={gameState.player}
          synopsisOpen={synopsisOpen}
          onSynopsisOpenChange={handleSynopsisOpenChange}
          gpsLabel={gpsLabel}
          gpsAccuracyMeters={geo.accuracy}
          showGpsAccuracy={geo.status === "active"}
          leaguesToday={leaguesToday}
        />
        <OpenLoopBanner nudge={openLoopNudge} />
        <Link
          href="/about"
          className="rpg-viewfinder__about"
          aria-label="About, privacy, and limitations"
        >
          ?
        </Link>
      </div>

      <div className="rpg-viewfinder__notices">
        <PwaInstallPrompt />
        {geo.isDemo && (
          <div className="rpg-viewfinder-notice" role="status">
            <span>
              Demo · {DEMO_LOCATION_LABEL}
              {geo.error ? ` · ${geo.error}` : ""}
            </span>
            <button type="button" onClick={geo.retryLiveGps}>
              Retry GPS
            </button>
          </div>
        )}
        {saveWarning && (
          <div className="rpg-viewfinder-notice rpg-viewfinder-notice--danger" role="alert">
            <span>{saveWarning}</span>
            <button type="button" onClick={clearSaveWarning}>
              Dismiss
            </button>
          </div>
        )}
      </div>

      {geo.status === "active" && (
        <p className="sr-only" role="note">
          Live GPS is active. Walk or stop to explore safely. Do not use the app
          while driving.
        </p>
      )}

      {activePanel && (
        <button
          type="button"
          className="rpg-viewfinder__sheet-backdrop"
          aria-label="Close panel and return to map"
          onClick={closeActivePanel}
        />
      )}

      {synopsisOpen && travelerSynopsis && (
        <TravelerSynopsisCard
          synopsis={travelerSynopsis}
          open={synopsisOpen}
          onClose={() => setSynopsisOpen(false)}
        />
      )}

      {activePanel && (
        <aside
          id="viewfinder-panel"
          className={`rpg-viewfinder__sheet ${
            activePanel === "dev" ? "rpg-viewfinder__sheet--dev" : ""
          }`}
          aria-labelledby="viewfinder-panel-title"
        >
          <header className="rpg-viewfinder__sheet-header">
            <span className="rpg-viewfinder__sheet-handle" aria-hidden="true" />
            <h2 id="viewfinder-panel-title">{PANEL_TITLES[activePanel]}</h2>
            <button
              type="button"
              onClick={closeActivePanel}
              aria-label={`Close ${PANEL_TITLES[activePanel]}`}
            >
              ×
            </button>
          </header>
          <div className="rpg-viewfinder__sheet-scroll">
            {activePanel === "poi" && (
              <POIPanel
                poi={selectedPoi}
                pois={discoverablePois}
                playerPosition={playerPosition}
                visitStatus={
                  selectedPoi
                    ? getPoiVisitStatus(selectedPoi)
                    : "fresh"
                }
                visit={
                  selectedPoi
                    ? gameState.visitedPois[selectedPoi.id]
                    : undefined
                }
                onExplore={handleExplore}
                onSelectPoi={setSelectedPoi}
                onSimulateVisit={
                  devToolsEnabled ? handleSimulateVisit : undefined
                }
              />
            )}
            {activePanel === "expedition" && (
              <ExpeditionPanel
                tasks={gameState.fieldTasks}
                report={gameState.fieldReport}
                events={gameState.activityLog}
                onResetReport={resetFieldReport}
                onRefreshTasks={
                  expeditionComplete ? handleRefreshFieldTasks : undefined
                }
                contractRefreshDisabled={contractRefreshDisabled}
                contractRefreshHint={contractRefreshHint}
                trailMomentum={{
                  ...(trailMomentum ?? getTrailMomentumStatus(gameState.movementLedger)),
                  scoutsEyeActive,
                  trailSurgeActive:
                    Boolean(trailMomentum?.trailSurgeActive) ||
                    (geo.isDemo && scoutsEyePreview),
                  trailSurgeProgressPercent:
                    geo.isDemo && scoutsEyePreview
                      ? 100
                      : (trailMomentum?.trailSurgeProgressPercent ?? 0),
                  liveRevealRadiusMeters,
                  demoPreviewActive: geo.isDemo && scoutsEyePreview,
                }}
              />
            )}
            {activePanel === "bag" && (
              <InventoryPanel
                inventory={gameState.player.inventory}
                onSalvageCommon={salvageCommonTriplet}
              />
            )}
            {activePanel === "codex" && <CodexPanel codex={gameState.codex} />}
            {activePanel === "camp" && (
              <BaseCampPanel
                codex={gameState.codex}
                baseCamp={gameState.baseCamp}
                fieldReportSites={gameState.fieldReport.sitesExplored}
                gameState={gameState}
                onClaimDoor={claimDepotDoor}
                onMarkVisit={markBaseCampVisit}
              />
            )}
            {devToolsEnabled && activePanel === "dev" && (
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
                onRefreshTasks={() =>
                  refreshFieldTasks({ bypassDailyLimit: true })
                }
                onPreviewScoutsEye={
                  geo.isDemo ? handlePreviewMovementBoons : undefined
                }
                movementBoonsPreviewActive={
                  geo.isDemo && scoutsEyePreview
                }
              />
            )}
          </div>
        </aside>
      )}

      <MobilePanelNav
        activeSection={activePanel}
        devToolsEnabled={devToolsEnabled}
        inventoryCount={inventoryCount}
        codexUniqueItems={codexUniqueItems}
        readyDepotDoors={readyDepotDoors}
        onSectionChange={handlePanelChange}
      />

      <EncounterModal encounter={lastEncounter} onClose={clearEncounter} />
      <FeedbackProvider />
    </main>
  );
}
