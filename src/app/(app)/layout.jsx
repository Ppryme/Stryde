import AppShell from "@/components/ui/AppShell";

export default function AppLayout({ children }) {
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}