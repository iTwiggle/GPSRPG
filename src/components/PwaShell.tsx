"use client";

import { useEffect } from "react";

export default function PwaShell() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Install shell still works via manifest; SW is best-effort for add-to-home-screen.
    });
  }, []);

  return null;
}
