"use client";

import BottomTabBar from "@/components/ui/BottomTabBar";
import OfflineBanner from "@/components/ui/OfflineBanner";
import GlobalLoadingOverlay from "@/components/ui/Reusable/GlobalLoadingOverlay";
import ResetGlobalLoading from "./Reusable/ResetGlobalLoading";

export default function AppShell({ children }) {
  return (
    <>
      <ResetGlobalLoading />
      <OfflineBanner />
      <GlobalLoadingOverlay />

      <main className="pb-16">
        {children}
      </main>

      <BottomTabBar />
    </>
  );
}