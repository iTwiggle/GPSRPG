import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="rpg-panel mt-2 px-4 py-3 text-xs text-slate-400">
      <p>
        GPSRPG is a browser prototype — not the main 3D extraction RPG. Game
        progress stays on this device only.
      </p>
      <p className="mt-2">
        <Link
          href="/about"
          className="font-medium text-violet-300 underline decoration-violet-500/40 underline-offset-2 hover:text-violet-200"
        >
          About, privacy &amp; limitations
        </Link>
      </p>
    </footer>
  );
}
