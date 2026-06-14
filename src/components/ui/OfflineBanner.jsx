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
    <div
      className="flex items-center gap-2 px-4 py-2 text-xs font-medium"
      style={{
        background: "var(--color--stryde-fire-light)",
        color: "#633806",
        borderBottom: "1px solid var(--color--stryde-fire)",
      }}
    >
      <i className="ti ti-wifi-off text-base" aria-hidden="true" />
      You're offline. Check-ins are saved and will sync when you're back.
    </div>
  );
}
