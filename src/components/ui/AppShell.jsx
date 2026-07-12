"use client";

import BottomTabBar from "@/components/ui/BottomTabBar";
import OfflineBanner from "@/components/ui/OfflineBanner";


export default function AppShell({ children }) {
  return (
    <>
      <OfflineBanner />
      

      <main className="pb-16">
        {children}
      </main>

      <BottomTabBar />
    </>
  );
}