// src/app/layout.jsx
// ─────────────────────────────────────────────
// ROOT LAYOUT — wraps every page
// Includes: font, global styles, bottom nav, offline banner
// ─────────────────────────────────────────────
import "./globals.css";
import BottomTabBar from "@/components/ui/BottomTabBar";
import OfflineBanner from "@/components/ui/OfflineBanner";

export const metadata = {
  title: { default: "Stryde", template: "%s | Stryde" },
  description: "Build streaks. Not excuses.",
  manifest: "/manifest.json",
  themeColor: "#534AB7",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Stryde" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        // bg and text come from globals.css body rule (--color-bento-bg / --color-bento-text)
        className="min-h-screen antialiased"
      >
        {/* Offline warning strip — only renders when navigator.onLine = false */}
        <OfflineBanner />

        {/* Main content — pb-16 gives space above the fixed bottom nav */}
        <main className="pb-16">
          {children}
        </main>

        {/* Fixed bottom navigation — visible on every page */}
        <BottomTabBar />
      </body>
    </html>
  );
}
