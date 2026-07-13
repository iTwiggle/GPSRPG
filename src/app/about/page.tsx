import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About & Privacy — GPSRPG",
  description:
    "Prototype scope, location privacy, local save behavior, and OpenStreetMap usage for the GPSRPG overworld companion.",
};

export default function AboutPage() {
  return (
    <main className="app-page bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <header className="space-y-2">
          <Link
            href="/"
            className="inline-flex text-xs font-semibold uppercase tracking-[0.14em] text-violet-300/80 hover:text-violet-200"
          >
            ← Back to overworld
          </Link>
          <h1 className="text-2xl font-bold text-slate-50">
            About, privacy &amp; limitations
          </h1>
          <p className="text-sm text-slate-400">
            Public MVP disclosure for the GPSRPG companion / overworld
            prototype.
          </p>
        </header>

        <section className="rpg-panel space-y-3 p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-base font-semibold text-slate-100">
            What this is
          </h2>
          <p>
            GPSRPG is a browser-based companion app and overworld prototype. It
            is <strong className="text-slate-100">not</strong> the main 3D
            extraction RPG, a production mobile app, or a full standalone game.
          </p>
          <p>
            The core loop: your GPS position → procedural nearby fantasy sites
            → explore when in range → encounter rewards → XP and loot stored
            locally on this device.
          </p>
        </section>

        <section className="rpg-panel space-y-3 p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-base font-semibold text-slate-100">
            Location data
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Live GPS uses the browser Geolocation API only after you choose{" "}
              <strong className="text-slate-100">Use Live GPS</strong>. Your
              coordinates stay on this device for map placement and distance
              checks.
            </li>
            <li>
              We do <strong className="text-slate-100">not</strong> upload a GPS
              trail or store a history of your movements on any server.
            </li>
            <li>
              Browsers require HTTPS (or localhost on the same device) for real
              GPS. Use the deployed HTTPS URL on a phone for field testing.
            </li>
            <li>
              <strong className="text-slate-100">Demo Mode</strong> uses a fixed
              demo location and optional nudge controls — not your real position.
            </li>
          </ul>
        </section>

        <section className="rpg-panel space-y-3 p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-base font-semibold text-slate-100">
            Local save data
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Character progress, inventory, codex, activity log, and field
              report are stored in this browser&apos;s{" "}
              <code className="rounded bg-slate-900 px-1.5 py-0.5 text-xs text-violet-200">
                localStorage
              </code>
              .
            </li>
            <li>
              There is no account, cloud sync, or backend database. Clearing
              site data or switching browsers starts a fresh save.
            </li>
            <li>
              Your location consent choice (
              <code className="rounded bg-slate-900 px-1.5 py-0.5 text-xs text-violet-200">
                gpsrpg-location-consent-v1
              </code>
              ) is also stored locally so returning visits can resume Live GPS or
              Demo Mode without asking every time.
            </li>
          </ul>
        </section>

        <section className="rpg-panel space-y-3 p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-base font-semibold text-slate-100">
            OpenStreetMap context (experimental)
          </h2>
          <p>
            To lightly theme nearby procedural sites, the app may query the
            public{" "}
            <a
              href="https://wiki.openstreetmap.org/wiki/Overpass_API"
              className="text-violet-300 underline decoration-violet-500/40 underline-offset-2 hover:text-violet-200"
              rel="noopener noreferrer"
              target="_blank"
            >
              Overpass API
            </a>{" "}
            with an approximate ~400 m map-cell bounding box when you enter a
            new cell.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Only a coarse area mood (e.g. Grove, Water, Cemetery) is cached
              locally — not raw map features or a location history.
            </li>
            <li>
              POI names and encounters remain procedural fantasy; they are not
              tied to specific real-world landmarks.
            </li>
            <li>
              If Overpass is unavailable, the app falls back to generic flavor
              with no loss of gameplay.
            </li>
          </ul>
        </section>

        <section className="rpg-panel space-y-3 p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-base font-semibold text-slate-100">
            Safety &amp; prototype limits
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-amber-200">Passenger or walking only.</strong>{" "}
              Do not interact with the app while driving.
            </li>
            <li>
              No combat, multiplayer, AR, cloud saves, or real-money rewards.
            </li>
            <li>
              Explore requires being within ~150 m of a site. POIs are stable
              world objects that enter and leave the nearby rolling field
              individually as you move.
            </li>
            <li>
              Installed PWA mode uses a lightweight service worker for
              add-to-home-screen support; it does not sync data off-device.
            </li>
          </ul>
        </section>

        <section className="rpg-panel space-y-3 p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-base font-semibold text-slate-100">Contact</h2>
          <p>
            This is an open prototype hosted on Vercel. For issues or feedback,
            use the project repository on GitHub.
          </p>
        </section>
      </div>
    </main>
  );
}
