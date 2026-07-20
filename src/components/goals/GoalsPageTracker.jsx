"use client";

import { useEffect } from "react";
import useAppStore from "@/stores/useAppStore";

export default function GoalsPageTracker() {
  const markPageVisited = useAppStore((state) => state.markPageVisited);

  useEffect(() => {
    markPageVisited("/goals");
  }, [markPageVisited]);

  return null;
}
