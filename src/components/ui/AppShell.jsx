"use client";

import { useEffect } from "react";
import BottomTabBar from "@/components/ui/BottomTabBar";
import OfflineBanner from "@/components/ui/OfflineBanner";
import GlobalLoadingOverlay from "@/components/ui/Reusable/GlobalLoadingOverlay";
import UndoPopup from "@/components/ui/Reusable/UndoPopup";
import MilestoneToast from "@/components/ui/Reusable/MilestoneToast";
import CheckInCelebrationModal from "@/components/ui/Reusable/CheckInCelebrationModal";
import ResetGlobalLoading from "./Reusable/ResetGlobalLoading";
import { syncQueue } from "@/lib/sync";
import { validateEnv } from "@/lib/env";

export default function AppShell({ children }) {
  // Validate env variables on startup
  useEffect(() => {
    validateEnv();
  }, []);

  useEffect(() => {
    async function checkAndSync() {
      if (navigator.onLine) {
        try {
          await syncQueue();
        } catch (err) {
          console.error("Sync failed", err);
        }
      }
    }

    checkAndSync();

    window.addEventListener("online", checkAndSync);
    return () => {
      window.removeEventListener("online", checkAndSync);
    };
  }, []);

  return (
    <>
      <ResetGlobalLoading />
      <OfflineBanner />
      <GlobalLoadingOverlay />
      <UndoPopup />
      <MilestoneToast />
      <CheckInCelebrationModal />

      <main className="pb-16">
        {children}
      </main>

      <BottomTabBar />
    </>
  );
}