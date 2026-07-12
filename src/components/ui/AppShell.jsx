"use client";

import BottomTabBar from "@/components/ui/BottomTabBar";
import OfflineBanner from "@/components/ui/OfflineBanner";
import GlobalLoadingOverlay from "@/components/ui/Reusable/GlobalLoadingOverlay";

export default function AppShell({ children }) {
  return (
    <>
      <OfflineBanner />
      <GlobalLoadingOverlay />

      <main className="pb-16">
        {children}
      </main>

      <BottomTabBar />
    </>
  );
}