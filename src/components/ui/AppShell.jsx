"use client";

import { useEffect } from "react";
import BottomTabBar from "@/components/ui/BottomTabBar";
import OfflineBanner from "@/components/ui/OfflineBanner";
import GlobalLoadingOverlay from "@/components/ui/Reusable/GlobalLoadingOverlay";
import UndoPopup from "@/components/ui/Reusable/UndoPopup";
import MilestoneToast from "@/components/ui/Reusable/MilestoneToast";
import CheckInCelebrationModal from "@/components/ui/Reusable/CheckInCelebrationModal";
import ResetGlobalLoading from "./Reusable/ResetGlobalLoading";
import useAppStore from "@/stores/useAppStore";
import { syncQueue } from "@/lib/sync";
import { db } from "@/lib/db";
import { validateEnv } from "@/lib/env";

export default function AppShell({ children }) {
  const showLoading = useAppStore((state) => state.showLoading);
  const hideLoading = useAppStore((state) => state.hideLoading);

  // Validate env variables on startup
  useEffect(() => {
    validateEnv();
  }, []);

  useEffect(() => {
    async function checkAndSync() {
      if (navigator.onLine) {
        const pending = await db.queue.toArray();
        if (pending.length > 0) {
          showLoading("Syncing offline changes...");
          const start = Date.now();
          try {
            await syncQueue();
          } catch (err) {
            console.error("Sync failed", err);
          } finally {
            const elapsed = Date.now() - start;
            if (elapsed < 800) {
              await new Promise((r) => setTimeout(r, 800 - elapsed));
            }
            hideLoading();
          }
        }
      }
    }

    checkAndSync();

    window.addEventListener("online", checkAndSync);
    return () => {
      window.removeEventListener("online", checkAndSync);
    };
  }, [showLoading, hideLoading]);

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