"use client";

import { usePathname } from "next/navigation";
import BottomTabBar from "@/components/ui/BottomTabBar";
import OfflineBanner from "@/components/ui/OfflineBanner";

const HIDE_BOTTOM_BAR_ROUTES = ["/onboarding", "/sign-in", "/sign-up"];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const showBottomBar = !HIDE_BOTTOM_BAR_ROUTES.includes(pathname);

  return (
    <>
      <OfflineBanner />
      <main className={showBottomBar ? "pb-16" : ""}>{children}</main>
      {showBottomBar && <BottomTabBar />}
    </>
  );
}
