// src/components/ui/OfflineBanner.jsx
// ─────────────────────────────────────────────
// Shows an amber warning bar when the device is offline
// Returns null when online — renders nothing
// ─────────────────────────────────────────────
"use client";
import { useOnline } from "@/hooks/useOnline";

export default function OfflineBanner() {
  
  const isOnline = useOnline();
  if (isOnline) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-stryde-fire-light text-stryde-fire-dark border-b border-stryde-fire">
      <i className="ti ti-wifi-off text-base" aria-hidden="true" />
      You&apos;re offline. Check-ins are saved and will sync when you&apos;re back.
    </div>
  );
}
