import AppShell from "@/components/ui/AppShell";
import "@/app/globals.css";
import { requireOnboardedUser } from "@/lib/auth-server";

export default async function AppLayout({ children }) {
  await requireOnboardedUser();

  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
