"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface DismissBackdropProps {
  open: boolean;
  onDismiss: () => void;
  className?: string;
  label?: string;
  zIndex?: number;
}

export default function DismissBackdrop({
  open,
  onDismiss,
  className = "rpg-flyout-backdrop",
  label = "Close",
  zIndex = 1500,
}: DismissBackdropProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onDismiss]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <button
      type="button"
      className={className}
      style={{ zIndex }}
      aria-label={label}
      onClick={onDismiss}
    />,
    document.body
  );
}
