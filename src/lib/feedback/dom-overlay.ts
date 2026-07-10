import {
  getRarityFeedback,
  LEVEL_UP,
  PARTICLES,
  TOAST,
  XP_FLOAT,
} from "./config";
import { feedback } from "./manager";
import { prefersReducedMotion } from "./motion";
import { ITEM_TYPE_GLYPH } from "@/lib/item-visual";
import type { FeedbackEvent } from "./types";

/**
 * Imperative DOM renderer for transient feedback effects.
 *
 * Why imperative instead of React state: these effects are fire-and-forget,
 * short-lived, and high-frequency. Driving them through React state proved
 * fragile across Next's server/client component boundaries (render commits not
 * reaching the mounted tree). Direct DOM append/remove is framework-agnostic,
 * has zero reconciliation cost, and reuses the exact same CSS classes, so the
 * visual result is identical and rock-solid. The manager stays the single API;
 * this is just one more sink.
 */

const LAYER_ID = "rpg-feedback-layer-root";

interface OverlayRegions {
  layer: HTMLElement;
  xpStack: HTMLElement;
  pickupAnchor: HTMLElement;
  toastStack: HTMLElement;
}

let regions: OverlayRegions | null = null;

function ensureRegions(): OverlayRegions | null {
  if (typeof document === "undefined") return null;
  if (regions && document.body.contains(regions.layer)) return regions;

  const existing = document.getElementById(LAYER_ID);
  if (existing) existing.remove();

  const layer = document.createElement("div");
  layer.id = LAYER_ID;
  layer.className = "rpg-feedback-layer";
  layer.setAttribute("aria-live", "polite");

  const xpStack = document.createElement("div");
  xpStack.className = "rpg-xp-stack";
  const pickupAnchor = document.createElement("div");
  pickupAnchor.className = "rpg-pickup-anchor";
  const toastStack = document.createElement("div");
  toastStack.className = "rpg-toast-stack";

  layer.append(xpStack, pickupAnchor, toastStack);
  document.body.appendChild(layer);

  regions = { layer, xpStack, pickupAnchor, toastStack };
  return regions;
}

function removeAfter(node: HTMLElement, ms: number): void {
  window.setTimeout(() => node.remove(), ms);
}

function spawnXpFloat(amount: number, source: keyof typeof XP_FLOAT.colorBySource): void {
  const r = ensureRegions();
  if (!r) return;
  const reduced = prefersReducedMotion();
  const color = XP_FLOAT.colorBySource[source];
  const jitterX = (Math.random() - 0.5) * 2 * XP_FLOAT.jitterPx;

  const el = document.createElement("span");
  el.className = reduced ? "rpg-xp-float rpg-xp-float--reduced" : "rpg-xp-float";
  el.textContent = `+${amount} XP`;
  el.style.setProperty("--xp-x", `${jitterX}px`);
  el.style.setProperty("--xp-rise", `${XP_FLOAT.risePx}px`);
  el.style.setProperty("--xp-ms", `${XP_FLOAT.durationMs}ms`);
  el.style.color = color;
  el.style.textShadow = `0 0 12px ${color}`;

  r.xpStack.appendChild(el);
  // Bound the stack.
  while (r.xpStack.childElementCount > XP_FLOAT.max) {
    r.xpStack.firstElementChild?.remove();
  }
  removeAfter(el, XP_FLOAT.durationMs + 80);
}

function spawnParticles(
  rarity: Parameters<typeof getRarityFeedback>[0],
  showstopper: boolean
): void {
  const r = ensureRegions();
  if (!r) return;
  const feel = getRarityFeedback(rarity);
  const reduced = prefersReducedMotion();

  if (reduced) {
    const flash = document.createElement("span");
    flash.className = "rpg-pickup-flash";
    flash.style.background = feel.accent;
    r.pickupAnchor.appendChild(flash);
    removeAfter(flash, 480);
    return;
  }

  const burst = document.createElement("div");
  burst.className = "rpg-particle-burst";
  const total = Math.min(feel.particles, PARTICLES.hardCap);
  for (let i = 0; i < total; i += 1) {
    const angle = (i / total) * Math.PI * 2 + Math.random() * 0.6;
    const travel =
      PARTICLES.minTravelPx +
      Math.random() * (PARTICLES.maxTravelPx - PARTICLES.minTravelPx);
    const size = 4 + Math.random() * 5;
    const p = document.createElement("span");
    p.className = "rpg-particle";
    p.style.setProperty("--px", `${Math.cos(angle) * travel}px`);
    p.style.setProperty("--py", `${Math.sin(angle) * travel}px`);
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.background = feel.particleColor;
    p.style.animationDelay = `${Math.random() * 60}ms`;
    p.style.animationDuration = `${PARTICLES.durationMs}ms`;
    burst.appendChild(p);
  }
  r.pickupAnchor.appendChild(burst);
  removeAfter(burst, PARTICLES.durationMs + 260);

  if (showstopper) {
    const sheen = document.createElement("div");
    sheen.className = "rpg-screen-sheen";
    r.layer.appendChild(sheen);
    removeAfter(sheen, 900);
  }
}

