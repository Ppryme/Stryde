// src/hooks/useOnline.js
// ─────────────────────────────────────────────
// USE ONLINE — React hook that tracks network status
// Returns true when online, false when offline
// Listens to browser's online/offline events
// ─────────────────────────────────────────────
"use client";
import { useState, useEffect } from "react";

export function useOnline() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}
