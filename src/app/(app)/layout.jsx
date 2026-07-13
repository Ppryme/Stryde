import AppShell from "@/components/ui/AppShell";
import "@/app/globals.css"

export default function AppLayout({ children }) {
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}