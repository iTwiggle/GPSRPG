"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("GPSRPG route error", error);
  }, [error]);

  return (
    <main className="app-page--centered flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 text-center text-slate-100">
      <section className="rpg-panel max-w-lg border-rose-400/30 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-300">
          Scanner malfunction
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-50">
          The overworld feed glitched.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Your save stays local in this browser. Try restoring the scanner; if
          the issue repeats, reload the page and keep Demo Mode available as a
          fallback.
        </p>
        {error.digest && (
          <p className="mt-3 rounded-lg bg-slate-950/70 px-3 py-2 text-xs text-slate-500">
            Error ref: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-5 w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_0_16px_rgba(124,58,237,0.3)] hover:bg-violet-500"
        >
          Restore scanner
        </button>
      </section>
    </main>
  );
}
