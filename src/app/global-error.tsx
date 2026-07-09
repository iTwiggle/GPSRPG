"use client";

import { useEffect } from "react";

interface GlobalErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({
  error,
  reset,
}: GlobalErrorPageProps) {
  useEffect(() => {
    console.error("GPSRPG global error", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="app-shell min-h-dvh antialiased">
        <main className="app-page--centered flex items-center justify-center bg-slate-950 p-6 text-center text-slate-100">
          <section className="max-w-lg rounded-xl border border-rose-400/30 bg-slate-900/95 p-6 shadow-[0_0_32px_rgba(244,63,94,0.16)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-300">
              Critical scanner fault
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-50">
              GPSRPG could not finish loading.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Try restoring the app. If the problem continues, reload the page;
              local browser storage is not intentionally cleared by this screen.
            </p>
            {error.digest && (
              <p className="mt-3 rounded-lg bg-slate-950/70 px-3 py-2 text-xs text-slate-500">
                Error ref: {error.digest}
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
              >
                Restore app
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Reload page
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