function spawnToast(event: Extract<FeedbackEvent, { kind: "toast" }>): void {
  const r = ensureRegions();
  if (!r) return;
  const feel = getRarityFeedback(event.rarity);
  const reduced = prefersReducedMotion();
  const hold = feel.showstopper ? TOAST.showstopperHoldMs : TOAST.holdMs;

  const toast = document.createElement("div");
  toast.className = `rpg-toast ${reduced ? "rpg-toast--reduced" : "rpg-toast--enter"}${feel.showstopper ? " rpg-toast--showstopper" : ""}`;
  toast.setAttribute("role", "status");
  toast.style.setProperty("--toast-accent", feel.accent);
  toast.style.setProperty("--toast-enter-ms", `${TOAST.enterMs}ms`);
  toast.style.setProperty("--toast-exit-ms", `${TOAST.exitMs}ms`);

  const glyph = document.createElement("span");
  glyph.className = "rpg-toast__glyph";
  glyph.setAttribute("aria-hidden", "true");
  glyph.textContent = event.itemType
    ? ITEM_TYPE_GLYPH[event.itemType]
    : event.glyph ?? "✦";

  const body = document.createElement("div");
  body.className = "min-w-0";
  const title = document.createElement("p");
  title.className = "truncate text-sm font-semibold text-slate-50";
  title.textContent = event.title;
  const sub = document.createElement("p");
  sub.className = "truncate text-[11px] uppercase tracking-wide text-slate-300/80";
  sub.textContent = event.subtitle ?? event.rarity;
  body.append(title, sub);

  toast.append(glyph, body);

  // Keep the stack bounded.
  while (r.toastStack.childElementCount >= TOAST.max) {
    r.toastStack.firstElementChild?.remove();
  }
  r.toastStack.appendChild(toast);

  window.setTimeout(() => {
    if (!reduced) {
      toast.classList.remove("rpg-toast--enter");
      toast.classList.add("rpg-toast--exit");
    }
    removeAfter(toast, TOAST.exitMs + 40);
  }, TOAST.enterMs + hold);
}

function spawnLevelUp(level: number): void {
  const r = ensureRegions();
  if (!r) return;
  const reduced = prefersReducedMotion();

  const wrap = document.createElement("div");
  wrap.className = reduced ? "rpg-levelup rpg-levelup--reduced" : "rpg-levelup";
  wrap.setAttribute("role", "status");

  const card = document.createElement("div");
  card.className = "rpg-levelup__card";

  if (!reduced) {
    const particles = document.createElement("div");
    particles.className = "rpg-levelup__particles";
    const burst = document.createElement("div");
    burst.className = "rpg-particle-burst";
    for (let i = 0; i < 26; i += 1) {
      const angle = (i / 26) * Math.PI * 2 + Math.random() * 0.6;
      const travel =
        PARTICLES.minTravelPx +
        Math.random() * (PARTICLES.maxTravelPx - PARTICLES.minTravelPx);
      const p = document.createElement("span");
      p.className = "rpg-particle";
      p.style.setProperty("--px", `${Math.cos(angle) * travel}px`);
      p.style.setProperty("--py", `${Math.sin(angle) * travel}px`);
      p.style.width = "7px";
      p.style.height = "7px";
      p.style.background = "rgba(251, 191, 36, 0.98)";
      p.style.animationDuration = `${PARTICLES.durationMs}ms`;
      burst.appendChild(p);
    }
    particles.appendChild(burst);
    card.appendChild(particles);
  }

  const eyebrow = document.createElement("p");
  eyebrow.className = "rpg-levelup__eyebrow";
  eyebrow.textContent = "Level Up";
  const lvl = document.createElement("p");
  lvl.className = "rpg-levelup__level";
  lvl.textContent = `Level ${level}`;
  card.append(eyebrow, lvl);
  wrap.appendChild(card);

  r.layer.appendChild(wrap);
  removeAfter(wrap, (reduced ? 1400 : LEVEL_UP.totalMs) + 80);
}

function handle(event: FeedbackEvent): void {
  switch (event.kind) {
    case "xp":
      spawnXpFloat(event.amount, event.source);
      break;
    case "pickup":
      spawnParticles(event.rarity, getRarityFeedback(event.rarity).showstopper);
      break;
    case "toast":
      spawnToast(event);
      break;
    case "levelUp":
      spawnLevelUp(event.level);
      break;
  }
}

let installed = false;

/** Register the DOM overlay as a manager sink. Idempotent; returns uninstall. */
export function installDomOverlay(): () => void {
  if (typeof window === "undefined" || installed) return () => {};
  installed = true;
  ensureRegions();
  const unsubscribe = feedback.subscribe(handle);
  return () => {
    unsubscribe();
    installed = false;
    regions?.layer.remove();
    regions = null;
  };
}
