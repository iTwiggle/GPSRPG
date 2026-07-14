"use client";

import { useCallback, useMemo, useState } from "react";
import {
  buildExportPayload,
  serializeExportPayload,
} from "@/lib/companion/export-payload";
import { metersToLeagues } from "@/lib/movement/movement-ledger";
import type { GameState } from "@/lib/types";

interface CompanionExportPanelProps {
  gameState: GameState;
  embedded?: boolean;
}

export default function CompanionExportPanel({
  gameState,
  embedded = false,
}: CompanionExportPanelProps) {
  const [copied, setCopied] = useState(false);
  const payload = useMemo(() => buildExportPayload(gameState), [gameState]);
  const exportJson = useMemo(() => serializeExportPayload(payload), [payload]);
  const leaguesToday = metersToLeagues(gameState.movementLedger.todayMeters);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [exportJson]);

  return (
    <section className={embedded ? "rpg-expedition-section" : "rpg-panel p-4"}>
      <div>
        <h2 className="text-sm font-semibold text-slate-100">Pack for the Sanctum</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Export companion progress for your UE5 sanctum import. Inventory, album
          boards, unlock tokens, and trail effort travel together.
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2">
          <dt className="text-slate-500">Finds packed</dt>
          <dd className="mt-0.5 font-semibold text-slate-100">
            {payload.inventory.length}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2">
          <dt className="text-slate-500">Leagues today</dt>
          <dd className="mt-0.5 font-semibold text-slate-100">{leaguesToday}</dd>
        </div>
        <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2">
          <dt className="text-slate-500">Unlock tokens</dt>
          <dd className="mt-0.5 font-semibold text-slate-100">
            {payload.unlockTokens.length}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2">
          <dt className="text-slate-500">Sets complete</dt>
          <dd className="mt-0.5 font-semibold text-slate-100">
            {payload.boards.completedSetIds.length}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 w-full rounded-lg border border-violet-500/40 bg-violet-500/15 px-3 py-2.5 text-sm font-medium text-violet-100 hover:bg-violet-500/25"
      >
        {copied ? "Copied export JSON" : "Copy export for UE5"}
      </button>

      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        Paste this JSON into your Unreal sanctum import during alpha playtests.
      </p>
    </section>
  );
}
