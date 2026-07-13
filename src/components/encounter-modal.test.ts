import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EncounterModal from "./EncounterModal";
import {
  getEncounterApproaches,
  type PendingEncounter,
} from "@/lib/encounter";
import type { EncounterResult, POI } from "@/lib/types";

const poi: POI = {
  id: "modal-test-grove",
  name: "Verdant Echoes Grove",
  type: "grove",
  flavor: "Beast tracks circle a ring of pale mushrooms.",
  lat: 41.4993,
  lng: -81.6944,
};

const pendingEncounter: PendingEncounter = {
  poi,
  approaches: getEncounterApproaches(poi),
  simulate: false,
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("EncounterModal choice flow", () => {
  it("labels the dialog, focuses the measured action, and submits one choice", async () => {
    const onChoose = vi.fn();

    await act(async () => {
      root.render(
        createElement(EncounterModal, {
          pendingEncounter,
          encounter: null,
          onChoose,
          onCancel: vi.fn(),
          onClose: vi.fn(),
        })
      );
    });

    const dialog = container.querySelector('[role="dialog"]');
    const approachGroup = container.querySelector('[role="group"]');
    const approachButtons = approachGroup?.querySelectorAll("button");

    expect(dialog?.getAttribute("aria-labelledby")).toBe(
      "encounter-choice-title"
    );
    expect(dialog?.getAttribute("aria-describedby")).toBe(
      "encounter-choice-description"
    );
    expect(approachButtons).toHaveLength(2);
    expect(document.activeElement).toBe(approachButtons?.[0]);
    expect(approachButtons?.[0].getAttribute("aria-label")).toContain(
      "Read the tracks"
    );
    expect(approachButtons?.[1].getAttribute("aria-label")).toContain(
      "Enter the thicket"
    );

    await act(async () => approachButtons?.[1].click());
    expect(onChoose).toHaveBeenCalledTimes(1);
    expect(onChoose).toHaveBeenCalledWith("delve");
  });

  it("backs out without selecting an approach", async () => {
    const onChoose = vi.fn();
    const onCancel = vi.fn();

    await act(async () => {
      root.render(
        createElement(EncounterModal, {
          pendingEncounter,
          encounter: null,
          onChoose,
          onCancel,
          onClose: vi.fn(),
        })
      );
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const backButton = buttons.find(
      (button) => button.textContent?.trim() === "Back to map"
    );

    expect(backButton).toBeDefined();
    await act(async () => backButton?.click());
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onChoose).not.toHaveBeenCalled();
  });

  it("names the chosen approach in the resolved field report", async () => {
    const encounter: EncounterResult = {
      title: "Druid's Hollow",
      description: "A moss-lined hollow hides bundled herbs and trinkets.",
      xpGained: 24,
      loot: [],
      approachId: "survey",
      approachLabel: "Read the tracks",
      approachOutcome: "steady",
    };

    await act(async () => {
      root.render(
        createElement(EncounterModal, {
          pendingEncounter: null,
          encounter,
          onChoose: vi.fn(),
          onCancel: vi.fn(),
          onClose: vi.fn(),
        })
      );
    });

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain("Approach · Read the tracks");
    expect(dialog?.textContent).toContain("A steady result");
    expect(dialog?.textContent).toContain("+24 XP");
  });
});
