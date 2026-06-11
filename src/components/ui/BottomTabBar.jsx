// src/components/ui/BottomTabBar.jsx
// ─────────────────────────────────────────────
// BOTTOM TAB BAR — fixed navigation at bottom of screen
// 4 tabs: Home, Check-in, Goals, Analytics
// Active tab highlighted with primary color
// ─────────────────────────────────────────────
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/",          label: "Home",      icon: "ti-home" },
  { href: "/checkin",   label: "Check in",  icon: "ti-circle-check" },
  { href: "/goals",     label: "Goals",     icon: "ti-target" },
  { href: "/analytics", label: "Analytics", icon: "ti-chart-bar" },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  // Don't show the tab bar on onboarding
  if (pathname.startsWith("/onboarding")) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-stretch z-50"
      style={{
        height: 56,
        background: "var(--color-bento-card)",
        borderTop: "1px solid var(--color-bento-border)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.href === "/"
          ? pathname === "/"
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
            style={{ color: isActive ? "var(--color--stryde-primary)" : "var(--color-bento-muted)" }}
          >
            {/* Active indicator line at top */}
            <div
              className="absolute top-0 h-0.5 w-8 rounded-full transition-opacity"
              style={{
                background: "var(--color--stryde-primary)",
                opacity: isActive ? 1 : 0,
              }}
            />
            <i className={`ti ${tab.icon} text-xl`} aria-hidden="true" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
