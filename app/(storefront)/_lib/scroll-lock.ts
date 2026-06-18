"use client";

import { useEffect } from "react";

// Ref-counted body scroll lock shared across every overlay (side menu, browse
// overlay, QuickView, cart drawer). Manual `body.style.overflow` toggling per
// component breaks when overlays stack: closing the top one would unlock the
// page while a lower one is still open. With a shared counter the page stays
// locked until the LAST open overlay releases it.
let lockCount = 0;

function apply() {
  if (typeof document === "undefined") return;
  document.body.style.overflow = lockCount > 0 ? "hidden" : "";
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lockCount += 1;
    apply();
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      apply();
    };
  }, [active]);
}
