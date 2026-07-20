"use client";

import { useEffect } from "react";
import useAppStore from "@/stores/useAppStore";

export default function AnalyticsPageTracker() {
  const markPageVisited = useAppStore((state) => state.markPageVisited);

  useEffect(() => {
    markPageVisited("/analytics");
  }, [markPageVisited]);

  return null;
}
