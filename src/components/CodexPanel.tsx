"use client";

import { useState } from "react";
import {
  ITEM_CATALOG,
  getCatalogEntriesByAffinity,
  getSetProgressList,
  getUniqueLootCatalogSize,
} from "@/lib/item-catalog";
import { getPoiTypeLabel } from "@/lib/poi-flavor";
import {
  ITEM_TYPE_LABEL,
  RARITY_CHIP,
  RARITY_LABEL,
  RARITY_TEXT,
  itemCatalogKey,
} from "@/lib/item-visual";
import type { Codex, POIType } from "@/lib/types";

type AlbumTab = "catalog" | "sites" | "sets" | "journal";

interface CodexPanelProps {
  codex: Codex;
}

const SITE_AFFINITIES: Array<POIType | "general"> = [
  "general",
  "shrine",
  "camp",
  "tower",
  "gate",
  "grove",
  "cache",
  "quarry",
  "well",
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function sortByLast<T extends { lastAt?: string; lastFoundAt?: string; lastVisitedAt?: string }>(
  entries: T[],
  key: "lastAt" | "lastFoundAt" | "lastVisitedAt"
): T[] {
  return [...entries].sort(
    (a, b) => new Date(b[key]!).getTime() - new Date(a[key]!).getTime()
  );
}

function affinityLabel(affinity: POIType | "general"): string {
  if (affinity === "general") return "General pool";
  return `${getPoiTypeLabel(affinity)} sites`;
}

export default function CodexPanel({ codex }: CodexPanelProps) {
  const [activeTab, setActiveTab] = useState<AlbumTab>("catalog");
  const { stats } = codex;
  const discoveredKeys = new Set(Object.keys(codex.items));
  const items = sortByLast(Object.values(codex.items), "lastFoundAt");
  const pois = sortByLast(Object.values(codex.pois), "lastVisitedAt");
  const encounters = sortByLast(Object.values(codex.encounters), "lastAt");
  const catalogSize = getUniqueLootCatalogSize();
  const uniqueItemsFound = items.length;
  const collectionProgress =
    catalogSize > 0 ? Math.min(1, uniqueItemsFound / catalogSize) : 0;
  const setProgress = getSetProgressList(codex);
  const isEmpty =
    stats.totalExplores === 0 &&
    items.length === 0 &&
    pois.length === 0 &&
    encounters.length === 0;

  return (
    <div className="rpg-panel p-4">
      <h2 className="text-sm font-semibold text-slate-100">Collection Album</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Catalog sets, site loot, and your field journal.
      </p>

      {isEmpty ? (
        <p className="mt-3 text-sm text-slate-500">No discoveries yet.</p>
      ) : (
        <>
          <div className="mt-3 rounded-lg border border-violet-500/20 bg-slate-950/45 p-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Catalog progress</span>
              <span className="text-slate-500">
                {uniqueItemsFound} / {catalogSize} unique
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full border border-slate-700/60 bg-slate-900">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 via-amber-500 to-emerald-400 transition-all"
                style={{ width: `${Math.round(collectionProgress * 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(
              [
                ["catalog", "Catalog"],
                ["sites", "By site"],
                ["sets", "Sets"],
                ["journal", "Journal"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                  activeTab === id
                    ? "bg-violet-600 text-white"
                    : "border border-slate-600/60 bg-slate-800/80 text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "catalog" && (
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
              {ITEM_CATALOG.map((entry) => {
                const key = itemCatalogKey(entry);
                const discovered = discoveredKeys.has(key);
                const codexEntry = codex.items[key];
                return (
                  <li
                    key={key}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      discovered
                        ? RARITY_CHIP[entry.rarity]
                        : "border-slate-700/40 bg-slate-950/40 text-slate-500"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {discovered ? entry.name : "???"}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed opacity-80">
                          {discovered
                            ? entry.description
                            : "Uncharted — explore sites to catalog."}
                        </p>
                        {codexEntry && (
                          <p className="mt-1 text-[11px] opacity-70">
                            {ITEM_TYPE_LABEL[entry.type]}
                            {codexEntry.countFound > 1
                              ? ` · ×${codexEntry.countFound}`
                              : ""}
                            {" · First "}
                            {formatDate(codexEntry.firstFoundAt)}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide">
                        {discovered ? RARITY_LABEL[entry.rarity] : "—"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {activeTab === "sites" && (
            <div className="mt-3 max-h-56 space-y-4 overflow-y-auto">
              {SITE_AFFINITIES.map((affinity) => {
                const entries = getCatalogEntriesByAffinity(affinity);
                const found = entries.filter((entry) =>
                  discoveredKeys.has(itemCatalogKey(entry))
                ).length;
                return (
                  <section key={affinity}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {affinityLabel(affinity)}
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        {found}/{entries.length}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {entries.map((entry) => {
                        const key = itemCatalogKey(entry);
                        const discovered = discoveredKeys.has(key);
                        return (
                          <li
                            key={key}
                            className="flex items-center justify-between rounded-lg border border-slate-700/40 bg-slate-900/40 px-2.5 py-1.5 text-xs"
                          >
                            <span
                              className={
                                discovered ? "text-slate-200" : "text-slate-500"
                              }
                            >
                              {discovered ? entry.name : "???"}
                            </span>
                            <span
                              className={
                                discovered
                                  ? RARITY_TEXT[entry.rarity]
                                  : "text-slate-600"
                              }
                            >
                              {discovered ? RARITY_LABEL[entry.rarity] : "—"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}

          {activeTab === "sets" && (
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
              {setProgress.map(({ set, discovered, total, complete }) => (
                <li
                  key={set.id}
                  className={`rounded-lg border px-3 py-2.5 text-sm ${
                    complete
                      ? "border-amber-500/35 bg-amber-500/10"
                      : "border-slate-700/50 bg-slate-900/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-100">{set.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{set.blurb}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-violet-200">
                      +{set.rewardXp} XP
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          complete
                            ? "bg-amber-400"
                            : "bg-gradient-to-r from-violet-600 to-violet-400"
                        }`}
                        style={{
                          width: `${total > 0 ? Math.round((discovered / total) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {discovered}/{total}
                      {complete ? " ✓" : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {activeTab === "journal" && (
            <div className="mt-3 max-h-56 space-y-4 overflow-y-auto">
              <JournalSection title="Recent finds">
                {items.length === 0 ? (
                  <p className="text-sm text-slate-500">No items logged yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {items.slice(0, 8).map((item) => (
                      <li
                        key={itemCatalogKey(item)}
                        className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-sm"
                      >
                        <p className="font-medium text-slate-200">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(item.lastFoundAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </JournalSection>

              <JournalSection title="POIs visited">
                {pois.length === 0 ? (
                  <p className="text-sm text-slate-500">No POIs logged yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {pois.slice(0, 6).map((poi) => (
                      <li
                        key={poi.poiId}
                        className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-200"
                      >
                        {poi.name}
                      </li>
                    ))}
                  </ul>
                )}
              </JournalSection>

              <JournalSection title="Encounters">
                {encounters.length === 0 ? (
                  <p className="text-sm text-slate-500">No encounters yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {encounters.slice(0, 6).map((entry) => (
                      <li
                        key={entry.title}
                        className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-200"
                      >
                        {entry.title}
                      </li>
                    ))}
                  </ul>
                )}
              </JournalSection>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function JournalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}
