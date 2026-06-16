// src/app/layout.jsx
// ─────────────────────────────────────────────
// ROOT LAYOUT — wraps every page
// Includes: font, global styles, bottom nav, offline banner
// ─────────────────────────────────────────────
import "./globals.css";
import AppShell from "@/components/ui/AppShell";

export const metadata = {
  title: "Stryde",
  description: "Build streaks. Not excuses.",
  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Stryde",
  },
};

export const viewport = {
  themeColor: "#0F0E17",
};



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        // bg and text come from globals.css body rule (--color-bento-bg / --color-bento-text)
        className="min-h-screen antialiased"
      >

        {/*AppShell Wraps Children Content*/}
        <AppShell>
          {children}
        </AppShell>


      </body>
    </html>
  );
}
