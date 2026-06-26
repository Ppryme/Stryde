import "./globals.css";

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
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}