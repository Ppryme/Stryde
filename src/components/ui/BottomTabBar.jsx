"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: "ti-home" },
  { href: "/checkin", label: "Check in", icon: "ti-circle-check" },
  { href: "/goals", label: "Goals", icon: "ti-target" },
  { href: "/analytics", label: "Analytics", icon: "ti-chart-bar" },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  if (pathname.startsWith("/onboarding")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 flex items-stretch z-50 bg-bento-card border-t border-bento-border">
      {TABS.map((tab) => {
        const isActive = tab.href === "/"
          ? pathname === "/"
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isActive ? "text-stryde-primary" : "text-bento-muted"
            }`}
          >
            <div
              className={`absolute top-0 h-0.5 w-8 rounded-full bg-stryde-primary transition-opacity ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            />
            <i className={`ti ${tab.icon} text-xl`} aria-hidden="true" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
